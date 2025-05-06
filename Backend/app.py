from fastapi import FastAPI, HTTPException, UploadFile, File, Depends, Response
from langchain.document_loaders import PyPDFLoader
import os
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.vectorstores import FAISS
import logging
import traceback
import boto3
from fastapi.responses import JSONResponse
from fastapi import Body
from langchain_groq import ChatGroq
import json
from sqlalchemy import create_engine, Column, Integer, String, JSON, TIMESTAMP
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from pydantic import BaseModel
from typing import List, Literal, Optional, Dict
import shutil
import datetime
from sqlalchemy.orm import Session
from quiz_db import *
from pathlib import Path
from alembic import command
from alembic.config import Config
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.pdfgen import canvas
from io import BytesIO
import requests
from fastapi import BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware


# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

# Initialize FastAPI
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*", "http://your-frontend-domain.com"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, DELETE, etc.)
    allow_headers=["*"],  # Allow all headers
)

# SQLAlchemy Database setup
# Update this line to use a file-based SQLite database
DATABASE_URL = "sqlite:///./quiz_database.db"  # Use relative path or absolute path for the database file


Base = declarative_base()

# Define the Quiz model
class Quiz(Base):
    __tablename__ = 'quizzes'
    quiz_id = Column(Integer, primary_key=True, autoincrement=True)
    topic_name = Column(String(255), nullable=False)
    created_at = Column(TIMESTAMP, default=datetime.datetime.utcnow)
    quiz_data = Column(JSON, nullable=False)
    subtopics = Column(JSON, nullable=False)  # Added subtopics as a list of strings

class OpenAnswerGradingRequest(BaseModel):
    question: str
    expected_answer: str
    user_answer: str
    answer_type: Literal["short_answer", "long_answer"]

class AnswerExplanationRequest(BaseModel):
    question: str
    answer: str
    choices: Optional[List[str]] = None  # Only for MCQs



# Create the SQLite engine (in-memory)
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

# Create session local for interacting with the DB
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base.metadata.drop_all(bind=engine)

# Create the table in the in-memory database
# Base.metadata.create_all(bind=engine)


# Pydantic model for the quiz data
class QuizRequest(BaseModel):
    topic_name: str
    subtopics: List[str]
    numQuestions: int
    extraInfo: str
    questionCounts: Dict[str, int]

class QuizQuestion(BaseModel):
    question: str
    choices: List[str]
    answer: str
    your_answer: str = ""
    class Config:
        allow_population_by_field_name = True

class QuizResponse(BaseModel):
    quiz_id: int
    topic_name: str
    subtopics: List[str]
    created_at: str
    quiz_data: list

    class Config:
        orm_mode = True
    



# Dependency to get a database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Function to store quiz data into the database
def store_quiz_in_db(db, topic_name: str, subtopics: list, quiz_data: dict):
    """
    This function stores the quiz data into the database along with the subtopics.
    
    :param db: Database session
    :param topic_name: The name of the topic for the quiz
    :param subtopics: The list of subtopics for the quiz
    :param quiz_data: The quiz data (questions, choices, answers)
    :return: The newly created quiz record
    """
    # Create a new Quiz record
    new_quiz = Quiz(
        topic_name=topic_name,
        subtopics=subtopics,  # Store the subtopics as well
        quiz_data=quiz_data   # Store the quiz data
    )
    
    # Add the new quiz to the session
    db.add(new_quiz)
    
    # Commit the transaction to save it to the database
    db.commit()
    
    # Refresh to get the latest version of the new_quiz object
    db.refresh(new_quiz)
    
    return new_quiz


pdf_directory = '/Users/shivavardhineedi/Desktop/HPC-data/major-project/POC/course-documents'

@app.get("/")
def root():
    return {"status": "ok"}

