// src/components/WelcomeMessage.js
import React from "react";
import { Fade, Typography } from "@mui/material";

const WelcomeMessage = () => {
  return (
    <Fade in timeout={1000}>
      <Typography variant="h3" gutterBottom sx={{ textAlign: "center", mt: 4 }}>
        Welcome to the Quiz Dashboard
      </Typography>
    </Fade>
  );
};

export default WelcomeMessage;
