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

const App = () => {
  const { userInfo } = useAuth();
  const role = userInfo?.role;
  const isAdminRole = ['admin', 'super_admin', 'department_head', 'department_staff'].includes(role);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Protected Routes */}
      <Route element={userInfo ? <Layout /> : <Navigate to="/login" />}>
        {isAdminRole ? (
          <>
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/admin/manage" element={<ManageComplaints />} />
            <Route path="/admin/complaint/:id" element={<ComplaintDetails />} />
            <Route path="/admin/communication" element={<AdminCommunication />} />
            <Route path="*" element={<Navigate to="/admin-dashboard" />} />
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
