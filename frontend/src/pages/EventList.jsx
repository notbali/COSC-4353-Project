import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Card,
  CardContent,
  Fade,
} from "@mui/material";
import { styled, keyframes } from "@mui/system";

const StyledCard = styled(Card)({
  background: "#f5f5f5",
  boxShadow: "0px 4px 20px rgba(0,0,0,0.1)",
  borderRadius: "15px",
  padding: "20px",
  maxWidth: "1200px",
  margin: "auto",
  transition: "all 0.3s ease",
});

const EventList = () => {
  const [futureEvents, setFutureEvents] = React.useState([]);
  const [pastEvents, setPastEvents] = React.useState([]);
  const [currentUserId, setCurrentUserId] = React.useState(null);
  const [currentUserName, setCurrentUserName] = React.useState('');

  React.useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch('http://localhost:5001/api/events');
        if (!res.ok) throw new Error('no backend');
        const data = await res.json();
        setFutureEvents((data && data.futureEvents) || []);
        setPastEvents((data && data.pastEvents) || []);
      } catch (err) {
        console.error('Failed to fetch events:', err.message);
      }
    };
    
    // Get current user info
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');
    setCurrentUserId(userId);
    setCurrentUserName(userName);
    
    fetchEvents();
  }, []);

  const handleAssignToggle = async (event) => {
    if (!currentUserId || !currentUserName) {
      alert('Please log in to assign yourself to events');
      return;
    }

    const isCurrentlyAssigned = event.assignedVolunteers && 
      event.assignedVolunteers.some(volunteer => volunteer.volunteerId === currentUserId);

    try {
      if (isCurrentlyAssigned) {
        // Unassign logic
        const response = await fetch(`http://localhost:5001/api/volunteer-history/${currentUserId}/${event._id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          alert('Successfully unregistered from event!');
          // Refresh the events to show updated assignments
          window.location.reload();
        } else {
          const errorData = await response.json();
          alert(errorData.message || 'Failed to unregister from event');
        }
      } else {
        // Assign logic
        const response = await fetch('http://localhost:5001/api/volunteer-history/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: currentUserId,
            eventId: event._id,
            volunteerName: currentUserName
          })
        });

        if (response.ok) {
          alert('Successfully registered for event!');
          // Refresh the events to show updated assignments
          window.location.reload();
        } else {
          const errorData = await response.json();
          alert(errorData.message || 'Failed to register for event');
        }
      }
    } catch (error) {
      console.error('Error toggling assignment:', error);
      alert('Failed to update assignment');
    }
  };

  return (
    <Container sx={{ mt: 5, mb: 5 }}>
        <Fade in={true} timeout={600}>
          <StyledCard>
            <CardContent>
              <Typography
                variant="h4"
                component="h1"
                gutterBottom
                align="center"
                sx={{ mb: 4, color: "#184b69ff", fontWeight: "bold" }}
                >
                Event List
              </Typography>
              <Typography
                component="p"
                fontSize={20}
                align="center"
                sx={{ mb: 2, color: "#000", fontWeight: "bold" }}
                >
                Upcoming Events
              </Typography>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
                <thead>
                  <tr>
                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Event Name</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Description</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Location</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Required Skills</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Urgency</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Event Date</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Assigned Volunteers</th>
                    {currentUserId && <th style={{ border: '1px solid #ddd', padding: '8px', width: '85px' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {futureEvents.map((event, index) => (
                    <tr key={index}>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{event.eventName}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{event.eventDescription}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{event.location}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{event.requiredSkills.join(', ')}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{event.urgency}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{event.eventDateISO}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                        {event.assignedVolunteers && event.assignedVolunteers.length > 0 ? (
                          <div>
                            {event.assignedVolunteers.map((volunteer, idx) => (
                              <div key={idx} style={{ marginBottom: '4px' }}>
                                <strong>{volunteer.volunteerName}</strong>
                                <span style={{ fontSize: '0.8em', color: '#666' }}> ({volunteer.status})</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          'Unassigned'
                        )}
                      </td>
                      {currentUserId && (
                        <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                          <button
                            onClick={() => handleAssignToggle(event)}
                            style={{
                              backgroundColor: event.assignedVolunteers && 
                                event.assignedVolunteers.some(volunteer => volunteer.volunteerId === currentUserId) 
                                ? '#dc3545' : '#184b69ff',
                              color: 'white',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            {event.assignedVolunteers && 
                              event.assignedVolunteers.some(volunteer => volunteer.volunteerId === currentUserId) 
                              ? 'Cancel' : 'Sign Up'}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              <Typography
                component="p"
                fontSize={20}
                align="center"
                sx={{ mb: 2, color: "#000", fontWeight: "bold" }}
                >
                Past Events
                </Typography>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Event Name</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Description</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Location</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Required Skills</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Urgency</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Event Date</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Assigned Volunteers</th>
                  </tr>
                </thead>
                <tbody>
                  {pastEvents.map((event, index) => (
                    <tr key={index}>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{event.eventName}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{event.eventDescription}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{event.location}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{event.requiredSkills.join(', ')}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{event.urgency}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{event.eventDateISO}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                        {event.assignedVolunteers && event.assignedVolunteers.length > 0 ? (
                          <div>
                            {event.assignedVolunteers.map((volunteer, idx) => (
                              <div key={idx} style={{ marginBottom: '4px' }}>
                                <strong>{volunteer.volunteerName}</strong>
                                <span style={{ fontSize: '0.8em', color: '#666' }}> ({volunteer.status})</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          'No Volunteer'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </StyledCard>
        </Fade>
    </Container>  
  );
};

export default EventList;
