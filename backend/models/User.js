const mongoose = require('mongoose');

// UserCredentials Schema - stores ID and encrypted password
const userCredentialsSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: { 
    type: String, 
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  }
}, {
  timestamps: true
});

// UserProfile Schema - stores user details
const userProfileSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'UserCredentials', 
    required: true,
    unique: true
  },
  fullName: { 
    type: String, 
    required: [true, 'Full name is required'],
    trim: true,
    minlength: [2, 'Full name must be at least 2 characters long'],
    maxlength: [100, 'Full name cannot exceed 100 characters']
  },
  address: { 
    type: String, 
    required: [true, 'Address is required'],
    trim: true,
    maxlength: [200, 'Address cannot exceed 200 characters']
  },
  city: { 
    type: String, 
    required: [true, 'City is required'],
    trim: true,
    maxlength: [50, 'City name cannot exceed 50 characters']
  },
  state: { 
    type: String, 
    required: [true, 'State is required'],
    trim: true,
    maxlength: [2, 'State must be a 2-character code']
  },
  zipcode: { 
    type: String, 
    required: [true, 'Zipcode is required'],
    trim: true,
    match: [/^\d{5}(-\d{4})?$/, 'Please enter a valid zipcode']
  },
  skills: { 
    type: [String], 
    default: [],
    validate: {
      validator: function(skills) {
        return skills.every(skill => skill.trim().length > 0);
      },
      message: 'Skills cannot be empty strings'
    }
  },
  preferences: { 
    type: String, 
    default: "",
    maxlength: [500, 'Preferences cannot exceed 500 characters']
  },
  availability: { 
    type: [String], 
    default: [],
    validate: {
      validator: function(availability) {
        return availability.every(date => /^\d{4}-\d{2}-\d{2}$/.test(date));
      },
      message: 'Availability dates must be in YYYY-MM-DD format'
    }
  }
}, {
  timestamps: true
});

// Create models
const UserCredentials = mongoose.model('UserCredentials', userCredentialsSchema);
const UserProfile = mongoose.model('UserProfile', userProfileSchema);

module.exports = { UserCredentials, UserProfile };