import { useState } from "react";
import { db, auth } from "../firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { setDoc, addDoc, collection, getDoc } from "firebase/firestore";
import { userDocRef } from "../lib/userStore";

const ADVOCATE = {
  email: "advocate.demo@nyayadheesh.com",
  password: "Demo@1234",
  name: "Rajesh Kumar Sharma",
  barId: "BAR/MH/2018/042",
  state: "Maharashtra",
  dob: "1985-06-15",
  age: 39,
  education: "LLB, LLM — Government Law College, Mumbai",
  practiceCourtType: "High Court",
  yearsActive: "7",
  mobile: "+91 98765 43210",
  govtId: "AADHAAR-1234-5678-9012",
  address: "Chamber No. 14, High Court Annexe, Mumbai - 400032",
  role: "advocate",
};

const CLIENTS = [
  {
    email: "client1.demo@nyayadheesh.com",
    password: "Demo@1234",
    firstName: "Priya", lastName: "Mehta", name: "Priya Mehta",
    contact: "+91 91234 56789", govtId: "PAN-ABCPM1234D", city: "Mumbai",
    role: "client",
  },
  {
    email: "client2.demo@nyayadheesh.com",
    password: "Demo@1234",
    firstName: "Arjun", lastName: "Nair", name: "Arjun Nair",
    contact: "+91 87654 32109", govtId: "AADHAAR-9876-5432-1098", city: "Pune",
    role: "client",
  },
];

// Get or create a Firebase Auth user, return their uid
async function getOrCreateUid(email, password) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;
    await signOut(auth);
    return uid;
  } catch (err) {
    if (err.code === "auth/email-already-in-use") {
      // Sign in to get the uid
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;
      await signOut(auth);
      return uid;
    }
    throw err;
  }
}

