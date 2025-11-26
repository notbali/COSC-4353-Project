import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Chip,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Description as DescriptionIcon,
  TableChart as TableChartIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';

function Reports() {
  const [tabValue, setTabValue] = useState(0);
  const [volunteers, setVolunteers] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');

    try {
      const [volunteersRes, eventsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/reports/volunteers`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_BASE_URL}/reports/events`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setVolunteers(volunteersRes.data);
      setEvents(eventsRes.data);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to load report data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = async (type) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`${API_BASE_URL}/reports/${type}/csv`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}-report.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error downloading CSV:', err);
      alert('Failed to download CSV report');
    }
  };

  const handleDownloadPDF = async (type) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`${API_BASE_URL}/reports/${type}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}-report.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert('Failed to download PDF report');
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading report data...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Reporting Module
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Generate comprehensive reports on volunteer activities and event management
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
            <Tab label="Volunteers Report" />
            <Tab label="Events Report" />
          </Tabs>

          {tabValue === 0 && (
            <Box>
              <Box sx={{ mb: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  startIcon={<TableChartIcon />}
                  onClick={() => handleDownloadCSV('volunteers')}
                >
                  Download CSV
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DescriptionIcon />}
                  onClick={() => handleDownloadPDF('volunteers')}
                >
                  Download PDF
                </Button>
              </Box>

              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Name</strong></TableCell>
                      <TableCell><strong>Email</strong></TableCell>
                      <TableCell><strong>Location</strong></TableCell>
                      <TableCell><strong>Skills</strong></TableCell>
                      <TableCell align="right"><strong>Total Events</strong></TableCell>
                      <TableCell align="right"><strong>Total Hours</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {volunteers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          No volunteers found
                        </TableCell>
                      </TableRow>
                    ) : (
                      volunteers.map((volunteer) => (
                        <TableRow key={volunteer.id}>
                          <TableCell>{volunteer.fullName}</TableCell>
                          <TableCell>{volunteer.email}</TableCell>
                          <TableCell>
                            {volunteer.city}, {volunteer.state} {volunteer.zipcode}
                          </TableCell>
                          <TableCell>
                            {volunteer.skills.length > 0 ? (
                              volunteer.skills.slice(0, 3).map((skill, idx) => (
                                <Chip key={idx} label={skill} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                              ))
                            ) : (
                              'None'
                            )}
                          </TableCell>
                          <TableCell align="right">{volunteer.totalEvents}</TableCell>
                          <TableCell align="right">{volunteer.totalHours}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {volunteers.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Participation History Details
                  </Typography>
                  {volunteers.map((volunteer) => (
                    <Card key={volunteer.id} sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          <strong>{volunteer.fullName}</strong>
                        </Typography>
                        {volunteer.participationHistory.length > 0 ? (
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Event Name</TableCell>
                                <TableCell>Date</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="right">Hours</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {volunteer.participationHistory.map((history, idx) => (
                                <TableRow key={idx}>
                                  <TableCell>{history.eventName}</TableCell>
                                  <TableCell>
                                    {new Date(history.eventDate).toLocaleDateString()}
                                  </TableCell>
                                  <TableCell>
                                    <Chip
                                      label={history.status}
                                      size="small"
                                      color={
                                        history.status === 'Attended'
                                          ? 'success'
                                          : history.status === 'No-Show'
                                          ? 'error'
                                          : 'default'
                                      }
                                    />
                                  </TableCell>
                                  <TableCell align="right">{history.hoursVolunteered}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No participation history
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </Box>
          )}

          {tabValue === 1 && (
            <Box>
              <Box sx={{ mb: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  startIcon={<TableChartIcon />}
                  onClick={() => handleDownloadCSV('events')}
                >
                  Download CSV
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DescriptionIcon />}
                  onClick={() => handleDownloadPDF('events')}
                >
                  Download PDF
                </Button>
              </Box>

              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Event Name</strong></TableCell>
                      <TableCell><strong>Date</strong></TableCell>
                      <TableCell><strong>Location</strong></TableCell>
                      <TableCell><strong>Urgency</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                      <TableCell align="right"><strong>Volunteers</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {events.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          No events found
                        </TableCell>
                      </TableRow>
                    ) : (
                      events.map((event) => (
                        <TableRow key={event.eventId}>
                          <TableCell>{event.eventName}</TableCell>
                          <TableCell>
                            {event.eventDateISO || new Date(event.eventDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{event.location}</TableCell>
                          <TableCell>
                            <Chip
                              label={event.urgency}
                              size="small"
                              color={
                                event.urgency === 'Urgent'
                                  ? 'error'
                                  : event.urgency === 'High'
                                  ? 'warning'
                                  : 'default'
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={event.status}
                              size="small"
                              color={
                                event.status === 'Open' ? 'success' : event.status === 'Closed' ? 'default' : 'error'
                              }
                            />
                          </TableCell>
                          <TableCell align="right">
                            {event.currentVolunteers} / {event.maxVolunteers}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {events.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Volunteer Assignments Details
                  </Typography>
                  {events.map((event) => (
                    <Card key={event.eventId} sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          <strong>{event.eventName}</strong>
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {event.eventDescription}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1, mb: 1 }}>
                          <strong>Required Skills:</strong>{' '}
                          {event.requiredSkills.length > 0
                            ? event.requiredSkills.join(', ')
                            : 'None'}
                        </Typography>
                        {event.assignedVolunteers.length > 0 ? (
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Volunteer Name</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="right">Hours</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {event.assignedVolunteers.map((volunteer, idx) => (
                                <TableRow key={idx}>
                                  <TableCell>{volunteer.volunteerName}</TableCell>
                                  <TableCell>{volunteer.email}</TableCell>
                                  <TableCell>
                                    <Chip
                                      label={volunteer.status}
                                      size="small"
                                      color={
                                        volunteer.status === 'Attended'
                                          ? 'success'
                                          : volunteer.status === 'No-Show'
                                          ? 'error'
                                          : 'default'
                                      }
                                    />
                                  </TableCell>
                                  <TableCell align="right">{volunteer.hoursVolunteered}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No volunteers assigned
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}

export default Reports;

