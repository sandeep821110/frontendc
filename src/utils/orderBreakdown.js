export const DELIVERY_FEE = 20;
export const FREE_DELIVERY_THRESHOLD = 500;

export const getOrderBreakdown = (order) => {
  const items = order?.items || order?.products || [];
  const computedSubtotal = items.reduce(
    (sum, i) => sum + Number(i.price || i.product?.price || 0) * Number(i.quantity || i.qty || 1),
    0
  );
  const storedSubtotal = Number(order?.itemsPrice);
  const subtotal = storedSubtotal > 0 ? storedSubtotal : computedSubtotal;

  const platformFee = Number(order?.platformFee || 0);
  const couponDiscount = Number(order?.couponDiscount || 0);
  const walletDiscount = Number(order?.walletDiscount || 0);

  const hasShipping = Number(order?.shippingPrice) > 0;
  let delivery;
  if (subtotal > FREE_DELIVERY_THRESHOLD) {
    delivery = 0;
  } else {
    delivery = hasShipping ? Number(order?.shippingPrice) : DELIVERY_FEE;
  }

  const grandTotal = subtotal + delivery + platformFee - couponDiscount - walletDiscount;

  return { subtotal, platformFee, delivery, couponDiscount, walletDiscount, grandTotal };
};
