import { db } from "./firebase";
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc } from "firebase/firestore";
import { userDocRef } from "./lib/userStore";

let migrationRan = false;

export async function runMigrationIfNeeded() {
  if (migrationRan) return;
  migrationRan = true;

  try {
    const usersSnap = await getDocs(collection(db, "users"));
    if (usersSnap.empty) return; // nothing to migrate

    for (const userDoc of usersSnap.docs) {
      const uid = userDoc.id;
      const data = userDoc.data();

      // skip reserved docs if they exist from older experiments
      if (uid === "clients" || uid === "advocates") continue;

      const role = data.role;
      if (!role) continue;

      if (role === "client") {
        const already = await getDoc(userDocRef(db, "client", uid));
        if (already.exists()) {
          await deleteDoc(doc(db, "users", uid)); // clean up old
          continue;
        }
        await setDoc(userDocRef(db, "client", uid), { ...data, uid });
        await deleteDoc(doc(db, "users", uid));

      } else if (role === "advocate") {
        const already = await getDoc(userDocRef(db, "advocate", uid));
        if (already.exists()) {
          await deleteDoc(doc(db, "users", uid)); // clean up old
          continue;
        }
        await setDoc(userDocRef(db, "advocate", uid), { ...data, uid });
        await deleteDoc(doc(db, "users", uid));
      }
    }

    console.log("✅ DB migration complete");
  } catch (err) {
    console.warn("Migration skipped:", err.message);
  }
}
