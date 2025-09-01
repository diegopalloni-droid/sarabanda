
import React, { useState, useEffect } from 'react';

interface ReportFormProps {
  onSave: (content: string) => Promise<void>;
  initialContent?: string;
  submitButtonText?: string;
}

const ReportForm: React.FC<ReportFormProps> = ({ onSave, initialContent = '', submitButtonText = 'Save Report' }) => {
  const [content, setContent] = useState(initialContent);
  const [loading, setLoading] = useState(false);

  // When the initialContent prop changes (e.g., when editing a different report),
  // update the state to reflect the new content.
  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    setLoading(true);
    await onSave(content);
    setLoading(false);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Scrivi qui il tuo report..."
        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        rows={15}
      />
      <button
        type="submit"
        disabled={loading || !content.trim()}
        className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-sky-300"
      >
        {loading ? 'Saving...' : submitButtonText}
      </button>
    </form>
  );
};

export default ReportForm;
