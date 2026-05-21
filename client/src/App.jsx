import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';

// Seeker Pages
import JobListings from './pages/JobListings';
import JobDetail from './pages/JobDetail';
import SeekerDashboard from './pages/SeekerDashboard';
import SeekerProfile from './pages/SeekerProfile';

// Employer Pages
import EmployerDashboard from './pages/EmployerDashboard';
import AddJob from './pages/AddJob';
import Applicants from './pages/Applicants';
import ManageJobs from './pages/ManageJobs';
import CompanyProfile from './pages/CompanyProfile';
import EmployerApplications from './pages/EmployerApplications';

// Shared
import Settings from './pages/Settings';
import Companies from './pages/Companies';
import Applications from './pages/Applications';
// AUTH
import { useAuth } from './hooks/useAuth';
import AuthProvider from './context/AuthProvider';

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/" />;
  return children;
};

function AppRoutes() {
  const location = useLocation();

  const hideNavbar = ['/', '/login', '/register', '/forgot-password'];
  const hideFooter = location.pathname.startsWith('/employer') || location.pathname.startsWith('/seeker');
  const showNavbar = !hideNavbar.includes(location.pathname);

  return (
    <div className="flex flex-col min-h-screen">
      {showNavbar && <Navbar />}
      <main className="grow">
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Seeker */}
          <Route path="/jobs" element={<JobListings />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/seeker/dashboard" element={
            <ProtectedRoute role="seeker"><SeekerDashboard /></ProtectedRoute>
          } />
          <Route path="/seeker/profile" element={
            <ProtectedRoute role="seeker"><SeekerProfile /></ProtectedRoute>
          } />
          <Route path="/seeker/settings" element={
            <ProtectedRoute role="seeker"><Settings /></ProtectedRoute>
          } />

          {/* Employer */}
          <Route path="/employer/dashboard" element={
            <ProtectedRoute role="employer"><EmployerDashboard /></ProtectedRoute>
          } />
          <Route path="/employer/add-job" element={
            <ProtectedRoute role="employer"><AddJob /></ProtectedRoute>
          } />
          <Route path="/employer/manage-jobs" element={
            <ProtectedRoute role="employer"><ManageJobs /></ProtectedRoute>
          } />
          <Route path="/employer/applications" element={
            <ProtectedRoute role="employer"><EmployerApplications /></ProtectedRoute>
          } />
          <Route path="/employer/applicants/:jobId" element={
            <ProtectedRoute role="employer"><Applicants /></ProtectedRoute>
          } />
          <Route path="/employer/company-profile" element={
            <ProtectedRoute role="employer"><CompanyProfile /></ProtectedRoute>
          } />
          <Route path="/employer/settings" element={
            <ProtectedRoute role="employer"><Settings /></ProtectedRoute>
          } />
          <Route path="/companies" element={<Companies />} />
<Route path="/applications" element={
  <ProtectedRoute role="seeker"><Applications /></ProtectedRoute>
} />
        </Routes>
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;