@app.post("/upload-documents")
async def upload_documents(files: List[UploadFile] = File(...)):
    """
    Upload PDFs and create a FAISS index.
    """
    temp_upload_dir = "temp_uploads"

    try:
        # Ensure the temp_uploads folder exists
        os.makedirs(temp_upload_dir, exist_ok=True)

        documents = []
        # Save uploaded files temporarily and load them
        for file in files:
            file_path = os.path.join(temp_upload_dir, file.filename)
            with open(file_path, "wb") as f:
                f.write(await file.read())
            loader = PyPDFLoader(file_path)
            documents.extend(loader.load())  # Load documents from each PDF file

        # Remove temporary files after processing
        shutil.rmtree(temp_upload_dir, ignore_errors=True)

        # Split documents and create FAISS index
        chunked_docs = split_documents(documents)
        create_faiss_index(chunked_docs)

        return {"message": "Files successfully uploaded and vector DB created."}
    except Exception as e:
        # Cleanup temporary directory in case of errors
        shutil.rmtree(temp_upload_dir, ignore_errors=True)
        logging.error(f"Error processing files: {e}")
        logging.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error processing files: {str(e)}")

@app.post("/upload-faiss-to-s3")
async def upload_faiss_to_s3(s3_folder_name: dict):
    """
    This endpoint uploads the FAISS index to the specified S3 folder if it does not already exist.
    """
    """
    This endpoint uploads the FAISS index to the specified S3 folder if it does not already exist. If successful, it deletes the local FAISS index.
    If the folder already exists, notifies the user.
    """
    try:
        s3 = boto3.client(
            "s3",
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
            region_name=os.getenv("AWS_REGION")
        )
        s3_bucket = "cmpe-295-team-101"
        try:
            bucket_name = "cmpe-295-team-101"
            response = s3.list_objects_v2(Bucket=bucket_name)
            print("Objects in bucket:")
            for obj in response.get("Contents", []):
                print(f"- {obj['Key']}")
        except Exception as e:
            print("❌ ERROR:", e)


        s3_key = f"{s3_folder_name['s3_folder_name']}/index.faiss"
        print("aws_access_key_id:===========================>", os.getenv("AWS_ACCESS_KEY_ID"))
        s3_key_2 = f"{s3_folder_name['s3_folder_name']}/index.pkl"

        # Check if the folder already exists in S3
        response = s3.list_objects_v2(Bucket=s3_bucket, Prefix=f"{s3_folder_name['s3_folder_name']}/")
        if 'Contents' in response and len(response['Contents']) > 0:
            logging.info(f"Folder {s3_folder_name['s3_folder_name']} already exists in S3.")
            return JSONResponse(status_code=400, content={"message": f"Folder {s3_folder_name['s3_folder_name']} already exists in S3. Please delete it before proceeding."})

        # Upload FAISS index to S3
        s3.upload_file("faiss_index/index.faiss", s3_bucket, s3_key)
        with open("faiss_index/index.pkl", "rb") as f:
            s3.upload_fileobj(f, s3_bucket, s3_key_2, ExtraArgs={'ContentType': 'application/octet-stream'})

        
        # Delete the faiss_index file after successful upload
        if os.path.exists("faiss_index"):
            try:
                os.chmod("faiss_index", 0o777)  # Change permissions to ensure it can be deleted
                os.remove("faiss_index")
                logging.info("FAISS index file deleted after successful upload.")
            except PermissionError as e:
                logging.error(f"Permission denied while deleting FAISS index: {e}")
            logging.info("FAISS index file deleted after successful upload.")
        
        logging.info(f"FAISS index successfully uploaded to s3://{s3_bucket}/{s3_key}")
        return {"message": f"FAISS index successfully uploaded to s3://{s3_bucket}/{s3_key}"}
    except Exception as e:
        logging.error(f"Error uploading FAISS index to S3: {e}")
        raise HTTPException(status_code=500, detail=f"Error uploading FAISS index to S3: {str(e)}")


def load_pdfs_from_directory(directory):
    pdf_files = [f for f in os.listdir(directory) if f.endswith('.pdf')]
    documents = []
    for pdf_file in pdf_files:
        file_path = os.path.join(directory, pdf_file)
        loader = PyPDFLoader(file_path)
        docs = loader.load()  # Load the document (each page is a document)
        documents.extend(docs)
    return documents

def split_documents(documents):
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    chunked_docs = text_splitter.split_documents(documents)
    logging.info(f"Total number of chunks created: {len(chunked_docs)}")
    return chunked_docs

def create_faiss_index(chunked_docs):
    embedding_model = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    faiss_index = FAISS.from_documents(chunked_docs, embedding_model)
    faiss_index.save_local("faiss_index")
    logging.info("FAISS index saved locally as 'faiss_index'.")

