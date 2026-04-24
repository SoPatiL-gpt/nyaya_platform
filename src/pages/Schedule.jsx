import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";


function Schedule() {
  const navigate = useNavigate();
  const [hearings, setHearings] = useState([]);
  const [cases, setCases] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date());

  const currentRole = localStorage.getItem("mock_role");
  const currentUid = localStorage.getItem("mock_uid");

  const themeColor = currentRole === "advocate" ? "text-neonPurple" : "text-neonBlue";
  const borderColor = currentRole === "advocate" ? "border-neonPurple" : "border-neonBlue";
  const shadowColor = currentRole === "advocate" ? "shadow-[0_0_15px_#9d00ff]" : "shadow-[0_0_15px_#00f0ff]";

  useEffect(() => {
    let unsubHearings = () => {};
    
    // Real-time updates as requested
    const unsubCases = onSnapshot(collection(db, "cases"), (snapshot) => {
      const myCases = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (
          (currentRole === "client" && data.clientId === currentUid) ||
          (currentRole === "advocate" && data.advocateId === currentUid)
        ) {
          myCases[doc.id] = data;
        }
      });
      setCases(myCases);
      
      // Cleanup previous hearings listener if cases change
      unsubHearings();
      
      unsubHearings = onSnapshot(collection(db, "hearings"), (hSnapshot) => {
        const myHearings = [];
        hSnapshot.forEach((doc) => {
          const hData = doc.data();
          if (myCases[hData.caseId]) {
            myHearings.push({ id: doc.id, ...hData });
          }
        });
        
        // Sort by date upcoming
        myHearings.sort((a,b) => new Date(a.date) - new Date(b.date));
        setHearings(myHearings);
      });
    });

    return () => {
      unsubCases();
      unsubHearings();
    };
  }, [currentRole, currentUid]);

  const tileClassName = ({ date, view }) => {
    if (view === "month") {
      const dateString = date.toDateString();
      if (
        hearings.find((h) => new Date(h.date).toDateString() === dateString)
      ) {
        return "bg-neonBlue/50 text-black font-bold rounded";
      }
    }
    return null;
  };

  const getHearingsForDate = (date) => {
    const dateString = date.toDateString();
    return hearings.filter(
      (h) => new Date(h.date).toDateString() === dateString,
    );
  };

  const goBack = () => {
    if (currentRole === "advocate") navigate("/advocate-dashboard");
    else navigate("/client-dashboard");
  };

  const getFormattedSlide = (h) => {
    if (!h) return null;
    const d = new Date(h.date);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    const day = d.toLocaleDateString("en-US", { weekday: "long" });
    return {
      dateStr: `${dd}-${mm}-${yyyy}`,
      day,
      note: h.note || "No note provided"
    };
  };

  const [slideIndex, setSlideIndex] = useState(0);
  const advocateSlides = hearings.length > 0 ? hearings : [null];

  return (
    <div className={`min-h-screen bg-darkBg text-white flex flex-col p-10`}>
      <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
        <h1 className={`text-3xl ${themeColor} font-bold`}>
          📅 Upcoming Schedule
        </h1>
        <button
          onClick={goBack}
          className="bg-gray-800 text-white font-bold px-4 py-2 rounded hover:bg-gray-700 transition border border-gray-600"
        >
          ← Back to Dashboard
        </button>
      </div>

      {currentRole === "client" ? (
        <div className="flex flex-col md:flex-row gap-8">
          <div className={`bg-glass p-8 rounded-2xl border ${borderColor} ${shadowColor} flex-1`}>
            <h2 className={`text-xl ${themeColor} font-bold mb-4`}>Select a Date</h2>
            <div className="bg-white p-4 rounded-xl text-black">
              <Calendar
                onChange={setSelectedDate}
                value={selectedDate}
                tileClassName={tileClassName}
                className="border-none w-full"
              />
            </div>
          </div>

          <div className={`bg-glass p-8 rounded-2xl border flex-1 border-gray-700`}>
            <h2 className={`text-xl ${themeColor} font-bold mb-4`}>
              Hearings on {selectedDate.toDateString()}
            </h2>

            {getHearingsForDate(selectedDate).length === 0 ? (
              <p className="text-gray-400 italic">No hearings scheduled for this date.</p>
            ) : (
              <div className="space-y-4">
                {getHearingsForDate(selectedDate).map((h) => (
                  <div key={h.id} className="p-4 bg-black/50 border border-gray-600 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-bold text-white text-lg">
                        {cases[h.caseId]?.caseType || "Unknown Case"}
                      </p>
                      <p className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${themeColor} bg-white/5 border border-white/10`}>
                        {h.status}
                      </p>
                    </div>
                    <p className="text-sm text-gray-400 mb-2">
                      📍 {cases[h.caseId]?.court || ""}
                    </p>
                    <div className="bg-gray-900 border-l-4 border-gray-500 p-3 mt-3">
                      <p className="text-white italic">"{h.note}"</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto w-full mt-10">
          <div className="bg-glass border border-neonPurple shadow-[0_0_20px_#9d00ff] rounded-2xl p-10">
            {advocateSlides[slideIndex] === null ? (
              <div className="text-center py-20">
                <p className="text-gray-500 text-2xl italic">No Hearings Scheduled</p>
                <p className="text-gray-400 mt-4">Schedule a hearing from your active cases.</p>
              </div>
            ) : (() => {
              const formatted = getFormattedSlide(advocateSlides[slideIndex]);
              const slideData = advocateSlides[slideIndex];
              return (
                <div className="text-center px-4">
                  <div className="bg-black/60 border border-gray-700 p-8 rounded-2xl w-full">
                    <div className="text-5xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-neonPurple to-pink-500">
                      {formatted.dateStr}
                    </div>
                    <div className="text-2xl font-bold text-gray-300 mb-6">{formatted.day}</div>
                    <div className="bg-gray-900 border-l-4 border-neonPurple p-4 text-left mx-auto max-w-xl">
                      <p className="text-xl text-white italic">Note: {formatted.note}</p>
                    </div>
                    <div className="mt-6 text-sm text-gray-500 font-bold bg-white/5 inline-block px-4 py-2 rounded-full border border-white/10">
                      CASE: {cases[slideData.caseId]?.caseType || "Unknown Case"}
                    </div>
                  </div>
                </div>
              );
            })()}

            {hearings.length > 1 && (
              <div className="flex justify-center items-center gap-6 mt-8">
                <button
                  onClick={() => setSlideIndex((i) => (i - 1 + hearings.length) % hearings.length)}
                  className="px-5 py-2 bg-neonPurple/20 border border-neonPurple text-neonPurple rounded-full hover:bg-neonPurple hover:text-white transition font-bold"
                >
                  ←
                </button>
                <span className="text-gray-400 text-sm">{slideIndex + 1} / {hearings.length}</span>
                <button
                  onClick={() => setSlideIndex((i) => (i + 1) % hearings.length)}
                  className="px-5 py-2 bg-neonPurple/20 border border-neonPurple text-neonPurple rounded-full hover:bg-neonPurple hover:text-white transition font-bold"
                >
                  →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Schedule;
