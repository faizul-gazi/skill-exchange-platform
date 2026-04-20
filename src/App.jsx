import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { ThemeProvider } from './context/ThemeProvider.jsx'
import GuestRoute from './components/auth/GuestRoute.jsx'
import PrivateRoute from './components/auth/PrivateRoute.jsx'
import MainLayout from './layouts/MainLayout.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import HomePage from './pages/HomePage.jsx'
import AboutPage from './pages/AboutPage.jsx'
import FeaturesPage from './pages/FeaturesPage.jsx'
import HowItWorksPage from './pages/HowItWorksPage.jsx'
import ArticlesPage from './pages/ArticlesPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import MatchesPage from './pages/MatchesPage.jsx'
import AdminDashboardPage from './pages/AdminDashboardPage.jsx'
import ChatPage from './pages/ChatPage.jsx'
import RequestsPage from './pages/RequestsPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import UserProfilePage from './pages/UserProfilePage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
      <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/articles" element={<ArticlesPage />} />
            <Route element={<GuestRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>
            <Route element={<PrivateRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/matches" element={<MatchesPage />} />
              <Route path="/requests" element={<RequestsPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/users/:userId" element={<UserProfilePage />} />
              <Route path="/admin" element={<AdminDashboardPage />} />
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
