import React, { useRef } from 'react';
import { BaseNode } from '../BaseNode';
import { DynamicNode } from '../../../types/dynamic';
import { Image as ImageIcon, Upload } from 'lucide-react';

interface Props {
  node: DynamicNode;
  updateData: (data: any) => void;
  updatePosition: (pos: { x: number, y: number }) => void;
  scale: number;
}

export const ImageInputNode: React.FC<Props> = ({ node, updateData, updatePosition, scale }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateData({ image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <BaseNode
      node={node}
      title="Build your final look"
      icon={<ImageIcon size={16} />}
      inputs={[]}
      outputs={[{ id: 'out', type: 'image', label: 'Image Output' }]}
      updatePosition={updatePosition}
      scale={scale}
      width={320}
      className="border-green-500/30 ring-1 ring-green-500/10"
    >
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">Outfit input</h3>
          <p className="text-xs text-white/50 leading-relaxed">
            Upload a garment or outfit, generate a model that fits your needs, and dress it with the clothing or outfit you uploaded.
          </p>
        </div>
        
        <div 
          className="w-full aspect-[3/4] bg-[#111] border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-green-500/50 transition-colors relative overflow-hidden group"
          onClick={() => fileInputRef.current?.click()}
        >
          {node.data.image ? (
            <>
              <img src={node.data.image} alt="Input" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-sm font-medium">Change Image</span>
              </div>
            </>
          ) : (
            <>
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-white/30 group-hover:text-green-400 group-hover:bg-green-400/10 transition-colors">
                <Upload size={20} />
              </div>
              <span className="text-sm font-medium text-white/50 group-hover:text-white/80 transition-colors">Upload Image</span>
            </>
          )}
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />
      </div>
    </BaseNode>
  );
};
