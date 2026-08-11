import { useState, useRef, useEffect } from "react";
import { FiMessageCircle, FiX, FiSend, FiRefreshCw, FiChevronDown, FiChevronUp, FiCpu, FiZap, FiCheckCircle, FiAlertTriangle } from "react-icons/fi";
import { useFarmData } from "../context/FarmDataContext";
import { getFarmCurrencySymbol } from "../utils/formatters";
import apiService from "../services/api";

const AIAgentPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState(null);
  const [activeTab, setActiveTab] = useState("chat"); // 'chat' | 'insights'
  const [showInsightsHeader, setShowInsightsHeader] = useState(true);
  const messagesEndRef = useRef(null);
  const { activeFarm } = useFarmData();

  const currencySymbol = getFarmCurrencySymbol(activeFarm);

  // Generate AI insights from backend service
  const generateInsights = async () => {
    setLoading(true);
    try {
      const response = await apiService.getAIAnalysis(activeFarm?.id);
      
      if (!response || response._error || !response.recommendations) {
        console.error("API Response:", response);
        throw new Error("Invalid response from AI service");
      }

      setInsights(response);

      // Replace hardcoded $ in response items
      const recs = (response.recommendations || []).slice(0, 2).map((r) => {
        const impact = (r.savings || r.impact || "").replace(/\$/g, currencySymbol);
        return `• ${r.title}: ${r.description}\n  → Impact: ${impact}`;
      }).join("\n\n");

      const alerts = (response.alerts || []).slice(0, 2).map(a => `${a.emoji} ${a.message}`).join("\n");

      const summary = `📊 **Farm Analysis Complete**\n\n💡 **Top Opportunities:**\n${recs}\n\n⚠️ **Alerts:**\n${alerts}\n\n💬 Ask me anything about your farm data or recommendations!`;

      setMessages(prev => [{ id: 1, type: "bot", text: summary }, ...prev.filter(m => m.id !== 1)]);
    } catch (error) {
      console.error("Error generating insights:", error);
      setMessages(prev => [
        { 
          id: 1, 
          type: "bot", 
          text: "Hello! I am your AI Farm Assistant. Ask me anything about your livestock, crop yield, inventory, or expenses." 
        }, 
        ...prev.filter(m => m.id !== 1)
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      generateInsights();
    }
  }, [isOpen, activeFarm?.id]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userText = input.trim();
    const userMessage = {
      id: Date.now(),
      type: "user",
      text: userText,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await apiService.chatWithAI(userText, null, activeFarm?.id);

      if (response && response.response && !response._error) {
        let aiText = response.response;
        // Clean dollar signs to active farm currency
        aiText = aiText.replace(/\$/g, currencySymbol);

        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            type: "bot",
            text: aiText,
          }
        ]);
      } else {
        throw new Error(response?._error ? response.detail || response.error : "Failed to get response");
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          type: "bot",
          text: `❌ Error: ${error.message || "Failed to contact AI service. Please try again."}`,
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Helper to render bold markdown and bullet points cleanly
  const renderFormattedText = (text) => {
    if (!text) return null;
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      // Parse **bold** substrings
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const lineContent = parts.map((part, pIdx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={pIdx} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      const trimmed = line.trim();

      if (trimmed.startsWith("•") || trimmed.startsWith("-")) {
        return (
          <div key={idx} className="flex items-start gap-1.5 ml-1 my-1 text-xs sm:text-sm">
            <span className="text-emerald-600 font-bold flex-shrink-0">•</span>
            <span className="leading-snug">{lineContent}</span>
          </div>
        );
      }

      if (trimmed.length === 0) {
        return <div key={idx} className="h-1.5" />;
      }

      return <p key={idx} className="my-1 leading-relaxed text-xs sm:text-sm">{lineContent}</p>;
    });
  };

  return (
    <>
      {/* Floating Launcher Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white p-3.5 sm:p-4 rounded-full shadow-2xl z-40 transition-all transform hover:scale-105 flex items-center gap-2 font-semibold text-sm border border-emerald-400/40"
        title="Farm AI Assistant"
      >
        <FiCpu className="w-5 h-5 animate-pulse text-amber-300" />
        <span className="hidden sm:inline">AI Farm Assistant</span>
      </button>

      {/* Floating AI Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:right-6 w-[94vw] sm:w-[480px] md:w-[520px] bg-white rounded-2xl shadow-2xl z-50 flex flex-col h-[650px] max-h-[85vh] border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-3.5 sm:p-4 flex justify-between items-center border-b border-emerald-800/40">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-600/30 rounded-xl text-emerald-400 border border-emerald-500/40">
                <FiCpu className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h3 className="font-bold text-base sm:text-lg text-white leading-tight flex items-center gap-2">
                  <span>Farm AI Assistant</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30 font-mono uppercase">
                    Gemini Live
                  </span>
                </h3>
                <p className="text-xs text-slate-300">Smart Profitability & Advisory</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5">
              <button
                onClick={generateInsights}
                disabled={loading}
                className="p-1.5 text-slate-300 hover:text-white transition-colors rounded-lg hover:bg-slate-800"
                title="Refresh Farm Analysis"
              >
                <FiRefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-400" : ""}`} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-300 hover:text-white transition-colors rounded-lg hover:bg-slate-800"
              >
                <FiX size={18} />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold">
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex-1 py-2.5 text-center transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === "chat"
                  ? "bg-white text-emerald-700 border-b-2 border-emerald-600 font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FiMessageCircle size={14} />
              <span>AI Chat Assistant</span>
            </button>
            <button
              onClick={() => setActiveTab("insights")}
              className={`flex-1 py-2.5 text-center transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === "insights"
                  ? "bg-white text-emerald-700 border-b-2 border-emerald-600 font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FiZap size={14} className="text-amber-500" />
              <span>Live Opportunities {insights?.recommendations ? `(${insights.recommendations.length})` : ""}</span>
            </button>
          </div>

          {/* TAB 1: AI CHAT TRANSCRIPT */}
          {activeTab === "chat" && (
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
              
              {/* Optional Collapsible Top Insights Bar */}
              {insights && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-200/60 p-2.5 text-xs">
                  <div
                    className="flex justify-between items-center cursor-pointer font-bold text-emerald-800"
                    onClick={() => setShowInsightsHeader(!showInsightsHeader)}
                  >
                    <span className="flex items-center gap-1.5">
                      <FiZap className="text-amber-600" />
                      <span>Top Farm Opportunity ({insights.recommendations?.[0]?.title || "Feed Optimization"})</span>
                    </span>
                    {showInsightsHeader ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                  </div>

                  {showInsightsHeader && insights.recommendations?.[0] && (
                    <div className="mt-2 bg-white p-2.5 rounded-xl border border-emerald-200 shadow-sm text-slate-700 space-y-1">
                      <div className="font-semibold text-slate-900 flex justify-between">
                        <span>{insights.recommendations[0].title}</span>
                        <span className="text-emerald-700 font-bold">
                          {(insights.recommendations[0].savings || insights.recommendations[0].impact || "").replace(/\$/g, currencySymbol)}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px]">
                        {insights.recommendations[0].description}
                      </p>
                      <button
                        onClick={() => setInput(`Tell me how to execute: ${insights.recommendations[0].title}`)}
                        className="text-[11px] font-bold text-emerald-700 hover:underline pt-0.5 block"
                      >
                        → Ask AI how to implement this recommendations
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Message Transcript Container */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] p-3 rounded-2xl shadow-sm ${
                        msg.type === "user"
                          ? "bg-emerald-600 text-white rounded-br-none"
                          : "bg-white border border-slate-200/90 text-slate-800 rounded-bl-none"
                      }`}
                    >
                      {msg.type === "user" ? (
                        <p className="text-xs sm:text-sm leading-relaxed">{msg.text}</p>
                      ) : (
                        renderFormattedText(msg.text)
                      )}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm flex items-center gap-2 text-xs text-slate-600">
                      <FiRefreshCw className="animate-spin text-emerald-600" size={14} />
                      <span>Gemini AI is analyzing farm metrics...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Prompt Input Footer */}
              <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Ask AI about sales, feed costs, or ROI..."
                  className="flex-1 px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-slate-900 bg-slate-50"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={loading || !input.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-xl disabled:opacity-40 transition-colors shadow-md flex-shrink-0"
                >
                  <FiSend size={16} />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE OPPORTUNITIES & ALERTS */}
          {activeTab === "insights" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {/* Alerts */}
              {insights?.alerts?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <FiAlertTriangle className="text-amber-500" />
                    <span>Live Operational Alerts</span>
                  </h4>
                  <div className="space-y-2">
                    {insights.alerts.map((alert, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border text-xs flex gap-2.5 items-start font-medium ${
                          alert.type === "warning"
                            ? "bg-amber-50 border-amber-200 text-amber-900"
                            : alert.type === "success"
                            ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                            : "bg-blue-50 border-blue-200 text-blue-900"
                        }`}
                      >
                        <span className="text-base flex-shrink-0">{alert.emoji}</span>
                        <span className="leading-snug">{alert.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations List */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <FiZap className="text-amber-500" />
                  <span>Personalized Farm Recommendations</span>
                </h4>
                <div className="space-y-2.5">
                  {insights?.recommendations?.map((rec, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setActiveTab("chat");
                        setInput(`Tell me more about executing: ${rec.title}`);
                      }}
                      className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer space-y-1.5"
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">{rec.title}</span>
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          {(rec.savings || rec.impact || "").replace(/\$/g, currencySymbol)}
                        </span>
                      </div>
                      <p className="text-slate-600 text-xs leading-relaxed">{rec.description}</p>
                      <div className="pt-1 flex justify-between items-center text-[11px] text-emerald-800 font-semibold border-t border-slate-100">
                        <span>Action: {rec.action}</span>
                        <span>Ask AI →</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </>
  );
};

export default AIAgentPanel;
