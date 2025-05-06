// src/App.js
import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import PrivateRoute from './components/PrivateRoute';
import BrowseTopics from './pages/BrowseTopics';
import CreateQuiz from './pages/CreateQuiz';
import QuizPage from './pages/QuizPage';
import QuizDetails from './pages/QuizDetails';

function App() {
  // State to manage authentication
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Function to handle login
  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  // Function to handle logout
  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  return (
    <>
      {/* Render Navbar only if authenticated */}
      {isAuthenticated && <Navbar onLogout={handleLogout} />}

      <Routes>
        {/* Root Path Redirect */}
        <Route
          path="/"
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
          }
        />

        {/* Public Routes */}
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />
        <Route
          path="/register"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Register onRegister={handleLogin} />
            )
          }
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={<PrivateRoute isAuthenticated={isAuthenticated} element={Dashboard} />}
        />
        <Route
          path="/profile"
          element={<PrivateRoute isAuthenticated={isAuthenticated} element={Profile} />}
        />

        <Route path="/browse-topics" element={<PrivateRoute isAuthenticated={isAuthenticated} element={BrowseTopics} />} />
        <Route path="/create-quiz" element={<PrivateRoute isAuthenticated={isAuthenticated} element={CreateQuiz} />} />
        <Route path="/quiz" element={<PrivateRoute isAuthenticated={isAuthenticated} element={QuizPage} />} />
        <Route path="/profile" element={<PrivateRoute isAuthenticated={isAuthenticated} element={Profile} />} />
        <Route path="/quiz-details" element={<QuizDetails />}/>



        {/* Catch-All Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
