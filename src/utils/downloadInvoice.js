import jsPDF from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';
import JsBarcode from 'jsbarcode';
import { getOrderBreakdown } from './orderBreakdown';

applyPlugin(jsPDF);

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const getOrderNumber = (order) => order.orderNumber || order.orderId || order._id || 'ORDER';

const getBarcodeCanvas = (value) => {
  try {
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, String(value), {
      format: 'CODE128',
      displayValue: true,
      fontSize: 11,
      height: 36,
      width: 1.5,
      margin: 2,
      background: '#ffffff',
      lineColor: '#1e293b',
    });
    return canvas;
  } catch {
    return null;
  }
};

export const downloadInvoice = (order) => {
  try {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const m = 14;
    const cw = pw - 2 * m;

    const PRIMARY = '#db2777';
    const PRIMARY_D = '#9d174d';
    const PRIMARY_L = '#fdf2f8';
    const DARK = '#1e293b';
    const GRAY = '#64748b';
    const WHITE = '#ffffff';
    const BORDER = '#f1f5f9';
    const ACCENT = '#fbcfe8';

    const bold = (size) => { doc.setFont('helvetica', 'bold'); doc.setFontSize(size); };
    const normal = (size) => { doc.setFont('helvetica', 'normal'); doc.setFontSize(size); };
    const wrap = (text, maxW) => (text ? doc.splitTextToSize(String(text), maxW) : ['']);
    const fitsOnPage = (extra) => y + extra < ph - m;

    const orderNumber = getOrderNumber(order);
    const paymentLabel = (order.paymentStatus || '').toUpperCase() === 'PAID'
      ? 'Paid'
      : (order.paymentMethod || '').toLowerCase() === 'cod'
        ? 'COD'
        : order.paymentMethod || 'N/A';

    let y = m;

    // ===== TOP GRADIENT BAND =====
    doc.setFillColor(PRIMARY);
    doc.rect(0, 0, pw, 3.5, 'F');
    doc.setFillColor(PRIMARY_D);
    doc.rect(0, 3.5, pw, 1, 'F');

    // ===== HEADER =====
    y += 4;
    doc.setTextColor(DARK);
    bold(20);
    doc.text('CHOOSEMOOD', m, y + 4);
    normal(7);
    doc.setTextColor(GRAY);
    doc.text('Style That Speaks', m, y + 8);

    doc.setFillColor(PRIMARY_L);
    doc.setDrawColor(PRIMARY);
    doc.setLineWidth(0.3);
    doc.roundedRect(pw - m - 56, y - 1, 56, 12, 3, 3, 'FD');
    doc.setTextColor(PRIMARY_D);
    bold(13);
    doc.text('TAX INVOICE', pw - m - 4, y + 7, { align: 'right' });

    y += 15;
    doc.setDrawColor(PRIMARY);
    doc.setLineWidth(0.5);
    doc.line(m, y, pw - m, y);
    y += 5;

    // ===== META INFO STRIP =====
    const metaCardH = 19;
    const metaRows = [
      ['INVOICE NO', `INV-${orderNumber}`],
      ['INVOICE DATE', formatDate(order.createdAt)],
      ['ORDER NO', orderNumber],
      ['PAYMENT', paymentLabel],
    ];
    doc.setFillColor(PRIMARY_L);
    doc.setDrawColor(ACCENT);
    doc.setLineWidth(0.3);
    doc.roundedRect(m, y, cw, metaCardH, 2.5, 2.5, 'FD');
    const colW = cw / 4;
    metaRows.forEach(([label, value], i) => {
      const cx = m + colW * i + colW / 2;
      if (i > 0) {
        doc.setDrawColor(ACCENT);
        doc.setLineWidth(0.3);
        doc.line(m + colW * i, y + 3, m + colW * i, y + metaCardH - 3);
      }
      normal(5.5);
      doc.setTextColor(GRAY);
      doc.text(label, cx, y + 5.5, { align: 'center' });
      bold(6.8);
      doc.setTextColor(i === 3 && paymentLabel.toLowerCase() === 'paid' ? '#16a34a' : DARK);
      const valLines = wrap(value, colW - 8);
      doc.text(valLines[0], cx, y + 12, { align: 'center' });
      if (valLines[1]) {
        normal(6);
        doc.text(valLines[1], cx, y + 16, { align: 'center' });
      }
    });

    y += metaCardH + 5;

    // ===== SELLER & BILL TO CARDS =====
    const addr = order.shippingAddress || {};
    const half = cw / 2 - 3;
    const wrapW = half - 10;

    const drawInfoCard = (x, w, title, lines, { boldFirst = true } = {}) => {
      const wrapped = lines.flatMap((l, i) => {
        if (i === 0 && boldFirst) return wrap(l, wrapW).map((t, j) => (j === 0 ? t : t));
        return wrap(l, wrapW);
      });
      const h = 4 + 4.5 + 3 + wrapped.length * 4.6 + 4;
      doc.setFillColor(WHITE);
      doc.setDrawColor(BORDER);
      doc.setLineWidth(0.3);
      doc.roundedRect(x, y, w, h, 2.5, 2.5, 'FD');
      bold(7);
      doc.setTextColor(PRIMARY_D);
      doc.text(title.toUpperCase(), x + 4, y + 5.5);
      doc.setDrawColor(PRIMARY);
      doc.setLineWidth(0.6);
      doc.line(x + 4, y + 7, x + 4 + 28, y + 7);
      let ty = y + 4 + 4.5 + 3;
      wrapped.forEach((l, i) => {
        if (i === 0 && boldFirst) {
          bold(6.5);
          doc.setTextColor(DARK);
        } else {
          normal(6.2);
          doc.setTextColor(GRAY);
        }
        doc.text(l, x + 4, ty + i * 4.6);
      });
      return h;
    };

    const sLines = [
      'CHOOSEMOOD FASHION',
      '123, Fashion Street',
      'Indore - 452001, Madhya Pradesh',
      'GSTIN: 23ABCDE1234F1Z5',
      'support@choosemood.in  |  +91 98765 43210',
    ];
    const bLines = [
      addr.fullName || 'N/A',
      addr.addressLine1,
      addr.addressLine2,
      addr.city && addr.pincode ? `${addr.city} - ${addr.pincode}` : addr.pincode ? `Pincode: ${addr.pincode}` : addr.city || '',
      `Phone: ${addr.phoneNumber || 'N/A'}`,
      `Email: ${addr.email || ''}`,
    ].filter(Boolean);

    const sellerH = drawInfoCard(m, half, 'Sold By', sLines);
    drawInfoCard(pw / 2 + 3, half, 'Bill To', bLines);
    y += sellerH + 5;

    // ===== SHIP TO CARD =====
    const shipLines = [
      addr.fullName || 'N/A',
      addr.addressLine1,
      addr.addressLine2,
      [addr.city, addr.state].filter(Boolean).join(', ') + (addr.pincode ? ' - ' + addr.pincode : ''),
    ].filter(Boolean);
    const shipW = cw - 10;
    const shipWrapped = shipLines.flatMap((l, i) => wrap(l, shipW));
    const shipH = 4 + 4.5 + 3 + shipWrapped.length * 4.6 + 4;
    doc.setFillColor(WHITE);
    doc.setDrawColor(BORDER);
    doc.setLineWidth(0.3);
    doc.roundedRect(m, y, cw, shipH, 2.5, 2.5, 'FD');
    bold(7);
    doc.setTextColor(PRIMARY_D);
    doc.text('SHIP TO', m + 4, y + 5.5);
    doc.setDrawColor(PRIMARY);
    doc.setLineWidth(0.6);
    doc.line(m + 4, y + 7, m + 4 + 28, y + 7);
    let ty = y + 4 + 4.5 + 3;
    shipWrapped.forEach((l, i) => {
      if (i === 0) { bold(6.5); doc.setTextColor(DARK); }
      else { normal(6.2); doc.setTextColor(GRAY); }
      doc.text(l, m + 4, ty + i * 4.6);
    });
    y += shipH + 6;

    // ===== ITEMS TABLE =====
    const rawItems = order.items || order.products || [];
    const items = rawItems.map((item) => {
      const name = item.name || item.product?.name || 'Item';
      const size = item.size || 'Free';
      const qty = item.quantity || item.qty || 1;
      const price = item.price || item.product?.price || 0;
      const amount = Number(price) * Number(qty);
      return [
        `${name} (${size})`,
        qty,
        `Rs. ${Math.round(Number(price))}`,
        `Rs. ${Math.round(amount)}`,
      ];
    });

    if (items.length) {
      if (!fitsOnPage(50)) {
        doc.addPage();
        y = m;
      }
      const col0 = 8;
      const col2 = 20;
      const col34 = 30;
      doc.autoTable({
        head: [['#', 'Description', 'Qty', 'Unit Price', 'Total']],
        body: items.map((row, i) => [i + 1, ...row]),
        startY: y,
        margin: { left: m, right: m },
        headStyles: {
          fillColor: PRIMARY,
          textColor: WHITE,
          fontStyle: 'bold',
          fontSize: 7,
          halign: 'center',
        },
        bodyStyles: { fontSize: 6.8, textColor: DARK },
        alternateRowStyles: { fillColor: PRIMARY_L },
        columnStyles: {
          0: { cellWidth: col0, halign: 'center' },
          1: { cellWidth: cw - col0 - col2 - col34 * 2, halign: 'left' },
          2: { cellWidth: col2, halign: 'center' },
          3: { cellWidth: col34, halign: 'right' },
          4: { cellWidth: col34, halign: 'right' },
        },
        theme: 'grid',
        tableLineColor: '#fecdd3',
        tableLineWidth: 0.2,
      });
      y = doc.lastAutoTable.finalY + 5;
    } else {
      y += 7;
    }

    // ===== AMOUNT IN WORDS =====
    const { subtotal: subtotalVal, platformFee: platformFeeVal, delivery: deliveryVal, couponDiscount: couponDiscountVal, walletDiscount: walletDiscountVal, grandTotal } = getOrderBreakdown(order);

    doc.setDrawColor(ACCENT);
    doc.setLineWidth(0.3);
    doc.line(m, y, pw - m, y);
    y += 3;

    normal(6.3);
    doc.setTextColor(GRAY);
    const words = numberToWords(Math.round(grandTotal));
    doc.text(`Amount in Words: Rupees ${words} Only`, m, y);
    y += 5;
    normal(5.5);
    doc.setTextColor(GRAY);
    doc.text('* Prices are inclusive of all taxes (GST).', m, y);
    y += 4;

    // ===== TOTALS TABLE =====
    const tW = 72;
    const tX = pw - m - tW;
    const totalRows = [
      ['Subtotal', `Rs. ${Math.round(subtotalVal)}`],
      ['Platform Fee', platformFeeVal > 0 ? `Rs. ${Math.round(platformFeeVal)}` : 'FREE'],
      ['Delivery Charges', deliveryVal > 0 ? `Rs. ${Math.round(deliveryVal)}` : 'FREE'],
    ];
    if (couponDiscountVal > 0) {
      totalRows.push(['Coupon Discount', `- Rs. ${Math.round(couponDiscountVal)}`]);
    }
    if (walletDiscountVal > 0) {
      totalRows.push(['Wallet Redemption', `- Rs. ${Math.round(walletDiscountVal)}`]);
    }

    if (!fitsOnPage(30)) {
      doc.addPage();
      y = m;
    }
    doc.autoTable({
      body: totalRows,
      foot: [['Grand Total', `Rs. ${Math.round(grandTotal)}`]],
      startY: y,
      margin: { left: tX, right: m },
      bodyStyles: { fontSize: 6.8, textColor: GRAY },
      footStyles: { fontSize: 10, fontStyle: 'bold', fillColor: PRIMARY, textColor: WHITE },
      columnStyles: {
        0: { cellWidth: tW * 0.52, halign: 'left' },
        1: { cellWidth: tW * 0.48, halign: 'right' },
      },
      theme: 'grid',
      tableLineColor: '#fecdd3',
      tableLineWidth: 0.2,
    });
    y = doc.lastAutoTable.finalY + 8;

    // ===== BARCODE =====
    const barcodeCanvas = getBarcodeCanvas(orderNumber);
    if (barcodeCanvas) {
      if (!fitsOnPage(28)) {
        doc.addPage();
        y = m;
      }
      doc.setFillColor(PRIMARY_L);
      doc.setDrawColor(ACCENT);
      doc.setLineWidth(0.3);
      doc.roundedRect(pw / 2 - 45, y, 90, 24, 2.5, 2.5, 'FD');
      normal(5.5);
      doc.setTextColor(GRAY);
      doc.text('SCAN TO VERIFY ORDER', pw / 2, y + 4.5, { align: 'center' });
      const bw = 62;
      const bh = bw * (barcodeCanvas.height / barcodeCanvas.width);
      doc.addImage(barcodeCanvas.toDataURL('image/png'), 'PNG', (pw - bw) / 2, y + 6.5, bw, bh);
      bold(6.5);
      doc.setTextColor(DARK);
      doc.text(orderNumber, pw / 2, y + 21.5, { align: 'center' });
      y += 28;
    } else {
      y += 6;
    }

    // ===== SIGNATURES =====
    if (!fitsOnPage(30)) {
      doc.addPage();
      y = m;
    }
    doc.setDrawColor(BORDER);
    doc.setLineWidth(0.3);
    doc.line(m, y, pw - m, y);
    y += 5;

    // ===== FOOTER =====
    doc.setDrawColor(ACCENT);
    doc.setLineWidth(0.4);
    doc.line(m, y, pw - m, y);
    y += 4;

    doc.setFillColor(PRIMARY_L);
    doc.roundedRect(m, y, cw, 13, 2.5, 2.5, 'FD');
    normal(6);
    doc.setTextColor(GRAY);
    doc.text('CHOOSEMOOD FASHION | 123, Fashion Street, Indore - 452001 | support@choosemood.in | +91 98765 43210', pw / 2, y + 4, { align: 'center' });
    normal(5.5);
    doc.text('Thank you for shopping with CHOOSEMOOD! This is a computer-generated invoice. GSTIN: 23ABCDE1234F1Z5', pw / 2, y + 8.5, { align: 'center' });
    y += 13;

    doc.setFillColor(PRIMARY);
    doc.rect(0, ph - 2, pw, 2, 'F');
    doc.setFillColor(PRIMARY_D);
    doc.rect(0, ph - 3.2, pw, 1.2, 'F');

    doc.save(`Invoice_${orderNumber}.pdf`);
  } catch {
    // Error handled silently - invoice download failed
  }
};

const numberToWords = (num) => {
  const n = Math.round(num);
  if (n === 0) return 'Zero';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const convert = (x) => {
    if (x < 20) return ones[x];
    if (x < 100) return tens[Math.floor(x / 10)] + (x % 10 ? ' ' + ones[x % 10] : '');
    if (x < 1000) return ones[Math.floor(x / 100)] + ' Hundred' + (x % 100 ? ' ' + convert(x % 100) : '');
    if (x < 100000) return convert(Math.floor(x / 1000)) + ' Thousand' + (x % 1000 ? ' ' + convert(x % 1000) : '');
    return convert(Math.floor(x / 100000)) + ' Lakh' + (x % 100000 ? ' ' + convert(x % 100000) : '');
  };
  return convert(n);
};
