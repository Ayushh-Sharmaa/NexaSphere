import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoadmapBuilder } from '../../hooks/useRoadmapBuilder';
import { RoadmapNode } from '../../context/RoadmapBuilderContext';
import { Edit2, Trash2, Plus, Sparkles, AlertCircle } from 'lucide-react';

interface NodeCanvasProps {
  theme: 'dark' | 'light';
}

export const NodeCanvas: React.FC<NodeCanvasProps> = ({ theme }) => {
  const { nodes, updateNode, deleteNode, setSelectedNodeId, activeNodeId, setActiveNodeId } =
    useRoadmapBuilder();

  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  // Tracks the currently-attached window-level drag listeners so they can
  // be force-removed if the component unmounts mid-drag — handlePointerDown
  // attaches these outside any useEffect, so without this ref a drag that's
  // still in progress when the user navigates away would leave pointermove/
  // pointerup listeners attached to window indefinitely, holding a stale
  // closure over state setters from the unmounted component.
  const activeDragListenersRef = useRef<{
    move: (e: PointerEvent) => void;
    up: () => void;
  } | null>(null);

  useEffect(() => {
    return () => {
      if (activeDragListenersRef.current) {
        window.removeEventListener('pointermove', activeDragListenersRef.current.move);
        window.removeEventListener('pointerup', activeDragListenersRef.current.up);
        activeDragListenersRef.current = null;
      }
    };
  }, []);

  const [message, setMessage] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<RoadmapNode | null>(null);

  // Connection mode (visual clicking to connect nodes)
  const [connectSourceId, setConnectSourceId] = useState<string | null>(null);

  // Dimensions of a node card (width: 220px, height: 90px)
  const NODE_WIDTH = 220;
  const NODE_HEIGHT = 90;
  const CANVAS_WIDTH = 1800;
  const CANVAS_HEIGHT = 1200;

  // Pointer drag handler (fully responsive across touchscreen and mouse)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, node: RoadmapNode) => {
    // Avoid dragging when clicking action buttons
    const target = e.target as HTMLElement;
    if (target.closest('.action-btn') || target.closest('.connect-indicator')) return;

    e.preventDefault();
    setDraggedNodeId(node.id);
    setActiveNodeId(node.id);

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Get initial cursor offset relative to node origin
    const rect = canvas.getBoundingClientRect();
    const startX = e.clientX - rect.left - node.x;
    const startY = e.clientY - rect.top - node.y;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const newX = moveEvent.clientX - rect.left - startX;
      const newY = moveEvent.clientY - rect.top - startY;

      // Restrict node within canvas boundaries
      const boundedX = Math.max(10, Math.min(newX, CANVAS_WIDTH - NODE_WIDTH - 10));
      const boundedY = Math.max(10, Math.min(newY, CANVAS_HEIGHT - NODE_HEIGHT - 10));

      updateNode(node.id, { x: boundedX, y: boundedY });
    };

    const handlePointerUp = () => {
      setDraggedNodeId(null);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      activeDragListenersRef.current = null;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    activeDragListenersRef.current = { move: handlePointerMove, up: handlePointerUp };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Progress':
        return 'var(--warning, #FFC107)';
      case 'Completed':
        return 'var(--success, #4CAF50)';
      case 'Stuck':
        return 'var(--error, #E63946)';
      default:
        return theme === 'dark' ? '#6B6B6B' : '#8A8A8A';
    }
  };

  const getStatusShadow = (status: string) => {
    switch (status) {
      case 'In Progress':
        return '0 0 15px rgba(255, 193, 7, 0.4)';
      case 'Completed':
        return '0 0 15px rgba(76, 175, 80, 0.4)';
      case 'Stuck':
        return '0 0 15px rgba(230, 57, 70, 0.4)';
      default:
        return '0 4px 12px rgba(0, 0, 0, 0.2)';
    }
  };

  // Click handler to connect nodes in Connect Mode
  const handleNodeClick = (node: RoadmapNode) => {
    if (connectSourceId) {
      if (connectSourceId === node.id) {
        setConnectSourceId(null); // Cancel
        return;
      }

      // Avoid self-references or circular connections
      if (node.prerequisites.includes(connectSourceId)) {
        setMessage('Prerequisite connection already exists.');
        setConnectSourceId(null);
        return;
      }

      // Check for cycles
      const hasCycle = (source: string, target: string): boolean => {
        if (source === target) return true;
        const targetNode = nodes.find((n) => n.id === target);
        if (!targetNode) return false;
        for (const prereq of targetNode.prerequisites) {
          if (hasCycle(source, prereq)) return true;
        }
        return false;
      };

      if (hasCycle(node.id, connectSourceId)) {
        setMessage(
          'Invalid connection: adding this prerequisite will create a circular dependency loop.'
        );
        setConnectSourceId(null);
        return;
      }

      // Add connection: make connectSourceId a prerequisite of node.id
      updateNode(node.id, {
        prerequisites: [...node.prerequisites, connectSourceId],
      });

      setConnectSourceId(null);
    }
  };

  return (
    <div className="canvas-wrapper-outer">
      {message && (
        <div
          className="glassmorphic-panel"
          role="alert"
          style={{
            padding: '10px 14px',
            marginBottom: '12px',
            color: 'var(--c1)',
          }}
        >
          {message}
        </div>
      )}
      {deleteTarget && (
        <div
          className="glassmorphic-panel"
          role="dialog"
          aria-modal="true"
          style={{
            padding: '12px 14px',
            marginBottom: '12px',
            display: 'flex',
            gap: '10px',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <span>Delete node "{deleteTarget.title}"?</span>
          <span style={{ display: 'flex', gap: '8px' }}>
            <button
              aria-label="Interactive element"
              className="btn btn-sm btn-outline"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </button>
            <button
              aria-label="Interactive element"
              className="btn btn-sm btn-danger"
              onClick={() => {
                deleteNode(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              Delete
            </button>
          </span>
        </div>
      )}
      {/* Visual Workspace Controls bar */}
      <div className="canvas-instruction-bar glassmorphic-panel">
        <Sparkles size={16} className="text-brand-red animate-pulse" />
        <span className="instruction-text text-sm">
          {connectSourceId ? (
            <span className="text-warning font-semibold">
              Connecting Mode Active: Click target node to establish connection, or click source
              again to cancel. Connecting Mode Active: Click target node to establish connection, or
              click source again to cancel.
            </span>
          ) : (
            'Drag nodes to organize. Double click or click edit (✎) to customize resources & notes. Check (🔗) to draw prerequisite paths.'
          )}
        </span>
      </div>

      <div
        ref={canvasRef}
        className="interactive-roadmap-canvas"
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          position: 'relative',
          background: theme === 'dark' ? '#090909' : '#FAFAFA',
          overflow: 'hidden',
        }}
      >
        {/* Dynamic Grid Overlay */}
        <div className="canvas-grid-overlay" />

        {/* Connections SVG Overlay */}
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          <defs>
            <linearGradient id="glow-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--c1, #E63946)" />
              <stop offset="100%" stopColor="var(--c2, #FF5A5F)" />
            </linearGradient>
          </defs>

          {nodes.map((node) =>
            node.prerequisites.map((preId) => {
              const fromNode = nodes.find((n) => n.id === preId);
              if (!fromNode) return null;

              // Calculate start and end coordinates centered on node cards
              const x1 = fromNode.x + NODE_WIDTH / 2;
              const y1 = fromNode.y + NODE_HEIGHT / 2;
              const x2 = node.x + NODE_WIDTH / 2;
              const y2 = node.y + NODE_HEIGHT / 2;

              // Visual curves using Cubic Bezier
              const midY = (y1 + y2) / 2;
              const pathData = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;

              const strokeColor = getStatusColor(fromNode.status);
              const isDragging = draggedNodeId === fromNode.id || draggedNodeId === node.id;

              return (
                <g key={`${fromNode.id}-${node.id}`} style={{ transition: 'opacity 0.2s' }}>
                  {/* Glowing backup highlight */}
                  <path
                    d={pathData}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={isDragging ? 10 : 8}
                    opacity={0.12}
                    style={{ filter: 'blur(3px)' }}
                  />
                  {/* Base Connection line */}
                  <path
                    d={pathData}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={isDragging ? 4 : 3}
                    opacity={0.65}
                  />
                  {/* Energy flow animation on connection overlay */}
                  <path
                    d={pathData}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={isDragging ? 4 : 3}
                    strokeDasharray="10 8"
                    className="flowing-energy-line"
                    opacity={fromNode.status === 'Completed' ? 0.9 : 0.4}
                  />
                </g>
              );
            })
          )}
        </svg>

        {/* Nodes Layer */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            pointerEvents: 'none',
          }}
        >
          <AnimatePresence>
            {nodes.map((node) => {
              const statusColor = getStatusColor(node.status);
              const isSelected = activeNodeId === node.id;
              const isConnectingSource = connectSourceId === node.id;

              return (
                <motion.div
                  key={node.id}
                  layoutId={node.id}
                  onPointerDown={(e) => handlePointerDown(e, node)}
                  onClick={() => handleNodeClick(node)}
                  className={`canvas-node-card glassmorphic-panel ${isSelected ? 'focused-node' : ''} ${
                    isConnectingSource ? 'connecting-source-node' : ''
                  }`}
                  style={{
                    position: 'absolute',
                    left: node.x,
                    top: node.y,
                    width: NODE_WIDTH,
                    height: NODE_HEIGHT,
                    border: `1.5px solid ${isConnectingSource ? 'var(--warning)' : isSelected ? 'var(--c1)' : node.isAiGenerated ? 'var(--c2)' : statusColor}`,
                    borderRadius: '16px',
                    boxShadow:
                      node.isAiGenerated && !isSelected
                        ? '0 0 20px rgba(230, 57, 70, 0.2)'
                        : getStatusShadow(node.status),
                    cursor: draggedNodeId === node.id ? 'grabbing' : 'grab',
                    pointerEvents: 'auto',
                    userSelect: 'none',
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  tabIndex={0}
                  aria-label={`Node: ${node.title}. Status: ${node.status}. Prerequisites: ${node.prerequisites.length} connected.`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setSelectedNodeId(node.id);
                    }
                    if (e.key === 'Delete') {
                      setDeleteTarget(node);
                    }
                  }}
                >
                  <div className="node-card-inner">
                    {/* Status marker & AI Badge */}
                    <div className="node-status-badge flex justify-between w-full pr-2">
                      <div>
                        <span className="status-dot" style={{ backgroundColor: statusColor }} />
                        <span
                          className="status-text text-xxs font-bold uppercase"
                          style={{ color: statusColor }}
                        >
                          {node.status}
                        </span>
                      </div>
                      {node.isAiGenerated && (
                        <div
                          className="ai-indicator"
                          title={node.aiReason || 'Generated by Adaptive AI'}
                        >
                          <Sparkles size={12} className="text-brand-red animate-pulse" />
                        </div>
                      )}
                    </div>

                    {/* Node Info */}
                    <h3 className="node-card-title text-sm font-black text-t1 leading-tight truncate">
                      {node.title}
                    </h3>
                    <p className="node-card-desc text-xxs text-t2 leading-normal">
                      {node.description.substring(0, 50)}
                      {node.description.length > 50 ? '...' : ''}
                    </p>

                    {/* Action Panel overlaying on hover */}
                    <div className="node-card-actions">
                      <button
                        className="action-btn connect-indicator"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConnectSourceId(node.id);
                        }}
                        title="Connect to target node as prerequisite"
                        aria-label="Draw prerequisite path"
                      >
                        🔗
                      </button>
                      <button
                        className="action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedNodeId(node.id);
                        }}
                        title="Edit Node Details"
                        aria-label="Edit node"
                      >
                        <Edit2 size={11} />
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete node "${node.title}"?`)) {
                            deleteNode(node.id);
                          }
                        }}
                        title="Delete Node"
                        aria-label="Delete node"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
