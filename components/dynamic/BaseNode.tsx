import React, { useRef, useState, useEffect } from 'react';
import { DynamicNode, PortDef } from '../../types/dynamic';
import { Type, Image as ImageIcon, Video, Sparkles, X } from 'lucide-react';

interface BaseNodeProps {
  node: DynamicNode;
  title: string;
  icon?: React.ReactNode;
  inputs: PortDef[];
  outputs: PortDef[];
  updatePosition: (pos: { x: number, y: number }) => void;
  scale: number;
  children: React.ReactNode;
  width?: number;
  className?: string;
}

export const BaseNode: React.FC<BaseNodeProps> = ({ 
  node, title, icon, inputs, outputs, updatePosition, scale, children, width = 320, className = '' 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const nodeRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag if clicking on the header or empty space, not on inputs/buttons
    if ((e.target as HTMLElement).tagName.toLowerCase() === 'input' || 
        (e.target as HTMLElement).tagName.toLowerCase() === 'textarea' ||
        (e.target as HTMLElement).tagName.toLowerCase() === 'button' ||
        (e.target as HTMLElement).closest('.port')) {
      return;
    }
    
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - node.position.x * scale,
      y: e.clientY - node.position.y * scale
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      updatePosition({
        x: (e.clientX - dragStart.x) / scale,
        y: (e.clientY - dragStart.y) / scale
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, scale]);

  const renderPort = (port: PortDef, isInput: boolean) => {
    const Icon = port.icon || (port.type === 'text' ? Type : port.type === 'image' ? ImageIcon : port.type === 'video' ? Video : Sparkles);
    
    return (
      <div 
        key={port.id} 
        className={`absolute top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-full bg-[#2a2a2a] border border-white/20 cursor-crosshair hover:scale-110 transition-transform port ${isInput ? '-left-3' : '-right-3'}`}
        title={port.label}
        data-node-id={node.id}
        data-port-id={port.id}
        data-port-type={isInput ? 'input' : 'output'}
        data-data-type={port.type}
      >
        <Icon size={12} className="text-white/70" />
      </div>
    );
  };

  return (
    <div 
      ref={nodeRef}
      className={`absolute flex flex-col rounded-2xl bg-[#1a1a1a] border border-white/10 shadow-2xl ${isDragging ? 'ring-2 ring-indigo-500/50 z-50' : 'z-10'} ${className}`}
      style={{ 
        left: node.position.x, 
        top: node.position.y, 
        width: width,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/[0.02] rounded-t-2xl">
        {icon && <div className="text-white/50">{icon}</div>}
        <h3 className="text-sm font-semibold text-white/90 tracking-wide">{title}</h3>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-4">
        {children}
      </div>

      {/* Ports */}
      {inputs.map(port => renderPort(port, true))}
      {outputs.map(port => renderPort(port, false))}
    </div>
  );
};
