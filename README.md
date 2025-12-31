# AI Data Dashboard

A full-stack application that allows users to upload large CSV files and interact with their data using natural language. This isn't just a simple chat-over-data wrapper; it uses a code-execution engine to perform actual calculations across the entire dataset.

## Why I Built This
Most AI data tools struggle with two things: "Token Limits" (you can't send a 10,000-row file to an LLM) and "Hallucinations" (AI is bad at math). I built this dashboard to solve both. Instead of asking the AI to "read" the data, I ask the AI to "write" the Python code needed to analyze it. This makes the tool fast, cheap to run, and 100% mathematically accurate.

## The Architecture
- **Frontend:** React + AG Grid for high-performance data rendering.
- **Backend:** FastAPI (Python) for handling file uploads and the code execution engine.
- **Analysis:** Pandas for in-memory data processing.
- **AI:** OpenAI (GPT-3.5) used specifically as a translation layer from Natural Language to Pandas code.

## Design Trade-offs & Decisions
* **In-Memory vs Database:** For this prototype, I chose to store the DataFrame in a global variable (In-Memory). This makes analysis incredibly fast for files up to ~100MB but would need a persistent database or Redis store if I were to scale this for multiple concurrent users.
* **Code Execution (eval):** I used Python's `eval()` to execute the AI-generated code. While efficient for a private tool, in a public production environment, I would move this to a sandboxed Docker container to prevent any potential security risks from generated code.
* **Schema-Only Context:** To keep API costs low, I only send the column names and data types to the AI. This is enough for the AI to write perfect code without needing to see the actual rows.

## How to Run Locally

### 1. Backend
1. Go to the `backend` folder.
2. Create a virtual environment: `python -m venv venv`.
3. Activate it: `source venv/bin/activate`.
4. Install dependencies: `pip install fastapi uvicorn pandas openai python-dotenv tabulate`.
5. Create a `.env` file and add: `OPENAI_API_KEY=your_key_here`.
6. Run the server: `uvicorn main:app --reload`.

### 2. Frontend
1. Go to the `frontend` folder.
2. Install packages: `npm install`.
3. Start the dev server: `npm run dev`.

### 3. Usage
- Upload a CSV (test it with a 10,000-row file!).
- Use the chat box to ask questions like: *"How many total rows are there in the dataset?"* or *"Give me the most frequent value in the Lead Stage Column."*