# Run FastAPI with: uvicorn fastapi_app:app --reload
    
import pika
import json

def push_to_rabbitmq(queue_name: str, message: dict):
    try:
        # Use the known working URL
        url = 'amqp://guest:guest@localhost:5672/'
        logging.info(f"Connecting to RabbitMQ at {url}")
        
        params = pika.URLParameters(url)
        connection = pika.BlockingConnection(params)
        channel = connection.channel()
        
        # Declare the queue as in the working snippet
        channel.queue_declare(queue=queue_name, durable=True)
        
        message_json = "testing......."
        channel.basic_publish(exchange='', routing_key=queue_name, body=message_json)
        
        logging.info(f"Message pushed to RabbitMQ queue '{queue_name}': {message_json}")
        connection.close()
    except Exception as e:
        logging.error("Failed to push message to RabbitMQ", exc_info=True)
        raise

    

@app.get("/list-s3-topics")
async def list_s3_topics():
    """
    This endpoint lists all folder names in the S3 bucket.
    """
    try:
        s3 = boto3.client('s3')
        # s3 = boto3.client(
        #     "s3",
        #     aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        #     aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        #     region_name=os.getenv("AWS_REGION")
        # )
        s3_bucket = "cmpe-295-team-101"
        response = s3.list_objects_v2(Bucket=s3_bucket, Prefix='', Delimiter='/')
        folder_names = set()
        if 'CommonPrefixes' in response:
            for obj in response.get('CommonPrefixes', []):
                folder_name = obj['Prefix'].strip('/')
                folder_names.add(folder_name)
        return {"folders": list(folder_names)}
    except Exception as e:
        logging.error(f"Error listing folders in S3: {e}")
        raise HTTPException(status_code=500, detail=f"Error listing folders in S3: {str(e)}")



@app.post("/delete-s3-folder")
async def delete_s3_folder(s3_folder_name: dict):
    """
    This endpoint deletes the specified folder in S3 if it exists.
    """
    try:
        s3 = boto3.client('s3')
        # s3 = boto3.client(
        #     "s3",
        #     aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        #     aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        #     region_name=os.getenv("AWS_REGION")
        # )
        s3_bucket = "cmpe-295-team-101"
        prefix = f"{s3_folder_name['s3_folder_name']}/"

        # Check if the folder exists in S3
        response = s3.list_objects_v2(Bucket=s3_bucket, Prefix=prefix)
        if 'Contents' not in response or len(response['Contents']) == 0:
            logging.info(f"Folder {s3_folder_name['s3_folder_name']} does not exist in S3.")
            return JSONResponse(status_code=400, content={"message": f"Folder {s3_folder_name['s3_folder_name']} does not exist in S3."})

        # Delete all objects within the folder
        delete_objects = [{'Key': obj['Key']} for obj in response['Contents']]
        s3.delete_objects(Bucket=s3_bucket, Delete={'Objects': delete_objects})
        logging.info(f"Folder {s3_folder_name['s3_folder_name']} and its contents successfully deleted from S3.")
        return {"message": f"Folder {s3_folder_name['s3_folder_name']} successfully deleted from S3."}
    except Exception as e:
        logging.error(f"Error deleting folder in S3: {e}")
        raise HTTPException(status_code=500, detail=f"Error deleting folder in S3: {str(e)}")
    

