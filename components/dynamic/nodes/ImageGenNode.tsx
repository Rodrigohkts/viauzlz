import React from 'react';
import { BaseNode } from '../BaseNode';
import { DynamicNode } from '../../../types/dynamic';
import { Sparkles, Image as ImageIcon } from 'lucide-react';

interface Props {
  node: DynamicNode;
  updateData: (data: any) => void;
  updatePosition: (pos: { x: number, y: number }) => void;
  scale: number;
}

export const ImageGenNode: React.FC<Props> = ({ node, updateData, updatePosition, scale }) => {
  return (
    <BaseNode
      node={node}
      title="Design your model"
      icon={<Sparkles size={16} />}
      inputs={[
        { id: 'image', type: 'image', label: 'Image Input' },
        { id: 'prompt', type: 'text', label: 'Prompt Input' }
      ]}
      outputs={[
        { id: 'out1', type: 'image', label: 'Image Output 1' },
        { id: 'out2', type: 'image', label: 'Image Output 2' }
      ]}
      updatePosition={updatePosition}
      scale={scale}
      width={380}
      className="border-purple-500/30 ring-1 ring-purple-500/10"
    >
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">Model generator</h3>
        </div>
        
        <div className="w-full aspect-[3/4] bg-[#111] border border-white/10 rounded-2xl relative overflow-hidden group">
          {node.data.result ? (
            <img src={node.data.result} alt="Generated Model" className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/30">
              <Sparkles size={32} className="opacity-50" />
              <span className="text-sm font-medium">Waiting for inputs...</span>
            </div>
          )}
        </div>

        <textarea
          value={node.data.prompt || ''}
          onChange={(e) => updateData({ prompt: e.target.value })}
          placeholder="Close up portrait of an avant-garde model with sleek wet black hair, a small silver piercing on the left eyebrow..."
          className="w-full h-24 bg-[#111] border border-white/10 rounded-xl p-3 text-sm text-white/90 placeholder-white/30 resize-none focus:outline-none transition-all font-sans leading-relaxed"
        />

        <button 
          className="w-full py-3 bg-purple-500 hover:bg-purple-400 text-white rounded-xl font-bold text-sm uppercase tracking-wider shadow-lg transition-all active:scale-95 disabled:opacity-50"
          disabled={node.data.isGenerating}
          onClick={() => {
            updateData({ isGenerating: true });
            // Mock generation
            setTimeout(() => {
              updateData({ isGenerating: false, result: 'https://picsum.photos/seed/model/600/800' });
            }, 2000);
          }}
        >
          {node.data.isGenerating ? 'Gerando...' : 'Gerar Imagem'}
        </button>
      </div>
    </BaseNode>
  );
};
