import React from 'react';
import { BaseNode } from '../BaseNode';
import { DynamicNode } from '../../../types/dynamic';
import { Type, Bold, Italic, List, Play, Maximize2, Circle, AlignLeft, Indent } from 'lucide-react';

interface Props {
  node: DynamicNode;
  updateData: (data: any) => void;
  updatePosition: (pos: { x: number, y: number }) => void;
  scale: number;
}

export const PromptNode: React.FC<Props> = ({ node, updateData, updatePosition, scale }) => {
  return (
    <BaseNode
      node={node}
      title="Define your vision"
      icon={<Type size={16} />}
      inputs={[]}
      outputs={[{ id: 'out', type: 'text', label: 'Text Output' }]}
      updatePosition={updatePosition}
      scale={scale}
      width={420}
      className="border-blue-500/30 ring-1 ring-blue-500/10"
    >
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">Describe your brand</h3>
          <p className="text-xs text-white/50 leading-relaxed">
            Write a clear brief describing your brand, goal, visual style, model, mood, format, and ending to define your vision.
          </p>
        </div>
        
        <div className="flex flex-col border border-white/10 rounded-xl overflow-hidden bg-[#111]">
          <div className="flex items-center gap-1 bg-[#1a1a1a] border-b border-white/10 p-1.5 px-2">
            <button className="p-1.5 hover:bg-white/10 rounded text-white/70 hover:text-white transition-colors"><Play size={14} /></button>
            <button className="p-1.5 hover:bg-white/10 rounded text-white/70 hover:text-white transition-colors"><Maximize2 size={14} /></button>
            <button className="p-1.5 hover:bg-white/10 rounded text-white/70 hover:text-white transition-colors"><Circle size={14} /></button>
            <div className="w-px h-4 bg-white/10 mx-1" />
            <button className="px-2 py-1 text-xs hover:bg-white/10 rounded text-white/70 hover:text-white transition-colors flex items-center gap-1">
              Parágrafo <span className="text-[10px] opacity-50">▼</span>
            </button>
            <div className="w-px h-4 bg-white/10 mx-1" />
            <button className="p-1.5 hover:bg-white/10 rounded text-white/70 hover:text-white transition-colors"><Bold size={14} /></button>
            <button className="p-1.5 hover:bg-white/10 rounded text-white/70 hover:text-white transition-colors"><Italic size={14} /></button>
            <button className="p-1.5 hover:bg-white/10 rounded text-white/70 hover:text-white transition-colors"><List size={14} /></button>
            <button className="p-1.5 hover:bg-white/10 rounded text-white/70 hover:text-white transition-colors"><AlignLeft size={14} /></button>
            <button className="p-1.5 hover:bg-white/10 rounded text-white/70 hover:text-white transition-colors"><Indent size={14} /></button>
          </div>
          <textarea
            value={node.data.text || ''}
            onChange={(e) => updateData({ text: e.target.value })}
            placeholder="Start typing here..."
            className="w-full h-48 bg-transparent p-4 text-sm text-white/90 placeholder-white/30 resize-none focus:outline-none transition-all font-sans leading-relaxed"
          />
        </div>
      </div>
    </BaseNode>
  );
};
