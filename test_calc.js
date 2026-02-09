
// Mock minimal DOM structure
const tr = {
    cells: {
        7: { querySelector: () => ({ value: "15000" }) }, // Rate
        9: { querySelector: () => ({ value: "1" }) },     // Adj Wt
        12: { querySelector: () => ({ value: "16000" }) }, // Cur Rate
        13: { querySelector: () => ({ value: "0" }) }      // Diff
    }
};

function calcDiff(inputMock) {
    // Get live values from DOM
    const bookedRate = parseFloat(tr.cells[7].querySelector('input').value) || 0;
    const adjWtInput = tr.cells[9].querySelector('input');
    const curRateInput = tr.cells[12].querySelector('input');
    const diffInput = tr.cells[13].querySelector('input');

    const adjWt = parseFloat(adjWtInput.value) || 0;
    const curRate = parseFloat(curRateInput.value) || 0;

    console.log(`Inputs: Rate=${bookedRate}, AdjWt=${adjWt}, CurRate=${curRate}`);

    // NEW Formula: (Current Rate - Rate Book Rate) × Adj Wt
    const rateDiff = curRate - bookedRate;
    const diff = rateDiff * adjWt;

    console.log(`Calculation: (${curRate} - ${bookedRate}) * ${adjWt} = ${diff}`);

    return diff.toFixed(2);
}

// Test Case 1
console.log("Test 1: Rate=15000, AdjWt=1, CurRate=16000");
console.log("Result:", calcDiff());

// Test Case 2: Change Rate
console.log("\nTest 2: Rate=14000");
tr.cells[7].querySelector = () => ({ value: "14000" });
console.log("Result:", calcDiff());

// Test Case 3: Zero Adj Wt
console.log("\nTest 3: AdjWt=0");
tr.cells[9].querySelector = () => ({ value: "0" });
console.log("Result:", calcDiff());
