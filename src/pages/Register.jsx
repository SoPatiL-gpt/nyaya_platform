import { useState } from "react";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { userDocRef } from "../lib/userStore";

function Field({ label, type = "text", placeholder, value, onChange, required = true, id, name, autoComplete }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs text-gray-400 mb-1 font-bold uppercase tracking-widest">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={id}
        name={name || id}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-3 bg-black border border-gray-700 focus:border-neonBlue rounded-lg text-white outline-none transition text-sm"
      />
    </div>
  );
}

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    contact: "",
    govtId: "",
    email: "",
    city: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleRegister = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.password || !form.contact || !form.govtId || !form.city) {
      alert("Please fill all required fields.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    if (form.password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const uid = cred.user.uid;
      await setDoc(userDocRef(db, "client", uid), {
        uid,
        firstName: form.firstName,
        lastName: form.lastName,
        name: `${form.firstName} ${form.lastName}`,
        contact: form.contact,
        govtId: form.govtId,
        email: form.email,
        city: form.city,
        role: "client",
        createdAt: new Date().toISOString(),
      });
      await signOut(auth);
      alert("Registration Successful! Please login.");
      navigate("/client-login");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-darkBg text-white flex justify-center items-center py-10 px-4">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">📋</div>
          <h2 className="text-3xl font-black text-neonBlue">Client Registration</h2>
          <p className="text-gray-500 text-sm mt-1">Create your account to get started</p>
        </div>

        <div className="bg-black/50 border border-neonBlue/40 rounded-2xl p-8 shadow-[0_0_30px_rgba(0,240,255,0.1)] space-y-6">

          {/* Name */}
          <div>
            <p className="text-neonBlue font-bold text-sm mb-3 border-b border-gray-800 pb-2">Personal Information</p>
            <div className="grid grid-cols-2 gap-4">
              <Field id="firstName" label="First Name" placeholder="First name" value={form.firstName} onChange={(v) => set("firstName", v)} />
              <Field id="lastName" label="Last Name" placeholder="Last name" value={form.lastName} onChange={(v) => set("lastName", v)} />
            </div>
          </div>

          {/* Contact */}
          <div>
            <p className="text-neonBlue font-bold text-sm mb-3 border-b border-gray-800 pb-2">Contact Details</p>
            <div className="space-y-4">
              <Field id="contact" label="Mobile Number" type="tel" autoComplete="tel" placeholder="+91 XXXXX XXXXX" value={form.contact} onChange={(v) => set("contact", v)} />
              <Field id="govtId" label="Government ID (Aadhaar / PAN)" placeholder="Enter Govt ID number" value={form.govtId} onChange={(v) => set("govtId", v)} />
              <Field id="reg-email" name="email" label="Email Address" type="email" autoComplete="email" placeholder="your@email.com" value={form.email} onChange={(v) => set("email", v)} />
              <Field id="city" label="City of Residence" autoComplete="address-level2" placeholder="Enter your city" value={form.city} onChange={(v) => set("city", v)} />
            </div>
          </div>

          {/* Password */}
          <div>
            <p className="text-neonBlue font-bold text-sm mb-3 border-b border-gray-800 pb-2">Create Password</p>
            <div className="space-y-4">
              <Field id="reg-password" name="password" label="Password" type="password" autoComplete="new-password" placeholder="Min. 6 characters" value={form.password} onChange={(v) => set("password", v)} />
              <Field id="confirmPassword" label="Confirm Password" type="password" autoComplete="new-password" placeholder="Re-enter password" value={form.confirmPassword} onChange={(v) => set("confirmPassword", v)} />
            </div>
          </div>

          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full bg-neonBlue text-black font-black py-3 rounded-lg hover:opacity-90 transition shadow-[0_0_15px_rgba(0,240,255,0.3)] disabled:opacity-50"
          >
            {loading ? "Registering..." : "Complete Registration →"}
          </button>

          <p className="text-center text-gray-500 text-sm">
            Already have an account?{" "}
            <span onClick={() => navigate("/client-login")} className="text-neonBlue font-bold cursor-pointer hover:underline">
              Login here
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
