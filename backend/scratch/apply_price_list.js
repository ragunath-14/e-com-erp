// Applies "Sri Krishna Crackers - Price List 2026 (90% discount)" to existing products:
//   sellingPrice = MRP, offer = 90% off, stock = 400.
// Products not on the priced list (e.g. generic "Flower Pots") only get their stock updated.
//
//   node scratch/apply_price_list.js            -> dry run, prints what would change
//   node scratch/apply_price_list.js --apply    -> writes changes (saves a backup JSON first)
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

const STOCK = 400;
const DISCOUNT_PCT = 90;
const OFFER_LABEL = '90% Discount Offer';

// [name as printed on the price list, MRP]
const PRICE_LIST = [
  ["4'' LAKSHMI DELUXE CRACKERS", 240], ["4'' LAKSHMI GOLD CRACKERS", 400], ["5'' JALLIKATTU", 640],
  ['3 ½ LAKSHMI', 140], ['2 ¾ KURUVI', 110], ['RED BIJILI', 430], ['28 CHORSA', 180],
  ['24 DELUXE', 600], ['48 DELUXE', 1280],
  ['HYDRO BOMB GREEN', 900], ['KING OF KING GREEN', 1100], ['CLASSIC BOMB', 1300],
  ['GROUND CHAKKAR BIG (25 PCS)', 560], ['GROUND CHAKKAR SPECIAL', 1050], ['GROUND CHAKKAR DELUXE', 2000],
  ['SPINNER SPECIAL', 1200], ['SPINNER DELUXE', 1320], ['WIRE CHAKKAR', 2000],
  ['FLOWER POTS BIG', 900], ['FLOWER POTS SPECIAL', 1220], ['FLOWER POTS ASHOKA', 1680], ['FLOWER POTS GIANT', 1500],
  ['COLOUR KOTI', 2700], ['COLOUR KOTI DELUXE', 4640], ['TRY COLOUR', 2450],
  ['1 ½ TWINKLING STARS', 330], ["4'' TWINKLING STARS", 600],
  ['BUTTERFLY', 800], ['DRONE', 1300], ['HELICOPTER', 1000], ['BAMPARAM', 1000],
  ['COLOUR SMOKE', 1700], ['WATERMELON', 2600], ['EXPRESS', 3300], ['PANDA', 2700], ['SIMBA', 2700],
  ['TIMEPASS', 2700], ['CONE', 2840],
  ['PINK PANTHER', 1800], ['HIGH VOULTAGE SILVER CRACKLING', 2100], ['4 in1 RAIN SERIES', 1600],
  ['KING STAR', 3300], ['STAR LIGHT', 900], ['MOON LIGHT', 900], ['LAILA MAJNU', 900],
  ['MINI SIREN (5 PCS)', 2240], ['SIREN 3 PCS', 2340],
  ['100 WALA', 580], ['600 WALA', 2200], ['1000 WALA', 2300], ['2000 WALA', 4600], ['5000 WALA', 11500], ['10,000 WALA', 23000],
  ['12 STAR COLOUR SHOT', 1700], ['12 SHOT CRAKLING', 2300], ['15 SHOT', 3800], ['30 SHOT', 7200], ['60 SHOT', 14150],
  ['120 SHOT', 27600], ['240 SHOT', 54000], ['30 SHOT MULTI COLOUR', 4500], ['60 SHOT MULTI COLOUR', 9000],
  ['120 SHOT MULTI COLOUR', 18000], ['240 SHOT MULTI COLOUR', 36000],
  ['BERLIN (WHITE)', 1800], ['TAJ MAHAL (RED & GREEN)', 1800], ['GADI SAGAR (YELLOW)', 1800], ['CHARMMAR', 1800], ['PARIS (GREEN)', 1800],
  ['SCRAPPERS (BLUE)', 3600], ['OUTLAWS (YELLOW)', 3600], ['BOOMERS (MULTI COLOUR)', 3600], ['CAPTAINS (RED)', 3600], ['BISONS (GREEN)', 3600],
  ['ASTER (VIOLET COLOUR)', 6000], ['PEONY (PINK COLOUR)', 6000], ['NEPTUNE (BLUE COLOUR)', 6000], ['MISTY (GOLD COLOUR)', 6000],
  ['10 CM ELECTRIC SPARKLERS', 220], ['10 CM COLOUR SPARKLERS', 240], ['10 CM GREEN SPARKLERS', 240], ['10 CM RED SPARKLERS', 270],
  ['12 CM ELECTRIC SPARKLERS', 320], ['12 CM COLOUR SPARKLERS', 360], ['12 CM GREEN SPARKLERS', 360], ['12 CM RED SPARKLERS', 400],
  ['15 CM ELECTRIC SPARKLERS', 420], ['15 CM COLOUR SPARKLERS', 460], ['15 CM GREEN SPARKLERS', 460], ['15 CM RED SPARKLERS', 500],
  ['30 CM ELECTRIC SPARKLERS', 420], ['30 CM COLOUR SPARKLERS', 460], ['30 CM GREEN SPARKLERS', 460], ['30 CM RED SPARKLERS', 500],
  ['50 CM MULTICOLOUR SPARKLERS', 2500],
  ['LITTLE PEACOCK (RED & GREEN)', 1600], ['MEGA PEACOCK MULTI COLOUR', 2000], ['BADA PEACOCK MULTI COLOUR', 4340],
  ['BADA PEACOCK PINK', 5500], ["4'' SET OUT", 55000], ["3'' SET OUT", 40000], ['JELLY BELLY MULTI COLOUR', 6000],
  ['DHANDIYA CELEBRATION (10 X 10)', 40000], ['WHISTLE ROCKET', 1800], ['ROCKET BOMB', 950], ['2 SHOT ROCKET', 1800],
];

