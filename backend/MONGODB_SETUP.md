# MongoDB Setup Guide

This project has been configured to use MongoDB as the database instead of in-memory storage.

## Prerequisites

1. **MongoDB Installation**: Make sure MongoDB is installed on your system
   - Download from: https://www.mongodb.com/try/download/community
   - Or use MongoDB Atlas (cloud): https://www.mongodb.com/atlas

2. **Node.js Dependencies**: Install the required packages
   ```bash
   cd backend
   npm install
   ```

## Configuration

### Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
MONGODB_URI=mongodb://localhost:27017/volunteer-app
JWT_SECRET=your_jwt_secret
PORT=5001
```

### For MongoDB Atlas (Cloud)
If using MongoDB Atlas, replace the MONGODB_URI with your Atlas connection string:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/volunteer-app
```

## Running the Application

1. **Start MongoDB** (if running locally):
   ```bash
   # On Windows
   net start MongoDB
   
   # On macOS/Linux
   sudo systemctl start mongod
   ```

2. **Start the Backend Server**:
   ```bash
   cd backend
   npm run dev
   ```

## Database Schema

The application uses the following MongoDB collections:

### Users Collection
- `username` (String, unique)
- `email` (String, unique)
- `password` (String, hashed)
- `profile` (Object with user profile information)
  - `name`, `address1`, `address2`, `city`, `state`, `zip`
  - `skills` (Array of strings)
  - `preferences`, `availability` (Array of strings)

### Events Collection
- `eventName` (String)
- `eventDescription` (String)
- `location` (String)
- `requiredSkills` (Array of strings)
- `urgency` (String)
- `eventDate` (Date)
- `eventDateISO` (String)
- `matchedVolunteer` (ObjectId reference)
- `matchedVolunteerName` (String)
- `matchedAt` (Date)

### Volunteers Collection
- `name` (String)
- `address1`, `address2`, `city`, `state`, `zipCode` (Strings)
- `skills` (Array of strings)
- `availability` (String)
- `events` (Array of objects)

### Notifications Collection
- `title` (String)
- `event` (ObjectId reference to Event)
- `eventName`, `eventDescription`, `location` (Strings)
- `eventDate` (Date)
- `user` (ObjectId reference to User)

## Migration from In-Memory Storage

The application has been migrated from in-memory storage to MongoDB. All existing functionality remains the same, but data is now persisted in the database.

### Key Changes Made:
1. Added MongoDB connection configuration
2. Updated User model to include profile fields
3. Replaced in-memory arrays with MongoDB operations
4. Updated all route handlers to use async/await with MongoDB queries
5. Added proper error handling for database operations

## Troubleshooting

### Connection Issues
- Ensure MongoDB is running on your system
- Check that the MONGODB_URI in your `.env` file is correct
- Verify network connectivity if using MongoDB Atlas

### Data Issues
- The database will be created automatically when you first run the application
- Collections will be created when the first document is inserted
- You can use MongoDB Compass or similar tools to view your data

### Development
- Use `npm run dev` for development with auto-restart
- Check console logs for connection status and errors
- The application will exit if it cannot connect to MongoDB