@app.post("/generate-quiz")
async def generate_quiz(request: QuizRequest):
    """
    This endpoint generates quiz questions based on the given topic and subtopics.
    """
    try:
        # Print request data
        print("Received generate-quiz request.")
        print(f"Request data: topic_name={request.topic_name}, subtopics={request.subtopics}")

        # Ensure correct data types
        topic_name = request.topic_name
        subtopics = request.subtopics
        num_questions = request.numQuestions
        question_counts = request.questionCounts
        extra_info = request.extraInfo or ""

        # Validation: sum of individual question types must equal total questions
        total_from_breakdown = sum(question_counts.values())
        if total_from_breakdown != num_questions:
            raise HTTPException(
                status_code=400,
                detail=f"Sum of question types ({total_from_breakdown}) does not match total number of questions ({num_questions})."
            )

        # Print the types to verify correctness
        print(f"type(topic_name): {type(topic_name)}, type(subtopics): {type(subtopics)}")
        if not isinstance(topic_name, str):
            raise ValueError("The topic_name must be a string.")
        
        if not isinstance(subtopics, list) or not all(isinstance(subtopic, str) for subtopic in subtopics):
            raise ValueError("The subtopics must be a list of strings.")

        # Print the subtopics list to verify each type
        print(f"Subtopics verification passed. Subtopics: {subtopics}")

        # Push request to RabbitMQ queue asynchronously
        queue_name = "test_queue"
        background_tasks = BackgroundTasks()
        message = {
            "topic_name": topic_name,
            "subtopics": subtopics,
            "status": "pending"
        }

        # TTL in milliseconds (5 minutes)
        ttl_ms = 300000  # 5 minutes = 300,000 milliseconds

        # Add to background tasks to avoid blocking
        background_tasks.add_task(push_to_rabbitmq, queue_name, message)

        # Initialize S3 client
        s3 = boto3.client('s3')
        # s3 = boto3.client(
        #     "s3",
        #     aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        #     aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        #     region_name=os.getenv("AWS_REGION")
        # )
        s3_bucket = "cmpe-295-team-101"
        s3_index_prefix = f"{topic_name}/"

        # Define local paths
        local_faiss_index_dir = "faiss_index/"

        # Step 1: Ensure the directory is properly cleaned and set up
        if os.path.exists(local_faiss_index_dir):
            print(f"Directory {local_faiss_index_dir} already exists. Removing it.")
            shutil.rmtree(local_faiss_index_dir)  # Remove existing directory and its content
        
        print(f"Creating directory {local_faiss_index_dir}.")
        os.makedirs(local_faiss_index_dir, exist_ok=True)  # Create a new directory

        # Step 2: List and download all parts of the FAISS index from S3
        print(f"Listing objects in S3 with prefix {s3_index_prefix}.")
        response = s3.list_objects_v2(Bucket=s3_bucket, Prefix=s3_index_prefix)

        if 'Contents' not in response or len(response['Contents']) == 0:
            raise FileNotFoundError(f"No FAISS index found at S3 prefix {s3_index_prefix}")

        for obj in response.get('Contents', []):
            s3_key = obj['Key']
            file_name = s3_key.split('/')[-1]
            local_file_path = os.path.join(local_faiss_index_dir, file_name)
            
            # Download each file in the FAISS index folder
            print(f"Downloading {s3_key} to {local_file_path}.")
            s3.download_file(s3_bucket, s3_key, local_file_path)

        # Step 3: Verify directory contents
        print(f"Contents of {local_faiss_index_dir}: {os.listdir(local_faiss_index_dir)}")

        # Step 4: Load FAISS vector store
        embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

        # Load the FAISS index by pointing to the directory
        print(f"Loading FAISS index from directory {local_faiss_index_dir}.")
        faiss_index = FAISS.load_local(local_faiss_index_dir, embeddings, allow_dangerous_deserialization=True)

        # Step 5: Generate quiz questions
        retriever = faiss_index.as_retriever()
        subtopics_str = ", ".join(subtopics)
        query = f"Retrieve relevant information specifically focusing on the following subtopics: {subtopics_str} within the context of the main topic '{topic_name}'."
        print(f"Running query: {query}")

        relevant_texts = retriever.get_relevant_documents(query)

        # Print details about the retrieved documents
        if relevant_texts:
            print(f"Retrieved {len(relevant_texts)} documents.")
        else:
            print("No documents retrieved.")

        # Compile context from retrieved documents
        context = "\n".join([text.page_content for text in relevant_texts[:5]])
        counts_string = (
            f"Multiple Choice: {question_counts.get('multipleChoice', 0)}, "
            f"True/False: {question_counts.get('trueFalse', 0)}, "
            f"Short Answer: {question_counts.get('shortAnswer', 0)}, "
            f"Long Answer: {question_counts.get('longAnswer', 0)}"
        )
        print("Context successfully retrieved.")

        # Prepare prompt for quiz generation
        # Prepare prompt for quiz generation
        detailed_prompt = (
            "You are an expert quiz question generator working for a professional-grade AI teaching assistant platform. "
            "Your task is to create high-quality, knowledge-testing quiz questions from the provided context, strictly following the defined structure.\n\n"

            "📘 General Rules for All Questions:\n"
            "- *Clarity:* Questions must be grammatically correct, precise, and clearly phrased.\n"
            "- *Relevance:* Use only the information provided in the context below. Do NOT fabricate facts.\n"
            "- *Diversity:* Avoid repetition. Each question should test a different idea.\n"
            "- *Accuracy:* All information must be correct as of the 2023-10 knowledge cutoff.\n"
            "- *Format Compliance:* Output must strictly follow the specified JSON format. Do not include anything else.\n\n"

            "📑 Question Type Instructions:\n"
            "- *Multiple Choice:* Provide 4 answer options in `choices`. Only ONE should be correct. Distractors must be plausible.\n"
            "- *True/False:* Provide 1 factual statement. `choices` must be exactly `[\"True\", \"False\"]`. Answer must match one.\n"
            "- *Short Answer:* Ask a conceptual question. Set `choices` to `null`. Answer should be 1–2 sentences.\n"
            "- *Long Answer:* Ask a deep, analytical question. Set `choices` to `null`. Answer should be 4–5 sentences.\n\n"

            "📦 Output Format:\n"
            "- Return ONLY a JSON array of objects.\n"
            "- Each object must follow this exact format:\n"
            "  {\n"
            "    \"question\": \"string\",\n"
            "    \"choices\": [\"option1\", \"option2\", ...] or null,\n"
            "    \"answer\": \"string\"\n"
            "  }\n"
            "- Do NOT include explanations, extra fields, or any other text.\n\n"

            "🧪 Examples:\n"
            "- Multiple Choice:\n"
            "  {\n"
            "    \"question\": \"Which gas is most abundant in Earth's atmosphere?\",\n"
            "    \"choices\": [\"Oxygen\", \"Hydrogen\", \"Nitrogen\", \"Carbon Dioxide\"],\n"
            "    \"answer\": \"Nitrogen\"\n"
            "  }\n"
            "- True/False:\n"
            "  {\n"
            "    \"question\": \"Water boils at 100 degrees Celsius at sea level.\",\n"
            "    \"choices\": [\"True\", \"False\"],\n"
            "    \"answer\": \"True\"\n"
            "  }\n"
            "- Short Answer:\n"
            "  {\n"
            "    \"question\": \"What is the main function of red blood cells?\",\n"
            "    \"choices\": null,\n"
            "    \"answer\": \"They transport oxygen from the lungs to the rest of the body.\"\n"
            "  }\n"
            "- Long Answer:\n"
            "  {\n"
            "    \"question\": \"Explain how photosynthesis and cellular respiration are interrelated.\",\n"
            "    \"choices\": null,\n"
            "    \"answer\": \"Photosynthesis in plants converts carbon dioxide and water into glucose and oxygen using sunlight. Animals and other organisms use oxygen to break down glucose in cellular respiration, producing carbon dioxide and water. The outputs of one process serve as the inputs of the other, forming a biological cycle essential for life.\"\n"
            "  }\n\n"

            "📚 Context:\n"
            f"{context}\n\n"
            f"🎯 Topic: {topic_name}\n"
            f"🔍 Subtopics: {subtopics_str}\n"
            f"🧩 Question Type Breakdown:\n{counts_string}\n"
            f"💡 Extra Info: {extra_info or 'N/A'}\n\n"

            f"✅ Task:\n"
            f"Generate exactly {num_questions} quiz questions using the above distribution. "
            "Return ONLY a valid JSON array as specified. No titles, headers, explanations, or surrounding text. "
            "Total output must stay under 600 tokens if possible."
        )


        # Prepare messages for ChatGroq model invocation
        messages = [
            ("system", "You are a helpful assistant that creates quiz questions based on the provided content."),
            ("user", detailed_prompt)
        ]

        # Invoke the model
        print("Invoking the ChatGroq model to generate quiz questions.")
        llm = ChatGroq(api_key=os.getenv('GROQ_API_KEY'), max_tokens=1000, model="gemma2-9b-it",)
        response = llm.invoke(messages)

        # Log raw response for debugging
        print("Raw model response:", response.content)

        try:
            # Parse the raw response
            parsed_response = json.loads(response.content)

            # # Validate the structure of the response
            # if not isinstance(parsed_response, dict) or "questions" not in parsed_response:
            #     raise ValueError("Response does not contain a 'questions' key.")
            
            # quiz_questions = parsed_response
            # # validated_questions = [QuizQuestion(**q) for q in quiz_questions]

            # ✅ Accept a plain list
            if not isinstance(parsed_response, list):
                raise ValueError("Expected a list of questions, got something else.")

            # Optionally validate structure
            for q in parsed_response:
                if not all(k in q for k in ["question", "choices", "answer"]):
                    raise ValueError("One or more questions are missing required fields.")

            # Add default field
            quiz_questions = [{**q, "your_answer": ""} for q in parsed_response]

            
            # Ensure each question has the required structure
            for question in quiz_questions:
                if not {"question", "choices", "answer"} <= question.keys():
                    raise ValueError("One or more questions are missing required keys.")
                question["your_answer"] = ""
                
            output_dir = Path("output")
            output_dir.mkdir(parents=True, exist_ok=True)  # Create the output directory if it doesn't exist
            file_path = output_dir / "quiz_questions.json"

            # Save the quiz questions to a JSON file
            with open(file_path, "w") as f:
                json.dump({"quiz_questions": quiz_questions}, f, indent=4)
            
            # Return the validated questions
            return {"quiz_questions": quiz_questions}

        except json.JSONDecodeError as e:
            logging.error(f"Invalid JSON format from model: {response.content}")
            raise HTTPException(status_code=500, detail=f"Invalid JSON format from model: {str(e)}")
    except Exception as e:
        logging.error(f"Error validating model response: {response.content}")
        raise HTTPException(status_code=500, detail=f"Error validating model response: {str(e)}")
    
