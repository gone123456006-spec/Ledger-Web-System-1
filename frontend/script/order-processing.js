/**
 * Ready Orders — eligibility for one `orders[]` record (keyed by `order.id`;
 * `orderNo` / bill no. is the display field on that same record).
 *
 * Rule 1 — Blocking
 * If ANY item on the order is still:
 *   • in Pending Items (not assigned to a job worker), OR
 *   • in Item Process (In Process — any non–ready-complete row with qty > 0)
 * → the order MUST NOT move to Ready Orders.
 *
 * Rule 2 — Partial completion (example: order SGJ/0/0001 with Ring, Chain, Earring)
 * If Ring is marked Ready (e.g. appears in Ready Items) but Chain is still Pending or
 * Earring is still In Process → the order MUST NOT move to Ready Orders. Partial line
 * completion does not promote the order.
 *
 * Rule 3 — Workshop completion (100% every item, workshop / Ready Items queue)
 * All quantity-bearing lines have their full ordered qty in READY or READY_ORDER
 * (workshop “ready” or already finalized). No pending lines; no In Process / ASSIGNED qty.
 * Used by Ready Items “Move to Ready Orders” gating and Pending Orders checks.
 *
 * Rule 4 — Ready Orders list (`order.status === 'READY'`)
 * The Ready Orders screen and `syncOrdersReadyFromProcess` promote an order ONLY when:
 *   • Rules 1–2 pass (nothing pending, nothing still In Process / ASSIGNED with qty > 0), AND
 *   • every quantity-bearing line’s full ordered qty is in **READY_ORDER** only
 *     (finalized via Ready Items → “Move to Ready Orders”).
 * Workshop-only READY (Item Process / Skip Assign) is NOT enough — avoids orders
 * appearing in Ready Orders right after assign or as soon as lines hit Ready Items.
 *
 * Used by Item Processing / Ready Items sync, new-order save, and Pending Orders “Mark Ready”.
 */
