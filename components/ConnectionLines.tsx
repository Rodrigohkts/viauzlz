
import React from 'react';
import { ProcessingStatus, Position } from '../types';

interface ConnectionLinesProps {
  status: ProcessingStatus;
  hasResult: boolean;
  hasFinalResult: boolean;
  hasPoseResult: boolean;
  hasHairResult: boolean;
  showEditor: boolean;
  activeTab?: 'flow' | 'singer' | 'credits' | 'beauty' | 'ultra';
  positions: {
    person: Position;
    clothing: Position;
    process: Position;
    output: Position;
    editor?: Position;
    final?: Position;
    poseControl?: Position;
    poseOutput?: Position;
    hairControl?: Position;
    hairOutput?: Position;
  };
  ultraPositions?: {
      refImage: Position;
      prompt: Position;
      config: Position;
      processImg: Position;
      outputImg: Position;
      videoStyle: Position;
      processVideo: Position;
      outputVideo: Position;
  };
  hasUltraImageResult?: boolean;
  hasUltraVideoResult?: boolean;
}

export const ConnectionLines: React.FC<ConnectionLinesProps> = ({ 
    status, hasResult, hasFinalResult, showEditor, activeTab = 'flow',
    positions, ultraPositions, hasUltraImageResult, hasUltraVideoResult
}) => {
  const isProcessing = status === ProcessingStatus.PROCESSING;
  const isGeneratingUltraImg = status === ProcessingStatus.GENERATING_ULTRA_IMG;
  const isGeneratingUltraVideo = status === ProcessingStatus.GENERATING_ULTRA_VIDEO;
  
  const NODE_W = 288; // w-72
  const ANCHOR_Y = 144; // half of h
  
  const getCurve = (start: Position, end: Position) => {
      const dist = Math.abs(end.x - start.x);
      const cp1 = { x: start.x + dist * 0.45, y: start.y }; 
      const cp2 = { x: end.x - dist * 0.45, y: end.y };
      return `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`;
  };

  if (activeTab === 'ultra' && ultraPositions) {
      const pRef = { x: ultraPositions.refImage.x + NODE_W, y: ultraPositions.refImage.y + ANCHOR_Y };
      const pPrompt = { x: ultraPositions.prompt.x + NODE_W, y: ultraPositions.prompt.y + ANCHOR_Y };
      const pConfig = { x: ultraPositions.config.x + NODE_W, y: ultraPositions.config.y + ANCHOR_Y };
      const pImgQty = { x: ultraPositions.imgQty.x + NODE_W, y: ultraPositions.imgQty.y + ANCHOR_Y };
      const pProcL = { x: ultraPositions.processImg.x, y: ultraPositions.processImg.y + ANCHOR_Y };
      const pProcR = { x: ultraPositions.processImg.x + NODE_W, y: ultraPositions.processImg.y + ANCHOR_Y };
      const pOutImgL = { x: ultraPositions.outputImg.x, y: ultraPositions.outputImg.y + ANCHOR_Y };
      const pOutImgR = { x: ultraPositions.outputImg.x + NODE_W, y: ultraPositions.outputImg.y + ANCHOR_Y };
      const pStyleR = { x: ultraPositions.videoStyle.x + NODE_W, y: ultraPositions.videoStyle.y + ANCHOR_Y };
      const pVidQtyR = { x: ultraPositions.vidQty.x + NODE_W, y: ultraPositions.vidQty.y + ANCHOR_Y };
      const pVeoConfigR = { x: ultraPositions.veoConfig.x + NODE_W, y: ultraPositions.veoConfig.y + ANCHOR_Y };
      const pProcVidL = { x: ultraPositions.processVideo.x, y: ultraPositions.processVideo.y + ANCHOR_Y };
      const pProcVidR = { x: ultraPositions.processVideo.x + NODE_W, y: ultraPositions.processVideo.y + ANCHOR_Y };
      const pOutVidL = { x: ultraPositions.outputVideo.x, y: ultraPositions.outputVideo.y + ANCHOR_Y };

      const path1 = getCurve(pRef, pProcL);
      const path2 = getCurve(pPrompt, pProcL);
      const pathConfig = getCurve(pConfig, pProcL);
      const pathImgQty = getCurve(pImgQty, pProcL);
      const path3 = getCurve(pProcR, pOutImgL);
      const path4 = getCurve(pOutImgR, {x: ultraPositions.videoStyle.x, y: ultraPositions.videoStyle.y + ANCHOR_Y});
      const pathVidQty = getCurve(pOutImgR, {x: ultraPositions.vidQty.x, y: ultraPositions.vidQty.y + ANCHOR_Y});
      const pathVeoConfig = getCurve(pOutImgR, {x: ultraPositions.veoConfig.x, y: ultraPositions.veoConfig.y + ANCHOR_Y});
      const path5 = getCurve(pStyleR, pProcVidL);
      const pathVidQtyToProc = getCurve(pVidQtyR, pProcVidL);
      const pathVeoConfigToProc = getCurve(pVeoConfigR, pProcVidL);
      const path6 = getCurve(pProcVidR, pOutVidL);

      return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
            <defs>
                <linearGradient id="gUltra" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity="0" />
                    <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
                <filter id="glowLine"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            </defs>
            <path d={path1} stroke="rgba(255,255,255,0.05)" strokeWidth="2" fill="none" />
            <path d={path2} stroke="rgba(255,255,255,0.05)" strokeWidth="2" fill="none" />
            <path d={pathConfig} stroke="rgba(255,255,255,0.05)" strokeWidth="2" fill="none" />
            <path d={pathImgQty} stroke="rgba(255,255,255,0.05)" strokeWidth="2" fill="none" />
            <path d={path1} stroke={isGeneratingUltraImg ? "url(#gUltra)" : "none"} strokeWidth="3" fill="none" className="animate-flow" strokeDasharray="8 6" filter="url(#glowLine)" />
            <path d={path2} stroke={isGeneratingUltraImg ? "url(#gUltra)" : "none"} strokeWidth="3" fill="none" className="animate-flow" strokeDasharray="8 6" filter="url(#glowLine)" />
            <path d={pathConfig} stroke={isGeneratingUltraImg ? "url(#gUltra)" : "none"} strokeWidth="3" fill="none" className="animate-flow" strokeDasharray="8 6" filter="url(#glowLine)" />
            <path d={pathImgQty} stroke={isGeneratingUltraImg ? "url(#gUltra)" : "none"} strokeWidth="3" fill="none" className="animate-flow" strokeDasharray="8 6" filter="url(#glowLine)" />
            <path d={path3} stroke={hasUltraImageResult ? "#6366f1" : "rgba(255,255,255,0.05)"} strokeWidth="2" fill="none" filter={hasUltraImageResult ? "url(#glowLine)" : ""} />
            <path d={path4} stroke={hasUltraImageResult ? "rgba(255,255,255,0.05)" : "none"} strokeWidth="2" fill="none" />
            <path d={pathVidQty} stroke={hasUltraImageResult ? "rgba(255,255,255,0.05)" : "none"} strokeWidth="2" fill="none" />
            <path d={pathVeoConfig} stroke={hasUltraImageResult ? "rgba(255,255,255,0.05)" : "none"} strokeWidth="2" fill="none" />
            <path d={path5} stroke="rgba(255,255,255,0.05)" strokeWidth="2" fill="none" />
            <path d={pathVidQtyToProc} stroke="rgba(255,255,255,0.05)" strokeWidth="2" fill="none" />
            <path d={pathVeoConfigToProc} stroke="rgba(255,255,255,0.05)" strokeWidth="2" fill="none" />
            <path d={path6} stroke={hasUltraVideoResult ? "#f59e0b" : "rgba(255,255,255,0.05)"} strokeWidth="2" fill="none" filter={hasUltraVideoResult ? "url(#glowLine)" : ""} />
        </svg>
      );
  }

  const p1 = { x: positions.person.x + NODE_W, y: positions.person.y + ANCHOR_Y };
  const p2 = { x: positions.clothing.x + NODE_W, y: positions.clothing.y + ANCHOR_Y };
  const pPL = { x: positions.process.x, y: positions.process.y + ANCHOR_Y };
  const pPR = { x: positions.process.x + NODE_W, y: positions.process.y + ANCHOR_Y };
  const pOL = { x: positions.output.x, y: positions.output.y + ANCHOR_Y };

  const path1 = getCurve(p1, pPL);
  const path2 = getCurve(p2, pPL);
  const path3 = getCurve(pPR, pOL);

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
      <defs>
        <linearGradient id="gProc" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0" /><stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
        <filter id="glow"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <path d={path1} stroke="rgba(255,255,255,0.05)" strokeWidth="2" fill="none" />
      <path d={path2} stroke="rgba(255,255,255,0.05)" strokeWidth="2" fill="none" />
      <path d={path1} stroke={isProcessing ? "url(#gProc)" : "none"} strokeWidth="3" fill="none" className="animate-flow" strokeDasharray="8 4" filter="url(#glow)" />
      <path d={path2} stroke={isProcessing ? "url(#gProc)" : "none"} strokeWidth="3" fill="none" className="animate-flow" strokeDasharray="8 4" filter="url(#glow)" />
      <path d={path3} stroke={hasResult ? "#10b981" : "rgba(255,255,255,0.05)"} strokeWidth="2" fill="none" filter={hasResult ? "url(#glow)" : ""} />
    </svg>
  );
};
