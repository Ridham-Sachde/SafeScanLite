# Use a lightweight Python version
FROM python:3.9-slim

# Install the missing system libraries for Pyzbar and OpenCV
RUN apt-get update && apt-get install -y \
    libzbar0 \
    libgl1-mesa-glx \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend code
COPY . .

# Run the app using Gunicorn (Production server)
CMD ["gunicorn", "-b", "0.0.0.0:5000", "app:app"]