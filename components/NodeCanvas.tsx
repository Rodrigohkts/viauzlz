import React, { useState, useRef } from 'react';
import { Plus, MousePointer2, Hand, Settings, Image as ImageIcon, Video, List, Sparkles, Bot, Edit, Copy, Search, Loader2, Navigation } from 'lucide-react';
import { generateImageFromText } from '../services/geminiService';

type NodeType = 'image_generator' | 'video_generator' | 'list' | 'image_enhancer' | 'assistant' | 'image_editor' | 'variations';

interface NodeData {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: any;
}

interface ConnectionData {
  id: string;
  source: string;
  target: string;
}

const NODE_TYPES = [
  { type: 'image_generator', label: 'Gerar imagem', icon: <ImageIcon size={16} />, color: 'text-indigo-400', bg: 'bg-indigo-500/20' },
  { type: 'video_generator', label: 'Gerar vídeo', icon: <Video size={16} />, color: 'text-purple-400', bg: 'bg-purple-500/20' },
  { type: 'list', label: 'Lista', icon: <List size={16} />, color: 'text-slate-400', bg: 'bg-slate-500/20' },
  { type: 'image_enhancer', label: 'Melhorar imagem', icon: <Sparkles size={16} />, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  { type: 'assistant', label: 'Assistente', icon: <Bot size={16} />, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  { type: 'image_editor', label: 'Editor de imagens', icon: <Edit size={16} />, badge: 'Novo', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  { type: 'variations', label: 'Variações', icon: <Copy size={16} />, color: 'text-slate-400', bg: 'bg-slate-500/20' },
];

export const NodeCanvas: React.FC = () => {
  const [nodes, setNodes] = useState<NodeData[]>([
    { id: 'node_1', type: 'image_generator', position: { x: 100, y: 100 }, data: { prompt: '' } }
  ]);
  const [connections, setConnections] = useState<ConnectionData[]>([]);
  
  const [draggingNode, setDraggingNode] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [drawingConnection, setDrawingConnection] = useState<{ source: string; mousePos: { x: number; y: number } } | null>(null);
  
  const [contextMenu, setContextMenu] = useState<{ isOpen: boolean; x: number; y: number; sourceNode?: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingNode) {
      setNodes(nodes.map(n => {
        if (n.id === draggingNode.id) {
          return { ...n, position: { x: e.clientX - draggingNode.offsetX, y: e.clientY - draggingNode.offsetY } };
        }
        return n;
      }));
    } else if (drawingConnection) {
      setDrawingConnection({ ...drawingConnection, mousePos: { x: e.clientX, y: e.clientY } });
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (draggingNode) {
      setDraggingNode(null);
    } else if (drawingConnection) {
      setContextMenu({
        isOpen: true,
        x: e.clientX,
        y: e.clientY,
        sourceNode: drawingConnection.source
      });
      setDrawingConnection(null);
    }
  };

  const startConnection = (e: React.MouseEvent, sourceId: string) => {
    e.stopPropagation();
    setDrawingConnection({ source: sourceId, mousePos: { x: e.clientX, y: e.clientY } });
    setContextMenu(null);
  };

  const addNode = (type: NodeType, x: number, y: number, sourceNode?: string) => {
    const newNode: NodeData = {
      id: `node_${Date.now()}`,
      type,
      position: { x, y },
      data: {}
    };
    setNodes([...nodes, newNode]);
    
    if (sourceNode) {
      setConnections([...connections, { id: `conn_${Date.now()}`, source: sourceNode, target: newNode.id }]);
    }
    
    setContextMenu(null);
    setSearchQuery('');
  };

  const handleGenerateFlow = async () => {
    setIsGenerating(true);
    
    const updatedNodes = [...nodes];
    
    for (let i = 0; i < updatedNodes.length; i++) {
      const node = updatedNodes[i];
      if (node.type === 'image_generator' && node.data.prompt) {
        try {
          const resultImage = await generateImageFromText(node.data.prompt);
          updatedNodes[i] = { ...node, data: { ...node.data, result: resultImage } };
        } catch (error) {
          console.error(`Error generating image for node ${node.id}:`, error);
          alert(`Erro ao gerar imagem no nó ${node.id}. Verifique sua chave de API.`);
        }
      }
    }
    
    setNodes(updatedNodes);
    setIsGenerating(false);
  };

  const renderConnection = (start: {x: number, y: number}, end: {x: number, y: number}, isDrawing = false) => {
    const dist = Math.abs(end.x - start.x);
    const cp1 = { x: start.x + dist * 0.5, y: start.y };
    const cp2 = { x: end.x - dist * 0.5, y: end.y };
    const path = `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`;
    
    return (
      <path 
        d={path} 
        stroke={isDrawing || isGenerating ? "#6366f1" : "#334155"} 
        strokeWidth="2" 
        fill="none" 
        strokeDasharray={isGenerating ? "8 4" : "5 5"}
        className={isDrawing || isGenerating ? "animate-flow" : ""}
      />
    );
  };

  return (
    <div 
      ref={canvasRef}
      className="w-full h-full bg-[#0a0a0a] relative overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={() => setContextMenu(null)}
    >
      {/* Dot Grid */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      {/* Sidebar */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 bg-[#1a1a1a] border border-white/10 rounded-2xl p-2 flex flex-col gap-2 z-50">
        <button className="p-3 text-white bg-white/10 rounded-xl hover:bg-white/20 transition-colors"><Plus size={20} /></button>
        <button className="p-3 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"><Navigation size={20} className="-rotate-90 fill-current" /></button>
        <button className="p-3 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"><Hand size={20} /></button>
        <div className="w-full h-[1px] bg-white/10 my-1"></div>
        <button className="p-3 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"><Settings size={20} /></button>
      </div>

      {/* Connections */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
        {connections.map(conn => {
          const sourceNode = nodes.find(n => n.id === conn.source);
          const targetNode = nodes.find(n => n.id === conn.target);
          if (!sourceNode || !targetNode) return null;
          
          const start = { x: sourceNode.position.x + 320, y: sourceNode.position.y + 28 };
          const end = { x: targetNode.position.x, y: targetNode.position.y + 28 };
          return <React.Fragment key={conn.id}>{renderConnection(start, end)}</React.Fragment>;
        })}
        
        {drawingConnection && (() => {
          const sourceNode = nodes.find(n => n.id === drawingConnection.source);
          if (!sourceNode) return null;
          const start = { x: sourceNode.position.x + 320, y: sourceNode.position.y + 28 };
          return renderConnection(start, drawingConnection.mousePos, true);
        })()}
      </svg>

      {/* Nodes */}
      {nodes.map(node => {
        const nodeType = NODE_TYPES.find(t => t.type === node.type);
        return (
          <div 
            key={node.id}
            className="absolute z-20 w-[320px] bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl flex flex-col"
            style={{ left: node.position.x, top: node.position.y }}
          >
            {/* Header */}
            <div 
              className="flex items-center gap-2 p-4 border-b border-white/5 cursor-grab active:cursor-grabbing relative"
              onMouseDown={(e) => {
                setDraggingNode({ id: node.id, offsetX: e.clientX - node.position.x, offsetY: e.clientY - node.position.y });
              }}
            >
              <div className="text-slate-400">{nodeType?.icon}</div>
              <span className="text-sm font-semibold text-white">
                {nodeType?.label || 'Node'} #{node.id.split('_')[1]?.slice(-3) || '1'}
              </span>
              
              {/* Output Port */}
              <div 
                className="absolute right-[-14px] top-1/2 -translate-y-1/2 w-7 h-7 bg-[#2a2a2a] border border-white/10 rounded-full flex items-center justify-center cursor-crosshair hover:bg-[#3a3a3a] transition-colors z-30"
                onMouseDown={(e) => startConnection(e, node.id)}
              >
                <ImageIcon size={12} className="text-slate-400" />
              </div>
              
              {/* Input Port (if not the first node) */}
              <div 
                className="absolute left-[-14px] top-1/2 -translate-y-1/2 w-7 h-7 bg-[#2a2a2a] border border-white/10 rounded-full flex items-center justify-center z-30"
              >
                <div className="w-2 h-2 rounded-full bg-slate-500" />
              </div>
            </div>
            
            {/* Content */}
            <div className="p-2 min-h-[280px] flex flex-col relative">
              {node.type === 'image_generator' && (
                <>
                  {node.data.result ? (
                    <div className="w-full h-full flex-1 relative rounded-xl overflow-hidden border border-white/10 group">
                      <img src={node.data.result} alt="Generated" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button 
                          onClick={() => setNodes(nodes.map(n => n.id === node.id ? { ...n, data: { ...n.data, result: null } } : n))}
                          className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm font-medium backdrop-blur-md transition-colors"
                        >
                          Editar Prompt
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 bg-[#141414] rounded-xl border border-white/5 p-4">
                        <textarea 
                          className="w-full h-full min-h-[200px] bg-transparent text-sm text-slate-400 placeholder-slate-600 resize-none focus:outline-none"
                          placeholder="Descreva a imagem que você deseja gerar..."
                          value={node.data.prompt}
                          onChange={(e) => {
                            setNodes(nodes.map(n => n.id === node.id ? { ...n, data: { ...n.data, prompt: e.target.value } } : n));
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                        />
                    </div>
                  )}
                </>
              )}
              {node.type !== 'image_generator' && (
                <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
                  Configurações do nó
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Context Menu */}
      {contextMenu?.isOpen && (
        <div 
          className="absolute z-50 w-72 bg-[#1e1e1e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-3 border-b border-white/5 flex items-center gap-2">
            <Search size={16} className="text-slate-500" />
            <input 
              type="text" 
              placeholder="Pesquisar" 
              className="bg-transparent border-none text-sm text-white focus:outline-none w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
          <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-2 flex flex-col gap-1">
            {NODE_TYPES.filter(t => t.label.toLowerCase().includes(searchQuery.toLowerCase())).map(type => (
              <button 
                key={type.type}
                className="w-full flex items-center justify-between p-2 hover:bg-white/5 rounded-xl transition-colors text-left group"
                onClick={() => addNode(type.type as NodeType, contextMenu.x, contextMenu.y, contextMenu.sourceNode)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg ${type.bg} flex items-center justify-center ${type.color} transition-colors`}>
                    {type.icon}
                  </div>
                  <span className="text-sm text-slate-200 font-medium">{type.label}</span>
                </div>
                {type.badge && (
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-white/10 text-slate-300 rounded-full">
                    {type.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="p-2 border-t border-white/5 flex items-center justify-end gap-3 bg-black/20">
             <div className="flex items-center gap-1 text-[10px] text-slate-500">
                <span className="bg-white/10 px-1.5 py-0.5 rounded text-slate-400">↑↓</span> Navegar
             </div>
             <div className="flex items-center gap-1 text-[10px] text-slate-500">
                <span className="bg-white/10 px-1.5 py-0.5 rounded text-slate-400">↵</span> Inserir
             </div>
          </div>
        </div>
      )}
      {/* Floating Action Button */}
      <div className="absolute bottom-8 right-8 z-50">
        <button 
          className={`px-8 py-4 rounded-2xl font-bold shadow-[0_0_30px_rgba(79,70,229,0.3)] flex items-center gap-3 transition-all ${isGenerating ? 'bg-indigo-500/50 cursor-not-allowed text-white/50' : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:scale-105 active:scale-95'}`}
          onClick={handleGenerateFlow}
          disabled={isGenerating}
        >
          {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
          {isGenerating ? 'Gerando...' : 'Gerar Fluxo'}
        </button>
      </div>
    </div>
  );
};
