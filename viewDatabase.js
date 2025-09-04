const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/userModel');
const Product = require('./models/productModel');
const Order = require('./models/orderModel');
const connectDB = require('./config/database');

dotenv.config();

const viewDatabaseData = async () => {
  try {
    console.log('📊 Database Overview');
    console.log('==================');
    
    // Connect to database
    await connectDB();
    
    // Get all users
    const users = await User.find().select('-password');
    console.log(`\n👥 USERS (${users.length} total):`);
    console.log('--------------------------------');
    
    users.forEach(user => {
      console.log(`📧 ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Phone: ${user.profile?.phone || 'Not provided'}`);
      console.log(`   Gender: ${user.profile?.gender || 'Not provided'}`);
      console.log(`   Age: ${user.profile?.age || 'Not provided'}`);
      console.log(`   Addresses: ${user.addresses?.length || 0}`);
      if (user.addresses?.length > 0) {
        user.addresses.forEach((addr, index) => {
          console.log(`     ${index + 1}. (${addr.type}) ${addr.city}, ${addr.division}`);
        });
      }
      console.log(`   Created: ${user.createdAt.toLocaleDateString()}`);
      console.log('');
    });
    
    // Get all products
    const products = await Product.find();
    console.log(`\n🌱 PRODUCTS (${products.length} total):`);
    console.log('--------------------------------');
    
    products.forEach(product => {
      console.log(`🌿 ${product.name}`);
      console.log(`   Price: $${product.price || 'Not set'}`);
      console.log(`   Category: ${product.category || 'Not set'}`);
      console.log(`   Stock: ${product.stock || 'Not set'}`);
      console.log(`   Images: ${product.images?.length || 0}`);
      console.log('');
    });
    
    // Get all orders
    const orders = await Order.find().populate('user', 'name email');
    console.log(`\n📦 ORDERS (${orders.length} total):`);
    console.log('--------------------------------');
    
    // Group orders by status
    const ordersByStatus = {
      'Processing': orders.filter(o => o.orderStatus === 'Processing'),
      'Shipped': orders.filter(o => o.orderStatus === 'Shipped'),
      'Delivered': orders.filter(o => o.orderStatus === 'Delivered'),
      'Cancelled': orders.filter(o => o.orderStatus === 'Cancelled')
    };
    
    Object.entries(ordersByStatus).forEach(([status, statusOrders]) => {
      console.log(`\n${status} (${statusOrders.length}):`);
      statusOrders.forEach(order => {
        console.log(`   💰 $${order.totalPrice} - ${order.user?.name} (${order.user?.email})`);
        console.log(`      Items: ${order.orderItems?.length || 0} | Payment: ${order.paymentMethod} | Paid: ${order.isPaid ? 'Yes' : 'No'}`);
        console.log(`      Date: ${order.createdAt.toLocaleDateString()}`);
      });
    });
    
    // Statistics
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    const paidOrders = orders.filter(order => order.isPaid);
    const paidRevenue = paidOrders.reduce((sum, order) => sum + order.totalPrice, 0);
    
    console.log(`\n📈 STATISTICS:`);
    console.log('================================');
    console.log(`👥 Total Users: ${users.length}`);
    console.log(`   • Regular Users: ${users.filter(u => u.role === 'user').length}`);
    console.log(`   • Admins: ${users.filter(u => u.role === 'admin').length}`);
    console.log(`🌱 Total Products: ${products.length}`);
    console.log(`📦 Total Orders: ${orders.length}`);
    console.log(`💰 Total Revenue: $${totalRevenue.toFixed(2)}`);
    console.log(`💳 Paid Orders: ${paidOrders.length} (Revenue: $${paidRevenue.toFixed(2)})`);
    console.log(`📍 Total Addresses: ${users.reduce((sum, user) => sum + (user.addresses?.length || 0), 0)}`);
    
    console.log(`\n🔐 LOGIN CREDENTIALS:`);
    console.log('=====================================');
    console.log(`Admin: admin@amarnursery.com / admin123`);
    console.log(`Manager: manager@amarnursery.com / manager123`);
    console.log(`Expert: expert@amarnursery.com / expert123`);
    console.log(`Users: All user emails / password123`);
    
    console.log(`\n✨ Your nursery database is fully seeded and ready!`);
    console.log(`🌐 Frontend: http://localhost:3001`);
    // console.log(`🔧 Backend: http://localhost:5001`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error viewing database data:', error);
    process.exit(1);
  }
};

// Run the function
viewDatabaseData();
