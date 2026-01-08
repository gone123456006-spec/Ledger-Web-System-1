const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate PDF for bills/invoices
 * @param {Object} data - Bill/Invoice data
 * @param {String} outputPath - Path to save PDF
 * @returns {Promise} Promise that resolves when PDF is created
 */
const generateBillPDF = (data, outputPath) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(outputPath);

      doc.pipe(stream);

      // Header
      doc
        .fontSize(20)
        .text('INVOICE', 50, 50, { align: 'center' })
        .moveDown();

      // Bill Details
      doc
        .fontSize(10)
        .text(`Bill No: ${data.billNumber}`, 50, 120)
        .text(`Date: ${new Date(data.billDate).toLocaleDateString()}`, 50, 135)
        .text(`Customer: ${data.customer.name}`, 50, 150)
        .moveDown();

      // Items Table Header
      const tableTop = 200;
      doc
        .fontSize(10)
        .text('Item', 50, tableTop)
        .text('Qty', 200, tableTop)
        .text('Rate', 280, tableTop)
        .text('Amount', 400, tableTop, { align: 'right' });

      // Items
      let y = tableTop + 20;
      data.items.forEach(item => {
        doc
          .fontSize(9)
          .text(item.itemName, 50, y)
          .text(item.quantity, 200, y)
          .text(item.rate.toFixed(2), 280, y)
          .text(item.total.toFixed(2), 400, y, { align: 'right' });
        y += 20;
      });

      // Totals
      y += 20;
      doc
        .fontSize(10)
        .text('Subtotal:', 350, y)
        .text(data.subtotal.toFixed(2), 400, y, { align: 'right' });

      y += 20;
      doc
        .text('GST:', 350, y)
        .text(data.totalGst.toFixed(2), 400, y, { align: 'right' });

      y += 20;
      doc
        .fontSize(12)
        .text('Total:', 350, y)
        .text(data.totalAmount.toFixed(2), 400, y, { align: 'right' });

      // Footer
      doc
        .fontSize(8)
        .text('Thank you for your business!', 50, 700, {
          align: 'center',
        });

      doc.end();

      stream.on('finish', () => {
        resolve(outputPath);
      });

      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generateBillPDF };