function SeedDB() {
  const [log, setLog] = useState([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  const L = (msg, type = "info") =>
    setLog((p) => [...p, { msg, type, t: new Date().toLocaleTimeString() }]);

  const runSeed = async () => {
    setRunning(true);
    setLog([]);
    L("🌱 Starting seed...", "info");

    try {
      // ── Advocate ──────────────────────────────────────────────────────────
      L(`👤 Creating advocate: ${ADVOCATE.name}`, "info");
      const advUid = await getOrCreateUid(ADVOCATE.email, ADVOCATE.password);
      L(`   uid = ${advUid}`, "info");

      const advRef = userDocRef(db, "advocate", advUid);
      const advSnap = await getDoc(advRef);
      if (!advSnap.exists()) {
        const { email, password, ...profile } = ADVOCATE;
        await setDoc(advRef, { uid: advUid, email, ...profile, createdAt: new Date().toISOString() });
        L(`✅ Advocate saved → advocates/${advUid}`, "success");
      } else {
        L(`⏭ Advocate already in DB`, "warn");
      }

      // ── Clients ───────────────────────────────────────────────────────────
      const clientUids = [];
      for (const client of CLIENTS) {
        L(`👤 Creating client: ${client.name}`, "info");
        const uid = await getOrCreateUid(client.email, client.password);
        L(`   uid = ${uid}`, "info");

        const ref = userDocRef(db, "client", uid);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          const { email, password, ...profile } = client;
          await setDoc(ref, { uid, email, ...profile, createdAt: new Date().toISOString() });
          L(`✅ Client saved → clients/${uid}`, "success");
        } else {
          L(`⏭ Client already in DB`, "warn");
        }
        clientUids.push(uid);
      }

      // ── Case 1: Civil Suit (accepted) ─────────────────────────────────────
      L("📁 Creating Case 1: Civil Suit (accepted)...", "info");
      const case1 = await addDoc(collection(db, "cases"), {
        clientId: clientUids[0],
        requestedAdvocateId: advUid,
        advocateId: advUid,
        status: "accepted",
        caseType: "Civil Suit",
        jurisdiction: "High Court",
        court: "High Court",
        matterType: "Property dispute regarding ancestral land in Thane district. Petitioner claims rightful ownership based on registered will dated 2018.",
        description: "Property dispute regarding ancestral land in Thane district.",
        legalAct: "Transfer of Property Act, 1882",
        legalSection: "Section 9 - Court to try all civil suits unless barred",
        petitionerName: "Priya Mehta", petitionerGender: "Female", petitionerDOB: "1990-03-22",
        petitionerMobile: "+91 91234 56789", petitionerEmail: "client1.demo@nyayadheesh.com",
        petitionerAddress: "Flat 4B, Shanti Nagar, Thane West - 400601",
        respondentName: "Suresh Mehta", respondentGender: "Male", respondentDOB: "1955-07-10",
        respondentMobile: "+91 99887 76655", respondentEmail: "suresh.mehta@example.com",
        respondentAddress: "12, Old Colony Road, Thane East - 400603",
        createdAt: new Date(Date.now() - 30 * 864e5).toISOString(),
      });
      L(`✅ Case 1 created: ${case1.id}`, "success");

      // ── Case 2: Criminal Appeal (pending) ─────────────────────────────────
      L("📁 Creating Case 2: Criminal Appeal (pending)...", "info");
      await addDoc(collection(db, "cases"), {
        clientId: clientUids[1],
        requestedAdvocateId: advUid,
        advocateId: null,
        status: "pending",
        caseType: "Criminal Appeal",
        jurisdiction: "District Court",
        court: "District Court",
        matterType: "Appeal against conviction under Section 420 IPC. Accused claims false implication by business partner.",
        description: "Appeal against conviction under Section 420 IPC.",
        legalAct: "Bharatiya Nyaya Sanhita, 2023",
        legalSection: "Section 374 - Appeals from convictions",
        petitionerName: "Arjun Nair", petitionerGender: "Male", petitionerDOB: "1988-11-05",
        petitionerMobile: "+91 87654 32109", petitionerEmail: "client2.demo@nyayadheesh.com",
        petitionerAddress: "22, Koregaon Park, Pune - 411001",
        respondentName: "State of Maharashtra", respondentGender: "Other",
        respondentMobile: "", respondentEmail: "state.prosecution@mah.gov.in",
        respondentAddress: "District Court, Pune - 411001",
        createdAt: new Date(Date.now() - 5 * 864e5).toISOString(),
      });
      L(`✅ Case 2 created (pending)`, "success");

      // ── Hearings for Case 1 ───────────────────────────────────────────────
      L("📅 Creating hearings...", "info");
      const hearings = [
        {
          date: new Date(Date.now() - 20 * 864e5).toDateString(),
          note: "10:00 AM — High Court Room 7. First hearing for case admission and preliminary arguments.",
          timelineStatus: "success",
          createdAt: new Date(Date.now() - 25 * 864e5).toISOString(),
        },
        {
          date: new Date(Date.now() - 10 * 864e5).toDateString(),
          note: "11:30 AM — High Court Room 3. Evidence submission and document verification.",
          timelineStatus: "postponed",
          createdAt: new Date(Date.now() - 15 * 864e5).toISOString(),
        },
        {
          date: new Date(Date.now() + 15 * 864e5).toDateString(),
          note: "10:00 AM — High Court Room 7. Final arguments and judgment expected.",
          timelineStatus: "scheduled",
          createdAt: new Date().toISOString(),
        },
      ];
      for (const h of hearings) {
        await addDoc(collection(db, "hearings"), {
          caseId: case1.id,
          clientId: clientUids[0],
          advocateId: advUid,
          status: "scheduled",
          ...h,
        });
        L(`✅ Hearing: ${h.date} — ${h.timelineStatus}`, "success");
      }

      // ── Messages ──────────────────────────────────────────────────────────
      L("💬 Creating messages...", "info");
      const msgs = [
        { text: "✅ Your case has been accepted by your Advocate. You are now connected!", sender: advUid, recipientId: clientUids[0], type: "system", timestamp: new Date(Date.now() - 29 * 864e5) },
        { text: "Hello Priya, I have reviewed your case. The property dispute has strong grounds. Please bring the original will document.", sender: advUid, recipientId: clientUids[0], type: "user", timestamp: new Date(Date.now() - 28 * 864e5) },
        { text: "Thank you sir. Should I also bring the property tax receipts?", sender: clientUids[0], recipientId: advUid, type: "user", timestamp: new Date(Date.now() - 27 * 864e5) },
        { text: "Yes, bring all property documents — tax receipts, mutation records, and the original sale deed.", sender: advUid, recipientId: clientUids[0], type: "user", timestamp: new Date(Date.now() - 26 * 864e5) },
        { text: `📅 Hearing Scheduled — ${new Date(Date.now() + 15 * 864e5).toDateString()}\nCase: Civil Suit\nNote: 10:00 AM — High Court Room 7. Final arguments.`, sender: advUid, recipientId: clientUids[0], type: "system", timestamp: new Date() },
      ];
      for (const m of msgs) {
        await addDoc(collection(db, "messages"), m);
      }
      L(`✅ ${msgs.length} messages created`, "success");

      L("────────────────────────────────", "info");
      L("🎉 All demo data seeded successfully!", "success");
      setDone(true);

    } catch (err) {
      L(`❌ ${err.message}`, "error");
      console.error(err);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-darkBg text-white p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-neonBlue mb-2">🌱 Seed Demo Data</h1>
          <p className="text-gray-400 text-sm">Creates structured demo data. Safe to run — never deletes existing data.</p>
        </div>

        <div className="bg-black/40 border border-gray-800 rounded-xl p-5 mb-6 text-sm space-y-1">
          <p className="text-gray-400 font-bold mb-2 text-xs uppercase tracking-widest">Creates:</p>
          <p className="text-neonPurple">⚖️ Advocate — Rajesh Kumar Sharma</p>
          <p className="text-neonBlue">👤 Client 1 — Priya Mehta (Civil Suit, accepted)</p>
          <p className="text-neonBlue">👤 Client 2 — Arjun Nair (Criminal Appeal, pending)</p>
          <p className="text-white">📅 3 Hearings — success / postponed / upcoming</p>
          <p className="text-white">💬 5 Messages</p>
          <div className="mt-3 pt-3 border-t border-gray-800 font-mono text-xs space-y-1">
            <p className="text-yellow-400 font-bold">Login credentials (all use password: Demo@1234)</p>
            <p className="text-gray-300">Advocate: advocate.demo@nyayadheesh.com</p>
            <p className="text-gray-300">Client 1: client1.demo@nyayadheesh.com</p>
            <p className="text-gray-300">Client 2: client2.demo@nyayadheesh.com</p>
          </div>
        </div>

        {!done && (
          <button onClick={runSeed} disabled={running}
            className="w-full bg-neonBlue text-black font-black py-4 rounded-xl hover:opacity-90 transition shadow-[0_0_15px_rgba(0,240,255,0.3)] disabled:opacity-50 mb-6">
            {running ? "⏳ Seeding..." : "▶ Seed Demo Data Now"}
          </button>
        )}

        {done && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-5 mb-6 text-center">
            <p className="text-green-400 font-black text-xl mb-2">✅ Done!</p>
            <a href="/" className="inline-block mt-2 bg-green-500 text-black font-black px-8 py-3 rounded-xl hover:opacity-90 transition">
              Go to App →
            </a>
          </div>
        )}

        {log.length > 0 && (
          <div className="bg-black border border-gray-800 rounded-xl p-4 font-mono text-xs max-h-80 overflow-y-auto space-y-1">
            {log.map((e, i) => (
              <div key={i} className="flex gap-3">
                <span className="text-gray-600 shrink-0">{e.t}</span>
                <span className={e.type === "success" ? "text-green-400" : e.type === "error" ? "text-red-400" : e.type === "warn" ? "text-yellow-400" : "text-gray-300"}>
                  {e.msg}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SeedDB;
