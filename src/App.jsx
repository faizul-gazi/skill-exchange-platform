import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { ThemeProvider } from './context/ThemeProvider.jsx'
import GuestRoute from './components/auth/GuestRoute.jsx'
import PrivateRoute from './components/auth/PrivateRoute.jsx'
import RoleRoute from './components/auth/RoleRoute.jsx'
import MainLayout from './layouts/MainLayout.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import HomePage from './pages/HomePage.jsx'
import AboutPage from './pages/AboutPage.jsx'
import FeaturesPage from './pages/FeaturesPage.jsx'
import HowItWorksPage from './pages/HowItWorksPage.jsx'
import ArticlesPage from './pages/ArticlesPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import AdminDashboardPage from './pages/AdminDashboardPage.jsx'
import ChatPage from './pages/ChatPage.jsx'
import RequestsPage from './pages/RequestsPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import UserProfilePage from './pages/UserProfilePage.jsx'
import ReviewsPage from './pages/ReviewsPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import CoursesPage from './pages/CoursesPage.jsx'
import CreateCoursePage from './pages/CreateCoursePage.jsx'
import MyCoursesPage from './pages/MyCoursesPage.jsx'
import CourseDetailsPage from './pages/CourseDetailsPage.jsx'
import TeachingCoursesPage from './pages/TeachingCoursesPage.jsx'
import SkillExchangePage from './pages/SkillExchangePage.jsx'
import SessionPage from './pages/SessionPage.jsx'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
      <ToastProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/articles" element={<ArticlesPage />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/courses/:courseId" element={<CourseDetailsPage />} />
            <Route element={<GuestRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>
            <Route element={<PrivateRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/users/:userId" element={<UserProfilePage />} />
              <Route element={<RoleRoute allowedRoles={['learner', 'both']} />}>
                <Route path="/my-courses" element={<MyCoursesPage />} />
              </Route>
              <Route
                element={<RoleRoute allowedRoles={['teacher', 'both']} requireApprovedTeacher redirectTo="/dashboard" />}
              >
                <Route path="/courses/create" element={<CreateCoursePage />} />
                <Route path="/teaching-courses" element={<TeachingCoursesPage />} />
              </Route>
              <Route element={<RoleRoute allowedRoles={['both']} requireApprovedTeacher redirectTo="/dashboard" />}>
                <Route path="/skill-exchange" element={<SkillExchangePage />} />
                <Route path="/matches" element={<Navigate to="/skill-exchange" replace />} />
                <Route path="/requests" element={<RequestsPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/session" element={<SessionPage />} />
                <Route path="/reviews" element={<ReviewsPage />} />
              </Route>
              <Route element={<RoleRoute allowedRoles={['admin']} />}>
                <Route path="/admin" element={<AdminDashboardPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
      </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
