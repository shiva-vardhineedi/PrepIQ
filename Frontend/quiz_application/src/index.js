// src/index.js
import React from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider } from './contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from "@mui/material/styles";
import App from "./App";
import theme from "./theme";

const container = document.getElementById("root");
const root = createRoot(container); // Create the root for React 18

root.render(
  <ThemeProvider theme={theme}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ThemeProvider>
);
