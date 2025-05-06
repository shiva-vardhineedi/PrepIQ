import React, { useState, useEffect } from "react";
import {
  Grid,
  Container,
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Slider,
  IconButton,
  Modal,
  Backdrop,
  Fade,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Heatmap = ({ data, startDate, monthsToShow, expanded, onClose }) => {
  const heatmapData = getHeatmapData(data, startDate, monthsToShow);
  const cellSize = Math.max(6, 12 - monthsToShow);

  const months = [];
  const start = new Date(startDate);
  for (let i = 0; i < monthsToShow; i++) {
    const month = new Date(start);
    month.setMonth(start.getMonth() + i);
    months.push(month.toLocaleString("default", { month: "short" }));
  }

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 1,
          overflow: "hidden",
          height: expanded ? "400px" : "140px",
        }}
      >
        {heatmapData.map((entry, index) => {
          let bgColor = "#e0e0e0";
          if (entry.quizzesTaken >= 4) bgColor = "#0047b3";
          else if (entry.quizzesTaken >= 2) bgColor = "#66b2ff";
          else if (entry.quizzesTaken >= 1) bgColor = "#cce5ff";

          return (
            <Box
              key={index}
              title={`${entry.date}: ${entry.quizzesTaken} quizzes`}
              sx={{
                width: `${cellSize}px`,
                height: `${cellSize}px`,
                backgroundColor: bgColor,
                borderRadius: "2px",
                "&:hover": {
                  transform: "scale(1.2)",
                  boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
                },
              }}
            ></Box>
          );
        })}
      </Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
        {months.map((month, idx) => (
          <Typography key={idx} variant="caption" sx={{ fontSize: "10px", textAlign: "center" }}>
            {month}
          </Typography>
        ))}
      </Box>
      {expanded && (
        <IconButton
          sx={{ position: "absolute", top: 16, right: 16 }}
          onClick={onClose}
        >
          <CloseIcon />
        </IconButton>
      )}
    </>
  );
};

const Dashboard = () => {
  const [activity, setActivity] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monthsToShow, setMonthsToShow] = useState(4);
  const [isHeatmapExpanded, setIsHeatmapExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [quizzesPerPage, setQuizzesPerPage] = useState(5);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const baseURL = process.env.REACT_APP_API_URL || "http://localhost:8000";
        const quizzesResponse = await axios.get(`${baseURL}/api/get-all-quizzes`);
        setQuizzes(quizzesResponse.data);

        const fetchFavorites = () => {
          const storedFavorites = JSON.parse(localStorage.getItem("favoriteTopics")) || [];
          setFavorites(storedFavorites);
        };

        fetchFavorites();
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleRangeChange = (event, newValue) => {
    setMonthsToShow(newValue);
  };

  const handleHeatmapExpand = () => {
    setIsHeatmapExpanded(true);
  };

  const handleHeatmapClose = () => {
    setIsHeatmapExpanded(false);
  };

  const handleFavoriteTopicsClick = () => {
    navigate("/browse-topics", { state: { showFavorites: true } });
  };

  const handleLastTakenQuizClick = () => {
    const lastQuiz = quizzes[0];
    if (!lastQuiz) return;

    const quizData = {
      topic: lastQuiz.topic_name,
      questions: lastQuiz.quiz_data,
    };

    navigate("/quiz", { state: { showResultsDirectly: true, quiz: quizData } });
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container sx={{ mt: 4, pb: 6 }}>
      <Typography variant="h5" sx={{ textAlign: "center", mb: 3, fontWeight: "bold" }}>
        Welcome to PrepIQ Dashboard
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ height: "200px", cursor: "pointer" }} onClick={handleHeatmapExpand}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
                Activity Heatmap
              </Typography>
              <Heatmap data={activity} startDate="2024-08-01" monthsToShow={monthsToShow} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card sx={{ height: "200px", cursor: "pointer" }} onClick={handleFavoriteTopicsClick}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
                Favorite Topics
              </Typography>
              <Grid container spacing={1}>
                {favorites.map((topic) => (
                  <Grid item xs={4} key={topic.id}>
                    <Avatar
                      sx={{
                        bgcolor: "#0047b3",
                        color: "white",
                        width: 36,
                        height: 36,
                        fontSize: 18,
                        mx: "auto",
                      }}
                    >
                      {topic.name[0].toUpperCase()}
                    </Avatar>
                    <Typography
                      variant="body2"
                      sx={{ mt: 0.5, fontWeight: "bold", textAlign: "center" }}
                    >
                      {topic.name}
                    </Typography>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card sx={{ height: "200px", cursor: "pointer" }} onClick={handleLastTakenQuizClick}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
                Last Taken Quiz
              </Typography>
              {quizzes[0] ? (
                <>
                  <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                    Topic: {quizzes[0].topic_name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#6c757d" }}>
                    Score: {quizzes[0].score}%
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#6c757d", mb: 1 }}>
                    Date: {quizzes[0].created_at.split("T")[0]}
                  </Typography>
                </>
              ) : (
                <Typography variant="body2" sx={{ color: "#6c757d" }}>
                  No quizzes taken yet.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
                <Typography variant="body2" sx={{ mr: 2 }}>
                  Quizzes per page:
                </Typography>
                <select
                  value={quizzesPerPage}
                  onChange={(e) => {
                    setQuizzesPerPage(Number(e.target.value));
                    setCurrentPage(1); // Reset to the first page
                  }}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                </select>
              </Box>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Topic Name</TableCell>
                      <TableCell>Subtopic Name</TableCell>
                      <TableCell>Number of Questions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {quizzes
                      .slice((currentPage - 1) * quizzesPerPage, currentPage * quizzesPerPage)
                      .map((quiz) => (
                        <TableRow
                          key={quiz.quiz_id}
                          sx={{
                            cursor: "pointer",
                            "&:hover": { backgroundColor: "#f5f5f5" },
                          }}
                          onClick={() =>
                            navigate("/quiz-details", {
                              state: {
                                quiz_id: quiz.quiz_id,
                                topic_name: quiz.topic_name,
                                subtopics: quiz.subtopics,
                                quiz_data: quiz.quiz_data,
                              },
                            })
                          }
                        >
                          <TableCell>{quiz.quiz_id}</TableCell>
                          <TableCell>{quiz.topic_name}</TableCell>
                          <TableCell>{quiz.subtopics.join(", ")}</TableCell>
                          <TableCell>{quiz.quiz_data.length}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prevPage) => prevPage - 1)}
                >
                  Previous
                </button>
                <Typography variant="body2">
                  Page {currentPage} of {Math.ceil(quizzes.length / quizzesPerPage)}
                </Typography>
                <button
                  disabled={currentPage === Math.ceil(quizzes.length / quizzesPerPage)}
                  onClick={() => setCurrentPage((prevPage) => prevPage + 1)}
                >
                  Next
                </button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

const getHeatmapData = (data, startDate, monthsToShow) => {
  const start = new Date(startDate);
  const end = new Date(start);
  end.setMonth(end.getMonth() + monthsToShow);

  const dayMap = {};
  data.forEach((entry) => {
    const date = new Date(entry.date).toISOString().split("T")[0];
    dayMap[date] = entry.quizzesTaken;
  });

  const dates = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const isoDate = d.toISOString().split("T")[0];
    dates.push({ date: isoDate, quizzesTaken: dayMap[isoDate] || 0 });
  }

  return dates;
};

export default Dashboard;
