import { useState } from "react";
import axios from "axios";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community'; 
import "./App.css";

// Register AG Grid Modules
ModuleRegistry.registerModules([ AllCommunityModule ]);

function App() {
  const [rowData, setRowData] = useState([]);
  const [colDefs, setColDefs] = useState([]);
  const [filename, setFilename] = useState("");
  
  // Chat States
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // Function to handle CSV Upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("http://127.0.0.1:8000/upload", formData);
      
      setFilename(res.data.filename);
      setRowData(res.data.data);
      
      // Map columns to AG Grid format dynamically
      const cols = res.data.columns.map(col => ({
        field: col,
        filter: true,
        sortable: true,
        flex: 1
      }));
      setColDefs(cols);
    } catch (err) {
      alert("Upload failed. Check if backend is running.");
    }
  };

  // Function to send questions to the AI
  const askAI = async () => {
    if (!question.trim()) return;

    // Add user message to chat history immediately
    const userMsg = { role: "user", text: question };
    setChatHistory(prev => [...prev, userMsg]);
    setLoading(true);

    const formData = new FormData();
    formData.append("question", question);

    try {
      const res = await axios.post("http://127.0.0.1:8000/chat", formData);
      // Add AI response to history
      setChatHistory(prev => [...prev, { role: "ai", text: res.data.answer }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: "ai", text: "Error: AI is offline." }]);
    } finally {
      setLoading(false);
      setQuestion("");
    }
  };

  return (
    <div className="container">
      <header>
        <h1>AI Data Dashboard</h1>
        <div className="upload-bar">
          <input type="file" onChange={handleFileUpload} accept=".csv" />
          {filename && <span>Active File: <strong>{filename}</strong></span>}
        </div>
      </header>

      <main className="dashboard">
        {/* Table Section */}
        <section className="table-area">
          <div className="ag-theme-alpine" style={{ height: "600px", width: "100%" }}>
            <AgGridReact 
              rowData={rowData} 
              columnDefs={colDefs} 
              pagination={true}
            />
          </div>
        </section>

        {/* Chat Section */}
        <section className="chat-area">
          <div className="chat-log">
            {chatHistory.length === 0 && <p className="placeholder">Upload a file and ask a question!</p>}
            {chatHistory.map((msg, i) => (
              <div key={i} className={`msg ${msg.role}`}>
                <strong>{msg.role === "user" ? "You" : "AI Analyst"}:</strong>
                <p>{msg.text}</p>
              </div>
            ))}
            {loading && <p className="thinking">AI is thinking...</p>}
          </div>
          <div className="chat-input">
            <input 
              value={question} 
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask about your data..."
              onKeyDown={(e) => e.key === "Enter" && askAI()}
            />
            <button onClick={askAI}>Send</button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;