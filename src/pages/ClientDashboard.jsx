import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { collection, onSnapshot, getDocs } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { userCollectionRef } from "../lib/userStore";

const SC_NEWS = [
  { title: "Supreme Court issues guidelines on bail in PMLA cases", date: "June 2025" },
  { title: "SC directs states to fill judicial vacancies within 3 months", date: "June 2025" },
  { title: "Landmark ruling: Right to speedy trial is a fundamental right", date: "May 2025" },
  { title: "SC upholds validity of Aadhaar for court proceedings", date: "May 2025" },
  { title: "New e-filing system launched for all High Courts", date: "May 2025" },
  { title: "SC: Anticipatory bail cannot be time-limited by default", date: "April 2025" },
  { title: "Mediation Act 2023 implementation reviewed by SC bench", date: "April 2025" },
  { title: "SC orders live-streaming of Constitution Bench hearings", date: "March 2025" },
  { title: "Bharatiya Nyaya Sanhita: SC clarifies applicability", date: "March 2025" },
  { title: "SC issues notice on pendency of 5 crore cases in lower courts", date: "February 2025" },
];

function AdvocateInfo({ advocateId }) {
  const [info, setInfo] = useState(null);
  useEffect(() => {
    if (!advocateId) return;
    getDocs(userCollectionRef(db, "advocate")).then((snap) => {
      snap.forEach((doc) => {
        const d = doc.data();
        if (d.uid === advocateId || doc.id === advocateId) setInfo(d);
      });
    });
  }, [advocateId]);

  if (!info) return <p className="text-gray-500 italic text-center py-8">Loading advocate details...</p>;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
      <div className="bg-black/40 p-4 rounded-lg border border-gray-800">
        <p className="text-gray-500 text-xs font-bold uppercase mb-2">Advocate Profile</p>
        <p className="text-white font-black text-lg">{info.name}</p>
        <p className="text-gray-400">BAR ID: {info.barId}</p>
        <p className="text-gray-400">State: {info.state}</p>
        <p className="text-gray-400">Practice: {info.practiceCourtType}</p>
        <p className="text-gray-400">Experience: {info.yearsActive} years</p>
        <p className="text-gray-400">Education: {info.education}</p>
      </div>
      <div className="bg-black/40 p-4 rounded-lg border border-gray-800">
        <p className="text-gray-500 text-xs font-bold uppercase mb-2">Contact Details</p>
        <p className="text-gray-400">📞 {info.mobile}</p>
        <a href={`mailto:${info.email}`} className="text-neonBlue hover:underline block mt-1">✉️ {info.email}</a>
        <p className="text-gray-400 mt-2">📍 {info.address}</p>
      </div>
    </div>
  );
}