// Price-list names that differ from the name stored in the DB (the list misspells VOLTAGE).
const ALIASES = {
  'HIGH VOULTAGE SILVER CRACKLING': 'High Voltage Silver Crackling',
};

const norm = (s) => String(s).toLowerCase().replace(/½/g, '1/2').replace(/¾/g, '3/4').replace(/[^a-z0-9/]/g, '');
const isFamilyPack = (name) => /family\s*pack/i.test(name);

(async () => {
  const apply = process.argv.includes('--apply');
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  const products = await Product.find().lean();

  const byName = new Map(products.map(p => [norm(p.name), p]));
  const updates = [];
  const missingInDb = [];
  const matchedIds = new Set();

  for (const [name, mrp] of PRICE_LIST) {
    const p = byName.get(norm(ALIASES[name] || name));
    if (!p) { missingInDb.push(name); continue; }
    matchedIds.add(String(p._id));
    updates.push({
      _id: p._id, name: p.name,
      before: { sellingPrice: p.sellingPrice, stock: p.stock, hasOffer: p.hasOffer, discountValue: p.discountValue },
      set: {
        sellingPrice: mrp, stock: STOCK,
        hasOffer: true, discountType: 'percentage', discountValue: DISCOUNT_PCT, offerLabel: OFFER_LABEL,
      },
    });
  }
  // Everything not on the priced list (family packs, anything else): stock only.
  const stockOnly = products.filter(p => !matchedIds.has(String(p._id)));
  const unpricedNonPack = stockOnly.filter(p => !isFamilyPack(p.name)).map(p => p.name);

  console.log(`DB products: ${products.length} | priced from list: ${updates.length} | stock-only: ${stockOnly.length}`);
  console.log('Stock-only products:', stockOnly.map(p => p.name));
  console.log('On price list but NOT found in DB:', missingInDb);
  if (unpricedNonPack.length) console.log('Non-family-pack products left unpriced:', unpricedNonPack);
  console.log('Sample changes:', JSON.stringify(updates.slice(0, 3), null, 1));

  if (!apply) { console.log('\nDry run only. Re-run with --apply to write.'); return; }

  const backupFile = path.join(__dirname, `products-backup-${Date.now()}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(products, null, 1));
  console.log('Backup written to', backupFile);

  const ops = [
    ...updates.map(u => ({ updateOne: { filter: { _id: u._id }, update: { $set: u.set } } })),
    ...(stockOnly.length ? [{ updateMany: { filter: { _id: { $in: stockOnly.map(p => p._id) } }, update: { $set: { stock: STOCK } } } }] : []),
  ];
  const res = await Product.bulkWrite(ops);
  console.log('Applied. modified:', res.modifiedCount);
})().catch(e => { console.error('ERR', e.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
