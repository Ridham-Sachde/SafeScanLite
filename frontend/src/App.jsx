import { useState } from 'react';
import axios from 'axios';
import { Scanner } from '@yudiel/react-qr-scanner';
import './App.css';

// ----------------------------------------------------------------------
// 🔧 CONFIGURATION
// If testing on a phone, replace 'localhost' with your PC's IP address
// Example: const API_BASE = 'http://192.168.1.15:5000';
// ----------------------------------------------------------------------
// const API_BASE = 'http://127.0.0.1:5000'; 
// Change 'http' to 'https'
// Replace 192.168.x.x with your actual computer's IP address
const API_BASE = 'https://192.168.1.5:5000';

function App() {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'camera'
  const [file, setFile] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scanError, setScanError] = useState('');

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
      <div className={`card ${loading ? 'scanning' : ''}`}>
        
        {/* Laser Scan Animation */}
        <div className="scan-line"></div> 

        <h1>🛡️ Safe-Scan <span style={{color: 'var(--primary)'}}>Lite</span></h1>
        
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
            <input 
              type="file" 
              accept=".png, .jpg, .jpeg, .gif" 
              onChange={handleFileChange} 
            />
            <button 
              onClick={handleFileUploadScan} 
              disabled={loading || !file}
              className="scan-btn"
            >
              {loading ? 'ANALYZING...' : 'EXECUTE FILE SCAN'}
            </button>
          </div>
        )}

        {/* Camera View */}
        {activeTab === 'camera' && (
          <div className="camera-section fade-in">
            {scanError && <div className="error-msg" style={{marginBottom: '10px'}}>{scanError}</div>}
            
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
                  facingMode: 'environment' // Use back camera
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
        {error && <div className="error-msg">⚠️ {error}</div>}

        {/* Results Display */}
        {report && (
          <div className="result-section">
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
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;