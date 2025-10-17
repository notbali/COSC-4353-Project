import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import "./App.css";
import Homepage from "./pages/Homepage";
import Login from "./pages/Login";
import Navbar from "./component/Navbar";
import Notification from "./pages/Notification";
import Registration from "./pages/Registration";
import VolunteerHistory from "./pages/VolunteerHistory";
import EventManagementForm from "./pages/EventManagementForm";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import EventList from "./pages/EventList";
import VolunteerMatchingForm from "./pages/VolunteerMatchingForm";
import Profile from "./pages/Profile";
import UserProfileMgmt from "./pages/UserProfileMgmt";
import AdminDashboard from "./pages/AdminDashboard";
import { useState, useEffect } from "react";
import axios from "axios";
import { createTheme, ThemeProvider, CssBaseline } from "@mui/material";

const theme = createTheme({
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: "#e2e9f0ff",
          minHeight: "100vh",
          margin: 0,
          padding: 0,
          boxSizing: "border-box",
        },
      },
    },
  },
});

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState("");
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUserName = localStorage.getItem("userName");
    const storedUserId = localStorage.getItem("userId");

    if (token) {
      setIsLoggedIn(true);
      setUserName(storedUserName);
      setUserId(storedUserId);
      fetchUserRole(storedUserId, token);
    }
  }, []);

  const fetchUserRole = async (userId, token) => {
    try {
      const response = await axios.get(
        `http://localhost:4000/profile/${userId}/role`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setUserRole(response.data.role);
    } catch (error) {
      console.error("Error fetching user role:", error.message);
    }
  };

  const handleLoginState = (name, id) => {
    setIsLoggedIn(true);
    setUserName(name);
    setUserId(id);
    localStorage.setItem("userName", name);
    localStorage.setItem("userId", id);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserName("");
    setUserRole("");
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userId");
    window.location.href = "/";
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <div>
          <Navbar
            isLoggedIn={isLoggedIn}
            userName={userName}
            userRole={userRole}
            handleLogout={handleLogout}
          />
          <Routes>
            <Route
              path="/"
              element={<Homepage userRole={userRole} isLoggedIn={isLoggedIn} />}
            />
            <Route
              path="/login"
              element={<Login handleLoginState={handleLoginState} />}
            />
            <Route
              path="/signup"
              element={<Registration handleLoginState={handleLoginState} />}
            />
            <Route
              path="/create-event"
              element={
                isLoggedIn ? (
                  <EventManagementForm />
                ) : (
                  <EventManagementForm handleLoginState={handleLoginState} /> // changed from Login to EventManagementForm for testin
                )
              }
            />
            <Route
              path="/event-management"
              element={
                isLoggedIn ? (
                  <EventList />
                ) : (
                  <EventManagementForm handleLoginState={handleLoginState} /> // changed from Login to EventManagementForm for testing
                )
              }
            />
            <Route
              path="/event-list"
              element={
                isLoggedIn ? (
                  <Events />
                ) : (
                  <Events handleLoginState={handleLoginState} />
                )
              }
            />
            <Route path="/events/:id" element={<EventDetail />} />
            <Route path="/volunteer-history" element={<VolunteerHistory />} />
            <Route
              path="/notification"
              element={<Notification currentUser={userId} />}
            />
            <Route
              path="/volunteer-matching-form"
              element={<VolunteerMatchingForm />}
            />
            {/* Change the userId and isLoggedIn value to test */}
            <Route path="/profile" element={<Profile userId={userId} isLoggedIn={isLoggedIn} />} />
            <Route path="/profile/:userId" element={<Profile userId={userId} isLoggedIn={isLoggedIn} />} />
            <Route path="/profile/:userId/edit" element={<UserProfileMgmt userId={userId} />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/registration" element={<Registration />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
