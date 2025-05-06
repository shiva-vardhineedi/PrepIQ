import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  LinearProgress,
  Divider,
  RadioGroup,
  FormControlLabel,
  Radio,
  MobileStepper,
  useTheme,
  Grid,
  Paper,
  Modal,
  Fade,
  Backdrop,
  IconButton,
  TextField,
  CircularProgress,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";
import ChatIcon from "@mui/icons-material/Chat";
import Confetti from "react-confetti";
import { useSpring, animated } from "react-spring";
import axios from "axios";

const Flashcard = styled(Card)(({ theme }) => ({
  maxWidth: 600,
  margin: "auto",
  marginTop: theme.spacing(4),
  position: "relative",
  overflow: "visible",
  minHeight: 300,
}));

const AnimatedBox = animated(Box);

const QuizPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const quiz = location.state?.quiz || generatePlaceholderQuiz();
  const showResultsDirectly = location.state?.showResultsDirectly || false;

  const [activeStep, setActiveStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(showResultsDirectly);
  const [confetti, setConfetti] = useState(false);
  const [explanationOpen, setExplanationOpen] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [gradingResults, setGradingResults] = useState({});
  const theme = useTheme();

  const totalSteps = quiz.questions.length;

  useEffect(() => {
    if (showResults) {
      setConfetti(true);
      const timer = setTimeout(() => setConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showResults]);

  // const submitAnswers = async () => {
  //   const quizId = quiz?.quizId;
  //   if (!quizId) {
  //     console.error("Quiz ID not found. Cannot submit answers.");
  //     return;
  //   }

  //   try {
  //     const answersList = quiz.questions.map((_, index) => answers[index] || "Not Answered");

  //     const baseURL = process.env.REACT_APP_API_URL || "http://localhost:8000";
  //     // const response = await axios.post(`${baseURL}/update_answers`, answerData);
  //     const response = await axios.post(`${baseURL}/update_answers`, {
  //       quiz_id: quizId,
  //       your_answers: answersList,
  //     });

  //     if (response.status === 200) {
  //       console.log("Answers updated successfully:", response.data);
  //       alert("Your answers have been submitted successfully!");
  //     } else {
  //       console.error("Error updating answers:", response.data);
  //       alert("Failed to submit answers. Please try again.");
  //     }
  //   } catch (error) {
  //     console.error("Error submitting answers:", error);
  //     alert("An unexpected error occurred while submitting answers.");
  //   }
  // };

  const submitAnswers = async () => {
    const quizId = quiz?.quizId;
    if (!quizId) {
          console.error("Quiz ID not found. Cannot submit answers.");
          return;
        }
  
    try {
      const baseURL = process.env.REACT_APP_API_URL || "http://localhost:8000";
  
      // Prepare answers list
      const answersList = quiz.questions.map((_, index) => answers[index] || "Not Answered");
  
      // Update answers in backend
      await axios.post(`${baseURL}/update_answers`, {
        quiz_id: quizId,
        your_answers: answersList,
      });
  
      // Grade open-ended questions in parallel
      const gradingPromises = quiz.questions.map((q, i) => {
        const userAnswer = answers[i];
        if (
          (q.type === "short_answer" || q.type === "long_answer") &&
          userAnswer &&
          userAnswer !== "Not Answered"
        ) {
          return axios
            .post(`${baseURL}/grade-open-answer`, {
              question: q.question,
              expected_answer: q.answer,
              user_answer: userAnswer,
              answer_type: q.type,
            })
            .then((res) => ({ index: i, score: res.data.score, feedback: res.data.feedback }))
            .catch((err) => {
              console.error(`Grading failed for Q${i + 1}:`, err);
              return null;
            });
        }
        return null;
      });
  
      // const gradingResponses = await Promise.all(gradingPromises);
  
      // const gradingResultsTemp = {};
      // gradingResponses.forEach((res) => {
      //   if (res) gradingResultsTemp[res.index] = { score: res.score, feedback: res.feedback };
      // });
  
      // setGradingResults(gradingResultsTemp);
      alert("Your answers have been submitted!");
      setShowResults(true);
      setActiveStep(0);
    } catch (error) {
      console.error("Submission failed:", error);
      alert("Error submitting answers.");
    }
  };
  

  

  const downloadAnswers = async () => {
    setDownloading(true);
    try {
      const baseURL = process.env.REACT_APP_API_URL || "http://localhost:8000";
      // const response = await axios.post(`${baseURL}/update_answers`, answerData);
      const response = await axios.get(`${baseURL}/download-quiz-pdf`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "quiz_answers.pdf");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading quiz answers:", error);
      alert("Failed to download quiz answers. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const handleNext = () => {
    setActiveStep((prev) => Math.min(prev + 1, totalSteps - 1));
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const debounceTimeouts = useRef({});

const handleAnswerChange = (questionIndex, selectedOption) => {
  setAnswers((prev) => ({
    ...prev,
    [questionIndex]: selectedOption,
  }));

  const q = quiz.questions[questionIndex];

  // Clear existing debounce
  if (debounceTimeouts.current[questionIndex]) {
    clearTimeout(debounceTimeouts.current[questionIndex]);
  }

  // Only trigger grading for open-ended questions
  if (!Array.isArray(q.options)) {
    debounceTimeouts.current[questionIndex] = setTimeout(async () => {
      try {
        const baseURL = process.env.REACT_APP_API_URL || "http://localhost:8000";
        const res = await axios.post(`${baseURL}/grade-open-answer`, {
          question: q.question,
          expected_answer: q.answer,
          user_answer: selectedOption,
          answer_type: q.answer.split(" ").length > 20 ? "long_answer" : "short_answer",
        });

        setGradingResults((prev) => ({
          ...prev,
          [questionIndex]: {
            score: res.data.score,
            feedback: res.data.feedback,
          },
        }));
      } catch (error) {
        console.error(`Grading failed for Q${questionIndex + 1}:`, error);
      }
    }, 1000); // Wait 1 second after last keystroke
  }
};
  

  const handleSubmit = () => {
    setShowResults(true);
    setActiveStep(0);
    submitAnswers();
  };

  const handleOpenExplanation = async (questionIndex) => {
    setExplanationOpen(true);
    setLoadingExplanation(true);
  
    const questionObj = quiz.questions[questionIndex];
    const baseURL = process.env.REACT_APP_API_URL || "http://localhost:8000";
    const response = await axios.post(`${baseURL}/explain-answer`, {
      question: questionObj.question,
      answer: questionObj.answer,
      choices: questionObj.options || null
    });
  
    setExplanation(response.data.explanation);
    setLoadingExplanation(false);
  };

  const handleCloseExplanation = () => {
    setExplanationOpen(false);
    setExplanation("");
  };

  let correctAnswersCount = quiz.questions.reduce((count, q, index) => {
    const expected = q.answer;
    const given = answers[index];
  
    // Objective question: has choices
    if (Array.isArray(q.options) && q.options.length > 0) {
      if (expected.trim().toLowerCase() === (given || '').trim().toLowerCase()) {
        return count + 1;
      }
    }
  
    // Subjective question: choices is null
    if (!q.options && gradingResults[index]?.score) {
      console.log("grading open asnwers:.......",gradingResults[index]?.score);
      return count + gradingResults[index]?.score;
    }
  
    return count;
  }, 0);
  

  const resultSpring = useSpring({
    opacity: showResults ? 1 : 0,
    transform: showResults ? "scale(1)" : "scale(0.8)",
  });

  if (!quiz.questions || quiz.questions.length === 0) {
    return (
      <Box sx={{ mt: 4, p: 2 }}>
        <Typography variant="h4" gutterBottom>
          Quiz Not Found
        </Typography>
        <Typography variant="body1" color="text.secondary">
          There are no questions available for this quiz. Please select a different topic.
        </Typography>
      </Box>
    );
  }

//   return (
//     <Box sx={{ mt: 4, p: 2 }}>
//       {confetti && <Confetti />}
//       {quiz.topic && (
//         <Typography variant="h4" gutterBottom align="center">
//           Quiz: {quiz.topic}
//         </Typography>
//       )}
//       <Divider sx={{ mb: 3 }} />
//       {showResults ? (
//         <AnimatedBox style={resultSpring}>
//           <Grid container spacing={4} justifyContent="center">
//             <Grid item xs={12} md={6}>
//               <Paper elevation={6} sx={{ p: 4, textAlign: "center" }}>
//                 <Typography variant="h5" color="primary" sx={{ mb: 2 }}>
//                   Congratulations!
//                 </Typography>
//                 <Typography variant="h3" color="success.main" sx={{ mb: 2 }}>
//                   You scored {correctAnswersCount} out of {totalSteps}
//                 </Typography>
//                 <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 2 }}>
//                   <Button
//                     variant="contained"
//                     color="primary"
//                     onClick={() => navigate("/")}
//                   >
//                     Go to Dashboard
//                   </Button>
//                   <Button
//                     variant="contained"
//                     color="secondary"
//                     onClick={downloadAnswers}
//                     disabled={downloading}
//                   >
//                     {downloading ? "Downloading..." : "Download Answers"}
//                   </Button>
//                 </Box>
//               </Paper>
//             </Grid>
//             <Grid item xs={12} md={8}>
//               <Typography variant="h5" sx={{ mt: 4, mb: 2 }} align="center">
//                 Review Your Answers
//               </Typography>
//               <Box sx={{ maxWidth: 600, margin: "auto" }}>
//                 {quiz.questions.map((question, index) => (
//                   <Paper
//                     elevation={4}
//                     key={index}
//                     sx={{ p: 3, mb: 2, position: "relative" }}
//                   >
//                     <Typography variant="h6" gutterBottom>
//                       Question {index + 1} of {totalSteps}
//                     </Typography>
//                     <IconButton
//                       onClick={() => handleOpenExplanation(index)}
//                       sx={{ position: "absolute", top: 16, right: 16 }}
//                       color="primary"
//                     >
//                       <ChatIcon />
//                     </IconButton>
//                     <Typography variant="body1" gutterBottom>
//                       {question.question}
//                     </Typography>
//                     <Divider sx={{ my: 2 }} />
//                     <Typography variant="body2" color="text.secondary" gutterBottom>
//                       <strong>Your Answer:</strong> {answers[index] || "Not Answered"}
//                     </Typography>
//                     <Typography variant="body2" color="text.secondary" gutterBottom>
//                       <strong>Correct Answer:</strong> {question.answer}
//                     </Typography>
//                     <Typography
//                       variant="h6"
//                       color={
//                         answers[index] === question.answer
//                           ? "success.main"
//                           : "error.main"
//                       }
//                     >
//                       {answers[index] === question.answer ? "Correct!" : "Incorrect"}
//                     </Typography>
//                   </Paper>
//                 ))}
//               </Box>
//             </Grid>
//           </Grid>
//           <Modal
//             open={explanationOpen}
//             onClose={handleCloseExplanation}
//             closeAfterTransition
//             slots={{ backdrop: Backdrop }}
//             slotProps={{
//               backdrop: {
//                 timeout: 500,
//               },
//             }}
//           >
//             <Fade in={explanationOpen}>
//               <Box
//                 sx={{
//                   position: "absolute",
//                   top: "50%",
//                   left: "50%",
//                   transform: "translate(-50%, -50%)",
//                   width: 400,
//                   bgcolor: "background.paper",
//                   boxShadow: 24,
//                   p: 4,
//                   borderRadius: 2,
//                 }}
//               >
//                 <Typography variant="h6" sx={{ mb: 2 }}>
//                   Explanation
//                 </Typography>
//                 {loadingExplanation ? (
//                   <CircularProgress />
//                 ) : (
//                   <Typography>{explanation}</Typography>
//                 )}
//                 <Button
//                   variant="contained"
//                   onClick={handleCloseExplanation}
//                   sx={{ mt: 2 }}
//                 >
//                   Close
//                 </Button>
//               </Box>
//             </Fade>
//           </Modal>
//         </AnimatedBox>
//       ) : (
//         <>
//           <LinearProgress
//             variant="determinate"
//             value={(Object.keys(answers).length / totalSteps) * 100}
//             sx={{ mb: 2 }}
//           />
//           <Flashcard elevation={6}>
//             <CardContent>
//               <Typography variant="h6">{`Question ${activeStep + 1} of ${totalSteps}`}</Typography>
//               <Divider sx={{ my: 2 }} />
//               <Typography variant="h5" gutterBottom>
//                 {quiz.questions[activeStep].question}
//               </Typography>
//               <RadioGroup
//                 value={answers[activeStep] || ""}
//                 onChange={(e) => handleAnswerChange(activeStep, e.target.value)}
//               >
//                 {quiz.questions[activeStep].options.map((option, i) => (
//                   <FormControlLabel
//                     key={i}
//                     value={option}
//                     control={<Radio />}
//                     label={option}
//                   />
//                 ))}
//               </RadioGroup>
//             </CardContent>
//           </Flashcard>
//           <MobileStepper
//             variant="progress"
//             steps={totalSteps}
//             position="static"
//             activeStep={activeStep}
//             sx={{ maxWidth: 600, flexGrow: 1, margin: "auto", mt: 2 }}
//             nextButton={
//               activeStep === totalSteps - 1 ? (
//                 <Button
//                   size="small"
//                   onClick={handleSubmit}
//                   disabled={!answers[activeStep]}
//                 >
//                   Submit Quiz
//                 </Button>
//               ) : (
//                 <Button
//                   size="small"
//                   onClick={handleNext}
//                   disabled={!answers[activeStep]}
//                 >
//                   Next
//                   {theme.direction === "rtl" ? (
//                     <KeyboardArrowLeft />
//                   ) : (
//                     <KeyboardArrowRight />
//                   )}
//                 </Button>
//               )
//             }
//             backButton={
//               <Button
//                 size="small"
//                 onClick={handleBack}
//                 disabled={activeStep === 0}
//               >
//                 {theme.direction === "rtl" ? (
//                   <KeyboardArrowRight />
//                 ) : (
//                   <KeyboardArrowLeft />
//                 )}
//                 Back
//               </Button>
//             }
//           />
//         </>
//       )}
//     </Box>
//   );
// };

return (
  <Box sx={{ mt: 4, p: 2 }}>
    {confetti && <Confetti />}
    {quiz.topic && (
      <Typography variant="h4" gutterBottom align="center">
        Quiz: {quiz.topic}
      </Typography>
    )}
    <Divider sx={{ mb: 3 }} />
    {!showResults ? (
      <>
        <LinearProgress
          variant="determinate"
          value={(Object.keys(answers).length / totalSteps) * 100}
          sx={{ mb: 2 }}
        />
        <Flashcard elevation={6}>
          <CardContent>
            <Typography variant="h6">{`Question ${activeStep + 1} of ${totalSteps}`}</Typography>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h5" gutterBottom>
              {quiz.questions[activeStep].question}
            </Typography>
            {(() => {
              const q = quiz.questions[activeStep];
              const answer = answers[activeStep] || "";
              console.log("question is :", q)
              if (Array.isArray(q.options) && q.options.length > 0) {
                // Objective (MCQ / True-False)
                return (
                  <RadioGroup
                    value={answer}
                    onChange={(e) => handleAnswerChange(activeStep, e.target.value)}
                  >
                    {q.options.map((option, i) => (
                      <FormControlLabel
                        key={i}
                        value={option}
                        control={<Radio />}
                        label={option}
                      />
                    ))}
                  </RadioGroup>
                );
              } else {
                // Subjective (Short / Long Answer)
                return (
                  <TextField
                    label="Your Answer"
                    multiline
                    rows={4}
                    fullWidth
                    value={answer}
                    onChange={(e) => handleAnswerChange(activeStep, e.target.value)}
                  />
                );
              }
            })()}


          </CardContent>
        </Flashcard>
        <MobileStepper
          variant="progress"
          steps={totalSteps}
          position="static"
          activeStep={activeStep}
          sx={{ maxWidth: 600, flexGrow: 1, margin: "auto", mt: 2 }}
          nextButton={
            activeStep === totalSteps - 1 ? (
              <Button size="small" onClick={handleSubmit} disabled={!answers[activeStep]}>
                Submit Quiz
              </Button>
            ) : (
              <Button
                size="small"
                onClick={handleNext}
                disabled={!answers[activeStep]}
              >
                Next
                {theme.direction === "rtl" ? <KeyboardArrowLeft /> : <KeyboardArrowRight />}
              </Button>
            )
          }
          backButton={
            <Button
              size="small"
              onClick={handleBack}
              disabled={activeStep === 0}
            >
              {theme.direction === "rtl" ? <KeyboardArrowRight /> : <KeyboardArrowLeft />}
              Back
            </Button>
          }
        />
      </>
    ) : (
      <AnimatedBox style={resultSpring}>
        <Grid container spacing={4} justifyContent="center">
          <Grid item xs={12} md={6}>
            <Paper elevation={6} sx={{ p: 4, textAlign: "center" }}>
              <Typography variant="h5" color="primary" sx={{ mb: 2 }}>
                Congratulations!
              </Typography>
              <Typography variant="h3" color="success.main" sx={{ mb: 2 }}>
                You scored {correctAnswersCount} out of {totalSteps}
              </Typography>
              <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate("/")}
                >
                  Go to Dashboard
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={downloadAnswers}
                  disabled={downloading}
                >
                  {downloading ? "Downloading..." : "Download Answers"}
                </Button>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={8}>
            <Typography variant="h5" sx={{ mt: 4, mb: 2 }} align="center">
              Review Your Answers
            </Typography>
            <Box sx={{ maxWidth: 600, margin: "auto" }}>
              {quiz.questions.map((question, index) => {
                const userAnswer = answers[index] || "Not Answered";
                const isObjective = question.type === "multiple_choice" || question.type === "true_false";
                const isCorrect = userAnswer === question.answer;
                const grade = gradingResults[index]?.score;
                const feedback = gradingResults[index]?.feedback;

                return (
                  <Paper
                    elevation={4}
                    key={index}
                    sx={{ p: 3, mb: 2, position: "relative" }}
                  >
                    <Typography variant="h6" gutterBottom>
                      Question {index + 1} of {totalSteps}
                    </Typography>
                    <IconButton
                      onClick={() => handleOpenExplanation(index)}
                      sx={{ position: "absolute", top: 16, right: 16 }}
                      color="primary"
                    >
                      <ChatIcon />
                    </IconButton>
                    <Typography variant="body1" gutterBottom>
                      {question.question}
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Your Answer:</strong> {userAnswer}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Correct Answer:</strong>{" "}
                      {question.answer || (question.type.includes("answer") ? "Subjective" : "N/A")}
                    </Typography>
                    {isObjective ? (
                      <Typography
                        variant="h6"
                        color={isCorrect ? "success.main" : "error.main"}
                      >
                        {isCorrect ? "Correct!" : "Incorrect"}
                      </Typography>
                    ) : (
                      <>
                        {grade !== undefined && (
                          <Typography variant="body2" color="info.main" gutterBottom>
                            <strong>Score:</strong> {grade}/10
                          </Typography>
                        )}
                        {feedback && (
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            <strong>Feedback:</strong> {feedback}
                          </Typography>
                        )}
                      </>
                    )}
                  </Paper>
                );
              })}
            </Box>
          </Grid>
        </Grid>
        <Modal
          open={explanationOpen}
          onClose={handleCloseExplanation}
          closeAfterTransition
          slots={{ backdrop: Backdrop }}
          slotProps={{
            backdrop: {
              timeout: 500,
            },
          }}
        >
          <Fade in={explanationOpen}>
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: 400,
                bgcolor: "background.paper",
                boxShadow: 24,
                p: 4,
                borderRadius: 2,
              }}
            >
              <Typography variant="h6" sx={{ mb: 2 }}>
                Explanation
              </Typography>
              {loadingExplanation ? (
                <CircularProgress />
              ) : (
                <Typography>{explanation}</Typography>
              )}
              <Button
                variant="contained"
                onClick={handleCloseExplanation}
                sx={{ mt: 2 }}
              >
                Close
              </Button>
            </Box>
          </Fade>
        </Modal>
      </AnimatedBox>
    )}
  </Box>
);
};

const generatePlaceholderQuiz = () => ({
  topic: "Placeholder Quiz",
  questions: [
    {
      question: "What is the capital of France?",
      options: ["Paris", "Berlin", "Madrid"],
      answer: "Paris",
    },
    {
      question: "What is 2 + 2?",
      options: ["3", "4", "5"],
      answer: "4",
    },
    {
      question: "Which planet is known as the Red Planet?",
      options: ["Earth", "Mars", "Venus"],
      answer: "Mars",
    },
  ],
});

export default QuizPage;
