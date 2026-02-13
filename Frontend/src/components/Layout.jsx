import React from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Layout = ({ children, title, showHeader = true }) => {
  const { user, logout, isAuthenticated } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const getRoleName = (role) => {
    const names = {
      STUDENT: 'Student',
      TEACHER: 'Teacher',
      SUPER_ADMIN: 'Administrator',
    };
    return names[role] || role;
  };

  return (
    <div>
      <main>
        {children}
      </main>
    </div>
  );
};

export default Layout;