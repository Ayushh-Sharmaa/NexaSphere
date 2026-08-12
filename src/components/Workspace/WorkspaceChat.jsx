import React, { useState, useEffect, useRef } from "react";
import { Send, MessageSquare } from "lucide-react";

export default function WorkspaceChat({ workspaceId }) {
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    fetch(`/api/workspaces/${workspaceId}/discussions`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setMessages(data.data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch messages", err);
        setLoading(false);
      });
  }, [workspaceId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!msg.trim()) return;

    const content = msg.trim();
    setMsg("");

    fetch(`/api/workspaces/${workspaceId}/discussions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setMessages([...messages, data.data]);
        }
      });
  };

  return (
    <div className="bg-[#111] border border-white/10 rounded-xl h-full flex flex-col">
      <div className="p-4 border-b border-white/10 shrink-0">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <MessageSquare className="text-emerald-400" /> Team Chat
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <p className="text-white/40 text-center">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-white/40 text-center py-8">
            No messages yet. Start the conversation!
          </p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-xs font-bold">
                  {m.sender?.name?.[0]?.toUpperCase() || "U"}
                </span>
                <span className="text-white/80 text-sm font-medium">
                  {m.sender?.name || "User"}
                </span>
                <span className="text-white/40 text-xs">
                  {new Date(m.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="ml-8 text-white text-sm bg-white/5 inline-block p-2 rounded-lg self-start">
                {m.content}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSend}
        className="p-3 border-t border-white/10 shrink-0 flex gap-2"
      >
        <input
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder="Type message..."
          className="w-full p-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30"
        />
        <button
          type="submit"
          disabled={!msg.trim()}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
