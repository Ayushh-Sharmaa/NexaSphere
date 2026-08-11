import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import KanbanBoard from "../../components/Workspace/KanbanBoard";
import WorkspaceChat from "../../components/Workspace/WorkspaceChat";
import WorkspaceDrive from "../../components/Workspace/WorkspaceDrive";
import { LayoutGrid, MessageSquare, HardDrive } from "lucide-react";

export default function WorkspaceDashboard() {
  const { id } = useParams();
  const workspaceId = id || "1"; // default to 1 for demo
  const [activeTab, setActiveTab] = useState("kanban");

  // Mock user for Kanban Board
  const currentUser = { id: "user-1", name: "Current User" };

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a] text-white">
      <header className="px-6 py-4 border-b border-white/10 bg-[#111] flex justify-between items-center shrink-0">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
          Collaborative Workspace
        </h1>

        <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
          <button
            onClick={() => setActiveTab("kanban")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "kanban"
                ? "bg-white/10 text-white"
                : "text-white/50 hover:text-white/80 hover:bg-white/5"
            }`}
          >
            <LayoutGrid size={16} /> Kanban
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "chat"
                ? "bg-white/10 text-white"
                : "text-white/50 hover:text-white/80 hover:bg-white/5"
            }`}
          >
            <MessageSquare size={16} /> Chat
          </button>
          <button
            onClick={() => setActiveTab("drive")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "drive"
                ? "bg-white/10 text-white"
                : "text-white/50 hover:text-white/80 hover:bg-white/5"
            }`}
          >
            <HardDrive size={16} /> Drive
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden relative">
        {activeTab === "kanban" && (
          <div className="absolute inset-0">
            <KanbanBoard
              roomId={`workspace-${workspaceId}`}
              user={currentUser}
            />
          </div>
        )}

        {activeTab === "chat" && (
          <div className="absolute inset-0 p-6 flex justify-center">
            <div className="w-full max-w-4xl h-full">
              <WorkspaceChat workspaceId={workspaceId} />
            </div>
          </div>
        )}

        {activeTab === "drive" && (
          <div className="absolute inset-0 p-6 flex justify-center">
            <div className="w-full max-w-6xl h-full">
              <WorkspaceDrive workspaceId={workspaceId} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
