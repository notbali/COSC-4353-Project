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
import Reports from "./pages/Reports";
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

  const API_BASE = "http://localhost:5001/api";

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUserName = localStorage.getItem("userName");
    const storedUserId = localStorage.getItem("userId");
    const storedUserRole = localStorage.getItem("userRole");

    if (token) {
      setIsLoggedIn(true);
      setUserName(storedUserName);
      setUserId(storedUserId);

      // If role is in localStorage, use it immediately; then refresh from server
      if (storedUserRole) setUserRole(storedUserRole);

      // Fetch user role on app initialization
      fetchUserRole(storedUserId, token);
    }
  }, []);

  const fetchUserRole = async (userId, token) => {
    if (!userId) {
      console.warn("fetchUserRole called without userId");
      return;
    }

    try {
      const url = `${API_BASE}/profile/${userId}/role`;
      console.log("Fetching user role from:", url);
      if (!token) console.warn("No token present when fetching user role");

      const response = await axios.get(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const role = response?.data?.userRole;
      if (role) {
        setUserRole(role);
        localStorage.setItem("userRole", role);
      } else {
        console.warn("Role not present in response:", response?.data);
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
    }
  };

  const handleLoginState = (name, id, token) => {
    setIsLoggedIn(true);
    setUserName(name);
    setUserId(id);
    localStorage.setItem("userName", name);
    localStorage.setItem("userId", id);
    if (token) localStorage.setItem("token", token);

    // Fetch user role immediately after login
    fetchUserRole(id, token || localStorage.getItem("token"));
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserName("");
    setUserRole("");
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
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
                  <EventManagementForm handleLoginState={handleLoginState} />
                )
              }
            />
            <Route
              path="/event-management"
              element={
                isLoggedIn ? (
                  <EventManagementForm />
                ) : (
                  <EventManagementForm handleLoginState={handleLoginState} />
                )
              }
            />
            <Route
              path="/event-list"
              element={
                isLoggedIn ? (
                  <EventList />
                ) : (
                  <EventList handleLoginState={handleLoginState} />
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
            <Route path="/profile" element={<Profile userId={userId} isLoggedIn={isLoggedIn} />} />
            <Route path="/profile/:userId" element={<Profile userId={userId} isLoggedIn={isLoggedIn} />} />
            <Route path="/profile/:userId/edit" element={<UserProfileMgmt userId={userId} />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/registration" element={<Registration />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
