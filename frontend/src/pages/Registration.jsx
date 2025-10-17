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
} from "@mui/material";
import { styled } from "@mui/system";
import { useNavigate } from "react-router-dom";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    if (!username) newErrors.username = "Username is required.";
    if (!email) newErrors.email = "Email is required.";
    if (!password) newErrors.password = "Password is required.";
    if (password !== confirmPassword)
      newErrors.confirmPassword = "Passwords do not match.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  if (password !== confirmPassword) {
    alert("Passwords do not match!");
    return;
  }
  try {
    const response = await fetch('http://localhost:5001/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await response.json();
    if (response.ok) {
      alert("Registration successful! Please log in.");
      navigate("/login");
    } else {
      alert(data.message || "Registration failed.");
    }
  } catch (error) {
    alert("Network error.");
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