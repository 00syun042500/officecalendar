import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginForm from './components/LoginForm.jsx';
import SignupForm from './components/SignupForm';
import Home from './components/home';
import ReservationForm from './components/ReservationForm';
import ReservationConfirm from './components/ReservationConfirm';
import ReservationList from './pages/ReservationList';
import ReservationSuccess from './pages/ReservationSuccess';
import CalendarPage from './pages/CalendarPage';
import CancelConfirm from './pages/CancelConfirm';
import Profile from './pages/Profile';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import UserIcon from './components/UserIcon';
import Guide from './pages/Guide';
import Faq from './pages/Faq';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import AdminReservationList from './components/AdminReservationList';
import AdminFacilityList from './components/AdminFacilityList';
import AdminUserList from './components/AdminUserList';
import FacilityLedger from './components/FacilityLedger';
import ResetPassword from './components/ResetPassword.jsx';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<LoginForm />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/signup" element={<SignupForm />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/home" element={<Home />} />
        <Route path="/reserve" element={<ReservationForm />} />
        <Route path="/confirm" element={<ReservationConfirm />} />
        <Route path="/reservations" element={<ReservationList />} />
        <Route path="/reservation-success" element={<ReservationSuccess />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/cancel-confirm" element={<CancelConfirm />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/guide" element={<Guide />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/reservations" element={<ProtectedRoute><AdminReservationList /></ProtectedRoute>} />
        <Route path="/admin/facilities" element={<ProtectedRoute><AdminFacilityList /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute><AdminUserList /></ProtectedRoute>} />
        <Route path="/admin/ledger" element={<ProtectedRoute><FacilityLedger /></ProtectedRoute>} />
      </Routes>
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  );
}

export default App;
