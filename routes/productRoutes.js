const express = require('express');
const router = express.Router();
const {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    searchProducts,
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');
const { getUploadMultiple, handleMulterError } = require('../middleware/multer');

// Public routes
router.get('/', getProducts);
router.get('/search', searchProducts);
router.get('/:id', getProduct);

// Protected routes

// Admin routes with proper image upload handling
router.post('/', protect, admin, (req, res) => {
    const uploadMultiple = getUploadMultiple();
    uploadMultiple(req, res, (error) => {
        if (error) {
            return handleMulterError(error, req, res, () => {});
        }
        createProduct(req, res);
    });
});

router.put('/:id', protect, admin, (req, res) => {
    const uploadMultiple = getUploadMultiple();
    uploadMultiple(req, res, (error) => {
        if (error) {
            return handleMulterError(error, req, res, () => {});
        }
        updateProduct(req, res);
    });
});

router.delete('/:id', protect, admin, deleteProduct);

// Get products by category
router.get('/category/:categoryId', async (req, res) => {
    try {
        const Product = require('../models/productModel');
        const pageSize = 12;
        const page = Number(req.query.page) || 1;
        
        const count = await Product.countDocuments({ category: req.params.categoryId });
        const products = await Product.find({ category: req.params.categoryId })
            .populate('category', 'name')
            .limit(pageSize)
            .skip(pageSize * (page - 1));

        res.json({
            products,
            page,
            pages: Math.ceil(count / pageSize),
            totalProducts: count
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Search products
router.get('/search/:keyword', async (req, res) => {
    try {
        const Product = require('../models/productModel');
        const pageSize = 12;
        const page = Number(req.query.page) || 1;
        const keyword = req.params.keyword;
        
        const searchQuery = {
            $or: [
                { name: { $regex: keyword, $options: 'i' } },
                { description: { $regex: keyword, $options: 'i' } }
            ]
        };

        const count = await Product.countDocuments(searchQuery);
        const products = await Product.find(searchQuery)
            .populate('category', 'name')
            .limit(pageSize)
            .skip(pageSize * (page - 1));

        res.json({
            products,
            page,
            pages: Math.ceil(count / pageSize),
            totalProducts: count
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get top rated products
router.get('/top/rated', async (req, res) => {
    try {
        const Product = require('../models/productModel');
        const products = await Product.find({})
            .populate('category', 'name')
            .sort({ rating: -1 })
            .limit(6);

        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
