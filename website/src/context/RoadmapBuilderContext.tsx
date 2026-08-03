import React, { createContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';

export interface ResourceLink {
  title: string;
  url: string;
}

export interface RoadmapNode {
  id: string;
  title: string;
  description: string;
  x: number;
  y: number;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Stuck';
  notes: string;
  resources: ResourceLink[];
  prerequisites: string[];
  isAiGenerated?: boolean;
  isPrerequisite?: boolean;
  isAdvanced?: boolean;
  aiReason?: string;
}

export interface RoadmapBuilderContextType {
  nodes: RoadmapNode[];
  roadmapTitle: string;
  roadmapDescription: string;
  selectedNodeId: string | null;
  activeNodeId: string | null;
  addNode: (node: Omit<RoadmapNode, 'id' | 'x' | 'y'> & { x?: number; y?: number }) => void;
  updateNode: (id: string, updates: Partial<RoadmapNode>) => void;
  deleteNode: (id: string) => void;
  setNodes: (nodes: RoadmapNode[]) => void;
  setRoadmapTitle: (title: string) => void;
  setRoadmapDescription: (desc: string) => void;
  setSelectedNodeId: (id: string | null) => void;
  setActiveNodeId: (id: string | null) => void;
  loadRoadmap: (title: string, description: string, nodes: RoadmapNode[]) => void;
  resetRoadmap: () => void;
}

export const RoadmapBuilderContext = createContext<RoadmapBuilderContextType | undefined>(
  undefined
);

const LOCAL_STORAGE_KEY = 'ns-interactive-roadmap-workspace';

const defaultNodes: RoadmapNode[] = [
  {
    id: 'node-1',
    title: 'Getting Started',
    description:
      'This is your first learning node. Drag me around, double click or click "Edit" to configure!',
    x: 200,
    y: 150,
    status: 'Not Started',
    notes: '- Learn the basics\n- Customize this node',
    resources: [{ title: 'NexaSphere Home', url: 'https://nexasphere.gl' }],
    prerequisites: [],
  },
];

export const RoadmapBuilderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [nodes, setNodesState] = useState<RoadmapNode[]>([]);
  const [roadmapTitle, setRoadmapTitleState] = useState<string>('My Custom Path');
  const [roadmapDescription, setRoadmapDescriptionState] = useState<string>(
    'Build and track your interactive personalized learning roadmap.'
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const isHydrated = useRef(false);

  // Restore workspace automatically from localStorage
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        if (parsed.nodes && Array.isArray(parsed.nodes)) {
          setNodesState(parsed.nodes);
        }
        if (parsed.title) {
          setRoadmapTitleState(parsed.title);
        }
        if (parsed.description) {
          setRoadmapDescriptionState(parsed.description);
        }
      } else {
        // Load a default node if canvas is empty on first load
        setNodesState(defaultNodes);
      }
    } catch (e) {
      if (import.meta.env.DEV) {
        console.error(
          '[RoadmapBuilderContext] Failed to load roadmap from localStorage:',
          (e as Error).message
        );
      }
    } finally {
      isHydrated.current = true;
    }
  }, []);

  // Autosave roadmap state using localStorage on every change
  useEffect(() => {
    if (!isHydrated.current) return;
    // Skip empty initial state saving to prevent overwriting
    if (nodes.length === 0 && roadmapTitle === 'My Custom Path') return;

    // Skip saving if we just reset to default state, to prevent overwriting the removeItem
    if (
      roadmapTitle === 'New Learning Path' &&
      roadmapDescription === 'Custom learning flow created on NexaSphere.' &&
      nodes === defaultNodes
    ) {
      return;
    }

    const stateToSave = {
      title: roadmapTitle,
      description: roadmapDescription,
      nodes,
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
  }, [nodes, roadmapTitle, roadmapDescription]);

  const addNode = useCallback(
    (
      nodeData: Omit<RoadmapNode, 'id' | 'x' | 'y'> & {
        x?: number;
        y?: number;
      }
    ) => {
      // Use a highly unique ID to prevent rapid click collisions
      const id = `node-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

      setNodesState((prev) => {
        let finalX = nodeData.x;
        let finalY = nodeData.y;

        if (finalX === undefined || finalY === undefined) {
          let baseX = 350;
          let baseY = 100;

          // Intelligent Canvas-Aware placement
          const container = document.querySelector('.canvas-container-outer');
          if (container) {
            // Find viewport center based on scroll
            baseX = container.scrollLeft + container.clientWidth / 2 - 110; // 110 is half of NODE_WIDTH (220)
            baseY = container.scrollTop + container.clientHeight / 2 - 45; // 45 is half of NODE_HEIGHT (90)
          }

          // Strict Canvas Bounds protection
          baseX = Math.max(10, Math.min(baseX, 1800 - 220 - 10));
          baseY = Math.max(10, Math.min(baseY, 1200 - 90 - 10));

          if (finalX === undefined) finalX = baseX;
          if (finalY === undefined) finalY = baseY;

          // Collision Avoidance & Staggered Spawning
          const OFFSET = 40;
          let collision = true;
          let attempts = 0;

          while (collision && attempts < 50) {
            // Check if any existing node is dangerously close
            collision = prev.some(
              (n) => Math.abs(n.x - finalX!) < 10 && Math.abs(n.y - finalY!) < 10
            );
            if (collision) {
              finalX! += OFFSET;
              finalY! += OFFSET;

              // If staggering pushes off-canvas, reset to base with slight random jitter
              if (finalX! > 1800 - 220 - 10 || finalY! > 1200 - 90 - 10) {
                finalX = baseX + (Math.random() * 80 - 40);
                finalY = baseY + (Math.random() * 80 - 40);
              }
            }
            attempts++;
          }
        }

        const newNode: RoadmapNode = {
          ...(nodeData as Omit<RoadmapNode, 'id'>),
          x: finalX!,
          y: finalY!,
          id,
        };

        return [...prev, newNode];
      });
      setActiveNodeId(id);
    },
    []
  );

  const updateNode = useCallback((id: string, updates: Partial<RoadmapNode>) => {
    setNodesState((prev) => prev.map((node) => (node.id === id ? { ...node, ...updates } : node)));
  }, []);

  const deleteNode = useCallback(
    (id: string) => {
      setNodesState((prev) => {
        // 1. Remove the node
        const filtered = prev.filter((node) => node.id !== id);
        // 2. Remove any prerequisite references to this deleted node to prevent deadlocks
        return filtered.map((node) => {
          if (node.prerequisites.includes(id)) {
            return {
              ...node,
              prerequisites: node.prerequisites.filter((pid) => pid !== id),
            };
          }
          return node;
        });
      });
      if (selectedNodeId === id) setSelectedNodeId(null);
      if (activeNodeId === id) setActiveNodeId(null);
    },
    [selectedNodeId, activeNodeId]
  );

  const setNodes = useCallback((newNodes: RoadmapNode[]) => {
    setNodesState(newNodes);
  }, []);

  const setRoadmapTitle = useCallback((title: string) => {
    setRoadmapTitleState(title);
  }, []);

  const setRoadmapDescription = useCallback((desc: string) => {
    setRoadmapDescriptionState(desc);
  }, []);

  const loadRoadmap = useCallback((title: string, description: string, newNodes: RoadmapNode[]) => {
    setRoadmapTitleState(title);
    setRoadmapDescriptionState(description);
    setNodesState(newNodes);
    setSelectedNodeId(null);
    setActiveNodeId(null);
  }, []);

  const resetRoadmap = useCallback(() => {
    setRoadmapTitleState('New Learning Path');
    setRoadmapDescriptionState('Custom learning flow created on NexaSphere.');
    setNodesState(defaultNodes);
    setSelectedNodeId(null);
    setActiveNodeId(null);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }, []);

  return (
    <RoadmapBuilderContext.Provider
      value={{
        nodes,
        roadmapTitle,
        roadmapDescription,
        selectedNodeId,
        activeNodeId,
        addNode,
        updateNode,
        deleteNode,
        setNodes,
        setRoadmapTitle,
        setRoadmapDescription,
        setSelectedNodeId,
        setActiveNodeId,
        loadRoadmap,
        resetRoadmap,
      }}
    >
      {children}
    </RoadmapBuilderContext.Provider>
  );
};
