const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile,
    uploadAvatar,
    addAddress,
    updateAddress,
    deleteAddress,
    getUserOrders,
    getAllUsersProfiles,
    getUserById,
    adminUpdateUserProfile,
    adminDeleteUser,
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');
const { getUploadSingle, getAvatarUpload, handleMulterError } = require('../middleware/multer');

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes
router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);

// Avatar upload route
router.post('/profile/avatar', protect, (req, res) => {
    const avatarUpload = getAvatarUpload();
    avatarUpload(req, res, (error) => {
        if (error) {
            return handleMulterError(error, req, res, () => {});
        }
        uploadAvatar(req, res);
    });
});

router.get('/orders', protect, getUserOrders);

router.post('/address', protect, addAddress);
router.put('/address/:addressId', protect, updateAddress);
router.delete('/address/:addressId', protect, deleteAddress);

// Cart routes
router.get('/cart', protect, getCart);
router.post('/cart', protect, addToCart);
router.put('/cart', protect, updateCartItem);
router.delete('/cart/clear', protect, clearCart);
router.delete('/cart/:productId', protect, removeFromCart);

// Admin routes
router.get('/admin/users', protect, admin, getAllUsersProfiles);
router.get('/admin/users/:id', protect, admin, getUserById);
router.put('/admin/users/:id', protect, admin, adminUpdateUserProfile);
router.delete('/admin/users/:id', protect, admin, adminDeleteUser);

router.put('/admin/users/:id/approve', protect, admin, async (req, res) => {
    try {
        const User = require('../models/userModel');
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.isApproved = true;
        await user.save();

        res.json({ message: 'User approved successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.delete('/admin/users/:id', protect, admin, async (req, res) => {
    try {
        const User = require('../models/userModel');
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await user.remove();
        res.json({ message: 'User removed successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
