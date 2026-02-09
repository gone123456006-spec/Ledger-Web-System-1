
// Mock localStorage
const localStorageMock = {
    getItem: () => JSON.stringify([{
        id: "123",
        rate: 15000,
        adjWt: 1,
        curRate: 16000,
        balWt: 0.5
    }]),
    setItem: (key, val) => console.log(`localStorage.setItem('${key}', '${val}')`)
};
global.localStorage = localStorageMock;

// Mock function based on ready-extra-order.html
function updateRateBookingRow(inputMock, rateId, field) {
    const val = parseFloat(inputMock.value) || 0;

    try {
        const rates = JSON.parse(localStorage.getItem("rateBook") || "[]");
        const idx = rates.findIndex(r => String(r.id) === String(rateId));

        if (idx >= 0) {
            // Update value
            rates[idx][field] = val;

            // Recalculate Row Diff Amount
            const rate = rates[idx];
            const rateBook = Number(rate.rate) || 0;
            const adjWt = Number(rate.adjWt) || 0;
            const curRate = Number(rate.curRate) || 0;

            console.log(`State: Rate=${rateBook}, AdjWt=${adjWt}, CurRate=${curRate}`);

            // Formula: (Cur.Rate - Rate Book) * Adj Wt
            const diffAmount = (curRate - rateBook) * adjWt;

            console.log(`Calculation: (${curRate} - ${rateBook}) * ${adjWt} = ${diffAmount}`);

            return diffAmount;
        }
    } catch (e) { console.error(e); }
}

// Test Case 1: Change Cur Rate to 16000
console.log("Test 1: Updating Cur Rate to 16000 (Rate=15000, AdjWt=1)");
updateRateBookingRow({ value: "16000" }, "123", "curRate");

// Test Case 2: Change Rate to 14000
console.log("\nTest 2: Updating Rate to 14000 (AdjWt=1, CurRate=16000)");
// Mock updating the rate in storage first as if prompt was used
const rates = JSON.parse(localStorage.getItem("rateBook"));
rates[0].rate = 14000;
localStorage.getItem = () => JSON.stringify(rates);
updateRateBookingRow({ value: "14000" }, "123", "rate");

