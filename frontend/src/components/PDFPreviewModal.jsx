import React from 'react';
import { X, FileText, Download } from 'lucide-react';

export default function PDFPreviewModal({ document, onClose, onDownload }) {
  if (!document) return null;

  // Static url for previewing the PDF
  const previewUrl = `http://localhost:5000/uploads/${document.filename}`;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(8px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      animation: 'fadeIn 0.25s ease-out'
    }}>
      <div 
        className="glass-card" 
        style={{
          width: '100%',
          maxWidth: '1000px',
          height: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '2px solid var(--border-color)',
          boxShadow: 'var(--shadow-lg)',
          transform: 'none' // disable list item translates
        }}
      >
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 24px',
          borderBottom: '2px solid var(--border-color)',
          background: '#ffffff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              background: 'rgba(79, 70, 229, 0.08)',
              color: 'var(--color-primary)',
              padding: '8px',
              borderRadius: '8px',
              display: 'flex'
            }}>
              <FileText size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                {document.title}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Course: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{document.course}</span> &bull; Uploaded by {document.uploaderName}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button 
              onClick={() => onDownload(document)}
              className="btn btn-secondary"
              style={{
                padding: '8px 14px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Download size={14} />
              <span>Download</span>
            </button>
            
            <button 
              onClick={onClose}
              style={{
                background: 'rgba(0, 0, 0, 0.05)',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all var(--transition-fast)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                e.currentTarget.style.color = 'var(--color-danger)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
              title="Close Preview"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Content - PDF Viewer */}
        <div style={{ flex: 1, background: '#1e293b', position: 'relative' }}>
          <iframe 
            src={`${previewUrl}#toolbar=1`}
            title={document.title}
            width="100%"
            height="100%"
            style={{ border: 'none' }}
          >
            <div style={{
              padding: '40px',
              textAlign: 'center',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-sans)'
            }}>
              <p>Your browser does not support inline PDFs.</p>
              <a href={previewUrl} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ marginTop: '20px' }}>
                View PDF in New Tab
              </a>
            </div>
          </iframe>
        </div>
      </div>
    </div>
  );
}
