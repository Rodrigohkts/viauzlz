import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DynamicNode, DynamicConnection, PortType } from '../../types/dynamic';
import { Plus, Image as ImageIcon, Video, Type, Sparkles } from 'lucide-react';
import { PromptNode } from './nodes/PromptNode';
import { ImageInputNode } from './nodes/ImageInputNode';
import { ImageGenNode } from './nodes/ImageGenNode';
import { VideoGenNode } from './nodes/VideoGenNode';

export const DynamicCanvas: React.FC = () => {
  const [nodes, setNodes] = useState<DynamicNode[]>([
    { id: 'node_prompt', type: 'prompt', position: { x: 50, y: 100 }, data: {} },
    { id: 'node_img_in', type: 'image_input', position: { x: 500, y: 100 }, data: {} },
    { id: 'node_img_gen', type: 'image_gen', position: { x: 900, y: 100 }, data: {} },
    { id: 'node_vid_gen', type: 'video_gen', position: { x: 1350, y: 100 }, data: {} }
  ]);
  const [connections, setConnections] = useState<DynamicConnection[]>([]);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, show: boolean, sourcePort?: any } | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Connection State
  const [connecting, setConnecting] = useState<{ nodeId: string, portId: string, type: 'input'|'output', pos: {x: number, y: number} } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Handle Canvas Panning & Connecting
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const portEl = target.closest('.port') as HTMLElement;

    if (portEl) {
      e.stopPropagation();
      const rect = portEl.getBoundingClientRect();
      const canvasRect = containerRef.current?.getBoundingClientRect();
      if (!canvasRect) return;

      const portX = (rect.left + rect.width / 2 - canvasRect.left - transform.x) / transform.scale;
      const portY = (rect.top + rect.height / 2 - canvasRect.top - transform.y) / transform.scale;

      setConnecting({
        nodeId: portEl.dataset.nodeId!,
        portId: portEl.dataset.portId!,
        type: portEl.dataset.portType as 'input' | 'output',
        pos: { x: portX, y: portY }
      });
      return;
    }

    if (e.button === 1 || (e.button === 0 && e.altKey)) { // Middle click or Alt+Left click
      setIsDraggingCanvas(true);
      setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    } else if (e.button === 2) { // Right click
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY, show: true });
    } else {
      setContextMenu(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setMousePos({
        x: (e.clientX - rect.left - transform.x) / transform.scale,
        y: (e.clientY - rect.top - transform.y) / transform.scale
      });
    }

    if (isDraggingCanvas) {
      setTransform(prev => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      }));
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    setIsDraggingCanvas(false);

    if (connecting) {
      const target = e.target as HTMLElement;
      const portEl = target.closest('.port') as HTMLElement;

      if (portEl) {
        const targetNodeId = portEl.dataset.nodeId!;
        const targetPortId = portEl.dataset.portId!;
        const targetType = portEl.dataset.portType as 'input' | 'output';

        if (connecting.nodeId !== targetNodeId && connecting.type !== targetType) {
          const sourceNode = connecting.type === 'output' ? connecting.nodeId : targetNodeId;
          const sourcePort = connecting.type === 'output' ? connecting.portId : targetPortId;
          const targetNode = connecting.type === 'input' ? connecting.nodeId : targetNodeId;
          const targetPort = connecting.type === 'input' ? connecting.portId : targetPortId;

          setConnections(prev => [...prev, {
            id: `conn_${Date.now()}`,
            sourceNode, sourcePort, targetNode, targetPort
          }]);
        }
      } else {
        // Dropped on empty space, open context menu
        setContextMenu({ x: e.clientX, y: e.clientY, show: true, sourcePort: connecting });
      }
      setConnecting(null);
    }
  };

  // Handle Canvas Zooming
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const scaleFactor = -e.deltaY * 0.001;
      let newScale = transform.scale * (1 + scaleFactor);
      newScale = Math.max(0.1, Math.min(newScale, 3)); // Clamp scale
      
      // Zoom towards mouse cursor
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const newX = mouseX - (mouseX - transform.x) * (newScale / transform.scale);
        const newY = mouseY - (mouseY - transform.y) * (newScale / transform.scale);
        
        setTransform({ x: newX, y: newY, scale: newScale });
      }
    } else {
      // Pan with scroll
      setTransform(prev => ({
        ...prev,
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY
      }));
    }
  };

  // Add Node
  const addNode = (type: DynamicNode['type'], x: number, y: number) => {
    // Convert screen coordinates to canvas coordinates
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const canvasX = (x - rect.left - transform.x) / transform.scale;
    const canvasY = (y - rect.top - transform.y) / transform.scale;

    const newNode: DynamicNode = {
      id: `node_${Date.now()}`,
      type,
      position: { x: canvasX, y: canvasY },
      data: {}
    };
    
    setNodes(prev => [...prev, newNode]);

    // Auto connect if dropped from a port
    if (contextMenu?.sourcePort) {
      const source = contextMenu.sourcePort;
      const newConn: DynamicConnection = {
        id: `conn_${Date.now()}`,
        sourceNode: source.type === 'output' ? source.nodeId : newNode.id,
        sourcePort: source.type === 'output' ? source.portId : 'out', // Assuming default port
        targetNode: source.type === 'input' ? source.nodeId : newNode.id,
        targetPort: source.type === 'input' ? source.portId : 'in' // Assuming default port
      };
      setConnections(prev => [...prev, newConn]);
    }

    setContextMenu(null);
  };

  const updateNodeData = (id: string, data: any) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, data: { ...n.data, ...data } } : n));
  };

  const updateNodePosition = (id: string, position: { x: number, y: number }) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, position } : n));
  };

  // Helper to get port position
  const getPortPosition = (nodeId: string, portId: string, type: 'input'|'output') => {
    const el = document.querySelector(`[data-node-id="${nodeId}"][data-port-id="${portId}"][data-port-type="${type}"]`);
    if (el && containerRef.current) {
      const rect = el.getBoundingClientRect();
      const canvasRect = containerRef.current.getBoundingClientRect();
      return {
        x: (rect.left + rect.width / 2 - canvasRect.left - transform.x) / transform.scale,
        y: (rect.top + rect.height / 2 - canvasRect.top - transform.y) / transform.scale
      };
    }
    return { x: 0, y: 0 };
  };

  const renderConnection = (conn: DynamicConnection) => {
    const sourcePos = getPortPosition(conn.sourceNode, conn.sourcePort, 'output');
    const targetPos = getPortPosition(conn.targetNode, conn.targetPort, 'input');
    
    if (sourcePos.x === 0 && sourcePos.y === 0) return null; // Port not found yet

    const dx = Math.abs(targetPos.x - sourcePos.x) * 0.5;
    const path = `M ${sourcePos.x} ${sourcePos.y} C ${sourcePos.x + dx} ${sourcePos.y}, ${targetPos.x - dx} ${targetPos.y}, ${targetPos.x} ${targetPos.y}`;

    return (
      <path 
        key={conn.id} 
        d={path} 
        fill="none" 
        stroke="rgba(74, 222, 128, 0.6)" 
        strokeWidth={2} 
        className="transition-all duration-300"
      />
    );
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-full bg-[#0a0a0a] overflow-hidden relative cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Dot Grid Background */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{ 
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)', 
          backgroundSize: `${20 * transform.scale}px ${20 * transform.scale}px`,
          backgroundPosition: `${transform.x}px ${transform.y}px`
        }} 
      />

      {/* Canvas Layer */}
      <div 
        className="absolute origin-top-left"
        style={{ 
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          width: 0, height: 0
        }}
      >
        {/* Render Connections */}
        <svg className="absolute inset-0 overflow-visible pointer-events-none" style={{ zIndex: 0 }}>
          {connections.map(renderConnection)}
          
          {/* Active Connection Line */}
          {connecting && (
            <path 
              d={`M ${connecting.pos.x} ${connecting.pos.y} C ${connecting.pos.x + Math.abs(mousePos.x - connecting.pos.x) * 0.5 * (connecting.type === 'output' ? 1 : -1)} ${connecting.pos.y}, ${mousePos.x - Math.abs(mousePos.x - connecting.pos.x) * 0.5 * (connecting.type === 'output' ? 1 : -1)} ${mousePos.y}, ${mousePos.x} ${mousePos.y}`}
              fill="none" 
              stroke="rgba(74, 222, 128, 0.8)" 
              strokeWidth={2} 
              strokeDasharray="5,5"
              className="animate-flow"
            />
          )}
        </svg>
        
        {/* Render Nodes */}
        {nodes.map(node => {
          const props = {
            node,
            updateData: (data: any) => updateNodeData(node.id, data),
            updatePosition: (pos: any) => updateNodePosition(node.id, pos),
            scale: transform.scale
          };
          switch (node.type) {
            case 'prompt': return <PromptNode key={node.id} {...props} />;
            case 'image_input': return <ImageInputNode key={node.id} {...props} />;
            case 'image_gen': return <ImageGenNode key={node.id} {...props} />;
            case 'video_gen': return <VideoGenNode key={node.id} {...props} />;
            default: return null;
          }
        })}
      </div>

      {/* Context Menu */}
      {contextMenu?.show && (
        <div 
          className="absolute z-50 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl p-2 w-56 flex flex-col gap-1"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <div className="px-3 py-2 text-xs font-semibold text-white/50 uppercase tracking-wider">Adicionar Node</div>
          <button onClick={() => addNode('prompt', contextMenu.x, contextMenu.y)} className="flex items-center gap-3 px-3 py-2 hover:bg-white/10 rounded-lg text-white text-sm text-left transition-colors">
            <Type size={16} className="text-blue-400" /> Texto / Prompt
          </button>
          <button onClick={() => addNode('image_input', contextMenu.x, contextMenu.y)} className="flex items-center gap-3 px-3 py-2 hover:bg-white/10 rounded-lg text-white text-sm text-left transition-colors">
            <ImageIcon size={16} className="text-green-400" /> Imagem de Entrada
          </button>
          <button onClick={() => addNode('image_gen', contextMenu.x, contextMenu.y)} className="flex items-center gap-3 px-3 py-2 hover:bg-white/10 rounded-lg text-white text-sm text-left transition-colors">
            <Sparkles size={16} className="text-purple-400" /> Gerador de Imagem
          </button>
          <button onClick={() => addNode('video_gen', contextMenu.x, contextMenu.y)} className="flex items-center gap-3 px-3 py-2 hover:bg-white/10 rounded-lg text-white text-sm text-left transition-colors">
            <Video size={16} className="text-rose-400" /> Gerador de Vídeo
          </button>
        </div>
      )}
    </div>
  );
};
