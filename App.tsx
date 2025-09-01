
import React from 'react';
import { useAuth } from './hooks/useAuth';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import Spinner from './components/Spinner';
import Header from './components/Header';
import { MASTER_USER_EMAIL } from './constants';

const App: React.FC = () => {
  const { user, loading } = useAuth();

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-screen">
          <Spinner />
        </div>
      );
    }

    if (!user) {
      return <Login />;
    }

    const isMaster = user.email === MASTER_USER_EMAIL;

    return (
      <>
        <Header />
        <main className="p-4 sm:p-6 lg:p-8">
          {isMaster ? <AdminDashboard /> : <Dashboard />}
        </main>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      {renderContent()}
    </div>
  );
};

export default App;
