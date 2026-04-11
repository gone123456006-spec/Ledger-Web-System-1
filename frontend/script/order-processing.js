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
    function isOrderLineItem(item) {
        return item && item.values && (item.values[0] || 'Order') === 'Order';
    }

    function orderLineQty(order, itemIdx) {
        const item = order.items && order.items[itemIdx];
        if (!isOrderLineItem(item)) return 0;
        return Math.max(0, parseFloat(item.values[7]) || 0);
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
     */
    function orderHasUnassignedPendingLines(order) {
        if (!order || !order.items) return false;
        for (var idx = 0; idx < order.items.length; idx++) {
            if (!isOrderLineItem(order.items[idx])) continue;
            var need = orderLineQty(order, idx);
            if (need <= 0) continue;
            if (order.items[idx].processAssigned !== true) return true;
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
            var assigned = order.items[idx].processAssigned === true;
            var nonTerm = sumQtyForLineNonTerminal(itemProcess, oid, idx);
            var readySum = sumQtyForLineWithStatuses(itemProcess, oid, idx, readyStatusesUpper());
            if (!assigned) {
                pending.push({ itemIdx: idx, name: name, qty: need });
            } else if (nonTerm > 0) {
                inProcess.push({ itemIdx: idx, name: name, qty: nonTerm });
            } else if (readySum > 0) {
                ready.push({ itemIdx: idx, name: name, qty: readySum });
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
        if (orderHasUnassignedPendingLines(order)) return false;
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
        sumQtyForLineNonTerminal: sumQtyForLineNonTerminal,
        orderLineItemDisplayName: orderLineItemDisplayName,
        getOrderMoveReadyBreakdown: getOrderMoveReadyBreakdown
    };
})(typeof window !== 'undefined' ? window : this);
