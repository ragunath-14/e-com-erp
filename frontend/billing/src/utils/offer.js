// Offer details for the storefront. Works from the values the shop API already
// returns (sellingPrice = MRP, finalPrice = price after any product offer or
// store-wide discount), so a product counts as "on offer" whenever the customer
// actually pays less than MRP.
export function formatINR(n) {
  return Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

export function getOfferInfo(product) {
  const mrp = Number(product?.sellingPrice) || 0;
  const price = Number(product?.finalPrice ?? mrp);
  const savings = Math.max(0, mrp - price);

  if (mrp <= 0 || savings <= 0) {
    return { hasOffer: false, mrp, price: mrp, savings: 0, pct: 0, label: '' };
  }

  return {
    hasOffer: true,
    mrp,
    price,
    savings,
    pct: Math.round((savings / mrp) * 100),
    label: (product.hasOffer && product.offerLabel) || 'Special Offer',
  };
}
