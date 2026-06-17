import jsPDF from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';

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

export const downloadInvoice = (order) => {
  try {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const m = 15;
    const cw = pw - 2 * m;

    const PRIMARY = '#0ea5e9';
    const DARK = '#1e293b';
    const GRAY = '#64748b';
    const LIGHT = '#f8fafc';
    const WHITE = '#ffffff';
    const BORDER = '#cbd5e1';

    const bold = (size) => { doc.setFont('helvetica', 'bold'); doc.setFontSize(size); };
    const normal = (size) => { doc.setFont('helvetica', 'normal'); doc.setFontSize(size); };

    const wrap = (text, maxW) => {
      if (!text) return [''];
      return doc.splitTextToSize(String(text), maxW);
    };

    const fitsOnPage = (extra) => y + extra < ph - m;

    let y = m;

    // ===== TOP BAR =====
    doc.setFillColor(PRIMARY);
    doc.rect(0, 0, pw, 3, 'F');

    // ===== HEADER =====
    y += 4;
    doc.setTextColor(DARK);
    bold(22);
    doc.text('CHOOSEMOOD', m, y + 5);
    normal(7);
    doc.setTextColor(GRAY);
    doc.text('Style That Speaks', m, y + 10);

    doc.setTextColor(DARK);
    bold(16);
    doc.text('TAX INVOICE', pw - m, y + 5, { align: 'right' });

    doc.setDrawColor(BORDER);
    doc.setLineWidth(0.4);
    doc.line(m, y + 13, pw - m, y + 13);

    y += 17;

    // ===== INVOICE META =====
    doc.setTextColor(GRAY);
    normal(7);
    const metaX = pw - m;
    const paymentLabel = (order.paymentStatus || '').toUpperCase() === 'PAID' ? 'Paid'
      : (order.paymentMethod || '').toLowerCase() === 'cod' ? 'COD'
      : order.paymentMethod || 'N/A';
    const meta = [
      `Invoice No    : INV-${order.orderNumber || order.orderId || order._id}`,
      `Invoice Date : ${formatDate(order.createdAt)}`,
      `Payment         : ${paymentLabel}`,
      `Order No       : ${order.orderNumber || order.orderId || order._id}`,
    ];
    meta.forEach((l, i) => doc.text(l, metaX, y + i * 5, { align: 'right' }));

    y += 22;

    // ===== SELLER & BILL TO =====
    const half = cw / 2 - 3;
    const wrapW = half - 8;
    const addr = order.shippingAddress || {};

    const sNameLines = ['CHOOSEMOOD FASHION'];
    const sInfoLines = [
      '123, Fashion Street',
      'Indore - 452001, Madhya Pradesh',
      'GST: 23ABCDE1234F1Z5',
      'support@choosemood.in',
    ];
    const sInfoWrapped = sInfoLines.flatMap(l => wrap(l, wrapW));

    const bNameWrapped = wrap(addr.fullName || 'N/A', wrapW);
    const bInfoRaw = [
      addr.addressLine1,
      (addr.city ? addr.city + (addr.pincode ? ' - ' + addr.pincode : '') : addr.pincode ? 'Pincode: ' + addr.pincode : ''),
      `Phone: ${addr.phoneNumber || 'N/A'}`,
      `Email: ${addr.email || ''}`,
    ].filter(Boolean);
    const bInfoWrapped = bInfoRaw.flatMap(l => wrap(l, wrapW));

    const hdrH = 6;
    const gap1 = 4;
    const gap2 = 1.5;
    const lh1 = 5;
    const lh2 = 4.5;
    const padB = 3;

    const sellerH = hdrH + gap1 + sNameLines.length * lh1 + gap2 + sInfoWrapped.length * lh2 + padB;
    const billH = hdrH + gap1 + bNameWrapped.length * lh1 + gap2 + bInfoWrapped.length * lh2 + padB;
    const boxH = Math.max(sellerH, billH, 32);

    const drawBox = (x, bw, title, nameWrapped, infoWrapped) => {
      doc.setDrawColor(BORDER);
      doc.setLineWidth(0.4);
      doc.rect(x, y, bw, boxH);

      doc.setFillColor(PRIMARY);
      doc.rect(x, y, bw, hdrH, 'F');
      bold(6.5);
      doc.setTextColor(WHITE);
      doc.text(title, x + 3, y + 4.5);

      let ty = y + hdrH + gap1;
      bold(6.5);
      doc.setTextColor(DARK);
      nameWrapped.forEach((l, i) => doc.text(l, x + 3, ty + i * lh1));

      ty += nameWrapped.length * lh1 + gap2;
      normal(6);
      doc.setTextColor(GRAY);
      infoWrapped.forEach((l, i) => doc.text(l, x + 3, ty + i * lh2));
    };

    drawBox(m, half, 'SELLER', sNameLines, sInfoWrapped);
    drawBox(pw / 2 + 3, half, 'BILL TO', bNameWrapped, bInfoWrapped);

    y += boxH + 5;

    // ===== SHIP TO =====
    const shipRaw = [
      addr.fullName || 'N/A',
      addr.addressLine1,
      addr.addressLine2,
      [addr.city, addr.state].filter(Boolean).join(', ') + (addr.pincode ? ' - ' + addr.pincode : ''),
    ].filter(Boolean);
    const shipWrapped = shipRaw.flatMap(l => wrap(l, cw - 8));
    const shipH = hdrH + gap1 + shipWrapped.length * lh1 + padB;

    doc.setDrawColor(BORDER);
    doc.setLineWidth(0.4);
    doc.rect(m, y, cw, shipH);

    doc.setFillColor(PRIMARY);
    doc.rect(m, y, cw, hdrH, 'F');
    bold(6.5);
    doc.setTextColor(WHITE);
    doc.text('SHIP TO', m + 3, y + 4.5);

    bold(6.5);
    doc.setTextColor(DARK);
    shipWrapped.forEach((l, i) => doc.text(l, m + 3, y + hdrH + gap1 + i * lh1));

    y += shipH + 5;

    // ===== ORDER REFERENCE BAR =====
    doc.setFillColor(PRIMARY);
    doc.rect(m, y, cw, 7, 'F');
    doc.setTextColor(WHITE);
    bold(6.5);

    const colW = cw / 4;
    doc.text(`Order #: ${order.orderNumber || order.orderId || order._id}`, m + 3, y + 5);
    doc.text(`Date: ${formatDate(order.createdAt)}`, m + colW + 3, y + 5);
    doc.text(`Status: ${order.orderStatus || order.status || 'PLACED'}`, m + colW * 2 + 3, y + 5);
    doc.text(`Payment: ${paymentLabel}`, m + colW * 3 + 3, y + 5);

    y += 11;

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
        bodyStyles: { fontSize: 7, textColor: DARK },
        alternateRowStyles: { fillColor: LIGHT },
        columnStyles: {
          0: { cellWidth: 7, halign: 'center' },
          1: { cellWidth: cw * 0.44, halign: 'left' },
          2: { cellWidth: cw * 0.12, halign: 'center' },
          3: { cellWidth: cw * 0.16, halign: 'right' },
          4: { cellWidth: cw * 0.16, halign: 'right' },
        },
        theme: 'grid',
        tableLineColor: BORDER,
        tableLineWidth: 0.2,
      });
      y = doc.lastAutoTable.finalY + 5;
    } else {
      y += 7;
    }

    // ===== AMOUNT IN WORDS =====
    const totalAmount = Number(order.totalAmount || order.total || 0);
    const subtotalVal = items.reduce((s, i) => s + parseFloat(i[3].replace('Rs.', '')), 0);
    const deliveryFee = Math.max(0, totalAmount - subtotalVal);

    doc.setDrawColor(BORDER);
    doc.setLineWidth(0.3);
    doc.line(m, y, pw - m, y);
    y += 3;

    normal(6.5);
    doc.setTextColor(GRAY);
    const words = numberToWords(Math.round(totalAmount));
    doc.text(`Amount in Words: Rupees ${words} Only`, m, y);
    y += 6;

    // ===== TOTALS TABLE =====
    const tW = 70;
    const tX = pw - m - tW;

    doc.autoTable({
      body: [
        ['Subtotal', `Rs. ${Math.round(subtotalVal)}`],
        ['Delivery Charges', deliveryFee > 0 ? `Rs. ${Math.round(deliveryFee)}` : 'FREE'],
      ],
      foot: [['Grand Total', `Rs. ${Math.round(totalAmount)}`]],
      startY: y,
      margin: { left: tX, right: m },
      bodyStyles: { fontSize: 7, textColor: GRAY },
      footStyles: { fontSize: 10, fontStyle: 'bold', fillColor: PRIMARY, textColor: WHITE },
      columnStyles: {
        0: { cellWidth: tW * 0.5, halign: 'left' },
        1: { cellWidth: tW * 0.5, halign: 'right' },
      },
      theme: 'grid',
      tableLineColor: BORDER,
      tableLineWidth: 0.2,
    });
    y = doc.lastAutoTable.finalY + 8;

    // ===== FOOTER =====
    // ===== SIGNATURE + FOOTER =====
    if (!fitsOnPage(35)) {
      doc.addPage();
      y = m;
    }

    doc.setDrawColor(BORDER);
    doc.setLineWidth(0.3);
    doc.line(m, y, pw - m, y);
    y += 5;

    doc.setDrawColor('#94a3b8');
    doc.setLineWidth(0.3);
    doc.line(m, y + 10, m + 60, y + 10);
    normal(6);
    doc.setTextColor(GRAY);
    doc.text('Customer Signature', m, y + 14);

    y += 22;

    doc.setDrawColor(BORDER);
    doc.setLineWidth(0.4);
    doc.line(m, y, pw - m, y);
    y += 4;

    doc.setFillColor(LIGHT);
    doc.rect(m, y, cw, 12, 'F');
    doc.setDrawColor(BORDER);
    doc.setLineWidth(0.3);
    doc.rect(m, y, cw, 12, 'S');

    normal(6);
    doc.setTextColor(GRAY);
    doc.text('CHOOSEMOOD FASHION | 123, Fashion Street, Indore - 452001 | support@choosemood.in', pw / 2, y + 4, { align: 'center' });
    normal(5.5);
    doc.text('Thank you for shopping with CHOOSEMOOD! This is a computer-generated invoice.', pw / 2, y + 9, { align: 'center' });

    doc.setFillColor(PRIMARY);
    doc.rect(0, ph - 2, pw, 2, 'F');

    doc.save(`Invoice_${order.orderNumber || order.orderId || order._id || 'order'}.pdf`);
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
