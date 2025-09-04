const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, admin } = require('../middleware/authMiddleware');

// Configure multer for category image uploads
const upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    },
});

// Get all categories
router.get('/', async (req, res) => {
    try {
        const Category = require('../models/categoryModel');
        const categories = await Category.find({}).sort({ name: 1 });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get single category
router.get('/:id', async (req, res) => {
    try {
        const Category = require('../models/categoryModel');
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        res.json(category);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get category by slug
router.get('/slug/:slug', async (req, res) => {
    try {
        const Category = require('../models/categoryModel');
        const category = await Category.findOne({ slug: req.params.slug });

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        res.json(category);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Admin routes

// Create category
router.post('/', protect, admin, upload.single('image'), async (req, res) => {
    try {
        const Category = require('../models/categoryModel');
        const cloudinary = require('cloudinary').v2;
        const { name, description, slug } = req.body;

        // Check if category already exists
        const existingCategory = await Category.findOne({ 
            $or: [{ name }, { slug }] 
        });

        if (existingCategory) {
            return res.status(400).json({ 
                message: 'Category with this name or slug already exists' 
            });
        }

        let image = {};
        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'amar-nursery/categories'
            });
            image = {
                public_id: result.public_id,
                url: result.secure_url
            };
        }

        const category = await Category.create({
            name,
            slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
            description,
            image
        });

        res.status(201).json(category);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update category
router.put('/:id', protect, admin, upload.single('image'), async (req, res) => {
    try {
        const Category = require('../models/categoryModel');
        const cloudinary = require('cloudinary').v2;
        
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        const { name, description, slug } = req.body;

        // Check if another category has the same name or slug
        if (name || slug) {
            const existingCategory = await Category.findOne({
                _id: { $ne: req.params.id },
                $or: [
                    ...(name ? [{ name }] : []),
                    ...(slug ? [{ slug }] : [])
                ]
            });

            if (existingCategory) {
                return res.status(400).json({ 
                    message: 'Another category with this name or slug already exists' 
                });
            }
        }

        // Update image if provided
        if (req.file) {
            // Delete old image from cloudinary if exists
            if (category.image && category.image.public_id) {
                await cloudinary.uploader.destroy(category.image.public_id);
            }

            // Upload new image
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'amar-nursery/categories'
            });
            
            category.image = {
                public_id: result.public_id,
                url: result.secure_url
            };
        }

        // Update other fields
        if (name) category.name = name;
        if (description) category.description = description;
        if (slug) category.slug = slug;

        const updatedCategory = await category.save();
        res.json(updatedCategory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete category
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const Category = require('../models/categoryModel');
        const Product = require('../models/productModel');
        const cloudinary = require('cloudinary').v2;
        
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Check if any products are using this category
        const productsCount = await Product.countDocuments({ category: req.params.id });
        if (productsCount > 0) {
            return res.status(400).json({ 
                message: `Cannot delete category. ${productsCount} products are using this category.` 
            });
        }

        // Delete image from cloudinary if exists
        if (category.image && category.image.public_id) {
            await cloudinary.uploader.destroy(category.image.public_id);
        }

        await category.remove();
        res.json({ message: 'Category removed successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get products count for each category
router.get('/stats/products-count', async (req, res) => {
    try {
        const Product = require('../models/productModel');
        const stats = await Product.aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'category'
                }
            },
            {
                $unwind: '$category'
            },
            {
                $project: {
                    _id: '$category._id',
                    name: '$category.name',
                    slug: '$category.slug',
                    count: 1
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
