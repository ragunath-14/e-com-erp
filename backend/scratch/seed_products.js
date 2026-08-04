const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crackers-shop';

const sampleCategories = [
  { _id: new mongoose.Types.ObjectId('69f4488eac775ce401236101'), name: 'Sparklers', icon: '✨' },
  { _id: new mongoose.Types.ObjectId('69f4488eac775ce401236102'), name: 'Flower Pots', icon: '🌸' },
  { _id: new mongoose.Types.ObjectId('69f4488eac775ce401236103'), name: 'Rockets', icon: '🚀' },
  { _id: new mongoose.Types.ObjectId('69f4488eac775ce401236104'), name: 'Ground Chakkars', icon: '🎡' },
  { _id: new mongoose.Types.ObjectId('69f4488eac775ce401236105'), name: 'Novelties', icon: '🎭' },
  { _id: new mongoose.Types.ObjectId('69f4488eac775ce401236106'), name: 'Gift Boxes', icon: '🎁' }
];

const sampleProducts = [
  {
    _id: new mongoose.Types.ObjectId('69f447ec52d32cd07821f491'),
    name: '10cm Sparklers (Red)',
    brand: 'Standard',
    sku: 'SPK-10R',
    category: 'Sparklers',
    buyingPrice: 15,
    sellingPrice: 35,
    stock: 200,
    unit: '10 Pcs Box',
    hasOffer: true,
    discountType: 'percentage',
    discountValue: 10,
    offerLabel: 'Diwali Special',
    barcode: '8901234567890'
  },
  {
    _id: new mongoose.Types.ObjectId('69f447ec52d32cd07821f492'), // Matched from order
    name: 'Big Flower Pots',
    brand: 'Ayyan',
    sku: 'FP-BIG',
    category: 'Flower Pots',
    buyingPrice: 45,
    sellingPrice: 110,
    stock: 150,
    unit: '10 Pcs Box',
    hasOffer: false,
    barcode: '8901234567891'
  },
  {
    _id: new mongoose.Types.ObjectId('69f447ec52d32cd07821f493'),
    name: '7 Shot Rockets',
    brand: 'Standard',
    sku: 'RCK-7S',
    category: 'Rockets',
    buyingPrice: 80,
    sellingPrice: 220,
    stock: 80,
    unit: '5 Pcs Pack',
    hasOffer: true,
    discountType: 'flat',
    discountValue: 20,
    offerLabel: 'Best Seller',
    barcode: '8901234567892'
  },
  {
    _id: new mongoose.Types.ObjectId('69f447ec52d32cd07821f494'),
    name: 'Ground Chakkar Big',
    brand: 'Sony',
    sku: 'GC-BIG',
    category: 'Ground Chakkars',
    buyingPrice: 30,
    sellingPrice: 85,
    stock: 120,
    unit: '10 Pcs Box',
    hasOffer: false,
    barcode: '8901234567893'
  },
  {
    _id: new mongoose.Types.ObjectId('69f447ec52d32cd07821f495'),
    name: 'Fancy Peacock (Novelty)',
    brand: 'Sri Saravana',
    sku: 'NVL-PCK',
    category: 'Novelties',
    buyingPrice: 120,
    sellingPrice: 280,
    stock: 50,
    unit: '1 Pc',
    hasOffer: true,
    discountType: 'percentage',
    discountValue: 15,
    offerLabel: 'Limited Edition',
    barcode: '8901234567894'
  },
  {
    _id: new mongoose.Types.ObjectId('69f447ec52d32cd07821f496'), // Matched from order
    name: 'Kids Combo Gift Box',
    brand: 'Standard',
    sku: 'GFT-KID',
    category: 'Gift Boxes',
    buyingPrice: 450,
    sellingPrice: 950,
    stock: 30,
    unit: '1 Large Box',
    hasOffer: false,
    barcode: '8901234567895'
  },
  {
    _id: new mongoose.Types.ObjectId('69f447ec52d32cd07821f497'),
    name: 'Twinkling Stars (Gold)',
    brand: 'Standard',
    sku: 'SPK-TSG',
    category: 'Sparklers',
    buyingPrice: 20,
    sellingPrice: 45,
    stock: 180,
    unit: '10 Pcs Box',
    hasOffer: false,
    barcode: '8901234567896'
  },
  {
    _id: new mongoose.Types.ObjectId('69f447ec52d32cd07821f498'),
    name: 'Mega Rockets (12 Pcs)',
    brand: 'Ayyan',
    sku: 'RCK-MG12',
    category: 'Rockets',
    buyingPrice: 150,
    sellingPrice: 380,
    stock: 60,
    unit: '12 Pcs Pack',
    hasOffer: true,
    discountType: 'percentage',
    discountValue: 20,
    offerLabel: 'Family Pack',
    barcode: '8901234567897'
  },
  {
    _id: new mongoose.Types.ObjectId('69f447ec52d32cd07821f499'),
    name: 'Tri-Colour Flower Pots',
    brand: 'Sony',
    sku: 'FP-TRI',
    category: 'Flower Pots',
    buyingPrice: 55,
    sellingPrice: 140,
    stock: 90,
    unit: '10 Pcs Box',
    hasOffer: true,
    discountType: 'flat',
    discountValue: 10,
    barcode: '8901234567898'
  },
  {
    _id: new mongoose.Types.ObjectId('69f447ec52d32cd07821f500'),
    name: 'Digital Ground Chakkar',
    brand: 'Sri Saravana',
    sku: 'GC-DIGI',
    category: 'Ground Chakkars',
    buyingPrice: 40,
    sellingPrice: 95,
    stock: 110,
    unit: '10 Pcs Box',
    hasOffer: false,
    barcode: '8901234567899'
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB:', MONGO_URI);

    // Clear existing
    await Product.deleteMany({});
    await Category.deleteMany({});
    console.log('Cleared existing data');

    // Insert
    await Category.insertMany(sampleCategories);
    await Product.insertMany(sampleProducts);
    
    console.log('Sample categories and products seeded successfully with STABLE IDs!');
    process.exit();
  } catch (err) {
    console.error('Error seeding DB:', err);
    process.exit(1);
  }
};

seedDB();
