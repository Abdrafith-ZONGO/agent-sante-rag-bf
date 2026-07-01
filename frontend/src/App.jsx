import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ChatWindow from './components/ChatWindow'
import Login from './pages/Login'
import Register from './pages/Register'

// Private route wrapper
function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route 
          path="/" 
          element={
            <PrivateRoute>
              <div className="h-screen flex flex-col bg-clinic-50">
                <header className="bg-clinic-700 text-white px-6 py-2.5 shadow-sm shrink-0 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h1 className="text-base font-semibold">Agent Santé BF (Pro)</h1>
                    <span className="text-clinic-100 text-xs px-2 py-0.5 rounded-full bg-clinic-600/50">
                      Consultation assistée par IA
                    </span>
                  </div>
                </header>
                <main className="flex-1 flex overflow-hidden">
                  <ChatWindow />
                </main>
              </div>
            </PrivateRoute>
          } 
        />
      </Routes>
    </Router>
  )
}
