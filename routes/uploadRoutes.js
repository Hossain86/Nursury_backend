const express = require('express');
const router = express.Router();
const { getUploadSingle, getUploadMultiple, handleMulterError, cloudinary } = require('../middleware/multer');
const { protect, admin } = require('../middleware/authMiddleware');

// Upload single image endpoint
router.post('/image', protect, admin, (req, res) => {
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

    // Return the uploaded image details
    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: req.file.path,
        publicId: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        format: req.file.format || req.file.mimetype.split('/')[1]
      }
    });
  });
});

// Upload multiple images endpoint
router.post('/images', protect, admin, (req, res) => {
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

    // Return details of all uploaded images
    const uploadedImages = req.files.map(file => ({
      url: file.path,
      publicId: file.filename,
      originalName: file.originalname,
      size: file.size,
      format: file.format || file.mimetype.split('/')[1]
    }));

    res.json({
      success: true,
      message: `${req.files.length} images uploaded successfully`,
      data: uploadedImages
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

    const { deleteImage } = require('../middleware/multer');
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
    console.error('Error deleting image:', error);
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
    
    res.status(500).json({
      success: false,
      message: 'Error retrieving image details',
      error: error.message
    });
  }
});

module.exports = router;
