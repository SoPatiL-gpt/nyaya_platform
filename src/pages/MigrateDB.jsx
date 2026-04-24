import { useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc } from "firebase/firestore";
import { userDocRef } from "../lib/userStore";

function MigrateDB() {
  const [log, setLog] = useState([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  const addLog = (msg, type = "info") =>
    setLog((prev) => [...prev, { msg, type, time: new Date().toLocaleTimeString() }]);

  const runMigration = async () => {
    setRunning(true);
    setLog([]);
    addLog("🚀 Starting migration...", "info");

    try {
      // ── Migrate users ──────────────────────────────────────────────────────
      addLog("📂 Reading users collection...", "info");
      const usersSnap = await getDocs(collection(db, "users"));
      let clients = 0, advocates = 0, skipped = 0;

      for (const userDoc of usersSnap.docs) {
        const uid = userDoc.id;
        const data = userDoc.data();

        // Skip reserved docs if they exist from older experiments
        if (uid === "clients" || uid === "advocates") { skipped++; continue; }

        const role = data.role;

        if (role === "client") {
          const already = await getDoc(userDocRef(db, "client", uid));
          if (already.exists()) {
            addLog(`⏭ Already migrated (client): ${data.email || uid}`, "warn");
            skipped++; continue;
          }
          await setDoc(userDocRef(db, "client", uid), { ...data, uid });
          await deleteDoc(doc(db, "users", uid));
          addLog(`✅ Client → clients/${uid} (${data.email || "no email"})`, "success");
          clients++;

        } else if (role === "advocate") {
          const already = await getDoc(userDocRef(db, "advocate", uid));
          if (already.exists()) {
            addLog(`⏭ Already migrated (advocate): ${data.email || uid}`, "warn");
            skipped++; continue;
          }
          await setDoc(userDocRef(db, "advocate", uid), { ...data, uid });
          await deleteDoc(doc(db, "users", uid));
          addLog(`✅ Advocate → advocates/${uid} (${data.email || "no email"})`, "success");
          advocates++;

        } else {
          addLog(`⚠️ Unknown role "${role}" for ${uid} — skipped`, "warn");
          skipped++;
        }
      }

      addLog(`────────────────────────────────`, "info");
      addLog(`Clients moved: ${clients}`, "success");
      addLog(`Advocates moved: ${advocates}`, "success");
      addLog(`Skipped: ${skipped}`, "warn");

      // ── Verify other collections ───────────────────────────────────────────
      addLog(`────────────────────────────────`, "info");
      addLog(`📂 Verifying other collections...`, "info");
      for (const col of ["cases", "hearings", "messages", "documents"]) {
        const snap = await getDocs(collection(db, col));
        addLog(`✅ ${col}: ${snap.size} docs — unchanged`, "success");
      }

      addLog(`────────────────────────────────`, "info");
      addLog(`🎉 Migration complete!`, "success");
      setDone(true);

    } catch (err) {
      addLog(`❌ Error: ${err.message}`, "error");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-darkBg text-white p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-neonBlue mb-2">🗄️ Database Migration</h1>
          <p className="text-gray-400 text-sm mb-1">Moves existing users into the new top-level role collections:</p>
          <div className="font-mono text-xs bg-black/40 border border-gray-800 rounded-xl p-4 text-left mt-3">
            <p className="text-red-400">BEFORE: &nbsp;users/<span className="text-yellow-400">&#123;uid&#125;</span></p>
            <p className="text-green-400 mt-1">AFTER: &nbsp;&nbsp;clients/<span className="text-yellow-400">&#123;uid&#125;</span></p>
            <p className="text-green-400">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;advocates/<span className="text-yellow-400">&#123;uid&#125;</span></p>
            <p className="text-gray-500 mt-2">cases / hearings / messages / documents → unchanged</p>
          </div>
        </div>

        {!done && (
          <button
            onClick={runMigration}
            disabled={running}
            className="w-full bg-neonBlue text-black font-black py-4 rounded-xl hover:opacity-90 transition shadow-[0_0_15px_rgba(0,240,255,0.3)] disabled:opacity-50 mb-6"
          >
            {running ? "⏳ Migrating..." : "▶ Run Migration Now"}
          </button>
        )}

        {done && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-5 mb-6 text-center">
            <p className="text-green-400 font-black text-xl mb-2">✅ Migration Complete!</p>
            <p className="text-gray-400 text-sm">All existing users have been moved into the new role-based collections.</p>
            <a href="/" className="inline-block mt-4 bg-green-500 text-black font-black px-8 py-3 rounded-xl hover:opacity-90 transition">
              Go to App →
            </a>
          </div>
        )}

        {/* Log */}
        {log.length > 0 && (
          <div className="bg-black border border-gray-800 rounded-xl p-4 font-mono text-xs max-h-80 overflow-y-auto space-y-1">
            {log.map((e, i) => (
              <div key={i} className="flex gap-3">
                <span className="text-gray-600 shrink-0">{e.time}</span>
                <span className={
                  e.type === "success" ? "text-green-400" :
                  e.type === "error"   ? "text-red-400" :
                  e.type === "warn"    ? "text-yellow-400" :
                  "text-gray-300"
                }>{e.msg}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MigrateDB;
