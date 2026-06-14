import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import CustomerDashboard from './pages/CustomerDashboard';
import AgentDashboard from './pages/AgentDashboard';
import SupervisorDashboard from './pages/SupervisorDashboard';
import TicketDetail from './pages/TicketDetail';
import KnowledgeBase from './pages/KnowledgeBase';

function HomeRedirect() {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');

  if (!token || !userStr) {
    return <Navigate to="/login" replace />;
  }

  const user = JSON.parse(userStr);
  if (user.role === 'Customer') {
    return <Navigate to="/customer" replace />;
  }
  return <Navigate to="/board" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        {/* auth page */}
        <Route path="/login" element={<Login />} />

        {/* customer dashboard */}
        <Route
          path="/customer"
          element={
            <ProtectedRoute allowedRoles={['Customer']}>
              <CustomerDashboard />
            </ProtectedRoute>
          }
        />

        {/* agent & supervisor dashboard */}
        <Route
          path="/board"
          element={
            <ProtectedRoute allowedRoles={['Agent', 'Supervisor']}>
              <AgentDashboard />
            </ProtectedRoute>
          }
        />

        {/* ticket details */}
        <Route
          path="/ticket/:id"
          element={
            <ProtectedRoute>
              <TicketDetail />
            </ProtectedRoute>
          }
        />

        {/* knowledge base */}
        <Route
          path="/kb"
          element={
            <ProtectedRoute>
              <KnowledgeBase />
            </ProtectedRoute>
          }
        />

        {/* supervisor board */}
        <Route
          path="/supervisor"
          element={
            <ProtectedRoute allowedRoles={['Supervisor']}>
              <SupervisorDashboard />
            </ProtectedRoute>
          }
        />

        {/* default redirect */}
        <Route path="/" element={<HomeRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
