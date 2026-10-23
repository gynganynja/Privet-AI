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
import RoleplayPage from './pages/Roleplay'
import { useAppStore } from "./store";

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
        <div className="min-h-dvh flex items-center justify-center p-6">
          <div className="max-w-md w-full space-y-4 text-center">
            <h1 className="text-2xl font-bold">Something went wrong</h1>
            <p className="text-muted-foreground">Your progress is saved. Reloading usually fixes this.</p>
            <details className="text-left text-xs bg-muted p-3 rounded">
              <summary className="cursor-pointer">Error details</summary>
              <pre className="mt-2 whitespace-pre-wrap overflow-auto max-h-60">{this.state.error?.message}</pre>
            </details>
            <button className="px-4 py-2 rounded-md bg-primary text-primary-foreground" onClick={() => window.location.reload()}>
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Protected Route Wrapper
const RequireOnboarding = () => {
  const isOnboarded = useAppStore((s) => s.userProgress.isOnboarded);
  return isOnboarded ? <Outlet /> : <Navigate to="/onboarding" replace />;
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

              <Route path="/lessons" element={<LessonsPage />} />
              <Route path="/lessons/:id" element={<LessonsPage />} />
              <Route path="/roleplay" element={<RoleplayPage />} />
              <Route path="/settings" element={<SettingsPage />} />

              {/* Old URLs */}
              <Route path="/chat" element={<Navigate to="/roleplay" replace />} />
              <Route path="/flashcards" element={<Navigate to="/practice" replace />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  )
}

export default App
