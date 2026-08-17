import React, { useRef, useState } from 'react';
import { RoadmapBuilderProvider } from '../../context/RoadmapBuilderContext';
import { useRoadmapBuilder } from '../../hooks/useRoadmapBuilder';
import { NodeCanvas } from './NodeCanvas';
import { NodeModal } from './NodeModal';
import { parseStaticRoadmap, type StaticRoadmap } from '../../utils/roadmapParser';
import {
  exportToJSON,
  validateRoadmapJSON,
  downloadSVG,
  downloadPNG,
} from '../../utils/exportRoadmap';
import { roadmapData } from '../../data/roadmapData';
import { adaptiveEngineService } from '../../services/adaptiveEngine';
import {
  ArrowLeft,
  Plus,
  Download,
  Upload,
  RotateCcw,
  Layers,
  BookOpen,
  AlertCircle,
  Edit,
  Check,
  Bot,
} from 'lucide-react';

// Use StaticRoadmap from roadmapParser — eliminates as any casts
// when accessing domain keys and title fields in the builder.
type RoadmapDataMap = Record<string, StaticRoadmap>;

interface RoadmapBuilderInnerProps {
  onBack: () => void;
}

const typedRoadmapData = roadmapData as RoadmapDataMap;

const RoadmapBuilderInner: React.FC<RoadmapBuilderInnerProps> = ({ onBack }) => {
  const {
    nodes,
    roadmapTitle,
    roadmapDescription,
    setRoadmapTitle,
    setRoadmapDescription,
    loadRoadmap,
    resetRoadmap,
    addNode,
    setNodes,
    setSelectedNodeId,
  } = useRoadmapBuilder();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiStatus, setAiStatus] = useState<{
    message: string;
    type: 'success' | 'info' | 'error';
  } | null>(null);

  const showAiStatus = (message: string, type: 'success' | 'info' | 'error') => {
    setAiStatus({ message, type });
    setTimeout(() => setAiStatus(null), 5000);
  };
  const [activeTheme, setActiveTheme] = useState<'dark' | 'light'>(() => {
    return (document.documentElement.getAttribute('data-theme') as 'dark' | 'light') || 'dark';
  });

  // Track if we are editing title/description inline
  const [isEditingMeta, setIsEditingMeta] = useState(false);
  // Replaces window.confirm() — stores the pending domain key when an import
  // would overwrite existing nodes, then shows an inline confirmation dialog.
  const [pendingImportKey, setPendingImportKey] = useState<string | null>(null);
  const [metaTitle, setMetaTitle] = useState(roadmapTitle);
  const [metaDesc, setMetaDesc] = useState(roadmapDescription);
  const [notice, setNotice] = useState<string | null>(null);

  // Auto-clear notice after 5 seconds
  React.useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(t);
  }, [notice]);

  // Sync theme changes
  React.useEffect(() => {
    const observer = new MutationObserver(() => {
      const currentTheme =
        (document.documentElement.getAttribute('data-theme') as 'dark' | 'light') || 'dark';
      setActiveTheme(currentTheme);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, []);

  // Handle addition of a generic new node
  const handleAddNewNode = () => {
    addNode({
      title: 'New Topic',
      description:
        'Click the edit button (✎) to add a description, prerequisites, and resource links.',
      x: 350,
      y: 100 + nodes.length * 60, // staggered visual stacking
      status: 'Not Started',
      notes: '',
      resources: [],
      prerequisites: [],
    });
  };

  // Import static NexaSphere Roadmaps
  const handleImportStatic = (domainKey: string) => {
    if (!domainKey) return;
    const staticData = typedRoadmapData[domainKey];
    if (!staticData) return;

    if (
      nodes.length > 0 &&
      !confirm(
        'Loading this base template will overwrite your active workspace. Do you wish to continue?'
      )
    ) {
      return;
    }
    applyImport(domainKey);
  };

  const applyImport = (domainKey: string) => {
    const staticData = (roadmapData as any)[domainKey];
    if (!staticData) return;
    const { title, description, nodes: parsedNodes } = parseStaticRoadmap(domainKey, staticData);
    loadRoadmap(title, description, parsedNodes);
    setMetaTitle(title);
    setMetaDesc(description);
  };

  // Import custom workspace JSON
  const handleImportJSONFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonStr = event.target?.result as string;
        const rawData = JSON.parse(jsonStr);

        // Validate raw json schema
        const validated = validateRoadmapJSON(rawData);

        loadRoadmap(validated.title, validated.description, validated.nodes);
        setMetaTitle(validated.title);
        setMetaDesc(validated.description);
        setNotice('Roadmap imported and restored successfully.');
      } catch (err: any) {
        let errorMessage = 'Malformed JSON Schema: could not load roadmap.';
        if (err instanceof Error && err.message) {
          errorMessage = `Validation Error: ${err.message}`;
        } else if (typeof err === 'string') {
          errorMessage = `Validation Error: ${err}`;
        } else if (err && typeof err === 'object' && err.error) {
          errorMessage = `Validation Error: ${err.error}`;
        }
        setNotice(errorMessage);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset file input trigger
  };

  // Trigger JSON Export
  const handleExportJSON = () => {
    exportToJSON(roadmapTitle, roadmapDescription, nodes);
  };

  // Reset workspace
  const handleResetWorkspace = () => {
    if (
      confirm(
        'Are you sure you want to clear your current workspace? All unsaved custom data will be deleted.'
      )
    ) {
      resetRoadmap();
      setMetaTitle('New Learning Path');
      setMetaDesc('Custom learning flow created on NexaSphere.');
    }
  };

  const handleSaveMeta = () => {
    setRoadmapTitle(metaTitle);
    setRoadmapDescription(metaDesc);
    setIsEditingMeta(false);
  };

  const handleGenerateAIPath = async () => {
    try {
      setIsGenerating(true);
      const completedNodeIds = nodes.filter((n) => n.status === 'Completed').map((n) => n.id);

      // Fetch missing skills from ResumeAnalyzer via localStorage or pass hardcoded mock
      const savedResume = localStorage.getItem('ns_resume_analysis');
      let missingSkills = ['System Design', 'Docker', 'GraphQL']; // Default mock
      if (savedResume) {
        try {
          const parsed = JSON.parse(savedResume);
          if (parsed.missingSkills) missingSkills = parsed.missingSkills;
        } catch (e) {}
      }

      const newNodes = await adaptiveEngineService.getAdaptiveSuggestions({
        currentNodes: nodes,
        completedNodeIds,
        missingSkills,
      });

      if (newNodes.length > 0) {
        setNodes([...nodes, ...newNodes]);
        showAiStatus(
          `AI generated ${newNodes.length} adaptive learning milestones based on your profile.`,
          'success'
        );
      } else {
        showAiStatus('No new adaptive milestones generated at this time.', 'info');
      }
    } catch (err: any) {
      showAiStatus('Failed to generate AI roadmap. ' + err.message, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="roadmap-builder-container">
      {/* AI Status Banner */}
      {aiStatus && (
        <div
          role="status"
          className="mb-4 p-3 rounded-xl flex items-center justify-between text-sm border"
          style={{
            backgroundColor:
              aiStatus.type === 'success'
                ? 'rgba(16, 185, 129, 0.15)'
                : aiStatus.type === 'info'
                  ? 'rgba(59, 130, 246, 0.15)'
                  : 'rgba(239, 68, 68, 0.15)',
            borderColor:
              aiStatus.type === 'success'
                ? '#10b981'
                : aiStatus.type === 'info'
                  ? '#3b82f6'
                  : '#ef4444',
            color:
              aiStatus.type === 'success'
                ? '#34d399'
                : aiStatus.type === 'info'
                  ? '#60a5fa'
                  : '#f87171',
          }}
        >
          <span>
            {aiStatus.type === 'success' ? '✅' : aiStatus.type === 'info' ? 'ℹ️' : '⚠️'}{' '}
            {aiStatus.message}
          </span>
          <button
            onClick={() => setAiStatus(null)}
            className="ml-2 text-base hover:opacity-80"
            aria-label="Dismiss AI status"
          >
            &times;
          </button>
        </div>
      )}

      {/* Top Header Layout */}
      <header className="builder-header flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="btn btn-sm btn-outline back-btn"
            aria-label="Go back to Learning Roadmaps"
          >
            <ArrowLeft size={16} /> Back
          </button>

          <div className="builder-title-block">
            {isEditingMeta ? (
              <div className="meta-edit-inputs glassmorphic-panel p-4 flex flex-col gap-2 rounded-xl mt-2">
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  className="glass-input text-lg font-black font-orbitron w-full"
                  placeholder="Roadmap Title"
                />
                <input
                  type="text"
                  value={metaDesc}
                  onChange={(e) => setMetaDesc(e.target.value)}
                  className="glass-input text-sm w-full"
                  placeholder="Short Description"
                />
                <div className="flex gap-2 justify-end mt-2">
                  <button
                    onClick={handleSaveMeta}
                    className="btn btn-sm btn-primary flex items-center gap-1"
                  >
                    <Check size={14} /> Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 group">
                <div>
                  <h1 className="builder-main-title text-2xl font-black font-orbitron tracking-wide text-t1">
                    {roadmapTitle}
                  </h1>
                  <p className="builder-main-desc text-xs text-t2 mt-1">{roadmapDescription}</p>
                </div>
                <button
                  onClick={() => {
                    setMetaTitle(roadmapTitle);
                    setMetaDesc(roadmapDescription);
                    setIsEditingMeta(true);
                  }}
                  className="meta-edit-trigger opacity-0 group-hover:opacity-100 transition-opacity ml-2 text-t3 hover:text-brand-red-primary"
                  title="Rename Roadmap"
                >
                  <Edit size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Global Toolbar Panel */}
        <div className="builder-toolbar glassmorphic-panel flex flex-wrap gap-2 p-2 rounded-2xl">
          {/* AI Adaptive Generation Button */}
          <button
            onClick={handleGenerateAIPath}
            disabled={isGenerating}
            className="btn btn-sm flex items-center gap-1 text-xs"
            style={{
              background: 'linear-gradient(45deg, var(--c1), var(--c2))',
              color: '#fff',
              border: 'none',
              opacity: isGenerating ? 0.7 : 1,
            }}
            title="Generate personalized path based on Resume gaps and progress"
          >
            <Bot size={14} className={isGenerating ? 'animate-pulse' : ''} />{' '}
            {isGenerating ? 'Generating...' : 'AI Adapt Path'}
          </button>

          {/* Add New Node button */}
          <button
            onClick={handleAddNewNode}
            className="btn btn-sm btn-primary flex items-center gap-1 text-xs"
            title="Create a new learning card"
          >
            <Plus size={14} /> Add Topic
          </button>

          {/* Import Base Roadmaps selector */}
          <div className="select-dropdown-container flex items-center bg-card-bg border border-border-color rounded-xl px-2">
            <BookOpen size={13} className="text-t3 mr-1" />
            <select
              onChange={(e) => {
                handleImportStatic(e.target.value);
                e.target.value = ''; // Reset
              }}
              className="dropdown-select text-xxs font-black uppercase text-t2 bg-transparent border-none py-1 focus:outline-none"
              defaultValue=""
            >
              <option value="" disabled>
                Import Base Path
              </option>
              {Object.keys(roadmapData).map((key) => (
                <option key={key} value={key}>
                  {(roadmapData as RoadmapDataMap)[key].title}
                </option>
              ))}
            </select>
          </div>

          {/* Export JSON Button */}
          <button
            onClick={handleExportJSON}
            className="btn btn-sm btn-outline flex items-center gap-1 text-xs"
            title="Save roadmap design as a custom JSON file"
          >
            <Download size={13} /> Save Workspace
          </button>

          {/* Import JSON Trigger */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-sm btn-outline flex items-center gap-1 text-xs"
            title="Upload and restore a custom JSON roadmap workspace"
          >
            <Upload size={13} /> Load Workspace
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportJSONFile}
            style={{ display: 'none' }}
          />

          {/* Export Canvas Image dropdown */}
          <div className="select-dropdown-container flex items-center bg-card-bg border border-border-color rounded-xl px-2">
            <Layers size={13} className="text-t3 mr-1" />
            <select
              onChange={(e) => {
                const action = e.target.value;
                if (action === 'svg')
                  downloadSVG(roadmapTitle, roadmapDescription, nodes, activeTheme);
                if (action === 'png')
                  downloadPNG(roadmapTitle, roadmapDescription, nodes, activeTheme);
                e.target.value = ''; // Reset
                if (action === 'svg')
                  downloadSVG(roadmapTitle, roadmapDescription, nodes, activeTheme);
                if (action === 'png')
                  downloadPNG(roadmapTitle, roadmapDescription, nodes, activeTheme);
                e.target.value = ''; // Reset
              }}
              className="dropdown-select text-xxs font-black uppercase text-t2 bg-transparent border-none py-1 focus:outline-none"
              defaultValue=""
            >
              <option value="" disabled>
                Export as Image
              </option>
              <option value="png">PNG Format</option>
              <option value="svg">SVG Vector</option>
            </select>
          </div>

          {/* Reset Workspace trigger */}
          <button
            onClick={handleResetWorkspace}
            className="btn btn-sm btn-danger flex items-center gap-1 text-xs"
            title="Clear all cards from canvas"
          >
            <RotateCcw size={13} /> Reset
          </button>
        </div>
      </header>

      {/* Main Workspace split panel layout */}
      <div
        className="builder-split-workspace"
        style={{ display: 'flex', gap: '24px', alignItems: 'stretch' }}
      >
        {/* Sidebar Accessibility Listing of nodes */}
        <aside
          className="builder-sidebar glassmorphic-panel flex flex-col p-4 w-72 rounded-2xl flex-shrink-0 hide-on-mobile"
          style={{ maxHeight: '72vh', overflowY: 'auto' }}
        >
          <div className="flex items-center gap-2 border-b border-border-color pb-3 mb-4">
            <Layers size={15} className="text-brand-red" />
            <h2 className="text-xs font-black uppercase tracking-wider text-t1">
              Curriculum Map ({nodes.length})
            </h2>
          </div>

          {nodes.length === 0 ? (
            <div className="text-center py-8 text-t3 text-xs">
              <AlertCircle size={20} className="mx-auto mb-2 opacity-50" />
              Canvas is empty.
              <br />
              Add topics or load a template!
            </div>
          ) : (
            <ul
              className="sidebar-nodes-ul"
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {nodes.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => setSelectedNodeId(n.id)}
                    className="sidebar-node-btn w-full text-left glassmorphic-panel p-3 rounded-xl hover:border-border-hover transition-all text-xs flex justify-between items-center"
                  >
                    <span className="font-bold text-t1 truncate pr-2">{n.title}</span>
                    <span
                      className="text-xxs font-black px-2 py-0.5 rounded-md uppercase"
                      style={{
                        backgroundColor:
                          n.status === 'Completed'
                            ? 'rgba(76, 175, 80, 0.1)'
                            : n.status === 'In Progress'
                              ? 'rgba(255, 193, 7, 0.1)'
                              : n.status === 'Stuck'
                                ? 'rgba(230, 57, 70, 0.1)'
                                : 'rgba(255, 255, 255, 0.05)',
                        color:
                          n.status === 'Completed'
                            ? '#4CAF50'
                            : n.status === 'In Progress'
                              ? '#FFC107'
                              : n.status === 'Stuck'
                                ? '#E63946'
                                : 'var(--t3)',
                      }}
                    >
                      {n.status === 'Not Started' ? 'New' : n.status.substring(0, 11)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Dynamic Drag-and-Drop canvas grid */}
        <main
          className="canvas-container-outer glassmorphic-panel rounded-2xl flex-grow overflow-auto"
          style={{ maxHeight: '72vh' }}
        >
          <NodeCanvas theme={activeTheme} />
        </main>
      </div>

      {/* Accessible Attribute Editor Modal */}
      <NodeModal theme={activeTheme} />

      {/* Inline confirmation dialog — replaces blocking window.confirm() */}
      {pendingImportKey && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-import-title"
          aria-describedby="confirm-import-desc"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <div className="glass-panel rounded-2xl p-6 max-w-sm w-full mx-4 flex flex-col gap-4">
            <h2 id="confirm-import-title" className="text-base font-bold text-t1">
              Overwrite Workspace?
            </h2>
            <p id="confirm-import-desc" className="text-sm text-t2">
              Loading this base template will overwrite your active workspace. Do you wish to
              continue?
            </p>
            <div className="flex gap-3 justify-end">
              <button className="btn btn-sm btn-outline" onClick={() => setPendingImportKey(null)}>
                Cancel
              </button>
              <button
                className="btn btn-sm btn-primary"
                autoFocus
                onClick={() => {
                  applyImport(pendingImportKey);
                  setPendingImportKey(null);
                }}
              >
                Overwrite
              </button>
            </div>
          </div>
        </div>
      )}
      {notice && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 bg-[#111] border border-border-color text-t1 px-4 py-3 rounded-xl flex items-center gap-2 shadow-2xl pop-in"
          style={{ maxWidth: '320px' }}
        >
          <span className="text-brand-red">✦</span>
          <span className="text-xs">{notice}</span>
          <button
            onClick={() => setNotice(null)}
            className="ml-auto text-t3 hover:text-t1 text-sm focus:outline-none"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export const RoadmapBuilder: React.FC<RoadmapBuilderInnerProps> = ({ onBack }) => {
  return (
    <RoadmapBuilderProvider>
      <RoadmapBuilderInner onBack={onBack} />
    </RoadmapBuilderProvider>
  );
};

export default RoadmapBuilder;
