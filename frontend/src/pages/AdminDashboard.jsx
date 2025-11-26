import React from "react";
import { Box, Container, Typography, Button, Card, CardContent, Grid } from "@mui/material";
import { Link } from "react-router-dom";
import {
  Assessment as AssessmentIcon,
  EventNote as EventIcon,
  People as PeopleIcon,
  Description as ReportIcon,
} from "@mui/icons-material";

function AdminDashboard() {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage events, volunteers, and generate reports
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <EventIcon sx={{ fontSize: 48, color: "#1f5777ff", mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Event Management
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Create, update, and manage events
              </Typography>
              <Button
                component={Link}
                to="/event-management"
                variant="contained"
                fullWidth
                sx={{ backgroundColor: "#1f5777ff" }}
              >
                Manage Events
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <PeopleIcon sx={{ fontSize: 48, color: "#1f5777ff", mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Volunteer Matching
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Match volunteers with events
              </Typography>
              <Button
                component={Link}
                to="/volunteer-matching-form"
                variant="contained"
                fullWidth
                sx={{ backgroundColor: "#1f5777ff" }}
              >
                Match Volunteers
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <ReportIcon sx={{ fontSize: 48, color: "#1f5777ff", mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Reports
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Generate reports on volunteer activities and events
              </Typography>
              <Button
                component={Link}
                to="/reports"
                variant="contained"
                fullWidth
                sx={{ backgroundColor: "#1f5777ff" }}
              >
                View Reports
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}

export default AdminDashboard;
