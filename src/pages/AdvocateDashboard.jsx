import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { collection, onSnapshot, doc, updateDoc, addDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

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

function AdvocateDashboard() {
  const navigate = useNavigate();
  const [pendingCases, setPendingCases] = useState([]);
  const [myCases, setMyCases] = useState([]);
  const [hearings, setHearings] = useState([]);
  const [activeTab, setActiveTab] = useState("cases");
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuSection, setMenuSection] = useState(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [allCasesDebug, setAllCasesDebug] = useState([]);

  const currentUid = localStorage.getItem("mock_uid");
  const currentName = localStorage.getItem("mock_name") || "Advocate";

  const handleLogout = async () => { await signOut(auth); localStorage.clear(); navigate("/"); };

  useEffect(() => {
    if (!currentUid) return;
    // Cases: pending = requested to ME (check both uid field and doc id)
    const unsubCases = onSnapshot(collection(db, "cases"), (snap) => {
      const pending = [], mine = [];
      snap.forEach((d) => {
        const data = d.data();
        const reqId = data.requestedAdvocateId;
        const advId = data.advocateId;
        // match against currentUid regardless of whether it was stored as uid or doc id
        if (data.status === "pending" && reqId === currentUid)
          pending.push({ id: d.id, ...data });
        else if (data.status === "accepted" && advId === currentUid)
          mine.push({ id: d.id, ...data });
      });
      setPendingCases(pending);
      setMyCases(mine);
      // debug: store all cases so we can see what requestedAdvocateId values exist
      const all = [];
      snap.forEach((d) => all.push({ id: d.id, ...d.data() }));
      setAllCasesDebug(all);
    });

    // Hearings: only mine
    const unsubHearings = onSnapshot(collection(db, "hearings"), (snap) => {
      const data = [];
      snap.forEach((d) => {
        if (d.data().advocateId === currentUid) data.push({ id: d.id, ...d.data() });
      });
      data.sort((a, b) => new Date(a.date) - new Date(b.date));
      setHearings(data);
    });

    // Unread messages
    const unsubMsgs = onSnapshot(collection(db, "messages"), (snap) => {
      let count = 0;
      snap.forEach((d) => { if (d.data().sender !== currentUid) count++; });
      setUnreadCount(count);
    });

    return () => { unsubCases(); unsubHearings(); unsubMsgs(); };
  }, [currentUid]);

  const handleAccept = async (caseId, clientId) => {
    await updateDoc(doc(db, "cases", caseId), {
      status: "accepted",
      advocateId: currentUid,
    });
    await addDoc(collection(db, "messages"), {
      text: "✅ Your case has been accepted by your Advocate. You are now connected!",
      sender: currentUid,
      recipientId: clientId,
      type: "system",
      timestamp: new Date(),
    });
  };

  const handleReject = async (caseId, clientId) => {
    await updateDoc(doc(db, "cases", caseId), { status: "rejected" });
    await addDoc(collection(db, "messages"), {
      text: "❌ We regret to inform you that your case request has been declined by the advocate. We apologize for the inconvenience.",
      sender: currentUid,
      recipientId: clientId,
      type: "system",
      timestamp: new Date(),
    });
  };

  const formatSlide = (h) => {
    const d = new Date(h.date);
    return {
      dateStr: `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`,
      day: d.toLocaleDateString("en-US", { weekday: "long" }),
      note: h.note || "No note provided",
    };
  };

  return (
    <div className="min-h-screen bg-darkBg text-white flex flex-col">

      {/* Top Bar */}
      <div className="flex justify-between items-center px-6 py-3 bg-black/60 border-b border-gray-800 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button onClick={() => { setMenuOpen(!menuOpen); setMenuSection(null); }}
            className="flex flex-col gap-1 p-2 hover:bg-white/5 rounded transition">
            <span className="w-5 h-0.5 bg-neonPurple block" />
            <span className="w-5 h-0.5 bg-neonPurple block" />
            <span className="w-5 h-0.5 bg-neonPurple block" />
          </button>
          <div>
            <span className="text-neonPurple font-black text-lg">⚖️ Nyayadheesh</span>
            <span className="ml-3 bg-neonPurple/20 text-neonPurple text-xs font-black px-2 py-0.5 rounded-full border border-neonPurple/30">
              ADVOCATE PORTAL
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/chat")}
            className="relative bg-black border border-gray-700 hover:border-neonPurple px-4 py-2 rounded-lg text-sm font-bold transition">
            💬 Messages
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-black">
                {unreadCount}
              </span>
            )}
          </button>
          <span className="text-xs text-gray-500 hidden md:block">
            Welcome, <span className="text-neonPurple font-bold">{currentName}</span>
          </span>
        </div>
      </div>

      {/* Side Menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div className="w-72 bg-black border-r border-neonPurple/30 flex flex-col p-6">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-neonPurple font-black text-xl">☰ Home</h2>
              <button onClick={() => setMenuOpen(false)} className="text-gray-500 hover:text-white text-xl">✕</button>
            </div>
            {menuSection === null && (
              <ul className="space-y-2">
                {[
                  { icon: "📜", label: "Nyayasamhita Rules", action: () => setMenuSection("nyayasamhita") },
                  { icon: "📰", label: "Supreme Court News", action: () => setMenuSection("news") },
                  { icon: "🤖", label: "AI Legal Assistant", action: () => navigate("/ai-chat") },
                  { icon: "⚖️", label: "My Profile", action: () => { setMenuOpen(false); navigate("/profile"); } },
                ].map((item) => (
                  <li key={item.label} onClick={item.action}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-neonPurple/10 hover:text-neonPurple cursor-pointer transition border border-transparent hover:border-neonPurple/30">
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-bold">{item.label}</span>
                  </li>
                ))}
                <li onClick={handleLogout}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-red-500/10 hover:text-red-400 cursor-pointer transition border border-transparent hover:border-red-500/30 mt-8">
                  <span className="text-xl">🚪</span>
                  <span className="font-bold">Log Out</span>
                </li>
              </ul>
            )}
            {menuSection === "nyayasamhita" && (
              <div className="flex flex-col flex-1">
                <button onClick={() => setMenuSection(null)} className="text-gray-400 text-sm mb-4 text-left">← Back</button>
                <h3 className="text-neonPurple font-bold mb-4">📜 Nyayasamhita Rules</h3>
                {[
                  { label: "📄 Bharatiya Nyaya Sanhita (BNS) 2023", url: "https://legislative.gov.in/sites/default/files/2023-12/BNS.pdf" },
                  { label: "📄 BNSS 2023", url: "https://legislative.gov.in/sites/default/files/2023-12/BNSS.pdf" },
                  { label: "📄 BSA 2023", url: "https://legislative.gov.in/sites/default/files/2023-12/BSA.pdf" },
                ].map((item, i) => (
                  <a key={i} href={item.url} target="_blank" rel="noreferrer"
                    className={`${i === 0 ? "bg-neonPurple text-white" : "bg-neonPurple/10 text-neonPurple border border-neonPurple"} font-bold py-3 px-4 rounded-lg text-center hover:opacity-90 transition mb-3 text-sm`}>
                    {item.label}
                  </a>
                ))}
              </div>
            )}
            {menuSection === "news" && (
              <div className="flex flex-col flex-1 overflow-hidden">
                <button onClick={() => setMenuSection(null)} className="text-gray-400 text-sm mb-4 text-left">← Back</button>
                <h3 className="text-neonPurple font-bold mb-4">📰 Supreme Court News</h3>
                <div className="flex-1 overflow-y-auto space-y-3">
                  {SC_NEWS.map((n, i) => (
                    <div key={i} className="bg-white/5 border border-gray-800 rounded-lg p-3">
                      <p className="text-white text-sm font-bold">{n.title}</p>
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
        <div className="bg-gradient-to-r from-neonPurple/10 to-transparent border border-neonPurple/30 rounded-2xl p-8 mb-8">
          <h1 className="text-4xl font-black text-neonPurple mb-1">Welcome to Nyayadheesh Platform ⚖️</h1>
          <p className="text-gray-400 text-sm">Advocate Portal — Manage your cases, schedule hearings, and communicate with clients in real-time.</p>
          {/* Debug strip — shows your current uid so you can verify it matches what client saved */}
          <div className="mt-4 bg-black/60 border border-gray-700 rounded-lg px-4 py-2 text-xs text-gray-500 font-mono break-all">
            🔑 Your UID: <span className="text-yellow-400">{currentUid || "NOT SET — please log out and log in again"}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-black/40 border border-gray-800 rounded-xl p-1 w-fit">
          {[{ key: "cases", label: "📁 My Cases" }, { key: "hearings", label: "📅 Upcoming Hearings" }].map((t) => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`px-6 py-2 rounded-lg font-bold text-sm transition ${activeTab === t.key ? "bg-neonPurple text-white shadow-[0_0_10px_rgba(157,0,255,0.3)]" : "text-gray-400 hover:text-white"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* MY CASES */}
        {activeTab === "cases" && (
          <div>
            {/* Active Cases */}
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xl font-black text-neonPurple">My Active Cases</h2>
              <span className="bg-neonPurple/20 text-neonPurple text-xs font-black px-2 py-1 rounded-full">{myCases.length}</span>
            </div>
            {myCases.length === 0 ? (
              <p className="text-gray-500 italic mb-10 bg-black/20 border border-gray-800 rounded-xl p-6 text-center">
                No active cases yet. Accept a pending request to get started.
              </p>
            ) : (
              <div className="space-y-4 mb-10">
                {myCases.map((c) => (
                  <div key={c.id} className="bg-black/40 border border-neonPurple/30 hover:border-neonPurple rounded-xl p-5 flex justify-between items-center transition">
                    <div className="flex-1">
                      <p className="text-white font-black text-lg">{c.caseType}</p>
                      <p className="text-gray-400 text-sm">{c.court || c.jurisdiction}</p>
                      <p className="text-gray-500 text-xs mt-1 italic">"{c.matterType || c.description}"</p>
                    </div>
                    <button
                      onClick={() => { localStorage.setItem("caseId", c.id); navigate("/case-view"); }}
                      className="bg-neonPurple text-white font-bold px-5 py-2 rounded-lg hover:opacity-80 transition ml-4 whitespace-nowrap">
                      Open Case →
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Pending Requests */}
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xl font-black text-yellow-400">Pending Case Requests</h2>
              <span className="bg-yellow-500/20 text-yellow-400 text-xs font-black px-2 py-1 rounded-full">{pendingCases.length}</span>
              <span className="text-xs text-gray-500">(Clients who selected you)</span>
            </div>
            {pendingCases.length === 0 ? (
              <>
                <p className="text-gray-500 italic bg-black/20 border border-gray-800 rounded-xl p-6 text-center mb-4">
                  No pending requests at the moment.
                </p>
                {/* DEBUG PANEL — remove after fixing */}
                <div className="bg-black/60 border border-yellow-500/30 rounded-xl p-4 text-xs font-mono">
                  <p className="text-yellow-400 font-bold mb-2">🔍 Debug — All cases in DB ({allCasesDebug.length} total):</p>
                  {allCasesDebug.length === 0 && <p className="text-gray-500">No cases found in database at all.</p>}
                  {allCasesDebug.map((c) => (
                    <div key={c.id} className="mb-2 border-b border-gray-800 pb-2">
                      <p className="text-white">{c.caseType} — status: <span className="text-yellow-400">{c.status}</span></p>
                      <p className="text-gray-400">requestedAdvocateId: <span className="text-orange-400 break-all">{c.requestedAdvocateId || "MISSING"}</span></p>
                      <p className="text-gray-400">Match: <span className={c.requestedAdvocateId === currentUid ? "text-green-400" : "text-red-400"}>{c.requestedAdvocateId === currentUid ? "✓ MATCHES your UID" : "✗ does NOT match"}</span></p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="space-y-4">
                {pendingCases.map((c) => (
                  <div key={c.id} className="bg-black/40 border border-gray-700 hover:border-gray-500 rounded-xl p-5 transition">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 mr-4">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-black text-lg">{c.caseType}</p>
                          <span className="bg-yellow-500/20 text-yellow-400 text-xs font-bold px-2 py-0.5 rounded-full">Pending</span>
                        </div>
                        <p className="text-gray-400 text-sm mb-1">{c.court || c.jurisdiction}</p>
                        <p className="text-gray-300 bg-black/60 p-3 rounded-lg border border-gray-800 italic text-sm">
                          "{c.matterType || c.description}"
                        </p>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-500">
                          <span>Petitioner: {c.petitionerName}</span>
                          <span>Act: {c.legalAct}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-3 shrink-0">
                        <button onClick={() => handleAccept(c.id, c.clientId)}
                          className="w-28 py-2 bg-green-500/20 text-green-400 border border-green-500 rounded-lg font-bold hover:bg-green-500 hover:text-black transition text-sm">
                          ✓ Accept
                        </button>
                        <button onClick={() => handleReject(c.id, c.clientId)}
                          className="w-28 py-2 bg-red-500/20 text-red-400 border border-red-500 rounded-lg font-bold hover:bg-red-500 hover:text-black transition text-sm">
                          ✕ Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* UPCOMING HEARINGS — Advocate sets these, view is read-only here */}
        {activeTab === "hearings" && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-neonPurple/10 border border-neonPurple/30 rounded-xl px-5 py-3 mb-6 flex items-center gap-2 text-sm">
              <span className="text-neonPurple font-black">⚖️ ADVOCATE VIEW</span>
              <span className="text-gray-400">— You schedule hearings from inside each case. This tab shows your upcoming schedule.</span>
            </div>

            {hearings.length === 0 ? (
              <div className="text-center py-20 text-gray-500 bg-black/20 border border-gray-800 rounded-2xl">
                <p className="text-5xl mb-4">📅</p>
                <p className="text-xl font-bold">No hearings scheduled yet.</p>
                <p className="text-sm mt-2">Open an active case → Schedule Hearing tab to add one.</p>
                {myCases.length > 0 && (
                  <button onClick={() => setActiveTab("cases")} className="mt-6 bg-neonPurple text-white font-bold px-6 py-2 rounded-lg hover:opacity-80 transition">
                    Go to My Cases →
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-black/40 border border-neonPurple/30 rounded-2xl p-8 shadow-[0_0_20px_rgba(157,0,255,0.1)]">
                {(() => {
                  const h = hearings[slideIndex];
                  const f = formatSlide(h);
                  return (
                    <div className="text-center">
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-4">
                        Hearing {slideIndex + 1} of {hearings.length}
                      </p>
                      <div className="text-5xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-neonPurple to-pink-500">
                        {f.dateStr}
                      </div>
                      <div className="text-2xl font-bold text-gray-300 mb-6">{f.day}</div>
                      <div className="bg-gray-900 border-l-4 border-neonPurple p-4 text-left rounded-r-lg mb-6">
                        <p className="text-white italic">Note: {f.note}</p>
                      </div>
                      <span className={`text-xs font-black px-4 py-2 rounded-full uppercase ${
                        h.timelineStatus === "success" ? "bg-green-500/20 text-green-400" :
                        h.timelineStatus === "postponed" ? "bg-yellow-500/20 text-yellow-400" :
                        h.timelineStatus === "won" ? "bg-neonBlue/20 text-neonBlue" :
                        h.timelineStatus === "lost" ? "bg-red-500/20 text-red-400" :
                        "bg-gray-500/20 text-gray-400"
                      }`}>
                        {h.timelineStatus || h.status || "scheduled"}
                      </span>
                    </div>
                  );
                })()}
                <div className="flex justify-center items-center gap-6 mt-8">
                  <button onClick={() => setSlideIndex((i) => (i - 1 + hearings.length) % hearings.length)}
                    className="px-5 py-2 bg-neonPurple/20 border border-neonPurple text-neonPurple rounded-full hover:bg-neonPurple hover:text-white transition font-bold">←</button>
                  <span className="text-gray-400 text-sm font-bold">{slideIndex + 1} / {hearings.length}</span>
                  <button onClick={() => setSlideIndex((i) => (i + 1) % hearings.length)}
                    className="px-5 py-2 bg-neonPurple/20 border border-neonPurple text-neonPurple rounded-full hover:bg-neonPurple hover:text-white transition font-bold">→</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdvocateDashboard;
