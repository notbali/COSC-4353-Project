import React, { useState, useEffect } from "react";
import {
  Container,
  Button,
  Typography,
  TextField,
  Box,
  Card,
  CardContent,
  Fade,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import { styled} from "@mui/system";

const StyledCard = styled(Card)({
  background: "#f5f5f5",
  boxShadow: "0px 4px 20px rgba(0,0,0,0.1)",
  borderRadius: "15px",
  padding: "20px",
  maxWidth: "800px",
  margin: "auto",
  transition: "all 0.3s ease",
});

const StyledButton = styled(Button)({
  backgroundColor: "#184b69ff",
  color: "#ffffff",
  fontWeight: "bold",
  padding: "10px 20px",
  transition: "transform 0.2s ease",
  "&:hover": {
    backgroundColor: "#1f5777ff",
    transform: "scale(1.03)",
  },
});

const VolunteerMatchingForm = () => {

  const [volunteers, setVolunteers] = useState([]);
  const [matchingEvents, setMatchingEvents] = useState([]);
  const [selectedVolunteer, setSelectedVolunteer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchVolunteers = async () => {
      try {
        const res = await fetch('http://localhost:5001/api/volunteers');
        if (!res.ok) throw new Error('no backend');
        const data = await res.json();
        setVolunteers(data);
      } catch (err) {
        console.log("Failed to connect to backend for volunteers");
      }
    };
    fetchVolunteers();
  }, []);

  useEffect(() => {
    if (!selectedVolunteer) return;
    const fetchMatches = async () => {
      try {
        const res = await fetch(`http://localhost:5001/api/match/${selectedVolunteer}`);
        if (!res.ok) throw new Error('no match endpoint');
        const data = await res.json();
        setMatchingEvents(data);
      } catch (err) {
        console.log("Failed to connect to backend for volunteers");
      }
    };
    fetchMatches();
  }, [selectedVolunteer]);

  const handleMatch = async (eventObj) => {
    setIsSubmitting(true);
    try {
      const eventId = eventObj.id || eventObj._id;
      
      // Create the match record
      const matchRes = await fetch('http://localhost:5001/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volunteerId: selectedVolunteer, eventId: eventId }),
      });
      if (!matchRes.ok) {
        const err = await matchRes.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to match');
      }
      const matchBody = await matchRes.json();

      // Add to volunteer history
      const historyRes = await fetch('http://localhost:5001/api/volunteer-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: selectedVolunteer, 
          eventId: eventId,
          volunteerName: selectedVolunteerObj ? selectedVolunteerObj.name : 'Unknown Volunteer'
        }),
      });
      
      if (!historyRes.ok) {
        const histErr = await historyRes.json().catch(() => ({}));
        console.warn('Failed to create history record:', histErr.message);
      }

      setMatchingEvents(prev => prev.map(ev => {
        const evId = ev.id || ev._id;
        if (evId === eventId) {
          const updated = matchBody.event || { ...ev };
          updated.matchedVolunteer = selectedVolunteer;
          updated.matchedVolunteerName = (selectedVolunteerObj && selectedVolunteerObj.name) || updated.matchedVolunteerName;
          updated.matchedAt = (matchBody.event && matchBody.event.matchedAt) || new Date().toISOString();
          return updated;
        }
        return ev;
      }));

      window.alert('Volunteer matched to event and added to history!');
    } catch (err) {
      console.error(err);
      window.alert('Error matching volunteer: ' + (err.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedVolunteerObj = volunteers.find(v => v.id === selectedVolunteer);
  

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
          Volunteer Matching Form
          </Typography>
        <Typography
          component="p"
          fontSize={20}
          align="center"
          sx={{ mb: 2, color: "#000", fontWeight: "bold" }}
          >
          Which volunteer would you like to assign an event to?
        </Typography>
        <Box mb={3} >
          <Autocomplete
            options={volunteers}
            getOptionLabel={option => option.name || ''}
            value={selectedVolunteer ? volunteers.find(v => v.id === selectedVolunteer) || null : null}
            onChange={(event, newValue) => {
              if (newValue) setSelectedVolunteer(newValue.id);
              else setSelectedVolunteer('');
            }}
            renderInput={(params) => (
              <TextField {...params}  variant="outlined" label="Volunteer *"/>
            )}
            isOptionEqualToValue={(option, value) => (option && value) ? option.id === value.id : false}
            fullWidth
          />
        </Box>
        {selectedVolunteerObj && (
        <Box mt={2} mb={5}p={2} bgcolor="#fff" borderRadius={2} boxShadow={1}>
          <Typography variant="h6"><b>Name: {selectedVolunteerObj.name}</b></Typography>
          <Typography variant="body2"><b>Address 1:</b> {selectedVolunteerObj.address1}</Typography>
          {selectedVolunteerObj.address2 && (
            <Typography variant="body2"><b>Address 2:</b> {selectedVolunteerObj.address2}</Typography>
          )}
          <Typography variant="body2"><b>City:</b> {selectedVolunteerObj.city}</Typography>
          <Typography variant="body2"><b>State:</b> {selectedVolunteerObj.state}</Typography>
          <Typography variant="body2"><b>Zip Code:</b> {selectedVolunteerObj.zipCode}</Typography>
          {selectedVolunteerObj.skills && selectedVolunteerObj.skills.length > 0 && (
            <Typography variant="body2"><b>Skills:</b> {selectedVolunteerObj.skills.join(', ')}</Typography>
          )}
          {selectedVolunteerObj.availability && selectedVolunteerObj.availability.length > 0 && (
            <Typography variant="body2"><b>Availability:</b> {selectedVolunteerObj.availability.join(', ')}</Typography>
          )}
          {selectedVolunteerObj.preferences && selectedVolunteerObj.preferences.length > 0 && (
            <Typography variant="body2"><b>Preferences:</b> {selectedVolunteerObj.preferences}</Typography>
          )}
        </Box>
        )}
        {selectedVolunteer && (
          <>
            <Typography
              component="p"
              fontSize={20}
              align="center"
              sx={{ mb: 1, color: "#000", fontWeight: "bold" }}
            >
              {matchingEvents && matchingEvents.length > 0 ? `Here are some events that match ${selectedVolunteerObj.name}'s skills:` : `No matching events found for ${selectedVolunteerObj.name}.`}
            </Typography>
            <Box mt={2}>
              {matchingEvents.map((event) => (
                <Box
                  key={event.id}
                  mb={2}
                  p={2}
                  bgcolor="#fff"
                  borderRadius={2}
                  boxShadow={1}
                  display="flex"
                  flexDirection="column"
                  gap={1}
                >
                  <Typography variant="subtitle1"><b>{event.eventName}</b></Typography>
                  <Typography variant="body2"><b>Description:</b> {event.eventDescription}</Typography>
                  <Typography variant="body2"><b>Location:</b> {event.location}</Typography>
                  <Typography variant="body2"><b>Required Skills:</b> {event.requiredSkills.join(', ')}</Typography>
                  <Typography variant="body2"><b>Urgency:</b> {event.urgency}</Typography>
                  <Typography variant="body2"><b>Date:</b> {event.eventDateISO}</Typography>
                  <Box mt={1}>
                    <StyledButton
                      
                      onClick={() => handleMatch(event)}
                      disabled={Boolean(event.matchedVolunteer) || isSubmitting}
                    >
                      
                      {event.matchedVolunteer ? `Matched (${event.matchedVolunteerName})` : (isSubmitting ? 'Matching...' : 'Match Volunteer')}
                    </StyledButton>
                  </Box>
                </Box>
              ))}
            </Box>
          </>
        )}
        </CardContent>
      </StyledCard>
    </Fade>
  </Container>
);
}

export default VolunteerMatchingForm;
