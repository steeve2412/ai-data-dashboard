import os
import io
import pandas as pd
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables (for OpenAI API key)
load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
print("LOADED KEY:", os.getenv("OPENAI_API_KEY"))



# Initialize FastAPI app
app = FastAPI()

# Enable CORS so the frontend can call this API without issues
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Using a simple global variable to store the uploaded dataframe
global_df = None

@app.get("/")
def read_root():
    # Basic health check endpoint to confirm server is running
    return {"message": "AI Data Dashboard API is running"}

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    # Read CSV into a pandas DataFrame and store it globally
    global global_df
    
    # Read uploaded file content
    contents = await file.read()
    s = str(contents, 'utf-8')
    data = io.StringIO(s)

    # Convert to DataFrame
    df = pd.read_csv(data)

    # Keep a copy globally for later queries
    global_df = df.copy()
    
    # Return basic metadata and the raw data so the UI can render it immediately
    return {
        "filename": file.filename,
        "columns": df.columns.tolist(),
        "data": df.fillna("").to_dict(orient="records")
    }

@app.post("/chat")
async def chat_with_data(question: str = Form(...)):
    # Handle questions only if a dataset has been uploaded
    global global_df
    
    if global_df is None:
        return {"answer": "Please upload a CSV file first."}
    
    # Prepare dataset summary to give the LLM context
    columns = ", ".join(global_df.columns.tolist())
    preview = global_df.head(5).to_markdown(index=False)
    
    # System prompt guiding the assistant to act as a data analyst
    system_prompt = f"""
    You are an expert Data Analyst. 
    The user has uploaded a dataset with columns: {columns}.
    Preview:
    {preview}
    
    Answer the user's question based on this data structure.
    """
    
    try:
        # Send question + dataset context to OpenAI model
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",   # Model choice is flexible for this prototype
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": question}
            ],
            max_tokens=200,
            temperature=0.7
        )

        # Return AI’s answer back to the UI
        return {"answer": response.choices[0].message.content}
        
    except Exception as e:
        # Simple error handling for debugging
        return {"answer": f"Error: {str(e)}"}