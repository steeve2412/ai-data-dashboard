import { useState, useMemo } from "react";
import axios from "axios";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community'; 
import "./App.css";

ModuleRegistry.registerModules([ AllCommunityModule ]);

function App() {
  const [rowData, setRowData] = useState([]);
  const [colDefs, setColDefs] = useState([]);
  const [filename, setFilename] = useState("");
  
  // Chat States
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const autoSizeStrategy = useMemo(() => {
    return {
      type: 'fitCellContents'
    };
  }, []);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("http://127.0.0.1:8000/upload", formData);
      
      setFilename(res.data.filename);
      setRowData(res.data.data);
      
      const cols = res.data.columns.map(col => ({
        field: col,
        filter: true,
        sortable: true,
        editable: true
      }));
      setColDefs(cols);
    } catch (err) {
      alert("Upload failed. Check if backend is running.");
    }
  };

  const onCellValueChanged = async (event) => {
    console.log("Cell Edited:", event);
    try {
      await axios.post("http://127.0.0.1:8000/update_cell", {
        rowIndex: event.node.rowIndex,
        colId: event.column.colId,
        newValue: event.newValue
      });
    } catch (err) {
      console.error("Error saving edit:", err);
      alert("Failed to save change to backend.");
    }
  };

  const addNewRow = async () => {
    const emptyRow = {};
    colDefs.forEach(col => emptyRow[col.field] = "");

    const newRowData = [...rowData, emptyRow];
    setRowData(newRowData);

    try {
      await axios.post("http://127.0.0.1:8000/add_row", emptyRow);
    } catch (err) {
      console.error("Error adding row:", err);
      alert("Failed to add row to backend.");
    }
  };

  const askAI = async () => {
    if (!question.trim()) return;

    const userMsg = { role: "user", text: question };
    setChatHistory(prev => [...prev, userMsg]);
    setLoading(true);

    const formData = new FormData();
    formData.append("question", question);

    try {
      const res = await axios.post("http://127.0.0.1:8000/chat", formData);
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
        <section className="table-area">
          <div style={{ marginBottom: "10px", display: "flex", justifyContent: "flex-end" }}>
             <button 
               onClick={addNewRow} 
               style={{ 
                 padding: "8px 12px", 
                 backgroundColor: "#007bff", 
                 color: "white", 
                 border: "none", 
                 borderRadius: "4px", 
                 cursor: "pointer",
                 fontWeight: "bold"
               }}
             >
               + Add New Row
             </button>
          </div>

          <div className="ag-theme-alpine" style={{ height: "calc(100vh - 150px)", width: "100%" }}>
            <AgGridReact 
              rowData={rowData} 
              columnDefs={colDefs} 
              pagination={true}
              onCellValueChanged={onCellValueChanged}
              autoSizeStrategy={autoSizeStrategy}
            />
          </div>
        </section>

        {isChatOpen && (
          <div className="chat-popup">
            <div className="chat-header">
              <span>AI Analyst</span>
              <button onClick={() => setIsChatOpen(false)}>×</button>
            </div>
            <div className="chat-log">
              {chatHistory.length === 0 && <p className="placeholder">Ask me anything about the data...</p>}
              {chatHistory.map((msg, i) => (
                <div key={i} className={`msg ${msg.role}`}>
                  <strong>{msg.role === "user" ? "You" : "AI"}:</strong>
                  <p>{msg.text}</p>
                </div>
              ))}
              {loading && <p className="thinking">AI is thinking...</p>}
            </div>
            <div className="chat-input">
              <input 
                value={question} 
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Type your query..."
                onKeyDown={(e) => e.key === "Enter" && askAI()}
              />
              <button onClick={askAI}>Send</button>
            </div>
          </div>
        )}

        <button className="chat-toggle-btn" onClick={() => setIsChatOpen(!isChatOpen)}>
          {isChatOpen ? "Close Chat" : "💬 Chat with AI"}
        </button>
      </main>
    </div>
  );
}

export default App;