# @app.post("/store-quiz")
# async def store_quiz(request: QuizRequest, db: Session = Depends(get_db)):
#     """
#     This endpoint stores the quiz data into the database.
#     It gets the quiz questions from a JSON file in the output folder.
#     The input consists only of the topic_name and a list of subtopics.
#     """
#     try:
#         # Define file path in the output folder
#         print(f"Request Data: {request}")
#         file_path = Path("output/quiz_questions.json")
        
#         # Check if the file exists
#         if not file_path.exists():
#             raise HTTPException(status_code=404, detail="Quiz questions file not found.")

#         # Read the quiz data from the file
#         with open(file_path, "r") as f:
#             try:
#                 quiz_data = json.load(f)
#                 quiz_questions = quiz_data.get("quiz_questions", [])

#                 # Validate if the quiz data is present and correct
#                 if not quiz_questions:
#                     raise HTTPException(status_code=400, detail="No quiz questions found in the file.")
                

#                 # Store the quiz data into the database
#                 quiz = store_quiz_in_db(db, topic_name=request.topic_name, 
#                                         subtopics=request.subtopics,  # Pass subtopics from the request
#                                         quiz_data=quiz_questions)

#                 return {"message": "Quiz successfully stored.", "quiz_id": quiz.quiz_id}

#             except json.JSONDecodeError as e:
#                 logging.error(f"Error decoding JSON from file: {file_path}. Error: {str(e)}")
#                 raise HTTPException(status_code=500, detail="Error decoding quiz questions from file.")
#             except Exception as e:
#                 logging.error(f"Unexpected error reading or storing quiz: {str(e)}")
#                 raise HTTPException(status_code=500, detail=f"Error storing quiz: {str(e)}")
    
