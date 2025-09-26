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

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    if (!username) newErrors.username = "Username is required.";
    if (!password) newErrors.password = "Password is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    // Simulate authentication delay
    setTimeout(() => {
      setIsSubmitting(false);
      setLoginSuccess(true);
      setTimeout(() => setLoginSuccess(false), 3000);
    }, 1500);
  };

  const handleSignup = () => {
    navigate("/registration");
  };

  const handleGoogleSignIn = () => {
    alert("Google Sign-In coming soon!");
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
              Welcome Back!
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
                <Grid item xs={12} sm={6}>
                  <StyledButton
                    type="submit"
                    fullWidth
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <CircularProgress size={24} />
                    ) : (
                      "Login"
                    )}
                  </StyledButton>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    onClick={handleSignup}
                    fullWidth
                    variant="outlined"
                    sx={{ fontWeight: "bold", height: "100%" }}
                  >
                    Sign Up
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    onClick={handleGoogleSignIn}
                    fullWidth
                    variant="contained"
                    sx={{
                      backgroundColor: "#4285F4",
                      color: "#fff",
                      fontWeight: "bold",
                      "&:hover": { backgroundColor: "#357ae8" },
                    }}
                  >
                    Sign in with Google
                  </Button>
                </Grid>
              </Grid>
            </Box>
            <Collapse in={loginSuccess}>
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
                  Login successful!
                </Typography>
              </Paper>
            </Collapse>
          </CardContent>
        </StyledCard>
      </Fade>
    </Container>
  );
}

export default Login;