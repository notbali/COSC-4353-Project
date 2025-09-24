import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  CircularProgress,
  Grid,
  Paper,
  Collapse,
  Card,
  CardContent,
  Button,
  Grow,
  Box,
} from "@mui/material";
import { styled } from "@mui/system";
import axios from "axios";

const StyledCard = styled(Card)({
  background: "#f5f5f5",
  boxShadow: "0px 4px 20px rgba(0,0,0,0.2)",
  borderRadius: "15px",
  padding: "20px",
  transition: "transform 0.3s ease, box-shadow 0.3s ease",
  "&:hover": {
    transform: "scale(1.05)",
    boxShadow: "0px 8px 25px rgba(0,0,0,0.3)",
  },
});

const StyledButton = styled(Button)({
  backgroundColor: "#184b69ff",
  color: "#ffffff",
  fontWeight: "bold",
  padding: "10px 20px",
  transition: "transform 0.3s ease",
  "&:hover": {
    backgroundColor: "#1f5777ff",
    transform: "scale(1.05)",
  },
});

const CreateButton = styled(Button)({
  backgroundColor: "#184b69ff",
  color: "#ffffff",
  marginTop: "50px",
  fontWeight: "bold",
  padding: "10px 20px",
  marginBottom: "20px",
  "&:hover": {
    backgroundColor: "#66BB6A",
  },
});

const EventList = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get("http://localhost:4000/events/all");
        setEvents(response.data);
        setLoading(false);
      } catch (error) {
        setError("Failed to load events");
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const handleViewDetails = (id) => {
    navigate(`/events/${id}`); // navigate to the event details page
  };

  const handleCreateEvent = () => {
    navigate("/create-event"); // navigate to the create event form
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

  if (error) {
    return (
      <Container sx={{ mt: 5, mb: 5 }}>
        <Typography variant="h6" align="center" color="error">
          {error}
        </Typography>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 5, mb: 5 }}>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        align="center"
        sx={{ mb: 4, color: "#184b69ff", fontWeight: "bold" }}
      >
        All Events
      </Typography>

      <Grid container spacing={3}>
        {events.map((event, index) => (
          <Grid item xs={12} sm={6} md={4} key={event._id}>
            <Grow in={true} timeout={(index + 1) * 300}>
              <div>
                {" "}
                <StyledCard>
                  <CardContent>
                    <Typography
                      variant="h5"
                      gutterBottom
                      sx={{ fontWeight: "bold", color: "#333" }}
                    >
                      {event.eventName}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      sx={{ mb: 1 }}
                    >
                      {
                        new Date(
                          new Date(event.eventDate).setDate(
                            new Date(event.eventDate).getDate()
                          )
                        )
                          .toISOString()
                          .split("T")[0]
                      }
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {event.eventDescription.length > 100
                        ? event.eventDescription.substring(0, 100) + "..."
                        : event.eventDescription}
                    </Typography>
                    <StyledButton
                      fullWidth
                      variant="contained"
                      onClick={() => handleViewDetails(event._id)}
                    >
                      View Details
                    </StyledButton>
                  </CardContent>
                </StyledCard>
              </div>
            </Grow>
          </Grid>
        ))}
      </Grid>

      {events.length === 0 && (
        <Collapse in={events.length === 0}>
          <Paper
            elevation={2}
            sx={{ mt: 4, p: 2, backgroundColor: "#184b69ff", color: "#ffffff" }}
          >
            <Typography variant="body1" align="center">
              No events available.
            </Typography>
          </Paper>
        </Collapse>
      )}

      <Box textAlign="center">
        <CreateButton variant="contained" onClick={handleCreateEvent}>
          Create New Event
        </CreateButton>
      </Box>
    </Container>
  );
};

export default EventList;
