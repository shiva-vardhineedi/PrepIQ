import React from "react";
import { useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";

const QuizDetails = () => {
  const location = useLocation();
  const { quiz_id, topic_name, subtopics, quiz_data } = location.state;

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: "bold" }}>
        Quiz Details (ID: {quiz_id})
      </Typography>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6">Topic: {topic_name}</Typography>
          <Typography variant="body1">Subtopics: {subtopics.join(", ")}</Typography>
          <Typography variant="body1">Number of Questions: {quiz_data.length}</Typography>
        </CardContent>
      </Card>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Questions:
      </Typography>
      <List>
        {quiz_data.map((question, index) => (
          <ListItem key={index} sx={{ mb: 2 }}>
            <ListItemText
              primary={`${index + 1}. ${question.question}`}
              secondary={
                <>
                  <Typography variant="body2">
                    <strong>Correct Answer:</strong> {question.answer}
                  </Typography>
                  {question.your_answer && (
                    <Typography variant="body2" color="text.secondary">
                      <strong>Your Answer:</strong> {question.your_answer}
                    </Typography>
                  )}
                </>
              }
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default QuizDetails;
