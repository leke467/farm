import { useState, useRef, useEffect } from 'react';
import { FiMessageCircle, FiX, FiSend, FiRefreshCw, FiTrendingUp, FiTrendingDown, FiAlertCircle } from 'react-icons/fi';
import { useFarmData } from '../context/FarmDataContext';
import apiService from '../services/api';

const AIAgentPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState(null);
  const messagesEndRef = useRef(null);
  const { animals, crops, expenses } = useFarmData();

  // Generate AI insights from backend service
  const generateInsights = async () => {
    setLoading(true);
    try {
      // Call backend AI service
      const response = await apiService.get('/ai-agent/analyze/');
      
      if (!response || response._error || !response.recommendations) {
        console.error('API Response:', response);
        throw new Error('Invalid response from AI service');
      }

      const analysis = response;
      setInsights(analysis);

      // Create AI message with summary
      const summary = `📊 **Farm Analysis Complete**\n\n💡 **Top Opportunities:**\n${analysis.recommendations.slice(0, 2).map(r => `• ${r.title}: ${r.description}\n  → ${r.savings || r.impact}`).join('\n')}\n\n⚠️ **Alerts & Notices:**\n${analysis.alerts.slice(0, 2).map(a => `${a.emoji} ${a.message}`).join('\n')}\n\n💬 Ask me for details on any recommendation!`;

      setMessages(prev => [{ id: 1, type: 'bot', text: summary }, ...prev.filter(m => m.id !== 1)]);
      return analysis;
    } catch (error) {
      console.error('Error generating insights:', error);
      // Fallback message if AI fails
      setMessages(prev => [
        { 
          id: 1, 
          type: 'bot', 
          text: 'Sorry, I encountered an error analyzing your farm data. Please try again or contact support.' 
        }, 
        ...prev.filter(m => m.id !== 1)
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-analyze on open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      generateInsights();
      setMessages([
        {
          id: 1,
          type: 'bot',
          text: "🤖 Analyzing your farm data...",
        },
      ]);
    }
  }, [isOpen, messages.length]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: input,
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Show thinking indicator
      setMessages(prev => [...prev, {
        id: Date.now() + 0.5,
        type: 'bot',
        text: '🤖 Thinking...',
      }]);

      // Call backend Gemini chat API
      const response = await apiService.post('/ai-agent/chat/', {
        message: userMessage.text,
      }, { timeout: 30000 }); // 30 second timeout

      if (response && response.response && !response._error) {
        // Remove thinking indicator and add response
        setMessages(prev => [
          ...prev.filter(m => m.id !== Date.now() + 0.5),
          {
            id: Date.now() + 1,
            type: 'bot',
            text: response.response,
          }
        ]);
      } else {
        throw new Error(response?._error ? response.detail || response.error : 'Invalid response from AI service');
      }
    } catch (error) {
      console.error('Chat error:', error);
      
      // Remove thinking indicator
      setMessages(prev => prev.filter(m => m.id !== Date.now() + 0.5));
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: `❌ Error: ${error.response?.data?.error || error.message || 'Failed to get AI response. Please try again.'}`,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-green-600 hover:bg-green-700 text-white p-4 rounded-full shadow-lg z-40 transition-all"
        title="AI Farm Assistant"
      >
        <FiMessageCircle size={24} />
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-2xl z-40 flex flex-col max-h-[600px]">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 rounded-t-lg flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg">Farm AI Assistant</h3>
              <p className="text-sm opacity-90">Profitability & Recommendations</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-green-600 p-1 rounded">
              <FiX size={20} />
            </button>
          </div>

          {/* Recommendations & Alerts - shown when insights available */}
          {insights && !loading && (
            <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-blue-50 border-b space-y-3 max-h-72 overflow-y-auto">
              {/* Terra AI Suggests Header */}
              <div className="flex items-center gap-2 pb-2 border-b-2 border-green-300">
                <div className="text-2xl">🤖</div>
                <div>
                  <div className="font-bold text-green-700">Terra AI Suggests</div>
                  <div className="text-xs text-gray-600">Personalized recommendations for your farm</div>
                </div>
              </div>

              {/* Alerts */}
              {insights.alerts?.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-gray-700">⚡ Live Alerts:</div>
                  {insights.alerts?.map((alert, idx) => (
                    <div key={idx} className={`text-xs p-2 rounded flex gap-2 items-start font-medium ${
                      alert.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      alert.type === 'success' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      <span className="text-lg flex-shrink-0">{alert.emoji}</span>
                      <span>{alert.message}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick Recommendations */}
              <div>
                <div className="text-xs font-semibold text-gray-700 mb-2">💡 This Week's Top Opportunities:</div>
                <div className="space-y-2">
                  {insights.recommendations?.slice(0, 3).map((rec, idx) => (
                    <div 
                      key={idx}
                      onClick={() => setInput(`Tell me more about: ${rec.title}`)}
                      className={`p-2.5 rounded cursor-pointer hover:shadow-md transition text-xs font-medium ${
                        rec.priority === 'high' ? 'bg-gradient-to-r from-red-100 to-red-50 border-l-4 border-red-500 hover:from-red-200' :
                        rec.priority === 'medium' ? 'bg-gradient-to-r from-orange-100 to-orange-50 border-l-4 border-orange-500 hover:from-orange-200' :
                        'bg-gradient-to-r from-blue-100 to-blue-50 border-l-4 border-blue-500 hover:from-blue-200'
                      }`}
                    >
                      <div className="font-bold text-gray-900">{rec.title}</div>
                      <div className="text-gray-700 mt-0.5">{rec.description}</div>
                      <div className="text-gray-600 mt-1 flex justify-between items-center">
                        <span>{rec.savings || rec.impact}</span>
                        <span className="text-xs bg-white px-2 py-1 rounded">→ {rec.action}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* See All Recommendations */}
              <button 
                onClick={() => setInput('Show me all recommendations')}
                className="w-full text-xs bg-green-600 hover:bg-green-700 text-white p-2 rounded font-semibold transition"
              >
                See All {insights.recommendations?.length || 0} Suggestions →
              </button>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-xs p-3 rounded-lg whitespace-pre-wrap text-sm ${
                    msg.type === 'user'
                      ? 'bg-green-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-800'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t p-3 flex gap-2 bg-white rounded-b-lg">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask anything..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-600"
            />
            <button
              onClick={handleSendMessage}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg disabled:opacity-50"
            >
              <FiSend size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AIAgentPanel;
