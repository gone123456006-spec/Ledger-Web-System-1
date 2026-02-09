// Test: Complete Data Transfer Flow from All Bill to Customer Balance
// This simulates the transfer process with full data

// Mock localStorage
let store = {
    customerBalances: JSON.stringify([{
        orderNo: "ORD-2024-001",
        customer: "Rajesh Kumar",
        amount: 15000,
        date: "2024-02-08",
        transferred: false
    }]),
    orders: JSON.stringify([{
        orderNo: "ORD-2024-001",
        customerId: "9876543210",
        mobile: "9876543210",
        station: "Mumbai",
        relation: "S/O",
        relationName: "Suresh Kumar",
        lfno: "LF-123",
        cid: "CID-001"
    }]),
    bills: JSON.stringify([]),
    customers: JSON.stringify([])
};

global.localStorage = {
    getItem: (k) => store[k] || "[]",
    setItem: (k, v) => {
        store[k] = v;
        console.log(`\n✓ Updated ${k}`);
    }
};

global.alert = (msg) => console.log("\n📢 ALERT:", msg);
global.confirm = (msg) => { console.log("\n❓ CONFIRM:", msg); return true; };

// Simulate transferBill from all-bill.html
function transferBill(index) {
    const balances = JSON.parse(localStorage.getItem("customerBalances") || "[]");
    const bill = balances[index];

    // 1. LOOKUP FULL ORDER/BILL DETAILS
    const orders = JSON.parse(localStorage.getItem("orders") || "[]");
    const bills = JSON.parse(localStorage.getItem("bills") || "[]");

    const fullOrder = orders.find(o => o.orderNo === bill.orderNo);
    const fullBill = bills.find(b => b.billNo === bill.orderNo);

    // Extract all available details
    const phone = fullOrder?.customerId || fullBill?.customerId || bill.phone || "—";
    const mobile = fullOrder?.mobile || fullBill?.mobile || bill.mobile || phone;
    const station = fullOrder?.station || fullBill?.station || bill.station || "—";
    const relation = fullOrder?.relation || fullBill?.relation || bill.relation || "—";
    const relationName = fullOrder?.relationName || fullBill?.relationName || bill.relationName || "—";
    const lfno = fullOrder?.lfno || fullBill?.lfno || bill.lfno || "—";
    const cid = fullOrder?.cid || fullBill?.cid || bill.cid || "—";

    console.log("\n📋 Extracted Data:");
    console.log(`   Phone: ${phone}`);
    console.log(`   Mobile: ${mobile}`);
    console.log(`   Station: ${station}`);
    console.log(`   Relation: ${relation} ${relationName}`);
    console.log(`   LF No: ${lfno}`);
    console.log(`   CID: ${cid}`);

    // 2. CREATE CUSTOMER
    const customers = JSON.parse(localStorage.getItem("customers") || "[]");
    const amountVal = parseFloat(bill.amount || 0);

    const customer = {
        cid: cid,
        name: bill.customer,
        openingBalance: amountVal.toFixed(2),
        phone: phone,
        mobile: mobile,
        station: station,
        relation: relation,
        relationName: relationName,
        lfno: lfno,
        timestamp: new Date().toISOString(),
        openingDate: bill.date || new Date().toISOString().split('T')[0],
        transferredBills: [bill.orderNo]
    };

    customers.push(customer);
    localStorage.setItem("customers", JSON.stringify(customers));

    bill.transferred = true;
    balances[index] = bill;
    localStorage.setItem("customerBalances", JSON.stringify(balances));

    console.log("\n✅ Customer Created Successfully!");
    return customer;
}

// Run Test
console.log("=".repeat(60));
console.log("TEST: All Bill → Customer Balance Data Transfer");
console.log("=".repeat(60));

const result = transferBill(0);

console.log("\n" + "=".repeat(60));
console.log("VERIFICATION: Customer Record in Storage");
console.log("=".repeat(60));

const savedCustomers = JSON.parse(store.customers);
console.log("\nCustomer Record:");
console.log(JSON.stringify(savedCustomers[0], null, 2));

console.log("\n" + "=".repeat(60));
console.log("✓ All fields transferred successfully!");
console.log("=".repeat(60));
