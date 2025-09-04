const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/userModel');
const Product = require('./models/productModel');
const Order = require('./models/orderModel');
const connectDB = require('./config/database');

dotenv.config();

const seedOrders = async () => {
  try {
    console.log('📦 Starting order seeding...');
    
    // Connect to database
    await connectDB();
    
    // Clear existing orders (optional - comment out if you want to keep existing data)
    await Order.deleteMany({});
    console.log('🗑️ Cleared existing orders');
    
    // Get users and products
    const users = await User.find({ role: 'user' });
    const products = await Product.find();
    
    if (users.length === 0) {
      console.log('❌ No users found. Please seed users first.');
      process.exit(1);
    }
    
    if (products.length === 0) {
      console.log('❌ No products found. Please create some products first.');
      process.exit(1);
    }
    
    console.log(`👥 Found ${users.length} users and 🌱 ${products.length} products`);
    
    // Sample orders data
    const ordersData = [];
    const orderStatuses = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];
    
    // Create 2-4 orders per user
    for (const user of users) {
      const numberOfOrders = Math.floor(Math.random() * 3) + 2; // 2-4 orders
      
      for (let i = 0; i < numberOfOrders; i++) {
        // Random products for this order (1-3 items)
        const numberOfItems = Math.floor(Math.random() * 3) + 1;
        const orderItems = [];
        let totalAmount = 0;
        
        for (let j = 0; j < numberOfItems; j++) {
          const randomProduct = products[Math.floor(Math.random() * products.length)];
          const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 quantity
          const price = randomProduct.price || 25; // Default price if not set
          
          orderItems.push({
            product: randomProduct._id,
            name: randomProduct.name,
            image: randomProduct.images?.[0]?.url || 'default-image.jpg',
            price: price,
            quantity: quantity
          });
          
          totalAmount += price * quantity;
        }
        
        // Random shipping address from user's addresses
        let shippingAddress;
        if (user.addresses && user.addresses.length > 0) {
          const randomAddress = user.addresses[Math.floor(Math.random() * user.addresses.length)];
          shippingAddress = {
            fullAddress: randomAddress.fullAddress,
            area: randomAddress.area,
            city: randomAddress.city,
            district: randomAddress.district,
            division: randomAddress.division,
            country: randomAddress.country || 'Bangladesh'
          };
        } else {
          // Default address if user has no addresses
          shippingAddress = {
            fullAddress: '123 Default Street',
            area: 'Default Area',
            city: 'Default City',
            district: 'Default District',
            division: 'Default Division',
            country: 'Bangladesh'
          };
        }
        
        // Random date in the last 3 months
        const randomDate = new Date();
        randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 90));
        
        const orderData = {
          user: user._id,
          orderItems: orderItems,
          shippingAddress: {
            street: shippingAddress.fullAddress,
            city: shippingAddress.city,
            state: shippingAddress.division,
            zipCode: '12345',
            country: shippingAddress.country
          },
          paymentMethod: Math.random() > 0.5 ? 'card' : 'cash',
          itemsPrice: totalAmount,
          shippingPrice: totalAmount > 100 ? 0 : 10, // Free shipping over $100
          totalPrice: totalAmount + (totalAmount > 100 ? 0 : 10),
          orderStatus: orderStatuses[Math.floor(Math.random() * orderStatuses.length)],
          isPaid: Math.random() > 0.3, // 70% paid
          createdAt: randomDate,
          updatedAt: randomDate
        };
        
        // Set payment date if paid
        if (orderData.isPaid) {
          orderData.paidAt = randomDate;
        }
        
        // Set delivery date if delivered
        if (orderData.orderStatus === 'Delivered') {
          const deliveryDate = new Date(randomDate);
          deliveryDate.setDate(deliveryDate.getDate() + Math.floor(Math.random() * 7) + 1);
          orderData.deliveredAt = deliveryDate;
          orderData.isDelivered = true;
        }
        
        ordersData.push(orderData);
      }
    }
    
    // Insert orders
    let createdOrders = [];
    for (const orderData of ordersData) {
      try {
        const order = new Order(orderData);
        const savedOrder = await order.save();
        createdOrders.push(savedOrder);
        
        const user = users.find(u => u._id.toString() === orderData.user.toString());
                console.log(`✅ Created order for ${user.name}: $${savedOrder.totalPrice} (${savedOrder.orderStatus})`);
      } catch (error) {
        console.error(`❌ Error creating order:`, error.message);
      }
    }
    
    console.log(`\n🎉 Order seeding completed!`);
    console.log(`📊 Summary:`);
    console.log(`   • Total orders created: ${createdOrders.length}`);
    console.log(`   • Processing: ${createdOrders.filter(o => o.orderStatus === 'Processing').length}`);
    console.log(`   • Shipped: ${createdOrders.filter(o => o.orderStatus === 'Shipped').length}`);
    console.log(`   • Delivered: ${createdOrders.filter(o => o.orderStatus === 'Delivered').length}`);
    console.log(`   • Cancelled: ${createdOrders.filter(o => o.orderStatus === 'Cancelled').length}`);
    
    const totalRevenue = createdOrders.reduce((sum, order) => sum + order.totalPrice, 0);
    console.log(`   • Total Revenue: $${totalRevenue.toFixed(2)}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding orders:', error);
    process.exit(1);
  }
};

// Run the seeding function
seedOrders();
