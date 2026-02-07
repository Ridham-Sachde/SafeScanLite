import { useState, useEffect } from 'react';
import axios from 'axios';
import { Scanner } from '@yudiel/react-qr-scanner';
import './App.css';

// ----------------------------------------------------------------------
// 🔧 CONFIGURATION
// ----------------------------------------------------------------------
const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:5000';
// NOTE: For mobile testing, use your local IP (e.g., 'http://192.168.1.5:5000') 
// and ensure you are on the same network. HTTPS is required for camera on mobile web.

function App() {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'camera'
  const [file, setFile] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scanError, setScanError] = useState('');
  
  // New State for Theme and Modal
  const [theme, setTheme] = useState('dark');
  const [showAbout, setShowAbout] = useState(false);

  // Apply theme to body
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setReport(null);
    setError('');
  };

  // 1. Handle File Upload (Calls /scan)
  const handleFileUploadScan = async () => {
    if (!file) {
      setError("Please select an image first.");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    setError('');
    setReport(null);

    try {
      const response = await axios.post(`${API_BASE}/scan`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setReport(response.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Connection Failed. Is Backend running?");
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Camera Scan (Calls /analyze)
  const handleCameraScan = async (detectedCodes) => {
    if (detectedCodes && detectedCodes.length > 0) {
      const code = detectedCodes[0].rawValue;
      
      if (loading) return; // Prevent double submission
      
      setLoading(true);
      setScanError('');

      try {
        const response = await axios.post(`${API_BASE}/analyze`, {
          url: code
        });
        setReport(response.data);
        // Optional: Switch to upload tab to stop camera and show result
        // setActiveTab('upload');
      } catch (err) {
        console.error(err);
        setScanError("Scanned successfully, but server analysis failed.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCameraError = (err) => {
    console.error(err);
    setScanError("Camera Error: Permission denied or insecure context (HTTP).");
  };

  return (
    <div className="app-container">
      
      {/* Header Controls */}
      <div className="header-controls slide-down">
        <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle Theme">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <button className="icon-btn" onClick={() => setShowAbout(true)} aria-label="About Us">
          ℹ️
        </button>
      </div>

      <div className={`card ${loading ? 'scanning' : ''} pop-in`}>
        
        {/* Laser Scan Animation */}
        <div className="scan-line"></div> 

        <h1 className="title-animate">🛡️ Safe-Scan <span style={{color: 'var(--primary)'}}>Lite</span></h1>
        
        {/* Tab Switcher */}
        <div className="tab-container">
          <button 
            className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => { setActiveTab('upload'); setReport(null); setError(''); }}
          >
            📂 Upload Image
          </button>
          <button 
            className={`tab-btn ${activeTab === 'camera' ? 'active' : ''}`}
            onClick={() => { setActiveTab('camera'); setReport(null); setError(''); }}
          >
            📸 Live Camera
          </button>
        </div>

        {/* Upload View */}
        {activeTab === 'upload' && (
          <div className="upload-section fade-in">
            <div className="file-input-wrapper">
              <input 
                type="file" 
                accept=".png, .jpg, .jpeg, .gif" 
                onChange={handleFileChange} 
                id="file-upload"
              />
              <label htmlFor="file-upload" className="file-label">
                {file ? file.name : "Choose an Image..."}
              </label>
            </div>
            
            <button 
              onClick={handleFileUploadScan} 
              disabled={loading || !file}
              className="scan-btn pulse-on-hover"
            >
              {loading ? 'ANALYZING...' : 'EXECUTE FILE SCAN'}
            </button>
          </div>
        )}

        {/* Camera View */}
        {activeTab === 'camera' && (
          <div className="camera-section fade-in">
            {scanError && <div className="error-msg wobble" style={{marginBottom: '10px'}}>{scanError}</div>}
            
            <div className="scanner-wrapper">
              <Scanner 
                onScan={handleCameraScan}
                onError={handleCameraError}
                components={{
                  audio: false,
                  torch: true,
                  finder: true
                }}
                constraints={{
                  facingMode: 'environment' 
                }}
                styles={{
                   container: { width: '100%', aspectRatio: '1/1' }
                }}
              />
            </div>
            <p className="camera-hint">Point your camera at a QR code</p>
          </div>
        )}

        {/* Main Error Display */}
        {error && <div className="error-msg wobble">⚠️ {error}</div>}

        {/* Results Display */}
        {report && (
          <div className="result-section slide-up">
            <div 
              className="status-badge" 
              style={{ backgroundColor: report.color }}
            >
              {report.status}
            </div>
            
            <div className="url-box">
              <strong>Decoded Data:</strong>
              <p>{report.url}</p>
            </div>

            <div className="warnings-box">
              <h4>Security Analysis:</h4>
              <ul>
                {report.warnings?.map((warning, index) => (
                  <li key={index} style={{animationDelay: `${index * 0.1}s`}} className="list-item-animate">
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* About Us Modal */}
      {showAbout && (
        <div className="modal-overlay fade-in" onClick={() => setShowAbout(false)}>
          <div className="modal-content pop-in" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowAbout(false)}>×</button>
            <h2>🚀 About Us</h2>
            <div className="team-info">
              <h3>Team: <span className="highlight">Logically Prompted</span></h3>
              <div className="member-card">
                <span className="role">Member 1</span>
                <p>25BCE523 Radha Popat</p>
              </div>
              <div className="member-card">
                <span className="role">Member 2</span>
                <p>25BCE526 Ridham Sachde</p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;