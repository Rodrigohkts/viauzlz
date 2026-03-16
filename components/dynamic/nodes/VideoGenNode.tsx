import React from 'react';
import { BaseNode } from '../BaseNode';
import { DynamicNode } from '../../../types/dynamic';
import { Video, Play, Volume2, Type, Image as ImageIcon } from 'lucide-react';

interface Props {
  node: DynamicNode;
  updateData: (data: any) => void;
  updatePosition: (pos: { x: number, y: number }) => void;
  scale: number;
}

export const VideoGenNode: React.FC<Props> = ({ node, updateData, updatePosition, scale }) => {
  return (
    <BaseNode
      node={node}
      title="Gerador de vídeos #2"
      icon={<Video size={16} />}
      inputs={[
        { id: 'text', type: 'text', label: 'Text Input' },
        { id: 'image1', type: 'image', label: 'Image Input 1' },
        { id: 'image2', type: 'image', label: 'Image Input 2' }
      ]}
      outputs={[
        { id: 'out_img1', type: 'image', label: 'Image Output 1' },
        { id: 'out_img2', type: 'image', label: 'Image Output 2' },
        { id: 'out_video', type: 'video', label: 'Video Output' },
        { id: 'out_audio', type: 'any', label: 'Audio Output' }
      ]}
      updatePosition={updatePosition}
      scale={scale}
      width={480}
      className="border-blue-500 ring-2 ring-blue-500/20 shadow-[0_0_50px_rgba(59,130,246,0.1)]"
    >
      <div className="flex flex-col gap-4">
        {/* Video Area */}
        <div className="w-full aspect-video bg-[#111] border border-white/10 rounded-2xl relative overflow-hidden group">
          {node.data.result ? (
            <video src={node.data.result} controls className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/30">
              <Video size={48} className="opacity-50" />
              <span className="text-sm font-medium">Video Preview</span>
            </div>
          )}
        </div>

        {/* Prompt Input */}
        <div className="flex items-center gap-3 bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3">
          <Type size={18} className="text-green-400" />
          <input 
            type="text"
            value={node.data.prompt || ''}
            onChange={(e) => updateData({ prompt: e.target.value })}
            placeholder="Descreva o vídeo que você deseja gerar..."
            className="flex-1 bg-transparent border-none focus:outline-none text-sm text-white/90 placeholder-white/30"
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-[#2a2a2a] rounded-lg p-1">
              <button className="px-2 py-1 text-xs font-medium text-white/50 hover:text-white">-</button>
              <span className="px-2 py-1 text-xs font-bold text-white">x1</span>
              <button className="px-2 py-1 text-xs font-medium text-white/50 hover:text-white">+</button>
            </div>
            
            <select 
              className="bg-[#2a2a2a] text-white text-xs font-medium rounded-lg px-3 py-1.5 border-none focus:ring-1 focus:ring-blue-500 outline-none appearance-none"
              value={node.data.mode || 'Auto'}
              onChange={(e) => updateData({ mode: e.target.value })}
            >
              <option value="Auto">Auto</option>
              <option value="Manual">Manual</option>
            </select>

            <select 
              className="bg-[#2a2a2a] text-white text-xs font-medium rounded-lg px-3 py-1.5 border-none focus:ring-1 focus:ring-blue-500 outline-none appearance-none"
              value={node.data.aspectRatio || '16:9'}
              onChange={(e) => updateData({ aspectRatio: e.target.value })}
            >
              <option value="16:9">16:9</option>
              <option value="9:16">9:16</option>
              <option value="1:1">1:1</option>
            </select>
            
            <select 
              className="bg-[#2a2a2a] text-white text-xs font-medium rounded-lg px-3 py-1.5 border-none focus:ring-1 focus:ring-blue-500 outline-none appearance-none"
              value={node.data.quality || 'Automático'}
              onChange={(e) => updateData({ quality: e.target.value })}
            >
              <option value="Automático">Automático</option>
              <option value="Alta">Alta</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <div className={`w-8 h-4 rounded-full transition-colors relative ${node.data.soundEffects ? 'bg-blue-500' : 'bg-white/20'}`}>
                <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${node.data.soundEffects ? 'translate-x-4' : ''}`} />
              </div>
              <span className="text-xs font-medium text-white/70">Efeitos sonoros</span>
            </label>

            <button 
              className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors disabled:opacity-50"
              disabled={node.data.isGenerating}
              onClick={() => {
                updateData({ isGenerating: true });
                setTimeout(() => {
                  updateData({ isGenerating: false, result: 'https://www.w3schools.com/html/mov_bbb.mp4' });
                }, 2000);
              }}
            >
              <Play size={18} className="ml-1" />
            </button>
          </div>
        </div>
      </div>
    </BaseNode>
  );
};
