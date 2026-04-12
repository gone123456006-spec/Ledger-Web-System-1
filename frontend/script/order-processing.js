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
 * Rule 3 — Completion (100% every item)
 * Move to Ready Orders ONLY when:
 *   • no items pending (all quantity-bearing Order lines assigned), AND
 *   • no items still In Process, AND
 *   • every such line’s full ordered quantity is accounted for in READY or READY_ORDER
 *     (workshop “ready” or finalized from Ready Items = 100% processed for that line).
 *
 * Simple form: move ONLY IF every item is ready at 100% quantity; otherwise → do NOT move.
 *
 * Used by Item Processing, Ready Items, sync, and Pending Orders “Mark Ready”.
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
     * Sets order.status to READY only when isOrderFullyReady (Rules 1–3).
     * Demotes READY orders when that is no longer true.
     */
    function syncOrdersReadyFromProcess(orders, itemProcess) {
        if (!orders || !Array.isArray(orders)) return;
        orders.forEach(function (order) {
            if (!order || order.id == null) return;
            var oid = String(order.id);
            if (isOrderFullyReady(orders, itemProcess, oid)) {
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
        sumQtyForLineWithStatuses: sumQtyForLineWithStatuses,
        readyStatusesUpper: readyStatusesUpper,
        isTerminalProcessStatus: isTerminalProcessStatus,
        orderHasNonTerminalProcessRows: orderHasNonTerminalProcessRows,
        orderHasUnassignedPendingLines: orderHasUnassignedPendingLines,
        orderEveryLineReadyAtFullQuantity: orderEveryLineReadyAtFullQuantity,
        isOrderFullyReady: isOrderFullyReady,
        /** Alias — same as isOrderFullyReady (Rules 1–3). */
        orderMeetsReadyOrdersPolicy: isOrderFullyReady,
        syncOrdersReadyFromProcess: syncOrdersReadyFromProcess,
        pruneItemProcessForOrder: pruneItemProcessForOrder,
        syncOrderLineAssignmentFromItemProcess: syncOrderLineAssignmentFromItemProcess,
        sumQtyForLineNonTerminal: sumQtyForLineNonTerminal,
        orderLineItemDisplayName: orderLineItemDisplayName,
        getOrderMoveReadyBreakdown: getOrderMoveReadyBreakdown
    };
})(typeof window !== 'undefined' ? window : this);
