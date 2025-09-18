import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Button,
  Box,
  Card,
  Grid,
  Fade,
} from "@mui/material";
import { styled, keyframes } from "@mui/system";

// added a loading animation
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const HeroSection = styled(Box)({
  backgroundColor: "#fab050ff",
  color: "#ffffff",
  padding: "60px 20px",
  borderRadius: "10px",
  textAlign: "center",
  marginBottom: "20px",
  boxShadow: "0px 4px 20px rgba(0,0,0,0.2)",
  animation: `${fadeIn} 1s ease-out`,
});

const StyledButton = styled(Button)(({ theme }) => ({
  backgroundColor: "#fab050ff",
  color: "#ffffff",
  "&:hover": {
    backgroundColor: "#E2DAD6",
    color: "#d58e31ff",
  },
  padding: "10px 30px",
  marginTop: "20px",
  transition: "all 0.4s ease",
}));

const FeatureCard = styled(Card)({
  backgroundColor: "#f5f5f5",
  boxShadow: "0px 6px 20px rgba(0,0,0,0.15)",
  borderRadius: "15px",
  padding: "30px",
  textAlign: "center",
  height: "100%",
  animation: `${fadeIn} 1s ease-out`,
  transition: `transform 0.8s cubic-bezier(0.25, 0.8, 0.25, 1), 
               background-color 0.8s cubic-bezier(0.25, 0.8, 0.25, 1), 
               color 0.8s cubic-bezier(0.25, 0.8, 0.25, 1) !important`,
  "&:hover": {
    backgroundColor: "#fab050ff !important",
    color: "#F5EDED !important",
    transform: "scale(1.1) !important",
  },
  "&:hover .feature-title": {
    color: "#F5EDED !important",
  },
  cursor: "pointer",
});

const LoadingScreen = styled(Box)({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "100vh",
  backgroundColor: "#d58e31ff",
  color: "#ffffff",
  animation: `${fadeIn} 1.5s ease-out`,
});

const Homepage = ({ userRole, isLoggedIn }) => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000); // 1-second delay for the loading screen

    return () => clearTimeout(timer);
  }, []);

  const navigateToLogin = () => {
    navigate("/login");
  };

  const handleCardClick = (path) => {
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
        path: "/volunteer-matching",
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

  if (loading) {
    // Render the loading screen
    return (
      <LoadingScreen>
        <Typography
          variant="h2"
          sx={{
            fontFamily: '"Pacifico", cursive',
            fontSize: "4rem",
          }}
        >
          Volunteer101
        </Typography>
      </LoadingScreen>
    );
  }

  // Get features based on passed userRole
  const features = featureCards[userRole] || featureCards["user"]; // Default to 'user' if role is undefined

  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 5 }}>
      <HeroSection>
        <Box sx={{ display: "inline-flex", alignItems: "center" }}>
          <Typography
            variant="h2"
            gutterBottom
            sx={{ fontWeight: "bold", marginRight: "10px" }}
          >
            Welcome to Volunteer101
          </Typography>
          <Typography
            variant="h2"
            sx={{
              color: "#fff",
              fontFamily: '"Pacifico", cursive',
              fontWeight: 400,
              marginBottom: "20px",
              fontSize: "3rem",
              marginLeft: "10px",
            }}
          ></Typography>
        </Box>

        <Typography variant="h5" paragraph>
          {userRole === "admin"
            ? "Empowering administrators with advanced event management tools."
            : "Empowering communities through seamless volunteer management."}
        </Typography>
        {!isLoggedIn ? (
          <StyledButton variant="contained" onClick={navigateToLogin}>
            Get Started
          </StyledButton>
        ) : null}
      </HeroSection>

      <Grid container spacing={4} sx={{ mt: -2 }}>
        {features.map((feature, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Fade in timeout={500 + index * 500}>
              <FeatureCard onClick={() => handleCardClick(feature.path)}>
                <Typography
                  variant="h5"
                  className="feature-title"
                  gutterBottom
                  sx={{
                    color: "#d58e31ff",
                    fontWeight: "bold",
                    transition: "color 0.8s",
                  }}
                >
                  {feature.title}
                </Typography>
                <Typography variant="body2">{feature.description}</Typography>
              </FeatureCard>
            </Fade>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Homepage;
