import { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection, doc, onSnapshot, getDocs, addDoc, updateDoc, query, where
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { userCollectionRef } from "../lib/userStore";

function CaseView() {
  const navigate = useNavigate();
  const caseId = localStorage.getItem("caseId");
  const currentUid = localStorage.getItem("mock_uid");

  const [caseData, setCaseData] = useState(null);
  const [clientInfo, setClientInfo] = useState(null);
  const [hearings, setHearings] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [activeTab, setActiveTab] = useState("details");

  // Hearing form
  const [hearingDate, setHearingDate] = useState("");
  const [hearingNote, setHearingNote] = useState("");
  const [hearingLoading, setHearingLoading] = useState(false);

  useEffect(() => {
    if (!caseId) { navigate("/advocate-dashboard"); return; }

    const unsubCase = onSnapshot(doc(db, "cases", caseId), (snap) => {
      if (snap.exists()) {
        const d = { id: snap.id, ...snap.data() };
        setCaseData(d);
        // Fetch client info
        getDocs(userCollectionRef(db, "client")).then((userSnap) => {
          userSnap.forEach((userDoc) => {
            const ud = userDoc.data();
            if (ud.uid === d.clientId || userDoc.id === d.clientId) setClientInfo(ud);
          });
        });
      }
    });

    const unsubHearings = onSnapshot(
      query(collection(db, "hearings"), where("caseId", "==", caseId)),
      (snap) => {
        const data = [];
        snap.forEach((d) => data.push({ id: d.id, ...d.data() }));
        data.sort((a, b) => new Date(a.date) - new Date(b.date));
        setHearings(data);
      }
    );

    const unsubDocs = onSnapshot(
      query(collection(db, "documents"), where("caseId", "==", caseId)),
      (snap) => {
        const data = [];
        snap.forEach((d) => data.push({ id: d.id, ...d.data() }));
        setDocuments(data);
      }
    );

    return () => { unsubCase(); unsubHearings(); unsubDocs(); };
  }, [caseId, navigate]);

  const handleScheduleHearing = async () => {
    if (!hearingDate) { alert("Please select a date."); return; }
    setHearingLoading(true);
    try {
      const dateStr = new Date(hearingDate).toDateString();
      await addDoc(collection(db, "hearings"), {
        caseId,
        advocateId: currentUid,
        clientId: caseData.clientId,
        date: dateStr,
        note: hearingNote,
        status: "scheduled",
        timelineStatus: "scheduled",
        createdAt: new Date().toISOString(),
      });
      // Notify client via messages
      await addDoc(collection(db, "messages"), {
        text: `📅 Hearing Scheduled — ${dateStr}\nCase: ${caseData.caseType}\nNote: ${hearingNote || "No note provided"}`,
        sender: currentUid,
        recipientId: caseData.clientId,
        type: "system",
        timestamp: new Date(),
      });
      setHearingDate("");
      setHearingNote("");
      alert("Hearing scheduled! Client has been notified.");
    } catch (err) {
      alert(err.message);
    } finally {
      setHearingLoading(false);
    }
  };

  const updateTimelineStatus = async (hearingId, status) => {
    await updateDoc(doc(db, "hearings", hearingId), { timelineStatus: status });
  };

  if (!caseData) return (
    <div className="min-h-screen bg-darkBg text-white flex items-center justify-center">
      <p className="text-gray-400">Loading case...</p>
    </div>
  );

  const tabs = [
    { key: "details", label: "📋 Case Details" },
    { key: "schedule", label: "📅 Schedule Hearing" },
    { key: "client", label: "👤 Client Information" },
    { key: "timeline", label: "📊 Timeline / Progress" },
    { key: "documents", label: "📎 Documents" },
  ];

  return (
    <div className="min-h-screen bg-darkBg text-white flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 bg-black/60 border-b border-gray-800 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/advocate-dashboard")} className="text-gray-400 hover:text-white transition font-bold">← Back</button>
          <div>
            <h1 className="text-neonPurple font-black text-xl">{caseData.caseType}</h1>
            <p className="text-gray-500 text-xs">{caseData.court || caseData.jurisdiction}</p>
          </div>
        </div>
        <span className="bg-green-500/10 text-green-400 border border-green-500/30 px-4 py-1 rounded-full text-xs font-black uppercase">{caseData.status}</span>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 px-6 pt-4 border-b border-gray-800 bg-black/30 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-5 py-3 text-sm font-bold whitespace-nowrap rounded-t-lg transition ${activeTab === t.key ? "bg-neonPurple/10 text-neonPurple border-t border-x border-neonPurple/40" : "text-gray-500 hover:text-white"}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 p-6 md:p-10 max-w-5xl mx-auto w-full">

        {/* CASE DETAILS */}
        {activeTab === "details" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoCard title="Case Information">
              <Row label="Case Type" value={caseData.caseType} />
              <Row label="Court" value={caseData.court || caseData.jurisdiction} />
              <Row label="Legal Act" value={caseData.legalAct} />
              <Row label="Section" value={caseData.legalSection} />
              <Row label="Filed On" value={new Date(caseData.createdAt).toLocaleDateString("en-IN")} />
            </InfoCard>
            <InfoCard title="Matter Description">
              <p className="text-gray-300 italic leading-relaxed">"{caseData.matterType || caseData.description}"</p>
            </InfoCard>
            <InfoCard title="Petitioner Details">
              <Row label="Name" value={caseData.petitionerName} />
              <Row label="Gender" value={caseData.petitionerGender} />
              <Row label="DOB" value={caseData.petitionerDOB} />
              <Row label="Mobile" value={caseData.petitionerMobile} />
              <Row label="Email" value={caseData.petitionerEmail} />
              <Row label="Address" value={caseData.petitionerAddress} />
            </InfoCard>
            <InfoCard title="Respondent Details">
              <Row label="Name" value={caseData.respondentName} />
              <Row label="Gender" value={caseData.respondentGender} />
              <Row label="DOB" value={caseData.respondentDOB} />
              <Row label="Mobile" value={caseData.respondentMobile} />
              <Row label="Email" value={caseData.respondentEmail} />
              <Row label="Address" value={caseData.respondentAddress} />
            </InfoCard>
          </div>
        )}

        {/* SCHEDULE HEARING */}
        {activeTab === "schedule" && (
          <div className="max-w-xl mx-auto">
            <div className="bg-black/40 border border-neonPurple/30 rounded-2xl p-8 shadow-[0_0_20px_rgba(157,0,255,0.1)]">
              <h2 className="text-neonPurple font-black text-2xl mb-6">📅 Schedule a Hearing</h2>

              <div className="mb-5">
                <label className="block text-xs text-gray-400 mb-2 font-bold uppercase tracking-widest">Select Date</label>
                <input
                  type="date"
                  value={hearingDate}
                  onChange={(e) => setHearingDate(e.target.value)}
                  className="w-full p-3 bg-black border border-gray-700 focus:border-neonPurple rounded-lg text-white outline-none transition [color-scheme:dark]"
                />
              </div>

              <div className="mb-6">
                <label className="block text-xs text-gray-400 mb-2 font-bold uppercase tracking-widest">Hearing Notes (Time, Location, Details)</label>
                <textarea
                  placeholder="e.g. 10:30 AM at District Court Room 4 — Preliminary hearing for evidence submission"
                  value={hearingNote}
                  onChange={(e) => setHearingNote(e.target.value)}
                  className="w-full h-28 p-3 bg-black border border-gray-700 focus:border-neonPurple rounded-lg text-white outline-none transition resize-none"
                />
              </div>

              <button
                onClick={handleScheduleHearing}
                disabled={hearingLoading}
                className="w-full bg-neonPurple text-white font-black py-3 rounded-lg hover:opacity-90 transition shadow-[0_0_15px_rgba(157,0,255,0.3)] disabled:opacity-50"
              >
                {hearingLoading ? "Scheduling..." : "Schedule Hearing →"}
              </button>
            </div>

            {/* Existing Hearings */}
            {hearings.length > 0 && (
              <div className="mt-8">
                <h3 className="text-neonPurple font-bold mb-4">Scheduled Hearings</h3>
                <div className="space-y-3">
                  {hearings.map((h) => (
                    <div key={h.id} className="bg-black/40 border border-gray-700 rounded-lg p-4 flex justify-between items-center">
                      <div>
                        <p className="text-white font-bold">{new Date(h.date).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</p>
                        <p className="text-gray-400 text-sm italic mt-1">"{h.note}"</p>
                      </div>
                      <span className={`text-xs font-black px-3 py-1 rounded-full uppercase ${
                        h.timelineStatus === "success" ? "bg-green-500/20 text-green-400" :
                        h.timelineStatus === "postponed" ? "bg-yellow-500/20 text-yellow-400" :
                        "bg-gray-500/20 text-gray-400"
                      }`}>{h.timelineStatus || h.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* CLIENT INFORMATION */}
        {activeTab === "client" && (
          <div className="max-w-2xl mx-auto">
            {!clientInfo ? (
              <p className="text-gray-500 italic text-center py-12">Loading client information...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoCard title="Personal Details">
                  <Row label="Name" value={`${clientInfo.firstName || ""} ${clientInfo.lastName || ""}`.trim() || clientInfo.name} />
                  <Row label="City" value={clientInfo.city} />
                  <Row label="Govt ID" value={clientInfo.govtId} />
                </InfoCard>
                <InfoCard title="Contact Details">
                  <Row label="Mobile" value={clientInfo.contact || clientInfo.mobile} />
                  <div className="mt-2">
                    <span className="text-gray-500 text-xs">Email</span>
                    <a href={`mailto:${clientInfo.email}`} className="block text-neonBlue hover:underline font-bold mt-1">{clientInfo.email}</a>
                  </div>
                </InfoCard>
              </div>
            )}
          </div>
        )}

        {/* TIMELINE / PROGRESS */}
        {activeTab === "timeline" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-neonPurple font-black text-xl">📊 Case Timeline</h2>
              <button
                onClick={() => setActiveTab("schedule")}
                className="bg-neonPurple/20 text-neonPurple border border-neonPurple px-4 py-2 rounded-lg text-sm font-bold hover:bg-neonPurple hover:text-white transition"
              >
                + Add Hearing
              </button>
            </div>

            {hearings.length === 0 ? (
              <p className="text-gray-500 italic text-center py-12">No timeline entries yet. Schedule a hearing to begin.</p>
            ) : (
              <div className="relative pl-8">
                <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-neonPurple/20"></div>
                {hearings.map((h, i) => {
                  const isLast = i === hearings.length - 1;
                  return (
                    <div key={h.id} className="relative mb-8">
                      <div className="absolute -left-5 top-2 w-4 h-4 rounded-full bg-neonPurple border-2 border-darkBg shadow-[0_0_8px_rgba(157,0,255,0.5)]"></div>
                      <div className="bg-black/40 border border-gray-700 rounded-xl p-5">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="text-white font-black">{new Date(h.date).toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</p>
                            <p className="text-gray-400 text-sm italic mt-1">"{h.note}"</p>
                          </div>
                        </div>

                        {/* Status Buttons */}
                        <div className="flex flex-wrap gap-2 mt-3">
                          {!isLast ? (
                            <>
                              <StatusBtn label="✓ Success" status="success" current={h.timelineStatus} onClick={() => updateTimelineStatus(h.id, "success")} color="green" />
                              <StatusBtn label="⏸ Postponed" status="postponed" current={h.timelineStatus} onClick={() => updateTimelineStatus(h.id, "postponed")} color="yellow" />
                            </>
                          ) : (
                            <>
                              <StatusBtn label="🏆 Won" status="won" current={h.timelineStatus} onClick={() => updateTimelineStatus(h.id, "won")} color="blue" />
                              <StatusBtn label="❌ Lost" status="lost" current={h.timelineStatus} onClick={() => updateTimelineStatus(h.id, "lost")} color="red" />
                              <StatusBtn label="⏸ Postponed" status="postponed" current={h.timelineStatus} onClick={() => updateTimelineStatus(h.id, "postponed")} color="yellow" />
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* DOCUMENTS */}
        {activeTab === "documents" && (
          <div>
            <h2 className="text-neonPurple font-black text-xl mb-6">📎 Client Documents</h2>
            {documents.length === 0 ? (
              <p className="text-gray-500 italic text-center py-12">No documents uploaded by the client yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((d) => (
                  <a
                    key={d.id}
                    href={d.fileData || d.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 bg-black/40 border border-gray-700 hover:border-neonPurple p-4 rounded-xl transition group"
                  >
                    <span className="text-3xl">📄</span>
                    <div className="overflow-hidden">
                      <p className="text-white font-bold truncate group-hover:text-neonPurple transition">{d.fileName}</p>
                      <p className="text-gray-500 text-xs">{d.fileSize ? `${(d.fileSize/1024).toFixed(1)} KB` : ""} · Click to view</p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoCard({ title, children }) {
  return (
    <div className="bg-black/40 border border-gray-800 rounded-xl p-5">
      <p className="text-gray-500 text-xs font-black uppercase tracking-widest mb-4 border-b border-gray-800 pb-2">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-gray-500 min-w-[80px]">{label}:</span>
      <span className="text-white font-bold">{value || "—"}</span>
    </div>
  );
}

function StatusBtn({ label, status, current, onClick, color }) {
  const colors = {
    green: "border-green-500 text-green-400 bg-green-500/10 hover:bg-green-500 hover:text-black",
    yellow: "border-yellow-500 text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500 hover:text-black",
    blue: "border-neonBlue text-neonBlue bg-neonBlue/10 hover:bg-neonBlue hover:text-black",
    red: "border-red-500 text-red-400 bg-red-500/10 hover:bg-red-500 hover:text-black",
  };
  const isActive = current === status;
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-xs font-black border transition ${colors[color]} ${isActive ? "ring-2 ring-offset-1 ring-offset-black ring-current" : ""}`}
    >
      {label} {isActive && "✓"}
    </button>
  );
}

export default CaseView;
