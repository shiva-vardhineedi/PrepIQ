import React from "react";
import { Bar } from "react-chartjs-2";
import { Typography, Box } from "@mui/material";

const quizScoreData = {
  labels: ["Math", "Science", "History"],
  datasets: [
    {
      label: "Quiz Scores",
      data: [85, 90, 75],
      backgroundColor: ["#0077b6", "#00b4d8", "#90e0ef"],
      borderColor: ["#0077b6", "#00b4d8", "#90e0ef"],
      borderWidth: 1,
    },
  ],
};

const options = {
  responsive: true,
  plugins: {
    legend: {
      position: "top",
    },
  },
};

const QuizScoreBarChart = () => {
  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Quiz Scores
      </Typography>
      <Bar data={quizScoreData} options={options} />
    </Box>
  );
};

export default QuizScoreBarChart;
