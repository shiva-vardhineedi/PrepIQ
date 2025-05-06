import React from "react";
import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import { Typography, Box } from "@mui/material";

const activityData = [
  { date: "2024-11-01", quizzesTaken: 2 },
  { date: "2024-11-02", quizzesTaken: 3 },
  { date: "2024-11-03", quizzesTaken: 1 },
  { date: "2024-11-04", quizzesTaken: 4 },
  // Add more data here
];

const AnalyticsHeatmap = () => {
  return (
    <Box sx={{ mt: 4, textAlign: "center" }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Quiz Activity (Last 30 Days)
      </Typography>
      <CalendarHeatmap
        startDate={new Date("2024-11-01")}
        endDate={new Date("2024-11-30")}
        values={activityData}
        classForValue={(value) => {
          if (!value) return "color-empty";
          if (value.quizzesTaken >= 4) return "color-scale-4";
          if (value.quizzesTaken >= 3) return "color-scale-3";
          if (value.quizzesTaken >= 2) return "color-scale-2";
          return "color-scale-1";
        }}
        tooltipDataAttrs={(value) => {
          if (!value || !value.date) return { "data-tooltip": "No data" };
          return {
            "data-tooltip": `${value.date}: ${value.quizzesTaken} quizzes taken`,
          };
        }}
        showWeekdayLabels
      />
      <style>{`
        .react-calendar-heatmap .color-empty { fill: #ebedf0; }
        .react-calendar-heatmap .color-scale-1 { fill: #c6e48b; }
        .react-calendar-heatmap .color-scale-2 { fill: #7bc96f; }
        .react-calendar-heatmap .color-scale-3 { fill: #239a3b; }
        .react-calendar-heatmap .color-scale-4 { fill: #196127; }
      `}</style>
    </Box>
  );
};

export default AnalyticsHeatmap;
