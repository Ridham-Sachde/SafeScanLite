import os
import cv2
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from PIL import Image
from urllib.parse import urlparse

app = Flask(__name__)
CORS(app)  # Enable Cross-Origin requests

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10MB Limit

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def analyze_threat_level(url):
    """
    Analyzes URL for security risks and assigns a Traffic Light status.
    """
    score = 0
    warnings = []
    
    url = str(url).strip()
    parsed_url = urlparse(url)
    domain = parsed_url.netloc.lower()
    
    # 1. Protocol Check
    if parsed_url.scheme != 'https':
        score += 5
        warnings.append("Insecure Protocol: URL uses HTTP instead of HTTPS.")

    # 2. Risky TLDs
    risky_tlds = ['.xyz', '.top', '.gq', '.zip']
    if any(domain.endswith(tld) for tld in risky_tlds):
        score += 3
        warnings.append(f"Suspicious Domain: Ends in a high-risk TLD ({domain.split('.')[-1]}).")

    # 3. Phishing Keywords
    phishing_keywords = ['login', 'secure', 'verify', 'update', 'account']
    if any(keyword in url.lower() for keyword in phishing_keywords):
        score += 2
        warnings.append("Phishing Risk: URL contains sensitive keywords.")

    # Determine Traffic Light Status
    if score >= 5:
        return {"status": "MALICIOUS", "color": "#ff4d4f", "warnings": warnings}
    elif score >= 2:
        return {"status": "SUSPICIOUS", "color": "#faad14", "warnings": warnings}
    else:
        return {"status": "SAFE", "color": "#52c41a", "warnings": ["No immediate threats detected."]}

def decode_qr_opencv(image_path):
    """Fallback scanner using OpenCV if pyzbar fails"""
    try:
        img = cv2.imread(image_path)
        detector = cv2.QRCodeDetector()
        data, bbox, _ = detector.detectAndDecode(img)
        return data if data else None
    except Exception as e:
        print(f"OpenCV Error: {e}")
        return None

@app.route('/analyze', methods=['POST'])
def analyze_url():
    """Endpoint for Camera Scan (receives raw text)"""
    data = request.get_json()
    if not data or 'url' not in data:
        return jsonify({'error': 'No URL provided'}), 400
    
    url = data['url']
    try:
        risk_report = analyze_threat_level(url)
        return jsonify({
            'url': url,
            'status': risk_report['status'],
            'color': risk_report['color'],
            'warnings': risk_report['warnings']
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/scan', methods=['POST'])
def scan_qr():
    """Endpoint for File Upload (receives image file)"""
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
        
        # 1. Try Pyzbar (Primary)
        try:
            from pyzbar.pyzbar import decode
            image = Image.open(filepath)
            decoded_objects = decode(image)
            if decoded_objects:
                qr_data = decoded_objects[0].data.decode('utf-8')
        except ImportError:
            print("Pyzbar not installed, skipping to OpenCV...")
        except Exception as e:
            print(f"Pyzbar failed: {e}")

        # 2. Try OpenCV (Fallback)
        if not qr_data:
            print("Trying OpenCV fallback...")
            qr_data = decode_qr_opencv(filepath)

        # Cleanup file
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

# if __name__ == '__main__':
#     app.run(debug=True, port=5000, host='0.0.0.0') # host='0.0.0.0' allows network access

if __name__ == '__main__':
    # ssl_context='adhoc' generates a temporary secure certificate
    app.run(debug=True, port=5000, host='0.0.0.0', ssl_context='adhoc')