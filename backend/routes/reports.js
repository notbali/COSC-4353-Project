const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { UserCredentials, UserProfile } = require('../models/User');
const EventDetails = require('../models/Event');
const VolunteerHistory = require('../models/VolunteerHistory');
const PDFDocument = require('pdfkit');

// Middleware for authentication
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'no token found' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'invalid token' });
    }
    console.error('Authentication error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Helper function to check if user is admin (you may need to adjust this based on your admin logic)
async function isAdmin(userId) {
  // For now, we'll allow any authenticated user to access reports
  // You can add role checking here if you have an admin field in your User model
  return true;
}

// Get volunteers with participation history
router.get('/volunteers', authenticate, async (req, res) => {
  try {
    console.log('/reports/volunteers called by:', req.user);
    const userProfiles = await UserProfile.find({}).populate('userId', 'username email');
    
    const volunteersWithHistory = await Promise.all(
      userProfiles.map(async (profile) => {
        const history = await VolunteerHistory.find({ userId: profile.userId._id })
          .populate('eventId', 'eventName eventDate location')
          .sort({ participationDate: -1 });
        
        return {
          id: profile.userId._id,
          username: profile.userId.username,
          email: profile.userId.email,
          fullName: profile.fullName,
          // prefer profile.address1/profile.zip but fall back to legacy names if present
          address1: profile.address1 || profile.address || '',
          city: profile.city || '',
          state: profile.state || '',
          zip: profile.zip || profile.zipcode || '',
          skills: profile.skills || [],
          totalEvents: history.length,
          totalHours: history.reduce((sum, h) => sum + (h.hoursVolunteered || 0), 0),
          participationHistory: history.map(h => ({
            eventName: h.eventName,
            eventDate: h.participationDate,
            status: h.status,
            hoursVolunteered: h.hoursVolunteered || 0,
            feedback: h.feedback || '',
            rating: h.rating || null
          }))
        };
      })
    );
    
    res.status(200).json(volunteersWithHistory);
  } catch (error) {
    console.error('Error fetching volunteers report:', error);
    res.status(500).json({ message: 'Error fetching volunteers report', error: error.message });
  }
});

// Get events with volunteer assignments
router.get('/events', authenticate, async (req, res) => {
  try {
    console.log('/reports/events called by:', req.user);
    const events = await EventDetails.find({}).sort({ eventDate: -1 });
    
    const eventsWithVolunteers = await Promise.all(
      events.map(async (event) => {
        const volunteerHistories = await VolunteerHistory.find({ eventId: event._id })
          .populate('userId', 'username email');
        
        const assignedVolunteers = await Promise.all(
          volunteerHistories.map(async (history) => {
            // history.userId may be null if the referenced user was deleted
            const populatedUser = history.userId;
            let volunteerId = null;
            let volunteerName = history.volunteerName || '';
            let username = null;
            let email = null;

            if (populatedUser) {
              volunteerId = populatedUser._id;
              username = populatedUser.username;
              email = populatedUser.email;
              const userProfile = await UserProfile.findOne({ userId: volunteerId });
              if (userProfile && userProfile.fullName) {
                volunteerName = userProfile.fullName;
              }
            } else if (history.userId) {
              // If not populated but still present as an ObjectId
              volunteerId = history.userId;
            }

            return {
              volunteerId: volunteerId,
              volunteerName: volunteerName,
              username: username,
              email: email,
              status: history.status,
              hoursVolunteered: history.hoursVolunteered || 0,
              assignedAt: history.createdAt,
              feedback: history.feedback || '',
              rating: history.rating || null
            };
          })
        );
        
        return {
          eventId: event._id,
          eventName: event.eventName,
          eventDescription: event.eventDescription,
          location: event.location,
          eventDate: event.eventDate,
          eventDateISO: event.eventDateISO,
          requiredSkills: event.requiredSkills,
          urgency: event.urgency,
          status: event.status,
          maxVolunteers: event.maxVolunteers,
          currentVolunteers: event.currentVolunteers,
          assignedVolunteers: assignedVolunteers,
          volunteerCount: assignedVolunteers.length
        };
      })
    );
    
    res.status(200).json(eventsWithVolunteers);
  } catch (error) {
    console.error('Error fetching events report:', error);
    res.status(500).json({ message: 'Error fetching events report', error: error.message });
  }
});

// Generate CSV report for volunteers
router.get('/volunteers/csv', authenticate, async (req, res) => {
  try {
    const userProfiles = await UserProfile.find({}).populate('userId', 'username email');
    
    const csvRows = [];
    csvRows.push('ID,Username,Email,Full Name,Address,City,State,Zipcode,Skills,Total Events,Total Hours');
    
    for (const profile of userProfiles) {
      const history = await VolunteerHistory.find({ userId: profile.userId._id });
      const totalEvents = history.length;
      const totalHours = history.reduce((sum, h) => sum + (h.hoursVolunteered || 0), 0);
      const skills = (profile.skills || []).join('; ');
      
      csvRows.push([
        profile.userId._id,
        profile.userId.username,
        profile.userId.email,
        `"${profile.fullName}"`,
        `"${profile.address1 || profile.address || ''}"`,
        `"${profile.city || ''}"`,
        profile.state || '',
        profile.zip || profile.zipcode || '',
        `"${skills}"`,
        totalEvents,
        totalHours
      ].join(','));
    }
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=volunteers-report.csv');
    res.send(csvRows.join('\n'));
  } catch (error) {
    console.error('Error generating CSV report:', error);
    res.status(500).json({ message: 'Error generating CSV report', error: error.message });
  }
});

// Generate CSV report for events
router.get('/events/csv', authenticate, async (req, res) => {
  try {
    const events = await EventDetails.find({}).sort({ eventDate: -1 });
    
    const csvRows = [];
    csvRows.push('Event ID,Event Name,Location,Event Date,Required Skills,Urgency,Status,Max Volunteers,Current Volunteers,Assigned Volunteer Names');
    
    for (const event of events) {
      const volunteerHistories = await VolunteerHistory.find({ eventId: event._id })
        .populate('userId');
      
      const volunteerNames = await Promise.all(
        volunteerHistories.map(async (history) => {
          const userProfile = await UserProfile.findOne({ userId: history.userId._id });
          return userProfile ? userProfile.fullName : history.volunteerName;
        })
      );
      
      csvRows.push([
        event._id,
        `"${event.eventName}"`,
        `"${event.location || ''}"`,
        event.eventDateISO || '',
        `"${(event.requiredSkills || []).join('; ')}"`,
        event.urgency || '',
        event.status || '',
        event.maxVolunteers || 0,
        event.currentVolunteers || 0,
        `"${volunteerNames.join('; ')}"`
      ].join(','));
    }
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=events-report.csv');
    res.send(csvRows.join('\n'));
  } catch (error) {
    console.error('Error generating CSV report:', error);
    res.status(500).json({ message: 'Error generating CSV report', error: error.message });
  }
});

// Generate PDF report for volunteers
router.get('/volunteers/pdf', authenticate, async (req, res) => {
  try {
    const userProfiles = await UserProfile.find({}).populate('userId', 'username email');
    
    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=volunteers-report.pdf');
    doc.pipe(res);
    
    // Header
    doc.fontSize(20).text('Volunteers Participation Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(2);
    
    for (let i = 0; i < userProfiles.length; i++) {
      const profile = userProfiles[i];
      const history = await VolunteerHistory.find({ userId: profile.userId._id })
        .populate('eventId', 'eventName eventDate')
        .sort({ participationDate: -1 });
      
      const totalEvents = history.length;
      const totalHours = history.reduce((sum, h) => sum + (h.hoursVolunteered || 0), 0);
      
      // Check if we need a new page
      if (i > 0 && doc.y > 700) {
        doc.addPage();
      }
      
      // Volunteer info
      doc.fontSize(14).text(`${profile.fullName}`, { underline: true });
      doc.fontSize(10);
      doc.text(`Username: ${profile.userId.username}`);
      doc.text(`Email: ${profile.userId.email}`);
      doc.text(`Address: ${profile.address1 || profile.address || 'N/A'}, ${profile.city || 'N/A'}, ${profile.state || 'N/A'} ${profile.zip || profile.zipcode || ''}`);
      doc.text(`Skills: ${(profile.skills || []).join(', ') || 'None'}`);
      doc.text(`Total Events: ${totalEvents} | Total Hours: ${totalHours}`);
      doc.moveDown();
      
      // Participation history
      if (history.length > 0) {
        doc.fontSize(12).text('Participation History:', { underline: true });
        doc.fontSize(10);
        history.forEach((h, idx) => {
          if (doc.y > 750) {
            doc.addPage();
          }
          doc.text(`${idx + 1}. ${h.eventName} - ${new Date(h.participationDate).toLocaleDateString()} (${h.status}) - ${h.hoursVolunteered || 0} hours`);
        });
      } else {
        doc.text('No participation history');
      }
      
      doc.moveDown(2);
    }
    
    doc.end();
  } catch (error) {
    console.error('Error generating PDF report:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error generating PDF report', error: error.message });
    }
  }
});

