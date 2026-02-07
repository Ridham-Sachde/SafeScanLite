import { useState } from 'react';
import axios from 'axios';
import { Scanner } from '@yudiel/react-qr-scanner';
import './App.css';

// ⚠️ CHANGE BACK TO HTTP LOCALHOST
const API_BASE = 'http://127.0.0.1:5000'; 

function App() {
  const [activeTab, setActiveTab] = useState('upload');
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
      // Better error message
      setError(err.response?.data?.error || "Connection Failed. Ensure Backend is running on Port 5000.");
    } finally {
      setLoading(false);
    }
  };

  const handleCameraScan = async (detectedCodes) => {
    if (detectedCodes && detectedCodes.length > 0) {
      const code = detectedCodes[0].rawValue;
      if (loading) return;
      
      setLoading(true);
      setScanError('');

      try {
        const response = await axios.post(`${API_BASE}/analyze`, { url: code });
        setReport(response.data);
      } catch (err) {
        console.error(err);
        setScanError("Backend analysis failed.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="app-container">
      <div className={`card ${loading ? 'scanning' : ''}`}>
        <div className="scan-line"></div> 

        <h1>🛡️ Safe-Scan <span style={{color: 'var(--primary)'}}>Lite</span></h1>
        
        <div className="tab-container">
          <button className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`} onClick={() => setActiveTab('upload')}>
            📂 Upload
          </button>
          <button className={`tab-btn ${activeTab === 'camera' ? 'active' : ''}`} onClick={() => setActiveTab('camera')}>
            📸 Camera
          </button>
        </div>

        {activeTab === 'upload' && (
          <div className="upload-section fade-in">
            <input type="file" accept="image/*" onChange={handleFileChange} />
            <button onClick={handleFileUploadScan} disabled={loading || !file} className="scan-btn">
              {loading ? 'ANALYZING...' : 'EXECUTE FILE SCAN'}
            </button>
          </div>
        )}

        {activeTab === 'camera' && (
          <div className="camera-section fade-in">
            {scanError && <div className="error-msg">{scanError}</div>}
            <div className="scanner-wrapper">
              <Scanner 
                onScan={handleCameraScan}
                onError={(err) => console.log(err)}
                styles={{ container: { width: '100%', aspectRatio: '1/1' } }}
              />
            </div>
          </div>
        )}

        {error && <div className="error-msg">⚠️ {error}</div>}

        {report && (
          <div className="result-section">
            <div className="status-badge" style={{ backgroundColor: report.color }}>{report.status}</div>
            <div className="url-box"><strong>URL:</strong> {report.url}</div>
            <div className="warnings-box">
              <ul>{report.warnings?.map((w, i) => <li key={i}>{w}</li>)}</ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;