// test changes in git
import { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setReport(null);
    setError('');
  };

  const handleScan = async () => {
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
      const response = await axios.post('http://127.0.0.1:5000/scan', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setReport(response.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* Add the 'scanning' class when loading is true */}
    <div className={`card ${loading ? 'scanning' : ''}`}>
      
      {/* The Laser Scan Line */}
      <div className="scan-line"></div> 

      <h1>🛡️ Safe-Scan <span style={{color: 'var(--primary)'}}>Lite</span></h1>
      <p className="subtitle">System Ready // Upload QR Target</p>

      <div className="upload-section">
        <input 
          type="file" 
          accept=".png, .jpg, .jpeg, .gif" 
          onChange={handleFileChange} 
        />
        <button 
          onClick={handleScan} 
          disabled={loading || !file}
          className="scan-btn"
        >
          {loading ? 'INITIALIZING SCAN...' : 'EXECUTE SCAN'}
        </button>
      </div>

      {error && <div className="error-msg">⚠️ {error}</div>}

        {report && (
          <div className="result-section">
            <div 
              className="status-badge" 
              style={{ backgroundColor: report.color }}
            >
              {report.status}
            </div>
            
            <div className="url-box">
              <strong>Decoded URL:</strong>
              <p>{report.url}</p>
            </div>

            <div className="warnings-box">
              <h4>Security Analysis:</h4>
              <ul>
                {/* Optional chaining used here as requested */}
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