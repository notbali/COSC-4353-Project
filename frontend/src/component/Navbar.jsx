import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { Link, useNavigate, useLocation } from "react-router-dom";
import MenuIcon from "@mui/icons-material/Menu";

const logoPath = process.env.PUBLIC_URL + "logo192.png";

const Navbar = ({ isLoggedIn, userName, userRole, handleLogout }) => {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation(); // For active state detection

  // Handle mobile drawer toggle
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Handle navigation for mobile menu
  const handleNavigation = (path) => {
    navigate(path);
    handleDrawerToggle();
  };

  // Function to determine if a path is active
  const isActive = (path) => location.pathname === path;

  return (
    <>
      <AppBar position="static" sx={{ backgroundColor: "#d58e31ff" }}>
        <Toolbar>
          {/* Mobile Menu Button */}
          <Box sx={{ display: { xs: "flex", md: "none" }, marginRight: 2 }}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
            >
              <MenuIcon />
            </IconButton>
          </Box>

          {/* Logo and Title */}
          <Box
            component={Link}
            to="/"
            sx={{
              display: "flex",
              alignItems: "center",
              textDecoration: "none",
            }}
          >
            <img
              src={logoPath}
              alt="Logo"
              style={{
                width: "40px",
                height: "40px",
                marginRight: "10px",
                cursor: "pointer",
              }}
            />
            <Typography
              variant="h6"
              sx={{
                color: "#fff",
                fontFamily: '"Pacifico", cursive',
                fontWeight: 400,
                fontSize: "1.5rem",
                cursor: "pointer",
              }}
            >
              Volunteer101
            </Typography>
          </Box>

          {/* Desktop Menu Items */}
          <Box
            sx={{
              flexGrow: 1,
              marginLeft: "25px",
              display: { xs: "none", md: "flex" },
              justifyContent: "flex-start",
            }}
          >
            <Button
              component={Link}
              to="/"
              sx={{
                color: "#fff",
                marginRight: "10px",
                backgroundColor: isActive("/") ? "#fab050ff" : "inherit",
                "&:hover": { backgroundColor: "#fab050ff" },
                fontWeight: isActive("/") ? "bold" : "normal",
              }}
            >
              Home
            </Button>
            {isLoggedIn && (
              <>
                {/* Links for Admin Users */}
                {userRole === "admin" && (
                  <>
                    <Button
                      component={Link}
                      to="/event-mgmt"
                      sx={{
                        color: "#fff",
                        marginRight: "10px",
                        backgroundColor: isActive("/event-mgmt")
                          ? "#fab050ff"
                          : "inherit",
                        "&:hover": { backgroundColor: "#fab050ff" },
                        fontWeight: isActive("/event-mgmt") ? "bold" : "normal",
                      }}
                    >
                      Event Manager
                    </Button>
                    <Button
                      component={Link}
                      to="/volunteer-matching"
                      sx={{
                        color: "#fff",
                        marginRight: "10px",
                        backgroundColor: isActive("/volunteer-matching")
                          ? "#fab050ff"
                          : "inherit",
                        "&:hover": { backgroundColor: "#fab050ff" },
                        fontWeight: isActive("/volunteer-matching")
                          ? "bold"
                          : "normal",
                      }}
                    >
                      Volunteer Matching
                    </Button>
                    <Button
                      component={Link}
                      to="/admin-dashboard"
                      sx={{
                        color: "#fff",
                        marginRight: "10px",
                        backgroundColor: isActive("/admin-dashboard")
                          ? "#fab050ff"
                          : "inherit",
                        "&:hover": { backgroundColor: "#7FA1C3" },
                        fontWeight: isActive("/admin-dashboard")
                          ? "bold"
                          : "normal",
                      }}
                    >
                      Admin Dashboard
                    </Button>
                  </>
                )}
                {/* Links for Regular Users */}
                {userRole === "user" && (
                  <>
                    <Button
                      component={Link}
                      to="/event-list"
                      sx={{
                        color: "#fff",
                        marginRight: "10px",
                        backgroundColor: isActive("/event-list")
                          ? "#fab050ff"
                          : "inherit",
                        "&:hover": { backgroundColor: "#7FA1C3" },
                        fontWeight: isActive("/event-list") ? "bold" : "normal",
                      }}
                    >
                      Events
                    </Button>
                    <Button
                      component={Link}
                      to="/volunteer-history"
                      sx={{
                        color: "#fff",
                        marginRight: "10px",
                        backgroundColor: isActive("/volunteer-history")
                          ? "#fab050ff"
                          : "inherit",
                        "&:hover": { backgroundColor: "#7FA1C3" },
                        fontWeight: isActive("/volunteer-history")
                          ? "bold"
                          : "normal",
                      }}
                    >
                      Volunteer History
                    </Button>
                    <Button
                      component={Link}
                      to="/notification"
                      sx={{
                        color: "#fff",
                        marginRight: "10px",
                        backgroundColor: isActive("/notification")
                          ? "#fab050ff"
                          : "inherit",
                        "&:hover": { backgroundColor: "#7FA1C3" },
                        fontWeight: isActive("/notification")
                          ? "bold"
                          : "normal",
                      }}
                    >
                      Notifications
                    </Button>
                  </>
                )}
              </>
            )}
          </Box>

          {/* User Greeting and Login/Logout */}
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {isLoggedIn ? (
              <>
                {/* Display User Name */}
                <Button
                  component={Link}
                  to="/profile"
                  sx={{
                    color: "#fff",
                    marginRight: "10px",
                    backgroundColor: isActive("/profile")
                      ? "#fab050ff"
                      : "inherit",
                    "&:hover": { backgroundColor: "#fab050ff" },
                    fontWeight: isActive("/profile") ? "bold" : "normal",
                  }}
                >
                  Welcome, <span style={{ fontWeight: 700 }}>{userName}</span>
                </Button>
                <Button
                  onClick={handleLogout}
                  sx={{
                    color: "#fff",
                    fontWeight: "bold",
                    fontSize: "0.875rem",
                    "&:hover": { backgroundColor: "#fab050ff" },
                  }}
                >
                  Logout
                </Button>
              </>
            ) : (
              <Button
                component={Link}
                to="/login"
                sx={{
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: "0.875rem",
                  "&:hover": { backgroundColor: "#fab050ff" },
                }}
              >
                Login
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        sx={{
          "& .MuiDrawer-paper": {
            width: 250,
            backgroundColor: "#d58e31ff",
            color: "#E2DAD6",
          },
        }}
      >
        <List>
          <ListItem button onClick={() => handleNavigation("/")}>
            <ListItemText primary="Home" sx={{ color: "#E2DAD6" }} />
          </ListItem>
          {isLoggedIn && (
            <>
              {userRole === "admin" && (
                <>
                  <ListItem
                    button
                    onClick={() => handleNavigation("/event-management")}
                  >
                    <ListItemText
                      primary="Event Manager"
                      sx={{ color: "#E2DAD6" }}
                    />
                  </ListItem>
                  <ListItem
                    button
                    onClick={() => handleNavigation("/volunteer-matching")}
                  >
                    <ListItemText
                      primary="Volunteer Matching"
                      sx={{ color: "#E2DAD6" }}
                    />
                  </ListItem>
                </>
              )}
              {userRole === "user" && (
                <>
                  <ListItem
                    button
                    onClick={() => handleNavigation("/volunteer-history")}
                  >
                    <ListItemText
                      primary="Volunteer History"
                      sx={{ color: "#E2DAD6" }}
                    />
                  </ListItem>
                  <ListItem
                    button
                    onClick={() => handleNavigation("/notification")}
                  >
                    <ListItemText
                      primary="Notifications"
                      sx={{ color: "#E2DAD6" }}
                    />
                  </ListItem>
                </>
              )}
              <ListItem button onClick={() => handleNavigation("/profile")}>
                <ListItemText primary="Profile" sx={{ color: "#E2DAD6" }} />
              </ListItem>
            </>
          )}
          {!isLoggedIn && (
            <ListItem button onClick={() => handleNavigation("/login")}>
              <ListItemText primary="Login" sx={{ color: "#E2DAD6" }} />
            </ListItem>
          )}
          {isLoggedIn && (
            <ListItem button onClick={handleLogout}>
              <ListItemText primary="Logout" sx={{ color: "#ff5252" }} />
            </ListItem>
          )}
        </List>
      </Drawer>
    </>
  );
};

export default Navbar;
