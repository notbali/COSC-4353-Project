import React, { useState } from "react";
import {
  Container,
  Button,
  Typography,
  TextField,
  Box,
  Card,
  CardContent,
  Grid,
  Paper,
  Collapse,
  Fade,
  CircularProgress,
  MenuItem
} from "@mui/material";
import { styled } from "@mui/system";
import { useNavigate } from "react-router-dom";

// List of states
const states = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

const StyledCard = styled(Card)({
  background: "#f5f5f5",
  boxShadow: "0px 4px 20px rgba(0,0,0,0.1)",
  borderRadius: "15px",
  padding: "20px",
  maxWidth: "500px",
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

function Registration() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [address1, setAddress1] = useState("");
  const [city, setCity] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [zip, setZipcode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    if (!username) newErrors.username = "Username is required.";
    if (!email) newErrors.email = "Email is required.";
    if (!password) newErrors.password = "Password is required.";
    if (!fullName) newErrors.fullName = "Full name is required.";
    if (!address1) newErrors.address1 = "Address is required.";
    if (!city) newErrors.city = "City is required.";
    if (!stateCode) newErrors.stateCode = "State is required.";
    if (!zip) newErrors.zip = "Zipcode is required.";
    if (password !== confirmPassword)
      newErrors.confirmPassword = "Passwords do not match.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // client-side validation
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:5001/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, fullName, address1, city, state: stateCode, zip }),
      });
      const data = await response.json();
      if (response.ok) {
        setRegistrationSuccess(true);
        alert("Registration successful! Please log in.");
        navigate("/login");
      } else {
        alert(data.message || "Registration failed.");
      }
    } catch (error) {
      alert("Network error.");
    } finally {
      setIsSubmitting(false);
    }
};

  return (
    <Container sx={{ mt: 8, mb: 8 }}>
      <Fade in={true} timeout={600}>
        <StyledCard>
          <CardContent>
            <Typography
              variant="h4"
              align="center"
              gutterBottom
              sx={{ mb: 4, color: "#184b69ff", fontWeight: "bold" }}
            >
              Create Account
            </Typography>
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    label="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    fullWidth
                    error={!!errors.username}
                    helperText={errors.username}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    fullWidth
                    error={!!errors.email}
                    helperText={errors.email}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    fullWidth
                    error={!!errors.password}
                    helperText={errors.password}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Confirm Password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    fullWidth
                    error={!!errors.confirmPassword}
                    helperText={errors.confirmPassword}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    fullWidth
                    error={!!errors.fullName}
                    helperText={errors.fullName}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Address"
                    value={address1}
                    onChange={(e) => setAddress1(e.target.value)}
                    fullWidth
                    error={!!errors.address1}
                    helperText={errors.address1}
                    required
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    fullWidth
                    error={!!errors.city}
                    helperText={errors.city}
                    required
                  />
                </Grid>
                <Grid item xs={3}>
                  <TextField
                    select
                    label="State"
                    value={stateCode}
                    onChange={(e) => setStateCode(e.target.value)}
                    fullWidth
                    error={!!errors.stateCode}
                    helperText={errors.stateCode}
                    required
                  >
                    {states.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={3}>
                  <TextField
                    label="Zipcode"
                    value={zip}
                    onChange={(e) => setZipcode(e.target.value)}
                    fullWidth
                    error={!!errors.zip}
                    helperText={errors.zip}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <StyledButton
                    type="submit"
                    fullWidth
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <CircularProgress size={24} />
                    ) : (
                      "Register"
                    )}
                  </StyledButton>
                </Grid>
                <Grid item xs={12} textAlign="center">
                  <Button
                    onClick={() => navigate("/login")}
                    variant="text"
                    sx={{
                      color: "#2193b0",
                      textDecoration: "underline",
                      fontWeight: "bold",
                    }}
                  >
                    Already have an account? Login
                  </Button>
                </Grid>
              </Grid>
            </Box>
            <Collapse in={registrationSuccess}>
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
                  Registration successful! Redirecting to login...
                </Typography>
              </Paper>
            </Collapse>
          </CardContent>
        </StyledCard>
      </Fade>
    </Container>
  );
}

export default Registration;