#     except Exception as e:
#         logging.error(f"Error in store-quiz endpoint: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"Error storing quiz: {str(e)}")

@app.post("/store-quiz")
async def store_quiz(request: QuizRequest, db: Session = Depends(get_db)):
    """
    Stores full quiz metadata and quiz questions from the output file into the database.
    """
    try:
        file_path = Path("output/quiz_questions.json")

        if not file_path.exists():
            raise HTTPException(status_code=404, detail="Quiz questions file not found.")

        with open(file_path, "r") as f:
            quiz_data = json.load(f)
            quiz_questions = quiz_data.get("quiz_questions", [])

            if not quiz_questions:
                raise HTTPException(status_code=400, detail="No quiz questions found in the file.")

            quiz = store_quiz_in_db(
                db=db,
                topic_name=request.topic_name,
                subtopics=request.subtopics,
                quiz_data=quiz_questions,
            )

            return {"message": "Quiz successfully stored.", "quiz_id": quiz.quiz_id}

    except json.JSONDecodeError as e:
        logging.error(f"JSON decode error: {str(e)}")
        raise HTTPException(status_code=500, detail="Error decoding quiz questions from file.")
    except Exception as e:
        logging.error(f"Unexpected error storing quiz: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error storing quiz: {str(e)}")


@app.get("/quizzes/{topic_name}", response_model=List[QuizResponse])
def retrieve_quizzes(topic_name: str, db: Session = Depends(get_db)):
    quizzes = get_quiz_by_topic(db, topic_name)
    if not quizzes:
        raise HTTPException(status_code=404, detail="No quizzes found for this topic")
    return quizzes


