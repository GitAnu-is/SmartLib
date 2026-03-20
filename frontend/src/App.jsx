import React, { useState, useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { Navbar } from './components/Navbar'
import { ChatBubble } from './components/ChatBubble'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { DashboardPage } from './pages/DashboardPage'
import { AdminDashboardPage } from './pages/AdminDashboardPage'
import { UserProfilePage } from './pages/UserProfilePage'

function App() {
  const [currentPage, setCurrentPage] = useState('landing')
  const [user, setUser] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('user') || 'null');

    if (token && userData) {
      setUser(userData);
      // On initial load only: if we're on landing/login/register, navigate to dashboard
      if (['landing', 'login', 'register'].includes(currentPage)) {
        if (userData.role === 'admin') {
          setCurrentPage('admin');
        } else {
          setCurrentPage('dashboard');
        }
      }
    } else {
      setUser(null);
    }
  }, []); // Run once on mount to respect user session without overriding manual navigation

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage onNavigate={setCurrentPage} />
      case 'login':
        return <LoginPage onNavigate={setCurrentPage} />
      case 'register':
        return <RegisterPage onNavigate={setCurrentPage} />
      case 'dashboard':
        return <DashboardPage onNavigate={setCurrentPage} />
      case 'admin':
        return <AdminDashboardPage onNavigate={setCurrentPage} />
      case 'profile':
        return <UserProfilePage onNavigate={setCurrentPage} />
      default:
        return <LandingPage onNavigate={setCurrentPage} />
    }
  }

  return (
    <div className="w-full min-h-screen bg-light">
      <Toaster position="top-center" reverseOrder={false} />
      <Navbar currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="w-full">
        {renderPage()}
      </main>
      <ChatBubble />
    </div>
  )
}

export default App
