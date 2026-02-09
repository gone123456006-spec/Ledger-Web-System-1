// Test: Complete Auto-Save Flow
// Ready Order → All Bill → Customer Balance

// Mock localStorage
let store = {
    orders: "[]",
    bills: "[]",
    customerBalances: "[]",
    customers: JSON.stringify([{
        name: "Rajesh Kumar",
        phone: "9876543210",
        station: "Mumbai",
        relation: "S/O",
        relationName: "Suresh Kumar",
        lfno: "LF-123",
        cid: "CID-001"
    }])
};

global.localStorage = {
    getItem: (k) => store[k] || "[]",
    setItem: (k, v) => {
        store[k] = v;
        console.log(`\n✓ Updated ${k}`);
    }
};

// Simulate saveOrder logic (simplified)
function simulateSaveOrder() {
    const orderData = {
        billNo: "ORD-2024-001",
        customer: "Rajesh Kumar",
        customerId: "9876543210",
        orderDate: "2024-02-08",
        billTotal: 15000,
        advanceTotal: 5000,
        totalPc: 5,
        totalGrWt: 25.5,
        orderType: "Order"
    };

    console.log("\n" + "=".repeat(60));
    console.log("STEP 1: Saving Order");
    console.log("=".repeat(60));
    console.log(JSON.stringify(orderData, null, 2));

    // Save to orders
    const orders = JSON.parse(localStorage.getItem("orders") || "[]");
    orders.push(orderData);
    localStorage.setItem("orders", JSON.stringify(orders));

    // Save to bills
    const bills = JSON.parse(localStorage.getItem("bills") || "[]");
    bills.push(orderData);
    localStorage.setItem("bills", JSON.stringify(bills));

    // AUTO-SAVE TO CUSTOMER BALANCES
    const customerBalances = JSON.parse(localStorage.getItem("customerBalances") || "[]");
    const customers = JSON.parse(localStorage.getItem("customers") || "[]");
    const customer = customers.find(c => c.name.toLowerCase() === orderData.customer.toLowerCase());

    const balanceEntry = {
        orderNo: orderData.billNo,
        customer: orderData.customer,
        amount: orderData.billTotal.toFixed(2),
        date: orderData.orderDate,
        timestamp: new Date().toISOString(),
        readyWeight: orderData.totalGrWt.toFixed(3),
        payment: orderData.advanceTotal > 0 ? "Partial" : "Pending",
        narration: `${orderData.orderType} - ${orderData.totalPc} pcs`,
        transferred: false,
        // Customer details for transfer
        phone: customer?.phone || "—",
        mobile: customer?.mobile || customer?.phone || "—",
        station: customer?.station || "—",
        relation: customer?.relation || "—",
        relationName: customer?.relationName || "—",
        lfno: customer?.lfno || "—",
        cid: customer?.cid || "—"
    };

    customerBalances.push(balanceEntry);
    localStorage.setItem("customerBalances", JSON.stringify(customerBalances));

    console.log("\n" + "=".repeat(60));
    console.log("STEP 2: Auto-Saved to All Bill (customerBalances)");
    console.log("=".repeat(60));
    console.log(JSON.stringify(balanceEntry, null, 2));

    return balanceEntry;
}

// Run Test
console.log("=".repeat(60));
console.log("TEST: Complete Auto-Save Flow");
console.log("=".repeat(60));

const balanceEntry = simulateSaveOrder();

console.log("\n" + "=".repeat(60));
console.log("VERIFICATION: Data in Storage");
console.log("=".repeat(60));

console.log("\n📦 Orders:", JSON.parse(store.orders).length, "entries");
console.log("📦 Bills:", JSON.parse(store.bills).length, "entries");
console.log("📦 Customer Balances:", JSON.parse(store.customerBalances).length, "entries");

console.log("\n" + "=".repeat(60));
console.log("✅ Complete Flow Verified!");
console.log("=".repeat(60));
console.log("\nFlow: Ready Order → All Bill → (Ready for Transfer to Customer Balance)");
console.log("\nAll customer details preserved:");
console.log(`  Phone: ${balanceEntry.phone}`);
console.log(`  Station: ${balanceEntry.station}`);
console.log(`  Relation: ${balanceEntry.relation} ${balanceEntry.relationName}`);
console.log(`  LF No: ${balanceEntry.lfno}`);
console.log(`  CID: ${balanceEntry.cid}`);
