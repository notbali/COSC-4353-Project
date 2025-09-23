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
import {TextField, MenuItem} from '@mui/material';
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

const UserProfileMgmt = ({userId}) => {
  // State to store user data
  const [user, setUser] = useState({
    name: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zip: "",
    skills: "",
    preference: "",
    availability: null,
  });

  // List of states
  const states = [
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
    "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
  ];

  const navigate = useNavigate();
  const [checked] = useState(true);

  // // Fetch user data from the backend
  // useEffect(() => {
  //   const fetchUserData = async () => {
  //     try {
  //       const response = await axios.get(`http://localhost:4000/profile/${userId}`);
  //       setUser(response.data);
  //     } catch (error) {
  //       console.error("Error fetching user data:", error);
  //     }
  //   };
  //   fetchUserData();
  // }, [userId]);

  // Function to handle changes
  const handleChange = (e) => {
    setUser((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Function to apply changes
  // *Note this function will cause errors because the backend is not set up yet*
  const handleApply = async e => {
    e.preventDefault();
    try{
      axios.put(`http://localhost:4000/profile/${userId}`, user);
      navigate(`/profile/${userId}`);
    } catch (err) {
      console.error("Error updating user data:", err);
    }
  };

  // Function to cancel changes and go back to profile
  const handleCancel = () => {
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
    marginLeft: "5px",
    marginRight: "5px",
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
            <StyledButton variant="contained" onClick={handleCancel}>
                Cancel
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
              <Typography textAlign={"center"}>
                <div style={{marginTop: "10px", marginBottom: "10px"}}>
                  <TextField 
                    id="name" 
                    helperText="Max 50 characters"
                    label="Full Name" 
                    variant="outlined" 
                    size="small"
                    inputProps={{
                      maxLength:50,
                      onChange: handleChange,
                      name: "name"
                    }}
                  />
                </div>
                <div style={{marginBottom: "10px"}}>
                  <TextField 
                    id="address1" 
                    helperText="Max 100 characters"
                    label="Address 1" 
                    variant="outlined" 
                    size="small"
                    inputProps={{
                      maxLength:100,
                      onChange: handleChange,
                      name: "address1"
                    }}
                  />
                </div>
                <div style={{marginBottom: "10px"}}>
                  <TextField 
                    id="address2" 
                    helperText="Max 100 characters"
                    label="Address 2" 
                    variant="outlined" 
                    size="small"
                    inputProps={{
                      maxLength:100,
                      onChange: handleChange,
                      name: "address2"
                    }}
                  />
                </div>
                <div style={{marginBottom: "10px"}}>
                  <TextField 
                    id="city" 
                    helperText="Max 100 characters"
                    label="City" 
                    variant="outlined" 
                    size="small"
                    inputProps={{
                      maxLength:100,
                      onChange: handleChange,
                      name: "city"
                    }}
                  />
                </div>
                <div style={{marginBottom: "10px"}}>
                  <TextField
                    id="state"
                    helperText="Please select your state"
                    select
                    label="State"
                    variant="outlined"
                    size="small"
                    onChange={handleChange}
                    name="state"
                  >
                    {states.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                </div>
                <div style={{marginBottom: "10px"}}>
                  <TextField 
                    id="zip"
                    helperText="Max 9, Min 5 characters" 
                    label="Zip Code" 
                    variant="outlined" 
                    size="small"
                    inputProps={{
                      maxLength:9,
                      minLength:5,
                      onChange: handleChange,
                      name: "zip"
                    }}
                  />
                </div>
                <div>
                    <b>Skills:</b> *List of skills*
                </div>
                <div style={{marginBottom: "10px", marginLeft: "50px", marginRight: "50px"}}>
                  <TextField 
                    id="preferences" 
                    helperText="Max 1000 characters"
                    multiline
                    rows={4}
                    fullWidth
                    label="Preferences" 
                    variant="outlined" 
                    size="small"
                    inputProps={{
                      maxLength:1000,
                      onChange: handleChange,
                      name: "preferences"
                    }}
                  />
                </div>
                <div style={{display: "flex", justifyContent: "center", marginBottom: "10px"}}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DemoContainer components={['DatePicker']}>
                      <DatePicker
                        label="Date" 
                        onChange={handleChange}
                        slotProps={{
                          textField: {
                            id: "date",
                            name: "date",
                            helperText: "Please select a date",
                            variant: "outlined",
                            size: "small",
                          }
                        }}
                      />
                    </DemoContainer>
                  </LocalizationProvider>
                </div>
              </Typography>
            </Paper>
          </Fade>
        </Paper>
      </Fade>
    </Box>
  );
}

export default UserProfileMgmt;
