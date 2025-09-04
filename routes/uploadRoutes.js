const express = require('express');
const router = express.Router();
const { 
  getUploadSingle, 
  getUploadMultiple, 
  getAvatarUpload, 
  handleMulterError, 
  cloudinary,
  deleteImage 
} = require('../middleware/multer');
const { protect, admin } = require('../middleware/authMiddleware');

// Upload single product image endpoint
router.post('/product', protect, admin, (req, res) => {
  const uploadSingle = getUploadSingle();
  
  uploadSingle(req, res, (error) => {
    if (error) {
      return handleMulterError(error, req, res, () => {});
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    // Return successful upload response
    res.json({
      success: true,
      url: req.file.path,
      public_id: req.file.filename
    });
  });
});

// Upload multiple product images endpoint (up to 5)
router.post('/product/multiple', protect, admin, (req, res) => {
  const uploadMultiple = getUploadMultiple();
  
  uploadMultiple(req, res, (error) => {
    if (error) {
      return handleMulterError(error, req, res, () => {});
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No image files provided'
      });
    }

    // Extract URLs and public IDs from uploaded files
    const urls = req.files.map(file => file.path);
    const public_ids = req.files.map(file => file.filename);

    res.json({
      success: true,
      url: urls,
      public_id: public_ids
    });
  });
});

// Upload avatar image endpoint
router.post('/avatar', protect, (req, res) => {
  const avatarUpload = getAvatarUpload();
  
  avatarUpload(req, res, (error) => {
    if (error) {
      return handleMulterError(error, req, res, () => {});
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No avatar image file provided'
      });
    }

    // Return successful upload response
    res.json({
      success: true,
      url: req.file.path,
      public_id: req.file.filename
    });
  });
});

// Delete image endpoint
router.delete('/image/:publicId', protect, admin, async (req, res) => {
  try {
    const { publicId } = req.params;
    
    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: 'Public ID is required'
      });
    }

    const result = await deleteImage(publicId);

    if (result.result === 'ok') {
      res.json({
        success: true,
        message: 'Image deleted successfully',
        data: result
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Image not found or already deleted',
        data: result
      });
    }
  } catch (error) {
    console.error('❌ Error deleting image:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting image',
      error: error.message
    });
  }
});

// Get image details endpoint
router.get('/image/:publicId', async (req, res) => {
  try {
    const { publicId } = req.params;
    
    const result = await cloudinary.api.resource(publicId);
    
    res.json({
      success: true,
      data: {
        publicId: result.public_id,
        url: result.secure_url,
        format: result.format,
        width: result.width,
        height: result.height,
        size: result.bytes,
        createdAt: result.created_at
      }
    });
  } catch (error) {
    if (error.http_code === 404) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }
    
    console.error('❌ Error retrieving image details:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving image details',
      error: error.message
    });
  }
});

module.exports = router;
