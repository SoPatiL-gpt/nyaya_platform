import { useState } from "react";
import { db } from "../firebase";
import { addDoc, collection } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function Hearing() {
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const navigate = useNavigate();

  const handleAdd = async () => {
    try {
      const currentUid = localStorage.getItem("mock_uid");
      const caseId = localStorage.getItem("caseId");

      if (!caseId) {
        alert("No case selected! Go back to your dashboard to select a case.");
        return;
      }
      
      if (!date) {
        alert("Please specify a valid date.");
        return;
      }

      await addDoc(collection(db, "hearings"), {
        caseId: caseId,
        advocateId: currentUid,
        date: new Date(date).toDateString(),
        note: note,
        status: "scheduled"
      });

      alert("Hearing Scheduled!");
      navigate("/advocate-dashboard");
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-darkBg text-white py-10">
      <div className="p-8 bg-glass border border-neonPurple shadow-[0_0_15px_#9d00ff] rounded-xl w-[28rem] flex flex-col items-center">
        <h2 className="text-neonPurple text-2xl font-bold mb-6">
          Schedule Hearing
        </h2>

        {/* Replaced crashing react-calendar with reliable native date picker */}
        <div className="bg-black/60 border border-gray-700 p-4 rounded-xl mb-6 w-full text-white">
          <label className="block text-gray-400 mb-2 font-bold text-sm">SELECT DATE</label>
          <input 
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-transparent text-white text-xl outline-none focus:text-neonPurple transition cursor-pointer [color-scheme:dark]"
          />
        </div>

        <textarea
          placeholder="Hearing Notes"
          className="w-full mb-6 p-3 bg-black border border-gray-700 focus:border-neonPurple text-white rounded h-24 outline-none transition"
          onChange={(e) => setNote(e.target.value)}
        />

        <button
          onClick={handleAdd}
          className="w-full bg-neonPurple text-white font-bold px-4 py-3 rounded hover:opacity-80 transition"
        >
          Add Hearing
        </button>
      </div>
    </div>
  );
}

export default Hearing;