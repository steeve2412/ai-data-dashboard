import { useState } from "react";
import axios from "axios";
import { AgGridReact } from "ag-grid-react";

// --- NEW IMPORTS FOR AG GRID V35 ---
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community'; 

// --- REGISTER MODULES (Crucial Step for v35) ---
ModuleRegistry.registerModules([ AllCommunityModule ]);

// --- NEW CSS IMPORTS ---
// We don't import the CSS files directly anymore in the new version
// The AllCommunityModule handles most of it, but we can keep App.css for our custom styles

import "./App.css";

function App() {
  const [rowData, setRowData] = useState([]);
  const [colDefs, setColDefs] = useState([]);
  const [filename, setFilename] = useState("");

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post("http://127.0.0.1:8000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const { data, columns, filename } = response.data;

      // Setup Columns
      const gridColumns = columns.map((col) => ({
        field: col,
        headerName: col.toUpperCase(),
        filter: true,
        sortable: true,
        editable: true,
        flex: 1
      }));

      setRowData(data);
      setColDefs(gridColumns);
      setFilename(filename);

    } catch (error) {
      console.error("Upload failed:", error);
      alert("Error connecting to Backend. Is Python running?");
    }
  };

  return (
    <div className="app-container">
      <h1>AI Data Dashboard</h1>
      
      <div className="upload-section">
        <input type="file" accept=".csv" onChange={handleFileUpload} />
        {filename && <p className="file-tag">Loaded: {filename}</p>}
      </div>

      {rowData.length > 0 && (
        // The "ag-theme-quartz" class is still needed for styling
        <div style={{ height: 500, width: "100%" }}>
          <AgGridReact
            rowData={rowData}
            columnDefs={colDefs}
            pagination={true}
          />
        </div>
      )}
    </div>
  );
}

export default App;