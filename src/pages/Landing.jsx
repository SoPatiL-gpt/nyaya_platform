import { useNavigate } from "react-router-dom";

function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-darkBg text-white flex flex-col">
      {/* Top Bar */}
      <div className="flex justify-between items-center px-10 py-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <span className="text-3xl">⚖️</span>
          <div>
            <h1 className="text-xl font-black text-neonBlue tracking-widest uppercase">Nyayadheesh</h1>
            <p className="text-xs text-gray-500 tracking-widest">LEGAL MANAGEMENT PLATFORM</p>
          </div>
        </div>
        <div className="text-xs text-gray-600 text-right">
          <p>Government of India Initiative</p>
          <p className="text-neonBlue">e-Justice Portal</p>
        </div>
      </div>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="text-center mb-16 max-w-3xl">
          <div className="inline-block bg-neonBlue/10 border border-neonBlue/30 text-neonBlue text-xs font-bold px-4 py-2 rounded-full mb-6 tracking-widest uppercase">
            Digital Court Management System
          </div>
          <h2 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
            Welcome to{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-neonBlue to-neonPurple">
              Nyayadheesh
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto leading-relaxed">
            A unified digital platform connecting Citizens with Advocates for seamless legal case management, scheduling, and real-time communication.
          </p>
        </div>

        {/* Login Cards */}
        <div className="flex flex-col md:flex-row gap-8 w-full max-w-2xl">
          {/* Client Card */}
          <div
            onClick={() => navigate("/client-login")}
            className="flex-1 cursor-pointer group bg-black/40 border border-neonBlue/40 hover:border-neonBlue rounded-2xl p-8 transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,240,255,0.2)] hover:scale-[1.02]"
          >
            <div className="text-5xl mb-4">👤</div>
            <h3 className="text-2xl font-bold text-neonBlue mb-2">Login as Client</h3>
            <p className="text-gray-400 text-sm mb-6">Register your case, track progress, communicate with your advocate and manage all legal documents.</p>
            <div className="flex items-center gap-2 text-neonBlue font-bold text-sm group-hover:gap-4 transition-all">
              <span>Enter Client Portal</span>
              <span>→</span>
            </div>
          </div>

          {/* Advocate Card */}
          <div
            onClick={() => navigate("/advocate-login")}
            className="flex-1 cursor-pointer group bg-black/40 border border-neonPurple/40 hover:border-neonPurple rounded-2xl p-8 transition-all duration-300 hover:shadow-[0_0_30px_rgba(157,0,255,0.2)] hover:scale-[1.02]"
          >
            <div className="text-5xl mb-4">⚖️</div>
            <h3 className="text-2xl font-bold text-neonPurple mb-2">Login as Advocate</h3>
            <p className="text-gray-400 text-sm mb-6">Manage assigned cases, schedule hearings, update timelines and communicate with clients securely.</p>
            <div className="flex items-center gap-2 text-neonPurple font-bold text-sm group-hover:gap-4 transition-all">
              <span>Enter Advocate Portal</span>
              <span>→</span>
            </div>
          </div>
        </div>

        {/* Info Strip */}
        <div className="mt-16 flex flex-wrap justify-center gap-8 text-center text-xs text-gray-600">
          <div><p className="text-2xl font-black text-white">100%</p><p>Secure & Encrypted</p></div>
          <div className="border-l border-gray-800 pl-8"><p className="text-2xl font-black text-white">Real-Time</p><p>Case Updates</p></div>
          <div className="border-l border-gray-800 pl-8"><p className="text-2xl font-black text-white">AI</p><p>Legal Assistant</p></div>
          <div className="border-l border-gray-800 pl-8"><p className="text-2xl font-black text-white">Firebase</p><p>Cloud Powered</p></div>
        </div>
      </div>

      <div className="text-center py-4 text-xs text-gray-700 border-t border-gray-900">
        © 2025 Nyayadheesh Platform · Final Year Project · All Rights Reserved
      </div>
    </div>
  );
}

export default Landing;