(function (global) {
    /** Same line-type rules as Pending Items (item.type + optional type token in values[0]). */
    function isOrderLineItem(item) {
        if (!item || !item.values || !Array.isArray(item.values)) return false;
        var v = item.values;
        var t = item.type && String(item.type).trim();
        if (!t) {
            var raw0 = String(v[0] || '').trim();
            if (['Order', 'Purchase', 'Ready', 'Extra', 'Other', 'Sale'].indexOf(raw0) !== -1) t = raw0;
            else t = 'Order';
        }
        return ['Order', 'Other', 'Sale'].indexOf(t) !== -1;
    }

    function orderLineQty(order, itemIdx) {
        var item = order.items && order.items[itemIdx];
        if (!isOrderLineItem(item)) return 0;
        var v = item.values || [];
        if (v.length >= 16) {
            return Math.max(0, parseFloat(v[4]) || 0);
        }
        var raw0 = String(v[0] || '').trim();
        var isKnownTypeToken = ['Order', 'Purchase', 'Ready', 'Extra', 'Other', 'Sale'].indexOf(raw0) !== -1;
        var o = (isKnownTypeToken || raw0 === '') ? 0 : -1;
        var get = function (i) { return v[i + o] !== undefined ? v[i + o] : ''; };
        return Math.max(0, parseFloat(get(7)) || 0);
    }

    /**
     * Direct Bill / Ready Extra: non–All-Bill save uses status READY as staging (Ready Orders queue).
     * Pending Orders / Pending Items still treat these like open workshop orders until All Bill or promotion.
     */
    function orderIsDirectBillStagingQueue(order) {
        if (!order) return false;
        var src = String(order.orderSource || '').toLowerCase();
        if (src === 'ready-extra') return true;
        var items = order.items || order.rows || [];
        for (var i = 0; i < items.length; i++) {
            var v = items[i] && items[i].values;
            if (Array.isArray(v) && v.length >= 16) return true;
        }
        return false;
    }

    /** Gold Invoice lives under All Bill / DIRECT BILL — not workshop Pending Orders / Pending Items. */
    function orderIsGoldInvoiceWorkshopExclude(order) {
        if (!order) return false;
        if (String(order.orderSource || '').toLowerCase() === 'gold-invoice') return true;
        var on = String(order.orderNo != null ? order.orderNo : order.billNo != null ? order.billNo : '').trim();
        return /^SGJ\/GI\//i.test(on);
    }

    /** Pending Orders: PENDING new orders plus READY direct-bill staging (not workshop-only READY). */
    function orderShowsOnPendingOrdersPage(order) {
        if (!order) return false;
        if (orderIsGoldInvoiceWorkshopExclude(order)) return false;
        var s = String(order.status == null ? '' : order.status).trim().toUpperCase();
        if (s === 'PENDING') return true;
        if (s === 'READY' && orderIsDirectBillStagingQueue(order)) return true;
        return false;
    }

    /** Pending Items: non-READY orders, plus READY direct-bill staging (same lines as 17-col mapping). */
    function orderShowsOnPendingItemsPage(order) {
        if (!order || order.id == null) return false;
        if (orderIsGoldInvoiceWorkshopExclude(order)) return false;
        var s = String(order.status == null ? '' : order.status).trim().toUpperCase();
        if (s !== 'READY') return true;
        return orderIsDirectBillStagingQueue(order);
    }

    function orderLineHasItemProcessRows(itemProcess, orderId, itemIdx) {
        var oid = String(orderId);
        var ix = parseInt(itemIdx, 10);
        if (isNaN(ix)) return false;
        return (itemProcess || []).some(function (e) {
            return e && String(e.orderId) === oid && parseInt(e.itemIdx, 10) === ix;
        });
    }

    /** Assigned to workshop if order line says so OR any itemProcess row exists for that line. */
    function orderLineIsWorkshopAssigned(order, itemIdx, itemProcess, orderId) {
        var item = order.items && order.items[itemIdx];
        if (!item) return false;
        if (item.processAssigned === true || item.processAssigned === 'true' || item.processAssigned === 1) return true;
        return orderLineHasItemProcessRows(itemProcess, orderId, itemIdx);
    }

    function sumQtyForLineWithStatuses(itemProcess, orderId, itemIdx, statusList) {
        const oid = String(orderId);
        const ix = parseInt(itemIdx, 10);
        const allowed = new Set((statusList || []).map(function (s) { return String(s).toUpperCase(); }));
        return (itemProcess || []).reduce(function (sum, e) {
            if (!e || String(e.orderId) !== oid || parseInt(e.itemIdx, 10) !== ix) return sum;
            var st = String(e.status || '').toUpperCase();
            if (!allowed.has(st)) return sum;
            return sum + (parseFloat(e.qty) || 0);
        }, 0);
    }

    /** Quantities that count as “ready / done” for 100% completion (Rule 3). */
    function readyStatusesUpper() {
        return ['READY', 'READY_ORDER'];
    }

    /** In Process / assigned — not yet fully moved to ready/finalized. */
    function isTerminalProcessStatus(status) {
        var u = String(status || '').toUpperCase();
        return u === 'READY' || u === 'READY_ORDER';
    }

    /**
     * Rule 1 (Item Process branch): any row for this order that is still In Process
     * with quantity > 0 blocks Ready Orders.
     */
    function orderHasNonTerminalProcessRows(itemProcess, orderId) {
        var oid = String(orderId);
        return (itemProcess || []).some(function (e) {
            if (!e || String(e.orderId) !== oid) return false;
            if (isTerminalProcessStatus(e.status)) return false;
            var q = parseFloat(e.qty) || 0;
            return q > 0;
        });
    }

    /**
     * Rule 1 (Pending Items branch): any quantity-bearing Order line not yet assigned
     * still counts as “in Pending Items” and blocks Ready Orders.
     * Uses itemProcess as well as order.items.processAssigned so rules match the Pending Items UI.
     */
    function orderHasUnassignedPendingLines(order, itemProcess, orderId) {
        if (!order || !order.items) return false;
        var oid = orderId != null && String(orderId) !== '' ? String(orderId) : String(order.id);
        for (var idx = 0; idx < order.items.length; idx++) {
            if (!isOrderLineItem(order.items[idx])) continue;
            var need = orderLineQty(order, idx);
            if (need <= 0) continue;
            if (!orderLineIsWorkshopAssigned(order, idx, itemProcess, oid)) return true;
        }
        return false;
    }

    /**
     * Rule 3 only: every quantity-bearing Order line has 100% of ordered qty in READY + READY_ORDER.
     * Caller must already ensure Rule 1 (no pending, no in process).
     */
    function orderEveryLineReadyAtFullQuantity(order, itemProcess, orderId) {
        if (!order || !order.items) return false;
        var sawLine = false;
        for (var idx = 0; idx < order.items.length; idx++) {
            if (!isOrderLineItem(order.items[idx])) continue;
            var need = orderLineQty(order, idx);
            if (need <= 0) continue;
            sawLine = true;
            var have = sumQtyForLineWithStatuses(itemProcess, orderId, idx, readyStatusesUpper());
            if (have + 1e-6 < need) return false;
        }
        return sawLine;
    }

    /**
     * Rule 4: any itemProcess row for this order with qty > 0 that is not READY_ORDER
     * blocks listing the order under Ready Orders (e.g. ASSIGNED after assign, or READY before “Move to Ready Orders”).
     */
    function orderHasQtyInNonFinalizedStatus(itemProcess, orderId) {
        var oid = String(orderId);
        return (itemProcess || []).some(function (e) {
            if (!e || String(e.orderId) !== oid) return false;
            var q = parseFloat(e.qty) || 0;
            if (q <= 0) return false;
            var st = String(e.status || '').toUpperCase();
            return st !== 'READY_ORDER';
        });
    }

    /** Rule 4: every quantity-bearing line has full ordered qty in READY_ORDER only. */
    function orderEveryLineFinalizedAtFullQuantity(order, itemProcess, orderId) {
        if (!order || !order.items) return false;
        var sawLine = false;
        for (var idx = 0; idx < order.items.length; idx++) {
            if (!isOrderLineItem(order.items[idx])) continue;
            var need = orderLineQty(order, idx);
            if (need <= 0) continue;
            sawLine = true;
            var have = sumQtyForLineWithStatuses(itemProcess, orderId, idx, ['READY_ORDER']);
            if (have + 1e-6 < need) return false;
        }
        return sawLine;
    }

    /**
     * True iff Rules 1 + 4 pass: order may appear in Ready Orders / get `status === 'READY'` from sync.
     * Stricter than isOrderFullyReady (workshop READY alone does not qualify).
     */
    function isOrderReadyForReadyOrdersList(orders, itemProcess, orderId) {
        var order = orders.filter(function (o) { return o && String(o.id) === String(orderId); })[0];
        if (!order || !order.items) return false;
        if (orderHasUnassignedPendingLines(order, itemProcess, orderId)) return false;
        if (orderHasQtyInNonFinalizedStatus(itemProcess, orderId)) return false;
        return orderEveryLineFinalizedAtFullQuantity(order, itemProcess, orderId);
    }

    /** Normalize due date to yyyy-mm-dd for calendar-day comparison (dd-mm-yyyy, ISO, or Date-parsable). */
    function normalizeDueDateYMD(raw) {
        var s = String(raw == null ? '' : raw).trim();
        if (!s) return '';
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
        var m = s.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
        if (m) return m[3] + '-' + m[2] + '-' + m[1];
        var d = new Date(s);
        if (!isNaN(d.getTime())) {
            var y = d.getFullYear();
            var mo = d.getMonth() + 1;
            var da = d.getDate();
            return y + '-' + (mo < 10 ? '0' : '') + mo + '-' + (da < 10 ? '0' : '') + da;
        }
        return '';
    }

    /**
     * True when the local calendar day is strictly after the due date and the order
     * still does not qualify for the Ready Orders list (not finalized READY_ORDER policy).
     */
    function orderIsPastDueAndNotReadyForReadyOrders(order, orders, itemProcess) {
        if (!order || order.id == null) return false;
        if (orderIsGoldInvoiceWorkshopExclude(order)) return false;
        var ymd = normalizeDueDateYMD(order.dueDate != null ? order.dueDate : order.due_date);
        if (!ymd) return false;
        var p = ymd.split('-');
        if (p.length !== 3) return false;
        var dueStart = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10), 0, 0, 0, 0);
        if (isNaN(dueStart.getTime())) return false;
        var now = new Date();
        var todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        if (todayStart.getTime() <= dueStart.getTime()) return false;
        try {
            if (isOrderReadyForReadyOrdersList(orders || [], itemProcess || [], order.id)) return false;
        } catch (e) {
            return false;
        }
        return true;
    }

    /** Sum qty on itemProcess rows for this line where status is not READY / READY_ORDER. */
    function sumQtyForLineNonTerminal(itemProcess, orderId, itemIdx) {
        var oid = String(orderId);
        var ix = parseInt(itemIdx, 10);
        return (itemProcess || []).reduce(function (sum, e) {
            if (!e || String(e.orderId) !== oid || parseInt(e.itemIdx, 10) !== ix) return sum;
            if (isTerminalProcessStatus(e.status)) return sum;
            return sum + (parseFloat(e.qty) || 0);
        }, 0);
    }

    /**
     * Display name for an Order line (same grid rules as new-order vs ready-extra 17-value rows).
     */
    function orderLineItemDisplayName(order, itemIdx) {
        var item = order.items && order.items[itemIdx];
        if (!item || !item.values) return 'Item';
        var v = item.values;
        if (v.length >= 16) {
            return String(v[2] || '').trim() || 'Item';
        }
        var raw0 = String(v[0] || '').trim();
        var isKnownTypeToken = ['Order', 'Purchase', 'Ready', 'Extra', 'Other', 'Sale'].indexOf(raw0) !== -1;
        var o = (isKnownTypeToken || raw0 === '') ? 0 : -1;
        var get = function (i) { return v[i + o] !== undefined ? v[i + o] : ''; };
        return String(get(2) || '').trim() || 'Item';
    }

    /**
     * Buckets for UI when an order cannot move to Ready Orders:
     * pending (unassigned lines), in-process (non-terminal qty or assigned with no rows yet),
     * ready (terminal-only qty on line, for partial / completed-at-workshop context).
     */
    function getOrderMoveReadyBreakdown(order, itemProcess, orderId) {
        var pending = [];
        var inProcess = [];
        var ready = [];
        if (!order || !order.items) return { pending: pending, inProcess: inProcess, ready: ready };
        var oid = String(orderId);
        for (var idx = 0; idx < order.items.length; idx++) {
            if (!isOrderLineItem(order.items[idx])) continue;
            var need = orderLineQty(order, idx);
            if (need <= 0) continue;
            var name = orderLineItemDisplayName(order, idx);
            var assigned = orderLineIsWorkshopAssigned(order, idx, itemProcess, oid);
            var nonTerm = sumQtyForLineNonTerminal(itemProcess, oid, idx);
            var readySum = sumQtyForLineWithStatuses(itemProcess, oid, idx, readyStatusesUpper());
            var fullyReady = assigned && nonTerm <= 1e-9 && readySum + 1e-9 >= need;
            if (!assigned) {
                pending.push({ itemIdx: idx, name: name, qty: need });
            } else if (nonTerm > 1e-9) {
                inProcess.push({ itemIdx: idx, name: name, qty: nonTerm });
            } else if (fullyReady) {
                ready.push({ itemIdx: idx, name: name, qty: readySum });
            } else if (readySum > 0) {
                inProcess.push({ itemIdx: idx, name: name, qty: Math.max(0, need - readySum) });
            } else {
                inProcess.push({ itemIdx: idx, name: name, qty: need });
            }
        }
        return { pending: pending, inProcess: inProcess, ready: ready };
    }

    /**
     * True iff Rules 1–3 pass: the only case the order may appear in Ready Orders.
     * Equivalent to: every item ready at 100% and no blocking pending / in process rows.
     */
    function isOrderFullyReady(orders, itemProcess, orderId) {
        var order = orders.filter(function (o) { return o && String(o.id) === String(orderId); })[0];
        if (!order || !order.items) return false;
        if (orderHasUnassignedPendingLines(order, itemProcess, orderId)) return false;
        if (orderHasNonTerminalProcessRows(itemProcess, orderId)) return false;
        return orderEveryLineReadyAtFullQuantity(order, itemProcess, orderId);
    }

    function orderHasProcessEntries(itemProcess, orderId) {
        var oid = String(orderId);
        return (itemProcess || []).some(function (e) { return e && String(e.orderId) === oid; });
    }

    /**
     * True when any itemProcess row for this order has qty > 0 in workshop READY status
     * (lines visible on the Ready Items screen, before READY_ORDER finalization).
     */
    function orderHasQtyInReadyItems(itemProcess, orderId) {
        var oid = String(orderId);
        return (itemProcess || []).some(function (e) {
            if (!e || String(e.orderId) !== oid) return false;
            if (String(e.status || '').toUpperCase() !== 'READY') return false;
            return (parseFloat(e.qty) || 0) > 0;
        });
    }

    /**
     * Sets order.status to READY only when isOrderReadyForReadyOrdersList (Rules 1 + 4: finalized in Ready Items).
     * Demotes READY orders when that is no longer true.
     */
    function syncOrdersReadyFromProcess(orders, itemProcess) {
        if (!orders || !Array.isArray(orders)) return;
        orders.forEach(function (order) {
            if (!order || order.id == null) return;
            var oid = String(order.id);
            if (isOrderReadyForReadyOrdersList(orders, itemProcess, oid)) {
                order.status = 'READY';
                order.readyDate = order.readyDate || new Date().toISOString();
            } else if (order.status === 'READY') {
                order.status = orderHasProcessEntries(itemProcess, oid) ? 'ASSIGNED' : 'PENDING';
                delete order.readyDate;
            }
        });
    }

    /**
     * Drops workshop rows whose itemIdx is no longer a valid index on this order
     * (e.g. after lines were removed in New Order edit). Prevents the next line from
     * inheriting another line's process row via stale indices.
     */
    function pruneItemProcessForOrder(order, itemProcess) {
        if (!order || order.id == null) return itemProcess;
        var oid = String(order.id);
        var n = (order.items && order.items.length) || 0;
        return (itemProcess || []).filter(function (e) {
            if (!e || String(e.orderId) !== oid) return true;
            var ix = parseInt(e.itemIdx, 10);
            if (isNaN(ix)) return true;
            return ix >= 0 && ix < n;
        });
    }

    /**
     * Single source of truth: each order line's assignment flags match actual itemProcess
     * rows for (order.id, line index). Call after itemProcess is remapped / pruned on save.
     */
    function syncOrderLineAssignmentFromItemProcess(order, itemProcess) {
        if (!order || !Array.isArray(order.items)) return;
        var oid = String(order.id);
        var ip = itemProcess || [];
        order.items.forEach(function (item, idx) {
            if (!item) return;
            var rowsForLine = ip.filter(function (e) {
                return e && String(e.orderId) === oid && parseInt(e.itemIdx, 10) === idx;
            });
            if (!rowsForLine.length) {
                item.processAssigned = false;
                delete item.assignedToId;
                delete item.assignedToName;
                delete item.assignedDate;
                return;
            }
            item.processAssigned = true;
            var pick = rowsForLine[0];
            for (var r = 0; r < rowsForLine.length; r++) {
                if ((parseFloat(rowsForLine[r].qty) || 0) > 0) {
                    pick = rowsForLine[r];
                    break;
                }
            }
            if (pick.jobworkerId != null && pick.jobworkerId !== '') item.assignedToId = pick.jobworkerId;
            if (pick.jobworkerName != null && String(pick.jobworkerName).trim() !== '') {
                item.assignedToName = pick.jobworkerName;
            }
            if (pick.assignedDate) item.assignedDate = pick.assignedDate;
        });
    }

    global.OrderProcessing = {
        isOrderLineItem: isOrderLineItem,
        orderLineQty: orderLineQty,
        orderIsDirectBillStagingQueue: orderIsDirectBillStagingQueue,
        orderIsGoldInvoiceWorkshopExclude: orderIsGoldInvoiceWorkshopExclude,
        orderShowsOnPendingOrdersPage: orderShowsOnPendingOrdersPage,
        orderShowsOnPendingItemsPage: orderShowsOnPendingItemsPage,
        sumQtyForLineWithStatuses: sumQtyForLineWithStatuses,
        readyStatusesUpper: readyStatusesUpper,
        isTerminalProcessStatus: isTerminalProcessStatus,
        orderHasNonTerminalProcessRows: orderHasNonTerminalProcessRows,
        orderHasUnassignedPendingLines: orderHasUnassignedPendingLines,
        orderEveryLineReadyAtFullQuantity: orderEveryLineReadyAtFullQuantity,
        isOrderFullyReady: isOrderFullyReady,
        /** Ready Orders list / sync: finalized READY_ORDER only (Rules 1 + 4). */
        isOrderReadyForReadyOrdersList: isOrderReadyForReadyOrdersList,
        /** Past due (day after due date) and not yet eligible for Ready Orders list — UI highlight. */
        orderIsPastDueAndNotReadyForReadyOrders: orderIsPastDueAndNotReadyForReadyOrders,
        normalizeDueDateYMD: normalizeDueDateYMD,
        orderHasQtyInNonFinalizedStatus: orderHasQtyInNonFinalizedStatus,
        orderEveryLineFinalizedAtFullQuantity: orderEveryLineFinalizedAtFullQuantity,
        /** Alias — same as isOrderReadyForReadyOrdersList (strict Ready Orders policy). */
        orderMeetsReadyOrdersPolicy: isOrderReadyForReadyOrdersList,
        /** True if any itemProcess row exists for this order (workshop / Item Process). */
        orderHasProcessEntries: orderHasProcessEntries,
        /** True if any qty is in workshop READY status (Ready Items queue). */
        orderHasQtyInReadyItems: orderHasQtyInReadyItems,
        syncOrdersReadyFromProcess: syncOrdersReadyFromProcess,
        pruneItemProcessForOrder: pruneItemProcessForOrder,
        syncOrderLineAssignmentFromItemProcess: syncOrderLineAssignmentFromItemProcess,
        /** True if the order line is assigned to workshop (flags or any itemProcess row for that index). */
        orderLineIsWorkshopAssigned: orderLineIsWorkshopAssigned,
        sumQtyForLineNonTerminal: sumQtyForLineNonTerminal,
        orderLineItemDisplayName: orderLineItemDisplayName,
        getOrderMoveReadyBreakdown: getOrderMoveReadyBreakdown
    };
})(typeof window !== 'undefined' ? window : this);
