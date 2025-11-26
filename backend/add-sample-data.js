#!/usr/bin/env node

/**
 * Add Sample Data Script (Non-destructive)
 * This script adds sample data WITHOUT deleting existing data
 * Use this to populate the database with test data for reports
 */

require('dotenv').config();
const mongoose = require('mongoose');
const EventDetails = require('./models/Event');
const { UserCredentials, UserProfile } = require('./models/User');
const VolunteerHistory = require('./models/VolunteerHistory');
const bcrypt = require('bcryptjs');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      console.error('❌ MONGODB_URI not found in environment variables!');
      process.exit(1);
    }
    
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Helper to get future dates
const getFutureDate = (daysFromNow) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date;
};

const formatDateISO = (date) => {
  return date.toISOString().split('T')[0];
};

const addSampleEvents = async () => {
  try {
    console.log('🌱 Adding sample events...');
    
    // Check if events already exist
    const existingCount = await EventDetails.countDocuments({});
    if (existingCount > 0) {
      console.log(`ℹ️  ${existingCount} events already exist. Skipping event creation.`);
      return await EventDetails.find({}).limit(5);
    }
    
    const events = [
      {
        eventName: 'Community Food Drive',
        eventDescription: 'Help collect and organize food donations for local food bank',
        location: '123 Main St, Metropolis, DC 20001',
        requiredSkills: ['Organization', 'Physical Labor'],
        urgency: 'Medium',
        eventDate: getFutureDate(15),
        eventDateISO: formatDateISO(getFutureDate(15)),
        maxVolunteers: 20,
        currentVolunteers: 0
      },
      {
        eventName: 'Senior Center Activities',
        eventDescription: 'Assist with recreational activities and social events for elderly residents',
        location: '456 Elder Ave, Metropolis, DC 20002',
        requiredSkills: ['Communication', 'Patience', 'Entertainment'],
        urgency: 'Low',
        eventDate: getFutureDate(20),
        eventDateISO: formatDateISO(getFutureDate(20)),
        maxVolunteers: 10,
        currentVolunteers: 0
      },
      {
        eventName: 'Emergency Shelter Support',
        eventDescription: 'Provide immediate assistance and support at emergency shelter during crisis',
        location: '789 Crisis St, Metropolis, DC 20003',
        requiredSkills: ['Crisis Management', 'First Aid', 'Communication'],
        urgency: 'Urgent',
        eventDate: getFutureDate(10),
        eventDateISO: formatDateISO(getFutureDate(10)),
        maxVolunteers: 15,
        currentVolunteers: 0
      },
      {
        eventName: 'Environmental Cleanup',
        eventDescription: 'Clean up local parks and waterways to protect the environment',
        location: '321 Green Park, Metropolis, DC 20004',
        requiredSkills: ['Physical Labor', 'Environmental Awareness'],
        urgency: 'Medium',
        eventDate: getFutureDate(25),
        eventDateISO: formatDateISO(getFutureDate(25)),
        maxVolunteers: 25,
        currentVolunteers: 0
      },
      {
        eventName: 'Youth Mentoring Program',
        eventDescription: 'Mentor and guide young people in educational and life skills',
        location: '654 Youth Center, Metropolis, DC 20005',
        requiredSkills: ['Mentoring', 'Education', 'Communication'],
        urgency: 'High',
        eventDate: getFutureDate(30),
        eventDateISO: formatDateISO(getFutureDate(30)),
        maxVolunteers: 12,
        currentVolunteers: 0
      }
    ];
    
    const createdEvents = await EventDetails.insertMany(events);
    console.log(`✅ Created ${createdEvents.length} sample events`);
    return createdEvents;
    
  } catch (error) {
    console.error('❌ Error adding events:', error.message);
    // Return existing events if creation failed
    return await EventDetails.find({}).limit(5);
  }
};

const addSampleUsers = async () => {
  try {
    console.log('🌱 Adding sample users...');
    
    // Check if users already exist
    const existingCount = await UserProfile.countDocuments({});
    if (existingCount > 0) {
      console.log(`ℹ️  ${existingCount} users already exist. Skipping user creation.`);
      return await UserProfile.find({}).populate('userId').limit(2);
    }
    
    // Create first user
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
      availability: []
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
      availability: []
    });
    await userProfile2.save();
    
    console.log('✅ Created 2 sample users');
    return await UserProfile.find({}).populate('userId').limit(2);
    
  } catch (error) {
    console.error('❌ Error adding users:', error.message);
    // Return existing users if creation failed
    return await UserProfile.find({}).populate('userId').limit(2);
  }
};

const addSampleVolunteerHistory = async (users, events) => {
  try {
    console.log('🌱 Adding sample volunteer history...');
    
    if (!users || users.length === 0 || !events || events.length === 0) {
      console.log('⚠️  No users or events available. Skipping volunteer history.');
      return;
    }
    
    // Check existing history
    const existingCount = await VolunteerHistory.countDocuments({});
    if (existingCount > 0) {
      console.log(`ℹ️  ${existingCount} volunteer history records already exist. Skipping.`);
      return;
    }
    
    const historyRecords = [];
    
    // First user participates in first 3 events
    if (users[0] && events.length >= 3) {
      for (let i = 0; i < 3; i++) {
        const event = events[i];
        historyRecords.push({
          userId: users[0].userId._id,
          eventId: event._id,
          eventName: event.eventName,
          volunteerName: users[0].fullName,
          participationDate: new Date(event.eventDate),
          status: i === 0 ? 'Attended' : i === 1 ? 'Registered' : 'Attended',
          hoursVolunteered: i === 0 ? 5 : i === 1 ? 0 : 8,
          feedback: i === 0 ? 'Great experience!' : '',
          rating: i === 0 ? 5 : i === 2 ? 4 : null
        });
        
        // Update event volunteer count
        event.currentVolunteers = (event.currentVolunteers || 0) + 1;
        await event.save();
      }
    }
    
    // Second user participates in last 2 events
    if (users[1] && events.length >= 2) {
      const startIdx = events.length - 2;
      for (let i = startIdx; i < events.length; i++) {
        const event = events[i];
        historyRecords.push({
          userId: users[1].userId._id,
          eventId: event._id,
          eventName: event.eventName,
          volunteerName: users[1].fullName,
          participationDate: new Date(event.eventDate),
          status: i === startIdx ? 'Attended' : 'Registered',
          hoursVolunteered: i === startIdx ? 6 : 0,
          feedback: i === startIdx ? 'Very rewarding!' : '',
          rating: i === startIdx ? 5 : null
        });
        
        // Update event volunteer count
        event.currentVolunteers = (event.currentVolunteers || 0) + 1;
        await event.save();
      }
    }
    
    if (historyRecords.length > 0) {
      await VolunteerHistory.insertMany(historyRecords);
      console.log(`✅ Created ${historyRecords.length} volunteer history records`);
    } else {
      console.log('⚠️  No volunteer history records created');
    }
    
  } catch (error) {
    console.error('❌ Error adding volunteer history:', error.message);
  }
};

const main = async () => {
  console.log('🚀 Adding sample data for Reports module...');
  console.log('ℹ️  This script will NOT delete existing data\n');
  
  await connectDB();
  
  const events = await addSampleEvents();
  const users = await addSampleUsers();
  await addSampleVolunteerHistory(users, events);
  
  await mongoose.connection.close();
  
  console.log('\n✅ Sample data added successfully!');
  console.log('\n📊 You can now view reports at: http://localhost:3000/reports');
  console.log('🔐 Login with: john_doe / password123 or jane_smith / password123');
};

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { addSampleEvents, addSampleUsers, addSampleVolunteerHistory };

