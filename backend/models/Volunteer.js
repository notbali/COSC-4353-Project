const mongoose = require('mongoose');

// This model is kept for backward compatibility but the main user data is now in UserCredentials and UserProfile
const volunteerSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  address1: { 
    type: String,
    trim: true,
    maxlength: [200, 'Address cannot exceed 200 characters']
  },
  address2: { 
    type: String,
    trim: true,
    maxlength: [200, 'Address line 2 cannot exceed 200 characters']
  },
  city: { 
    type: String,
    trim: true,
    maxlength: [50, 'City name cannot exceed 50 characters']
  },
  state: { 
    type: String,
    trim: true,
    maxlength: [2, 'State must be a 2-character code']
  },
  zipCode: { 
    type: String,
    trim: true,
    match: [/^\d{5}(-\d{4})?$/, 'Please enter a valid zipcode']
  },
  skills: { 
    type: [String],
    validate: {
      validator: function(skills) {
        return skills.every(skill => skill.trim().length > 0);
      },
      message: 'Skills cannot be empty strings'
    }
  },
  availability: { 
    type: String,
    trim: true
  },
  events: [Object]
}, {
  timestamps: true
});

module.exports = mongoose.model('Volunteer', volunteerSchema);
