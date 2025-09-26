import React, { useState} from "react";
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
  // Dummy data since there's no backend or database for assignment 2
  const dummyVolunteers = [
    {
      id: 1,
      name: 'John Doe',
      address1: '1530 Pembledon Drive',
      address2: 'n/a',
      city: 'Metropolis',
      state: 'DC',
      zipCode: '77777',
      skills: ['Child Care','Food Preparation & Serving'],
      availability: '12/25'
    },
    {
      id: 2,
      name: 'Jane Doe',
      address1: '1530 Pembledon Drive',
      address2: 'n/a',
      city: 'Metropolis',
      state: 'DC',
      zipCode: '77777',
      skills: ['Transportation'],
      availability: '12/24'
    }
  ]
  const dummyEvents = [
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
    }
  ]

  const [selectedVolunteer, setSelectedVolunteer] = useState("");

  const selectedVolunteerObj = dummyVolunteers.find(v => v.id === selectedVolunteer);
  const matchingEvents = selectedVolunteerObj
  ? dummyEvents.filter(event =>
      selectedVolunteerObj.skills.includes(event.reqSkills)
    )
  : [];

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
            options={dummyVolunteers}
            getOptionLabel={option => option.name}
            value={dummyVolunteers.find(v => v.id === selectedVolunteer) || null}
            onChange={(event, newValue) => {
              if (newValue) setSelectedVolunteer(newValue.id);
            }}
            renderInput={params => (
              <TextField {...params}  variant="outlined" label="Volunteer *"/>
              
            )}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            fullWidth
          />
        </Box>
        {selectedVolunteer && (
        <Box mt={2} mb={5}p={2} bgcolor="#fff" borderRadius={2} boxShadow={1}>
          <Typography variant="h6"><b>Name: {dummyVolunteers[selectedVolunteer-1].name }</b></Typography>
          <Typography variant="body2"><b>Address 1:</b> {dummyVolunteers[selectedVolunteer-1].address1}</Typography>
          <Typography variant="body2"><b>Address 2:</b> {dummyVolunteers[selectedVolunteer-1].address2}</Typography>
          <Typography variant="body2"><b>City:</b> {dummyVolunteers[selectedVolunteer-1].city}</Typography>
          <Typography variant="body2"><b>State:</b> {dummyVolunteers[selectedVolunteer-1].state}</Typography>
          <Typography variant="body2"><b>Zip Code:</b> {dummyVolunteers[selectedVolunteer-1].zipCode}</Typography>
          <Typography variant="body2"><b>Skills:</b> {dummyVolunteers[selectedVolunteer-1].skills.join(', ')}</Typography>
          <Typography variant="body2"><b>Availability:</b> {dummyVolunteers[selectedVolunteer-1].availability}</Typography>
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
              Here are some events that match {dummyVolunteers[selectedVolunteer-1].name}'s skills:
            </Typography>
            {/* NEED TO ADD FILTERING FOR AVAILABILITY LATER*/}
            <Box mt={2}>
              {matchingEvents.map((event, idx) => (
                <Box
                  key={idx}
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
                  <Typography variant="body2"><b>Description:</b> {event.eventDesc}</Typography>
                  <Typography variant="body2"><b>Location:</b> {event.location}</Typography>
                  <Typography variant="body2"><b>Required Skills:</b> {event.reqSkills}</Typography>
                  <Typography variant="body2"><b>Urgency:</b> {event.urgency}</Typography>
                  <Typography variant="body2"><b>Date:</b> {event.eventDate}</Typography>
                  <Box mt={1}>
                    <StyledButton>Match Volunteer</StyledButton>
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