# Endpoint to delete a quiz by ID
@app.delete("/delete-quiz/{quiz_id}")
async def delete_quiz(quiz_id: int, db: Session = Depends(get_db)):
    try:
        success = delete_quiz_by_id(db, quiz_id)
        if not success:
            raise HTTPException(status_code=404, detail="Quiz not found.")
        return {"message": "Quiz deleted successfully."}
    except Exception as e:
        logging.error(f"Error deleting quiz: {e}")
        raise HTTPException(status_code=500, detail=f"Error deleting quiz: {str(e)}")
    
@app.get("/get-all-quizzes")
async def get_all_quizzes(db: Session = Depends(get_db)):
    """
    Endpoint to retrieve all quizzes from the database.
    """
    try:
        quizzes = db.query(Quiz).all()  # Retrieve all quizzes without filtering by topic
        if not quizzes:
            raise HTTPException(status_code=404, detail="No quizzes found.")
        
        # Return the quizzes in the response format
        return [QuizResponse(
            quiz_id=quiz.quiz_id,
            topic_name=quiz.topic_name,
            subtopics=quiz.subtopics,
            created_at=quiz.created_at.isoformat(),
            quiz_data=quiz.quiz_data
        ) for quiz in quizzes]
    except Exception as e:
        logging.error(f"Error retrieving all quizzes: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving quizzes: {str(e)}")
    
class AnswerUpdate(BaseModel):
    your_answers: List[str]

def read_json(file_path: str):
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    with open(file_path, 'r') as file:
        data = json.load(file)
    
    return data

# Define a function to save the updated data to the JSON file
def save_json(file_path: str, data: dict):
    with open(file_path, 'w') as file:
        json.dump(data, file, indent=4)

@app.post("/grade-open-answer")
async def grade_open_answer(request: OpenAnswerGradingRequest):
    try:
        grading_prompt = (
            "You are a kind and fair educational assistant tasked with grading open-ended quiz answers.\n\n"
            "Your goal is to assess how well a student's answer matches the expected answer — in meaning, coverage, and relevance — without penalizing for grammar, length, or phrasing differences.\n\n"
            "Provide two things:\n"
            "- A score between 0.0 and 1.0 (float, to one decimal place)\n"
            "- A feedback string (one paragraph explaining why that score was given, what was good, and what could be improved)\n\n"
            f"Question:\n{request.question}\n\n"
            f"Expected Answer:\n{request.expected_answer}\n\n"
            f"Student Answer:\n{request.user_answer}\n\n"
            "Output STRICTLY in this format (JSON only):\n"
            "{\n"
            "  \"score\": float,\n"
            "  \"feedback\": string\n"
            "}"
        )

        messages = [
            ("system", "You are a soft, student-friendly grader."),
            ("user", grading_prompt)
        ]

        llm = ChatGroq(api_key=os.getenv('GROQ_API_KEY'), model="gemma2-9b-it", max_tokens=500)
        response = llm.invoke(messages)

        print("Grading response:", response.content)

        result = json.loads(response.content)

        if not {"score", "feedback"} <= result.keys():
            raise ValueError("Missing keys in LLM grading response.")

        return result

    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Invalid JSON from model: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/explain-answer")
