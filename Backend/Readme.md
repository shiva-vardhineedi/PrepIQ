# 🧠 Document to VectorDB, Quiz Generation, and S3 Management

This project includes a backend implemented with FastAPI for managing FAISS indexes, quiz generation, and S3 integration, along with a frontend implemented with Streamlit for testing and interacting with the APIs.

---

## 📋 Table of Contents
- [Prerequisites](#prerequisites)
- [Setting up the Backend](#setting-up-the-backend)
- [Setting up the Frontend (Streamlit UI)](#setting-up-the-frontend-streamlit-ui)
- [Testing the Application](#testing-the-application)
- [Project Features](#project-features)
- [File Structure](#file-structure)

---

## 🔥 Prerequisites
Ensure the following tools are installed on your machine:
1. Python (>= 3.8)
2. Pip
3. Virtual Environment Tool (e.g., `venv`, `virtualenv`)
4. AWS CLI (for S3 operations)
5. Streamlit

---

## 🚀 Setting up the Backend

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/quiz-generator-api.git
cd quiz-generator-api
```

### 2. Set up a Python Virtual Environment

```bash
python -m venv venv
source venv/bin/activate    # For Linux/Mac
venv\Scripts\activate       # For Windows
```

### 3. Install Backend Dependencies

```bash
pip install -r requirements.txt
```

### 4. Environment Variables

Create a `.env` file in the root directory:

```env
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-west-2
GROQ_API_KEY=your_groq_api_key
S3_BUCKET_NAME=your_bucket_name
```

### 5. Run the FastAPI Backend

```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

- The backend will be available at [http://localhost:8000](http://localhost:8000)

### 🐳 Or Run with Docker Compose

```bash
docker-compose up --build
```

- FastAPI: [http://localhost:8000](http://localhost:8000)
- RabbitMQ Management UI: [http://localhost:15672](http://localhost:15672) (guest/guest)

### Manual Docker Commands

#### Build Docker Image

```bash
docker build -t fastapi-quiz-app .
```

#### Run Docker Container

```bash
docker run -d \
  --name quiz-api \
  --env-file .env \
  -p 8000:8000 \
  fastapi-quiz-app
```

#### Stopping and Removing Containers

```bash
docker stop quiz-api
```
```bash
docker rm quiz-api
```

---

## 🎨 Setting up the Frontend (Streamlit UI)

### 1. Install Streamlit

```bash
pip install streamlit
```

### 2. Run the Streamlit App

```bash
streamlit run streamlit_app.py
```

- The UI will open in your default browser at [http://localhost:8501](http://localhost:8501)

---

## 🧪 Testing the Application

### Backend Endpoints

| Endpoint                 | Method | Description                               |
| ------------------------ | ------ | ----------------------------------------- |
| `/upload-documents`      | POST   | Upload PDF files and create FAISS index   |
| `/upload-faiss-to-s3`    | POST   | Upload FAISS index to AWS S3              |
| `/generate-quiz`         | POST   | Generate quiz using LLM & FAISS retrieval |
| `/store-quiz`            | POST   | Save quiz to SQLite DB                    |
| `/get-all-quizzes`       | GET    | Get all stored quizzes                    |
| `/download-quiz-pdf`     | GET    | Generate and download PDF of quiz         |
| `/update_answers`        | POST   | Update user answers in stored JSON        |
| `/delete-quiz/{quiz_id}` | DELETE | Delete a specific quiz from DB            |
| `/list-s3-topics`        | GET    | List S3 folders (vector index topics)     |
| `/delete-s3-folder`      | POST   | Delete a folder (index) from S3           |


### Streamlit UI Features
- Upload PDF or FAISS Index
- Delete S3 Folders
- Generate Quiz with selected subtopics interactively

---

## 🚀 Project Features

- ⚡ VectorDB Management with FAISS
- 📚 Quiz Generation using LLMs
- ☁️ AWS S3 Storage Integration
- 🖥️ Streamlit Interactive UI
- 🐇 RabbitMQ for background task queuing

---

## 📁 File Structure

```
<repository-folder>/
├── app.py                   # FastAPI backend logic
├── requirements.txt         # Python dependencies
├── streamlit_app.py         # Streamlit UI for interaction
├── docker-compose.yml       # Multi-container setup
├── Dockerfile               # Container definition
├── quiz_db.py               # DB functions
├── quiz_database.db         # SQLite database
├── faiss_index/             # FAISS index storage
├── uploaded_files/          # Uploaded PDFs
├── output/                  # JSON and PDF output
├── .env                     # Environment variables
└── README.md                # Project documentation
```

---

## 📣 Notes

- Ensure AWS credentials are correctly configured.
- FastAPI backend must be running before using the Streamlit UI.

---

## ✍️ Author

Built by:
- **Siva Swaroop Vardhineedi**
- **Chandra Sekhar Naidu Gorle**

---

## 📜 License


