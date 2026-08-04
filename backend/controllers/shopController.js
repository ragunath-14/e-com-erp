const Product = require('../models/Product');
const Setting = require('../models/Setting');
const { calcFinalPrice } = require('../utils/pricing');

// GET public products for ecommerce storefront (only in-stock items)
exports.getShopProducts = async (req, res) => {
  try {
    const { category, search, sort, page = 1, limit = 12 } = req.query;
    const filter = {};

    if (category && category !== 'All') {
      filter.category = category;
    }

    if (search) {
      filter.$text = { $search: search };
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') sortOption = { sellingPrice: 1 };
    else if (sort === 'price_desc') sortOption = { sellingPrice: -1 };
    else if (sort === 'name_asc') sortOption = { name: 1 };
    else if (sort === 'newest') sortOption = { createdAt: -1 };

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(filter);
    const [products, setting] = await Promise.all([
      Product.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit))
        .select('name brand category sellingPrice stock lowStockThreshold imageUrl hasOffer offerLabel discountType discountValue offerExpiry unit boxContents')
        .lean(),
      Setting.findOne().select('globalDiscount').lean(),
    ]);

    // Compute finalPrice for each product (store-wide discount takes priority over per-product offers)
    const items = products.map(p => ({ ...p, finalPrice: calcFinalPrice(p, setting) }));

    res.json({
      products: items,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET available categories with product counts and icons
exports.getShopCategories = async (req, res) => {
  try {
    const Category = require('../models/Category');
    
    // Get counts from products
    const productCounts = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    // Get metadata from categories
    const categoryMeta = await Category.find({ active: true }).lean();
    
    // Merge
    const result = productCounts.map(pc => {
      const meta = categoryMeta.find(m => m.name === pc._id);
      return {
        name: pc._id,
        count: pc.count,
        icon: meta ? meta.icon : '📦'
      };
    });

    // Add categories that have no products but are defined in Category model (optional)
    categoryMeta.forEach(m => {
      if (!result.find(r => r.name === m.name)) {
        result.push({ name: m.name, count: 0, icon: m.icon });
      }
    });

    res.json(result.sort((a, b) => b.count - a.count));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET shop info (public settings)
exports.getShopInfo = async (req, res) => {
  try {
    const setting = await Setting.findOne().select('shopName address phone email').lean();
    res.json(setting || { shopName: 'Sparkle Crackers Hub', address: '', phone: '', email: '' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET single product detail
exports.getProductDetail = async (req, res) => {
  try {
    const [product, setting] = await Promise.all([
      Product.findById(req.params.id)
        .select('name brand category sellingPrice stock lowStockThreshold imageUrl hasOffer offerLabel discountType discountValue offerExpiry unit boxContents')
        .lean(),
      Setting.findOne().select('globalDiscount').lean(),
    ]);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    res.json({ ...product, finalPrice: calcFinalPrice(product, setting) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
