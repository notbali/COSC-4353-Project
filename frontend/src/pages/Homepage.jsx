import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Typography, Button, Box, Card, Grid } from "@mui/material";
import { styled, keyframes } from "@mui/system";

const HeroSection = styled(Box)({
  backgroundColor: "#f3f9ffff",
  color: "#1f5777ff",
  width: "100vw",
  height: "250px",
  padding: "50px 20px",
  textAlign: "center",
  position: "relative",
  overflow: "hidden",
  left: "50%",
  right: "50%",
  marginBottom: "20px",
  marginTop: "-50px",
  marginLeft: "-50vw",
  marginRight: "-50vw",
  boxShadow: "0px 4px 5px rgba(0,0,0,0.2)",
});

// adding banner for image
const TopBanner = styled(Box)({
  width: "100vw",
  height: "420px",
  backgroundImage: "url('/hands.png')",
  backgroundSize: "cover",
  backgroundPosition: "center",
  position: "relative",
  overflow: "hidden",
  boxShadow: "0px 6px 30px rgba(0,0,0,0.12)",
  left: "50%",
  right: "50%",
  marginLeft: "-50vw",
  marginRight: "-50vw",
});

const BannerOverlay = styled(Box)({
  position: "absolute",
  inset: 0,
  background: "linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,0.35))",
});

const StyledButton = styled(Button)(({ theme }) => ({
  backgroundColor: "#1f5777ff",
  color: "#ffffff",
  "&:hover": {
    backgroundColor: "#f5f5f5",
    color: "#184b69ff",
  },
  padding: "10px 30px",
  marginTop: "10px",
  transition: "all 0.4s ease",
}));

const FeatureCard = styled(Card)({
  backgroundColor: "#f3f9ffff",
  boxShadow: "0px 6px 20px rgba(0,0,0,0.15)",
  borderRadius: "15px",
  padding: "30px",
  textAlign: "center",
  height: "100%",
  transition: `transform 0.8s cubic-bezier(0.25, 0.8, 0.25, 1), 
               background-color 0.8s cubic-bezier(0.25, 0.8, 0.25, 1), 
               color 0.8s cubic-bezier(0.25, 0.8, 0.25, 1) !important`,
  "&:hover": {
    backgroundColor: "#184b69ff !important",
    color: "#f5f5f5 !important",
    transform: "scale(1.1) !important",
  },
  "&:hover .feature-title": {
    color: "#f5f5f5 !important",
  },
  cursor: "pointer",
});

const Homepage = ({ userRole, isLoggedIn }) => {
  const navigate = useNavigate();

  const navigateToLogin = () => {
    navigate("/login");
  };

  const handleCardClick = (path) => {
    // If not logged in and the user clicks Notifications, redirect to login
    if (!isLoggedIn && path === "/notification") {
      navigate("/login");
      return;
    }
    navigate(path);
  };

  // Define feature cards for different roles
  const featureCards = {
    admin: [
      {
        title: "Manage Events",
        path: "/event-management",
        description:
          "Create and manage events with ease. Track participants and ensure successful event execution.",
      },
      {
        title: "Volunteer Matching",
        path: "/volunteer-matching-form",
        description:
          "Match volunteers with events based compatability with their skills and availability.",
      },
      {
        title: "Admin Dashboard",
        path: "/admin-dashboard",
        description: "Access advanced tools to manage your platform.",
      },
    ],
    user: [
      {
        title: "Discover Opportunities",
        path: "/event-list",
        description:
          "Get involved today and find available volunteer opportunities! Discover events that match your interests and skills.",
      },
      {
        title: "Volunteer History",
        path: "/volunteer-history",
        description:
          "View your past event participation and history. Keep track of your contributions and impact.",
      },
      {
        title: "Notifications",
        path: "/notification",
        description:
          "Subscribe to notifications for updates on new events and announcements! Stay informed and never miss an opportunity.",
      },
    ],
  };

  // Get features based on passed userRole;
  const features = featureCards[userRole] || featureCards["user"]; // Default to 'user' if role is undefined

  return (
    <>
      <TopBanner>
        <BannerOverlay />
      </TopBanner>
      <Container maxWidth="lg" sx={{ mt: 3, mb: 5 }}>
        <HeroSection>
          <Box sx={{ display: "inline-flex", alignItems: "center" }}>
            <Typography
              variant="h4"
              gutterBottom
              sx={{ fontWeight: "bold", marginRight: "10px" }}
            >
              Make an Impact, One Event at a Time
            </Typography>
            <Typography
              variant="h2"
              sx={{
                color: "#fff",
                fontWeight: 400,
                marginBottom: "20px",
                fontSize: "3rem",
                marginLeft: "10px",
              }}
            ></Typography>
          </Box>

          <Typography variant="h6" paragraph sx={{ color: "#000000ff" }}>
            {
              "Community starts with you. Sign up, show up, and make an impact close to home. See your work make a difference."
            }
          </Typography>

          {!isLoggedIn ? (
            <StyledButton variant="contained" onClick={navigateToLogin}>
              Get Started
            </StyledButton>
          ) : null}
        </HeroSection>

        <Grid container spacing={2} sx={{ mt: -2 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <FeatureCard onClick={() => handleCardClick(feature.path)}>
                <Typography
                  variant="h5"
                  className="feature-title"
                  gutterBottom
                  sx={{
                    color: "#1f5777ff",
                    fontWeight: "bold",
                    transition: "color 0.8s",
                  }}
                >
                  {feature.title}
                </Typography>
                <Typography variant="body2">{feature.description}</Typography>
              </FeatureCard>
            </Grid>
          ))}
        </Grid>
      </Container>
    </>
  );
};

export default Homepage;
