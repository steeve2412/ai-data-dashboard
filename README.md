# AI Data Dashboard

A full-stack application that allows users to upload large CSV files, view them in an interactive grid, and perform complex analysis using natural language. This isn't just a simple chat-over-data wrapper; it combines a code-execution engine for analysis with a spreadsheet-like interface for real-time data editing.

## Why I Built This
Most AI data tools struggle with two things: "Token Limits" (you can't send a 10,000-row file to an LLM) and "Hallucinations" (AI is bad at math). I built this dashboard to solve both. Instead of asking the AI to "read" the data, I ask the AI to "write" the Python code needed to analyze it. This makes the tool fast, cheap to run, and 100% mathematically accurate.

## The Architecture
- **Frontend:** React + AG Grid for high-performance data rendering and editing.
- **Backend:** FastAPI (Python) for handling file uploads, CRUD operations, and the code execution engine.
- **Analysis:** Pandas for in-memory data processing.
- **AI:** OpenAI (GPT-3.5) used specifically as a translation layer from Natural Language to Pandas code.

## Key Features
- **Smart Analysis:** Ask questions like "What is the average deal size?" and get accurate answers generated via Python code.
- **Live Data Editing:** Double-click any cell to edit values directly, or add new rows to the dataset.
- **Context-Aware:** The AI is aware of your live edits (e.g., if you change a deal from "Lost" to "Won", the AI's next calculation will reflect that immediately).

## Design Trade-offs & Decisions
* **In-Memory vs Database:** For this prototype, I chose to store the DataFrame in a global variable (In-Memory). This makes analysis incredibly fast for files up to ~100MB but would need a persistent database or Redis store if I were to scale this for multiple concurrent users.
* **Code Execution (eval):** I used Python's `eval()` to execute the AI-generated code. While efficient for a private tool, in a public production environment, I would move this to a sandboxed Docker container to prevent any potential security risks from generated code.
* **Full-Screen UX vs Split View:** I deliberately moved the AI chat interface to a **collapsible floating widget**. This maximizes screen real estate for the data grid, allowing users to view wide datasets comfortably while treating the AI as an on-demand "Copilot" rather than a permanent sidebar.
* **Schema-Only Context:** To keep API costs low, I only send the column names and data types to the AI. This is enough for the AI to write perfect code without needing to see the actual rows.

## How to Run Locally

### 1. Backend
1. Go to the `backend` folder.
2. Create a virtual environment: `python -m venv venv`.
3. Activate it: `source venv/bin/activate` (Mac/Linux) or `venv\Scripts\activate` (Windows).
4. Install dependencies: `pip install fastapi uvicorn pandas openai python-dotenv tabulate multipart`.
5. Create a `.env` file and add: `OPENAI_API_KEY=your_key_here`.
6. Run the server: `uvicorn main:app --reload`.

### 2. Frontend
1. Go to the `frontend` folder.
2. Install packages: `npm install`.
3. Start the dev server: `npm run dev`.

### 3. Usage
- **Upload:** Select a CSV file (supports large datasets).
- **Edit:** Double-click any cell to modify data, or click **"+ Add New Row"** to append data.
- **Chat:** Click the "Chat with AI" button in the bottom-right to open the assistant.
- **Analyze:** Ask questions like: *"How many total rows are there?"* or *"Give me the most frequent value in the Lead Stage Column."*