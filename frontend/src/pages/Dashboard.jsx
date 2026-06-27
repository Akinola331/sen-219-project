import React, { useState, useEffect } from 'react';
import {
  Upload, FileText, Trash2, Download, Eye, Search, Filter,
  BookOpen, Plus, Info, RefreshCw, BarChart2, Calendar, HardDrive
} from 'lucide-react';
import PDFPreviewModal from '../components/PDFPreviewModal';

export default function Dashboard({ user, token, apiBase }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filter (Students)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('All');

  // Preview Modal State
  const [previewDoc, setPreviewDoc] = useState(null);

  // Upload Form State (Lecturers)
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadCourse, setUploadCourse] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  // Drag and drop state
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await fetch(`${apiBase}/documents`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      } else {
        console.error('Failed to fetch documents');
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Format File Size
  const formatBytes = (bytes, decimals = 2) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Format Date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Download logic (auth compatible)
  const handleDownload = async (doc) => {
    try {
      const res = await fetch(`${apiBase}/documents/download/${doc.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error('Download failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.originalName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      // Instantly update stats locally
      setDocuments(prev =>
        prev.map(d => d.id === doc.id ? { ...d, downloadCount: (d.downloadCount || 0) + 1 } : d)
      );
    } catch (err) {
      console.error('Error downloading document:', err);
      alert('Failed to download the document. Please try again.');
    }
  };

  // Lecturer upload file selection
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        setUploadFile(file);
        setUploadError('');
      } else {
        setUploadError('Only PDF files are supported.');
        setUploadFile(null);
      }
    }
  };

  // Drag-and-drop file upload handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        setUploadFile(file);
        setUploadError('');
      } else {
        setUploadError('Only PDF files are supported.');
        setUploadFile(null);
      }
    }
  };

  // Lecturer Upload Document Submission
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setUploadError('');
    setUploadSuccess('');

    if (!uploadTitle.trim() || !uploadCourse.trim() || !uploadFile) {
      setUploadError('Please fill in all fields and select a PDF file.');
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append('pdf', uploadFile);
    formData.append('title', uploadTitle);
    formData.append('description', uploadDescription);
    formData.append('course', uploadCourse);

    try {
      const res = await fetch(`${apiBase}/documents/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();

      if (res.ok) {
        setUploadSuccess('Document uploaded successfully!');
        // Reset fields
        setUploadTitle('');
        setUploadDescription('');
        setUploadCourse('');
        setUploadFile(null);
        // Refresh listings
        fetchDocuments(true);
      } else {
        setUploadError(data.message || 'Error occurred during file upload.');
      }
    } catch (err) {
      console.error('Upload request error:', err);
      setUploadError('Unable to upload. Connection to backend failed.');
    } finally {
      setUploading(false);
    }
  };

  // Lecturer Delete Document
  const handleDeleteDoc = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document? This action is permanent.')) {
      return;
    }

    try {
      const res = await fetch(`${apiBase}/documents/${docId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        setDocuments(prev => prev.filter(d => d.id !== docId));
      } else {
        const data = await res.json();
        alert(data.message || 'Could not delete the file.');
      }
    } catch (error) {
      console.error('Delete request error:', error);
      alert('Connection to server failed.');
    }
  };

  // Compute unique courses list for filter (Students only)
  const coursesList = ['All', ...new Set(documents.map(d => d.course))];

  // Filtering Logic for Students
  const filteredDocuments = documents.filter(doc => {
    const matchesCourse = selectedCourse === 'All' || doc.course === selectedCourse;
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.course.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.uploaderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.description && doc.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCourse && matchesSearch;
  });

  return (
    <div className="container" style={{ padding: '40px 24px', flex: 1 }}>

      <div className="glass-card animate-fade-in" style={{
        padding: '30px 40px',
        marginBottom: '40px',
        position: 'relative',
        overflow: 'hidden',
        background: '#ffffff',
        border: '2px solid var(--border-color)',
        boxShadow: 'var(--shadow-md)',
        transform: 'none'
      }}>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <span style={{
            fontSize: '13px',
            textTransform: 'uppercase',
            fontWeight: 800,
            letterSpacing: '0.1em',
            color: 'var(--color-primary)'
          }}>
            Dashboard
          </span>
          <h2 style={{ fontSize: '30px', fontWeight: 800, marginTop: '4px', marginBottom: '8px', color: 'var(--text-primary)' }}>
            Welcome back, {user.name}!
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', maxWidth: '600px' }}>
            {user.role === 'lecturer'
              ? 'Upload your study guides, course lecture notes, and assignments here. Students can securely download or preview them.'
              : 'Browse library archives, preview textbooks or syllabi, and download lecture notes directly onto your device.'}
          </p>
        </div>
        <div style={{
          position: 'absolute',
          right: '5%',
          top: '50%',
          transform: 'translateY(-50%)',
          opacity: 0.1,
          color: 'var(--color-primary)',
          pointerEvents: 'none'
        }}>
          <BookOpen size={120} />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0', gap: '16px' }}>
          <div className="spinner" style={{ width: '32px', height: '32px' }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading documents repository...</p>
        </div>
      ) : (
        <>
          {/* ======================================================== */}
          {/* LECTURER VIEW: UPLOAD FORM & STATS                       */}
          {/* ======================================================== */}
          {user.role === 'lecturer' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '40px',
              alignItems: 'start'
            }} className="grid-responsive">
              <style>{`
                @media(min-width: 900px) {
                  .grid-responsive {
                    grid-template-columns: 380px 1fr !important;
                  }
                }
              `}</style>

              {/* Left Side: Upload Box */}
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Plus size={18} style={{ color: 'var(--color-primary)' }} />
                  <span>Upload Document</span>
                </h3>

                <div className="glass-card" style={{ padding: '24px', transform: 'none' }}>
                  {uploadError && (
                    <div style={{
                      padding: '10px 14px',
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.18)',
                      borderRadius: '8px',
                      color: 'var(--color-danger)',
                      fontSize: '13px',
                      marginBottom: '16px'
                    }}>
                      {uploadError}
                    </div>
                  )}
                  {uploadSuccess && (
                    <div style={{
                      padding: '10px 14px',
                      background: 'rgba(16, 185, 129, 0.08)',
                      border: '1px solid rgba(16, 185, 129, 0.18)',
                      borderRadius: '8px',
                      color: 'var(--color-success)',
                      fontSize: '13px',
                      marginBottom: '16px'
                    }}>
                      {uploadSuccess}
                    </div>
                  )}

                  <form onSubmit={handleUploadSubmit}>
                    <div className="input-group">
                      <label className="input-label">Document Title *</label>
                      <input
                        type="text"
                        placeholder="e.g. Intro to Data Structures - Lecture 1"
                        value={uploadTitle}
                        onChange={(e) => setUploadTitle(e.target.value)}
                        className="text-input"
                        required
                      />
                    </div>

                    <div className="input-group">
                      <label className="input-label">Course / Subject *</label>
                      <input
                        type="text"
                        placeholder="e.g. CSE-219"
                        value={uploadCourse}
                        onChange={(e) => setUploadCourse(e.target.value)}
                        className="text-input"
                        required
                      />
                    </div>

                    <div className="input-group">
                      <label className="input-label">Description (Optional)</label>
                      <textarea
                        placeholder="Provide details about the material content..."
                        value={uploadDescription}
                        onChange={(e) => setUploadDescription(e.target.value)}
                        className="text-input"
                        rows={3}
                        style={{ resize: 'vertical', minHeight: '80px' }}
                      />
                    </div>

                    {/* Drag-and-Drop Dropzone */}
                    <div className="input-group">
                      <label className="input-label">PDF File *</label>
                      <div
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        style={{
                          border: '2px dashed',
                          borderColor: dragActive ? 'var(--color-primary)' : uploadFile ? 'var(--color-success)' : 'var(--border-color)',
                          background: dragActive ? 'rgba(79, 70, 229, 0.05)' : uploadFile ? 'rgba(16, 185, 129, 0.02)' : 'rgba(0, 0, 0, 0.01)',
                          borderRadius: 'var(--radius-md)',
                          padding: '24px 16px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'all var(--transition-normal)'
                        }}
                      >
                        <input
                          type="file"
                          id="file-upload-input"
                          accept=".pdf"
                          onChange={handleFileChange}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            opacity: 0,
                            cursor: 'pointer'
                          }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            background: uploadFile ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0, 0, 0, 0.03)',
                            color: uploadFile ? 'var(--color-success)' : 'var(--text-secondary)',
                            padding: '10px',
                            borderRadius: '50%',
                            display: 'flex'
                          }}>
                            <Upload size={20} />
                          </div>

                          {uploadFile ? (
                            <div>
                              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }}>
                                {uploadFile.name}
                              </p>
                              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                {formatBytes(uploadFile.size)}
                              </p>
                            </div>
                          ) : (
                            <div>
                              <p style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>
                                Drag & drop PDF here
                              </p>
                              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                or click to upload
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={uploading}
                      className="btn btn-primary"
                      style={{ width: '100%', marginTop: '10px' }}
                    >
                      {uploading ? (
                        <div className="spinner"></div>
                      ) : (
                        <>
                          <Upload size={16} />
                          <span>Publish Document</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Side: Lecturer Documents Table */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <HardDrive size={18} style={{ color: 'var(--color-primary)' }} />
                    <span>My Uploaded Materials ({documents.filter(d => d.uploadedBy === user.id).length})</span>
                  </h3>
                  <button
                    onClick={() => fetchDocuments(true)}
                    disabled={refreshing}
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '12px', height: '32px', display: 'flex', gap: '6px' }}
                  >
                    <RefreshCw size={12} className={refreshing ? 'spinner' : ''} />
                    <span>Sync</span>
                  </button>
                </div>

                {documents.filter(d => d.uploadedBy === user.id).length === 0 ? (
                  <div className="glass-card" style={{ padding: '60px 24px', textAlign: 'center', transform: 'none' }}>
                    <FileText size={40} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
                    <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>You haven't uploaded any documents yet.</p>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Fill in the form on the left to upload your first study file.</p>
                  </div>
                ) : (
                  <div className="glass-card" style={{ overflowX: 'auto', padding: '12px', transform: 'none' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          <th style={{ padding: '12px 16px' }}>Document Details</th>
                          <th style={{ padding: '12px 16px' }}>Course</th>
                          <th style={{ padding: '12px 16px' }}>Published</th>
                          <th style={{ padding: '12px 16px', textAlign: 'center' }}>Downloads</th>
                          <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {documents
                          .filter(d => d.uploadedBy === user.id)
                          .map((doc) => (
                            <tr key={doc.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '14px' }}>
                              <td style={{ padding: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                  <div style={{
                                    background: 'rgba(79, 70, 229, 0.08)',
                                    color: 'var(--color-primary)',
                                    padding: '8px',
                                    borderRadius: '8px',
                                    display: 'flex'
                                  }}>
                                    <FileText size={18} />
                                  </div>
                                  <div>
                                    <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{doc.title}</p>
                                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                      {formatBytes(doc.fileSize)} &bull; {doc.originalName}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: '16px' }}>
                                <span style={{
                                  background: 'var(--bg-main)',
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: 500,
                                  color: 'var(--text-secondary)'
                                }}>
                                  {doc.course}
                                </span>
                              </td>
                              <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                                {formatDate(doc.uploadDate)}
                              </td>
                              <td style={{ padding: '16px', textAlign: 'center' }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                  <BarChart2 size={14} style={{ color: 'var(--color-success)' }} />
                                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{doc.downloadCount || 0}</span>
                                </div>
                              </td>
                              <td style={{ padding: '16px', textAlign: 'right' }}>
                                <div style={{ display: 'inline-flex', gap: '8px', justifyContent: 'flex-end' }}>
                                  <button
                                    onClick={() => setPreviewDoc(doc)}
                                    className="btn btn-secondary"
                                    style={{ padding: '6px', borderRadius: '8px', display: 'flex' }}
                                    title="Preview Document"
                                  >
                                    <Eye size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleDownload(doc)}
                                    className="btn btn-secondary"
                                    style={{ padding: '6px', borderRadius: '8px', display: 'flex' }}
                                    title="Download File"
                                  >
                                    <Download size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteDoc(doc.id)}
                                    className="btn btn-danger"
                                    style={{ padding: '6px', borderRadius: '8px', display: 'flex' }}
                                    title="Delete Material"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STUDENT VIEW: DOCUMENTS DIRECTORY                        */}
          {/* ======================================================== */}
          {user.role === 'student' && (
            <div>
              {/* Search & Filters */}
              <div className="glass-card" style={{ padding: '20px 24px', marginBottom: '32px', transform: 'none' }}>
                <div style={{
                  display: 'flex',
                  gap: '20px',
                  alignItems: 'center',
                  flexWrap: 'wrap'
                }}>
                  {/* Search Bar */}
                  <div style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
                    <span style={{
                      position: 'absolute',
                      left: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)',
                      display: 'flex'
                    }}>
                      <Search size={18} />
                    </span>
                    <input
                      type="text"
                      placeholder="Search files by title, lecturer, course codes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="text-input"
                      style={{ width: '100%', paddingLeft: '46px' }}
                    />
                  </div>

                  {/* Course Dropdown */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ display: 'flex', color: 'var(--text-secondary)', gap: '6px', fontSize: '14px', fontWeight: 500 }}>
                      <Filter size={16} />
                      <span>Filter Course:</span>
                    </span>
                    <select
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                      style={{
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                        padding: '10px 16px',
                        borderRadius: '12px',
                        outline: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontFamily: 'var(--font-sans)',
                        transition: 'border-color var(--transition-fast)'
                      }}
                    >
                      {coursesList.map((course) => (
                        <option key={course} value={course}>{course}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => fetchDocuments(true)}
                    disabled={refreshing}
                    className="btn btn-secondary"
                    style={{ padding: '10px 16px', fontSize: '14px', display: 'flex', gap: '8px' }}
                  >
                    <RefreshCw size={14} className={refreshing ? 'spinner' : ''} />
                    <span>Sync Library</span>
                  </button>
                </div>
              </div>

              {/* Grid of Materials */}
              {filteredDocuments.length === 0 ? (
                <div className="glass-card" style={{ padding: '80px 24px', textAlign: 'center', transform: 'none' }}>
                  <FileText size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
                  <p style={{ fontSize: '16px', color: 'var(--text-secondary)', fontWeight: 600 }}>No documents match your query.</p>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>Try tweaking your search term or select another course filter.</p>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '24px'
                }}>
                  {filteredDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="glass-card"
                      style={{
                        padding: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minHeight: '220px'
                      }}
                    >
                      <div>
                        {/* Course code & size */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <span style={{
                            background: 'rgba(79, 70, 229, 0.08)',
                            color: 'var(--color-primary)',
                            border: '1px solid rgba(79, 70, 229, 0.15)',
                            padding: '2px 10px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                            textTransform: 'uppercase'
                          }}>
                            {doc.course}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <HardDrive size={11} />
                            {formatBytes(doc.fileSize)}
                          </span>
                        </div>

                        {/* Title */}
                        <h4 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', lineHeight: 1.3 }}>
                          {doc.title}
                        </h4>

                        {/* Description */}
                        {doc.description ? (
                          <p style={{
                            fontSize: '13px',
                            color: 'var(--text-secondary)',
                            marginBottom: '16px',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            lineHeight: 1.4
                          }}>
                            {doc.description}
                          </p>
                        ) : (
                          <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '16px' }}>
                            No description provided.
                          </p>
                        )}
                      </div>

                      {/* Uploader & Actions Footer */}
                      <div style={{
                        borderTop: '1px solid var(--border-color)',
                        paddingTop: '14px',
                        marginTop: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '14px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                          <div style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                            By <span style={{ color: 'var(--text-primary)' }}>{doc.uploaderName}</span>
                          </div>
                          <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={11} />
                            {formatDate(doc.uploadDate)}
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '10px' }}>
                          <button
                            onClick={() => setPreviewDoc(doc)}
                            className="btn btn-secondary"
                            style={{ padding: '8px', fontSize: '13px', display: 'flex', gap: '6px', height: '36px' }}
                          >
                            <Eye size={14} />
                            <span>Preview</span>
                          </button>

                          <button
                            onClick={() => handleDownload(doc)}
                            className="btn btn-primary"
                            style={{
                              padding: '8px',
                              fontSize: '13px',
                              display: 'flex',
                              gap: '6px',
                              height: '36px',
                              background: 'var(--grad-brand)',
                              boxShadow: '0 4px 10px rgba(79, 70, 229, 0.2)'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.filter = 'none'}
                          >
                            <Download size={14} />
                            <span>Download</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Embedded PDF Preview Modal */}
      {previewDoc && (
        <PDFPreviewModal
          document={previewDoc}
          onClose={() => setPreviewDoc(null)}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
}
