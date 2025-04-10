// src/Router/ProtectedRoute.js
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { all_routes } from './all_routes'; 

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const location = useLocation();
  const route = all_routes;

  if (!token) {
    console.log("ProtectedRoute: No token found, redirecting to signin.");
    return <Navigate to={route.signin} state={{ from: location }} replace />;

  }

  return children;
};

export default ProtectedRoute;