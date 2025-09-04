const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    products: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field before saving
wishlistSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Ensure user can have only one wishlist
wishlistSchema.index({ user: 1 }, { unique: true });

// Compound index for better query performance
wishlistSchema.index({ user: 1, 'products.product': 1 });

module.exports = mongoose.model('Wishlist', wishlistSchema);
