/**
 * Calculate financial year (April to March)
 * @param {Date} date - The date to calculate financial year for
 * @returns {String} Financial year in format "YYYY-YYYY"
 */
const calculateFinancialYear = (date = new Date()) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // JavaScript months are 0-indexed

  if (month >= 4) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
};

module.exports = calculateFinancialYear;

