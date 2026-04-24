import { useState, useEffect, useRef } from "react";
import { db } from "../firebase";
import { collection, addDoc, onSnapshot, query, orderBy, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { userCollectionRef } from "../lib/userStore";

function Chat() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [partnerInfo, setPartnerInfo] = useState(null);
  const [hasConnection, setHasConnection] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);
  const navigate = useNavigate();

  const currentUid = localStorage.getItem("mock_uid");
  const currentRole = localStorage.getItem("mock_role");
  const themeColor = currentRole === "advocate" ? "neonPurple" : "neonBlue";
  const borderClass = currentRole === "advocate" ? "border-neonPurple" : "border-neonBlue";
  const textClass = currentRole === "advocate" ? "text-neonPurple" : "text-neonBlue";

  useEffect(() => {
    const init = async () => {
      try {
        const caseSnap = await getDocs(collection(db, "cases"));
        let connected = false;
        let partnerId = null;

        caseSnap.forEach((doc) => {
          const d = doc.data();
          if (d.status === "accepted") {
            if (currentRole === "client" && d.clientId === currentUid) {
              connected = true;
              partnerId = d.advocateId;
            }
            if (currentRole === "advocate" && d.advocateId === currentUid) {
              connected = true;
              partnerId = d.clientId;
            }
          }
        });

        setHasConnection(connected);

        if (connected && partnerId) {
          // partner is the opposite role
          const partnerCollection = currentRole === "client" ? "advocates" : "clients";
          const partnerRole = partnerCollection === "advocates" ? "advocate" : "client";
          const userSnap = await getDocs(userCollectionRef(db, partnerRole));
          userSnap.forEach((doc) => {
            const d = doc.data();
            if (d.uid === partnerId || doc.id === partnerId) setPartnerInfo(d);
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [currentUid, currentRole]);

  useEffect(() => {
    if (!hasConnection) return;
    const q = query(collection(db, "messages"), orderBy("timestamp"));
    const unsub = onSnapshot(q, (snap) => {
      const data = [];
      snap.forEach((doc) => data.push({ id: doc.id, ...doc.data() }));
      setMessages(data);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
    return () => unsub();
  }, [hasConnection]);

  const sendMessage = async () => {
    if (!message.trim()) return;
    await addDoc(collection(db, "messages"), {
      text: message.trim(),
      sender: currentUid,
      timestamp: new Date(),
      type: "user",
    });
    setMessage("");
  };

  const goBack = () => navigate(currentRole === "advocate" ? "/advocate-dashboard" : "/client-dashboard");

  const getPartnerName = () => {
    if (!partnerInfo) return "Your " + (currentRole === "client" ? "Advocate" : "Client");
    if (partnerInfo.name) return partnerInfo.name;
    return `${partnerInfo.firstName || ""} ${partnerInfo.lastName || ""}`.trim();
  };

  const getPartnerEmail = () => partnerInfo?.email || "";

  if (loading) return (
    <div className="h-screen bg-darkBg text-white flex items-center justify-center">
      <p className="text-gray-400 animate-pulse">Establishing secure connection...</p>
    </div>
  );

  if (!hasConnection) return (
    <div className="h-screen flex flex-col bg-darkBg text-white p-10 justify-center items-center text-center">
      <div className="max-w-md p-8 bg-black/40 border border-red-500/30 rounded-2xl">
        <h2 className="text-2xl font-black text-red-400 mb-4">No Active Connection 🚫</h2>
        <p className="text-gray-400 mb-8">You must have an accepted case to access messages. Please wait for your case to be accepted.</p>
        <button onClick={goBack} className="bg-gray-800 text-white font-bold px-6 py-3 rounded-lg hover:bg-gray-700 transition border border-gray-600">
          ← Return to Dashboard
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-darkBg text-white">
      {/* Header */}
      <div className={`flex items-center justify-between px-6 py-4 bg-black/60 border-b ${borderClass}/30`}>
        <div className="flex items-center gap-4">
          <button onClick={goBack} className="text-gray-400 hover:text-white font-bold transition">← Back</button>
          <div>
            <h2 className={`text-xl font-black ${textClass}`}>🔒 Secure Messages</h2>
            <p className="text-gray-500 text-xs">End-to-end encrypted · Real-time</p>
          </div>
        </div>

        {/* Partner Info with clickable email */}
        {partnerInfo && (
          <div className={`bg-black/40 border ${borderClass}/20 rounded-xl px-4 py-2 text-right`}>
            <p className="text-white font-bold text-sm">{getPartnerName()}</p>
            <a
              href={`mailto:${getPartnerEmail()}?subject=Regarding Your Case on Nyayadheesh Platform`}
              className={`${textClass} text-xs hover:underline font-bold`}
              title="Click to send email"
            >
              ✉️ {getPartnerEmail()}
            </a>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3">
        {messages.length === 0 && (
          <p className="text-gray-600 m-auto text-center">
            No messages yet.<br />
            <span className="text-xs">Secure connection established. Start the conversation.</span>
          </p>
        )}
        {messages.map((m) => {
          const isMe = m.sender === currentUid;
          const isSystem = m.type === "system";
          if (isSystem) return (
            <div key={m.id} className="flex justify-center">
              <div className="bg-white/5 border border-gray-700 text-gray-400 text-xs px-4 py-2 rounded-full max-w-md text-center">
                {m.text}
              </div>
            </div>
          );
          return (
            <div key={m.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
              <span className={`text-xs mb-1 ${isMe ? textClass : "text-gray-500"}`}>
                {isMe ? "You" : getPartnerName()}
              </span>
              <div className={`px-4 py-3 rounded-2xl max-w-[70%] text-sm ${
                isMe
                  ? `bg-${themeColor}/20 border border-${themeColor}/40 text-white rounded-br-none`
                  : "bg-white/5 border border-gray-700 text-white rounded-bl-none"
              }`}>
                {m.text}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className={`flex gap-3 p-4 border-t border-gray-800 bg-black/40`}>
        <input
          className={`flex-1 p-4 bg-black border border-gray-700 focus:${borderClass} rounded-xl text-white outline-none transition`}
          placeholder="Type your secure message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className={`bg-${themeColor === "neonBlue" ? "neonBlue text-black" : "neonPurple text-white"} font-black px-8 rounded-xl shadow-[0_0_15px_rgba(0,240,255,0.2)] hover:opacity-80 transition`}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default Chat;
