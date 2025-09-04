const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter category name'],
        trim: true,
        unique: true
    },
    slug: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: [true, 'Please enter category description']
    },
    image: {
        public_id: String,
        url: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Category', categorySchema);
