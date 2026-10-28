import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Home from './pages/Home';
import SubmitComplaint from './pages/SubmitComplaint';
import TrackComplaint from './pages/TrackComplaint';
import AdminDashboard from './pages/AdminDashboard';
import AdminAnalytics from './pages/AdminAnalytics';
import ManageComplaints from './pages/ManageComplaints';
import ComplaintDetails from './pages/ComplaintDetails';
import Profile from './pages/Profile';
import AdminCommunication from './pages/AdminCommunication';

import ErrorBoundary from './components/ErrorBoundary';

const App = () => {
  const { userInfo } = useAuth();
  const role = userInfo?.role;
  const isAdminRole = ['admin', 'super_admin', 'department_head', 'verifier', 'department_staff'].includes(role);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Protected Routes */}
      <Route element={userInfo ? <Layout /> : <Navigate to="/login" />}>
        {isAdminRole ? (
          <>
            <Route path="/admin-dashboard" element={<ErrorBoundary title="Admin Dashboard Error"><AdminDashboard /></ErrorBoundary>} />
            <Route path="/department/dashboard" element={<ErrorBoundary title="Department Dashboard Error"><AdminDashboard /></ErrorBoundary>} />
            <Route path="/staff/dashboard" element={<ErrorBoundary title="Staff Queue Error"><ManageComplaints /></ErrorBoundary>} />
            <Route path="/admin/analytics" element={<ErrorBoundary title="Civic Analytics Error"><AdminAnalytics /></ErrorBoundary>} />
            <Route path="/admin/manage" element={<ErrorBoundary title="Incident Vault Error"><ManageComplaints /></ErrorBoundary>} />
            <Route path="/admin/complaint/:id" element={<ErrorBoundary title="Detailed Analysis Error"><ComplaintDetails /></ErrorBoundary>} />
            <Route path="/admin/communication" element={<ErrorBoundary title="Broadcast Communication Error"><AdminCommunication /></ErrorBoundary>} />
            <Route
              path="*"
              element={
                ['verifier', 'department_staff'].includes(role) ? (
                  <Navigate to="/admin/manage" replace />
                ) : (
                  <Navigate to="/admin-dashboard" replace />
                )
              }
            />
          </>
        ) : (
          <>
            <Route path="/citizen-dashboard" element={<Home />} />
            <Route path="/submit" element={<SubmitComplaint />} />
            <Route path="/track" element={<TrackComplaint />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/citizen-dashboard" />} />
          </>
        )}
      </Route>
    </Routes>
  );
};

export default App;
