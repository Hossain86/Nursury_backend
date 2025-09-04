const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');

// Validate stock availability for cart items
router.post('/validate-stock', protect, async (req, res) => {
    try {
        const Product = require('../models/productModel');
        const { orderItems } = req.body;

        if (!orderItems || orderItems.length === 0) {
            return res.status(400).json({ message: 'No items to validate' });
        }

        const stockValidation = await Promise.all(
            orderItems.map(async (item) => {
                const product = await Product.findById(item.product);
                return {
                    productId: item.product,
                    productName: product ? product.name : 'Unknown Product',
                    requestedQuantity: item.quantity,
                    availableStock: product ? product.stock : 0,
                    isValid: product && product.stock >= item.quantity && item.quantity > 0,
                    exists: !!product
                };
            })
        );

        const invalidItems = stockValidation.filter(item => !item.isValid);
        const isValid = invalidItems.length === 0;

        res.json({
            isValid,
            items: stockValidation,
            invalidItems,
            message: isValid ? 'All items are available' : 'Some items are not available or out of stock'
        });
    } catch (error) {
        console.error('❌ Stock validation failed:', error.message);
        res.status(500).json({ message: error.message });
    }
});

// Create new order
router.post('/', protect, async (req, res) => {
    try {
        const Order = require('../models/orderModel');
        const Product = require('../models/productModel');
        const {
            orderItems,
            shippingAddress,
            paymentMethod,
            itemsPrice,
            shippingPrice,
            totalPrice
        } = req.body;

        if (orderItems && orderItems.length === 0) {
            return res.status(400).json({ message: 'No order items' });
        }

        // Check stock availability for all items before processing
        const stockCheck = await Promise.all(
            orderItems.map(async (item) => {
                const product = await Product.findById(item.product);
                if (!product) {
                    throw new Error(`Product not found: ${item.name || 'Unknown Product'}`);
                }
                if (product.stock < item.quantity) {
                    throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`);
                }
                if (item.quantity <= 0) {
                    throw new Error(`Invalid quantity for ${product.name}. Quantity must be greater than 0.`);
                }
                return { product, requestedQuantity: item.quantity };
            })
        );

        // Validate shipping price based on district
        const validateShippingPrice = (address, providedShippingPrice) => {
            if (!address || !address.state) {
                return providedShippingPrice === 100; // Default for unknown district
            }
            
            const district = address.state.toLowerCase().trim();
            const expectedShipping = district.includes('rajshahi') ? 50 : 100;
            
            return providedShippingPrice === expectedShipping;
        };

        // Check if shipping price is correct for the district
        if (!validateShippingPrice(shippingAddress, shippingPrice)) {
            const district = shippingAddress?.state?.toLowerCase().trim() || '';
            const correctShipping = district.includes('rajshahi') ? 50 : 100;
            return res.status(400).json({ 
                message: `Invalid shipping price. For ${shippingAddress?.state || 'this district'}, shipping should be ৳${correctShipping}` 
            });
        }

        // Create the order
        const order = new Order({
            orderItems,
            user: req.user._id,
            shippingAddress,
            paymentMethod,
            itemsPrice,
            shippingPrice,
            totalPrice
        });

        const createdOrder = await order.save();

        // Update product stock - reduce quantities
        await Promise.all(
            stockCheck.map(async ({ product, requestedQuantity }) => {
                product.stock -= requestedQuantity;
                await product.save();
                console.log(`✅ Stock updated for ${product.name}: ${product.stock + requestedQuantity} → ${product.stock}`);
            })
        );

        console.log(`🛒 Order ${createdOrder._id} created successfully. Stock quantities updated.`);
        res.status(201).json(createdOrder);
    } catch (error) {
        console.error('❌ Order creation failed:', error.message);
        res.status(500).json({ message: error.message });
    }
});

// Get order by ID
router.get('/:id', protect, async (req, res) => {
    try {
        const Order = require('../models/orderModel');
        const order = await Order.findById(req.params.id)
            .populate('user', 'name email')
            .populate('orderItems.product', 'name price images');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if user owns this order or is admin
        if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'Not authorized to view this order' });
        }

        // Map backend fields to frontend expected fields for consistency
        const mappedOrder = {
            ...order.toObject(),
            status: order.orderStatus || order.status, // Map orderStatus to status for frontend compatibility
            shippingAddress: {
                ...order.shippingAddress,
                // Ensure address field is available
                address: order.shippingAddress?.street || order.shippingAddress?.address,
                postalCode: order.shippingAddress?.zipCode || order.shippingAddress?.postalCode,
                phone: order.shippingAddress?.phone,
                name: order.shippingAddress?.name,
                email: order.shippingAddress?.email
            }
        };

        res.json(mappedOrder);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update order to paid
router.put('/:id/pay', protect, async (req, res) => {
    try {
        const Order = require('../models/orderModel');
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if user owns this order
        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to update this order' });
        }

        order.isPaid = true;
        order.paidAt = Date.now();
        order.paymentResult = {
            id: req.body.id,
            status: req.body.status,
            update_time: req.body.update_time,
            email_address: req.body.email_address
        };

        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get logged in user orders
router.get('/user/myorders', protect, async (req, res) => {
    console.log('GET /user/myorders - Request received for user:', req.user._id);
    try {
        const Order = require('../models/orderModel');
        
        // First check if there are any orders at all
        const totalOrders = await Order.countDocuments();
        console.log('Total orders in database:', totalOrders);
        
        // Then check for this specific user
        const userOrderCount = await Order.countDocuments({ user: req.user._id });
        console.log('Orders for user', req.user._id, ':', userOrderCount);
        
        const orders = await Order.find({ user: req.user._id })
            .populate('orderItems.product', 'name images')
            .sort({ createdAt: -1 });

        console.log('GET /user/myorders - Found orders:', orders.length);
        console.log('Sample order structure:', orders[0] ? JSON.stringify(orders[0], null, 2) : 'No orders');
        
        // Map backend fields to frontend expected fields for consistency
        const mappedOrders = orders.map(order => ({
            ...order.toObject(),
            status: order.orderStatus || order.status, // Map orderStatus to status for frontend compatibility
            shippingAddress: {
                ...order.shippingAddress,
                // Ensure address field is available
                address: order.shippingAddress?.street || order.shippingAddress?.address,
                postalCode: order.shippingAddress?.zipCode || order.shippingAddress?.postalCode,
                phone: order.shippingAddress?.phone,
                name: order.shippingAddress?.name,
                email: order.shippingAddress?.email
            }
        }));
        
        res.json(mappedOrders);
    } catch (error) {
        console.error('GET /user/myorders - Error:', error.message);
        res.status(500).json({ message: error.message });
    }
});

// Admin routes

// Get all orders
router.get('/', protect, admin, async (req, res) => {
    try {
        const Order = require('../models/orderModel');
        const orders = await Order.find({})
            .populate('user', 'id name email')
            .populate('orderItems.product', 'name')
            .sort({ createdAt: -1 });

        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update order to delivered
router.put('/:id/deliver', protect, admin, async (req, res) => {
    try {
        const Order = require('../models/orderModel');
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        order.isDelivered = true;
        // Note: isPaid, paidAt, deliveredAt, and orderStatus will be automatically set by Mongoose middleware

        const updatedOrder = await order.save();
        
        console.log(`Order ${order._id} marked as delivered. Auto-updated: isPaid=${updatedOrder.isPaid}, orderStatus=${updatedOrder.orderStatus}`);
        
        res.json(updatedOrder);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update order status
router.put('/:id/status', protect, admin, async (req, res) => {
    try {
        const Order = require('../models/orderModel');
        const Product = require('../models/productModel');
        const { orderStatus } = req.body;
        
        const order = await Order.findById(req.params.id).populate('orderItems.product');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const previousStatus = order.orderStatus;

        // Handle stock restoration if changing to 'Cancelled' from a non-cancelled status
        if (orderStatus === 'Cancelled' && previousStatus !== 'Cancelled') {
            // Restore product stock - add back the quantities
            await Promise.all(
                order.orderItems.map(async (item) => {
                    const product = await Product.findById(item.product._id || item.product);
                    if (product) {
                        const previousStock = product.stock;
                        product.stock += item.quantity;
                        await product.save();
                        console.log(`🔄 Stock restored for ${product.name}: ${previousStock} → ${product.stock} (+${item.quantity})`);
                    } else {
                        console.warn(`⚠️ Product not found for stock restoration: ${item.name}`);
                    }
                })
            );
            console.log(`❌ Order ${order._id} cancelled by admin. Status: ${previousStatus} → Cancelled. Stock quantities restored.`);
        }

        order.orderStatus = orderStatus;

        // If status is 'Delivered', also set isDelivered to true
        // Note: isPaid, paidAt, and deliveredAt will be automatically set by Mongoose middleware
        if (orderStatus === 'Delivered') {
            order.isDelivered = true;
        }

        const updatedOrder = await order.save();
        
        console.log(`Order ${order._id} status updated to ${orderStatus}. Auto-updated fields: isPaid=${updatedOrder.isPaid}, isDelivered=${updatedOrder.isDelivered}`);
        
        res.json(updatedOrder);
    } catch (error) {
        console.error('❌ Order status update failed:', error.message);
        res.status(500).json({ message: error.message });
    }
});

// Cancel order
router.put('/:id/cancel', protect, async (req, res) => {
    try {
        const Order = require('../models/orderModel');
        const Product = require('../models/productModel');
        
        const order = await Order.findById(req.params.id).populate('orderItems.product');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if user owns this order or is admin
        if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'Not authorized to cancel this order' });
        }

        // Can only cancel if not delivered
        if (order.isDelivered) {
            return res.status(400).json({ message: 'Cannot cancel delivered order' });
        }

        // Check if order is already cancelled
        if (order.orderStatus === 'Cancelled') {
            return res.status(400).json({ message: 'Order is already cancelled' });
        }

        // Store the previous status for logging
        const previousStatus = order.orderStatus;

        // Update order status to cancelled
        order.orderStatus = 'Cancelled';
        const updatedOrder = await order.save();

        // Restore product stock - add back the quantities
        await Promise.all(
            order.orderItems.map(async (item) => {
                const product = await Product.findById(item.product._id || item.product);
                if (product) {
                    const previousStock = product.stock;
                    product.stock += item.quantity;
                    await product.save();
                    console.log(`🔄 Stock restored for ${product.name}: ${previousStock} → ${product.stock} (+${item.quantity})`);
                } else {
                    console.warn(`⚠️ Product not found for stock restoration: ${item.name}`);
                }
            })
        );

        console.log(`❌ Order ${order._id} cancelled by ${req.user.role === 'admin' ? 'admin' : 'user'}. Status: ${previousStatus} → Cancelled. Stock quantities restored.`);
        res.json(updatedOrder);
    } catch (error) {
        console.error('❌ Order cancellation failed:', error.message);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
