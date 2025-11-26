import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  TextField,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Button,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Alert,
  IconButton,
} from "@mui/material";
import { styled } from "@mui/system";
import axios from "axios";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

// Custom Styled Components
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

const DeleteButton = styled(IconButton)({
  backgroundColor: "#FF1744",
  color: "#ffffff",
  margin: "5px",
  "&:hover": {
    backgroundColor: "#D50000",
  },
});

const BackButton = styled(IconButton)({
  backgroundColor: "#9E9E9E",
  color: "#ffffff",
  margin: "5px",
  "&:hover": {
    backgroundColor: "#757575",
  },
});

const EventDetail = () => {
  const { id } = useParams(); // Capture the 'id' from the URL
  const navigate = useNavigate(); // To navigate after update
  const [eventData, setEventData] = useState(null); // State for event data
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true); // Loading state
  const [openDialog, setOpenDialog] = useState(false); // Dialog for delete confirmation
  const [openSnackbar, setOpenSnackbar] = useState(false); // Snackbar for success or error messages
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success"); // success or error

  const skillOptions = ["First Aid", "Event Planning", "Cooking", "Child Care"];
  const urgencyOptions = ["Low", "Medium", "High"];

  useEffect(() => {
    // Fetch the event data
    const fetchEvent = async () => {
      try {
        const response = await axios.get(`http://localhost:5001/api/events/${id}`);
        setEventData(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch event:", error);
        setSnackbarMessage("Failed to fetch event");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  const validateForm = () => {
    const newErrors = {};
    if (!eventData.eventName) newErrors.eventName = "Event name is required.";
    if (!eventData.eventDescription)
      newErrors.eventDescription = "Event description is required.";
    if (!eventData.location) newErrors.location = "Location is required.";
    if (eventData.requiredSkills.length === 0)
      newErrors.requiredSkills = "At least one skill is required.";
    if (!eventData.urgency) newErrors.urgency = "Urgency is required.";
    if (!eventData.eventDate) newErrors.eventDate = "Event date is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      setIsSubmitting(true);
      try {
        const token = localStorage.getItem("token");
        const response = await axios.put(
          `http://localhost:5001/api/events/update/${id}`,
          eventData
        );
        console.log("Update response:", response.data);

        // Calling notification API endpoint
        try {
          const userId = localStorage.getItem("userId");
          const notificationPayload = {
            eventId: id, // Use the ID directly, since you have it already
            notifType: "event update",
            userId: userId || null
          };
          const notifresponse = await axios.post(
            "http://localhost:5001/api/notifs/create",
            notificationPayload,
            { headers: token ? { Authorization: `Bearer ${token}` } : {} }
          );
          console.log("Notification response:", notifresponse.data);
        } catch (notifError) {
          console.error("Error creating notification:", notifError.message);
        }

        setIsSubmitting(false);
        setSnackbarMessage("Event updated successfully!");
        setSnackbarSeverity("success");
        setOpenSnackbar(true);
      } catch (error) {
        console.error("Failed to update event:", error);
        setSnackbarMessage("Failed to update event");
        setSnackbarSeverity("error");
        setIsSubmitting(false);
        setOpenSnackbar(true);
      }
    } else {
      setSnackbarMessage("Please fix the errors in the form");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "requiredSkills") {
      const values = typeof value === "string" ? value.split(",") : value; // Handle multi-select
      setEventData({
        ...eventData,
        [name]: values,
      });
    } else {
      setEventData({
        ...eventData,
        [name]: value,
      });
    }
  };

  const handleDelete = async () => {
    try {
      // store event details before deleting
      const eventDetail = {
        //eventId: id,
        eventName: eventData.eventName,
        eventDescription: eventData.eventDescription,
        eventLocation: eventData.location,
        notifType: "deleted event",
      };

      // Call notification API before the event is deleted
      try {
        const notifResponse = await axios.post(
          "http://localhost:5001/api/notifs/delete",
          eventDetail
        );
        console.log("Notification response:", notifResponse.data);
      } catch (notifError) {
        console.error("Error creating notification:", notifError.message);
      }

      await axios.delete(`http://localhost:5001/api/events/delete/${id}`);
      navigate("/event-management"); // Navigate back to the event list after deletion
    } catch (error) {
      console.error("Failed to delete event:", error);
      setSnackbarMessage("Failed to delete event");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSnackbarClose = () => {
    setOpenSnackbar(false);
  };

  if (loading) {
    return (
      <Container sx={{ mt: 5, mb: 5 }}>
        <Grid container justifyContent="center">
          <CircularProgress />
        </Grid>
      </Container>
    );
  }

  if (!eventData) {
    return (
      <Container sx={{ mt: 5, mb: 5 }}>
        <StyledCard sx={{ backgroundColor: "#f5f5f5", color: "#184b69ff" }}>
          {" "}
          {/* Update colors to match your theme */}
          <Typography variant="h6" align="center">
            No events available.
          </Typography>
        </StyledCard>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 5, mb: 5 }}>
      <StyledCard>
        <CardContent>
          <BackButton onClick={() => navigate("/event-list")}>
            <ArrowBackIcon />
          </BackButton>
          <DeleteButton onClick={handleOpenDialog}>
            <DeleteIcon />
          </DeleteButton>
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            align="center"
            sx={{ mb: 4, color: "#184b69ff", fontWeight: "bold" }}
          >
            Update Event
          </Typography>
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Event Name"
                  name="eventName"
                  value={eventData.eventName}
                  onChange={handleChange}
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
                  name="eventDate"
                  value={eventData.eventDate?.substring(0, 10)}
                  onChange={handleChange}
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
                  name="eventDescription"
                  value={eventData.eventDescription}
                  onChange={handleChange}
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
                  name="location"
                  value={eventData.location}
                  onChange={handleChange}
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
                    name="requiredSkills"
                    value={eventData.requiredSkills}
                    onChange={handleChange}
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
                    name="urgency"
                    value={eventData.urgency}
                    onChange={handleChange}
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
                    "Update Event"
                  )}
                </StyledButton>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </StyledCard>

      {/* Delete confirmation dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Delete Event</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this event? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for feedback */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default EventDetail;
