import React, { useState, useEffect } from "react";
import {
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  Fade,
  Button,
} from "@mui/material";
import axios from "axios";

const Notification = ({ currentUser }) => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        if (!currentUser) {
          console.error(
            "No current user found, unable to fetch notifications."
          );
          return;
        }
        console.log("Current User ID:", currentUser); // check if userId is coming through correctly

        const response = await axios.get(
          `http://localhost:5001/notifs/all?userId=${currentUser}`
        );
        // Keep newest first; backend already sorts desc
        const data = Array.isArray(response.data) ? response.data : [];
        // Normalize to support either flattened or populated event fields
        const normalized = data.map((n) => ({
          ...n,
          eventName: n.eventName ?? n.event?.eventName ?? null,
          eventDate: n.eventDate ?? n.event?.eventDate ?? null,
          location: n.location ?? n.event?.location ?? null,
          eventDescription:
            n.eventDescription ?? n.event?.eventDescription ?? null,
        }));
        setNotifications(normalized);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    // fetch notifications initially
    fetchNotifications();

    // set interval to fetch notifications every 5 minutes
    const interval = setInterval(
      () => {
        fetchNotifications();
      },
      5 * 60 * 1000
    );

    // cleanup function to clear the interval on component unmount
    return () => clearInterval(interval);
  }, [currentUser]);

  // function to dismiss a notification
  const dismissNotification = (id) => {
    setNotifications((prevNotifications) =>
      prevNotifications.filter((notification) => notification._id !== id)
    );
  };

  const [checked] = useState(true);

  // function to format date and add a day
  const formatDate = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    date.setDate(date.getDate() + 1); // Add one day to the date

    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Intl.DateTimeFormat("en-US", options).format(date);
  };

  return (
    <Box sx={{ padding: "40px" }}>
      <Fade in={checked} timeout={600}>
        <Box>
          <Paper
            elevation={3}
            sx={{
              padding: "50px",
              marginBottom: "15px",
              backgroundColor: "#f5f5f5",
              maxWidth: "800px",
              margin: "0 auto",
              borderRadius: "15px",
            }}
          >
            <Typography
              variant="h4"
              sx={{
                marginTop: "8px",
                marginBottom: "22px",
                textAlign: "center",
                fontWeight: "bold",
                color: "#1f5777ff",
              }}
            >
              Notifications
            </Typography>
            <List>
              {notifications.map((notification) => (
                <Fade key={notification._id} in={checked} timeout={600}>
                  <Paper
                    elevation={2}
                    sx={{
                      padding: "10px",
                      marginBottom: "15px",
                      backgroundColor: "#f5f5f5",
                    }}
                  >
                    <ListItem>
                      <ListItemText
                        primary={notification.title}
                        secondary={
                          <>
                            <div>{notification.eventName}</div>
                            <div>
                              <strong>Date:</strong>{" "}
                              {formatDate(notification.eventDate)}
                            </div>
                            <div>
                              <strong>Location:</strong> {notification.location}
                            </div>
                            <div>
                              <strong>Description:</strong>{" "}
                              {notification.eventDescription}
                            </div>
                          </>
                        }
                        primaryTypographyProps={{ fontWeight: "bold" }}
                      />
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => dismissNotification(notification._id)}
                        sx={{ marginLeft: "auto" }}
                      >
                        Dismiss
                      </Button>
                    </ListItem>
                  </Paper>
                </Fade>
              ))}
            </List>
          </Paper>
        </Box>
      </Fade>
    </Box>
  );
};

export default Notification;
