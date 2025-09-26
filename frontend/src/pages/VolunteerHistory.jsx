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

const volunteerhistory = () => {
  // Dummy data since there's no backend or database for assignment 2
  const dummyFutureEvents = [
    {
      eventName: 'Grocery Delivery',
      eventDesc: 'Deliver groceries to elderly',
      location: 'Metropolis',
      reqSkills: 'Transportation',
      urgency: 'Medium',
      eventDate: '12/24'
    },
    {
      eventName: 'Babysitting',
      eventDesc: 'Watching baby',
      location: 'Metropolis',
      reqSkills: 'Child Care',
      urgency: 'Medium',
      eventDate: '12/25'
    },
    {
      eventName: 'Cooking',
      eventDesc: 'Cook meals for homeless',
      location: 'Metropolis',
      reqSkills: 'Food Preparation & Serving',
      urgency: 'Urgent',
      eventDate: '12/26'
    }]
  const dummyPastEvents = [
    {
      eventName: 'Grocery Delivery',
      eventDesc: 'Deliver groceries to elderly',
      location: 'Metropolis',
      reqSkills: 'Transportation',
      urgency: 'Medium',
      eventDate: '08/24'
    },
    {
      eventName: 'Babysitting',
      eventDesc: 'Watching baby',
      location: 'Metropolis',
      reqSkills: 'Child Care',
      urgency: 'Medium',
      eventDate: '08/25'
    },
    {
      eventName: 'Cooking',
      eventDesc: 'Cook meals for homeless',
      location: 'Metropolis',
      reqSkills: 'Food Preparation & Serving',
      urgency: 'Urgent',
      eventDate: '08/26'
    },
    {
      eventName: 'Grocery Delivery',
      eventDesc: 'Deliver groceries to elderly',
      location: 'Metropolis',
      reqSkills: 'Transportation',
      urgency: 'Medium',
      eventDate: '05/24'
    },
    {
      eventName: 'Babysitting',
      eventDesc: 'Watching baby',
      location: 'Metropolis',
      reqSkills: 'Child Care',
      urgency: 'Medium',
      eventDate: '05/25'
    },
    {
      eventName: 'Cooking',
      eventDesc: 'Cook meals for homeless',
      location: 'Metropolis',
      reqSkills: 'Food Preparation & Serving',
      urgency: 'Urgent',
      eventDate: '05/26'
    }
  ]

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
                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Assigned Volunteer</th>
                  </tr>
                </thead>
                <tbody>
                  {dummyFutureEvents.map((event, index) => (
                    <tr key={index}>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{event.eventName}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{event.eventDesc}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{event.location}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{event.reqSkills}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{event.urgency}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{event.eventDate}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                        {index === 1 ? 'John Doe' : 'Unassigned'}
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
                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Assigned Volunteer</th>
                  </tr>
                </thead>
                <tbody>
                  {dummyPastEvents.map((event, index) => (
                    <tr key={index}>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{event.eventName}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{event.eventDesc}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{event.location}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{event.reqSkills}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{event.urgency}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{event.eventDate}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                        {event.eventName === 'Grocery Delivery' ? 'Jane Doe' : 'John Doe'}
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

export default volunteerhistory;
