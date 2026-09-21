// Adds the products from the 2026 price list that were missing from the DB:
//   the three FAMILY PACKS (108-110, Gift Boxes). (The list has no item #39; numbering just skips it.)
// Idempotent: a product whose name already exists is skipped.
//
//   node scratch/add_missing_products.js            -> dry run
//   node scratch/add_missing_products.js --apply    -> inserts
const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

const STOCK = 400;
const BRAND = 'Sri Krishna Crackers';

const OFFER = { hasOffer: true, offerLabel: '90% Discount Offer', discountType: 'percentage', discountValue: 90 };
const NO_OFFER = { hasOffer: false, offerLabel: '', discountType: 'percentage', discountValue: 0 };

const NEW_PRODUCTS = [
  // Family packs: the list gives one fixed pack price (no MRP / 90% column), so no offer is applied.
  { name: 'Family Pack 33 Items', category: 'Gift Boxes', sellingPrice: 10000, unit: 'Pack', boxContents: ['33 assorted crackers (items)'], ...NO_OFFER },
  { name: 'Family Pack 26 Items', category: 'Gift Boxes', sellingPrice: 5000, unit: 'Pack', boxContents: ['26 assorted crackers (items)'], ...NO_OFFER },
  { name: 'Family Pack 22 Items', category: 'Gift Boxes', sellingPrice: 3000, unit: 'Pack', boxContents: ['22 assorted crackers (items)'], ...NO_OFFER },
];

async function uniqueBarcode() {
  for (;;) {
    const code = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    if (!(await Product.exists({ barcode: code }))) return code;
  }
}

(async () => {
  const apply = process.argv.includes('--apply');
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });

  const toInsert = [];
  for (const p of NEW_PRODUCTS) {
    if (await Product.exists({ name: new RegExp(`^${p.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') })) {
      console.log('Already exists, skipping:', p.name);
      continue;
    }
    toInsert.push({ brand: BRAND, buyingPrice: 0, stock: STOCK, ...p, barcode: await uniqueBarcode() });
  }

  console.log(`${toInsert.length} product(s) to add:`, toInsert.map(p => `${p.name} @ ${p.sellingPrice}`));
  if (!apply) { console.log('Dry run only. Re-run with --apply to insert.'); return; }
  if (toInsert.length) console.log('Inserted:', (await Product.insertMany(toInsert)).length);
})().catch(e => { console.error('ERR', e.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
