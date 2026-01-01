import os
import io
import pandas as pd
from fastapi import FastAPI, UploadFile, File, Form, Body
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables (for OpenAI API key)
load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

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

@app.post("/update_cell")
async def update_cell(update: dict = Body(...)):
    # Handle cell updates from the frontend grid
    global global_df
    
    if global_df is None:
        return {"error": "No data loaded"}
    
    # Extract the update details sent by AG Grid
    row_idx = int(update['rowIndex'])
    col_name = update['colId']
    new_value = update['newValue']
    
    # Update the specific cell in the global dataframe
    global_df.at[row_idx, col_name] = new_value
    
    return {"message": "Update successful", "value": new_value}

@app.post("/add_row")
async def add_row(new_row: dict = Body(...)):
    # Handle adding a new row from the frontend
    global global_df
    
    if global_df is None:
        return {"error": "No data loaded"}
    
    # Create a new DataFrame for the single row and append it
    new_row_df = pd.DataFrame([new_row])
    global_df = pd.concat([global_df, new_row_df], ignore_index=True)
    
    return {"message": "Row added successfully", "total_rows": len(global_df)}

@app.post("/chat")
async def chat_with_data(question: str = Form(...)):
    # Handle questions only if a dataset has been uploaded
    global global_df
    
    if global_df is None:
        return {"answer": "Please upload a CSV file first."}
    
    # Get column names and types to help the AI write accurate Python code
    columns_info = global_df.dtypes.to_string()
    
    # System prompt guiding the AI to generate a python command for the FULL dataset
    system_prompt = f"""
    You are an expert Data Analyst assistant. The user has a pandas DataFrame named 'df'.
    The dataset has the following columns and data types:
    {columns_info}

    Your task is to write a short, single-line Python pandas expression that answers the user's question.
    - Only return the code itself (e.g., df['Sales'].sum() or df['Status'].value_counts()).
    - Do not write any explanations or extra text.
    - If the user asks a general question, write code that provides the most relevant summary.
    """
    
    try:
        # Ask OpenAI to generate the code instead of the final answer
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Write pandas code to answer: {question}"}
            ],
            temperature=0  # Low temperature for precise code generation
        )

        # This removes any backticks or "python" labels the AI might include
        generated_code = response.choices[0].message.content.strip().replace('`', '').replace('python', '')

        # Execute the generated code on the FULL global_df
        analysis_result = eval(generated_code, {"df": global_df, "pd": pd})

        # Return the actual calculated result back to the UI
        return {"answer": f"Analysis Result: {analysis_result}"}
        
    except Exception as e:
        return {"answer": f"I couldn't process that query. Please make sure you are asking about existing columns."}