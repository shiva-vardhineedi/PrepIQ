import React from "react";
import { Card, CardContent, Typography, Slide } from "@mui/material";

const StatCard = ({ title, value, delay }) => {
  return (
    <Slide direction="up" in={true} timeout={delay}>
      <Card sx={{ minWidth: 275, margin: "10px" }}>
        <CardContent>
          <Typography variant="h5">{title}</Typography>
          <Typography variant="h4" color="primary">
            {value}
          </Typography>
        </CardContent>
      </Card>
    </Slide>
  );
};

const Stats = () => (
  <div style={{ display: "flex", justifyContent: "center", gap: "20px" }}>
    <StatCard title="Total Quizzes" value="5" delay={500} />
    <StatCard title="Participants" value="50" delay={700} />
    <StatCard title="Average Score" value="80%" delay={900} />
  </div>
);

export default Stats;
