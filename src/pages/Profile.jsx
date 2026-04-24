import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { getDoc, updateDoc } from "firebase/firestore";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
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

function Field({ id, label, type = "text", value, onChange, placeholder, disabled = false, children }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs text-gray-400 mb-1 font-bold uppercase tracking-widest">
        {label}
      </label>
      {children || (
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full p-3 rounded-lg text-white outline-none transition text-sm border ${
            disabled
              ? "bg-gray-900 border-gray-800 text-gray-500 cursor-not-allowed"
              : "bg-black border-gray-700 focus:border-current"
          }`}
        />
      )}
    </div>
  );
}

function Profile() {
  const navigate = useNavigate();
  const uid = localStorage.getItem("mock_uid");
  const role = localStorage.getItem("mock_role");
  const isAdvocate = role === "advocate";
  const borderClass = isAdvocate ? "border-neonPurple" : "border-neonBlue";
  const textClass = isAdvocate ? "text-neonPurple" : "text-neonBlue";
  const btnClass = isAdvocate
    ? "bg-neonPurple text-white shadow-[0_0_15px_rgba(157,0,255,0.3)]"
    : "bg-neonBlue text-black shadow-[0_0_15px_rgba(0,240,255,0.3)]";

  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const calcAge = (dob) => {
    if (!dob) return "";
    return Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
  };

  useEffect(() => {
    if (!uid) { navigate("/"); return; }
    getDoc(userDocRef(db, role, uid)).then((snap) => {
      if (snap.exists()) setForm(snap.data());
      setLoading(false);
    });
  }, [uid, role, navigate]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData = { ...form };
      if (isAdvocate && form.dob) updateData.age = calcAge(form.dob);
      if (!isAdvocate) updateData.name = `${form.firstName || ""} ${form.lastName || ""}`.trim();
      await updateDoc(userDocRef(db, role, uid), updateData);
      // Update localStorage name
      localStorage.setItem("mock_name", isAdvocate ? form.name : updateData.name);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    setPwMsg("");
    if (!newPassword || !currentPassword) { setPwMsg("Fill both current and new password."); return; }
    if (newPassword !== confirmPassword) { setPwMsg("New passwords do not match."); return; }
    if (newPassword.length < 6) { setPwMsg("Password must be at least 6 characters."); return; }
    setPwLoading(true);
    try {
      const user = auth.currentUser;
      const cred = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPassword);
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setPwMsg("✅ Password updated successfully!");
    } catch (err) {
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setPwMsg("❌ Current password is incorrect.");
      } else {
        setPwMsg("❌ " + err.message);
      }
    } finally {
      setPwLoading(false);
    }
  };

  if (loading) return (
    <div className="h-screen bg-darkBg flex items-center justify-center">
      <div className={`w-8 h-8 border-2 ${borderClass} border-t-transparent rounded-full animate-spin`} />
    </div>
  );

  if (!form) return (
    <div className="h-screen bg-darkBg flex items-center justify-center text-gray-500">Profile not found.</div>
  );

  return (
    <div className="min-h-screen bg-darkBg text-white">
      {/* Header */}
      <div className={`flex justify-between items-center px-6 py-4 bg-black/60 border-b border-gray-800 sticky top-0 z-50`}>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(isAdvocate ? "/advocate-dashboard" : "/client-dashboard")}
            className="text-gray-400 hover:text-white transition font-bold"
          >
            ← Back
          </button>
          <div>
            <h1 className={`font-black text-xl ${textClass}`}>My Profile</h1>
            <p className="text-gray-500 text-xs capitalize">{role} Account</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-green-400 text-sm font-bold animate-pulse">✓ Saved!</span>}
          <button
            onClick={handleSave}
            disabled={saving}
            className={`${btnClass} font-black px-6 py-2 rounded-lg hover:opacity-90 transition disabled:opacity-50`}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6 md:p-10 space-y-8">

        {/* Avatar + name display */}
        <div className={`bg-black/40 border ${borderClass}/30 rounded-2xl p-6 flex items-center gap-6`}>
          <div className={`w-20 h-20 rounded-full border-2 ${borderClass} flex items-center justify-center text-4xl bg-black/60`}>
            {isAdvocate ? "⚖️" : "👤"}
          </div>
          <div>
            <p className="text-white font-black text-2xl">
              {isAdvocate ? form.name : `${form.firstName || ""} ${form.lastName || ""}`.trim() || "Your Name"}
            </p>
            <p className="text-gray-400 text-sm">{form.email}</p>
            <span className={`text-xs font-black px-3 py-1 rounded-full mt-2 inline-block ${
              isAdvocate ? "bg-neonPurple/20 text-neonPurple border border-neonPurple/30" : "bg-neonBlue/20 text-neonBlue border border-neonBlue/30"
            }`}>
              {isAdvocate ? `BAR ID: ${form.barId || "Not set"}` : `City: ${form.city || "Not set"}`}
            </span>
          </div>
        </div>

        {/* CLIENT FIELDS */}
        {!isAdvocate && (
          <>
            <Section title="Personal Information" color={textClass}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field id="firstName" label="First Name" value={form.firstName || ""} onChange={(v) => set("firstName", v)} placeholder="First name" />
                <Field id="lastName" label="Last Name" value={form.lastName || ""} onChange={(v) => set("lastName", v)} placeholder="Last name" />
              </div>
            </Section>

            <Section title="Contact Details" color={textClass}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field id="email" label="Email" value={form.email || ""} onChange={() => {}} disabled />
                <Field id="contact" label="Mobile Number" type="tel" value={form.contact || ""} onChange={(v) => set("contact", v)} placeholder="+91 XXXXX XXXXX" />
                <Field id="govtId" label="Government ID (Aadhaar / PAN)" value={form.govtId || ""} onChange={(v) => set("govtId", v)} placeholder="Enter Govt ID" />
                <Field id="city" label="City of Residence" value={form.city || ""} onChange={(v) => set("city", v)} placeholder="Your city" />
              </div>
            </Section>
          </>
        )}

        {/* ADVOCATE FIELDS */}
        {isAdvocate && (
          <>
            <Section title="BAR & Identity" color={textClass}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field id="barId" label="BAR ID" value={form.barId || ""} onChange={(v) => set("barId", v)} placeholder="BAR Council ID" />
                <Field id="state" label="State">
                  <select
                    id="state"
                    value={form.state || ""}
                    onChange={(e) => set("state", e.target.value)}
                    className="w-full p-3 bg-black border border-gray-700 focus:border-neonPurple rounded-lg text-white outline-none text-sm"
                  >
                    <option value="">Select State</option>
                    {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
              </div>
            </Section>

            <Section title="Professional Background" color={textClass}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field id="name" label="Full Name" value={form.name || ""} onChange={(v) => set("name", v)} placeholder="As per BAR records" />
                <div>
                  <label htmlFor="dob" className="block text-xs text-gray-400 mb-1 font-bold uppercase tracking-widest">Date of Birth</label>
                  <input
                    id="dob"
                    name="dob"
                    type="date"
                    value={form.dob || ""}
                    onChange={(e) => set("dob", e.target.value)}
                    className="w-full p-3 bg-black border border-gray-700 focus:border-neonPurple rounded-lg text-white outline-none text-sm [color-scheme:dark]"
                  />
                  {form.dob && <p className="text-xs text-neonPurple mt-1">Age: {calcAge(form.dob)} years</p>}
                </div>
                <div className="md:col-span-2">
                  <Field id="education" label="Education Qualifications" value={form.education || ""} onChange={(v) => set("education", v)} placeholder="e.g. LLB, LLM from XYZ University" />
                </div>
                <Field id="practiceCourtType" label="Practice Court Type">
                  <select
                    id="practiceCourtType"
                    value={form.practiceCourtType || ""}
                    onChange={(e) => set("practiceCourtType", e.target.value)}
                    className="w-full p-3 bg-black border border-gray-700 focus:border-neonPurple rounded-lg text-white outline-none text-sm"
                  >
                    <option value="">Select Court Type</option>
                    <option>High Court</option>
                    <option>District Court</option>
                    <option>Both (High Court & District Court)</option>
                    <option>Supreme Court</option>
                  </select>
                </Field>
                <Field id="yearsActive" label="Years Active" type="number" value={form.yearsActive || ""} onChange={(v) => set("yearsActive", v)} placeholder="e.g. 5" />
              </div>
            </Section>

            <Section title="Contact Information" color={textClass}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field id="email" label="Email" value={form.email || ""} onChange={() => {}} disabled />
                <Field id="mobile" label="Mobile Number" type="tel" value={form.mobile || ""} onChange={(v) => set("mobile", v)} placeholder="+91 XXXXX XXXXX" />
                <Field id="govtId" label="Govt ID (Aadhaar / PAN)" value={form.govtId || ""} onChange={(v) => set("govtId", v)} placeholder="Enter Govt ID" />
                <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-xs text-gray-400 mb-1 font-bold uppercase tracking-widest">Full Address</label>
                  <textarea
                    id="address"
                    name="address"
                    value={form.address || ""}
                    onChange={(e) => set("address", e.target.value)}
                    placeholder="Chamber / Office address"
                    className="w-full p-3 bg-black border border-gray-700 focus:border-neonPurple rounded-lg text-white outline-none text-sm h-20"
                  />
                </div>
              </div>
            </Section>
          </>
        )}

        {/* CHANGE PASSWORD */}
        <Section title="Change Password" color={textClass}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field id="currentPassword" label="Current Password" type="password" value={currentPassword} onChange={setCurrentPassword} placeholder="Current password" />
            <Field id="newPassword" label="New Password" type="password" value={newPassword} onChange={setNewPassword} placeholder="Min. 6 characters" />
            <Field id="confirmNewPassword" label="Confirm New Password" type="password" value={confirmPassword} onChange={setConfirmPassword} placeholder="Re-enter new password" />
          </div>
          {pwMsg && (
            <p className={`text-sm font-bold mt-2 ${pwMsg.startsWith("✅") ? "text-green-400" : "text-red-400"}`}>{pwMsg}</p>
          )}
          <button
            onClick={handlePasswordChange}
            disabled={pwLoading}
            className="mt-4 px-6 py-2 border border-gray-600 text-gray-300 rounded-lg hover:border-white hover:text-white transition font-bold text-sm disabled:opacity-50"
          >
            {pwLoading ? "Updating..." : "Update Password"}
          </button>
        </Section>

        {/* Save button at bottom too */}
        <div className="flex justify-end pb-10">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`${btnClass} font-black px-10 py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50`}
          >
            {saving ? "Saving..." : "Save All Changes →"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, color, children }) {
  return (
    <div className="bg-black/40 border border-gray-800 rounded-2xl p-6">
      <p className={`${color} font-black text-sm mb-4 border-b border-gray-800 pb-2 uppercase tracking-widest`}>{title}</p>
      {children}
    </div>
  );
}

export default Profile;
