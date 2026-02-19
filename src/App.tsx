import { Component, type ErrorInfo, type ReactNode } from "react";
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import Layout from './components/Layout'
// Core IA Pages
import HomePage from './pages/Home'
import PracticePage from './pages/Practice'
import ProfilePage from './pages/Profile'

// Detail Pages
import LessonsPage from './pages/Lessons'
import SettingsPage from './pages/Settings'
import OnboardingPage from './pages/Onboarding'
import { useAppStore } from "./store";

// Legacy/Placeholder placeholder (can be removed later once files are deleted)
// import ChatPage from './pages/Chat'
// import FlashcardsPage from './pages/Flashcards'
// import RoleplayPage from './pages/Roleplay'

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center text-red-500">
          <h1>Something went wrong.</h1>
          <pre className="mt-4 bg-gray-100 p-4 rounded text-left overflow-auto max-w-2xl mx-auto text-sm text-black">
            {this.state.error?.message}
            <br />
            {this.state.error?.stack}
          </pre>
          <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded" onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Protected Route Wrapper
const RequireOnboarding = () => {
  const { userProgress } = useAppStore();
  return userProgress.isOnboarded ? <Outlet /> : <Navigate to="/onboarding" replace />;
};

function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <Routes>
          {/* Public Route */}
          <Route path="/onboarding" element={<OnboardingPage />} />

          {/* Protected Routes */}
          <Route element={<RequireOnboarding />}>
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/practice" element={<PracticePage />} />
              <Route path="/profile" element={<ProfilePage />} />

              {/* Modal/Detail Routes - Typically these might overlay or be separate pages */}
              <Route path="/lessons/:id" element={<LessonsPage />} />
              <Route path="/settings" element={<SettingsPage />} />

              {/* Legacy redirect for safety */}
              <Route path="/chat" element={<Navigate to="/practice" replace />} />
              <Route path="/flashcards" element={<Navigate to="/practice" replace />} />
              <Route path="/roleplay" element={<Navigate to="/practice" replace />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  )
}

export default App
