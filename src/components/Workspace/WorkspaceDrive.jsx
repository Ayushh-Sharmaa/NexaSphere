import React, { useState, useEffect } from "react";
import { Upload, File } from "lucide-react";

export default function WorkspaceDrive({ workspaceId }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/workspaces/${workspaceId}/documents`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setFiles(data.data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch files", err);
        setLoading(false);
      });
  }, [workspaceId]);

  const handleUpload = () => {
    const fileName = prompt("Enter mock file name (e.g. design.pdf):");
    if (!fileName) return;

    fetch(`/api/workspaces/${workspaceId}/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fileName,
        size: Math.floor(Math.random() * 10000000),
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setFiles([...files, data.data]);
        }
      });
  };

  if (loading) return <div className="text-white">Loading files...</div>;

  return (
    <div className="bg-[#111] p-4 rounded-xl border border-white/10 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <File className="text-blue-400" /> Team Drive
        </h2>
        <button
          onClick={handleUpload}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded flex items-center gap-2 text-sm transition-colors"
        >
          <Upload size={16} /> Upload
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {files.length === 0 ? (
          <p className="text-white/40 text-center py-8">
            No files uploaded yet.
          </p>
        ) : (
          files.map((file) => (
            <div
              key={file.id}
              className="flex justify-between items-center bg-white/5 p-3 rounded hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <File size={20} className="text-white/60" />
                <div>
                  <p className="text-white text-sm font-medium">{file.name}</p>
                  <p className="text-white/40 text-xs">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <a
                href={file.url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:text-blue-300 text-xs"
              >
                Download
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
