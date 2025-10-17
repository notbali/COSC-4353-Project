// import React, { useState } from "react";
// import {
//   Typography,
//   Box,
//   Paper,
//   Fade,
//   Button,
//   InputLabel,
//   Checkbox,
// } from "@mui/material";
// import { styled } from "@mui/system";
// import axios from "axios";
// import { useNavigate } from "react-router-dom";
// import {TextField, MenuItem, FormHelperText} from '@mui/material';
// import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { DatePicker } from '@mui/x-date-pickers/DatePicker';
// import OutlinedInput from '@mui/material/OutlinedInput';
// import ListItemText from '@mui/material/ListItemText';
// import Select from '@mui/material/Select';
// import FormControl from '@mui/material/FormControl';

// const UserProfileMgmt = ({userId}) => {
//   const navigate = useNavigate();
//   const [checked] = useState(true);

//   // State to store user data
//   const [user, setUser] = useState({
//     name: "",
//     address1: "",
//     address2: "",
//     city: "",
//     state: "",
//     zip: "",
//     skills: [],
//     preferences: "",
//     availability: [],
//   });

//   // List of states
//   const states = [
//     "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
//     "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
//     "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
//     "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
//     "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
//   ];

//   // List of skills
//   const skillOptions = [
//     "Accounting",
//     "Advocacy",
//     "Art Instruction",
//     "Child Care",
//     "Clerical Work",
//     "Communication",
//     "Computer Skills",
//     "Conservation",
//     "Construction",
//     "Conflict Resolution",
//     "Counseling",
//     "Crafts",
//     "Crisis Intervention",
//     "Data Entry",
//     "Database Management",
//     "Design Thinking",
//     "Digital Marketing",
//     "Disability Services",
//     "Disaster Relief",
//     "Driving / Delivery",
//     "Editing",
//     "Elder Care",
//     "Event Planning",
//     "First Aid / CPR",
//     "Food Distribution",
//     "Fundraising",
//     "Gardening",
//     "Grant Writing",
//     "Graphic Design",
//     "Health Education",
//     "Homeless Outreach",
//     "IT Support",
//     "Language Translation",
//     "Landscaping",
//     "Leadership",
//     "Legal Assistance",
//     "Literacy Support",
//     "Maintenance / Repairs",
//     "Mental Health Support",
//     "Mentoring",
//     "Music Instruction",
//     "Nursing Assistance",
//     "Organizational Skills",
//     "Performing Arts",
//     "Photography",
//     "Policy Development",
//     "Project Management",
//     "Public Relations",
//     "Public Speaking",
//     "Recycling Programs",
//     "Research",
//     "Social Media Management",
//     "Special Needs Support",
//     "STEM Education",
//     "Storytelling",
//     "Teaching",
//     "Teamwork",
//     "Time Management",
//     "Transportation Assistance",
//     "Tutoring",
//     "Videography",
//     "Web Development",
//     "Wellness Coaching",
//     "Wildlife Care",
//     "Writing"
//   ];

//   // Menu props for skill selction
//   const ITEM_HEIGHT = 48;
//   const ITEM_PADDING_TOP = 8;
//   const MenuProps = {
//     PaperProps: {
//       style: {
//         maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
//         width: 250,
//       },
//     },
//   };

//   // Function to handle changes
//   const handleChange = (e) => {
//     setUser((prev) => ({ ...prev, [e.target.name]: e.target.value }));
//   };

//   // Function to handle skill changes
//   const handleSkillsChange = (e) => {
//       const { target: { value } } = e;
//       setUser((prev) => ({
//       ...prev, skills: typeof value === "string" ? value.split(",") : value,
//     }));
//   }

//   // Function to handle availability changes
//   const handleAvailabilityChange = (e) => {
//     if (!e) return;
//     const formatted = e.format("YYYY-MM-DD");
//     setUser((prev) => { 
//       if (prev.availability.includes(formatted)) 
//         return prev;
//       return {...prev, availability: [...prev.availability, formatted] }; 
//     }); 
//   }