function DocumentsSection({ caseId, navigate }) {
  const [docs, setDocs] = useState([]);
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "documents"), (snap) => {
      const data = [];
      snap.forEach((doc) => {
        if (doc.data().caseId === caseId) data.push({ id: doc.id, ...doc.data() });
      });
      setDocs(data);
    });
    return () => unsub();
  }, [caseId]);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-gray-400 text-sm">{docs.length} document(s) uploaded</p>
        <button
          onClick={() => { localStorage.setItem("caseId", caseId); navigate("/upload"); }}
          className="bg-neonBlue/10 text-neonBlue border border-neonBlue hover:bg-neonBlue hover:text-black font-bold px-4 py-2 rounded-lg text-sm transition"
        >
          + Upload Document
        </button>
      </div>
      {docs.length === 0 ? (
        <p className="text-gray-500 italic text-center py-8">No documents uploaded yet.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {docs.map((d) => (
            <a
              key={d.id}
              href={d.fileData || d.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 bg-black/60 border border-gray-700 hover:border-neonBlue p-3 rounded-lg text-sm transition"
            >
              <span className="text-2xl">📄</span>
              <span className="text-white truncate">{d.fileName}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function ClientDashboard() {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [hearings, setHearings] = useState([]);
  const [activeTab, setActiveTab] = useState("cases");
  const [activeCaseTab, setActiveCaseTab] = useState({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuSection, setMenuSection] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [unreadCount, setUnreadCount] = useState(0);
  const [newHearingAlert, setNewHearingAlert] = useState(null); // popup notification

  const currentUid = localStorage.getItem("mock_uid");
  const currentName = localStorage.getItem("mock_name") || "Client";
  // Schedule is VIEW-ONLY for client — hearings are set by advocate only

  const handleLogout = async () => { await signOut(auth); localStorage.clear(); navigate("/"); };

  useEffect(() => {
    const unsubCases = onSnapshot(collection(db, "cases"), (snap) => {
      const data = [];
      snap.forEach((doc) => {
        if (doc.data().clientId === currentUid) data.push({ id: doc.id, ...doc.data() });
      });
      setCases(data);
    });

    // Load ALL hearings — filter in render using caseIds from cases
    const unsubHearings = onSnapshot(collection(db, "hearings"), (snap) => {
      const data = [];
      snap.forEach((d) => data.push({ id: d.id, ...d.data() }));
      setHearings((prev) => {
        const prevIds = new Set(prev.map((h) => h.id));
        data.forEach((h) => {
          // only popup for hearings belonging to this client
          const isMine = h.clientId === currentUid;
          if (!prevIds.has(h.id) && prev.length > 0 && isMine) {
            setNewHearingAlert(h);
          }
        });
        return data;
      });
    });

    const unsubMsgs = onSnapshot(collection(db, "messages"), (snap) => {
      let count = 0;
      snap.forEach((doc) => {
        const d = doc.data();
        if (d.sender !== currentUid) count++;
      });
      setUnreadCount(count);
    });
    return () => { unsubCases(); unsubHearings(); unsubMsgs(); };
  }, [currentUid]);

  // Filter hearings to only this client's cases
  const myCaseIds = new Set(cases.map((c) => c.id));
  const myHearings = hearings.filter((h) => myCaseIds.has(h.caseId) || h.clientId === currentUid);

  // Only UPCOMING hearings — exclude concluded verdicts (won/lost)
  const CONCLUDED = ["won", "lost"];
  const upcomingHearings = myHearings
    .filter((h) => !CONCLUDED.includes(h.timelineStatus))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const getCaseHearings = (caseId) => myHearings.filter((h) => h.caseId === caseId);

  const getCaseTab = (id) => activeCaseTab[id] || "details";
  const setCaseTab = (id, tab) => setActiveCaseTab((p) => ({ ...p, [id]: tab }));

  return (
    <div className="min-h-screen bg-darkBg text-white flex flex-col">
      {/* Top Bar */}
      <div className="flex justify-between items-center px-6 py-3 bg-black/60 border-b border-gray-800 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button onClick={() => { setMenuOpen(!menuOpen); setMenuSection(null); }} className="flex flex-col gap-1 p-2 hover:bg-white/5 rounded transition">
            <span className="w-5 h-0.5 bg-neonBlue block"></span>
            <span className="w-5 h-0.5 bg-neonBlue block"></span>
            <span className="w-5 h-0.5 bg-neonBlue block"></span>
          </button>
          <span className="text-neonBlue font-black text-lg">⚖️ Nyayadheesh</span>
          <span className="ml-2 bg-neonBlue/20 text-neonBlue text-xs font-black px-2 py-0.5 rounded-full border border-neonBlue/30 hidden md:inline">CLIENT PORTAL</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/chat")} className="relative bg-black border border-gray-700 hover:border-neonBlue px-4 py-2 rounded-lg text-sm font-bold transition">
            💬 New Messages
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-black">{unreadCount}</span>
            )}
          </button>
          <span className="text-xs text-gray-500 hidden md:block">Welcome, <span className="text-neonBlue font-bold">{currentName}</span></span>
        </div>
      </div>

      {/* New Hearing Popup Notification */}
      {newHearingAlert && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
          <div className="bg-black border border-neonBlue shadow-[0_0_30px_rgba(0,240,255,0.3)] rounded-2xl p-5 animate-pulse-once">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📅</span>
                <p className="text-neonBlue font-black text-lg">New Hearing Scheduled!</p>
              </div>
              <button onClick={() => setNewHearingAlert(null)} className="text-gray-500 hover:text-white text-xl leading-none">✕</button>
            </div>
            <p className="text-white font-bold">{new Date(newHearingAlert.date).toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</p>
            <p className="text-gray-400 text-sm mt-1 italic">"{newHearingAlert.note || "No note provided"}"</p>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setNewHearingAlert(null); setActiveTab("schedule"); setSelectedDate(new Date(newHearingAlert.date)); }}
                className="flex-1 bg-neonBlue text-black font-black py-2 rounded-lg hover:opacity-90 transition text-sm"
              >
                View in Calendar →
              </button>
              <button onClick={() => setNewHearingAlert(null)} className="px-4 py-2 border border-gray-700 text-gray-400 rounded-lg hover:border-gray-500 hover:text-white transition text-sm font-bold">
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Side Menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div className="w-72 bg-black border-r border-neonBlue/30 shadow-[5px_0_30px_rgba(0,240,255,0.1)] flex flex-col p-6">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-neonBlue font-black text-xl">☰ Home</h2>
              <button onClick={() => setMenuOpen(false)} className="text-gray-500 hover:text-white text-xl">✕</button>
            </div>
            {menuSection === null && (
              <ul className="space-y-2">
                {[
                  { icon: "📜", label: "Nyayasamhita Rules", action: () => setMenuSection("nyayasamhita") },
                  { icon: "📰", label: "Supreme Court News", action: () => setMenuSection("news") },
                  { icon: "🤖", label: "AI Legal Assistant", action: () => navigate("/ai-chat") },
                  { icon: "👤", label: "My Profile", action: () => { setMenuOpen(false); navigate("/profile"); } },
                ].map((item) => (
                  <li key={item.label} onClick={item.action} className="flex items-center gap-3 p-3 rounded-lg hover:bg-neonBlue/10 hover:text-neonBlue cursor-pointer transition border border-transparent hover:border-neonBlue/30">
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-bold">{item.label}</span>
                  </li>
                ))}
                <li onClick={handleLogout} className="flex items-center gap-3 p-3 rounded-lg hover:bg-red-500/10 hover:text-red-400 cursor-pointer transition border border-transparent hover:border-red-500/30 mt-8">
                  <span className="text-xl">🚪</span>
                  <span className="font-bold">Log Out</span>
                </li>
              </ul>
            )}
            {menuSection === "nyayasamhita" && (
              <div className="flex flex-col flex-1">
                <button onClick={() => setMenuSection(null)} className="text-gray-400 hover:text-white text-sm mb-4 text-left">← Back</button>
                <h3 className="text-neonBlue font-bold mb-4">📜 Nyayasamhita Rules</h3>
                <p className="text-gray-400 text-sm mb-4">Access the complete Bharatiya Nyaya Sanhita (BNS) 2023 — the new criminal code of India replacing IPC.</p>
                {[
                  { label: "📄 Bharatiya Nyaya Sanhita (BNS) 2023", url: "https://legislative.gov.in/sites/default/files/2023-12/BNS.pdf" },
                  { label: "📄 Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023", url: "https://legislative.gov.in/sites/default/files/2023-12/BNSS.pdf" },
                  { label: "📄 Bharatiya Sakshya Adhiniyam (BSA) 2023", url: "https://legislative.gov.in/sites/default/files/2023-12/BSA.pdf" },
                ].map((item, i) => (
                  <a key={i} href={item.url} target="_blank" rel="noreferrer" className={`${i === 0 ? "bg-neonBlue text-black" : "bg-neonBlue/10 text-neonBlue border border-neonBlue"} font-bold py-3 px-4 rounded-lg text-center hover:opacity-90 transition mb-3 text-sm`}>
                    {item.label}
                  </a>
                ))}
              </div>
            )}
            {menuSection === "news" && (
              <div className="flex flex-col flex-1 overflow-hidden">
                <button onClick={() => setMenuSection(null)} className="text-gray-400 hover:text-white text-sm mb-4 text-left">← Back</button>
                <h3 className="text-neonBlue font-bold mb-4">📰 Supreme Court News</h3>
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {SC_NEWS.map((n, i) => (
                    <div key={i} className="bg-white/5 border border-gray-800 rounded-lg p-3">
                      <p className="text-white text-sm font-bold leading-snug">{n.title}</p>
                      <p className="text-gray-500 text-xs mt-1">{n.date}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setMenuOpen(false)} />
        </div>
      )}

      {/* Main */}
      <div className="flex-1 p-6 md:p-10 max-w-6xl mx-auto w-full">
        {/* Banner */}
        <div className="bg-gradient-to-r from-neonBlue/10 to-transparent border border-neonBlue/30 rounded-2xl p-8 mb-8">
          <h1 className="text-4xl font-black text-neonBlue mb-2">Welcome to Nyayadheesh Platform ⚖️</h1>
          <p className="text-gray-400">Your complete legal case management dashboard.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-black/40 border border-gray-800 rounded-xl p-1 w-fit">
          {[{ key: "cases", label: "📁 My Cases" }, { key: "schedule", label: "📅 Upcoming Schedule" }].map((t) => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`px-6 py-2 rounded-lg font-bold text-sm transition ${activeTab === t.key ? "bg-neonBlue text-black shadow-[0_0_10px_rgba(0,240,255,0.3)]" : "text-gray-400 hover:text-white"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* MY CASES */}
        {activeTab === "cases" && (
          <div>
            {cases.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <p className="text-5xl mb-4">📂</p>
                <p className="text-xl font-bold">No cases registered yet.</p>
                <p className="text-sm mt-2">Click the button below to register your first case.</p>
              </div>
            ) : (
              cases.map((c) => {
                const caseHearings = getCaseHearings(c.id);
                const tab = getCaseTab(c.id);
                return (
                  <div key={c.id} className="bg-black/40 border border-gray-700 hover:border-neonBlue/50 rounded-2xl mb-6 overflow-hidden transition">
                    <div className="flex justify-between items-center p-5 border-b border-gray-800">
                      <div>
                        <p className="text-xl font-black text-white">{c.caseType}</p>
                        <p className="text-gray-500 text-sm">{c.court || c.jurisdiction} · Filed {new Date(c.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className={`px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
                        c.status === "accepted" ? "bg-green-500/10 text-green-400 border border-green-500/30" :
                        c.status === "pending" ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30" :
                        "bg-red-500/10 text-red-400 border border-red-500/30"
                      }`}>{c.status}</span>
                    </div>

                    {/* Sub-tabs */}
                    <div className="flex gap-1 px-5 pt-4 border-b border-gray-800">
                      {[
                        { key: "details", label: "📋 My Case" },
                        { key: "advocate", label: "👤 Advocate Details" },
                        { key: "timeline", label: "📊 Timeline / Progress" },
                        { key: "documents", label: "📎 Documents" },
                      ].map((t) => (
                        <button key={t.key} onClick={() => setCaseTab(c.id, t.key)}
                          className={`px-4 py-2 text-xs font-bold rounded-t-lg transition ${tab === t.key ? "bg-neonBlue/10 text-neonBlue border-t border-x border-neonBlue/30" : "text-gray-500 hover:text-white"}`}>
                          {t.label}
                        </button>
                      ))}
                    </div>

                    <div className="p-5">
                      {tab === "details" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="bg-black/40 p-4 rounded-lg border border-gray-800">
                            <p className="text-gray-500 text-xs font-bold uppercase mb-2">Case Information</p>
                            <p><span className="text-gray-400">Type:</span> <span className="text-white font-bold ml-2">{c.caseType}</span></p>
                            <p className="mt-1"><span className="text-gray-400">Court:</span> <span className="text-white ml-2">{c.court || c.jurisdiction}</span></p>
                            <p className="mt-1"><span className="text-gray-400">Act:</span> <span className="text-white ml-2">{c.legalAct}</span></p>
                            <p className="mt-1"><span className="text-gray-400">Section:</span> <span className="text-white ml-2">{c.legalSection}</span></p>
                          </div>
                          <div className="bg-black/40 p-4 rounded-lg border border-gray-800">
                            <p className="text-gray-500 text-xs font-bold uppercase mb-2">Matter Description</p>
                            <p className="text-gray-300 italic">"{c.matterType || c.description}"</p>
                          </div>
                          <div className="bg-black/40 p-4 rounded-lg border border-gray-800">
                            <p className="text-gray-500 text-xs font-bold uppercase mb-2">Petitioner</p>
                            <p className="text-white font-bold">{c.petitionerName}</p>
                            <p className="text-gray-400">{c.petitionerEmail}</p>
                            <p className="text-gray-400">{c.petitionerMobile}</p>
                          </div>
                          <div className="bg-black/40 p-4 rounded-lg border border-gray-800">
                            <p className="text-gray-500 text-xs font-bold uppercase mb-2">Respondent</p>
                            <p className="text-white font-bold">{c.respondentName}</p>
                            <p className="text-gray-400">{c.respondentEmail}</p>
                            <p className="text-gray-400">{c.respondentMobile}</p>
                          </div>
                        </div>
                      )}

                      {tab === "advocate" && (
                        c.status !== "accepted"
                          ? <p className="text-gray-500 italic text-center py-8">No advocate assigned yet. Your case is pending review.</p>
                          : <AdvocateInfo advocateId={c.advocateId} />
                      )}

                      {tab === "timeline" && (
                        caseHearings.length === 0
                          ? <p className="text-gray-500 italic text-center py-8">No timeline entries yet. Your advocate will update this.</p>
                          : (
                            <div className="relative pl-6">
                              <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-neonBlue/20"></div>
                              {caseHearings.map((h) => (
                                <div key={h.id} className="relative mb-6">
                                  <div className="absolute -left-4 top-1 w-3 h-3 rounded-full bg-neonBlue border-2 border-darkBg"></div>
                                  <div className="bg-black/40 border border-gray-800 rounded-lg p-4">
                                    <div className="flex justify-between items-start mb-2">
                                      <p className="font-bold text-white">{new Date(h.date).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</p>
                                      <span className={`text-xs font-black px-3 py-1 rounded-full uppercase ${
                                        h.timelineStatus === "success" ? "bg-green-500/20 text-green-400" :
                                        h.timelineStatus === "postponed" ? "bg-yellow-500/20 text-yellow-400" :
                                        h.timelineStatus === "won" ? "bg-neonBlue/20 text-neonBlue" :
                                        h.timelineStatus === "lost" ? "bg-red-500/20 text-red-400" :
                                        "bg-gray-500/20 text-gray-400"
                                      }`}>{h.timelineStatus || h.status}</span>
                                    </div>
                                    <p className="text-gray-400 text-sm italic">"{h.note}"</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )
                      )}

                      {tab === "documents" && <DocumentsSection caseId={c.id} navigate={navigate} />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* SCHEDULE — VIEW ONLY for client */}
        {activeTab === "schedule" && (
          <div>
            {(() => {
              const activeHearing = upcomingHearings.find(
                (h) => new Date(h.date) >= new Date(new Date().toDateString()) && (!h.timelineStatus || h.timelineStatus === "scheduled")
              );
              if (!activeHearing) return (
                <div className="bg-black/30 border border-gray-800 rounded-2xl p-6 mb-6 text-center">
                  <p className="text-3xl mb-2">⚖️</p>
                  <p className="text-gray-400 font-bold">"No upcoming hearings as of now"</p>
                  <p className="text-gray-600 text-sm mt-1">Your advocate will schedule the next hearing when ready.</p>
                </div>
              );
              return (
                <div className="bg-neonBlue/10 border border-neonBlue/40 rounded-2xl p-5 mb-6 flex items-center gap-4 shadow-[0_0_20px_rgba(0,240,255,0.08)]">
                  <div className="text-4xl">📅</div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Next Upcoming Hearing</p>
                    <p className="text-neonBlue font-black text-xl">
                      {new Date(activeHearing.date).toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
                    </p>
                    <p className="text-gray-400 text-sm mt-1 italic">"{activeHearing.note || "No note provided"}"</p>
                    <p className="text-gray-500 text-xs mt-1">{cases.find((c) => c.id === activeHearing.caseId)?.caseType || ""}</p>
                  </div>
                  <span className="bg-neonBlue/20 text-neonBlue text-xs font-black px-3 py-1 rounded-full border border-neonBlue/30 uppercase">scheduled</span>
                </div>
              );
            })()}

            <div className="flex flex-col md:flex-row gap-8">
              {/* Calendar */}
              <div className="bg-black/40 border border-neonBlue/30 rounded-2xl p-6 flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-neonBlue font-bold">📅 Hearing Calendar</h2>
                  <span className="bg-gray-800 text-gray-400 text-xs font-black px-2 py-1 rounded-full">👁 VIEW ONLY</span>
                </div>
                <p className="text-gray-500 text-xs mb-4">Blue = upcoming &nbsp;·&nbsp; Click any date to see details.</p>
                <div className="bg-white p-3 rounded-xl text-black">
                  <Calendar
                    onChange={setSelectedDate}
                    value={selectedDate}
                    tileClassName={({ date, view }) => {
                      if (view !== "month") return null;
                      const ds = date.toDateString();
                      const hasUpcoming = upcomingHearings.find((h) => new Date(h.date).toDateString() === ds);
                      const hasConcluded = myHearings.find(
                        (h) => new Date(h.date).toDateString() === ds && ["won","lost","success"].includes(h.timelineStatus)
                      );
                      if (hasUpcoming) return "bg-neonBlue/50 text-black font-bold rounded-full";
                      if (hasConcluded) return "bg-gray-500/40 text-black rounded-full";
                      return null;
                    }}
                    className="border-none w-full"
                  />
                </div>
                <div className="flex gap-4 mt-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-neonBlue/50 inline-block"></span> Upcoming</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-gray-500/40 inline-block"></span> Concluded</span>
                </div>
              </div>

              {/* Hearing Details for selected date */}
              <div className="bg-black/40 border border-gray-700 rounded-2xl p-6 flex-1">
                <h2 className="text-neonBlue font-bold mb-1">
                  {selectedDate.toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
                </h2>
                <p className="text-gray-600 text-xs mb-4">All hearings on this date</p>

                {myHearings.filter((h) => new Date(h.date).toDateString() === selectedDate.toDateString()).length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-gray-600 text-4xl mb-3">📆</p>
                    <p className="text-gray-500 text-sm">No hearings on this date.</p>
                    <p className="text-gray-600 text-xs mt-1">Click a highlighted date on the calendar.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myHearings
                      .filter((h) => new Date(h.date).toDateString() === selectedDate.toDateString())
                      .map((h) => {
                        const c = cases.find((cs) => cs.id === h.caseId);
                        const concluded = ["won","lost","success","postponed"].includes(h.timelineStatus);
                        return (
                          <div key={h.id} className={`border rounded-xl p-4 ${
                            concluded ? "bg-black/30 border-gray-800" : "bg-black/60 border-neonBlue/30"
                          }`}>
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-black text-white text-base">{c?.caseType || "Case"}</p>
                                <p className="text-gray-400 text-xs">{c?.court || c?.jurisdiction}</p>
                              </div>
                              <span className={`text-xs font-black px-3 py-1 rounded-full uppercase ${
                                h.timelineStatus === "won" ? "bg-neonBlue/20 text-neonBlue" :
                                h.timelineStatus === "lost" ? "bg-red-500/20 text-red-400" :
                                h.timelineStatus === "success" ? "bg-green-500/20 text-green-400" :
                                h.timelineStatus === "postponed" ? "bg-yellow-500/20 text-yellow-400" :
                                "bg-neonBlue/20 text-neonBlue"
                              }`}>{h.timelineStatus || "scheduled"}</span>
                            </div>
                            <div className={`border-l-4 p-3 rounded-r-lg mt-2 ${
                              concluded ? "border-gray-600 bg-black/30" : "border-neonBlue bg-black/60"
                            }`}>
                              <p className="text-gray-300 text-sm italic">"{h.note || "No note provided"}"</p>
                            </div>
                          </div>
                        );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Full History — all hearings sorted newest first */}
            {myHearings.length > 0 && (
              <div className="mt-10">
                <h2 className="text-white font-black text-xl mb-4 border-b border-gray-800 pb-2">📋 All Hearing History</h2>
                <div className="space-y-3">
                  {[...myHearings]
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map((h) => {
                      const c = cases.find((cs) => cs.id === h.caseId);
                      const isUpcoming = !["won","lost","success"].includes(h.timelineStatus);
                      return (
                        <div key={h.id} className={`flex items-start gap-4 p-4 rounded-xl border ${
                          isUpcoming ? "border-neonBlue/20 bg-neonBlue/5" : "border-gray-800 bg-black/20"
                        }`}>
                          <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                            h.timelineStatus === "won" ? "bg-neonBlue" :
                            h.timelineStatus === "lost" ? "bg-red-500" :
                            h.timelineStatus === "success" ? "bg-green-500" :
                            h.timelineStatus === "postponed" ? "bg-yellow-500" :
                            "bg-neonBlue"
                          }`} />
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <p className="text-white font-bold text-sm">
                                {new Date(h.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                                <span className="text-gray-500 font-normal ml-2 text-xs">{c?.caseType}</span>
                              </p>
                              <span className={`text-xs font-black px-2 py-0.5 rounded-full uppercase ${
                                h.timelineStatus === "won" ? "bg-neonBlue/20 text-neonBlue" :
                                h.timelineStatus === "lost" ? "bg-red-500/20 text-red-400" :
                                h.timelineStatus === "success" ? "bg-green-500/20 text-green-400" :
                                h.timelineStatus === "postponed" ? "bg-yellow-500/20 text-yellow-400" :
                                "bg-gray-500/20 text-gray-400"
                              }`}>{h.timelineStatus || "scheduled"}</span>
                            </div>
                            <p className="text-gray-500 text-xs mt-1 italic">"{h.note || "No note"}"</p>
                          </div>
                        </div>
                      );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate("/new-case")}
        className="fixed bottom-8 right-8 bg-neonBlue text-black font-black px-6 py-4 rounded-full shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:shadow-[0_0_35px_rgba(0,240,255,0.6)] hover:scale-105 transition z-30"
      >
        + New Case Registration
      </button>
    </div>
  );
}

export default ClientDashboard;
