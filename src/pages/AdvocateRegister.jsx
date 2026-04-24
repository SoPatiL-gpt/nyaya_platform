import { useState } from "react";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { userDocRef } from "../lib/userStore";

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh",
  "Uttarakhand","West Bengal","Delhi","Jammu & Kashmir","Ladakh",
  "Andaman & Nicobar Islands","Chandigarh","Dadra & Nagar Haveli","Daman & Diu",
  "Lakshadweep","Puducherry"
];

function calculateAge(dob) {
  if (!dob) return "";
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

function Field({ label, type = "text", placeholder, value, onChange, children, id, name, autoComplete }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs text-gray-400 mb-1 font-bold uppercase tracking-widest">
        {label} <span className="text-red-500">*</span>
      </label>
      {children || (
        <input
          id={id}
          name={name || id}
          type={type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-3 bg-black border border-gray-700 focus:border-neonPurple rounded-lg text-white outline-none transition text-sm"
        />
      )}
    </div>
  );
}

function AdvocateRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    barId: "",
    state: "",
    name: "",
    dob: "",
    education: "",
    practiceCourtType: "High Court",
    yearsActive: "",
    mobile: "",
    govtId: "",
    address: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleRegister = async () => {
    const required = ["barId","state","name","dob","education","mobile","govtId","address","email","password"];
    for (const k of required) {
      if (!form[k]) { alert(`Please fill: ${k}`); return; }
    }
    if (form.password !== form.confirmPassword) { alert("Passwords do not match."); return; }
    if (form.password.length < 6) { alert("Password must be at least 6 characters."); return; }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const uid = cred.user.uid;
      await setDoc(userDocRef(db, "advocate", uid), {
        uid,
        barId: form.barId,
        state: form.state,
        name: form.name,
        dob: form.dob,
        age: calculateAge(form.dob),
        education: form.education,
        practiceCourtType: form.practiceCourtType,
        yearsActive: form.yearsActive,
        mobile: form.mobile,
        govtId: form.govtId,
        address: form.address,
        email: form.email,
        role: "advocate",
        createdAt: new Date().toISOString(),
      });
      // Sign out after registration so they go through login cleanly
      await signOut(auth);
      alert("Registration Successful! Please login with your email and password.");
      navigate("/advocate-login");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-darkBg text-white flex justify-center items-center py-10 px-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">⚖️</div>
          <h2 className="text-3xl font-black text-neonPurple">Advocate Registration</h2>
          <p className="text-gray-500 text-sm mt-1">Register with your BAR credentials</p>
        </div>

        <div className="bg-black/50 border border-neonPurple/40 rounded-2xl p-8 shadow-[0_0_30px_rgba(157,0,255,0.1)] space-y-6">

          {/* BAR Verification */}
          <div>
            <p className="text-neonPurple font-bold text-sm mb-3 border-b border-gray-800 pb-2">BAR Verification</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field id="barId" label="BAR ID" placeholder="Enter your BAR Council ID" value={form.barId} onChange={(v) => set("barId", v)} />
              <Field label="State">
                <select
                  value={form.state}
                  onChange={(e) => set("state", e.target.value)}
                  className="w-full p-3 bg-black border border-gray-700 focus:border-neonPurple rounded-lg text-white outline-none transition text-sm"
                >
                  <option value="">Select State</option>
                  {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
            </div>
          </div>

          {/* Background Info */}
          <div>
            <p className="text-neonPurple font-bold text-sm mb-3 border-b border-gray-800 pb-2">Advocate Background</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field id="advName" name="name" label="Full Name" autoComplete="name" placeholder="As per BAR records" value={form.name} onChange={(v) => set("name", v)} />
              <div>
                <label className="block text-xs text-gray-400 mb-1 font-bold uppercase tracking-widest">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  id="dob"
                  name="dob"
                  type="date"
                  value={form.dob}
                  onChange={(e) => set("dob", e.target.value)}
                  className="w-full p-3 bg-black border border-gray-700 focus:border-neonPurple rounded-lg text-white outline-none transition text-sm [color-scheme:dark]"
                />
                {form.dob && (
                  <p className="text-xs text-neonPurple mt-1">Age: {calculateAge(form.dob)} years</p>
                )}
              </div>
              <div className="md:col-span-2">
                <Field id="education" label="Education Qualifications" placeholder="e.g. LLB, LLM, BA LLB from XYZ University" value={form.education} onChange={(v) => set("education", v)} />
              </div>
              <Field label="Practice Court Type">
                <select
                  value={form.practiceCourtType}
                  onChange={(e) => set("practiceCourtType", e.target.value)}
                  className="w-full p-3 bg-black border border-gray-700 focus:border-neonPurple rounded-lg text-white outline-none transition text-sm"
                >
                  <option value="High Court">High Court</option>
                  <option value="District Court">District Court</option>
                  <option value="Both">Both (High Court & District Court)</option>
                  <option value="Supreme Court">Supreme Court</option>
                </select>
              </Field>
              <Field id="yearsActive" name="yearsActive" label="Years Active" type="number" placeholder="e.g. 5" value={form.yearsActive} onChange={(v) => set("yearsActive", v)} />
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <p className="text-neonPurple font-bold text-sm mb-3 border-b border-gray-800 pb-2">Contact Information</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field id="mobile" label="Mobile Number" type="tel" autoComplete="tel" placeholder="+91 XXXXX XXXXX" value={form.mobile} onChange={(v) => set("mobile", v)} />
              <Field id="adv-email" name="email" label="Email Address" type="email" autoComplete="email" placeholder="advocate@email.com" value={form.email} onChange={(v) => set("email", v)} />
              <Field id="advGovtId" label="Verified Govt ID (Aadhaar / PAN)" placeholder="Enter Govt ID number" value={form.govtId} onChange={(v) => set("govtId", v)} />
              <div className="md:col-span-2">
                <label htmlFor="address" className="block text-xs text-gray-400 mb-1 font-bold uppercase tracking-widest">Full Address <span className="text-red-500">*</span></label>
                <textarea
                  id="address"
                  name="address"
                  placeholder="Chamber / Office address"
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  className="w-full p-3 bg-black border border-gray-700 focus:border-neonPurple rounded-lg text-white outline-none transition text-sm h-20"
                />
              </div>
            </div>
          </div>

          {/* Password */}
          <div>
            <p className="text-neonPurple font-bold text-sm mb-3 border-b border-gray-800 pb-2">Create Strong Password</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field id="adv-password" name="password" label="Password" type="password" autoComplete="new-password" placeholder="Min. 6 characters" value={form.password} onChange={(v) => set("password", v)} />
              <Field id="confirmPassword" label="Confirm Password" type="password" autoComplete="new-password" placeholder="Re-enter password" value={form.confirmPassword} onChange={(v) => set("confirmPassword", v)} />
            </div>
          </div>

          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full bg-neonPurple text-white font-black py-3 rounded-lg hover:opacity-90 transition shadow-[0_0_15px_rgba(157,0,255,0.3)] disabled:opacity-50"
          >
            {loading ? "Registering..." : "Complete Registration →"}
          </button>

          <p className="text-center text-gray-500 text-sm">
            Already registered?{" "}
            <span onClick={() => navigate("/advocate-login")} className="text-neonPurple font-bold cursor-pointer hover:underline">
              Login here
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdvocateRegister;
