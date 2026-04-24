import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

function ProtectedRoute({ children }) {
  const [authState, setAuthState] = useState("checking"); // always start checking

  useEffect(() => {
    // onAuthStateChanged fires once with the resolved state — never trust initial null
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        localStorage.setItem("mock_uid", user.uid);
        setAuthState("ok");
      } else {
        localStorage.removeItem("mock_uid");
        setAuthState("denied");
      }
    });
    return () => unsub();
  }, []);

  if (authState === "checking") {
    return (
      <div className="h-screen bg-darkBg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-neonBlue border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return authState === "ok" ? children : <Navigate to="/" replace />;
}

export default ProtectedRoute;
