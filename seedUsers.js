const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/userModel');
const connectDB = require('./config/database');

dotenv.config();

const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await connectDB();
    
    // Clear existing users (optional - comment out if you want to keep existing data)
    // await User.deleteMany({});
    // console.log('🗑️ Cleared existing users');
    
    // Sample user profiles data
    const usersData = [
      {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: await bcrypt.hash('password123', 12),
        role: 'user',
        profile: {
          phone: '+1-555-0123',
          gender: 'male',
          age: 28,
          dateOfBirth: new Date('1996-03-15'),
          avatar: {
            public_id: 'sample_avatar_male',
            url: 'https://res.cloudinary.com/demo/image/upload/v1234567890/sample_avatar_male.jpg'
          }
        },
        addresses: [
          {
            type: 'home',
            fullAddress: '123 Main Street, Apartment 4B',
            area: 'Downtown',
            city: 'New York',
            district: 'Manhattan',
            division: 'New York',
            landmark: 'Near Central Park'
          },
          {
            type: 'work',
            fullAddress: '456 Business Ave, Suite 100',
            area: 'Financial District',
            city: 'New York',
            district: 'Manhattan',
            division: 'New York',
            landmark: 'World Trade Center'
          }
        ]
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        password: await bcrypt.hash('password123', 12),
        role: 'user',
        profile: {
          phone: '+1-555-0456',
          gender: 'female',
          age: 32,
          dateOfBirth: new Date('1992-07-22'),
          avatar: {
            public_id: 'sample_avatar_female',
            url: 'https://res.cloudinary.com/demo/image/upload/v1234567890/sample_avatar_female.jpg'
          }
        },
        addresses: [
          {
            type: 'home',
            fullAddress: '789 Oak Street, House 12',
            area: 'Suburbs',
            city: 'Los Angeles',
            district: 'Beverly Hills',
            division: 'California',
            landmark: 'Near Beverly Hills Park'
          }
        ]
      },
      {
        name: 'Mike Johnson',
        email: 'mike.johnson@example.com',
        password: await bcrypt.hash('password123', 12),
        role: 'user',
        profile: {
          phone: '+1-555-0789',
          gender: 'male',
          age: 25,
          dateOfBirth: new Date('1999-11-08'),
          avatar: {
            public_id: 'sample_avatar_male2',
            url: 'https://res.cloudinary.com/demo/image/upload/v1234567890/sample_avatar_male2.jpg'
          }
        },
        addresses: [
          {
            type: 'home',
            fullAddress: '321 Pine Street, Unit 5A',
            area: 'Midtown',
            city: 'Chicago',
            district: 'Cook County',
            division: 'Illinois',
            landmark: 'Chicago River nearby'
          },
          {
            type: 'work',
            fullAddress: '654 Corporate Blvd, Floor 15',
            area: 'Business District',
            city: 'Chicago',
            district: 'Cook County',
            division: 'Illinois',
            landmark: 'Willis Tower'
          }
        ]
      },
      {
        name: 'Sarah Williams',
        email: 'sarah.williams@example.com',
        password: await bcrypt.hash('password123', 12),
        role: 'user',
        profile: {
          phone: '+1-555-0321',
          gender: 'female',
          age: 29,
          dateOfBirth: new Date('1995-04-18'),
          avatar: {
            public_id: 'sample_avatar_female2',
            url: 'https://res.cloudinary.com/demo/image/upload/v1234567890/sample_avatar_female2.jpg'
          }
        },
        addresses: [
          {
            type: 'home',
            fullAddress: '987 Elm Street, Cottage 3',
            area: 'Garden District',
            city: 'Miami',
            district: 'Miami-Dade',
            division: 'Florida',
            landmark: 'Near Bayfront Park'
          }
        ]
      },
      {
        name: 'David Brown',
        email: 'david.brown@example.com',
        password: await bcrypt.hash('password123', 12),
        role: 'user',
        profile: {
          phone: '+1-555-0654',
          gender: 'male',
          age: 35,
          dateOfBirth: new Date('1989-12-03'),
          avatar: {
            public_id: 'sample_avatar_male3',
            url: 'https://res.cloudinary.com/demo/image/upload/v1234567890/sample_avatar_male3.jpg'
          }
        },
        addresses: [
          {
            type: 'home',
            fullAddress: '147 Cedar Lane, House 8',
            area: 'Residential',
            city: 'Seattle',
            district: 'King County',
            division: 'Washington',
            landmark: 'Space Needle vicinity'
          },
          {
            type: 'other',
            fullAddress: '258 Vacation Road, Cabin 12',
            area: 'Mountain View',
            city: 'Aspen',
            district: 'Pitkin County',
            division: 'Colorado',
            landmark: 'Ski Resort'
          }
        ]
      },
      // Admin Users
      {
        name: 'Admin User',
        email: 'admin@amarnursery.com',
        password: await bcrypt.hash('admin123', 12),
        role: 'admin',
        profile: {
          phone: '+1-555-9999',
          gender: 'male',
          age: 40,
          dateOfBirth: new Date('1984-01-15'),
          avatar: {
            public_id: 'admin_avatar',
            url: 'https://res.cloudinary.com/demo/image/upload/v1234567890/admin_avatar.jpg'
          }
        },
        addresses: [
          {
            type: 'work',
            fullAddress: 'Amar Nursery Headquarters, 100 Garden Way',
            area: 'Business Park',
            city: 'Green Valley',
            district: 'Plant County',
            division: 'Garden State',
            landmark: 'Main Greenhouse Complex'
          },
          {
            type: 'home',
            fullAddress: '500 Admin Street, Executive Suite',
            area: 'Executive District',
            city: 'Green Valley',
            district: 'Plant County',
            division: 'Garden State',
            landmark: 'City Hall'
          }
        ]
      },
      {
        name: 'Garden Manager',
        email: 'manager@amarnursery.com',
        password: await bcrypt.hash('manager123', 12),
        role: 'admin',
        profile: {
          phone: '+1-555-8888',
          gender: 'female',
          age: 38,
          dateOfBirth: new Date('1986-06-20'),
          avatar: {
            public_id: 'manager_avatar',
            url: 'https://res.cloudinary.com/demo/image/upload/v1234567890/manager_avatar.jpg'
          }
        },
        addresses: [
          {
            type: 'work',
            fullAddress: 'Amar Nursery, 100 Garden Way, Building B',
            area: 'Business Park',
            city: 'Green Valley',
            district: 'Plant County',
            division: 'Garden State',
            landmark: 'Greenhouse Management Office'
          }
        ]
      },
      {
        name: 'Plant Expert',
        email: 'expert@amarnursery.com',
        password: await bcrypt.hash('expert123', 12),
        role: 'admin',
        profile: {
          phone: '+1-555-7777',
          gender: 'male',
          age: 42,
          dateOfBirth: new Date('1982-09-10'),
          avatar: {
            public_id: 'expert_avatar',
            url: 'https://res.cloudinary.com/demo/image/upload/v1234567890/expert_avatar.jpg'
          }
        },
        addresses: [
          {
            type: 'work',
            fullAddress: 'Amar Nursery Research Center, 200 Botany Blvd',
            area: 'Research District',
            city: 'Green Valley',
            district: 'Plant County',
            division: 'Garden State',
            landmark: 'Plant Research Laboratory'
          },
          {
            type: 'home',
            fullAddress: '300 Botanist Lane, House 15',
            area: 'Botanical Gardens',
            city: 'Green Valley',
            district: 'Plant County',
            division: 'Garden State',
            landmark: 'Public Botanical Gardens'
          }
        ]
      }
    ];

    // Insert users
    let createdUsers = [];
    for (const userData of usersData) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ email: userData.email });
        if (existingUser) {
          console.log(`👤 User ${userData.email} already exists, skipping...`);
          continue;
        }

        const user = new User(userData);
        const savedUser = await user.save();
        createdUsers.push(savedUser);
        console.log(`✅ Created user: ${savedUser.name} (${savedUser.email}) - Role: ${savedUser.role}`);
      } catch (error) {
        console.error(`❌ Error creating user ${userData.email}:`, error.message);
      }
    }

    console.log(`\n🎉 Database seeding completed!`);
    console.log(`📊 Summary:`);
    console.log(`   • Total users created: ${createdUsers.length}`);
    console.log(`   • Regular users: ${createdUsers.filter(u => u.role === 'user').length}`);
    console.log(`   • Admins: ${createdUsers.filter(u => u.role === 'admin').length}`);
    
    console.log(`\n🔐 Login Credentials:`);
    console.log(`   Admin: admin@amarnursery.com / admin123`);
    console.log(`   Manager: manager@amarnursery.com / manager123`);
    console.log(`   Expert: expert@amarnursery.com / expert123`);
    console.log(`   Users: All user emails / password123`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seeding function
seedData();
