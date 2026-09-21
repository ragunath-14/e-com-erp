import { describe, it, expect } from 'vitest';
import { getOfferInfo, formatINR } from '../offer';

describe('getOfferInfo', () => {
  it('reports MRP, offer price, savings and percentage for a 90% offer', () => {
    const o = getOfferInfo({ sellingPrice: 240, finalPrice: 24, hasOffer: true, offerLabel: '90% Discount Offer' });
    expect(o).toEqual({
      hasOffer: true, mrp: 240, price: 24, savings: 216, pct: 90, label: '90% Discount Offer',
    });
  });

  it('falls back to a generic label when the product has no offer label', () => {
    expect(getOfferInfo({ sellingPrice: 100, finalPrice: 80, hasOffer: true }).label).toBe('Special Offer');
  });

  it('treats a store-wide discount as an offer even when the product has none of its own', () => {
    const o = getOfferInfo({ sellingPrice: 200, finalPrice: 180, hasOffer: false });
    expect(o.hasOffer).toBe(true);
    expect(o.pct).toBe(10);
  });

  it('reports no offer when the customer pays MRP', () => {
    const o = getOfferInfo({ sellingPrice: 200, finalPrice: 200 });
    expect(o).toEqual({ hasOffer: false, mrp: 200, price: 200, savings: 0, pct: 0, label: '' });
  });
});

describe('formatINR', () => {
  it('uses Indian digit grouping', () => {
    expect(formatINR(54000)).toBe('54,000');
    expect(formatINR(5400)).toBe('5,400');
    expect(formatINR(24)).toBe('24');
  });
});
