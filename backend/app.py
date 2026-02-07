import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from PIL import Image
from pyzbar.pyzbar import decode
from urllib.parse import urlparse

app = Flask(__name__)
CORS(app)  # Enable Cross-Origin requests for React

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
    
    parsed_url = urlparse(url)
    domain = parsed_url.netloc.lower()
    
    # 1. Protocol Check (Red Flag)
    if parsed_url.scheme != 'https':
        score += 5
        warnings.append("Insecure Protocol: URL uses HTTP instead of HTTPS.")

    # 2. Risky TLDs (Orange Flag)
    risky_tlds = ['.xyz', '.top', '.gq', '.zip']
    if any(domain.endswith(tld) for tld in risky_tlds):
        score += 3
        warnings.append(f"Suspicious Domain: Ends in a high-risk TLD ({domain.split('.')[-1]}).")

    # 3. Phishing Keywords (Yellow Flag)
    phishing_keywords = ['login', 'secure', 'verify', 'update', 'account']
    if any(keyword in url.lower() for keyword in phishing_keywords):
        score += 2
        warnings.append("Phishing Risk: URL contains sensitive keywords (login/verify).")

    # Determine Traffic Light Status
    if score >= 5:
        return {"status": "MALICIOUS", "color": "#ff4d4f", "warnings": warnings}
    elif score >= 2:
        return {"status": "SUSPICIOUS", "color": "#faad14", "warnings": warnings}
    else:
        return {"status": "SAFE", "color": "#52c41a", "warnings": ["No immediate threats detected."]}

@app.route('/scan', methods=['POST'])
def scan_qr():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        try:
            # Open image and decode QR
            image = Image.open(filepath)
            decoded_objects = decode(image)

            if not decoded_objects:
                # Cleanup and error
                os.remove(filepath)
                return jsonify({'error': 'No QR code found in the image.'}), 400

            # Extract data (assume first QR code is the target)
            qr_data = decoded_objects[0].data.decode('utf-8')
            
            # Analyze Risk
            risk_report = analyze_threat_level(qr_data)
            
            # Cleanup
            os.remove(filepath)

            return jsonify({
                'url': qr_data,
                'status': risk_report['status'],
                'color': risk_report['color'],
                'warnings': risk_report['warnings']
            })

        except Exception as e:
            return jsonify({'error': str(e)}), 500
            
    return jsonify({'error': 'Invalid file type. Allowed: png, jpg, jpeg, gif'}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5000)