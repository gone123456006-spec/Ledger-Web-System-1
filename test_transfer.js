
// Mock localStorage
let store = {
    customerBalances: JSON.stringify([{
        orderNo: "BILL-001",
        customer: "John Doe",
        amount: 500,
        transferred: false
    }]),
    orders: JSON.stringify([{
        orderNo: "BILL-001",
        phone: "9876543210",
        city: "Mumbai",
        address: "123 Main St"
    }]),
    customers: JSON.stringify([])
};

global.localStorage = {
    getItem: (k) => store[k] || "[]",
    setItem: (k, v) => { store[k] = v; console.log(`Stored ${k}:`, v); }
};
global.alert = (msg) => console.log("ALERT:", msg);
global.confirm = (msg) => true;
global.window = { location: { href: "" } };

// Mock transferBill function from all-bill.html
function transferBill(index) {
    try {
        const balances = JSON.parse(localStorage.getItem("customerBalances") || "[]");
        const bill = balances[index];

        if (!bill) {
            alert("Bill not found!");
            return;
        }

        // 1. TRY TO FIND FULL ORDER DETAILS
        const orders = JSON.parse(localStorage.getItem("orders") || "[]");
        const fullOrder = orders.find(o => o.orderNo === bill.orderNo);

        const phone = fullOrder?.customerId || fullOrder?.phone || "—";
        const station = fullOrder?.city || fullOrder?.station || "—";
        const address = fullOrder?.address || "";

        // 2. FIND OR CREATE CUSTOMER
        const customers = JSON.parse(localStorage.getItem("customers") || "[]");
        const custNameNorm = (bill.customer || "").trim().toLowerCase();
        let customer = customers.find(c => (c.name || "").trim().toLowerCase() === custNameNorm);

        const amountVal = parseFloat(bill.amount || 0);

        if (customer) {
            const currentBal = parseFloat(customer.openingBalance || 0);
            customer.openingBalance = (currentBal + amountVal).toFixed(2);
            if (!customer.transferredBills) customer.transferredBills = [];
            customer.transferredBills.push(bill.orderNo);
            alert(`Updated existing customer "${customer.name}". New Balance: ${customer.openingBalance}`);
        } else {
            customer = {
                cid: "—",
                name: bill.customer,
                openingBalance: amountVal.toFixed(2),
                phone: phone,
                mobile: phone,
                station: station,
                address: address,
                transferredBills: [bill.orderNo]
            };
            customers.push(customer);
            alert(`Created new customer "${customer.name}" with Balance: ${customer.openingBalance}`);
        }

        localStorage.setItem("customers", JSON.stringify(customers));

        bill.transferred = true;
        balances[index] = bill;
        localStorage.setItem("customerBalances", JSON.stringify(balances));

        console.log("Navigating to customer-balance.html");

    } catch (e) {
        console.error("Error:", e);
    }
}

// Run Test
console.log("--- Test Transfer ---");
transferBill(0);
console.log("--- Final Customers Store ---");
console.log(store.customers);