// Generate PDF report for events
router.get('/events/pdf', authenticate, async (req, res) => {
  try {
    const events = await EventDetails.find({}).sort({ eventDate: -1 });
    
    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=events-report.pdf');
    doc.pipe(res);
    
    // Header
    doc.fontSize(20).text('Events and Volunteer Assignments Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(2);
    
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const volunteerHistories = await VolunteerHistory.find({ eventId: event._id })
        .populate('userId');
      
      const assignedVolunteers = await Promise.all(
        volunteerHistories.map(async (history) => {
          const userProfile = await UserProfile.findOne({ userId: history.userId._id });
          return userProfile ? userProfile.fullName : history.volunteerName;
        })
      );
      
      // Check if we need a new page
      if (i > 0 && doc.y > 700) {
        doc.addPage();
      }
      
      // Event info
      doc.fontSize(14).text(event.eventName, { underline: true });
      doc.fontSize(10);
      doc.text(`Date: ${event.eventDateISO || new Date(event.eventDate).toLocaleDateString()}`);
      doc.text(`Location: ${event.location || 'N/A'}`);
      doc.text(`Urgency: ${event.urgency || 'N/A'}`);
      doc.text(`Status: ${event.status || 'N/A'}`);
      doc.text(`Required Skills: ${(event.requiredSkills || []).join(', ') || 'None'}`);
      doc.text(`Volunteers: ${event.currentVolunteers || 0} / ${event.maxVolunteers || 0}`);
      doc.moveDown();
      
      // Assigned volunteers
      if (assignedVolunteers.length > 0) {
        doc.fontSize(12).text('Assigned Volunteers:', { underline: true });
        doc.fontSize(10);
        assignedVolunteers.forEach((name, idx) => {
          if (doc.y > 750) {
            doc.addPage();
          }
          doc.text(`${idx + 1}. ${name}`);
        });
      } else {
        doc.text('No volunteers assigned');
      }
      
      doc.moveDown(2);
    }
    
    doc.end();
  } catch (error) {
    console.error('Error generating PDF report:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error generating PDF report', error: error.message });
    }
  }
});

module.exports = router;

