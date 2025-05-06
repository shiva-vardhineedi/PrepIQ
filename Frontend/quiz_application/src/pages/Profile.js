import React, { useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  IconButton,
  Tooltip,
  Button,
  Modal,
  Fade,
  Backdrop,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { styled } from "@mui/material/styles";
import { useSpring, animated } from "react-spring";
import { keyframes } from "@mui/system";

const pulse = keyframes`
  0% {
    transform: scale(1);
    color: #3a7bd5;
  }
  50% {
    transform: scale(1.1);
    color: #3a6073;
  }
  100% {
    transform: scale(1);
    color: #3a7bd5;
  }
`;

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: theme.spacing(2),
  background: "rgba(255, 255, 255, 0.8)",
  backdropFilter: "blur(10px)",
  boxShadow: "0px 4px 30px rgba(0, 0, 0, 0.1)",
  position: "relative",
  overflow: "hidden",
}));

const AnimatedIcon = styled(AccountCircleIcon)(({ theme }) => ({
  fontSize: "200px",
  color: theme.palette.primary.main,
  animation: `${pulse} 4s infinite`,
}));

const AnimatedBox = animated(Box);

const Profile = () => {
  const [openModal, setOpenModal] = useState(false);

  const props = useSpring({
    from: { opacity: 0, transform: "translateY(50px)" },
    to: { opacity: 1, transform: "translateY(0px)" },
    config: { duration: 800 },
  });

  const handleEditClick = () => {
    setOpenModal(true);
  };

  const handleSave = () => {
    // Handle save action here
    setOpenModal(false);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)",
        py: 8,
      }}
    >
      <AnimatedBox style={props}>
        <StyledPaper sx={{ maxWidth: 800, mx: "auto" }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} sm={4}>
              <Box sx={{ position: "relative", textAlign: "center" }}>
                <AnimatedIcon />
                <Tooltip title="Edit Profile">
                  <IconButton
                    color="primary"
                    sx={{ position: "absolute", bottom: 16, right: "calc(50% - 20px)" }}
                    onClick={handleEditClick}
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
            <Grid item xs={12} sm={8}>
              <Typography variant="h4" sx={{ fontWeight: "bold", mb: 2 }}>
                John Doe
              </Typography>
              <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
                <strong>Profession:</strong> Software Engineer
              </Typography>
              <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
                <strong>Email:</strong> john.doe@example.com
              </Typography>
              <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
                <strong>Phone:</strong> +1 (123) 456-7890
              </Typography>
              <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
                <strong>Location:</strong> San Francisco, CA
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<EditIcon />}
                sx={{ mt: 2, textTransform: "none" }}
                onClick={handleEditClick}
              >
                Edit Profile
              </Button>
            </Grid>
          </Grid>
        </StyledPaper>
      </AnimatedBox>

      {/* Modal for Editing Profile */}
      <Modal
        open={openModal}
        onClose={() => setOpenModal(false)}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 500,
          },
        }}
      >
        <Fade in={openModal}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 500,
              bgcolor: "background.paper",
              boxShadow: 24,
              p: 4,
              borderRadius: 2,
            }}
          >
            <Typography variant="h6" sx={{ mb: 2 }}>
              Edit Profile
            </Typography>
            {/* Add form fields here */}
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              sx={{ mt: 2 }}
              onClick={handleSave}
            >
              Save Changes
            </Button>
          </Box>
        </Fade>
      </Modal>
    </Box>
  );
};

export default Profile;
