import os
import sys
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from PIL import Image
from urllib.parse import urlparse

# --- Safe Imports for Scanner Libraries ---
try:
    import cv2
    OPENCV_AVAILABLE = True
except ImportError:
    OPENCV_AVAILABLE = False
    print("⚠️ Warning: OpenCV not installed. Fallback scanning disabled.")

try:
    from pyzbar.pyzbar import decode as pyzbar_decode
    PYZBAR_AVAILABLE = True
except ImportError:
    PYZBAR_AVAILABLE = False
    print("⚠️ Warning: Pyzbar not installed. Primary scanning disabled.")

app = Flask(__name__)
CORS(app)  # Allow React to talk to Flask

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def analyze_threat_level(url):
    """Analyzes URL for security risks."""
    score = 0
    warnings = []
    url = str(url).strip()
    parsed_url = urlparse(url)
    domain = parsed_url.netloc.lower()
    
    if parsed_url.scheme != 'https':
        score += 5
        warnings.append("Insecure Protocol: URL uses HTTP instead of HTTPS.")

    risky_tlds = ['.xyz', '.top', '.gq', '.zip']
    if any(domain.endswith(tld) for tld in risky_tlds):
        score += 3
        warnings.append(f"Suspicious Domain: Ends in a high-risk TLD ({domain.split('.')[-1]}).")

    phishing_keywords = ['login', 'secure', 'verify', 'update', 'account']
    if any(keyword in url.lower() for keyword in phishing_keywords):
        score += 2
        warnings.append("Phishing Risk: URL contains sensitive keywords.")

    if score >= 5:
        return {"status": "MALICIOUS", "color": "#ff4d4f", "warnings": warnings}
    elif score >= 2:
        return {"status": "SUSPICIOUS", "color": "#faad14", "warnings": warnings}
    else:
        return {"status": "SAFE", "color": "#52c41a", "warnings": ["No immediate threats detected."]}

def decode_qr_opencv(image_path):
    """Fallback scanner using OpenCV"""
    if not OPENCV_AVAILABLE:
        return None
    try:
        img = cv2.imread(image_path)
        if img is None:
            return None
        detector = cv2.QRCodeDetector()
        data, bbox, _ = detector.detectAndDecode(img)
        return data if data else None
    except Exception as e:
        print(f"OpenCV Error: {e}")
        return None

@app.route('/scan', methods=['POST'])
def scan_qr():
    """File Upload Endpoint"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        qr_data = None
        
        # 1. Try Pyzbar
        if PYZBAR_AVAILABLE:
            try:
                image = Image.open(filepath)
                decoded_objects = pyzbar_decode(image)
                if decoded_objects:
                    qr_data = decoded_objects[0].data.decode('utf-8')
            except Exception as e:
                print(f"Pyzbar failed: {e}")

        # 2. Try OpenCV Fallback
        if not qr_data and OPENCV_AVAILABLE:
            qr_data = decode_qr_opencv(filepath)

        # Cleanup
        if os.path.exists(filepath):
            os.remove(filepath)

        if not qr_data:
            return jsonify({'error': 'Could not read QR code. Try a clearer image.'}), 400

        risk_report = analyze_threat_level(qr_data)
        return jsonify({
            'url': qr_data,
            'status': risk_report['status'],
            'color': risk_report['color'],
            'warnings': risk_report['warnings']
        })

    return jsonify({'error': 'Invalid file type'}), 400

@app.route('/analyze', methods=['POST'])
def analyze_url():
    """Camera Scan Endpoint"""
    data = request.get_json()
    if not data or 'url' not in data:
        return jsonify({'error': 'No URL provided'}), 400
    
    try:
        risk_report = analyze_threat_level(data['url'])
        return jsonify({
            'url': data['url'],
            'status': risk_report['status'],
            'color': risk_report['color'],
            'warnings': risk_report['warnings']
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # ⚠️ REVERTED TO HTTP (No SSL) to fix upload issues
    app.run(debug=True, port=5000, host='0.0.0.0')