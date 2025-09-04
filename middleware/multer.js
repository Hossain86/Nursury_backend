const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary immediately
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log('🔧 Cloudinary configured with:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY ? 'configured' : 'missing',
  api_secret: process.env.CLOUDINARY_API_SECRET ? 'configured' : 'missing'
});

// Multer configuration for Cloudinary uploads
// Create storage for products
const productStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'amar-nursery/products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 800, height: 800, crop: 'limit' },
      { quality: 'auto' },
      { fetch_format: 'auto' }
    ],
    public_id: (req, file) => {
      // Generate unique filename with timestamp
      const timestamp = Date.now();
      const originalName = file.originalname.replace(/\.[^/.]+$/, '');
      return `product_${timestamp}_${originalName}`;
    },
  },
});

// Create storage for avatars
const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'amar-nursery/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 300, height: 300, crop: 'fill', gravity: 'face' },
      { quality: 'auto' },
      { fetch_format: 'auto' }
    ],
    public_id: (req, file) => {
      // Generate unique filename with user ID and timestamp
      const timestamp = Date.now();
      const userId = req.user ? req.user._id : 'unknown';
      return `avatar_${userId}_${timestamp}`;
    },
  },
});

// Create multer instances
const productUpload = multer({
  storage: productStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'), false);
    }
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit for avatars
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'), false);
    }
  },
});

// Middleware for single image upload (products)
const getUploadSingle = () => {
  return productUpload.single('image');
};

// Middleware for avatar upload
const getAvatarUpload = () => {
  return avatarUpload.single('image');
};

// Middleware for multiple images upload (products)
const getUploadMultiple = () => {
  return productUpload.array('images', 5);
};

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 5MB.',
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Too many files uploaded.',
      });
    }
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
  
  return res.status(500).json({
    success: false,
    message: 'File upload error occurred.',
  });
};

// Helper function to delete image from Cloudinary
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log('🗑️ Image deleted from Cloudinary:', result);
    return result;
  } catch (error) {
    console.error('❌ Error deleting image from Cloudinary:', error);
    throw error;
  }
};

// Helper function to extract public ID from Cloudinary URL
const getPublicIdFromUrl = (url) => {
  try {
    const urlParts = url.split('/');
    const versionIndex = urlParts.findIndex(part => part.startsWith('v'));
    const pathAfterVersion = urlParts.slice(versionIndex + 1);
    const publicIdWithExtension = pathAfterVersion.join('/');
    const publicId = publicIdWithExtension.replace(/\.[^/.]+$/, '');
    return publicId;
  } catch (error) {
    console.error('Error extracting public ID from URL:', error);
    return null;
  }
};

module.exports = {
  getUploadSingle,
  getAvatarUpload,
  getUploadMultiple,
  handleMulterError,
  cloudinary,
  deleteImage,
  getPublicIdFromUrl,
};
