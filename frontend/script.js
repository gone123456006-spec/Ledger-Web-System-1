
/* ======================================================
   SIDEBAR BUTTON HANDLING (ERP STYLE)
====================================================== */
const ITEM_MODULE_ENABLED = false; // Disable Add Item / Item Sheet without deleting code
const AGENTS_MODULE_ENABLED = false; // Disable Agents section without deleting code
const LOAN_DAYBOOK_MODULE_ENABLED = false; // Disable New Loan / Pending Loans / Day Book

function initGoldOrderSubmenu() {
    const block = document.querySelector(".sidebar-gold-order");
    const trigger = document.querySelector(".gold-order-trigger");
    const submenu = document.querySelector(".sidebar-gold-submenu");
    if (!block || !trigger || !submenu) return;
    let hideTimeout = 0;
    function show() {
        if (hideTimeout) clearTimeout(hideTimeout);
        hideTimeout = 0;
        const rect = trigger.getBoundingClientRect();
        submenu.style.top = rect.top + "px";
        submenu.style.right = (window.innerWidth - rect.left + 6) + "px";
        submenu.classList.add("visible");
    }
    function scheduleHide() {
        if (hideTimeout) clearTimeout(hideTimeout);
        hideTimeout = setTimeout(function () {
            submenu.classList.remove("visible");
            hideTimeout = 0;
        }, 200);
    }
    block.addEventListener("mouseenter", show);
    block.addEventListener("mouseleave", scheduleHide);
    submenu.addEventListener("mouseenter", show);
    submenu.addEventListener("mouseleave", scheduleHide);
}

function initDirectBillSubmenu() {
    const block = document.querySelector(".sidebar-direct-bill");
    const trigger = document.querySelector(".direct-bill-trigger");
    const submenu = document.querySelector(".sidebar-direct-bill-submenu");
    if (!block || !trigger || !submenu) return;
    let hideTimeout = 0;
    function show() {
        if (hideTimeout) clearTimeout(hideTimeout);
        hideTimeout = 0;
        const rect = trigger.getBoundingClientRect();
        submenu.style.top = rect.top + "px";
        submenu.style.right = (window.innerWidth - rect.left + 6) + "px";
        submenu.classList.add("visible");
    }
    function scheduleHide() {
        if (hideTimeout) clearTimeout(hideTimeout);
        hideTimeout = setTimeout(function () {
            submenu.classList.remove("visible");
            hideTimeout = 0;
        }, 200);
    }
    block.addEventListener("mouseenter", show);
    block.addEventListener("mouseleave", scheduleHide);
    submenu.addEventListener("mouseenter", show);
    submenu.addEventListener("mouseleave", scheduleHide);
}

function initJobworkerBookSubmenu() {
    const block = document.querySelector(".sidebar-jobworker-book");
    const trigger = document.querySelector(".jobworker-book-trigger");
    const submenu = document.querySelector(".sidebar-jobworker-submenu");
    if (!block || !trigger || !submenu) return;
    let hideTimeout = 0;
    function show() {
        if (hideTimeout) clearTimeout(hideTimeout);
        hideTimeout = 0;
        const rect = trigger.getBoundingClientRect();
        submenu.style.top = rect.top + "px";
        submenu.style.right = (window.innerWidth - rect.left + 6) + "px";
        submenu.classList.add("visible");
    }
    function scheduleHide() {
        if (hideTimeout) clearTimeout(hideTimeout);
        hideTimeout = setTimeout(function () {
            submenu.classList.remove("visible");
            hideTimeout = 0;
        }, 200);
    }
    block.addEventListener("mouseenter", show);
    block.addEventListener("mouseleave", scheduleHide);
    submenu.addEventListener("mouseenter", show);
    submenu.addEventListener("mouseleave", scheduleHide);
}

