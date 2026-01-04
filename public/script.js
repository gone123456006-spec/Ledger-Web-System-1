
/* ======================================================
   SIDEBAR BUTTON HANDLING (ERP STYLE)
====================================================== */

document.querySelectorAll(".sidebar button").forEach(btn => {
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
                loadPage("../pages/customer.html");   
                break;

            case "add item":
                loadPage("../pages/add-item.html");
                break;

            case "agents":
                loadPage("../pages/agents.html");
                break;

            case "customer balance":
                loadPage("../pages/customer-balance.html");
                break;

            case "direct bill":
                loadPage("../pages/direct-bill.html");
                break;

            case "all bill":
                loadPage("../pages/all-bill.html");
                break;

            case "new order":
                loadPage("../pages/new-order.html");
                break;

            case "orders":
                loadPage("../pages/orders.html");
                break;

            case "pending orders":
                loadPage("../pages/pending-orders.html");
                break;

            case "ready orders":
                loadPage("../pages/ready-orders.html");
                break;

            case "pending items":
                loadPage("../pages/pending-items.html");
                break;

            case "add jobworker":
                loadPage("../pages/add-jobworker.html");
                break;

            case "jobworker entry":
                loadPage("../pages/jobworker-entry.html");
                break;

            case "jobworker balance":
                loadPage("../pages/jobworker-balance.html");
                break;

            case "new loan":
                loadPage("../pages/new-loan.html");
                break;

            case "pending loans":
                loadPage("../pages/pending-loans.html");
                break;

            case "day book":
                loadPage("../pages/day-book.html");
                break;

            default:
                showInfo(`"${btn.innerText}" module not connected yet`);
        }
    });
});

/* ======================================================
   PAGE LOADER (THIS MAKES IT OPEN INSIDE DASHBOARD)
====================================================== */
function loadPage(pageUrl) {
    const workspace = document.querySelector(".workspace");

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

    fetch(pageUrl)
        .then(res => {
            if (!res.ok) throw new Error("Page not found");
            return res.text();
        })
        .then(html => {
            // Insert HTML
            workspace.innerHTML = html;

            // Execute any inline scripts present in the fetched HTML so page-level
            // functions (like those in pages/customer.html) become available.
            try {
                const temp = document.createElement('div');
                temp.innerHTML = html;
                temp.querySelectorAll('script').forEach(oldScript => {
                    const script = document.createElement('script');
                    if (oldScript.src) {
                        // External script: copy src so browser loads & executes it
                        script.src = oldScript.src;
                        script.async = false;
                        document.body.appendChild(script);
                    } else {
                        // Inline script: copy content and execute immediately
                        script.textContent = oldScript.textContent;
                        document.body.appendChild(script);
                        document.body.removeChild(script);
                    }
                });
            } catch (e) {
                console.error('Error executing inline scripts from loaded page', e);
            }
        })
        .catch(err => {
            workspace.innerHTML = `
                <div style="
                    padding:30px;
                    color:#b00020;
                    font-size:14px;
                ">
                    Module could not be loaded.<br>
                    <small>${pageUrl}</small>
                </div>
            `;
            console.error(err);
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
        window.location.href = "login.html";
    }
}

/* ======================================================
   AUTO LOAD DASHBOARD (OPTIONAL)
====================================================== */
window.addEventListener("load", () => {
    showInfo("Welcome to Ledger Management System");
});