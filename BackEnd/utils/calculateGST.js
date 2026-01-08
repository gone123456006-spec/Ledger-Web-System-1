/**
 * Calculate GST amounts
 * @param {Number} amount - Base amount
 * @param {Number} gstRate - GST rate percentage
 * @param {Boolean} isSameState - Whether transaction is within same state
 * @returns {Object} Object containing CGST, SGST, IGST and total amounts
 */
const calculateGST = (amount, gstRate = 3, isSameState = true) => {
  const gstAmount = (amount * gstRate) / 100;

  if (isSameState) {
    // Intra-state: Split equally into CGST and SGST
    return {
      cgst: gstAmount / 2,
      sgst: gstAmount / 2,
      igst: 0,
      totalGst: gstAmount,
      totalAmount: amount + gstAmount,
    };
  } else {
    // Inter-state: Full amount as IGST
    return {
      cgst: 0,
      sgst: 0,
      igst: gstAmount,
      totalGst: gstAmount,
      totalAmount: amount + gstAmount,
    };
  }
};

module.exports = calculateGST;

