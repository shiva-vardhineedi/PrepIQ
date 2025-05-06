import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Button,
  InputBase,
  Box,
  Slide,
  useScrollTrigger,
  Menu,
  MenuItem,
  Avatar,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import SchoolIcon from "@mui/icons-material/School"; // Education-related icon
import SearchIcon from "@mui/icons-material/Search";
import { Link, useNavigate } from "react-router-dom";
import { styled, alpha } from "@mui/material/styles";

const Search = styled("div")(({ theme }) => ({
  position: "relative",
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  "&:hover": {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginLeft: theme.spacing(2),
  width: "auto",
}));

const SearchIconWrapper = styled("div")(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: "100%",
  position: "absolute",
  pointerEvents: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: "inherit",
  "& .MuiInputBase-input": {
    padding: theme.spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create("width"),
    width: "12ch",
    "&:focus": {
      width: "20ch",
    },
  },
}));

const Navbar = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const trigger = useScrollTrigger();
  const [anchorEl, setAnchorEl] = useState(null); // For profile menu
  const open = Boolean(anchorEl);
  const navigate = useNavigate();

  const toggleDrawer = (open) => () => {
    setDrawerOpen(open);
  };

  const handleProfileMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    // Perform logout actions here (e.g., clear tokens, redirect)
    handleProfileMenuClose();
    navigate("/login");
  };

  return (
    <Slide appear={false} direction="down" in={!trigger}>
      <AppBar
        position="sticky"
        sx={{
          background: "linear-gradient(45deg, #3a7bd5, #3a6073)",
          boxShadow: trigger ? "0px 4px 20px rgba(0,0,0,0.2)" : "none",
        }}
      >
        <Toolbar>
          {/* Logo and Brand Name */}
          <SchoolIcon fontSize="large" sx={{ mr: 1, color: "white" }} />
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              fontWeight: "bold",
              fontFamily: "'Roboto', sans-serif",
              color: "white",
              textShadow: "1px 1px 2px rgba(0,0,0,0.3)",
            }}
          >
            PrepIQ
          </Typography>

          {/* Search Bar */}
          <Search>
            <SearchIconWrapper>
              <SearchIcon />
            </SearchIconWrapper>
            <StyledInputBase placeholder="Search…" inputProps={{ "aria-label": "search" }} />
          </Search>

          {/* Desktop Navigation */}
          <Box sx={{ display: { xs: "none", sm: "flex" }, alignItems: "center", ml: 2 }}>
            <Button component={Link} to="/" sx={{ color: "white", fontWeight: "bold" }}>
              Dashboard
            </Button>
            <Button component={Link} to="/browse-topics" sx={{ color: "white", fontWeight: "bold" }}>
              Browse Topics
            </Button>

            {/* Profile Icon and Menu */}
            <IconButton
              onClick={handleProfileMenuClick}
              sx={{ ml: 2 }}
              size="large"
              edge="end"
              color="inherit"
            >
              <Avatar alt="User Profile" src="/path/to/profile.jpg" />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleProfileMenuClose}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
            >
              <MenuItem component={Link} to="/profile" onClick={handleProfileMenuClose}>
                Profile
              </MenuItem>
              <MenuItem component={Link} to="/settings" onClick={handleProfileMenuClose}>
                Settings
              </MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </Box>

          {/* Hamburger Menu for Mobile */}
          <IconButton
            edge="end"
            color="inherit"
            aria-label="menu"
            onClick={toggleDrawer(true)}
            sx={{ display: { xs: "block", sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          {/* Drawer for Mobile Navigation */}
          <Drawer anchor="right" open={drawerOpen} onClose={toggleDrawer(false)}>
            <List>
              <ListItem button component={Link} to="/" onClick={toggleDrawer(false)}>
                <ListItemText primary="Dashboard" />
              </ListItem>
              <ListItem button component={Link} to="/browse-topics" onClick={toggleDrawer(false)}>
                <ListItemText primary="Browse Topics" />
              </ListItem>
              {/* Profile Options */}
              <ListItem button component={Link} to="/profile" onClick={toggleDrawer(false)}>
                <ListItemText primary="Profile" />
              </ListItem>
              <ListItem button component={Link} to="/settings" onClick={toggleDrawer(false)}>
                <ListItemText primary="Settings" />
              </ListItem>
              <ListItem button onClick={handleLogout}>
                <ListItemText primary="Logout" />
              </ListItem>
            </List>
          </Drawer>
        </Toolbar>
      </AppBar>
    </Slide>
  );
};

export default Navbar;
