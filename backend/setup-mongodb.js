#!/usr/bin/env node

/**
 * MongoDB Setup Script
 * This script helps set up the MongoDB database with initial data according to requirements
 */

require('dotenv').config();
const mongoose = require('mongoose');
const EventDetails = require('./models/Event');
const Volunteer = require('./models/Volunteer');
const States = require('./models/States');
const { UserCredentials, UserProfile } = require('./models/User');
const bcrypt = require('bcryptjs');

const connectDB = async () => {
  try {
    // Load from .env file
    const mongoURI = process.env.MONGODB_URI;
    
    // Check if URI exists
    if (!mongoURI) {
      console.error('❌ MONGODB_URI not found in environment variables!');
      console.error('Please check your .env file exists in the backend folder');
      console.error('Current directory:', __dirname);
      process.exit(1);
    }
    
    console.log('🔗 Connecting to MongoDB Atlas...');
    
    // Remove deprecated options
    await mongoose.connect(mongoURI);
    
    console.log('✅ Connected to MongoDB Atlas');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const seedStates = async () => {
  try {
    console.log('🌱 Seeding states data...');
    
    // Clear existing states
    await States.deleteMany({});
    
    const states = [
      { stateCode: 'AL', stateName: 'Alabama', region: 'Southeast' },
      { stateCode: 'AK', stateName: 'Alaska', region: 'Pacific' },
      { stateCode: 'AZ', stateName: 'Arizona', region: 'Southwest' },
      { stateCode: 'AR', stateName: 'Arkansas', region: 'Southeast' },
      { stateCode: 'CA', stateName: 'California', region: 'West' },
      { stateCode: 'CO', stateName: 'Colorado', region: 'West' },
      { stateCode: 'CT', stateName: 'Connecticut', region: 'Northeast' },
      { stateCode: 'DE', stateName: 'Delaware', region: 'Northeast' },
      { stateCode: 'DC', stateName: 'District of Columbia', region: 'Northeast' },
      { stateCode: 'FL', stateName: 'Florida', region: 'Southeast' },
      { stateCode: 'GA', stateName: 'Georgia', region: 'Southeast' },
      { stateCode: 'HI', stateName: 'Hawaii', region: 'Pacific' },
      { stateCode: 'ID', stateName: 'Idaho', region: 'West' },
      { stateCode: 'IL', stateName: 'Illinois', region: 'Midwest' },
      { stateCode: 'IN', stateName: 'Indiana', region: 'Midwest' },
      { stateCode: 'IA', stateName: 'Iowa', region: 'Midwest' },
      { stateCode: 'KS', stateName: 'Kansas', region: 'Midwest' },
      { stateCode: 'KY', stateName: 'Kentucky', region: 'Southeast' },
      { stateCode: 'LA', stateName: 'Louisiana', region: 'Southeast' },
      { stateCode: 'ME', stateName: 'Maine', region: 'Northeast' },
      { stateCode: 'MD', stateName: 'Maryland', region: 'Northeast' },
      { stateCode: 'MA', stateName: 'Massachusetts', region: 'Northeast' },
      { stateCode: 'MI', stateName: 'Michigan', region: 'Midwest' },
      { stateCode: 'MN', stateName: 'Minnesota', region: 'Midwest' },
      { stateCode: 'MS', stateName: 'Mississippi', region: 'Southeast' },
      { stateCode: 'MO', stateName: 'Missouri', region: 'Midwest' },
      { stateCode: 'MT', stateName: 'Montana', region: 'West' },
      { stateCode: 'NE', stateName: 'Nebraska', region: 'Midwest' },
      { stateCode: 'NV', stateName: 'Nevada', region: 'West' },
      { stateCode: 'NH', stateName: 'New Hampshire', region: 'Northeast' },
      { stateCode: 'NJ', stateName: 'New Jersey', region: 'Northeast' },
      { stateCode: 'NM', stateName: 'New Mexico', region: 'Southwest' },
      { stateCode: 'NY', stateName: 'New York', region: 'Northeast' },
      { stateCode: 'NC', stateName: 'North Carolina', region: 'Southeast' },
      { stateCode: 'ND', stateName: 'North Dakota', region: 'Midwest' },
      { stateCode: 'OH', stateName: 'Ohio', region: 'Midwest' },
      { stateCode: 'OK', stateName: 'Oklahoma', region: 'Southwest' },
      { stateCode: 'OR', stateName: 'Oregon', region: 'West' },
      { stateCode: 'PA', stateName: 'Pennsylvania', region: 'Northeast' },
      { stateCode: 'RI', stateName: 'Rhode Island', region: 'Northeast' },
      { stateCode: 'SC', stateName: 'South Carolina', region: 'Southeast' },
      { stateCode: 'SD', stateName: 'South Dakota', region: 'Midwest' },
      { stateCode: 'TN', stateName: 'Tennessee', region: 'Southeast' },
      { stateCode: 'TX', stateName: 'Texas', region: 'Southwest' },
      { stateCode: 'UT', stateName: 'Utah', region: 'West' },
      { stateCode: 'VT', stateName: 'Vermont', region: 'Northeast' },
      { stateCode: 'VA', stateName: 'Virginia', region: 'Southeast' },
      { stateCode: 'WA', stateName: 'Washington', region: 'West' },
      { stateCode: 'WV', stateName: 'West Virginia', region: 'Southeast' },
      { stateCode: 'WI', stateName: 'Wisconsin', region: 'Midwest' },
      { stateCode: 'WY', stateName: 'Wyoming', region: 'West' }
    ];
    
    const createdStates = await States.insertMany(states);
    console.log(`✅ Created ${createdStates.length} states`);
    
  } catch (error) {
    console.error('❌ Error seeding states:', error);
  }
};

const seedEvents = async () => {
  try {
    console.log('🌱 Seeding events data...');
    
    // Clear existing events
    await EventDetails.deleteMany({});
    
    const events = [
      {
        eventName: 'Community Food Drive',
        eventDescription: 'Help collect and organize food donations for local food bank',
        location: '123 Main St, Metropolis, DC 20001',
        requiredSkills: ['Organization', 'Physical Labor'],
        urgency: 'Medium',
        eventDate: new Date('2025-01-15'),
        eventDateISO: '2025-01-15',
        maxVolunteers: 20,
        currentVolunteers: 0
      },
      {
        eventName: 'Senior Center Activities',
        eventDescription: 'Assist with recreational activities and social events for elderly residents',
        location: '456 Elder Ave, Metropolis, DC 20002',
        requiredSkills: ['Communication', 'Patience', 'Entertainment'],
        urgency: 'Low',
        eventDate: new Date('2025-01-20'),
        eventDateISO: '2025-01-20',
        maxVolunteers: 10,
        currentVolunteers: 0
      },
      {
        eventName: 'Emergency Shelter Support',
        eventDescription: 'Provide immediate assistance and support at emergency shelter during crisis',
        location: '789 Crisis St, Metropolis, DC 20003',
        requiredSkills: ['Crisis Management', 'First Aid', 'Communication'],
        urgency: 'Urgent',
        eventDate: new Date('2025-01-10'),
        eventDateISO: '2025-01-10',
        maxVolunteers: 15,
        currentVolunteers: 0
      },
      {
        eventName: 'Environmental Cleanup',
        eventDescription: 'Clean up local parks and waterways to protect the environment',
        location: '321 Green Park, Metropolis, DC 20004',
        requiredSkills: ['Physical Labor', 'Environmental Awareness'],
        urgency: 'Medium',
        eventDate: new Date('2025-01-25'),
        eventDateISO: '2025-01-25',
        maxVolunteers: 25,
        currentVolunteers: 0
      },
      {
        eventName: 'Youth Mentoring Program',
        eventDescription: 'Mentor and guide young people in educational and life skills',
        location: '654 Youth Center, Metropolis, DC 20005',
        requiredSkills: ['Mentoring', 'Education', 'Communication'],
        urgency: 'High',
        eventDate: new Date('2025-01-30'),
        eventDateISO: '2025-01-30',
        maxVolunteers: 12,
        currentVolunteers: 0
      }
    ];
    
    const createdEvents = await EventDetails.insertMany(events);
    console.log(`✅ Created ${createdEvents.length} events`);
    
  } catch (error) {
    console.error('❌ Error seeding events:', error);
  }
};

const seedUsers = async () => {
  try {
    console.log('🌱 Seeding users data...');
    
    // Clear existing users
    await UserCredentials.deleteMany({});
    await UserProfile.deleteMany({});
    
    // Create sample users
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const userCredentials = new UserCredentials({
      username: 'john_doe',
      email: 'john.doe@example.com',
      password: hashedPassword
    });
    await userCredentials.save();
    
    const userProfile = new UserProfile({
      userId: userCredentials._id,
      fullName: 'John Doe',
      address: '123 Volunteer Lane',
      city: 'Metropolis',
      state: 'DC',
      zipcode: '20001',
      skills: ['Communication', 'Organization', 'Physical Labor'],
      preferences: 'Prefers outdoor activities and working with children',
      availability: ['2025-01-15', '2025-01-20', '2025-01-25']
    });
    await userProfile.save();
    
    // Create second user
    const hashedPassword2 = await bcrypt.hash('password123', 10);
    
    const userCredentials2 = new UserCredentials({
      username: 'jane_smith',
      email: 'jane.smith@example.com',
      password: hashedPassword2
    });
    await userCredentials2.save();
    
    const userProfile2 = new UserProfile({
      userId: userCredentials2._id,
      fullName: 'Jane Smith',
      address: '456 Helper Street',
      city: 'Metropolis',
      state: 'DC',
      zipcode: '20002',
      skills: ['Mentoring', 'Education', 'Crisis Management'],
      preferences: 'Enjoys working with youth and emergency response',
      availability: ['2025-01-10', '2025-01-30']
    });
    await userProfile2.save();
    
    console.log('✅ Created 2 sample users with profiles');
    
  } catch (error) {
    console.error('❌ Error seeding users:', error);
  }
};

const seedData = async () => {
  try {
    console.log('🌱 Seeding initial data...');
    
    await seedStates();
    await seedEvents();
    await seedUsers();
    
    console.log('🎉 Database setup complete!');
    console.log('\n📋 Database Structure Created:');
    console.log('   ✅ UserCredentials - stores user IDs and encrypted passwords');
    console.log('   ✅ UserProfile - stores user details (name, address, skills, etc.)');
    console.log('   ✅ EventDetails - stores event information');
    console.log('   ✅ VolunteerHistory - tracks volunteer participation');
    console.log('   ✅ States - stores state codes and names');
    console.log('\n🔐 Sample Login Credentials:');
    console.log('   Username: john_doe, Password: password123');
    console.log('   Username: jane_smith, Password: password123');
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  }
};

const main = async () => {
  console.log('🚀 Starting MongoDB setup for Volunteer Management System...');
  await connectDB();
  await seedData();
  await mongoose.connection.close();
  console.log('\n✅ Setup complete! You can now run: npm run dev');
  console.log('📖 Check MONGODB_SETUP.md for detailed setup instructions');
};

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { connectDB, seedData };
