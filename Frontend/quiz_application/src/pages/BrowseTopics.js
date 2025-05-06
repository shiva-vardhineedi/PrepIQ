import React, { useState, useEffect, useRef } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
  Box,
  TextField,
  Button,
  Drawer,
  Snackbar,
  Alert,
  Modal,
  Fade,
  MenuItem,
  Backdrop,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  CircularProgress,
} from "@mui/material";
import { keyframes } from '@mui/system';
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import SearchIcon from "@mui/icons-material/Search";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate, useLocation } from "react-router-dom"; // Import useLocation
import CheckIcon from '@mui/icons-material/Check';
import SaveIcon from '@mui/icons-material/Save';
import { green } from '@mui/material/colors';
import axios from "axios";

const topicsData = [
  { id: 1, name: "Math", description: "Algebra, Geometry, Calculus", isFavorite: true },
  { id: 2, name: "Science", description: "Physics, Chemistry, Biology", isFavorite: false },
  { id: 3, name: "History", description: "World History, Ancient Civilizations", isFavorite: true },
  { id: 4, name: "Programming", description: "Python, JavaScript, Algorithms", isFavorite: false },
  { id: 5, name: "Design", description: "UI/UX, Graphic Design, Typography", isFavorite: false },
];



const questionTypes = ["Multiple Choice", "True/False", "Short Answer", "Long Answer"];

