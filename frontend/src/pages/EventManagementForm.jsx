import React, { useState } from "react";
import {
  Container,
  Button,
  Typography,
  TextField,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Card,
  CardContent,
  Grid,
  Paper,
  Collapse,
  Fade,
  CircularProgress,
} from "@mui/material";
import { styled } from "@mui/system";
import axios from "axios";

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

const EventManagementForm = () => {
  // Declare hooks unconditionally (rules of hooks)
  const [eventName, setEventName] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [location, setLocation] = useState("");
  const [requiredSkills, setRequiredSkills] = useState([]);
  const [urgency, setUrgency] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Check user role from localStorage and block non-admins
  const storedUserRole = localStorage.getItem("userRole") || "";
  if (storedUserRole !== "admin") {
    return (
      <Container sx={{ mt: 5, mb: 5 }}>
        <Fade in={true} timeout={600}>
          <StyledCard>
            <CardContent>
              <Typography
                variant="h5"
                component="div"
                align="center"
                sx={{ color: "#184b69ff", fontWeight: "bold" }}
              >
                User is Not Authorized to Use
              </Typography>
            </CardContent>
          </StyledCard>
        </Fade>
      </Container>
    );
  }

  const skillOptions = [
    "Food Preparation & Serving",
    "Cleaning & Sanitation",
    "First Aid & CPR",
    "Event Planning & Coordination",
    "Counseling & Emotional Support",
    "Child Care",
    "Administrative & Clerical Work",
    "Language Translation & Interpretation",
    "Transportation & Driving",
    "Handyman Skills (Basic Repairs & Maintenance)",
  ];
  const urgencyOptions = ["Low", "Medium", "High"];

  const validateForm = () => {
    const newErrors = {};
    if (!eventName) newErrors.eventName = "Event name is required.";
    if (!eventDescription)
      newErrors.eventDescription = "Event description is required.";
    if (!location) newErrors.location = "Location is required.";
    if (requiredSkills.length === 0)
      newErrors.requiredSkills = "At least one skill is required.";
    if (!urgency) newErrors.urgency = "Urgency is required.";
    if (!eventDate) newErrors.eventDate = "Event date is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // prevent the default form submission

    if (validateForm()) {
      setIsSubmitting(true); // set loading state
      const eventData = {
        eventName,
        eventDescription,
        location,
        requiredSkills,
        urgency,
        eventDate,
        eventDateISO: new Date(eventDate).toISOString().split("T")[0], // store date in ISO format (YYYY-MM-DD)
      };

      try {
        const API_BASE = "http://localhost:5001/api";
        const token = localStorage.getItem("token");

        const response = await axios.post(`${API_BASE}/events/create`, eventData, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        console.log("Event created:", response.data);

        // trigger the notification creation by making a separate API call to the notifsRoutes
        try {
          const userId = localStorage.getItem("userId");
          const notificationPayload = {
            eventId: response.data.data?._id || response.data._id, // try both shapes
            notifType: "new event",
            userId: userId || null,
          };
          const notifresponse = await axios.post(`${API_BASE}/notifs/create`, notificationPayload, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          console.log("Notification response:", notifresponse.data);
        } catch (notifError) {
          console.error("Error creating notification:", notifError);
        }

        // clear the form
        setEventName("");
        setEventDescription("");
        setLocation("");
        setRequiredSkills([]);
        setUrgency("");
        setEventDate("");
        setFormSubmitted(true);
        setTimeout(() => setFormSubmitted(false), 3000);
      } catch (error) {
        // better error details
        console.error("Failed to create event:", error);
        if (error.response) {
          console.error("Response data:", error.response.data);
          alert(`Failed to create event: ${error.response.data.message || JSON.stringify(error.response.data)}`);
        } else if (error.request) {
          console.error("No response received, request:", error.request);
          alert("Failed to create event: Network error (no response). Check backend is running.");
        } else {
          alert(`Failed to create event: ${error.message}`);
        }
      } finally {
        setIsSubmitting(false); // ensure loading state is reset
      }
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
              Event Management Form
            </Typography>
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Event Name"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    fullWidth
                    error={!!errors.eventName}
                    helperText={errors.eventName}
                    required
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Event Date"
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.eventDate}
                    helperText={errors.eventDate}
                    required
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Event Description"
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    multiline
                    rows={4}
                    fullWidth
                    error={!!errors.eventDescription}
                    helperText={errors.eventDescription}
                    required
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    fullWidth
                    error={!!errors.location}
                    helperText={errors.location}
                    required
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl
                    fullWidth
                    error={!!errors.requiredSkills}
                    variant="outlined"
                  >
                    <InputLabel>Required Skills</InputLabel>
                    <Select
                      multiple
                      value={requiredSkills}
                      onChange={(e) => setRequiredSkills(e.target.value)}
                      renderValue={(selected) => selected.join(", ")}
                      label="Required Skills"
                    >
                      {skillOptions.map((skill, index) => (
                        <MenuItem key={index} value={skill}>
                          {skill}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.requiredSkills && (
                      <FormHelperText>{errors.requiredSkills}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl
                    fullWidth
                    error={!!errors.urgency}
                    variant="outlined"
                  >
                    <InputLabel>Urgency</InputLabel>
                    <Select
                      value={urgency}
                      onChange={(e) => setUrgency(e.target.value)}
                      label="Urgency"
                    >
                      {urgencyOptions.map((level, index) => (
                        <MenuItem key={index} value={level}>
                          {level}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.urgency && (
                      <FormHelperText>{errors.urgency}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={12} textAlign="center">
                  <StyledButton type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <CircularProgress size={24} />
                    ) : (
                      "Create Event"
                    )}
                  </StyledButton>
                </Grid>
              </Grid>
            </Box>
            <Collapse in={formSubmitted}>
              <Paper
                elevation={2}
                sx={{
                  mt: 4,
                  p: 2,
                  backgroundColor: "#4CAF50",
                  color: "#ffffff",
                }}
              >
                <Typography variant="body1" align="center">
                  Event created successfully!
                </Typography>
              </Paper>
            </Collapse>
          </CardContent>
        </StyledCard>
      </Fade>
    </Container>
  );
};

export default EventManagementForm;
