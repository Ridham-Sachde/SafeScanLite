# Safe-Scan Lite – QR Code Safety & Risk Explanation Tool

## 📌 Project Overview

**Safe-Scan Lite** is a cybersecurity-focused web application designed to protect users from malicious QR codes and unsafe URLs, a growing threat known as **QR Phishing (Quishing)**. The tool safely analyzes QR codes or pasted URLs without opening them and explains potential risks in simple, non-technical language.

---

## 🎯 Problem Statement

QR codes are widely used for payments, logins, and promotions, but they can also redirect users to phishing or malicious websites. Non-technical users often cannot identify whether a QR code or link is safe before opening it.

Safe-Scan Lite addresses this problem by analyzing links **before** they are opened and clearly explaining the security risks.

---

## ✅ Key Features

* Safe QR code decoding without automatic redirection
* URL security analysis to detect suspicious patterns
* Risk level classification (Low / Medium / High)
* Attack vector identification (Quishing, phishing, redirection)
* Simple and user-friendly risk explanation

---

## ⚙️ Core Functionalities

1. Safely decodes QR codes to extract embedded URLs.
2. Analyzes URLs for common security threats.
3. Classifies links into risk levels for quick understanding.
4. Identifies possible attack vectors such as QR phishing.
5. Explains risks and safety recommendations in simple language.

---

## 🧠 Technologies Used

* **Backend:** Python (Flask)
* **Frontend:** React
* **AI Tools:**

  * Gemini – project ideation, UI/UX planning
  * GitHub Copilot – code assistance and development speed

---

## 🛡️ Risk Detection Approach

The system uses a **rule-based analysis** to check for:

* Shortened URLs
* IP-based links
* Missing HTTPS
* Suspicious keywords
* Fake or misleading domains

Based on these checks, the tool determines the risk level and corresponding attack vector.

---

## 🚀 How to Run the Project

1. Clone the repository:

```bash
git clone <repository-url>
```

2. Navigate to the backend folder and install dependencies:

```bash
py -m pip install flask flask-cors
```

3. Run the Flask server:

```bash
py app.py
```

4. Open your browser and go to:

```
http://127.0.0.1:5000/
```

---

## 🔮 Future Enhancements

* Mobile application and browser extension support
* Faster and more accurate risk analysis

---

## 🎓 Academic Relevance

This project demonstrates practical application of cybersecurity concepts such as phishing detection, safe link analysis, and user-focused security design. It is suitable for academic evaluation, demos, and cybersecurity awareness use cases.

---

## 📄 License

This project is created for educational purposes.