function initAgentsSubmenu() {
    const block = document.querySelector(".sidebar-agents-order");
    const trigger = document.querySelector(".agents-order-trigger");
    const submenu = document.querySelector(".sidebar-agents-submenu");
    if (!block || !trigger || !submenu) return;
    if (!AGENTS_MODULE_ENABLED) {
        block.style.display = "none";
        return;
    }
    let hideTimeout = 0;
    function show() {
        if (hideTimeout) clearTimeout(hideTimeout);
        hideTimeout = 0;
        const rect = trigger.getBoundingClientRect();
        submenu.style.top = rect.top + "px";
        submenu.style.right = (window.innerWidth - rect.left + 6) + "px";
        submenu.style.display = "block";

        // Add hover effect via JS since inline styles make hover pseudo-class harder to override
        const btns = submenu.querySelectorAll('button');
        btns.forEach(btn => {
            btn.onmouseenter = () => btn.style.background = '#abccff';
            btn.onmouseleave = () => btn.style.background = 'transparent';
        });
    }
    function scheduleHide() {
        if (hideTimeout) clearTimeout(hideTimeout);
        hideTimeout = setTimeout(function () {
            submenu.style.display = "none";
            hideTimeout = 0;
        }, 200);
    }
    block.addEventListener("mouseenter", show);
    block.addEventListener("mouseleave", scheduleHide);
    submenu.addEventListener("mouseenter", show);
    submenu.addEventListener("mouseleave", scheduleHide);
}

function initAddItemSubmenu() {
    const block = document.querySelector(".sidebar-add-item");
    const trigger = document.querySelector(".add-item-trigger");
    const submenu = document.querySelector(".sidebar-add-item-submenu");
    if (!block || !trigger || !submenu) return;
    if (!ITEM_MODULE_ENABLED) {
        block.style.display = "none";
        return;
    }

    let hideTimeout = 0;
    function show() {
        if (hideTimeout) clearTimeout(hideTimeout);
        hideTimeout = 0;
        const rect = trigger.getBoundingClientRect();
        submenu.style.top = rect.top + "px";
        submenu.style.right = (window.innerWidth - rect.left + 6) + "px";
        submenu.style.display = "block";

        const btns = submenu.querySelectorAll('button');
        btns.forEach(btn => {
            btn.onmouseenter = () => btn.style.background = '#abccff';
            btn.onmouseleave = () => btn.style.background = 'transparent';
        });
    }
    function scheduleHide() {
        if (hideTimeout) clearTimeout(hideTimeout);
        hideTimeout = setTimeout(function () {
            submenu.style.display = "none";
            hideTimeout = 0;
        }, 200);
    }

    block.addEventListener("mouseenter", show);
    block.addEventListener("mouseleave", scheduleHide);
    submenu.addEventListener("mouseenter", show);
    submenu.addEventListener("mouseleave", scheduleHide);
}

// Global Esc → go to dashboard (any page inside the app)
function initEscToDashboard() {
    if (window.__escToDashboardInited) return;
    window.__escToDashboardInited = true;
    document.addEventListener("keydown", function (e) {
        if (e.key !== "Escape") return;
        const workspace = document.querySelector(".workspace");
        if (!workspace) return;
        if (typeof loadPage === "function") loadPage("dashboard.html");
    });
}

