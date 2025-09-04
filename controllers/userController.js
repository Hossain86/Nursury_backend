const User = require('../models/userModel');
const Cart = require('../models/cartModel');
const jwt = require('jsonwebtoken');
const { deleteImage } = require('../middleware/multer');

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

// Register User
exports.registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name,
            email,
            password
        });

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Login User
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isPasswordMatch = await user.comparePassword(password);
        if (!isPasswordMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get User Profile
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            addresses: user.addresses
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update User Profile
exports.updateUserProfile = async (req, res) => {
    try {
        console.log('📝 Updating user profile:', {
            userId: req.user._id,
            requestBody: req.body
        });

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { name, email, password, profile } = req.body;

        // Update basic user info
        if (name) user.name = name;
        if (email) {
            // Check if email is already taken by another user
            const emailExists = await User.findOne({ 
                email: email, 
                _id: { $ne: req.user._id } 
            });
            if (emailExists) {
                return res.status(400).json({ message: 'Email is already taken' });
            }
            user.email = email;
        }
        if (password) {
            user.password = password;
        }

        // Update profile information
        if (profile) {
            console.log('🔄 Updating profile section:', {
                existingProfile: user.profile,
                newProfile: profile
            });
            
            user.profile = {
                ...user.profile,
                ...profile
            };
            
            // Handle age calculation from dateOfBirth if provided
            if (profile.dateOfBirth) {
                const birthDate = new Date(profile.dateOfBirth);
                const today = new Date();
                const age = today.getFullYear() - birthDate.getFullYear();
                user.profile.age = age;
            }
        }

        const updatedUser = await user.save();
        console.log('✅ Profile updated successfully:', {
            userId: updatedUser._id,
            profile: updatedUser.profile
        });

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                profile: updatedUser.profile,
                addresses: updatedUser.addresses,
                updatedAt: updatedUser.updatedAt
            }
        });
    } catch (error) {
        console.error('❌ Profile update error:', {
            error: error.message,
            stack: error.stack,
            userId: req.user?._id
        });
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// Upload Avatar
exports.uploadAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided'
            });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Delete old avatar if exists
        if (user.profile.avatar && user.profile.avatar.public_id) {
            try {
                await deleteImage(user.profile.avatar.public_id);
            } catch (error) {
                console.error('Error deleting old avatar:', error);
            }
        }

        // Update user avatar
        user.profile.avatar = {
            public_id: req.file.filename,
            url: req.file.path
        };

        await user.save();

        res.json({
            success: true,
            message: 'Avatar uploaded successfully',
            avatar: user.profile.avatar
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Add Address
exports.addAddress = async (req, res) => {
    try {
        console.log('Adding address - Request body:', req.body);
        console.log('User ID:', req.user._id);
        
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const newAddress = {
            type: req.body.type || 'home',
            fullAddress: req.body.fullAddress,
            area: req.body.area,
            city: req.body.city,
            Upazilla: req.body.Upazilla || req.body.city, // Support both Upazilla and city
            district: req.body.district,
            division: req.body.division,
            zipCode: req.body.zipCode,
            country: req.body.country || 'Bangladesh',
            landmark: req.body.landmark,
            isDefault: req.body.isDefault || false
        };

        console.log('New address to be added:', newAddress);

        // Validate required fields
        if (!newAddress.fullAddress || !newAddress.fullAddress.trim()) {
            return res.status(400).json({ message: 'Full Address is required' });
        }
        if (!newAddress.Upazilla || !newAddress.Upazilla.trim()) {
            return res.status(400).json({ message: 'Upazilla is required' });
        }

        if (newAddress.isDefault) {
            user.addresses.forEach(addr => addr.isDefault = false);
        }

        user.addresses.push(newAddress);
        await user.save();

        console.log('Address added successfully. User addresses:', user.addresses);
        res.status(201).json(user.addresses);
    } catch (error) {
        console.error('Add address error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Update Address
exports.updateAddress = async (req, res) => {
    try {
        console.log('Updating address - Request body:', req.body);
        console.log('Address ID:', req.params.addressId);
        console.log('User ID:', req.user._id);
        
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const address = user.addresses.id(req.params.addressId);
        if (!address) {
            return res.status(404).json({ message: 'Address not found' });
        }

        // Validate required fields
        const fullAddress = req.body.fullAddress !== undefined ? req.body.fullAddress : address.fullAddress;
        const city = req.body.city !== undefined ? req.body.city : address.city;
        
        if (!fullAddress || !fullAddress.trim()) {
            return res.status(400).json({ message: 'Full Address is required' });
        }
        if (!city || !city.trim()) {
            return res.status(400).json({ message: 'Upazilla is required' });
        }

        // Update address fields
        Object.keys(req.body).forEach(key => {
            if (req.body[key] !== undefined) {
                address[key] = req.body[key];
            }
        });

        // If setting as default, remove default from others
        if (req.body.isDefault) {
            user.addresses.forEach(addr => {
                if (addr._id.toString() !== req.params.addressId) {
                    addr.isDefault = false;
                }
            });
        }

        await user.save();
        console.log('Address updated successfully');
        res.json(user.addresses);
    } catch (error) {
        console.error('Update address error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Delete Address
exports.deleteAddress = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.addresses.pull(req.params.addressId);
        await user.save();

        res.json({ message: 'Address removed successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get User Profile (Enhanced)
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            profile: user.profile,
            addresses: user.addresses,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get User Orders with Status
exports.getUserOrders = async (req, res) => {
    try {
        const Order = require('../models/orderModel');
        
        const orders = await Order.find({ user: req.user._id })
            .populate('orderItems.product', 'name images')
            .sort({ createdAt: -1 });

        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Admin: Get All Users with Profiles
exports.getAllUsersProfiles = async (req, res) => {
    try {
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Admin: Get User by ID with Orders
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const Order = require('../models/orderModel');
        const orders = await Order.find({ user: req.params.id })
            .populate('orderItems.product', 'name images price')
            .populate('user', 'name email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            user,
            orders
        });
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// Admin: Update User Profile
exports.adminUpdateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        const { name, email, role, isApproved, profile, password } = req.body;

        // Update basic user info
        if (name) user.name = name;
        if (email) {
            // Check if email is already taken by another user
            const emailExists = await User.findOne({ 
                email: email, 
                _id: { $ne: req.params.id } 
            });
            if (emailExists) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Email is already taken' 
                });
            }
            user.email = email;
        }
        if (role) user.role = role;
        if (typeof isApproved !== 'undefined') user.isApproved = isApproved;
        if (password) user.password = password;

        // Update profile information
        if (profile) {
            user.profile = {
                ...user.profile,
                ...profile
            };
            
            // Handle age calculation from dateOfBirth if provided
            if (profile.dateOfBirth) {
                const birthDate = new Date(profile.dateOfBirth);
                const today = new Date();
                const age = today.getFullYear() - birthDate.getFullYear();
                user.profile.age = age;
            }
        }

        const updatedUser = await user.save();
        const userResponse = updatedUser.toObject();
        delete userResponse.password;

        res.json({
            success: true,
            message: 'User profile updated successfully',
            user: userResponse
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// Admin Delete User
exports.adminDeleteUser = async (req, res) => {
    try {
        console.log('Admin delete user - User ID:', req.params.id);
        console.log('Admin user:', req.user ? { id: req.user._id, role: req.user.role } : 'not found');

        const userId = req.params.id;
        
        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent deleting yourself
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'You cannot delete your own account'
            });
        }

        // Use deleteOne instead of remove (deprecated)
        await User.deleteOne({ _id: userId });
        
        console.log('User deleted successfully:', { userId, name: user.name });
        
        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Admin delete user error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Cart Functions

// Get User Cart
exports.getCart = async (req, res) => {
    try {
        let cart = await Cart.findOne({ user: req.user._id }).populate({
            path: 'items.product',
            select: 'name price images stock'
        });

        // If no standalone cart exists, create one from user model cart (migration)
        if (!cart) {
            const user = await User.findById(req.user._id).populate({
                path: 'cart.product',
                select: 'name price images stock'
            });

            if (user && user.cart && user.cart.length > 0) {
                // Migrate from user model to standalone cart
                cart = new Cart({
                    user: req.user._id,
                    items: user.cart.map(item => ({
                        product: item.product,
                        quantity: item.quantity,
                        addedAt: item.addedAt || new Date()
                    }))
                });
                await cart.save();
                
                // Clear the old user cart
                user.cart = [];
                await user.save();
            } else {
                // Create empty cart
                cart = new Cart({
                    user: req.user._id,
                    items: []
                });
                await cart.save();
            }
        }

        res.json({
            success: true,
            cart: cart.items,
            totalItems: cart.totalItems,
            totalPrice: cart.totalPrice
        });
    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Add to Cart
exports.addToCart = async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;
        const Product = require('../models/productModel');

        // Validate product exists and get stock information
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Check if quantity is valid
        if (quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Quantity must be greater than 0'
            });
        }

        let cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            cart = new Cart({
                user: req.user._id,
                items: []
            });
        }

        // Check if product already exists in cart
        const existingItemIndex = cart.items.findIndex(
            item => item.product.toString() === productId
        );

        let totalRequestedQuantity = quantity;
        
        if (existingItemIndex > -1) {
            totalRequestedQuantity = cart.items[existingItemIndex].quantity + quantity;
        }

        // Check stock availability
        if (product.stock < totalRequestedQuantity) {
            const currentInCart = existingItemIndex > -1 ? cart.items[existingItemIndex].quantity : 0;
            const availableToAdd = Math.max(0, product.stock - currentInCart);
            
            return res.status(400).json({
                success: false,
                message: availableToAdd > 0 
                    ? `Only ${availableToAdd} more items can be added to cart. Current stock: ${product.stock}, already in cart: ${currentInCart}`
                    : `Out of stock! Available: ${product.stock}, already in cart: ${currentInCart}`,
                availableStock: product.stock,
                currentInCart: currentInCart,
                availableToAdd: availableToAdd
            });
        }

        if (existingItemIndex > -1) {
            // Update quantity
            cart.items[existingItemIndex].quantity += quantity;
        } else {
            // Add new item
            cart.items.push({
                product: productId,
                quantity
            });
        }

        await cart.save();

        // Populate cart with product details
        await cart.populate({
            path: 'items.product',
            select: 'name price images stock'
        });

        res.json({
            success: true,
            message: 'Product added to cart',
            cart: cart.items,
            totalItems: cart.totalItems,
            totalPrice: cart.totalPrice
        });
    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update Cart Item Quantity
exports.updateCartItem = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const Product = require('../models/productModel');

        const cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        const itemIndex = cart.items.findIndex(
            item => item.product.toString() === productId
        );

        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Product not found in cart' });
        }

        if (quantity <= 0) {
            // Remove item if quantity is 0 or less
            cart.items.splice(itemIndex, 1);
        } else {
            // Validate stock availability
            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            // Check stock availability
            if (product.stock < quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Not enough stock! Available: ${product.stock}, requested: ${quantity}`,
                    availableStock: product.stock
                });
            }

            cart.items[itemIndex].quantity = quantity;
        }

        await cart.save();

        // Populate cart with product details
        await cart.populate({
            path: 'items.product',
            select: 'name price images stock'
        });

        res.json({
            success: true,
            message: 'Cart updated',
            cart: cart.items,
            totalItems: cart.totalItems,
            totalPrice: cart.totalPrice
        });
    } catch (error) {
        console.error('Update cart error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Remove from Cart
exports.removeFromCart = async (req, res) => {
    try {
        const { productId } = req.params;

        const cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        cart.items = cart.items.filter(
            item => item.product.toString() !== productId
        );

        await cart.save();

        // Populate cart with product details
        await cart.populate({
            path: 'items.product',
            select: 'name price images stock'
        });

        res.json({
            success: true,
            message: 'Product removed from cart',
            cart: cart.items,
            totalItems: cart.totalItems,
            totalPrice: cart.totalPrice
        });
    } catch (error) {
        console.error('Remove from cart error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Clear Cart
exports.clearCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        cart.items = [];
        await cart.save();

        res.json({
            success: true,
            message: 'Cart cleared',
            cart: cart.items,
            totalItems: 0,
            totalPrice: 0
        });
    } catch (error) {
        console.error('Clear cart error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
