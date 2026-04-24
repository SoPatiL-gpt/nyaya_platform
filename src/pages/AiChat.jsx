import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function AiChat() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const askAI = async () => {
    if (!input) return;
    setLoading(true);
    
    try {
      const res = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
        {
          contents: [
            {
              parts: [{ text: `You are a legal assistant. Answer clearly: ${input}` }]
            }
          ]
        }
      );

      setResponse(res.data.candidates[0].content.parts[0].text);
    } catch (err) {
      console.log(err);
      setResponse("Sorry, I am currently facing an error. Please try again later. 🤖");
    } finally {
      setLoading(false);
      setInput(""); // Clear input after sending
    }
  };

  return (
    <div className="h-screen flex flex-col bg-darkBg text-white p-5">
      <div className="flex items-center mb-6 border-b border-gray-700 pb-4">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white mr-4 transition">
          ← Back
        </button>
        <h2 className="text-2xl font-bold text-neonPurple">
          AI Legal Assistant 🤖
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto mb-4 p-6 bg-glass border border-neonPurple shadow-[0_0_15px_#9d00ff] rounded-xl flex flex-col">
        
        {/* Chat Output Area */}
        <div className="flex-1 overflow-y-auto mb-4 text-gray-200 text-lg whitespace-pre-wrap">
          {response ? response : <span className="text-gray-500 italic flex justify-center items-center h-full">Hi! I am your AI Legal Assistant. Ask me any legal questions you have.</span>}
          {loading && <span className="text-neonBlue mt-4 block font-bold animate-pulse">Thinking... 🤖</span>}
        </div>

        {/* Input Area */}
        <div className="flex gap-3">
          <input
            className="flex-1 p-4 bg-black border border-gray-700 rounded-xl text-white outline-none focus:border-neonPurple transition"
            placeholder="Ask legal question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && askAI()}
            disabled={loading}
          />

          <button
            onClick={askAI}
            disabled={loading}
            className="bg-neonPurple text-white font-bold px-8 rounded-xl shadow-[0_0_15px_#9d00ff] hover:opacity-80 transition disabled:opacity-50"
          >
            Ask
          </button>
        </div>
      </div>
    </div>
  );
}

export default AiChat;