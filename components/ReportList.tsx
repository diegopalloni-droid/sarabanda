import React from 'react';
import { Report, User } from '../types';
import { Document, Packer, Paragraph, TextRun } from 'docx';

interface ReportListProps {
  reports: (Report & { author?: User })[]; // Allow passing author info
  onEdit?: (report: Report) => void;
  onDelete?: (report: Report) => void;
  reportPendingDeletion?: Report | null;
  onConfirmDelete?: () => void;
  onCancelDelete?: () => void;
}

const ReportList: React.FC<ReportListProps> = ({ 
  reports, 
  onEdit, 
  onDelete, 
  reportPendingDeletion,
  onConfirmDelete,
  onCancelDelete
}) => {
  const getFilenameFromContent = (content: string): string => {
    const titleLine = content.split('\n')[0].trim();

    // Regex to find a date in DD/MM/YYYY format from the title line.
    const dateMatch = titleLine.match(/(\d{2})\/(\d{2})\/(\d{4})/);

    if (dateMatch && dateMatch[0]) {
      // The matched date is "DD/MM/YYYY". Replace slashes with dashes.
      const formattedDate = dateMatch[0].replace(/\//g, '-');
      return `${formattedDate}.docx`;
    }

    // Fallback if the specific date format is not found.
    // Provides a generic name with the current date.
    const fallbackDate = new Date().toISOString().split('T')[0];
    return `report-${fallbackDate}.docx`;
  };

  const handleDownload = (report: Report) => {
    const doc = new Document({
      styles: {
        default: {
          document: {
            run: {
              size: 22, // 11pt font size (22 half-points)
              font: 'Calibri',
            },
          },
        },
      },
      sections: [
        {
          children: report.content.split('\n').map((line) => {
            const colonIndex = line.indexOf(':');

            // Case 1: Line contains a colon.
            // Split into a bold part (label) and a regular part (user input).
            if (colonIndex !== -1) {
              const label = line.substring(0, colonIndex + 1);
              const value = line.substring(colonIndex + 1);
              return new Paragraph({
                children: [
                  new TextRun({
                    text: label,
                    bold: true,
                  }),
                  new TextRun({
                    text: value,
                    // bold: false is the default
                  }),
                ],
              });
            }

            // Case 2: Line does NOT contain a colon.
            // Check if it's the main title line to make it bold.
            // Otherwise, it's regular text (like an empty line or additional notes).
            const isTitleLine = line.trim().startsWith('Report del');
            return new Paragraph({
              children: [
                new TextRun({
                  text: line,
                  bold: isTitleLine,
                }),
              ],
            });
          }),
        },
      ],
    });

    Packer.toBlob(doc).then(blob => {
      const filename = getFilenameFromContent(report.content);
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  if (reports.length === 0) {
    return <p className="text-slate-500">No reports found.</p>;
  }

  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
      {reports.map((report) => {
        const isPendingDeletion = reportPendingDeletion?.id === report.id;

        return(
          <div key={report.id} className={`p-4 border rounded-lg transition-colors ${isPendingDeletion ? 'bg-red-50 border-red-200' : 'border-slate-200 bg-slate-50'}`}>
            {report.author && (
                <div className="mb-2 pb-2 border-b border-slate-200">
                    <p className="text-sm font-semibold text-slate-700">
                        Autore: {report.author.displayName}
                    </p>
                    <p className="text-xs text-slate-500">
                        {report.author.email}
                    </p>
                </div>
            )}
            <div className="flex justify-end items-center mb-2">
              <div className="flex items-center space-x-2">
                
                {isPendingDeletion ? (
                  <>
                    <button
                      onClick={onConfirmDelete}
                      className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded-full hover:bg-red-700"
                    >
                      Conferma
                    </button>
                    <button
                      onClick={onCancelDelete}
                      className="px-3 py-1 text-xs font-medium text-slate-700 bg-slate-200 rounded-full hover:bg-slate-300"
                    >
                      Annulla
                    </button>
                  </>
                ) : (
                  <>
                    {onEdit && (
                      <button
                        onClick={() => onEdit(report)}
                        className="px-3 py-1 text-xs font-medium text-amber-700 bg-amber-100 rounded-full hover:bg-amber-200"
                      >
                        Modifica
                      </button>
                    )}
                    <button
                      onClick={() => handleDownload(report)}
                      className="px-3 py-1 text-xs font-medium text-sky-700 bg-sky-100 rounded-full hover:bg-sky-200"
                    >
                      Download
                    </button>
                    {onDelete && (
                      <button
                        onClick={() => onDelete(report)}
                        className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full hover:bg-red-200"
                      >
                        Elimina
                      </button>
                    )}
                  </>
                )}

              </div>
            </div>
            <div className="text-sm text-slate-800 whitespace-pre-wrap">
              {report.content}
            </div>
          </div>
        )
      })}
    </div>
  );
};

export default ReportList;