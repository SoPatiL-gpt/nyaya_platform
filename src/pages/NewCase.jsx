import { useState, useEffect } from "react";
import { db } from "../firebase";
import { addDoc, collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { userCollectionRef } from "../lib/userStore";

const CIVIL_SECTIONS = [
  "Section 9 - Court to try all civil suits unless barred",
  "Section 10 - Stay of suit",
  "Section 11 - Res Judicata",
  "Section 15 - Court in which suits to be instituted",
  "Section 20 - Other suits to be instituted where defendants reside",
  "Section 26 - Institution of suits",
  "Section 34 - Interest",
  "Section 35 - Costs",
  "Order VII Rule 1 - Particulars to be contained in plaint",
  "Order XXXIX - Temporary Injunctions",
];

const CRIMINAL_SECTIONS = [
  "Section 374 - Appeals from convictions",
  "Section 377 - Appeal by the State Government against sentence",
  "Section 378 - Appeal in case of acquittal",
  "Section 386 - Powers of the Appellate Court",
  "Section 389 - Suspension of sentence pending the appeal",
  "Section 395 - Reference to High Court",
  "Section 397 - Calling for records to exercise powers of revision",
  "Section 401 - High Courts powers of revision",
  "Section 439 - Special powers of High Court regarding bail",
  "Section 482 - Saving of inherent powers of High Court",
];

function NewCase() {
  const navigate = useNavigate();
  const currentUid = localStorage.getItem("mock_uid");

  const [step, setStep] = useState(1); // 1 = pick advocate, 2 = fill case form
  const [advocates, setAdvocates] = useState([]);
  const [selectedAdvocate, setSelectedAdvocate] = useState(null);
  const [loadingAdvocates, setLoadingAdvocates] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    jurisdiction: "District Court",
    caseType: "Civil Suit",
    matterType: "",
    petitionerName: "", petitionerGender: "Male", petitionerDOB: "",
    petitionerMobile: "", petitionerEmail: "", petitionerAddress: "",
    respondentName: "", respondentGender: "Male", respondentDOB: "",
    respondentMobile: "", respondentEmail: "", respondentAddress: "",
    legalAct: "", legalSection: CIVIL_SECTIONS[0],
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const sections = form.caseType === "Civil Suit" ? CIVIL_SECTIONS : CRIMINAL_SECTIONS;

  useEffect(() => {
    getDocs(userCollectionRef(db, "advocate")).then((snap) => {
      const data = [];
      snap.forEach((doc) => {
        if (doc.data().role === "advocate") data.push({ id: doc.id, ...doc.data() });
      });
      setAdvocates(data);
      setLoadingAdvocates(false);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAdvocate) { alert("Please select an advocate first."); return; }
    if (!form.matterType || !form.petitionerName || !form.respondentName) {
      alert("Please fill all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      await addDoc(collection(db, "cases"), {
        ...form,
        court: form.jurisdiction,
        description: form.matterType,
        clientId: currentUid,
        requestedAdvocateId: selectedAdvocate.uid || selectedAdvocate.id,
        advocateId: null,
        status: "pending",
        createdAt: new Date().toISOString(),
      });
      alert("Case registered & request sent to advocate!");
      navigate("/client-dashboard");
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-darkBg text-white py-10 px-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center">
        <div>
          <div className="inline-block bg-neonBlue/10 border border-neonBlue/30 text-neonBlue text-xs font-black px-3 py-1 rounded-full mb-2 tracking-widest">
            👤 CLIENT PORTAL
          </div>
          <h1 className="text-3xl font-black text-white">New Case Registration</h1>
        </div>
        <button onClick={() => navigate("/client-dashboard")} className="text-gray-400 hover:text-white transition font-bold">✕ Cancel</button>
      </div>

      {/* Step Indicator */}
      <div className="max-w-4xl mx-auto flex items-center gap-3 mb-8">
        {["Select Advocate", "Case Details"].map((label, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-black transition ${step === i + 1 ? "bg-neonBlue text-black" : step > i + 1 ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-white/5 text-gray-500"}`}>
              <span>{step > i + 1 ? "✓" : i + 1}</span>
              <span>{label}</span>
            </div>
            {i < 1 && <span className="text-gray-700">→</span>}
          </div>
        ))}
      </div>

      {/* STEP 1: Select Advocate */}
      {step === 1 && (
        <div className="max-w-4xl mx-auto">
          <div className="bg-black/40 border border-neonBlue/30 rounded-2xl p-6 mb-6">
            <h2 className="text-neonBlue font-black text-xl mb-1">Step 1: Choose Your Advocate</h2>
            <p className="text-gray-500 text-sm mb-6">Browse registered advocates and select one to send your case request.</p>

            {loadingAdvocates ? (
              <p className="text-gray-500 text-center py-10 animate-pulse">Loading advocates...</p>
            ) : advocates.length === 0 ? (
              <p className="text-gray-500 text-center py-10">No advocates registered yet. Please check back later.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {advocates.map((adv) => (
                  <div
                    key={adv.id}
                    onClick={() => setSelectedAdvocate(adv)}
                    className={`cursor-pointer rounded-xl border p-5 transition ${
                      selectedAdvocate?.id === adv.id
                        ? "border-neonBlue bg-neonBlue/10 shadow-[0_0_15px_rgba(0,240,255,0.2)]"
                        : "border-gray-700 hover:border-gray-500 bg-black/30"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-white font-black text-lg">{adv.name}</p>
                        <p className="text-gray-400 text-xs">BAR ID: {adv.barId}</p>
                      </div>
                      {selectedAdvocate?.id === adv.id && (
                        <span className="bg-neonBlue text-black text-xs font-black px-2 py-1 rounded-full">✓ Selected</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                      <span>⚖️ {adv.practiceCourtType}</span>
                      <span>📍 {adv.state}</span>
                      <span>🎓 {adv.education}</span>
                      <span>📅 {adv.yearsActive} yrs exp</span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-800">
                      <a
                        href={`mailto:${adv.email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-neonBlue text-xs hover:underline"
                      >
                        ✉️ {adv.email}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => { if (!selectedAdvocate) { alert("Please select an advocate."); return; } setStep(2); }}
              className="bg-neonBlue text-black font-black px-8 py-3 rounded-xl hover:opacity-90 transition shadow-[0_0_15px_rgba(0,240,255,0.3)]"
            >
              Continue → Fill Case Details
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Case Form */}
      {step === 2 && (
        <div className="max-w-4xl mx-auto">
          {/* Selected Advocate Banner */}
          <div className="bg-neonBlue/10 border border-neonBlue/30 rounded-xl p-4 mb-6 flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Sending Request To</p>
              <p className="text-white font-black">{selectedAdvocate.name}</p>
              <p className="text-gray-400 text-xs">{selectedAdvocate.practiceCourtType} · {selectedAdvocate.state}</p>
            </div>
            <button onClick={() => setStep(1)} className="text-neonBlue text-sm font-bold hover:underline">Change</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1 */}
            <div className="bg-black/40 border border-gray-700 rounded-xl p-5">
              <h3 className="text-neonBlue font-black mb-4 border-b border-gray-800 pb-2">1. Basic Case Selection</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1 font-bold uppercase">Jurisdiction</label>
                  <select className="w-full p-3 bg-black border border-gray-700 rounded-lg text-white" value={form.jurisdiction} onChange={(e) => set("jurisdiction", e.target.value)}>
                    <option>District Court</option>
                    <option>High Court</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1 font-bold uppercase">Case Type</label>
                  <select className="w-full p-3 bg-black border border-gray-700 rounded-lg text-white" value={form.caseType} onChange={(e) => set("caseType", e.target.value)}>
                    <option>Civil Suit</option>
                    <option>Criminal Appeal</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-400 mb-1 font-bold uppercase">Matter Description <span className="text-red-500">*</span></label>
                  <textarea required placeholder="Describe the matter in detail..." className="w-full h-24 p-3 bg-black border border-gray-700 rounded-lg text-white outline-none" value={form.matterType} onChange={(e) => set("matterType", e.target.value)} />
                </div>
              </div>
            </div>

            {/* Section 2: Petitioner */}
            <div className="bg-black/40 border border-gray-700 rounded-xl p-5">
              <h3 className="text-neonBlue font-black mb-4 border-b border-gray-800 pb-2">2. Petitioner Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className="block text-xs text-gray-400 mb-1 font-bold uppercase">Full Name *</label><input required type="text" className="w-full p-3 bg-black border border-gray-700 rounded-lg text-white outline-none" value={form.petitionerName} onChange={(e) => set("petitionerName", e.target.value)} /></div>
                <div><label className="block text-xs text-gray-400 mb-1 font-bold uppercase">Gender</label><select className="w-full p-3 bg-black border border-gray-700 rounded-lg text-white" value={form.petitionerGender} onChange={(e) => set("petitionerGender", e.target.value)}><option>Male</option><option>Female</option><option>Other</option></select></div>
                <div><label className="block text-xs text-gray-400 mb-1 font-bold uppercase">Date of Birth</label><input type="date" className="w-full p-3 bg-black border border-gray-700 rounded-lg text-white outline-none [color-scheme:dark]" value={form.petitionerDOB} onChange={(e) => set("petitionerDOB", e.target.value)} /></div>
                <div><label className="block text-xs text-gray-400 mb-1 font-bold uppercase">Mobile *</label><input required type="tel" className="w-full p-3 bg-black border border-gray-700 rounded-lg text-white outline-none" value={form.petitionerMobile} onChange={(e) => set("petitionerMobile", e.target.value)} /></div>
                <div className="md:col-span-2"><label className="block text-xs text-gray-400 mb-1 font-bold uppercase">Email *</label><input required type="email" className="w-full p-3 bg-black border border-gray-700 rounded-lg text-white outline-none" value={form.petitionerEmail} onChange={(e) => set("petitionerEmail", e.target.value)} /></div>
                <div className="md:col-span-3"><label className="block text-xs text-gray-400 mb-1 font-bold uppercase">Address</label><textarea className="w-full h-16 p-3 bg-black border border-gray-700 rounded-lg text-white outline-none" value={form.petitionerAddress} onChange={(e) => set("petitionerAddress", e.target.value)} /></div>
              </div>
            </div>

            {/* Section 3: Respondent */}
            <div className="bg-black/40 border border-gray-700 rounded-xl p-5">
              <h3 className="text-neonBlue font-black mb-4 border-b border-gray-800 pb-2">3. Respondent / Accused Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div><label className="block text-xs text-gray-400 mb-1 font-bold uppercase">Full Name *</label><input required type="text" className="w-full p-3 bg-black border border-gray-700 rounded-lg text-white outline-none" value={form.respondentName} onChange={(e) => set("respondentName", e.target.value)} /></div>
                <div><label className="block text-xs text-gray-400 mb-1 font-bold uppercase">Gender</label><select className="w-full p-3 bg-black border border-gray-700 rounded-lg text-white" value={form.respondentGender} onChange={(e) => set("respondentGender", e.target.value)}><option>Male</option><option>Female</option><option>Other</option></select></div>
                <div><label className="block text-xs text-gray-400 mb-1 font-bold uppercase">Date of Birth</label><input type="date" className="w-full p-3 bg-black border border-gray-700 rounded-lg text-white outline-none [color-scheme:dark]" value={form.respondentDOB} onChange={(e) => set("respondentDOB", e.target.value)} /></div>
                <div><label className="block text-xs text-gray-400 mb-1 font-bold uppercase">Mobile</label><input type="tel" className="w-full p-3 bg-black border border-gray-700 rounded-lg text-white outline-none" value={form.respondentMobile} onChange={(e) => set("respondentMobile", e.target.value)} /></div>
                <div className="md:col-span-2"><label className="block text-xs text-gray-400 mb-1 font-bold uppercase">Email *</label><input required type="email" className="w-full p-3 bg-black border border-gray-700 rounded-lg text-white outline-none" value={form.respondentEmail} onChange={(e) => set("respondentEmail", e.target.value)} /></div>
                <div className="md:col-span-3"><label className="block text-xs text-gray-400 mb-1 font-bold uppercase">Address</label><textarea className="w-full h-16 p-3 bg-black border border-gray-700 rounded-lg text-white outline-none" value={form.respondentAddress} onChange={(e) => set("respondentAddress", e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-800 pt-4">
                <div><label className="block text-xs text-gray-400 mb-1 font-bold uppercase">Legal Act *</label><input required type="text" placeholder="e.g. Indian Penal Code, 1860" className="w-full p-3 bg-black border border-gray-700 rounded-lg text-white outline-none" value={form.legalAct} onChange={(e) => set("legalAct", e.target.value)} /></div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1 font-bold uppercase">Select Section</label>
                  <select className="w-full p-3 bg-black border border-gray-700 rounded-lg text-white" value={form.legalSection} onChange={(e) => set("legalSection", e.target.value)}>
                    {sections.map((s, i) => <option key={i} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button type="button" onClick={() => setStep(1)} className="px-6 py-3 border border-gray-700 text-gray-400 rounded-xl hover:border-gray-500 hover:text-white transition font-bold">← Back</button>
              <button type="submit" disabled={submitting} className="flex-1 bg-neonBlue text-black font-black py-3 rounded-xl hover:opacity-90 transition shadow-[0_0_15px_rgba(0,240,255,0.3)] disabled:opacity-50">
                {submitting ? "Submitting..." : "✓ Submit Case Request"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default NewCase;
