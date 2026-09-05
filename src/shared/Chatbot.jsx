import React, { useState, useRef, useEffect } from 'react';
import '../styles/chatbot.css';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Nexa-Intelligence Online. How can I assist your journey?' }
  ]);
  const scrollRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');

    try {
      const response = await fetch('http://localhost:8000/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentInput }),
      });
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'bot', text: data.reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'bot', text: 'Nexa-AI: Core Link Failure. Try again.' }]);
    }
  };

  return (
    <div className="ns-chatbot-wrapper">
      {!isOpen ? (
        <button className="chat-trigger-btn" onClick={() => setIsOpen(true)}>
          <div className="pulse-ring"></div>
          💬
        </button>
      ) : (
        <div className="chat-window-glass">
          <div className="chat-header">
            <div className="header-status">
              <span className="status-dot"></span>
              <span>NEXA-AI</span>
            </div>
            <button className="close-btn" onClick={() => setIsOpen(false)}>×</button>
          </div>
          
          <div className="chat-messages" ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i} className={`msg-bubble ${m.role}`}>
                {m.text}
              </div>
            ))}
          </div>

          <div className="chat-input-container">
            <input 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Query system..."
            />
            <button onClick={handleSend} className="send-btn">🚀</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;