//   // Function to handle availability removal
//   const handleAvailabilityRemove = (e) => {
//     setUser((prev) => ({
//       ...prev, availability: prev.availability.filter((date) => date !== e)
//     })); 
//   }

//   // Function to apply changes
//   // *Note this function will cause errors because the backend is not set up yet*
//   const handleApply = async e => {
//     e.preventDefault();
//     console.log(user);
//     // try{
//     //   axios.put(`http://localhost:4000/profile/${userId}`, user);
//     //   navigate(`/profile/${userId}`);
//     // } catch (err) {
//     //   console.error("Error updating user data:", err);
//     // }
//     navigate(`/profile/${userId}`);
//   };

//   // Function to cancel changes and go back to profile
//   const handleCancel = () => {
//     navigate(`/profile/${userId}`);
//   };

//   // Styled components for edit button
//   const StyledButton = styled(Button)(({ theme }) => ({
//     backgroundColor: "#4285F4",
//     color: "#ffffff",
//     "&:hover": {
//       backgroundColor: "#d6d7e2ff",
//       color: "#4285F4",
//     },
//     padding: "10px 30px",
//     marginTop: "20px",
//     marginLeft: "5px",
//     marginRight: "5px",
//     transition: "all 0.4s ease",
//   }));

//   return (
//     <Box sx={{ padding: "40px" }}>
//       <Fade in={checked} timeout={600}>
//         <Paper
//           elevation={3}
//           sx={{
//             padding: "50px",
//             marginBottom: "15px",
//             backgroundColor: "#f5f5f5",
//             maxWidth: "800px",
//             margin: "0 auto",
//             borderRadius: "15px",
//           }}
//         >
//           <Typography
//             variant="h4"
//             textAlign="center"
//             sx={{
//               marginTop: "8px",
//               marginBottom: "0px",
//               fontWeight: "bold",
//               color: "#184b69ff",
//             }} 
//           >
//             Edit Profile
//           </Typography>
//           <Typography 
//             textAlign={"center"}
//             sx={{marginBottom: "20px"}}
//           >
//             <StyledButton variant="contained" onClick={handleApply}>
//                 Apply
//             </StyledButton>
//             <StyledButton variant="contained" onClick={handleCancel}>
//                 Cancel
//             </StyledButton>
//           </Typography>
//           <Fade in={checked} timeout={600}>
//             <Paper
//               elevation={2}
//               sx={{
//                 padding: "10px",
//                 marginBottom: "15px",
//                 backgroundColor: "#f5f5f5",
//               }}
//             >
//               <Typography component="div" textAlign="center">
//                 <div style={{marginTop: "10px", marginBottom: "10px"}}>
//                   <TextField 
//                     id="name" 
//                     helperText="Max 50 characters"
//                     label="Full Name" 
//                     variant="outlined" 
//                     size="small"
//                     onChange={handleChange}
//                     inputProps={{
//                       maxLength:50,
//                       name: "name"
//                     }}
//                   />
//                 </div>
//                 <div style={{marginBottom: "10px"}}>
//                   <TextField 
//                     id="address1" 
//                     helperText="Max 100 characters"
//                     label="Address 1" 
//                     variant="outlined" 
//                     size="small"
//                     onChange={handleChange}
//                     inputProps={{
//                       maxLength:100,
//                       name: "address1"
//                     }}
//                   />
//                 </div>
//                 <div style={{marginBottom: "10px"}}>
//                   <TextField 
//                     id="address2" 
//                     helperText="Max 100 characters"
//                     label="Address 2" 
//                     variant="outlined" 
//                     size="small"
//                     onChange={handleChange}
//                     inputProps={{
//                       maxLength:100,
//                       name: "address2"
//                     }}
//                   />
//                 </div>
//                 <div style={{marginBottom: "10px"}}>
//                   <TextField 
//                     id="city" 
//                     helperText="Max 100 characters"
//                     label="City" 
//                     variant="outlined" 
//                     size="small"
//                     onChange={handleChange}
//                     inputProps={{
//                       maxLength:100,
//                       name: "city"
//                     }}
//                   />
//                 </div>
//                 <div style={{marginBottom: "10px"}}>
//                   <TextField
//                     id="state"
//                     helperText="Please select your state"
//                     select
//                     label="State"
//                     variant="outlined"
//                     size="small"
//                     value={user.state}
//                     onChange={handleChange}
//                     name="state"
//                   >
//                     {states.map((option) => (
//                       <MenuItem key={option} value={option}>
//                         {option}
//                       </MenuItem>
//                     ))}
//                   </TextField>
//                 </div>
//                 <div style={{marginBottom: "10px"}}>
//                   <TextField 
//                     id="zip"
//                     helperText="Max 9, Min 5 characters" 
//                     label="Zip Code" 
//                     variant="outlined" 
//                     size="small"
//                     inputProps={{
//                       maxLength:9,
//                       minLength:5,
//                       onChange: handleChange,
//                       name: "zip"
//                     }}
//                   />
//                 </div>
//                 <div style={{marginBottom: "10px"}}>
//                     <FormControl sx={{ m: 1, width: 250 }}>
//                       <InputLabel id="skills-label">Skills</InputLabel>
//                       <Select
//                         labelId="skills-label"
//                         id="skills"
//                         multiple
//                         value={user.skills}
//                         onChange={handleSkillsChange}
//                         input={<OutlinedInput label="Skills" />}
//                         renderValue={(selected) => selected.join(', ')}
//                         MenuProps={MenuProps}
//                       >
//                         {skillOptions.map((name) => (
//                           <MenuItem key={name} value={name}>
//                             <Checkbox checked={user.skills.includes(name)} />
//                             <ListItemText primary={name} />
//                           </MenuItem>
//                         ))}
//                       </Select>
//                       <FormHelperText>Please select your skills</FormHelperText>
//                     </FormControl>
//                 </div>
//                 <div style={{marginBottom: "10px", marginLeft: "50px", marginRight: "50px"}}>
//                   <TextField 
//                     id="preferences" 
//                     helperText="Max 1000 characters"
//                     multiline
//                     rows={4}
//                     fullWidth
//                     label="Preferences" 
//                     variant="outlined" 
//                     size="small"
//                     onChange={handleChange}
//                     inputProps={{
//                       maxLength:1000,
//                       name: "preferences"
//                     }}
//                   />
//                 </div>
//                 <div style={{display: "flex", justifyContent: "center", marginBottom: "10px"}}>
//                   <LocalizationProvider dateAdapter={AdapterDayjs}>
//                     <DemoContainer components={['DatePicker']}>
//                       <FormControl>
//                       <DatePicker
//                           label="Add Availability" 
//                           onChange={handleAvailabilityChange}
//                           slotProps={{
//                             textField: {
//                               id: "availability",
//                               name: "availability",
//                               variant: "outlined",
//                               size: "small",
//                             }
//                           }}
//                         />
//                         <FormHelperText>Please select your availability</FormHelperText>
//                       </FormControl>
//                     </DemoContainer>
//                   </LocalizationProvider>
//                 </div>
//                 <div style={{marginBottom: "10px"}}>
//                   {user.availability.map((date) => (
//                     <div key={date} style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "5px" }}>
//                       <Typography variant="body2" sx={{ marginRight: "10px" }}>{date}</Typography>
//                       <Button variant="outlined" size="small" color="error" onClick={() => handleAvailabilityRemove(date)}>
//                         Remove
//                       </Button>
//                     </div>
//                   ))}
//                 </div>
//               </Typography>
//             </Paper>
//           </Fade>
//         </Paper>
//       </Fade>
//     </Box>
//   );
// }

// export default UserProfileMgmt;