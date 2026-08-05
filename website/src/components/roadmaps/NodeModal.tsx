import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useRoadmapBuilder } from '../../hooks/useRoadmapBuilder';
import { X, Plus, Trash2, Globe, AlertCircle, Link, CheckSquare, ListPlus } from 'lucide-react';

interface NodeModalProps {
  theme: 'dark' | 'light';
}

export const NodeModal: React.FC<NodeModalProps> = ({ theme }) => {
  const { nodes, selectedNodeId, setSelectedNodeId, updateNode } = useRoadmapBuilder();

  // Reference the active node details
  const node = nodes.find((n) => n.id === selectedNodeId);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'Not Started' | 'In Progress' | 'Completed' | 'Stuck'>(
    'Not Started'
  );
  const [notes, setNotes] = useState('');
  const [resources, setResources] = useState<{ title: string; url: string }[]>([]);
  const [prerequisites, setPrerequisites] = useState<string[]>([]);

  // Local helper states for adding resources
  const [newResTitle, setNewResTitle] = useState('');
  const [newResUrl, setNewResUrl] = useState('');
  const [urlError, setUrlError] = useState('');

  const modalRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Sync state with selected node
  useEffect(() => {
    if (node) {
      setTitle(node.title);
      setDescription(node.description);
      setStatus(node.status);
      setNotes(node.notes);
      setResources(node.resources || []);
      setPrerequisites(node.prerequisites || []);
      setNewResTitle('');
      setNewResUrl('');
      setUrlError('');

      // Auto focus title input on mount for accessibility
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 50);
    }
  }, [selectedNodeId, node]);

  // Trap focus inside modal & Escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedNodeId(null);
      }

      // Basic tab-loop focus trap
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    if (selectedNodeId) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, setSelectedNodeId]);

  if (!selectedNodeId || !node) return null;

  // Handle resource additions
  const handleAddResource = () => {
    if (!newResTitle.trim() || !newResUrl.trim()) return;

    // Direct url validation check
    try {
      new URL(newResUrl);
      setUrlError('');
    } catch (_) {
      setUrlError('Please enter a valid URL (include http:// or https://)');
      return;
    }

    const updatedResources = [...resources, { title: newResTitle.trim(), url: newResUrl.trim() }];
    setResources(updatedResources);
    updateNode(node.id, { resources: updatedResources });

    setNewResTitle('');
    setNewResUrl('');
  };

  const handleRemoveResource = (index: number) => {
    const updated = resources.filter((_, idx) => idx !== index);
    setResources(updated);
    updateNode(node.id, { resources: updated });
  };

  // Checkbox handler for prerequisites
  const handlePrereqToggle = (targetId: string) => {
    let updatedPrereqs = [...prerequisites];
    if (updatedPrereqs.includes(targetId)) {
      updatedPrereqs = updatedPrereqs.filter((id) => id !== targetId);
    } else {
      // Cycle detection validation check
      const hasCycle = (source: string, target: string): boolean => {
        if (source === target) return true;
        const targetNode = nodes.find((n) => n.id === target);
        if (!targetNode) return false;
        for (const prereq of targetNode.prerequisites) {
          if (hasCycle(source, prereq)) return true;
        }
        return false;
      };

      if (hasCycle(node.id, targetId)) {
        setUrlError('Invalid connection: checking this node will create a circular loop.');
        return;
      }

      updatedPrereqs.push(targetId);
    }
    setPrerequisites(updatedPrereqs);
    updateNode(node.id, { prerequisites: updatedPrereqs });
  };

  const getGlowStyle = () => {
    switch (status) {
      case 'In Progress':
        return 'glowing-amber-modal';
      case 'Completed':
        return 'glowing-emerald-modal';
      case 'Stuck':
        return 'glowing-ruby-modal';
      default:
        return '';
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={() => setSelectedNodeId(null)}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(10px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <motion.div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className={`modal-box glassmorphic-panel ${getGlowStyle()}`}
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          borderRadius: '24px',
          overflowY: 'auto',
          position: 'relative',
          padding: '36px',
          backgroundColor: theme === 'dark' ? 'rgba(20, 20, 20, 0.95)' : '#FFFFFF',
          border: '1px solid var(--bdr)',
        }}
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 260 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="node-modal-title"
        aria-describedby="node-modal-description"
      >
        {/* Close Button */}
        <button
          className="modal-close-trigger action-btn"
          onClick={() => setSelectedNodeId(null)}
          aria-label="Close editing modal"
          style={{
            position: 'absolute',
            top: '24px',
            right: '24px',
            zIndex: 1000,
          }}
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div style={{ marginBottom: '28px' }}>
          <span className="text-xxs uppercase tracking-widest text-brand-red font-black">
            Interactive Editor
          </span>

          <h2 id="node-modal-title" className="text-2xl font-black text-t1 mt-1 font-orbitron">
            Modify Learning Node
          </h2>

          <p id="node-modal-description" className="text-sm text-t2 mt-2">
            Edit node details, resources, prerequisites, notes, and learning progress.
          </p>
        </div>

        {/* Form Grid */}
        <div
          className="modal-form-stack"
          style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
        >
          {/* Node Title */}
          <div className="form-group">
            <label
              htmlFor="node-title"
              className="form-label text-xs font-black uppercase text-t2 block mb-2"
            >
              Topic/Title
            </label>
            <input
              ref={titleInputRef}
              id="node-title"
              type="text"
              className="form-control-input w-full glass-input"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                updateNode(node.id, { title: e.target.value });
              }}
              placeholder="e.g. Advanced TypeScript Paradigms"
              required
            />
          </div>

          {/* Node Description */}
          <div className="form-group">
            <label
              htmlFor="node-desc"
              className="form-label text-xs font-black uppercase text-t2 block mb-2"
            >
              Short Description
            </label>
            <textarea
              id="node-desc"
              rows={2}
              className="form-control-input w-full glass-input"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                updateNode(node.id, { description: e.target.value });
              }}
              placeholder="Provide a concise learning outline for this topic..."
            />
          </div>

          {/* Dynamic Glowing Status Selection */}
          <div className="form-group">
            <span className="form-label text-xs font-black uppercase text-t2 block mb-3">
              Learning Status
            </span>
            <div
              className="status-grid-selector"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '12px',
              }}
            >
              {(['Not Started', 'In Progress', 'Completed', 'Stuck'] as const).map((statusVal) => {
                const isActive = status === statusVal;
                let colorClass = '';
                if (isActive) {
                  if (statusVal === 'In Progress') colorClass = 'bg-amber';
                  if (statusVal === 'Completed') colorClass = 'bg-emerald';
                  if (statusVal === 'Stuck') colorClass = 'bg-ruby';
                  if (statusVal === 'Not Started') colorClass = 'bg-slate';
                }

                return (
                  <button
                    aria-label="Interactive element"
                    key={statusVal}
                    type="button"
                    className={`status-select-btn ${isActive ? 'active ' + colorClass : ''}`}
                    onClick={() => {
                      setStatus(statusVal);
                      updateNode(node.id, { status: statusVal });
                    }}
                  >
                    {statusVal}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prerequisite Node Linkage Panel */}
          <div className="form-group">
            <label className="form-label text-xs font-black uppercase text-t2 block mb-2">
              Prerequisite Paths (Incoming Connections)
            </label>
            <div
              className="prereq-selector-scroll glassmorphic-panel"
              style={{
                maxHeight: '120px',
                overflowY: 'auto',
                padding: '12px',
                borderRadius: '12px',
              }}
            >
              {nodes.filter((n) => n.id !== node.id).length === 0 ? (
                <p className="text-xxs text-t3 text-center py-2">
                  No other nodes available to establish connections.
                </p>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  {nodes
                    .filter((n) => n.id !== node.id)
                    .map((otherNode) => {
                      const isChecked = prerequisites.includes(otherNode.id);
                      return (
                        <label
                          key={otherNode.id}
                          className="prereq-checkbox-row text-xs text-t2 flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handlePrereqToggle(otherNode.id)}
                            className="rounded-checkbox"
                          />
                          <span>{otherNode.title}</span>
                        </label>
                      );
                    })}
                </div>
              )}
            </div>
          </div>

          {/* Learning resources and External links */}
          <div className="form-group">
            <label className="form-label text-xs font-black uppercase text-t2 block mb-2">
              Recommended Resources &amp; Playgrounds
            </label>
            <div
              className="resources-editor-stack"
              style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
            >
              {/* Add New resource layout */}
              <div className="add-resource-panel flex gap-2">
                <input
                  type="text"
                  placeholder="Resource Label (e.g. FreeCodeCamp Tutorial)"
                  value={newResTitle}
                  onChange={(e) => setNewResTitle(e.target.value)}
                  className="glass-input text-xs w-1/2"
                />
                <input
                  type="url"
                  placeholder="Link URL (https://...)"
                  value={newResUrl}
                  onChange={(e) => setNewResUrl(e.target.value)}
                  className="glass-input text-xs w-1/2"
                />
                <button
                  type="button"
                  onClick={handleAddResource}
                  className="btn btn-sm btn-primary add-res-btn"
                  title="Add learning resource"
                >
                  <Plus size={14} />
                </button>
              </div>

              {urlError && (
                <p className="text-xxs text-brand-red font-bold mt-1">
                  <AlertCircle size={10} style={{ display: 'inline', marginRight: '4px' }} />
                  {urlError}
                </p>
              )}

              {/* Render resource cards stack */}
              <div
                className="resource-list-stack mt-2"
                style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
              >
                {resources.map((res, index) => (
                  <div
                    key={res.url || `resource-${index}`}
                    key={`${res.title}-${res.url}`}
                    className="resource-item-edit-row glassmorphic-panel flex justify-between items-center text-xs"
                    style={{ padding: '8px 14px', borderRadius: '8px' }}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Globe size={12} className="text-brand-red flex-shrink-0" />
                      <a
                        aria-label="Interactive element"
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-t1 hover:underline truncate"
                      >
                        {res.title}
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveResource(index)}
                      className="text-t3 hover:text-brand-red transition-colors flex-shrink-0"
                      aria-label={`Remove resource ${res.title}`}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Notes and Personal Checklists */}
          <div className="form-group">
            <div
              style={{
                display: 'flex',
                justifyContent: 'between',
                alignItems: 'center',
                marginBottom: '8px',
              }}
            >
              <label
                htmlFor="node-notes"
                className="form-label text-xs font-black uppercase text-t2 block"
              >
                Personal Notes &amp; Checklist Items
              </label>
              <span className="text-xxs text-t3">
                Supports Markdown list notation (- [ ] for checklists)
              </span>
            </div>
            <textarea
              id="node-notes"
              rows={4}
              className="form-control-input w-full glass-input text-xs font-mono"
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                updateNode(node.id, { notes: e.target.value });
              }}
              placeholder="- [ ] Completed the official guide&#13;- [ ] Finished building the sandbox project&#13;- Master key structures..."
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
};
