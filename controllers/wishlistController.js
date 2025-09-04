const Wishlist = require('../models/wishlistModel');
const Product = require('../models/productModel');

// Get user's wishlist
exports.getWishlist = async (req, res) => {
    try {
        let wishlist = await Wishlist.findOne({ user: req.user._id })
            .populate({
                path: 'products.product',
                populate: {
                    path: 'category',
                    select: 'name'
                }
            });

        if (!wishlist) {
            // Create empty wishlist if it doesn't exist
            wishlist = new Wishlist({
                user: req.user._id,
                products: []
            });
            await wishlist.save();
        }

        res.json({
            success: true,
            wishlist: wishlist.products,
            count: wishlist.products.length
        });
    } catch (error) {
        console.error('Get wishlist error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch wishlist'
        });
    }
};

// Add product to wishlist
exports.addToWishlist = async (req, res) => {
    try {
        const { productId } = req.body;

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Find or create user's wishlist
        let wishlist = await Wishlist.findOne({ user: req.user._id });
        
        if (!wishlist) {
            wishlist = new Wishlist({
                user: req.user._id,
                products: []
            });
        }

        // Check if product already exists in wishlist
        const existingProduct = wishlist.products.find(
            item => item.product.toString() === productId
        );

        if (existingProduct) {
            return res.status(400).json({
                success: false,
                message: 'Product already in wishlist'
            });
        }

        // Add product to wishlist
        wishlist.products.push({
            product: productId,
            addedAt: new Date()
        });

        await wishlist.save();

        // Populate the added product for response
        await wishlist.populate({
            path: 'products.product',
            populate: {
                path: 'category',
                select: 'name'
            }
        });

        res.status(201).json({
            success: true,
            message: 'Product added to wishlist',
            wishlist: wishlist.products,
            count: wishlist.products.length
        });
    } catch (error) {
        console.error('Add to wishlist error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add product to wishlist'
        });
    }
};

// Remove product from wishlist
exports.removeFromWishlist = async (req, res) => {
    try {
        const { productId } = req.params;

        const wishlist = await Wishlist.findOne({ user: req.user._id });
        
        if (!wishlist) {
            return res.status(404).json({
                success: false,
                message: 'Wishlist not found'
            });
        }

        // Remove product from wishlist
        wishlist.products = wishlist.products.filter(
            item => item.product.toString() !== productId
        );

        await wishlist.save();

        // Populate remaining products for response
        await wishlist.populate({
            path: 'products.product',
            populate: {
                path: 'category',
                select: 'name'
            }
        });

        res.json({
            success: true,
            message: 'Product removed from wishlist',
            wishlist: wishlist.products,
            count: wishlist.products.length
        });
    } catch (error) {
        console.error('Remove from wishlist error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove product from wishlist'
        });
    }
};

// Clear entire wishlist
exports.clearWishlist = async (req, res) => {
    try {
        const wishlist = await Wishlist.findOne({ user: req.user._id });
        
        if (!wishlist) {
            return res.status(404).json({
                success: false,
                message: 'Wishlist not found'
            });
        }

        wishlist.products = [];
        await wishlist.save();

        res.json({
            success: true,
            message: 'Wishlist cleared successfully',
            wishlist: [],
            count: 0
        });
    } catch (error) {
        console.error('Clear wishlist error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to clear wishlist'
        });
    }
};

// Check if product is in wishlist
exports.checkWishlistStatus = async (req, res) => {
    try {
        const { productId } = req.params;

        const wishlist = await Wishlist.findOne({ user: req.user._id });
        
        const isInWishlist = wishlist ? 
            wishlist.products.some(item => item.product.toString() === productId) : 
            false;

        res.json({
            success: true,
            isInWishlist
        });
    } catch (error) {
        console.error('Check wishlist status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check wishlist status'
        });
    }
};
