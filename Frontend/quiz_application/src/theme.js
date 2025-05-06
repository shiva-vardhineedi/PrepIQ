// src/theme.js
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#005f73", // A professional dark teal
      contrastText: "#ffffff", // White text
    },
    secondary: {
      main: "#0a9396", // A softer teal
      contrastText: "#ffffff", // White text
    },
  },
  typography: {
    fontFamily: "'Roboto', sans-serif",
    button: {
      textTransform: "none", // Remove uppercase transformation
      fontWeight: 500, // Slightly bold
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "8px", // Subtle rounded corners
          padding: "8px 16px", // Better padding
          transition: "0.3s ease-in-out", // Smooth transitions
          "&:hover": {
            boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)", // Subtle shadow on hover
            transform: "translateY(-2px)", // Slight lift effect
          },
        },
        outlined: {
          borderColor: "#005f73", // Outline color for outlined buttons
          "&:hover": {
            borderColor: "#0a9396", // Change border color on hover
            backgroundColor: "rgba(10, 147, 150, 0.1)", // Light background tint
          },
        },
        contained: {
          boxShadow: "none", // Flat design for contained buttons
          "&:hover": {
            boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.15)", // Subtle shadow on hover
          },
        },
      },
    },
  },
});

export default theme;
