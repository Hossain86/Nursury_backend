const mongoose = require('mongoose');

// Function to generate custom order ID
async function generateOrderId(order) {
    const Counter = require('./counterModel');
    
    // Extract state from shipping address with fallbacks
    let state = order.shippingAddress?.state || 
                order.shippingAddress?.division || 
                order.shippingAddress?.city || 
                'GEN';
    
    // Extract first 3 letters of the state (zilla) and convert to uppercase
    const zillaPrefix = state.substring(0, 3).toUpperCase();
    
    // Find and update the counter for this zilla
    const counter = await Counter.findByIdAndUpdate(
        zillaPrefix,
        { $inc: { sequenceValue: 1 } },
        { new: true, upsert: true }
    );
    
    // Format the sequence number with leading zeros (4 digits)
    const sequenceNumber = counter.sequenceValue.toString().padStart(4, '0');
    
    const customOrderId = `${zillaPrefix}${sequenceNumber}`;
    
    return customOrderId;
}

const orderSchema = new mongoose.Schema({
    customOrderId: {
        type: String,
        unique: true,
        validate: {
            validator: function(v) {
                // Only validate if the document is not new (after middleware has run)
                return !this.isNew || (this.isNew && v);
            },
            message: 'Custom Order ID is required'
        }
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderItems: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        name: String,
        quantity: Number,
        image: String,
        price: Number
    }],
    shippingAddress: {
        name: String,
        email: String,
        phone: String,
        address: String,
        street: String, // Alternative field name
        Upazilla: String,
        state: String,
        postalCode: String,
        zipCode: String, // Alternative field name  
        country: String
    },
    paymentMethod: {
        type: String,
        required: [true, 'Please select payment method'],
        enum: ['cash', 'card']
    },
    paymentResult: {
        id: String,
        status: String,
        update_time: String,
        email_address: String
    },
    itemsPrice: {
        type: Number,
        required: true,
        default: 0.0
    },
    shippingPrice: {
        type: Number,
        required: true,
        default: 0.0
    },
    totalPrice: {
        type: Number,
        required: true,
        default: 0.0
    },
    isPaid: {
        type: Boolean,
        required: true,
        default: false
    },
    paidAt: Date,
    isDelivered: {
        type: Boolean,
        required: true,
        default: false
    },
    deliveredAt: Date,
    orderStatus: {
        type: String,
        required: true,
        enum: ['Processing', 'Shipped', 'Delivered', 'Cancelled'],
        default: 'Processing'
    }
}, {
    timestamps: true
});

// Middleware to generate custom order ID and handle order updates
orderSchema.pre('save', async function(next) {
    // Generate custom order ID for new orders
    if (this.isNew && !this.customOrderId) {
        try {
            console.log(`Generating custom order ID for new order`);
            this.customOrderId = await generateOrderId(this);
            console.log(`Generated custom order ID: ${this.customOrderId}`);
        } catch (error) {
            console.error('Error generating custom order ID:', error);
            return next(error);
        }
    }
    
    // If order is being marked as delivered and payment status is not already set
    if (this.isDelivered && !this.isPaid) {
        console.log(`Auto-updating payment status for order ${this._id}: isDelivered=true, setting isPaid=true`);
        this.isPaid = true;
        
        // Set paidAt date if not already set
        if (!this.paidAt) {
            this.paidAt = new Date();
        }
    }
    
    // Set deliveredAt date when order is marked as delivered
    if (this.isDelivered && !this.deliveredAt) {
        this.deliveredAt = new Date();
    }
    
    // Also update orderStatus to 'Delivered' when isDelivered is true
    if (this.isDelivered && this.orderStatus !== 'Delivered') {
        console.log(`Auto-updating order status for order ${this._id}: setting orderStatus to 'Delivered'`);
        this.orderStatus = 'Delivered';
    }
    
    next();
});

// Middleware for findOneAndUpdate operations
orderSchema.pre('findOneAndUpdate', function(next) {
    const update = this.getUpdate();
    
    // Check if isDelivered is being set to true in the update
    if (update.isDelivered === true || update.$set?.isDelivered === true) {
        console.log('Auto-updating payment status in findOneAndUpdate: isDelivered=true, setting isPaid=true');
        
        // Set isPaid to true
        if (update.$set) {
            update.$set.isPaid = true;
            if (!update.$set.paidAt) {
                update.$set.paidAt = new Date();
            }
            if (!update.$set.deliveredAt) {
                update.$set.deliveredAt = new Date();
            }
            if (update.$set.orderStatus !== 'Delivered') {
                update.$set.orderStatus = 'Delivered';
            }
        } else {
            update.isPaid = true;
            if (!update.paidAt) {
                update.paidAt = new Date();
            }
            if (!update.deliveredAt) {
                update.deliveredAt = new Date();
            }
            if (update.orderStatus !== 'Delivered') {
                update.orderStatus = 'Delivered';
            }
        }
    }
    
    next();
});

module.exports = mongoose.model('Order', orderSchema);
