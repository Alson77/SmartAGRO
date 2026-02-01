import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AdminLogin from './pages/auth/AdminLogin';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Farmer Pages
import FarmerDashboard from './pages/farmer/Dashboard';
import CropDiseaseDetection from './pages/farmer/CropDiseaseDetection';
import Chatbot from './pages/farmer/Chatbot';
import SubsidyApplication from './pages/farmer/SubsidyApplication';
import CropIssueReport from './pages/farmer/CropIssueReport';
import MarketPrices from './pages/farmer/MarketPrices';
import Profile from './pages/farmer/Profile'; // Profile page

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import FarmersList from './pages/admin/FarmersList';
import SubsidyManagement from './pages/admin/SubsidyManagement';
import CropIssueManagement from './pages/admin/CropIssueManagement';
import AdminMarketPrices from './pages/admin/MarketPrices';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* Farmer Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <FarmerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/crop-disease" element={
              <ProtectedRoute>
                <CropDiseaseDetection />
              </ProtectedRoute>
            } />
            <Route path="/chatbot" element={
              <ProtectedRoute>
                <Chatbot />
              </ProtectedRoute>
            } />
            <Route path="/subsidy" element={
              <ProtectedRoute>
                <SubsidyApplication />
              </ProtectedRoute>
            } />
            <Route path="/crop-issues" element={
              <ProtectedRoute>
                <CropIssueReport />
              </ProtectedRoute>
            } />
            <Route path="/market-prices" element={
              <ProtectedRoute>
                <MarketPrices />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } /> {/* Profile Route */}

            {/* Admin Protected Routes */}
            <Route path="/admin" element={
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            } />
            <Route path="/admin/dashboard" element={
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            } />
            <Route path="/admin/farmers" element={
              <AdminProtectedRoute>
                <FarmersList />
              </AdminProtectedRoute>
            } />
            <Route path="/admin/subsidies" element={
              <AdminProtectedRoute>
                <SubsidyManagement />
              </AdminProtectedRoute>
            } />
            <Route path="/admin/crop-issues" element={
              <AdminProtectedRoute>
                <CropIssueManagement />
              </AdminProtectedRoute>
            } />
            <Route path="/admin/market-prices" element={
              <AdminProtectedRoute>
                <AdminMarketPrices />
              </AdminProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;