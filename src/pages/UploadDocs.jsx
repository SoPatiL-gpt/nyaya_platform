import { useState } from "react";
import { db } from "../firebase";
import { addDoc, collection } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function UploadDocs() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setError("");
    if (!selected) return;
    if (selected.size > 5 * 1024 * 1024) {
      setError("File too large. Max size is 5MB.");
      return;
    }
    setFile(selected);
  };

  const handleUpload = async () => {
    if (!file) return;
    const caseId = localStorage.getItem("caseId");
    const uid = localStorage.getItem("mock_uid");
    if (!caseId) { setError("No case selected. Go back and try again."); return; }
    if (!uid) { setError("You are not logged in."); return; }

    setLoading(true);
    setProgress(10);
    setError("");

    try {
      // Read file as base64
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result); // includes data:mime;base64,... prefix
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setProgress(60);

      // Save directly to Firestore
      await addDoc(collection(db, "documents"), {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileData: base64,       // full base64 string — viewable directly in browser
        uploadedBy: uid,
        caseId,
        uploadedAt: new Date().toISOString(),
      });

      setProgress(100);
      alert("Document uploaded successfully!");
      navigate(-1);
    } catch (err) {
      setError("Upload failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex justify-center items-center bg-darkBg text-white px-4">
      <div className="bg-black/50 border border-neonBlue/40 rounded-2xl p-8 shadow-[0_0_20px_rgba(0,240,255,0.1)] w-full max-w-md">
        <h2 className="text-neonBlue text-2xl font-black mb-2 text-center">Upload Document</h2>
        <p className="text-gray-500 text-xs text-center mb-6">PDF, Image, Word — Max 5MB · Saved to database</p>

        {/* File picker */}
        <label htmlFor="file-upload" className="block mb-6 cursor-pointer">
          <div className={`border-2 border-dashed rounded-xl p-6 text-center transition ${
            file ? "border-neonBlue bg-neonBlue/5" : "border-gray-700 hover:border-gray-500"
          }`}>
            {file ? (
              <>
                <p className="text-3xl mb-2">📄</p>
                <p className="text-white font-bold text-sm truncate">{file.name}</p>
                <p className="text-gray-500 text-xs mt-1">{(file.size / 1024).toFixed(1)} KB · {file.type || "unknown type"}</p>
              </>
            ) : (
              <>
                <p className="text-3xl mb-2">📁</p>
                <p className="text-gray-400 text-sm">Click to select a file</p>
                <p className="text-gray-600 text-xs mt-1">PDF, JPG, PNG, DOC, TXT</p>
              </>
            )}
          </div>
          <input
            id="file-upload"
            name="file-upload"
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt,.xlsx,.csv"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>

        {/* Progress bar */}
        {loading && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>{progress < 60 ? "Reading file..." : progress < 100 ? "Saving to database..." : "Done!"}</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                className="bg-neonBlue h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <p className="text-red-400 text-xs font-bold">⚠️ {error}</p>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={loading || !file}
          className="w-full bg-neonBlue text-black font-black py-3 rounded-xl hover:opacity-90 transition shadow-[0_0_15px_rgba(0,240,255,0.3)] disabled:opacity-40"
        >
          {loading ? `Uploading ${progress}%...` : "Upload Document"}
        </button>

        <button
          onClick={() => navigate(-1)}
          disabled={loading}
          className="w-full mt-3 text-gray-500 hover:text-white transition text-sm font-bold disabled:opacity-40"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default UploadDocs;
