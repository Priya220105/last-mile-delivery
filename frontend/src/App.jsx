import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PlaceOrder from './pages/PlaceOrder';
import AdminDashboard from './pages/AdminDashboard';
import AgentDashboard from './pages/AgentDashboard';

function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('login');

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
      if (JSON.parse(userData).role === 'admin') {
        setCurrentPage('admin-dashboard');
      } else if (JSON.parse(userData).role === 'agent') {
        setCurrentPage('agent-dashboard');
      } else {
        setCurrentPage('dashboard');
      }
    }
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    if (userData.role === 'admin') {
      setCurrentPage('admin-dashboard');
    } else if (userData.role === 'agent') {
      setCurrentPage('agent-dashboard');
    } else {
      setCurrentPage('dashboard');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setCurrentPage('login');
  };

  const renderPage = () => {
    if (!user) {
      if (currentPage === 'login') {
        return <Login onLogin={handleLogin} onSwitchPage={() => setCurrentPage('register')} />;
      }
      return <Register onRegister={handleLogin} onSwitchPage={() => setCurrentPage('login')} />;
    }

    switch (currentPage) {
      case 'admin-dashboard':
        return <AdminDashboard user={user} onLogout={handleLogout} />;
      case 'agent-dashboard':
        return <AgentDashboard user={user} onLogout={handleLogout} />;
      case 'place-order':
        return <PlaceOrder user={user} onBack={() => setCurrentPage('dashboard')} />;
      case 'dashboard':
      default:
        return <Dashboard user={user} onLogout={handleLogout} onPlaceOrder={() => setCurrentPage('place-order')} />;
    }
  };

  return (
    <div className="app">
      {renderPage()}
    </div>
  );
}

export default App;
