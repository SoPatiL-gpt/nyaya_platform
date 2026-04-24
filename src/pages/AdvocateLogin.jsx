import { useState } from "react";
import { auth, googleProvider, db } from "../firebase";
import { signInWithEmailAndPassword, signInWithPopup, signOut } from "firebase/auth";
import { getDoc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { userDocRef } from "../lib/userStore";

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh",
  "Uttarakhand","West Bengal","Delhi","Jammu & Kashmir","Ladakh",
  "Andaman & Nicobar Islands","Chandigarh","Dadra & Nagar Haveli","Daman & Diu",
  "Lakshadweep","Puducherry",
];

// Reusable field — defined outside to avoid remount bug
function Field({ label, type = "text", placeholder, value, onChange, children }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1 font-bold uppercase tracking-widest">
        {label} <span className="text-red-500">*</span>
      </label>
      {children || (
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-3 bg-black border border-gray-700 focus:border-neonPurple rounded-lg text-white outline-none transition text-sm"
        />
      )}
    </div>
  );
}

function AdvocateLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // When Google user is new — hold their Firebase user object and show registration form
  const [pendingUser, setPendingUser] = useState(null);
  const [regForm, setRegForm] = useState({
    barId: "", state: "", name: "", dob: "", education: "",
    practiceCourtType: "High Court", yearsActive: "",
    mobile: "", govtId: "", address: "",
  });
  const [regLoading, setRegLoading] = useState(false);

  const setReg = (k, v) => setRegForm((f) => ({ ...f, [k]: v }));

  const calcAge = (dob) => {
    if (!dob) return "";
    return Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
  };

  const saveSession = (uid, name, email, barId) => {
    localStorage.setItem("mock_uid", uid);
    localStorage.setItem("mock_role", "advocate");
    localStorage.setItem("mock_email", email || "");
    localStorage.setItem("mock_name", name || "Advocate");
    localStorage.setItem("mock_barId", barId || "");
  };

  // ── Email / Password Login ──────────────────────────────────────────────────
  const handleEmailLogin = async () => {
    if (!email || !password) { alert("Enter email and password."); return; }
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const snap = await getDoc(userDocRef(db, "advocate", cred.user.uid));
      if (!snap.exists()) {
        alert("No advocate profile found. Please register first.");
        await signOut(auth);
        return;
      }
      const profile = snap.data();
      if (profile.role !== "advocate") {
        alert("This account is registered as a Client. Please use Client Login.");
        await signOut(auth);
        return;
      }
      saveSession(cred.user.uid, profile.name, cred.user.email, profile.barId);
      navigate("/advocate-dashboard");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const snap = await getDoc(userDocRef(db, "advocate", cred.user.uid));
      if (snap.exists()) {
        const profile = snap.data();
        if (profile.role !== "advocate") {
          alert("This Google account is registered as a Client. Please use Client Login.");
          await signOut(auth);
          return;
        }
        saveSession(cred.user.uid, profile.name, cred.user.email, profile.barId);
        navigate("/advocate-dashboard");
      } else {
        setRegForm((f) => ({ ...f, name: cred.user.displayName || "" }));
        setPendingUser(cred.user);
      }
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Complete Registration for Google User ───────────────────────────────────
  const handleCompleteRegistration = async () => {
    const { barId, state, name, dob, education, mobile, govtId, address } = regForm;
    if (!barId || !state || !name || !dob || !education || !mobile || !govtId || !address) {
      alert("Please fill all required fields.");
      return;
    }
    setRegLoading(true);
    try {
      await setDoc(userDocRef(db, "advocate", pendingUser.uid), {
        uid: pendingUser.uid,
        email: pendingUser.email,
        role: "advocate",
        name,
        barId,
        state,
        dob,
        age: calcAge(dob),
        education,
        practiceCourtType: regForm.practiceCourtType,
        yearsActive: regForm.yearsActive,
        mobile,
        govtId,
        address,
        createdAt: new Date().toISOString(),
      });
      saveSession(pendingUser.uid, name, pendingUser.email, barId);
      navigate("/advocate-dashboard");
    } catch (err) {
      alert(err.message);
    } finally {
      setRegLoading(false);
    }
  };

  const handleCancelGoogle = async () => {
    await signOut(auth);
    setPendingUser(null);
  };

  // ── If new Google user — show registration form ─────────────────────────────
  if (pendingUser) {
    return (
      <div className="min-h-screen bg-darkBg text-white flex justify-center items-center py-10 px-4">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">⚖️</div>
            <h2 className="text-2xl font-black text-neonPurple">Complete Your Advocate Profile</h2>
            <p className="text-gray-500 text-sm mt-1">
              Signed in as <span className="text-white font-bold">{pendingUser.email}</span> — fill your details to continue
            </p>
          </div>

          <div className="bg-black/50 border border-neonPurple/40 rounded-2xl p-8 shadow-[0_0_30px_rgba(157,0,255,0.1)] space-y-6">

            {/* BAR Verification */}
            <div>
              <p className="text-neonPurple font-bold text-sm mb-3 border-b border-gray-800 pb-2">BAR Verification</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="BAR ID" placeholder="Enter your BAR Council ID" value={regForm.barId} onChange={(v) => setReg("barId", v)} />
                <Field label="State">
                  <select value={regForm.state} onChange={(e) => setReg("state", e.target.value)}
                    className="w-full p-3 bg-black border border-gray-700 focus:border-neonPurple rounded-lg text-white outline-none text-sm">
                    <option value="">Select State</option>
                    {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
              </div>
            </div>

            {/* Background */}
            <div>
              <p className="text-neonPurple font-bold text-sm mb-3 border-b border-gray-800 pb-2">Advocate Background</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Full Name" placeholder="As per BAR records" value={regForm.name} onChange={(v) => setReg("name", v)} />
                <div>
                  <label className="block text-xs text-gray-400 mb-1 font-bold uppercase tracking-widest">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input type="date" value={regForm.dob} onChange={(e) => setReg("dob", e.target.value)}
                    className="w-full p-3 bg-black border border-gray-700 focus:border-neonPurple rounded-lg text-white outline-none text-sm [color-scheme:dark]" />
                  {regForm.dob && <p className="text-xs text-neonPurple mt-1">Age: {calcAge(regForm.dob)} years</p>}
                </div>
                <div className="md:col-span-2">
                  <Field label="Education Qualifications" placeholder="e.g. LLB, LLM from XYZ University" value={regForm.education} onChange={(v) => setReg("education", v)} />
                </div>
                <Field label="Practice Court Type">
                  <select value={regForm.practiceCourtType} onChange={(e) => setReg("practiceCourtType", e.target.value)}
                    className="w-full p-3 bg-black border border-gray-700 focus:border-neonPurple rounded-lg text-white outline-none text-sm">
                    <option>High Court</option>
                    <option>District Court</option>
                    <option>Both (High Court & District Court)</option>
                    <option>Supreme Court</option>
                  </select>
                </Field>
                <Field label="Years Active" type="number" placeholder="e.g. 5" value={regForm.yearsActive} onChange={(v) => setReg("yearsActive", v)} />
              </div>
            </div>

            {/* Contact */}
            <div>
              <p className="text-neonPurple font-bold text-sm mb-3 border-b border-gray-800 pb-2">Contact Information</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Mobile Number" type="tel" placeholder="+91 XXXXX XXXXX" value={regForm.mobile} onChange={(v) => setReg("mobile", v)} />
                <Field label="Verified Govt ID (Aadhaar / PAN)" placeholder="Enter Govt ID number" value={regForm.govtId} onChange={(v) => setReg("govtId", v)} />
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-400 mb-1 font-bold uppercase tracking-widest">Full Address <span className="text-red-500">*</span></label>
                  <textarea placeholder="Chamber / Office address" value={regForm.address} onChange={(e) => setReg("address", e.target.value)}
                    className="w-full p-3 bg-black border border-gray-700 focus:border-neonPurple rounded-lg text-white outline-none text-sm h-20" />
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={handleCancelGoogle}
                className="px-6 py-3 border border-gray-700 text-gray-400 rounded-lg hover:border-gray-500 hover:text-white transition font-bold">
                ← Cancel
              </button>
              <button onClick={handleCompleteRegistration} disabled={regLoading}
                className="flex-1 bg-neonPurple text-white font-black py-3 rounded-lg hover:opacity-90 transition shadow-[0_0_15px_rgba(157,0,255,0.3)] disabled:opacity-50">
                {regLoading ? "Saving..." : "Complete Registration & Enter →"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Normal Login Screen ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex justify-center items-center bg-darkBg text-white px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">⚖️</div>
          <h2 className="text-3xl font-black text-neonPurple">Advocate Login</h2>
          <p className="text-gray-500 text-sm mt-1">Access your case management portal</p>
        </div>

        <div className="bg-black/50 border border-neonPurple/40 rounded-2xl p-8 shadow-[0_0_30px_rgba(157,0,255,0.1)]">

          <button onClick={handleGoogleLogin} disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-black font-black py-3 rounded-lg hover:opacity-90 transition mb-6 disabled:opacity-50">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-gray-800" />
            <span className="text-gray-600 text-xs font-bold">OR</span>
            <div className="flex-1 h-px bg-gray-800" />
          </div>

          <div className="mb-4">
            <label htmlFor="adv-email" className="block text-xs text-gray-400 mb-2 font-bold uppercase tracking-widest">Email</label>
            <input id="adv-email" name="email" type="email" autoComplete="email" placeholder="your@email.com"
              className="w-full p-3 bg-black border border-gray-700 focus:border-neonPurple rounded-lg text-white outline-none transition"
              value={email} onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleEmailLogin()} />
          </div>

          <div className="mb-6">
            <label htmlFor="adv-password" className="block text-xs text-gray-400 mb-2 font-bold uppercase tracking-widest">Password</label>
            <input id="adv-password" name="password" type="password" autoComplete="current-password" placeholder="Your password"
              className="w-full p-3 bg-black border border-gray-700 focus:border-neonPurple rounded-lg text-white outline-none transition"
              value={password} onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleEmailLogin()} />
          </div>

          <button onClick={handleEmailLogin} disabled={loading}
            className="w-full bg-neonPurple text-white font-black py-3 rounded-lg hover:opacity-90 transition shadow-[0_0_15px_rgba(157,0,255,0.3)] disabled:opacity-50">
            {loading ? "Logging in..." : "Login with Email →"}
          </button>

          <div className="mt-6 text-center border-t border-gray-800 pt-6">
            <p className="text-gray-500 text-sm">
              New User?{" "}
              <span onClick={() => navigate("/advocate-register")} className="text-neonPurple font-bold cursor-pointer hover:underline">
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

export default AdvocateLogin;
