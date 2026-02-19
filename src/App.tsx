import { Component, type ErrorInfo, type ReactNode } from "react";
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import SettingsPage from './pages/Settings'

// Placeholder components for now
import LessonsPage from './pages/Lessons'
import ChatPage from './pages/Chat'
import FlashcardsPage from './pages/Flashcards'
import DashboardPage from './pages/Dashboard'
import RoleplayPage from './pages/Roleplay'

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

function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/lessons" element={<LessonsPage />} />
            <Route path="/flashcards" element={<FlashcardsPage />} />
            <Route path="/roleplay" element={<RoleplayPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  )
}

export default App
