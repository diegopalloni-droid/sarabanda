

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Report } from '../types';
import { addReport, getReportsForUser, updateReport, deleteReport } from '../services/firestoreService';
import ReportForm from './ReportForm';
import ReportList from './ReportList';
import Spinner from './Spinner';

type View = 'menu' | 'create' | 'view' | 'edit';

// Helper to extract the title (first line) from report content
const getTitleFromContent = (content: string) => {
  return content.split('\n')[0].trim();
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>('menu');
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [reportToDelete, setReportToDelete] = useState<Report | null>(null); // State for delete confirmation

  const fetchReports = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const userReports = await getReportsForUser(user.uid);
      setReports(userReports);
    } catch (err) {
      setError('Failed to fetch reports.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Fetch reports only when the user wants to view them
    if (view === 'view') {
      fetchReports();
    }
  }, [view, fetchReports]);

  // Renamed for clarity
  const getNewReportInitialContent = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const year = today.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;

    // Plain text template with newline characters.
    const template = `Report del ${formattedDate}\n\nVisita n°1: Ore xx.xx- . Az Agricola.Località. Visita Periodica/Prima visita\n\nRiassunto visita: \n\nObiettivo prox visita :\n\nProx visita entro: `;
    return template;
  };

  const handleSaveReport = async (content: string) => {
    if (!user) return;
    try {
        setError(null);
        const newTitle = getTitleFromContent(content);
        // We fetch the latest reports here to ensure our check is up-to-date
        const allUserReports = await getReportsForUser(user.uid);
        const existingReport = allUserReports.find(r => getTitleFromContent(r.content) === newTitle);

        if (existingReport) {
            const datePart = newTitle.replace('Report del ', '');
            setError(
              `Impossibile salvare. Un report con la data "${datePart}" esiste già. Scegliere una data diversa.`
            );
            return; // Stop the save process
        }

        await addReport(user.uid, content);
        setView('view'); // Switch to view after successful save
    } catch (err) {
        setError('Failed to save report.');
        console.error(err);
    }
  };

  const handleStartEdit = (report: Report) => {
    setError(null); // Clear errors when starting an edit
    setEditingReport(report);
    setView('edit');
  };

  const handleUpdateReport = async (content: string) => {
    if (!user || !editingReport) return;
    
    try {
      setError(null);
      const updatedTitle = getTitleFromContent(content);
      // We fetch the latest reports here to ensure our check is up-to-date
      const allUserReports = await getReportsForUser(user.uid);
      const conflictingReport = allUserReports.find(
        r => getTitleFromContent(r.content) === updatedTitle && r.id !== editingReport.id
      );
  
      if (conflictingReport) {
        setError(`Impossibile aggiornare. Un altro report esiste già con il titolo "${updatedTitle}".`);
        return; // Stop the update
      }

      await updateReport(editingReport.id, content);
      setEditingReport(null);
      setView('view');
    } catch (err) {
      setError('Failed to update report.');
      console.error(err);
    }
  };
  
  // Initiates the delete process by setting the report to be confirmed
  const handleInitiateDelete = (report: Report) => {
    setReportToDelete(report);
  };

  // Cancels the delete process
  const handleCancelDelete = () => {
    setReportToDelete(null);
  };
  
  // Confirms and executes the deletion
  const handleConfirmDelete = async () => {
    if (!user || !reportToDelete) return;

    try {
      setError(null);
      await deleteReport(reportToDelete.id);
      
      // Update UI state directly for an immediate and reliable response
      setReports(currentReports =>
        currentReports.filter(report => report.id !== reportToDelete.id)
      );
      
      setReportToDelete(null); // Reset confirmation state

    } catch (err) {
      setError('Failed to delete report.');
      console.error(err);
      setReportToDelete(null); // Reset on error as well
    }
  };

  const displayName = user?.displayName || user?.email || 'User';

  const renderContent = () => {
    switch (view) {
      case 'create':
        return (
          <div>
             <button
              onClick={() => { setView('menu'); setError(null); }}
              className="mb-4 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-200 rounded-md hover:bg-slate-300"
            >
              &larr; Indietro
            </button>
            <div className="bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-2xl font-semibold mb-4">Crea Nuovo Report</h2>
                {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</p>}
                <ReportForm
                  onSave={handleSaveReport}
                  initialContent={getNewReportInitialContent()}
                  submitButtonText="Salva Report"
                />
            </div>
          </div>
        );
      case 'edit':
        return (
          <div>
            <button
              onClick={() => { setView('view'); setError(null); }}
              className="mb-4 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-200 rounded-md hover:bg-slate-300"
            >
              &larr; Annulla
            </button>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h2 className="text-2xl font-semibold mb-4">Modifica Report</h2>
              {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</p>}
              <ReportForm
                onSave={handleUpdateReport}
                initialContent={editingReport?.content || ''}
                submitButtonText="Aggiorna Report"
              />
            </div>
          </div>
        );
      case 'view':
        return (
          <div>
            <button
              onClick={() => { setView('menu'); setError(null); }}
              className="mb-4 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-200 rounded-md hover:bg-slate-300"
            >
              &larr; Indietro
            </button>
            <div className="bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-2xl font-semibold mb-4">I Tuoi Report Salvati</h2>
                {error && <p className="text-red-500 bg-red-100 p-3 rounded-md">{error}</p>}
                {loading ? <Spinner /> : 
                  <ReportList 
                    reports={reports} 
                    onEdit={handleStartEdit} 
                    onDelete={handleInitiateDelete}
                    reportPendingDeletion={reportToDelete}
                    onConfirmDelete={handleConfirmDelete}
                    onCancelDelete={handleCancelDelete}
                  />
                }
            </div>
          </div>
        );
      case 'menu':
      default:
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <button
                    onClick={() => { setView('create'); setError(null); }}
                    className="flex flex-col items-center justify-center p-8 bg-sky-500 text-white rounded-xl shadow-lg hover:bg-sky-600 transition-transform transform hover:scale-105"
                >
                    <span className="text-4xl mb-2">📝</span>
                    <span className="text-xl font-bold">Crea Nuovo Report</span>
                </button>
                <button
                    onClick={() => { setView('view'); setError(null); }}
                    className="flex flex-col items-center justify-center p-8 bg-slate-700 text-white rounded-xl shadow-lg hover:bg-slate-800 transition-transform transform hover:scale-105"
                >
                    <span className="text-4xl mb-2">📂</span>
                    <span className="text-xl font-bold">Visualizza Report Salvati</span>
                </button>
            </div>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Benvenuto, {displayName}!</h1>
      <p className="text-slate-600">Cosa vuoi fare oggi?</p>
      <div className="mt-6">
        {renderContent()}
      </div>
    </div>
  );
};

export default Dashboard;