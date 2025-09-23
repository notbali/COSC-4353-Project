import React, { useState, useEffect } from "react";
import {
  Typography,
  Box,
  Paper,
  Fade,
  Button,
} from "@mui/material";
import { styled, keyframes } from "@mui/system";
import axios from "axios";
import { useNavigate } from "react-router-dom";
// import { Dropdown } from '@mui/base/Dropdown';
// import { MenuButton } from '@mui/base/MenuButton';
// import { Menu } from '@mui/base/Menu';
// import { MenuItem } from '@mui/base/MenuItem';


const UserProfileMgmt = ({userId}) => {
  const navigate = useNavigate();
  const [checked] = useState(true);
  const handleApply = () => {
    navigate(`/profile/${userId}`);
  };

  // Styled components for edit button
  const StyledButton = styled(Button)(({ theme }) => ({
    backgroundColor: "#3183d5ff",
    color: "#ffffff",
    "&:hover": {
      backgroundColor: "#d6d7e2ff",
      color: "#3183d5ff",
    },
    padding: "10px 30px",
    marginTop: "20px",
    transition: "all 0.4s ease",
  }));

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
              color: "#fab050ff",
            }} 
          >
            Edit Profile
          </Typography>
          <Typography 
            textAlign={"center"}
            sx={{marginBottom: "20px"}}
          >
            <StyledButton variant="contained" onClick={handleApply}>
                Apply
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
                  <b>John Doe</b>
                </h2>
              </div>
              <div>
                  <b>Address 1:</b> 123 Main Street, Anytown, USA
              </div>
              <div>
                  <b>Address 2:</b> 456 Elm Street, Anytown, USA
              </div>
              <div>
                  <b>City:</b> Anytown
              </div>
              <div>
                  <b>State:</b> TX
              </div>
              <div>
                  <b>Zip Code:</b> 12345
              </div>
              <div>
                  <b>Skills:</b> *List of skills*
              </div>
              <div>
                  <b>Preferences:</b> *Paragraph*
              </div>
              <div>
                  <b>Availability:</b> *Shows calendar of availability*
              </div>
            </Paper>
          </Fade>
        </Paper>
      </Fade>
    </Box>
  );
}

export default UserProfileMgmt;
