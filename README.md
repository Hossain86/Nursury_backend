# AmarNursery Backend API

This is the backend API for the AmarNursery e-commerce platform.

## Development URLs
- **Local API**: http://localhost:5001/
- **Local API Base**: http://localhost:5001/api

## Production URLs  
- **Production API**: https://amar-nursery-project-api.vercel.app/
- **API Base**: https://amar-nursery-project-api.vercel.app/api

## Endpoints

### Health Check
- `GET /` - Basic API info
- `GET /health` - Health status with database connection
- `GET /api/test` - Test endpoint with detailed info

### Authentication
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders/user/myorders` - Get user orders
- `GET /api/orders/:id` - Get order details

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category (Admin)

### Wishlist
- `GET /api/wishlist` - Get user wishlist
- `POST /api/wishlist/add` - Add to wishlist
- `DELETE /api/wishlist/remove/:productId` - Remove from wishlist

## Environment Variables Required

```env
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
NODE_ENV=production
```

## Local Development

```bash
npm install
npm run dev
```

## Deployment

This backend is configured to deploy as a separate Vercel project:

1. Create new Vercel project
2. Import from GitHub repository
3. Set root directory to `backend`
4. Configure environment variables
5. Deploy

The backend exports the Express app for Vercel serverless functions and handles database connections automatically.
