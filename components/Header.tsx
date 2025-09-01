import React from 'react';
import { useAuth } from '../hooks/useAuth';

const Header: React.FC = () => {
  const { logout } = useAuth();

  const handleLogout = () => {
    try {
      logout();
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <h1 className="text-xl font-bold text-sky-600">Daily Report Pro</h1>
          </div>
          <div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
