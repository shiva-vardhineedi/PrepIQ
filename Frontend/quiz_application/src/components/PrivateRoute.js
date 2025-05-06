// src/components/PrivateRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * PrivateRoute component to protect routes.
 *
 * @param {boolean} isAuthenticated - Authentication status.
 * @param {React.Component} element - Component to render if authenticated.
 * @returns {React.Component} - Either the requested component or a redirect.
 */
const PrivateRoute = ({ isAuthenticated, element: Element }) => {
  return isAuthenticated ? <Element /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
