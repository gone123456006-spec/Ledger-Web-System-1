
/* ======================================================
   SIDEBAR BUTTON HANDLING (ERP STYLE)
====================================================== */

// Wait for DOM to be ready
function initSidebarButtons(){
    const sidebarButtons = document.querySelectorAll(".sidebar button");
    
    if(sidebarButtons.length === 0){
        console.warn("Sidebar buttons not found. Retrying...");
        // Retry after a short delay if DOM not ready
        setTimeout(initSidebarButtons, 100);
        return;
    }
    
    sidebarButtons.forEach(btn => {
    btn.addEventListener("click", () => {

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

            case "add item":
                loadPage("pages/add-item.html");
                break;

            case "agents":
                loadPage("pages/agents.html");
                break;

            case "customer balance":
                loadPage("pages/customer-balance.html");
                break;

            case "direct bill":
                loadPage("pages/direct-bill.html");
                break;

            case "all bill":
                loadPage("pages/all-bill.html");
                break;

            case "new order":
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

            case "add jobworker":
                loadPage("pages/add-jobworker.html");
                break;

            case "jobworker entry":
                loadPage("pages/jobworker-entry.html");
                break;

            case "jobworker balance":
                loadPage("pages/jobworker-balance.html");
                break;

            case "new loan":
                loadPage("pages/new-loan.html");
                break;

            case "pending loans":
                loadPage("pages/pending-loans.html");
                break;

            case "day book":
                loadPage("pages/day-book.html");
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
   PAGE LOADER (THIS MAKES IT OPEN INSIDE DASHBOARD)
====================================================== */
function loadPage(pageUrl) {
    const workspace = document.querySelector(".workspace");
    
    if(!workspace){
        console.error("Workspace element not found");
        alert("Dashboard workspace not found. Please refresh the page.");
        return;
    }
    
    if(!pageUrl){
        console.error("Page URL is required");
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

    fetch(fetchUrl)
        .then(res => {
            if (!res.ok) throw new Error("Page not found");
            return res.text();
        })
        .then(html => {
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
                try {
                    let scriptIndex = 0;
                    const executeNextScript = () => {
                        if (scriptIndex >= scripts.length) {
                            // All scripts executed, now refresh
                            setTimeout(() => {
                                refreshPageData(workspace);
                            }, 200);
                            return;
                        }
                        
                        const oldScript = scripts[scriptIndex];
                        const script = document.createElement('script');
                        
                        if (oldScript.src) {
                            // External script: check if already loaded to avoid duplicates
                            const existingScript = document.querySelector(`script[src="${oldScript.src}"]`);
                            if (!existingScript) {
                                script.src = oldScript.src;
                                script.async = false;
                                script.onload = () => {
                                    scriptIndex++;
                                    executeNextScript();
                                };
                                script.onerror = () => {
                                    console.warn(`Failed to load external script: ${oldScript.src}`);
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
                        refreshPageData(workspace);
                    }, 300);
                }
            }, 100); // Delay to ensure DOM is ready
        })
        .catch(err => {
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
function setActiveSidebar(activeBtn){
    document.querySelectorAll(".sidebar button")
        .forEach(b => b.classList.remove("active"));
    activeBtn.classList.add("active");
}

/* ======================================================
   EXIT
====================================================== */
function exitApp(){
    if(confirm("Exit application?")){
        // Try to close window, fallback to redirect
        if(window.opener){
            window.close();
        } else {
            window.location.href = "about:blank";
        }
    }
}

/* ======================================================
   SHOW INFO MESSAGE
====================================================== */
function showInfo(message){
    // Simple alert for now, can be replaced with toast notification
    console.log(message);
    // Optional: Show a toast notification instead of console.log
    // You can implement a proper toast notification system here
}

/* ======================================================
   AUTO REFRESH PAGE DATA
====================================================== */
function refreshPageData(workspace) {
    if (!workspace) return;
    
    // Wait a bit for DOM to be fully inserted and scripts executed
    setTimeout(() => {
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
        
        // Try to call refresh functions if they exist
        refreshFunctions.forEach(funcName => {
            try {
                if (typeof window[funcName] === 'function') {
                    // Add a small delay between function calls to avoid conflicts
                    setTimeout(() => {
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
                setTimeout(() => window.loadCustomers(), 100);
            }
            
            const rowsEl = workspace.querySelector('#rows') || document.getElementById('rows');
            if (rowsEl && typeof window.addRow === 'function') {
                // Check if rows are empty, if so add a row
                if (!rowsEl.querySelector('tr')) {
                    setTimeout(() => window.addRow(), 150);
                }
            }
            
            const itemTableEl = workspace.querySelector('#itemTable tbody') || document.querySelector('#itemTable tbody');
            if (itemTableEl && typeof window.addRow === 'function') {
                if (!itemTableEl.querySelector('tr')) {
                    setTimeout(() => window.addRow(), 150);
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