

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User, Report } from '../types';
import { getAllUsers, getAllReports, addUser, updateUserStatus, deleteUser } from '../services/firestoreService';
import UserList from './UserList';
import ReportList from './ReportList';
import Spinner from './Spinner';
import { MASTER_USER_EMAIL } from '../constants';

type AdminView = 'menu' | 'users' | 'reports';
type UserAction = { user: User; action: 'toggleStatus' | 'delete' };

const AdminDashboard: React.FC = () => {
  // General State
  const [view, setView] = useState<AdminView>('menu');
  const [error, setError] = useState<string | null>(null);
  
  // User Management State
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserDisplayName, setNewUserDisplayName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userActionPending, setUserActionPending] = useState<UserAction | null>(null);

  // Report Search State
  const [allReports, setAllReports] = useState<Report[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [keyword, setKeyword] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false); // State to control result visibility

  const fetchAndSetUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const users = await getAllUsers();
      setAllUsers(users);
    } catch (err) {
      setError("Failed to fetch users.");
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const fetchAndSetAllReports = useCallback(async () => {
    try {
        setLoadingReports(true);
        const reports = await getAllReports();
        setAllReports(reports);
    } catch (err) {
        setError("Failed to fetch reports.");
        console.error(err);
    } finally {
        setLoadingReports(false);
    }
  }, []);

  useEffect(() => {
    if (view === 'users') {
        fetchAndSetUsers();
    }
    if (view === 'reports') {
        fetchAndSetUsers(); // Also need users for the filter dropdown and author mapping
        fetchAndSetAllReports();
    }
  }, [view, fetchAndSetUsers, fetchAndSetAllReports]);

  // --- User Management Handlers ---
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!newUserDisplayName.trim() || !newUserPassword.trim()) {
      setError("Username and password are required.");
      return;
    }
    try {
      // IMPORTANT: This creates a user profile in Firestore, but NOT an authentication user in Firebase Auth.
      // The new user will NOT be able to log in until an admin manually creates an account for them
      // in the Firebase Authentication console with an email and the chosen password.
      // See README.md for more details.
      await addUser(newUserDisplayName, newUserPassword);
      setNewUserDisplayName('');
      setNewUserPassword('');
      setIsAddingUser(false);
      await fetchAndSetUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to add user.');
    }
  };
  
  const handleInitiateToggleStatus = (user: User) => {
    if (user.email === MASTER_USER_EMAIL) {
      alert("The master user cannot be blocked.");
      return;
    }
    setUserActionPending({ user, action: 'toggleStatus' });
  };
  
  const handleInitiateDelete = (user: User) => {
    if (user.email === MASTER_USER_EMAIL) {
      alert("The master user cannot be deleted.");
      return;
    }
    setUserActionPending({ user, action: 'delete' });
  };

  const handleCancelUserAction = () => {
    setUserActionPending(null);
  };
  
  const handleConfirmUserAction = async () => {
    if (!userActionPending) return;
    
    const { user, action } = userActionPending;
    
    try {
      setError(null);
      if (action === 'toggleStatus') {
        const newStatus = user.status === 'active' ? 'blocked' : 'active';
        await updateUserStatus(user.uid, newStatus);
      } else if (action === 'delete') {
        await deleteUser(user.uid);
      }
      await fetchAndSetUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to perform action.');
    } finally {
      setUserActionPending(null);
    }
  };
  
  // --- Report Search Handlers ---
  const handleResetFilters = () => {
    setSelectedUserIds([]);
    setSelectedDate('');
    setKeyword('');
    setShowSearchResults(false); // Hide results on reset
  };

  const handleSearchClick = () => {
    setShowSearchResults(true); // Show results when search is clicked
  };
  
  const handleUserSelection = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };
  
  const handleSelectAllUsers = () => {
    setSelectedUserIds(allUsers.map(user => user.uid));
  };
  
  const handleDeselectAllUsers = () => {
    setSelectedUserIds([]);
  };

  // --- Filtering Logic ---
  const filteredUsers = allUsers.filter(user => 
    user.displayName?.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  const userMap = useMemo(() => new Map(allUsers.map(user => [user.uid, user])), [allUsers]);

  const filteredReports = useMemo(() => {
    return allReports
      .map(report => ({
        ...report,
        author: userMap.get(report.userId),
      }))
      .filter(report => {
        if (!report.author) return false; // Don't show reports from deleted users

        // User filter
        if (selectedUserIds.length > 0 && !selectedUserIds.includes(report.userId)) {
          return false;
        }

        // Date filter (based on report title content)
        if (selectedDate) { // selectedDate is 'YYYY-MM-DD'
          const titleLine = report.content.split('\n')[0].trim();
          const dateMatch = titleLine.match(/(\d{2})\/(\d{2})\/(\d{4})/);

          if (dateMatch) {
            const [_, day, month, year] = dateMatch;
            const reportDateString = `${year}-${month}-${day}`; // Format as YYYY-MM-DD
            if (selectedDate !== reportDateString) {
              return false;
            }
          } else {
            // If the report title doesn't have a date in the expected format,
            // it shouldn't match any date filter.
            return false;
          }
        }

        // Keyword filter
        if (keyword.trim() !== '' && !report.content.toLowerCase().includes(keyword.toLowerCase())) {
          return false;
        }
        
        return true; // Pass all filters
      });
  }, [allReports, userMap, selectedUserIds, selectedDate, keyword]);


  // --- Render Methods ---
  const renderUserManagement = () => (
    <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
            <h2 className="text-2xl font-semibold">Gestisci Utenti</h2>
            <button
              onClick={() => { setIsAddingUser(!isAddingUser); setError(null); }}
              className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700"
            >
              {isAddingUser ? 'Annulla' : '+ Aggiungi Utente'}
            </button>
        </div>

        {isAddingUser && (
          <form onSubmit={handleAddUser} className="p-4 mb-4 border bg-slate-50 rounded-md">
            <h3 className="font-semibold mb-2">Nuovo Utente</h3>
            {error && <p className="text-red-500 bg-red-100 p-2 rounded-md mb-2">{error}</p>}
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Nome Utente"
                value={newUserDisplayName}
                onChange={(e) => setNewUserDisplayName(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
              />
              <input
                type="password"
                placeholder="Password"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
              />
              <button type="submit" className="w-full px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700">
                Salva Utente
              </button>
            </div>
          </form>
        )}

        <div className="mb-4">
            <input
                type="text"
                placeholder="Cerca utente per nome..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            />
        </div>

        {loadingUsers ? <Spinner /> : 
            <UserList 
                users={filteredUsers} 
                onInitiateToggleStatus={handleInitiateToggleStatus}
                onInitiateDeleteUser={handleInitiateDelete}
                pendingAction={userActionPending}
                onConfirmAction={handleConfirmUserAction}
                onCancelAction={handleCancelUserAction}
            />
        }
    </div>
  );

  const renderReportSearch = () => (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Cerca Report</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 border rounded-md bg-slate-50">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Utente</label>
          <div className="flex gap-2 mb-2">
            <button 
                onClick={handleSelectAllUsers}
                className="px-3 py-1 text-xs font-medium rounded-md bg-sky-100 text-sky-800 hover:bg-sky-200"
            >
                Seleziona tutti
            </button>
            <button 
                onClick={handleDeselectAllUsers}
                className="px-3 py-1 text-xs font-medium rounded-md bg-slate-200 text-slate-800 hover:bg-slate-300"
            >
                Deseleziona tutti
            </button>
          </div>
          <div className="border border-gray-300 rounded-md h-32 overflow-y-auto bg-white">
            {allUsers.map(user => {
              const isSelected = selectedUserIds.includes(user.uid);
              return (
                <div
                  key={user.uid}
                  onClick={() => handleUserSelection(user.uid)}
                  className={`cursor-pointer p-2 text-sm border-b border-slate-100 last:border-b-0 ${
                    isSelected 
                    ? 'bg-green-200 text-green-900 font-medium' 
                    : 'hover:bg-slate-100'
                  }`}
                >
                  {user.displayName}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <label htmlFor="date-select" className="block text-sm font-medium text-gray-700 mb-1">Data Report</label>
          <input
            type="date"
            id="date-select"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="keyword-search" className="block text-sm font-medium text-gray-700 mb-1">Parola Chiave</label>
          <input
            type="text"
            id="keyword-search"
            placeholder="Cerca nel testo..."
            value={keyword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setKeyword(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          />
        </div>
      </div>
      <div className="flex justify-end items-center gap-2 mb-4">
        <button
            onClick={handleResetFilters}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-200 rounded-md hover:bg-slate-300"
        >
            Reset Filtri
        </button>
        <button
            onClick={handleSearchClick}
            className="px-6 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700"
        >
            Cerca
        </button>
      </div>
      
      {showSearchResults && (
        <div className="border-t pt-4 mt-4">
            <h3 className="text-xl font-semibold mb-4">Risultati della Ricerca</h3>
            {loadingReports ? <Spinner /> : <ReportList reports={filteredReports} />}
        </div>
      )}
    </div>
  );

  const renderMenu = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <button
            onClick={() => setView('users')}
            className="flex flex-col items-center justify-center p-8 bg-sky-500 text-white rounded-xl shadow-lg hover:bg-sky-600 transition-transform transform hover:scale-105"
        >
            <span className="text-4xl mb-2">👥</span>
            <span className="text-xl font-bold">Gestisci Utenti</span>
        </button>
        <button
            onClick={() => setView('reports')}
            className="flex flex-col items-center justify-center p-8 bg-slate-700 text-white rounded-xl shadow-lg hover:bg-slate-800 transition-transform transform hover:scale-105"
        >
            <span className="text-4xl mb-2">🔍</span>
            <span className="text-xl font-bold">Cerca Report</span>
        </button>
    </div>
  );

  const renderContent = () => {
    switch(view) {
        case 'users':
            return (
                <div>
                    <button onClick={() => setView('menu')} className="mb-4 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-200 rounded-md hover:bg-slate-300">&larr; Indietro</button>
                    {renderUserManagement()}
                </div>
            );
        case 'reports':
            return (
                <div>
                    <button onClick={() => setView('menu')} className="mb-4 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-200 rounded-md hover:bg-slate-300">&larr; Indietro</button>
                    {renderReportSearch()}
                </div>
            );
        case 'menu':
        default:
            return renderMenu();
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-800 mb-6">Master Dashboard</h1>
        {renderContent()}
    </div>
  );
};

export default AdminDashboard;