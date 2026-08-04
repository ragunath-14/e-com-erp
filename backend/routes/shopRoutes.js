const express = require('express');
const router = express.Router();
const {
  getShopProducts, getShopCategories, getShopInfo, getProductDetail
} = require('../controllers/shopController');

router.get('/products', getShopProducts);
router.get('/categories', getShopCategories);
router.get('/info', getShopInfo);
router.get('/products/:id', getProductDetail);

module.exports = router;
