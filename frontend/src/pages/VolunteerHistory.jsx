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

const VolunteerHistory = () => {
  const [futureEvents, setFutureEvents] = React.useState([]);
  const [pastEvents, setPastEvents] = React.useState([]);

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
    fetchEvents();
  }, []);

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
                Volunteer History
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
}

export default VolunteerHistory;
