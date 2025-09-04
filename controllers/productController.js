const Product = require('../models/productModel');
const { deleteImage } = require('../middleware/multer');

// Get all products
exports.getProducts = async (req, res) => {
    try {
        const pageSize = 12;
        const page = Number(req.query.page) || 1;
        const keyword = req.query.keyword
            ? {
                name: {
                    $regex: req.query.keyword,
                    $options: 'i'
                }
            }
            : {};

        const count = await Product.countDocuments({ ...keyword });
        const products = await Product.find({ ...keyword })
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
};

// Get single product
exports.getProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('category', 'name');

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Search products
exports.searchProducts = async (req, res) => {
    try {
        const { q, page = 1, limit = 10 } = req.query;
        
        if (!q || q.trim() === '') {
            return res.status(400).json({ 
                success: false,
                message: 'Search query is required' 
            });
        }

        const searchQuery = q.trim();
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        const skip = (pageNumber - 1) * limitNumber;

        // Create search conditions - Primary focus on plant name
        const searchConditions = {
            name: { $regex: searchQuery, $options: 'i' }
        };

        // Get total count for pagination
        const totalProducts = await Product.countDocuments(searchConditions);

        // Get products with pagination
        const products = await Product.find(searchConditions)
            .populate('category', 'name')
            .sort({ createdAt: -1 }) // Sort by newest first
            .limit(limitNumber)
            .skip(skip);

        res.json({
            success: true,
            products,
            pagination: {
                currentPage: pageNumber,
                totalPages: Math.ceil(totalProducts / limitNumber),
                totalProducts,
                hasNextPage: pageNumber < Math.ceil(totalProducts / limitNumber),
                hasPrevPage: pageNumber > 1
            },
            searchQuery
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// Create product (Admin)
exports.createProduct = async (req, res) => {
    try {
        const { name, description, price, category, stock, careInstructions, image, images } = req.body;
        let productImages = [];

        // Handle uploaded images from Cloudinary middleware
        if (req.files && req.files.length > 0) {
            productImages = req.files.map(file => ({
                public_id: file.filename, // Cloudinary public_id
                url: file.path // Cloudinary secure_url
            }));
        } 
        // Handle images array from request body
        else if (images && Array.isArray(images) && images.length > 0) {
            productImages = images;
        }
        // Handle single image from request body (backwards compatibility)
        else if (image) {
            // Extract public_id from Cloudinary URL
            const urlParts = image.split('/');
            const fileWithExt = urlParts[urlParts.length - 1];
            const public_id = fileWithExt.split('.')[0];
            
            productImages = [{
                public_id: public_id,
                url: image
            }];
        }

        const product = await Product.create({
            name,
            description,
            price,
            images: productImages,
            category,
            stock,
            careInstructions
        });

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            product
        });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// Update product (Admin)
exports.updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ 
                success: false,
                message: 'Product not found' 
            });
        }

        // Handle image updates if new images are provided
        if (req.files && req.files.length > 0) {
            // Delete old images from cloudinary
            if (product.images && product.images.length > 0) {
                for (const image of product.images) {
                    try {
                        await deleteImage(image.public_id);
                    } catch (error) {
                        console.error('Error deleting old image:', error);
                    }
                }
            }

            // Set new images from uploaded files
            const newImages = req.files.map(file => ({
                public_id: file.filename, // Cloudinary public_id
                url: file.path // Cloudinary secure_url
            }));
            req.body.images = newImages;
        }
        // Handle images array from request body
        else if (req.body.images && Array.isArray(req.body.images)) {
            // Images array is already in the correct format
        }
        // Handle single image from request body (backwards compatibility)
        else if (req.body.image) {
            // Extract public_id from Cloudinary URL
            const urlParts = req.body.image.split('/');
            const fileWithExt = urlParts[urlParts.length - 1];
            const public_id = fileWithExt.split('.')[0];
            
            req.body.images = [{
                public_id: public_id,
                url: req.body.image
            }];
            
            // Remove the single image field
            delete req.body.image;
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('category', 'name');

        res.json({
            success: true,
            message: 'Product updated successfully',
            product: updatedProduct
        });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// Delete product (Admin)
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ 
                success: false,
                message: 'Product not found' 
            });
        }

        // Delete images from cloudinary
        if (product.images && product.images.length > 0) {
            for (const image of product.images) {
                try {
                    await deleteImage(image.public_id);
                } catch (error) {
                    console.error('Error deleting image:', error);
                }
            }
        }

        await Product.findByIdAndDelete(req.params.id);
        res.json({ 
            success: true,
            message: 'Product removed successfully' 
        });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};
