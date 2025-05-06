// src/pages/CreateQuiz.js
import React, { useState } from "react";
import { Container, TextField, Button, Typography, Box } from "@mui/material";
import { useNavigate } from "react-router-dom"; // Import useNavigate

const CreateQuiz = () => {
  const [quizName, setQuizName] = useState("");
  const navigate = useNavigate(); // Initialize navigate

  const handleSubmit = () => {
    alert(`Quiz "${quizName}" Created!`);
    setQuizName("");

    // navigate('/quiz/:quizId', { state: {  } });
  };

  return (
    <Container>
      <Typography variant="h4" sx={{ mt: 4, mb: 2, textAlign: "center" }}>
        Create a New Quiz
      </Typography>
      <Box
        component="form"
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
          maxWidth: 400,
          mx: "auto",
        }}
      >
        <TextField
          label="Quiz Name"
          variant="outlined"
          value={quizName}
          onChange={(e) => setQuizName(e.target.value)}
          fullWidth
        />
        <Button variant="contained" color="primary" onClick={handleSubmit}>
          Create Quiz
        </Button>
      </Box>
    </Container>
  );
};

export default CreateQuiz;