const rotateAnimation = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const BrowseTopics = () => {
  // const [topics, setTopics] = useState(topicsData);
  const [topics, setTopics] = useState([]);
  const [quizId, setQuizId] = useState(null); // State to store the quiz ID
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterFavorites, setFilterFavorites] = useState(false); // Initial state is false
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    subtopics: "",
    numQuestions: "",
    extraInfo: "",
    questionCounts: {
      multipleChoice: 0,
      trueFalse: 0,
      shortAnswer: 0,
      longAnswer: 0,
    },
  });
  
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [newTopicData, setNewTopicData] = useState({
    name: '',
    description: '',
    isFavorite: false,
    files: [],
  });
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation(); // Get the location object

  useEffect(() => {
    // Handle navigation state
    if (location.state && location.state.showFavorites) {
      setFilterFavorites(true);
    }
  
    // Load favorites from localStorage and merge with current topics
    const storedFavorites = JSON.parse(localStorage.getItem("favoriteTopics")) || [];
    setTopics((prevTopics) =>
      prevTopics.map((topic) =>
        storedFavorites.find((fav) => fav.name === topic.name)
          ? { ...topic, isFavorite: true }
          : { ...topic, isFavorite: false }
      )
    );
  }, [location.state]);

  useEffect(() => {
    const storedFavorites = JSON.parse(localStorage.getItem("favoriteTopics")) || [];
    setTopics((prevTopics) =>
      prevTopics.map((topic) =>
        storedFavorites.find((fav) => fav.id === topic.id)
          ? { ...topic, isFavorite: true }
          : { ...topic, isFavorite: false }
      )
    );
  }, []);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        setLoadingTopics(true);
        const baseURL = process.env.REACT_APP_API_URL || "http://localhost:8000";
        const response = await axios.get(`${baseURL}/list-s3-topics`);
        // const response = await axios.get("http://localhost:8000/list-s3-topics");
        console.log("Response from fetchTopics:", response.data);
  
        // Fetch stored favorites from localStorage
        const storedFavorites = JSON.parse(localStorage.getItem("favoriteTopics")) || [];
  
        // Map the fetched topics and merge with stored favorites
        const fetchedTopics = response.data.folders.map((folder, index) => {
          const isFavorite = storedFavorites.some((fav) => fav.name === folder); // Match by topic name
          return {
            id: index + 1,
            name: folder,
            description: `Description for ${folder}`,
            isFavorite, // Set favorite status
          };
        });
  
        setTopics(fetchedTopics);
      } catch (error) {
        console.error("Error fetching topics:", error);
        setTopics([]);
      } finally {
        setLoadingTopics(false);
      }
    };
  
    fetchTopics();
  }, []);
  

  // Render loading spinner if data is still being fetched
  if (loadingTopics) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading topics...
        </Typography>
      </Box>
    );
  }


  

  const toggleFavorite = (id) => {
    setTopics((prevTopics) => {
      const updatedTopics = prevTopics.map((topic) =>
        topic.id === id ? { ...topic, isFavorite: !topic.isFavorite } : topic
      );
  
      // Update localStorage with the new favorite topics
      const updatedFavorites = updatedTopics.filter((topic) => topic.isFavorite);
      localStorage.setItem("favoriteTopics", JSON.stringify(updatedFavorites));
  
      return updatedTopics;
    });
  };

  const handleSelectTopic = (topic) => {
    setSelectedTopic(topic);
    setModalOpen(true);
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFormSubmit = async () => {
    if (!selectedTopic || !formData.subtopics || !formData.numQuestions) {
      alert("Please fill all required fields.");
      return;
    }
  
    const totalRequested = Object.values(formData.questionCounts).reduce((a, b) => a + b, 0);
    if (parseInt(formData.numQuestions) !== totalRequested) {
      alert("Total number of questions does not match the sum of question type counts.");
      return;
    }
  
    setModalOpen(false);
    setLoading(true);
  
    try {
      const requestData = {
        topic_name: selectedTopic.name,
        subtopics: formData.subtopics
          ? formData.subtopics.split(",").map((s) => s.trim())
          : [],
        numQuestions: formData.numQuestions,
        extraInfo: formData.extraInfo ? formData.extraInfo : "",
        questionCounts: formData.questionCounts,
      };
  
      // Call generate-quiz API
      const baseURL = process.env.REACT_APP_API_URL || "http://localhost:8000";
      const response = await axios.post(`${baseURL}/generate-quiz`, requestData);
      // const response = await axios.post("http://localhost:8000/generate-quiz", requestData);
  
      if (response.status === 200) {
        const quizQuestions = response.data.quiz_questions;
  
        // Call store-quiz API with quizQuestions
        const storeRequest = {
          topic_name: selectedTopic.name,
          subtopics: requestData.subtopics,
          quiz_questions: quizQuestions,
          numQuestions: formData.numQuestions,
          extraInfo: formData.extraInfo ? formData.extraInfo : "",
          questionCounts: formData.questionCounts,
        };
  
        const baseURL = process.env.REACT_APP_API_URL || "http://localhost:8000";
        const storeResponse = await axios.post(`${baseURL}/store-quiz`, storeRequest);
        // const storeResponse = await axios.post("http://localhost:8000/store-quiz", storeRequest);
  
        if (storeResponse.status === 200) {
          setQuizId(storeResponse.data.quiz_id); // Save the quiz ID for later use
  
          // Navigate to QuizPage with the formatted quiz data and quizId
          const formattedQuestions = quizQuestions.map((q) => ({
            question: q.question,
            options: q.choices,
            answer: q.answer,
          }));
          navigate("/quiz", {
            state: { quiz: { topic: selectedTopic.name, questions: formattedQuestions, quizId: storeResponse.data.quiz_id } },
          });
  
          setNotification({
            open: true,
            message: "Quiz successfully generated and stored!",
            severity: "success",
          });
        } else {
          setNotification({
            open: true,
            message: "Error storing quiz. Please try again.",
            severity: "error",
          });
        }
      } else {
        setNotification({
          open: true,
          message: `Error generating quiz: ${response.data.message}`,
          severity: "error",
        });
      }
    } catch (error) {
      console.error("Error during quiz generation or storage:", error);
      setNotification({
        open: true,
        message: "An unexpected error occurred. Please try again.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };
  

  const handleSubmit = (userAnswers) => {
    if (!quizId) {
      console.error("Quiz ID not found.");
      return;
    }
    submitAnswers(quizId, userAnswers);
  };
  
  
  
  const submitAnswers = async (userAnswers) => {
    if (!quizId) {
      console.error("Quiz ID not found. Cannot submit answers.");
      return;
    }
  
    try {
      const answerData = {
        quiz_id: quizId, // Use the quiz ID from state
        your_answers: userAnswers, // Array of user's answers
      };
  
      const baseURL = process.env.REACT_APP_API_URL || "http://localhost:8000";
      const response = await axios.post(`${baseURL}/update_answers`, answerData);
      // const response = await axios.post("http://localhost:8000/update_answers", answerData);
  
      if (response.status === 200) {
        console.log("Answers updated successfully:", response.data);
        setNotification({
          open: true,
          message: "Answers submitted successfully!",
          severity: "success",
        });
      } else {
        console.error("Error updating answers:", response.data);
        setNotification({
          open: true,
          message: "Error updating answers. Please try again.",
          severity: "error",
        });
      }
    } catch (error) {
      console.error("Error submitting answers:", error);
      setNotification({
        open: true,
        message: "An unexpected error occurred. Please try again.",
        severity: "error",
      });
    }
  };
  
  
  
  
  

  const handleFileUpload = (e) => {
    const filesArray = Array.from(e.target.files);
    setNewTopicData((prev) => ({ ...prev, files: [...prev.files, ...filesArray] }));
  };
  

  const handleDeleteFile = (index) => {
    setNewTopicData((prev) => {
      const newFiles = [...prev.files];
      newFiles.splice(index, 1);
      return { ...prev, files: newFiles };
    });
  };

  const handleCreateNewTopic = async () => {
    // Validate inputs
    if (!newTopicData.name || !newTopicData.description) {
      alert("Please fill in all fields");
      return;
    }
  
    if (newTopicData.files.length === 0) {
      alert("Please upload at least one file");
      return;
    }
  
    const formData = new FormData();
    newTopicData.files.forEach((file) => {
      formData.append("files", file);
    });
  
    setLoading(true);
  
    try {
      // Step 1: Upload documents and create FAISS index
      const baseURL = process.env.REACT_APP_API_URL || "http://localhost:8000";
      // const response = await axios.post(`${baseURL}/update_answers`, answerData);
      const faissResponse = await axios.post(`${baseURL}/upload-documents`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
  
      if (faissResponse.status === 200) {
        setNotification({
          open: true,
          message: "FAISS index created successfully!",
          severity: "success",
        });
  
        // Step 2: Upload FAISS index to S3
        const baseURL = process.env.REACT_APP_API_URL || "http://localhost:8000";
        const s3Response = await axios.post(
          `${baseURL}/upload-faiss-to-s3`,
          { s3_folder_name: newTopicData.name },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
  
        if (s3Response.status === 200) {
          setNotification({
            open: true,
            message: `FAISS index uploaded successfully to s3://cmpe-295/${newTopicData.name}`,
            severity: "success",
          });
  
          // Add the new topic to the topics list
          const newTopic = {
            id: topics.length + 1,
            name: newTopicData.name,
            description: newTopicData.description,
            isFavorite: newTopicData.isFavorite,
            files: newTopicData.files,
          };
          setTopics([...topics, newTopic]);
  
          // Reset newTopicData
          setNewTopicData({
            name: "",
            description: "",
            isFavorite: false,
            files: [],
          });
  
          setIsDrawerOpen(false);
        } else {
          setNotification({
            open: true,
            message: `Error uploading to S3: ${s3Response.data.message}`,
            severity: "error",
          });
        }
      } else {
        setNotification({
          open: true,
          message: `Error creating FAISS index: ${faissResponse.data.message}`,
          severity: "error",
        });
      }
    } catch (error) {
      console.error("Error during topic creation:", error);
      setNotification({
        open: true,
        message: "An unexpected error occurred. Please try again.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };
  
  

  const filteredTopics = (topics || []).filter((topic) => {
    if (filterFavorites && !topic.isFavorite) return false;
    if (searchTerm && !topic.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });  

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: "bold" }}>
        Browse Topics
      </Typography>

      {/* Filters Section */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          flexWrap: "wrap",
          mb: 3,
        }}
      >
        <TextField
          placeholder="Search topics..."
          variant="outlined"
          size="small"
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1 }} />,
          }}
          sx={{ width: "250px" }}
        />
        <Chip
          label="Favorites"
          color={filterFavorites ? "primary" : "default"}
          onClick={() => setFilterFavorites(!filterFavorites)}
          clickable
        />
        <Button
          startIcon={<AddCircleIcon />}
          variant="contained"
          color="primary"
          onClick={() => setIsDrawerOpen(true)}
          sx={{ textTransform: "none", fontWeight: "bold" }}
        >
          Create New Topic
        </Button>
      </Box>

      {/* Topics Grid */}
      <Grid container spacing={3}>
      {filteredTopics.map((topic) => (
        <Grid item xs={12} sm={6} md={4} key={topic.name}>
          <Card
            sx={{
            borderRadius: 2,
            boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
            position: "relative",
          overflow: "hidden",
          transition: "transform 0.3s",
          cursor: "pointer",
          "&:hover": {
            transform: "scale(1.03)",
            boxShadow: "0px 8px 15px rgba(0, 0, 0, 0.2)",
          },
        }}
        onClick={() => handleSelectTopic(topic)}
      >
        <Box
          sx={{
            height: "140px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: `linear-gradient(135deg, #${Math.floor(
              Math.random() * 16777215
            ).toString(16)}, #${Math.floor(Math.random() * 16777215).toString(16)})`,
            borderTopLeftRadius: "8px",
            borderTopRightRadius: "8px",
          }}
        >
          <Typography
            variant="h3"
            sx={{
              fontWeight: "bold",
              color: "white",
              textShadow: "1px 1px 4px rgba(0, 0, 0, 0.5)",
            }}
          >
            {topic.name[0]}
          </Typography>
        </Box>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              {topic.name}
            </Typography>
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(topic.id); // Use name as the identifier
              }}
            >
              {topic.isFavorite ? (
                <FavoriteIcon color="error" />
              ) : (
                <FavoriteBorderIcon />
              )}
            </IconButton>
          </Box>
                <Typography variant="body2" color="text.secondary">
                  {topic.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>


      {/* Drawer for Creating New Topic */}
      <Drawer
        anchor="right"
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      >
        <Box sx={{ width: 400, p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Create New Topic
          </Typography>
          <TextField
            label="Topic Name"
            fullWidth
            variant="outlined"
            value={newTopicData.name}
            onChange={(e) => setNewTopicData({ ...newTopicData, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Description"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={newTopicData.description}
            onChange={(e) => setNewTopicData({ ...newTopicData, description: e.target.value })}
            sx={{ mb: 2 }}
          />

          {/* File Upload Component */}
          <Box
            sx={{
              border: '2px dashed',
              borderColor: isDragging ? 'primary.main' : '#ccc',
              borderRadius: 2,
              padding: 2,
              textAlign: 'center',
              color: isDragging ? 'primary.main' : '#999',
              mb: 2,
              cursor: 'pointer',
              transition: 'border 0.3s, color 0.3s',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(0,0,0,0.05))',
            }}
            onClick={() => fileInputRef.current.click()}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(false);
              const files = e.dataTransfer.files;
              handleFileUpload({ target: { files } });
            }}
          >
            <CloudUploadIcon
              sx={{
                fontSize: 50,
                mb: 1,
                animation: isDragging ? `${rotateAnimation} 2s linear infinite` : 'none',
              }}
            />
            <Typography variant="body1">Click or Drag &amp; Drop files to upload</Typography>
          </Box>
          <input
            type="file"
            multiple
            hidden
            ref={fileInputRef}
            onChange={handleFileUpload}
          />

          {/* Display uploaded files with delete option */}
          {newTopicData.files.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Uploaded Files:</Typography>
              <List>
                {newTopicData.files.map((file, index) => (
                  <Collapse in={true} key={index}>
                    <ListItem
                      secondaryAction={
                        <IconButton edge="end" onClick={() => handleDeleteFile(index)}>
                          <DeleteIcon />
                        </IconButton>
                      }
                    >
                      <ListItemIcon>
                        <InsertDriveFileIcon />
                      </ListItemIcon>
                      <ListItemText primary={file.name} />
                    </ListItem>
                  </Collapse>
                ))}
              </List>
            </Box>
          )}

          <FormControlLabel
            control={
              <Checkbox
                checked={newTopicData.isFavorite}
                onChange={(e) => setNewTopicData({ ...newTopicData, isFavorite: e.target.checked })}
              />
            }
            label="Add to Favorites"
            sx={{ mb: 2 }}
          />
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleCreateNewTopic}
            disabled={loading}
          >
            {loading ? "Processing..." : "Create Topic"}
          </Button>;

        </Box>

        <Snackbar
          open={notification.open}
          autoHideDuration={3000}
          onClose={() => setNotification({ ...notification, open: false })}
        >
          <Alert onClose={() => setNotification({ ...notification, open: false })} severity={notification.severity} sx={{ width: "100%" }}>
            {notification.message}
          </Alert>
        </Snackbar>;

      </Drawer>

      {/* Modal for Topic Form */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 500,
          },
        }}
      >
        <Fade in={modalOpen}>
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
              Create Quiz for {selectedTopic?.name}
            </Typography>
            <TextField
              label="Subtopics to Cover"
              fullWidth
              variant="outlined"
              value={formData.subtopics}
              onChange={(e) => handleFormChange("subtopics", e.target.value)}
              placeholder="e.g., Algebra, Geometry"
              sx={{ mb: 2 }}
            />
            <TextField
              label="Number of Questions"
              fullWidth
              type="number"
              variant="outlined"
              value={formData.numQuestions}
              onChange={(e) => handleFormChange("numQuestions", e.target.value)}
              sx={{ mb: 2 }}
              required
            />
            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
              Specify Number of Questions for Each Type
            </Typography>
            {[
              { label: "Multiple Choice", key: "multipleChoice" },
              { label: "True/False", key: "trueFalse" },
              { label: "Short Answer", key: "shortAnswer" },
              { label: "Long Answer", key: "longAnswer" },
            ].map((item) => (
              <TextField
                key={item.key}
                label={item.label}
                type="number"
                fullWidth
                variant="outlined"
                sx={{ mb: 2 }}
                value={formData.questionCounts[item.key]}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    questionCounts: {
                      ...prev.questionCounts,
                      [item.key]: parseInt(e.target.value || "0"),
                    },
                  }))
                }
              />
            ))}

            <TextField
              label="Extra Information"
              fullWidth
              variant="outlined"
              multiline
              rows={3}
              value={formData.extraInfo}
              onChange={(e) => handleFormChange("extraInfo", e.target.value)}
            />
            <Box sx={{ mt: 2, position: 'relative' }}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleFormSubmit}
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit'}
              </Button>
              {loading && (
                <CircularProgress
                  size={24}
                  sx={{
                    color: 'primary.main',
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    marginTop: '-12px',
                    marginLeft: '-12px',
                  }}
                />
              )}
            </Box>
          </Box>
        </Fade>
      </Modal>

      {/* Full-Screen Loader */}
      {loading && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            bgcolor: 'rgba(0, 0, 0, 0.7)',
            zIndex: 1400,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            textAlign: 'center',
          }}
        >
          <CircularProgress
            size={80}
            sx={{
              mb: 4,
              animation: `${rotateAnimation} 2s linear infinite`,
            }}
          />
          <Typography variant="h5" sx={{ mb: 1 }}>
            Creating quiz...
          </Typography>
          <Typography variant="body1">
            This may take a few seconds.
          </Typography>
        </Box>
      )}

      {/* Snackbar Notification */}
      <Snackbar
        open={notification.open}
        autoHideDuration={3000}
        onClose={() => setNotification({ ...notification, open: false })}
      >
        <Alert onClose={() => setNotification({ ...notification, open: false })} severity={notification.severity} sx={{ width: "100%" }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BrowseTopics;