// Wait for DOM to be ready
function initSidebarButtons() {
    const sidebarButtons = document.querySelectorAll(".sidebar button");

    if (sidebarButtons.length === 0) {
        console.warn("Sidebar buttons not found. Retrying...");
        // Retry after a short delay if DOM not ready
        setTimeout(initSidebarButtons, 100);
        return;
    }

    initEscToDashboard();
    initGoldOrderSubmenu();
    initJobworkerBookSubmenu();
    initDirectBillSubmenu();
    initAgentsSubmenu();
    initAddItemSubmenu();
    sidebarButtons.forEach(btn => {
        btn.addEventListener("click", () => {

            // LOGOUT
            if (btn.classList.contains("logout")) {
                try {
                    if (window.ledgerAuth) window.ledgerAuth.logout();
                } catch (e) { }
                // Always go to login page
                try { window.location.replace("login.html"); } catch (e) { window.location.href = "login.html"; }
                return;
            }

            // EXIT
            if (btn.classList.contains("exit")) {
                exitApp();
                return;
            }

            // ACTIVE STATE
            setActiveSidebar(btn);

            // ROUTE BY BUTTON TEXT
            const action = btn.innerText.trim().toLowerCase();

            switch (action) {

                case "add customer":
                    loadPage("pages/customer.html");
                    break;

                case "add station":
                    if (typeof openStation === "function") openStation();
                    else showInfo("Station module is not ready.");
                    break;

                case "add item":
                    if (!ITEM_MODULE_ENABLED) showInfo("Add Item is disabled.");
                    else loadPage("pages/add-item.html");
                    break;

                case "item sheet":
                    if (!ITEM_MODULE_ENABLED) showInfo("Item Sheet is disabled.");
                    else loadPage("pages/item-sheet.html");
                    break;

                case "agents":
                    // Agents is the hover parent; click does nothing (submenu shows on hover)
                    if (!AGENTS_MODULE_ENABLED) showInfo("Agents section is disabled.");
                    break;

                case "balance sheet":
                    if (!AGENTS_MODULE_ENABLED) showInfo("Balance Sheet is disabled.");
                    else loadPage("pages/balance-sheet.html");
                    break;

                case "purchase":
                    if (!AGENTS_MODULE_ENABLED) showInfo("Purchase is disabled.");
                    else loadPage("pages/purchase.html");
                    break;

                case "purchase return":
                    loadPage("pages/purchase-return.html");
                    break;

                case "customer balance":
                    loadPage("pages/customer-balance.html");
                    break;

                case "direct bill":
                    // Hover parent; submenu opens to the side
                    break;

                case "gold invoice":
                    loadPage("pages/direct-bill.html?invoice=gold");
                    break;

                case "silver invoice":
                    loadPage("pages/direct-bill.html?invoice=silver");
                    break;

                case "raw gold invoice":
                    loadPage("pages/direct-bill.html?invoice=raw-gold");
                    break;

                case "raw silver invoice":
                    loadPage("pages/direct-bill.html?invoice=raw-silver");
                    break;

                case "all bill":
                    loadPage("pages/all-bill.html");
                    break;

                case "gold order":
                case "gold order book":
                    // Gold Order Book is the hover parent; click does nothing (submenu shows on hover)
                    break;

                case "job worker book":
                case "jobworker book":
                    // Job Worker Book is the hover parent; click does nothing (submenu shows on hover)
                    break;

                case "new order":
                    // Reset new-order state so form is empty; avoid showing Ready order data/rows
                    localStorage.removeItem("orderAutoSave");
                    localStorage.removeItem("newOrderState");
                    localStorage.removeItem("ratebookOpened");
                    localStorage.removeItem("receiptOpened");
                    localStorage.removeItem("editOrderId");
                    localStorage.removeItem("editOrderPayload");
                    localStorage.removeItem("editCustomerReadOnly");
                    localStorage.setItem("lastOrderPage", "new-order");
                    localStorage.setItem("newOrderClearForm", "true");
                    loadPage("pages/new-order.html");
                    break;

                case "orders":
                    loadPage("pages/orders.html");
                    break;

                case "pending orders":
                    loadPage("pages/pending-orders.html");
                    break;

                case "ready orders":
                    loadPage("pages/ready-orders.html");
                    break;

                case "pending items":
                    loadPage("pages/pending-items.html");
                    break;

                case "item process":
                    loadPage("pages/item-process.html");
                    break;

                case "add jobworker":
                    try {
                        localStorage.removeItem("editJobworkerId");
                        localStorage.removeItem("editJobworkerPayload");
                        sessionStorage.setItem("jobworkerFormClear", "1");
                    } catch (e) { }
                    loadPage("pages/add-jobworker.html");
                    break;

                case "jobworker entry":
                    try { sessionStorage.setItem("jobworkerFormClear", "1"); } catch (e) { }
                    loadPage("pages/jobworker-entry.html");
                    break;

                case "job worker list":
                    loadPage("pages/jobworker-list.html");
                    break;

                case "jobworker balance":
                    loadPage("pages/jobworker-balance.html");
                    break;

                case "new loan":
                    if (!LOAN_DAYBOOK_MODULE_ENABLED) showInfo("New Loan is disabled.");
                    else loadPage("pages/new-loan.html");
                    break;

                case "pending loans":
                    if (!LOAN_DAYBOOK_MODULE_ENABLED) showInfo("Pending Loans is disabled.");
                    else loadPage("pages/pending-loans.html");
                    break;

                case "day book":
                    if (!LOAN_DAYBOOK_MODULE_ENABLED) showInfo("Day Book is disabled.");
                    else loadPage("pages/day-book.html");
                    break;

                default:
                    showInfo(`"${btn.innerText}" module not connected yet`);
            }
        });
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSidebarButtons);
} else {
    // DOM already ready
    initSidebarButtons();
}

/* ======================================================
   HELPER: Ensure element exists before accessing
====================================================== */
function ensureElementReady(selector, maxRetries = 10, delay = 50) {
    return new Promise((resolve) => {
        let retries = 0;
        const checkElement = () => {
            const element = document.querySelector(selector) || document.getElementById(selector.replace('#', ''));
            if (element || retries >= maxRetries) {
                resolve(element);
            } else {
                retries++;
                setTimeout(checkElement, delay);
            }
        };
        checkElement();
    });
}

/* ======================================================
   WORKSPACE NAVIGATION (race-safe, listener cleanup)
   - __ledgerLoadPageSeq: stale fetch / delayed script callbacks bail out
   - __ledgerLoadPageFetchAbort: cancel in-flight module fetch when navigating again
   - __ledgerPageNavAbort: AbortSignal for window/document listeners on the active page
====================================================== */
var __ledgerLoadPageSeq = 0;
var __ledgerLoadPageFetchAbort = null;

/**
 * Register a listener removed automatically when the user opens another workspace module.
 * Requires window.__ledgerPageNavAbort (set in loadPage).
 */
function ledgerNavListen(target, type, listener, options) {
    if (!target || typeof target.addEventListener !== "function") return;
    var ctl = window.__ledgerPageNavAbort;
    var sig = ctl && ctl.signal;
    if (sig && sig.aborted) return;
    var opts = sig ? Object.assign({}, options || {}, { signal: sig }) : options;
    target.addEventListener(type, listener, opts);
}
window.ledgerNavListen = ledgerNavListen;

/* ======================================================
   PAGE LOADER (THIS MAKES IT OPEN INSIDE DASHBOARD)
====================================================== */
function loadPage(pageUrl) {
    const workspace = document.querySelector(".workspace");

    if (!workspace) {
        console.error("Workspace element not found");
        alert("Dashboard workspace not found. Please refresh the page.");
        return;
    }

    if (!pageUrl) {
        console.error("Page URL is required");
        return;
    }

    // Block module loading unless logged in (fail closed)
    try {
        if (!window.ledgerAuth) {
            try { window.location.replace("login.html"); } catch (e) { window.location.href = "login.html"; }
            return;
        }
        if (!window.ledgerAuth.isLoggedIn()) {
            window.ledgerAuth.requireAuth("login.html");
            return;
        }
    } catch (e) { }

    // Normalize legacy paths from older deployments
    try {
        pageUrl = String(pageUrl || "");
        pageUrl = pageUrl.replace(/^(\.\.\/)+pages\//i, "pages/");
        pageUrl = pageUrl.replace(/^(\.\.\/)+public\//i, "");
    } catch (e) { }

    // When leaving Add Jobworker or Jobworker Entry, set flag (read before workspace is cleared)
    const currentPage = workspace.getAttribute('data-page') || '';
    if (currentPage === 'add-jobworker' || currentPage === 'jobworker-entry') {
        try {
            sessionStorage.setItem('jobworkerFormClear', '1');
            if (currentPage === 'add-jobworker') {
                localStorage.removeItem('editJobworkerId');
                localStorage.removeItem('editJobworkerPayload');
            }
        } catch (e) { }
    }

    __ledgerLoadPageSeq++;
    const loadSeq = __ledgerLoadPageSeq;

    try {
        if (__ledgerLoadPageFetchAbort) __ledgerLoadPageFetchAbort.abort();
    } catch (e) { }
    __ledgerLoadPageFetchAbort = new AbortController();

    try {
        if (window.__ledgerPageNavAbort && typeof window.__ledgerPageNavAbort.abort === 'function') {
            window.__ledgerPageNavAbort.abort();
        }
    } catch (e) { }
    window.__ledgerPageNavAbort = new AbortController();

    if (typeof window.__currentPageCleanup === 'function') {
        try { window.__currentPageCleanup(); } catch (e) { }
        window.__currentPageCleanup = null;
    }

    // Dashboard home: no fetch, show simple home view
    const isDashboard = /dashboard\.html$/i.test(String(pageUrl).trim());
    if (isDashboard) {
        workspace.innerHTML = `
            <div style="padding:40px; font-size:16px; color:#1f3b57;">
                <h2 style="margin:0 0 12px 0; font-weight:600;">Dashboard</h2>
                <p style="margin:0; opacity:0.85;">Use the sidebar to open a page. Press <kbd style="padding:2px 6px; background:#e6f0ff; border-radius:4px;">Esc</kbd> anytime to return here.</p>
            </div>
        `;
        workspace.removeAttribute("data-page");
        setActiveSidebar(null);
        return;
    }

    // Normalize/encode URL (handles spaces like "ready extra order.html")
    let fetchUrl = pageUrl;
    try {
        fetchUrl = new URL(pageUrl, window.location.href).href;
    } catch (e) {
        try {
            fetchUrl = encodeURI(pageUrl);
        } catch (e2) {
            fetchUrl = pageUrl;
        }
    }

    // Loading screen
    workspace.innerHTML = `
        <div style="
            padding:40px;
            font-size:14px;
            color:#1f3b57;
        ">
            Loading module...
        </div>
    `;

    fetch(fetchUrl, { signal: __ledgerLoadPageFetchAbort.signal })
        .then(res => {
            if (loadSeq !== __ledgerLoadPageSeq) {
                const stale = new Error("Stale navigation");
                stale.name = "AbortError";
                return Promise.reject(stale);
            }
            if (!res.ok) throw new Error("Page not found");
            return res.text();
        })
        .then(html => {
            if (loadSeq !== __ledgerLoadPageSeq) return;
            // Absolute URL of the loaded page file — used to resolve <script src="../..."> correctly.
            // Without this, relative URLs resolve against index.html and ../script/*.js often 404s,
            // so modules like order-processing.js never run (e.g. Ready Items "Order rules not loaded").
            const pageFileAbsUrl = new URL(pageUrl, window.location.href).href;

            function resolvePageScriptSrc(rawSrc) {
                const s = (rawSrc && String(rawSrc).trim()) || "";
                if (!s) return "";
                try {
                    return new URL(s, pageFileAbsUrl).href;
                } catch (e) {
                    return s;
                }
            }

            function findLoadedScriptByCanonicalUrl(canonicalHref) {
                if (!canonicalHref) return null;
                const nodes = document.querySelectorAll("script[data-ledger-src]");
                for (let i = 0; i < nodes.length; i++) {
                    if (nodes[i].getAttribute("data-ledger-src") === canonicalHref) return nodes[i];
                }
                return null;
            }

            // Parse HTML to extract and remove scripts before inserting
            const temp = document.createElement('div');
            temp.innerHTML = html;

            // Extract all scripts (both inline and external)
            const scripts = Array.from(temp.querySelectorAll('script'));
            scripts.forEach(script => script.remove());

            // Extract style tags to preserve CSS
            const styles = Array.from(temp.querySelectorAll('style'));
            const styleContents = styles.map(style => style.textContent).join('\n');
            styles.forEach(style => style.remove());

            // Insert HTML content (without scripts and styles)
            workspace.innerHTML = temp.innerHTML;

            // Page slug for scoping: e.g. "new-order", "ready-extra-order"
            var pageSlug = (pageUrl || '').replace(/^pages\//i, '').replace(/\.html$/i, '').trim() || 'page';
            workspace.setAttribute('data-page', pageSlug);

            // Remove any popup from a previous page that might be outside workspace (no shared DOM)
            var popupIds = [
                'ratebookPopup', 'orderDetailsPopup', 'paymentPopup', 'orderPopup', 'ratebookDetailsPopup',
                'new-order-ratebook-popup', 'new-order-order-details-popup', 'new-order-payment-popup', 'new-order-purchase-sheet-popup', 'new-order-item-table',
                'ready-order-order-popup', 'ready-order-payment-popup', 'ready-order-ratebook-popup', 'ready-order-ratebook-details-popup', 'ready-order-item-table'
            ];
            popupIds.forEach(function (id) {
                try {
                    var el = document.getElementById(id);
                    if (el && !workspace.contains(el)) {
                        el.style.display = 'none';
                        if (el.parentNode) el.parentNode.removeChild(el);
                    }
                } catch (e) { }
            });

            // ============================================
            // [PERSISTENCE] Restore Form Data
            // ============================================
            if (window.FormPersistence) {
                try {
                    const persistence = window.FormPersistence.getInstance();
                    // Use the page URL as the unique context key
                    persistence.setContext(pageUrl);
                    // Do not restore draft form over "edit from Orders" — loadOrderForEdit fills the form;
                    // restore() would re-apply stale persisted empty customer / rows and glitch the UI.
                    var skipPersistRestore =
                        /pages\/new-order\.html$/i.test(String(pageUrl || "")) &&
                        !!localStorage.getItem("editOrderId");
                    if (!skipPersistRestore) {
                        // Restore immediately after HTML injection so users see data
                        // even before scripts might fully run (though scripts often need to run to populate dropdowns first)
                        // We'll also call it again after scripts run just in case dropdowns were empty
                        persistence.restore();
                    }
                } catch (e) {
                    console.error("[FormPersistence] Error restoring data:", e);
                }
            }

            // Inject styles into workspace if any
            if (styleContents) {
                const styleTag = document.createElement('style');
                styleTag.textContent = styleContents;
                workspace.appendChild(styleTag);
            }

            // Force a reflow to ensure DOM is fully updated
            void workspace.offsetHeight;

            // Execute scripts AFTER DOM is inserted
            // This ensures getElementById can find elements
            // Use a longer delay to ensure DOM is fully ready
            setTimeout(() => {
                if (loadSeq !== __ledgerLoadPageSeq) return;
                try {
                    let scriptIndex = 0;
                    const executeNextScript = () => {
                        if (loadSeq !== __ledgerLoadPageSeq) return;
                        if (scriptIndex >= scripts.length) {
                            // All scripts executed, now refresh
                            setTimeout(() => {
                                if (loadSeq !== __ledgerLoadPageSeq) return;
                                refreshPageData(workspace, loadSeq);

                                // [PERSISTENCE] Second pass restoration to catch dynamically populated fields
                                if (window.FormPersistence) {
                                    try {
                                        var skipPersistRestore2 =
                                            /pages\/new-order\.html$/i.test(String(pageUrl || "")) &&
                                            !!localStorage.getItem("editOrderId");
                                        if (!skipPersistRestore2) {
                                            window.FormPersistence.getInstance().restore();
                                        }
                                    } catch (e) { }
                                }
                            }, 200);
                            return;
                        }

                        const oldScript = scripts[scriptIndex];
                        const script = document.createElement('script');

                        if (oldScript.src) {
                            const rawAttr = (oldScript.getAttribute("src") || "").trim();
                            const resolvedSrc = resolvePageScriptSrc(rawAttr) || oldScript.src;
                            // Match by canonical URL (avoids duplicate loads vs different string forms of the same file)
                            const existingScript = findLoadedScriptByCanonicalUrl(resolvedSrc) ||
                                document.querySelector(`script[src="${resolvedSrc}"]`);
                            if (!existingScript) {
                                script.src = resolvedSrc;
                                script.setAttribute("data-ledger-src", resolvedSrc);
                                script.async = false;
                                script.onload = () => {
                                    scriptIndex++;
                                    executeNextScript();
                                };
                                script.onerror = () => {
                                    console.warn(`Failed to load external script: ${resolvedSrc}`);
                                    scriptIndex++;
                                    executeNextScript();
                                };
                                document.body.appendChild(script);
                            } else {
                                // Script already loaded, skip to next
                                scriptIndex++;
                                executeNextScript();
                            }
                        } else {
                            // Inline script: execute in workspace context
                            try {
                                const scriptContent = oldScript.textContent;

                                // Wrap script to handle errors gracefully and ensure proper scope
                                const wrappedScript = `
                                    (function() {
                                        'use strict';
                                        try {
                                            ${scriptContent}
                                        } catch(e) {
                                            console.error('Error in page script (line ${scriptIndex}):', e);
                                            console.error('Script content:', e.stack);
                                        }
                                    })();
                                `;

                                script.textContent = wrappedScript;
                                document.body.appendChild(script);

                                // Remove after execution and move to next script
                                setTimeout(() => {
                                    if (loadSeq !== __ledgerLoadPageSeq) return;
                                    if (script.parentNode) {
                                        document.body.removeChild(script);
                                    }
                                    scriptIndex++;
                                    executeNextScript();
                                }, 30);
                            } catch (e) {
                                console.error('Error preparing inline script:', e);
                                scriptIndex++;
                                executeNextScript();
                            }
                        }
                    };

                    // Start executing scripts sequentially
                    executeNextScript();

                } catch (e) {
                    console.error('Error executing scripts from loaded page', e);
                    // Still try to refresh even if script execution had errors
                    setTimeout(() => {
                        if (loadSeq !== __ledgerLoadPageSeq) return;
                        refreshPageData(workspace, loadSeq);
                    }, 300);
                }
            }, 100); // Delay to ensure DOM is ready
        })
        .catch(err => {
            if (loadSeq !== __ledgerLoadPageSeq) return;
            if (err && err.name === "AbortError") return;
            const isFile = (window.location && window.location.protocol === "file:");
            workspace.innerHTML = `
                <div style="
                    padding:30px;
                    color:#b00020;
                    font-size:14px;
                ">
                    Module could not be loaded.<br>
                    <small>${pageUrl}</small>
                    ${isFile ? `<div style="margin-top:10px; font-size:12px; color:#6e6e73;">
                      You are opening the app using <strong>file://</strong>. Browsers block <strong>fetch()</strong> for local files.
                      Run a local server (example: <code>npx serve frontend</code>) or deploy on Render.
                    </div>` : ``}
                </div>
            `;
            console.error("loadPage failed:", { pageUrl, fetchUrl, err });
        });
}

/* ======================================================
   ACTIVE BUTTON UI
====================================================== */
function setActiveSidebar(activeBtn) {
    document.querySelectorAll(".sidebar button")
        .forEach(b => b.classList.remove("active"));
    if (activeBtn) activeBtn.classList.add("active");
}

/* ======================================================
   EXIT
====================================================== */
function exitApp() {
    if (confirm("Exit application?")) {
        // Try to close window, fallback to redirect
        if (window.opener) {
            window.close();
        } else {
            window.location.href = "about:blank";
        }
    }
}

/* ======================================================
   SHOW INFO MESSAGE
====================================================== */
function showInfo(message) {
    // Simple alert for now, can be replaced with toast notification
    console.log(message);
    // Optional: Show a toast notification instead of console.log
    // You can implement a proper toast notification system here
}

/* ======================================================
   AUTO REFRESH PAGE DATA
====================================================== */
function refreshPageData(workspace, loadSeq) {
    if (!workspace) return;

    // Wait a bit for DOM to be fully inserted and scripts executed
    setTimeout(() => {
        if (loadSeq != null && loadSeq !== __ledgerLoadPageSeq) return;
        // First, try to re-initialize any const declarations that might have failed
        // Some pages declare const elements at the top level which fail if elements don't exist
        try {
            // Re-evaluate common element references that might have failed
            const commonElementIds = [
                'custName', 'currentBal', 'relation', 'station',
                'orderDate', 'dueDate', 'billNo', 'gstRate',
                'itemTable', 'rows', 'orderApp', 'invoice',
                'customer', 'billDate', 'historyBody'
            ];

            // This helps pages that have const declarations that failed
            // by ensuring elements exist before functions try to use them
        } catch (e) {
            console.debug('Error in element re-initialization:', e);
        }

        // List of common refresh/load functions to call
        const refreshFunctions = [
            'loadCustomers',
            'loadReadyOrders',
            'loadPendingOrders',
            'loadOrders',
            'loadStations',
            'loadHistory',
            'initNewOrder',
            'refreshData',
            'loadData',
            'reloadData'
        ];

        function ledgerSkipRefreshLoadCustomersForNewOrderEdit(ws) {
            try {
                return !!(ws && ws.getAttribute && ws.getAttribute('data-page') === 'new-order' &&
                    localStorage.getItem('editOrderId'));
            } catch (e) {
                return false;
            }
        }

        // Try to call refresh functions if they exist
        refreshFunctions.forEach(funcName => {
            try {
                if (funcName === 'loadCustomers' && ledgerSkipRefreshLoadCustomersForNewOrderEdit(workspace)) {
                    return;
                }
                if (typeof window[funcName] === 'function') {
                    // Add a small delay between function calls to avoid conflicts
                    setTimeout(() => {
                        if (loadSeq != null && loadSeq !== __ledgerLoadPageSeq) return;
                        try {
                            window[funcName]();
                        } catch (e) {
                            console.debug(`Refresh function ${funcName} errored:`, e);
                        }
                    }, 10);
                }
            } catch (e) {
                console.debug(`Refresh function ${funcName} not available:`, e);
            }
        });

        // Dispatch a custom event that pages can listen to for refresh
        const refreshEvent = new CustomEvent('pageRefresh', {
            detail: { source: 'dashboard', workspace: workspace }
        });
        workspace.dispatchEvent(refreshEvent);
        window.dispatchEvent(refreshEvent);
        document.dispatchEvent(refreshEvent);

        // For pages that check document.readyState, manually trigger their init
        // This handles cases like new-order.html which checks readyState
        try {
            const initFunctions = ['initNewOrder', 'initPage', 'initialize'];
            initFunctions.forEach((funcName, index) => {
                setTimeout(() => {
                    if (loadSeq != null && loadSeq !== __ledgerLoadPageSeq) return;
                    try {
                        if (typeof window[funcName] === 'function') {
                            window[funcName]();
                        }
                    } catch (e) {
                        console.debug(`Init function ${funcName} errored:`, e);
                    }
                }, index * 50); // Stagger init calls
            });
        } catch (e) {
            console.debug('Error calling init functions:', e);
        }

        // For pages with immediate initialization code (like orders.html)
        // Look for common initialization patterns and ensure they run
        try {
            // Check workspace for elements that indicate what needs to be initialized
            const custNameEl = workspace.querySelector('#custName') || document.getElementById('custName');
            if (custNameEl && typeof window.loadCustomers === 'function') {
                if (!ledgerSkipRefreshLoadCustomersForNewOrderEdit(workspace)) {
                    setTimeout(() => {
                        if (loadSeq != null && loadSeq !== __ledgerLoadPageSeq) return;
                        window.loadCustomers();
                    }, 100);
                }
            }

            const rowsEl = workspace.querySelector('#rows') || document.getElementById('rows');
            if (rowsEl && typeof window.addRow === 'function') {
                // Check if rows are empty, if so add a row
                if (!rowsEl.querySelector('tr')) {
                    setTimeout(() => {
                        if (loadSeq != null && loadSeq !== __ledgerLoadPageSeq) return;
                        window.addRow();
                    }, 150);
                }
            }

            const itemTableEl = workspace.querySelector('#itemTable tbody') || document.querySelector('#itemTable tbody');
            if (itemTableEl && typeof window.addRow === 'function') {
                if (!itemTableEl.querySelector('tr')) {
                    setTimeout(() => {
                        if (loadSeq != null && loadSeq !== __ledgerLoadPageSeq) return;
                        window.addRow();
                    }, 150);
                }
            }

            // Check for order date and set it if not set
            const orderDateEl = workspace.querySelector('#orderDate') || document.getElementById('orderDate');
            if (orderDateEl && !orderDateEl.value) {
                orderDateEl.valueAsDate = new Date();
            }

            const billDateEl = workspace.querySelector('#billDate') || document.getElementById('billDate');
            if (billDateEl && !billDateEl.value) {
                billDateEl.valueAsDate = new Date();
            }

            // Generate bill number if needed
            const billNoEl = workspace.querySelector('#billNo') || document.getElementById('billNo');
            if (billNoEl && !billNoEl.value && typeof window.generateBillNo === 'function') {
                billNoEl.value = window.generateBillNo();
            }
        } catch (e) {
            console.debug('Error in element-based initialization:', e);
        }
    }, 200); // Increased delay to ensure everything is ready
}

/* ======================================================
   AUTO LOAD DASHBOARD (OPTIONAL)
====================================================== */
window.addEventListener("load", () => {
    showInfo("Welcome to Ledger Management System");
});

/* ======================================================
   UNIVERSAL TITLE CASE FOR ALL TEXT INPUTS
====================================================== */
document.addEventListener("input", function(e) {
    const el = e.target;
    // Only apply to input and textarea
    if (!el || (el.tagName !== "INPUT" && el.tagName !== "TEXTAREA")) return;
    
    // Ignore readOnly and disabled
    if (el.readOnly || el.disabled) return;

    // Filter out specific input types where Title Case doesn't make sense
    const type = (el.type || "").toLowerCase();
    const excludedTypes = [
        "email", "password", "number", "url", "search", 
        "date", "time", "month", "week", "datetime-local", 
        "file", "color", "hidden", "radio", "checkbox", 
        "button", "submit", "reset"
    ];
    if (excludedTypes.includes(type)) return;

    // Helper to format string with First letter Capital, rest small
    function toTitleCase(str) {
        return str.replace(/[^\s]+/g, function(word) {
            if (!word) return word;
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        });
    }

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const raw = el.value;
    const next = toTitleCase(raw);

    if (next !== raw) {
        el.value = next;
        
        // Restore cursor position seamlessly
        const lenDiff = next.length - raw.length;
        if (typeof start === "number" && typeof end === "number") {
            try {
                el.setSelectionRange(
                    Math.max(0, Math.min(next.length, start + lenDiff)),
                    Math.max(0, Math.min(next.length, end + lenDiff))
                );
            } catch (err) {}
        }
    }
});