async def explain_answer(request: AnswerExplanationRequest):
    try:
        base_prompt = (
            "You are a helpful tutor assistant explaining quiz answers.\n"
            "Given a question and its correct answer, write a brief (1-2 sentence) explanation of *why* that answer is correct.\n"
            "If choices are provided, refer to them to contrast correct vs. incorrect ones.\n\n"
            f"Question: {request.question}\n"
            f"Correct Answer: {request.answer}\n"
        )

        if request.choices:
            base_prompt += f"Choices: {request.choices}\n"

        base_prompt += "\nOutput ONLY the explanation sentence. No intro, no formatting, no JSON, just the explanation."

        messages = [
            ("system", "You are an educational assistant that explains correct quiz answers clearly."),
            ("user", base_prompt)
        ]

        llm = ChatGroq(api_key=os.getenv('GROQ_API_KEY'), model="gemma2-9b-it", max_tokens=150)
        response = llm.invoke(messages)

        explanation = response.content.strip()

        return {"explanation": explanation}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@app.post("/update_answers")
async def update_answers(answer_data: AnswerUpdate):
    # Path to the JSON file containing quiz questions
    file_path = './output/quiz_questions.json'

    # Read the existing quiz questions from the JSON file
    quiz_data = read_json(file_path)
    
    # Ensure that the length of answers provided matches the number of questions
    if len(answer_data.your_answers) != len(quiz_data['quiz_questions']):
        raise HTTPException(status_code=400, detail="Number of answers provided does not match number of questions")
    
    # Update the 'your_answer' field for each question in the quiz
    for i, question in enumerate(quiz_data['quiz_questions']):
        question['your_answer'] = answer_data.your_answers[i]
    
    # Save the updated data back to the JSON file
    save_json(file_path, quiz_data)
    
    return {"message": "Quiz answers updated successfully", "updated_data": quiz_data}

# Path to the quiz JSON file
QUIZ_JSON_PATH = "output/quiz_questions.json"

# Image URL for watermark or header
IMAGE_URL = "https://www.sjsu.edu/communications/pics/identity/043014_Primary_Mark_WEB_01.png"

# Function to download the image and return as a BytesIO object
def get_image_as_bytes(url: str) -> BytesIO:
    response = requests.get(url)
    if response.status_code == 200:
        img_bytes = BytesIO(response.content)
        return img_bytes
    else:
        raise Exception(f"Failed to download image from {url}")

@app.get("/download-quiz-pdf")
async def download_quiz_pdf():
    # Check if the quiz JSON file exists
    if not os.path.exists(QUIZ_JSON_PATH):
        return {"error": "Quiz JSON file not found."}

    # Load quiz data from the JSON file
    with open(QUIZ_JSON_PATH, "r") as file:
        quiz_data = json.load(file)

    # Create a PDF in memory
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()

    # Get the image as bytes for watermark
    try:
        img_bytes = get_image_as_bytes(IMAGE_URL)
    except Exception as e:
        return {"error": str(e)}

    # Custom canvas to add watermark with reduced opacity
    def add_watermark(canvas, doc):
        # Set the opacity and watermark text
        canvas.saveState()
        canvas.setFont("Helvetica", 50)
        canvas.setFillColorRGB(0.8, 0.8, 0.8, alpha=0.5)  # Semi-transparent gray
        canvas.rotate(45)
        canvas.drawString(100, 500, "WATERMARK")  # Example watermark text
        canvas.restoreState()

    elements = []
    title = Paragraph("Quiz Questions and Answers", styles["Title"])
    elements.append(title)
    elements.append(Spacer(1, 12))

    # Add questions and answers
    for idx, question in enumerate(quiz_data["quiz_questions"], start=1):
        question_text = f"{idx}. {question['question']}"
        elements.append(Paragraph(question_text, styles["Heading2"]))
        elements.append(Spacer(1, 6))

        # Add choices
        if question["choices"]:
            for choice in question['choices']:
                elements.append(Paragraph(f" - {choice}", styles["Normal"]))
            elements.append(Spacer(1, 6))

        # Add correct answer and user's answer
        elements.append(Paragraph(f"Correct Answer: {question['answer']}", styles["Normal"]))
        elements.append(Paragraph(f"Your Answer: {question['your_answer']}", styles["Normal"]))
        elements.append(Spacer(1, 12))

    # Build the PDF using a custom canvas for watermark
    doc.build(elements, onFirstPage=add_watermark, onLaterPages=add_watermark)

    # Serve the PDF as a downloadable file
    buffer.seek(0)
    return Response(buffer.read(), media_type="application/pdf", headers={
        "Content-Disposition": "attachment;filename=quiz_questions.pdf"
    })
