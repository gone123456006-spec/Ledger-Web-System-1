/**
 * Job Worker modal — Balance Information table: all matching `jobworkerBalances`
 * rows for the worker, optional totals row, and computed fallback from
 * opening balance + `jobworkerEntries` when no balance records exist.
 */
(function (global) {
    function num(v) {
        var n = parseFloat(v);
        return Number.isFinite(n) ? n : 0;
    }

    function matchesWorker(b, jw) {
        if (!b || !jw) return false;
        var bid = String(b.jwId || '').trim();
        var jid = String(jw.jwId || '').trim();
        var bn = String(b.name || '').trim().toLowerCase();
        var jn = String(jw.name || '').trim().toLowerCase();
        if (jid && bid === jid) return true;
        if (jn && bn === jn) return true;
        return false;
    }

    function filterEntriesForWorker(entries, jw, jwId, jwName) {
        var nn = String(jwName || '').trim().toLowerCase();
        var jn = jw && String(jw.name || '').trim().toLowerCase();
        return (entries || []).filter(function (e) {
            if (!e) return false;
            if (jwId && String(e.jobworkerId || '') === String(jwId)) return true;
            if (jw && jw.id != null && String(e.jobworkerId || '') === String(jw.id)) return true;
            if (jw && jw.jwId && String(e.jobworkerId || '').trim() === String(jw.jwId).trim()) return true;
            if (nn && String(e.jobworkerName || '').trim().toLowerCase() === nn) return true;
            if (jn && String(e.jobworkerName || '').trim().toLowerCase() === jn) return true;
            return false;
        });
    }

    function sumEntryMetals(entries) {
        var m = 0, c = 0, n = 0, ml = 0;
        entries.forEach(function (e) {
            m += num(e.metal);
            c += num(e.chain);
            n += num(e.nag);
            ml += num(e.maal);
        });
        return { m: m, c: c, n: n, ml: ml };
    }

    function fmt3(v) {
        if (v == null || v === '') return '—';
        var x = parseFloat(v);
        return Number.isFinite(x) ? x.toFixed(3) : '—';
    }

    /**
     * @param {object|null} jw - jobworkers[] record
     * @param {string} jwId - id or jwId from caller context
     * @param {string} jwName
     * @param {function(string): string} escapeHtml
     * @returns {string} HTML for <tbody> (one or more <tr>, no tbody wrapper)
     */
    function renderBalanceTbodyHtml(jw, jwId, jwName, escapeHtml) {
        if (!jw) {
            return '<tr><td colspan="12" style="text-align:center;padding:24px;color:#94a3b8;">No balance record found for "' +
                escapeHtml(jwName || '') + '"</td></tr>';
        }

        var balances = [];
        var entries = [];
        try {
            balances = JSON.parse(global.localStorage.getItem('jobworkerBalances') || '[]');
        } catch (e) { balances = []; }
        try {
            entries = JSON.parse(global.localStorage.getItem('jobworkerEntries') || '[]');
        } catch (e2) { entries = []; }

        var balRows = (balances || []).filter(function (b) { return matchesWorker(b, jw); });
        var myEntries = filterEntriesForWorker(entries, jw, jwId, jwName);
        var entrySum = sumEntryMetals(myEntries);
        var obM = num(jw.obMetal), obC = num(jw.obChain), obN = num(jw.obNag), obMl = num(jw.obMaal);
        var jwRel = [jw.relationType, jw.relationName].filter(Boolean).join(' ') || '—';
        var jwDate = String(jw.obDate || jw.date || '').slice(0, 10) || '—';

        var parts = [];

        if (balRows.length === 0) {
            var metal = obM + entrySum.m;
            var chain = obC + entrySum.c;
            var nag = obN + entrySum.n;
            var maal = obMl + entrySum.ml;
            parts.push(
                '<tr>' +
                '<td>' + escapeHtml(String(jw.jwId || '—')) + '</td>' +
                '<td style="font-weight:700;">' + escapeHtml(String(jw.name || '—')) + '</td>' +
                '<td>' + escapeHtml(String(jwRel)) + '</td>' +
                '<td>' + escapeHtml(String(jwDate)) + '</td>' +
                '<td class="num">' + fmt3(metal) + '</td>' +
                '<td class="num">' + fmt3(chain) + '</td>' +
                '<td class="num">' + fmt3(nag) + '</td>' +
                '<td class="num">' + fmt3(maal) + '</td>' +
                '<td title="' + escapeHtml(String(jw.address || '')) + '">' + escapeHtml(String(jw.address || '—')) + '</td>' +
                '<td>' + escapeHtml(String(jw.station || '—')) + '</td>' +
                '<td>' + escapeHtml(String(jw.phone || '—')) + '</td>' +
                '<td>' + escapeHtml(String(jw.mobile || '—')) + '</td>' +
                '</tr>'
            );
            return parts.join('');
        }

        balRows.forEach(function (b) {
            var rel = (b.relation != null && String(b.relation).trim() !== '') ? String(b.relation) : jwRel;
            var dtRaw = b.balanceDate || b.date || b.asOfDate || b.entryDate || '';
            var dt = String(dtRaw).slice(0, 10);
            if (!dt) dt = jwDate;
            var nm = (b.name != null && String(b.name).trim() !== '') ? String(b.name) : String(jw.name || '—');
            var idCell = (b.jwId != null && String(b.jwId).trim() !== '') ? String(b.jwId) : String(jw.jwId || '—');
            var st = (b.station != null && String(b.station).trim() !== '') ? String(b.station) : String(jw.station || '—');
            parts.push(
                '<tr>' +
                '<td>' + escapeHtml(idCell) + '</td>' +
                '<td style="font-weight:700;">' + escapeHtml(nm) + '</td>' +
                '<td>' + escapeHtml(rel) + '</td>' +
                '<td>' + escapeHtml(dt) + '</td>' +
                '<td class="num">' + fmt3(b.metal) + '</td>' +
                '<td class="num">' + fmt3(b.chain) + '</td>' +
                '<td class="num">' + fmt3(b.nag) + '</td>' +
                '<td class="num">' + fmt3(b.maal) + '</td>' +
                '<td title="' + escapeHtml(String(jw.address || '')) + '">' + escapeHtml(String(jw.address || '—')) + '</td>' +
                '<td>' + escapeHtml(st) + '</td>' +
                '<td>' + escapeHtml(String(jw.phone || '—')) + '</td>' +
                '<td>' + escapeHtml(String(jw.mobile || '—')) + '</td>' +
                '</tr>'
            );
        });

        if (balRows.length > 1) {
            var tM = 0, tC = 0, tN = 0, tMl = 0;
            balRows.forEach(function (b) {
                tM += num(b.metal);
                tC += num(b.chain);
                tN += num(b.nag);
                tMl += num(b.maal);
            });
            parts.push(
                '<tr class="jw-bal-total-row">' +
                '<td colspan="4" style="font-weight:700;text-align:right;">Total (' + balRows.length + ' balance records)</td>' +
                '<td class="num" style="font-weight:700;">' + tM.toFixed(3) + '</td>' +
                '<td class="num" style="font-weight:700;">' + tC.toFixed(3) + '</td>' +
                '<td class="num" style="font-weight:700;">' + tN.toFixed(3) + '</td>' +
                '<td class="num" style="font-weight:700;">' + tMl.toFixed(3) + '</td>' +
                '<td colspan="4"></td>' +
                '</tr>'
            );
        }

        return parts.join('');
    }

    global.JwModalBalance = {
        renderBalanceTbodyHtml: renderBalanceTbodyHtml
    };
})(typeof window !== 'undefined' ? window : this);
