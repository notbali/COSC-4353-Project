import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import "./App.css";
import Navbar from "./components/Navbar";
import AdminDashboard from "./pages/AdminDashboard";
import EventDetails from "./pages/EventDetails";
import EventList from "./pages/EventList";
import EventMgmt from "./pages/EventMgmt";
import EventReport from "./pages/EventReport";
import Events from "./pages/Events";
import Homepage from "./pages/Homepage";
import Login from "./pages/Login";
import Notification from "./pages/Notification";
import Profile from "./pages/Profile";
import Registration from "./pages/Registration";
import VolunteerHistory from "./pages/VolunteerHistory";
import VolunteerReport from "./pages/VolunteerReport";
import VolunteerMatchingForm from "./pages/VolunteerMatchingForm";
import { useState, useEffect } from "react";
import axios from "axios";
import { createTheme, ThemeProvider, CssBaseline } from "@mui/material";

const theme = createTheme({
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: "#f8f7f6ff",
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
                  <EventMgmt />
                ) : (
                  <Login handleLoginState={handleLoginState} />
                )
              }
            />
            <Route
              path="/event-management"
              element={
                isLoggedIn ? (
                  <EventList />
                ) : (
                  <Login handleLoginState={handleLoginState} />
                )
              }
            />
            <Route path="/event-list" element={<EventList />} />
            <Route path="/events/:id" element={<Events />} />
            <Route path="/volunteer-history" element={<VolunteerHistory />} />
            <Route
              path="/notification"
              element={<Notification currentUser={userId} />}
            />
            <Route
              path="/volunteer-matching"
              element={<VolunteerMatchingForm />}
            />
            <Route path="/profile" element={<Profile />} />

            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route
              path="/admin/reports/volunteer"
              element={<VolunteerReport />}
            />
            <Route path="/admin/reports/events" element={<EventReport />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
