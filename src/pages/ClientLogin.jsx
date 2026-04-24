import { useState } from "react";
import { auth, googleProvider, db } from "../firebase";
import { signInWithEmailAndPassword, signInWithPopup, signOut } from "firebase/auth";
import { getDoc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { userDocRef } from "../lib/userStore";

function ClientLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const saveSession = (uid, name, userEmail) => {
    localStorage.setItem("mock_uid", uid);
    localStorage.setItem("mock_role", "client");
    localStorage.setItem("mock_email", userEmail || "");
    localStorage.setItem("mock_name", name || "Client");
  };

  const handleEmailLogin = async () => {
    if (!email || !password) { alert("Enter email and password."); return; }
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const snap = await getDoc(userDocRef(db, "client", cred.user.uid));
      if (snap.exists() && snap.data().role !== "client") {
        alert("This account is an Advocate account. Please use Advocate Login.");
        await signOut(auth);
        return;
      }
      const profile = snap.exists() ? snap.data() : {};
      saveSession(
        cred.user.uid,
        profile.name || `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || cred.user.displayName,
        cred.user.email
      );
      navigate("/client-dashboard");
    } catch (err) {
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        alert("Invalid email or password.");
      } else {
        alert(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const ref = userDocRef(db, "client", cred.user.uid);
      const snap = await getDoc(ref);

      if (snap.exists() && snap.data().role !== "client") {
        alert("This Google account is an Advocate account. Use Advocate Login.");
        await signOut(auth);
        return;
      }
      if (!snap.exists()) {
        await setDoc(ref, {
          uid: cred.user.uid,
          email: cred.user.email,
          name: cred.user.displayName || "",
          firstName: cred.user.displayName?.split(" ")[0] || "",
          lastName: cred.user.displayName?.split(" ")[1] || "",
          role: "client",
          createdAt: new Date().toISOString(),
        });
      }
      const profile = snap.exists() ? snap.data() : { name: cred.user.displayName };
      saveSession(cred.user.uid, profile.name || cred.user.displayName, cred.user.email);
      navigate("/client-dashboard");
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-darkBg text-white px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">👤</div>
          <h2 className="text-3xl font-black text-neonBlue">Client Login</h2>
          <p className="text-gray-500 text-sm mt-1">Access your legal case dashboard</p>
        </div>

        <div className="bg-black/50 border border-neonBlue/40 rounded-2xl p-8 shadow-[0_0_30px_rgba(0,240,255,0.1)]">

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-black font-black py-3 rounded-lg hover:opacity-90 transition mb-6 disabled:opacity-50"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
            {loading ? "Please wait..." : "Continue with Google"}
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-gray-800" />
            <span className="text-gray-600 text-xs font-bold">OR</span>
            <div className="flex-1 h-px bg-gray-800" />
          </div>

          <div className="mb-4">
            <label htmlFor="client-email" className="block text-xs text-gray-400 mb-2 font-bold uppercase tracking-widest">
              Email
            </label>
            <input
              id="client-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="your@email.com"
              className="w-full p-3 bg-black border border-gray-700 focus:border-neonBlue rounded-lg text-white outline-none transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleEmailLogin()}
            />
          </div>

          <div className="mb-6">
            <label htmlFor="client-password" className="block text-xs text-gray-400 mb-2 font-bold uppercase tracking-widest">
              Password
            </label>
            <input
              id="client-password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Your password"
              className="w-full p-3 bg-black border border-gray-700 focus:border-neonBlue rounded-lg text-white outline-none transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleEmailLogin()}
            />
          </div>

          <button
            onClick={handleEmailLogin}
            disabled={loading}
            className="w-full bg-neonBlue text-black font-black py-3 rounded-lg hover:opacity-90 transition shadow-[0_0_15px_rgba(0,240,255,0.3)] disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login with Email →"}
          </button>

          <div className="mt-6 text-center border-t border-gray-800 pt-6">
            <p className="text-gray-500 text-sm">
              New User?{" "}
              <span onClick={() => navigate("/register")} className="text-neonBlue font-bold cursor-pointer hover:underline">
                Register here
              </span>
            </p>
          </div>
        </div>

        <div className="text-center mt-4">
          <span onClick={() => navigate("/")} className="text-gray-600 text-xs cursor-pointer hover:text-gray-400 transition">
            ← Back to Home
          </span>
        </div>
      </div>
    </div>
  );
}

export default ClientLogin;
