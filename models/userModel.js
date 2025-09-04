const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter your name'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Please enter your email'],
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: [true, 'Please enter your password'],
        minlength: [6, 'Password should be at least 6 characters']
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    isApproved: {
        type: Boolean,
        default: false
    },
    
    // Enhanced Profile Information
    profile: {
        phone: {
            type: String,
            trim: true
        },
        gender: {
            type: String,
            enum: ['male', 'female', 'other', ''],
            default: ''
        },
        age: {
            type: Number,
            min: [13, 'Age must be at least 13'],
            max: [120, 'Age must be realistic']
        },
        dateOfBirth: {
            type: Date
        },
        avatar: {
            public_id: {
                type: String,
                default: null
            },
            url: {
                type: String,
                default: null
            }
        }
    },
    
    // Detailed Address Information
    addresses: [{
        type: {
            type: String,
            enum: ['home', 'work', 'other'],
            default: 'home'
        },
        fullAddress: {
            type: String,
            required: true
        },
        street: String,
        area: String,
        Upazilla: {
            type: String,
            required: true
        },
        district: String,
        division: String,
        zipCode: String,
        country: {
            type: String,
            default: 'Bangladesh'
        },
        landmark: String,
        isDefault: {
            type: Boolean,
            default: false
        }
    }],
    
    // Shopping Cart
    cart: [{
        product: {
            type: mongoose.Schema.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
            default: 1
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

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    
    // Update the updatedAt field
    this.updatedAt = Date.now();
    next();
});

// Update the updatedAt field before any update
userSchema.pre('findOneAndUpdate', function(next) {
    this.set({ updatedAt: Date.now() });
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
