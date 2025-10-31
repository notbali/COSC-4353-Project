import React, { useState, useEffect } from "react";
import {
  Typography,
  Box,
  Paper,
  Fade,
  Button,
} from "@mui/material";
import { styled } from "@mui/system";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Profile = ({userId,isLoggedIn}) => {
  const navigate = useNavigate();
  const [checked] = useState(true);

  console.log("Logged In:", isLoggedIn);

  // State to store user data
  const [user, setUser] = useState(null);

  // Check if the user is logged in
  useEffect(() => {
    // Fetch user data from the backend
    const fetchUserData = async () => {
      if (!isLoggedIn) {
        navigate("/login");
        return;
      }
      try {
        const response = await axios.get(`http://localhost:5001/api/profile`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` 
        }});
        setUser(response.data);
        navigate(`/profile/${userId}`);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchUserData();
  }, [userId,isLoggedIn, navigate]);

  console.log("User Data:", user);
  console.log("Token:", localStorage.getItem("token"));
  console.log("id:", userId);

  // Function to navigate to the edit page
  const handleEdit = () => {
    navigate(`/profile/${userId}/edit`);
  }

  // Styled components for edit button
  const StyledButton = styled(Button)(({ theme }) => ({
    backgroundColor: "#4285F4",
    color: "#ffffff",
    "&:hover": {
      backgroundColor: "#d6d7e2ff",
      color: "#4285F4",
    },
    padding: "10px 30px",
    marginTop: "20px",
    transition: "all 0.4s ease",
  }));

  // Loading page
  if (!user) return <div>Loading profile...</div>;

  // Render the user profile
  return (
    <Box sx={{ padding: "40px" }}>
      <Fade in={checked} timeout={600}>
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
              marginBottom: "0px",
              textAlign: "center",
              fontWeight: "bold",
              color: "#184b69ff",
            }} 
          >
            Profile
          </Typography>
          <Typography 
            textAlign={"center"}
            sx={{marginBottom: "20px"}}
          >
            <StyledButton variant="contained" onClick={handleEdit}>
                Edit
            </StyledButton>
          </Typography>
          <Fade in={checked} timeout={600}>
            <Paper
              elevation={2}
              sx={{
                padding: "10px",
                marginBottom: "15px",
                backgroundColor: "#f5f5f5",
              }}
            >
              <div>
                <h2>
                  <b>{user.fullName}</b>
                  {/* <b>John Doe</b> */}
                </h2>
              </div>
              <div>
                  <b>Address 1: </b> 
                  {/* 123 Main Street, Anytown, USA */}
                  <b>{user.address1}</b>
              </div>
              <div>
                  <b>Address 2: </b> 
                  {/* 456 Elm Street, Anytown, USA */}
                  <b>{user.address2}</b>
              </div>
              <div>
                  <b>City: </b> 
                  {/* Anytown */}
                  <b>{user.city}</b>
              </div>
              <div>
                  <b>State: </b> 
                  {/* TX */}
                  <b>{user.state}</b>
              </div>
              <div>
                  <b>Zip Code: </b> 
                  {/* 12345 */}
                  <b>{user.zip}</b>
              </div>
              <div>
                  <b>Skills: </b> 
                  {/* *List of skills* */}
                  <b>{user.skills.join(', ')}</b>
              </div>
              <div>
                  <b>Preferences: </b> 
                  {/* *Paragraph* */}
                  <b>{user.preferences}</b>
              </div>
              <div>
                  <b>Availability: </b> 
                  {/* *Shows calendar of availability* */}
                  <b>{user.availability.join(', ')}</b>
              </div>
            </Paper>
          </Fade>
        </Paper>
      </Fade>
    </Box>
  );
}

export default Profile;