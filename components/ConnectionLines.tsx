import React, { useEffect, useState, useRef } from "react";
import { ProcessingStatus, Position } from "../types";

interface ConnectionLinesProps {
  status: ProcessingStatus;
  hasResult: boolean;
  hasFinalResult: boolean;
  hasPoseResult: boolean;
  hasHairResult: boolean;
  showEditor: boolean;
  activeTab?: "flow" | "singer" | "credits" | "beauty" | "ultra";
  positionsRef: React.MutableRefObject<any>;
  ultraPositionsRef?: React.MutableRefObject<any>;
  hasUltraImageResult?: boolean;
  hasUltraVideoResult?: boolean;
  hasUltraRefImage?: boolean;
}

export const ConnectionLines: React.FC<ConnectionLinesProps> = ({
  status,
  hasResult,
  hasFinalResult,
  hasPoseResult,
  hasHairResult,
  showEditor,
  activeTab = "flow",
  positionsRef,
  ultraPositionsRef,
  hasUltraImageResult,
  hasUltraVideoResult,
  hasUltraRefImage,
}) => {
  const isProcessing = status === ProcessingStatus.PROCESSING;
  const isGeneratingUltraImg = status === ProcessingStatus.GENERATING_ULTRA_IMG;
  const isGeneratingUltraVideo =
    status === ProcessingStatus.GENERATING_ULTRA_VIDEO;

  const [, setTick] = useState(0);

  useEffect(() => {
    const handleDrag = () => {
      setTick((t) => t + 1);
    };
    window.addEventListener("node-dragged", handleDrag);
    return () => {
      window.removeEventListener("node-dragged", handleDrag);
    };
  }, []);

  const positions = positionsRef.current;
  const ultraPositions = ultraPositionsRef?.current;

  const NODE_W = 288; // w-72
  const ANCHOR_Y = 144; // half of h

  const getCurve = (start: Position, end: Position) => {
    const dist = Math.abs(end.x - start.x);
    const cp1 = { x: start.x + dist * 0.45, y: start.y };
    const cp2 = { x: end.x - dist * 0.45, y: end.y };
    return `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`;
  };

  if (activeTab === "ultra" && ultraPositions) {
    const pRef = {
      x: ultraPositions.refImage.x + NODE_W,
      y: ultraPositions.refImage.y + ANCHOR_Y,
    };
    const pPrompt = {
      x: ultraPositions.prompt.x + NODE_W,
      y: ultraPositions.prompt.y + ANCHOR_Y,
    };
    const pConfig = {
      x: ultraPositions.config.x + NODE_W,
      y: ultraPositions.config.y + ANCHOR_Y,
    };
    const pImgQty = {
      x: ultraPositions.imgQty.x + NODE_W,
      y: ultraPositions.imgQty.y + ANCHOR_Y,
    };
    const pProcL = {
      x: ultraPositions.processImg.x,
      y: ultraPositions.processImg.y + ANCHOR_Y,
    };
    const pProcR = {
      x: ultraPositions.processImg.x + NODE_W,
      y: ultraPositions.processImg.y + ANCHOR_Y,
    };
    const pOutImgL = {
      x: ultraPositions.outputImg.x,
      y: ultraPositions.outputImg.y + ANCHOR_Y,
    };
    const pOutImgR = {
      x: ultraPositions.outputImg.x + NODE_W,
      y: ultraPositions.outputImg.y + ANCHOR_Y,
    };
    const pStyleR = {
      x: ultraPositions.videoStyle.x + NODE_W,
      y: ultraPositions.videoStyle.y + ANCHOR_Y,
    };
    const pVidQtyR = {
      x: ultraPositions.vidQty.x + NODE_W,
      y: ultraPositions.vidQty.y + ANCHOR_Y,
    };
    const pVeoConfigR = {
      x: ultraPositions.veoConfig.x + NODE_W,
      y: ultraPositions.veoConfig.y + ANCHOR_Y,
    };
    const pVidDurationR = {
      x: ultraPositions.vidDuration.x + NODE_W,
      y: ultraPositions.vidDuration.y + ANCHOR_Y,
    };
    const pProcVidL = {
      x: ultraPositions.processVideo.x,
      y: ultraPositions.processVideo.y + ANCHOR_Y,
    };
    const pProcVidR = {
      x: ultraPositions.processVideo.x + NODE_W,
      y: ultraPositions.processVideo.y + ANCHOR_Y,
    };
    const pOutVidL = {
      x: ultraPositions.outputVideo.x,
      y: ultraPositions.outputVideo.y + ANCHOR_Y,
    };

    const path1 = getCurve(pRef, pProcL);
    const path2 = getCurve(pPrompt, pProcL);
    const pathConfig = getCurve(pConfig, pProcL);
    const pathImgQty = getCurve(pImgQty, pProcL);
    const path3 = getCurve(pProcR, pOutImgL);
    
    const sourceForVideo = hasUltraImageResult ? pOutImgR : pRef;
    
    const path4 = getCurve(sourceForVideo, {
      x: ultraPositions.videoStyle.x,
      y: ultraPositions.videoStyle.y + ANCHOR_Y,
    });
    const pathVidQty = getCurve(sourceForVideo, {
      x: ultraPositions.vidQty.x,
      y: ultraPositions.vidQty.y + ANCHOR_Y,
    });
    const pathVeoConfig = getCurve(sourceForVideo, {
      x: ultraPositions.veoConfig.x,
      y: ultraPositions.veoConfig.y + ANCHOR_Y,
    });
    const pathVidDuration = getCurve(sourceForVideo, {
      x: ultraPositions.vidDuration.x,
      y: ultraPositions.vidDuration.y + ANCHOR_Y,
    });
    const path5 = getCurve(pStyleR, pProcVidL);
    const pathVidQtyToProc = getCurve(pVidQtyR, pProcVidL);
    const pathVeoConfigToProc = getCurve(pVeoConfigR, pProcVidL);
    const pathVidDurationToProc = getCurve(pVidDurationR, pProcVidL);
    const path6 = getCurve(pProcVidR, pOutVidL);

    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
        <defs>
          <linearGradient id="gUltra" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
          <filter id="glowLine">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d={path1}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="2"
          fill="none"
        />
        <path
          d={path2}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="2"
          fill="none"
        />
        <path
          d={pathConfig}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="2"
          fill="none"
        />
        <path
          d={pathImgQty}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="2"
          fill="none"
        />
        <path
          d={path1}
          stroke={isGeneratingUltraImg ? "url(#gUltra)" : "none"}
          strokeWidth="3"
          fill="none"
          className="animate-flow"
          strokeDasharray="8 6"
          filter="url(#glowLine)"
        />
        <path
          d={path2}
          stroke={isGeneratingUltraImg ? "url(#gUltra)" : "none"}
          strokeWidth="3"
          fill="none"
          className="animate-flow"
          strokeDasharray="8 6"
          filter="url(#glowLine)"
        />
        <path
          d={pathConfig}
          stroke={isGeneratingUltraImg ? "url(#gUltra)" : "none"}
          strokeWidth="3"
          fill="none"
          className="animate-flow"
          strokeDasharray="8 6"
          filter="url(#glowLine)"
        />
        <path
          d={pathImgQty}
          stroke={isGeneratingUltraImg ? "url(#gUltra)" : "none"}
          strokeWidth="3"
          fill="none"
          className="animate-flow"
          strokeDasharray="8 6"
          filter="url(#glowLine)"
        />
        <path
          d={path3}
          stroke={hasUltraImageResult ? "#6366f1" : "rgba(255,255,255,0.05)"}
          strokeWidth="2"
          fill="none"
          filter={hasUltraImageResult ? "url(#glowLine)" : ""}
        />
        <path
          d={path4}
          stroke={(hasUltraImageResult || hasUltraRefImage) ? "rgba(255,255,255,0.05)" : "none"}
          strokeWidth="2"
          fill="none"
        />
        <path
          d={pathVidQty}
          stroke={(hasUltraImageResult || hasUltraRefImage) ? "rgba(255,255,255,0.05)" : "none"}
          strokeWidth="2"
          fill="none"
        />
        <path
          d={pathVeoConfig}
          stroke={(hasUltraImageResult || hasUltraRefImage) ? "rgba(255,255,255,0.05)" : "none"}
          strokeWidth="2"
          fill="none"
        />
        <path
          d={pathVidDuration}
          stroke={(hasUltraImageResult || hasUltraRefImage) ? "rgba(255,255,255,0.05)" : "none"}
          strokeWidth="2"
          fill="none"
        />
        <path
          d={path5}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="2"
          fill="none"
        />
        <path
          d={pathVidQtyToProc}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="2"
          fill="none"
        />
        <path
          d={pathVeoConfigToProc}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="2"
          fill="none"
        />
        <path
          d={pathVidDurationToProc}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="2"
          fill="none"
        />
        <path
          d={path6}
          stroke={hasUltraVideoResult ? "#f59e0b" : "rgba(255,255,255,0.05)"}
          strokeWidth="2"
          fill="none"
          filter={hasUltraVideoResult ? "url(#glowLine)" : ""}
        />
      </svg>
    );
  }

  if (activeTab === "singer") {
    const pRef = {
      x: positions.flyerRef.x + NODE_W,
      y: positions.flyerRef.y + ANCHOR_Y,
    };
    const pSinger = {
      x: positions.singerImg.x + NODE_W,
      y: positions.singerImg.y + ANCHOR_Y,
    };
    const pProcL = {
      x: positions.processSwap.x,
      y: positions.processSwap.y + ANCHOR_Y,
    };
    const pProcR = {
      x: positions.processSwap.x + NODE_W,
      y: positions.processSwap.y + ANCHOR_Y,
    };
    const pBaseResL = {
      x: positions.baseResult.x,
      y: positions.baseResult.y + ANCHOR_Y,
    };

    const path1 = getCurve(pRef, pProcL);
    const path2 = getCurve(pSinger, pProcL);
    const path3 = getCurve(pProcR, pBaseResL);

    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
        <defs>
          <linearGradient id="gProcSinger" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ec4899" stopOpacity="0" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
          <filter id="glowLine">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d={path1}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="2"
          fill="none"
        />
        <path
          d={path2}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="2"
          fill="none"
        />
        <path
          d={path1}
          stroke={isProcessing ? "url(#gProcSinger)" : "none"}
          strokeWidth="3"
          fill="none"
          className="animate-flow"
          strokeDasharray="8 6"
          filter="url(#glowLine)"
        />
        <path
          d={path2}
          stroke={isProcessing ? "url(#gProcSinger)" : "none"}
          strokeWidth="3"
          fill="none"
          className="animate-flow"
          strokeDasharray="8 6"
          filter="url(#glowLine)"
        />
        <path
          d={path3}
          stroke={hasResult ? "#ec4899" : "rgba(255,255,255,0.05)"}
          strokeWidth="2"
          fill="none"
          filter={hasResult ? "url(#glowLine)" : ""}
        />

        {showEditor &&
          positions.eventData &&
          positions.processText &&
          positions.finalOutput && (
            <>
              <path
                d={getCurve(
                  {
                    x: positions.baseResult.x + NODE_W,
                    y: positions.baseResult.y + ANCHOR_Y,
                  },
                  {
                    x: positions.processText.x,
                    y: positions.processText.y + ANCHOR_Y,
                  },
                )}
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="2"
                fill="none"
              />
              <path
                d={getCurve(
                  {
                    x: positions.eventData.x + NODE_W,
                    y: positions.eventData.y + ANCHOR_Y,
                  },
                  {
                    x: positions.processText.x,
                    y: positions.processText.y + ANCHOR_Y,
                  },
                )}
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="2"
                fill="none"
              />
              <path
                d={getCurve(
                  {
                    x: positions.processText.x + NODE_W,
                    y: positions.processText.y + ANCHOR_Y,
                  },
                  {
                    x: positions.finalOutput.x,
                    y: positions.finalOutput.y + ANCHOR_Y,
                  },
                )}
                stroke={hasFinalResult ? "#ec4899" : "rgba(255,255,255,0.05)"}
                strokeWidth="2"
                fill="none"
                filter={hasFinalResult ? "url(#glowLine)" : ""}
              />
            </>
          )}
        {showEditor &&
          positions.singerVariationControl &&
          positions.singerVariationOutput && (
            <>
              <path
                d={getCurve(
                  {
                    x: positions.baseResult.x + NODE_W,
                    y: positions.baseResult.y + ANCHOR_Y,
                  },
                  {
                    x: positions.singerVariationControl.x,
                    y: positions.singerVariationControl.y + ANCHOR_Y,
                  },
                )}
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="2"
                fill="none"
              />
              <path
                d={getCurve(
                  {
                    x: positions.singerVariationControl.x + NODE_W,
                    y: positions.singerVariationControl.y + ANCHOR_Y,
                  },
                  {
                    x: positions.singerVariationOutput.x,
                    y: positions.singerVariationOutput.y + ANCHOR_Y,
                  },
                )}
                stroke={hasResult ? "#ec4899" : "rgba(255,255,255,0.05)"}
                strokeWidth="2"
                fill="none"
                filter={hasResult ? "url(#glowLine)" : ""}
              />
            </>
          )}
      </svg>
    );
  }

  if (activeTab === "beauty") {
    const pProd = {
      x: positions.product.x + NODE_W,
      y: positions.product.y + ANCHOR_Y,
    };
    const pPal = {
      x: positions.palette.x + NODE_W,
      y: positions.palette.y + ANCHOR_Y,
    };
    const pFmt = {
      x: positions.format.x + NODE_W,
      y: positions.format.y + ANCHOR_Y,
    };
    const pProcL = {
      x: positions.process.x,
      y: positions.process.y + ANCHOR_Y,
    };
    const pProcR = {
      x: positions.process.x + NODE_W,
      y: positions.process.y + ANCHOR_Y,
    };
    const pOutL = { x: positions.output.x, y: positions.output.y + ANCHOR_Y };

    const path1 = getCurve(pProd, pProcL);
    const path2 = getCurve(pPal, pProcL);
    const path3 = getCurve(pFmt, pProcL);
    const path4 = getCurve(pProcR, pOutL);

    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
        <defs>
          <linearGradient id="gProcBeauty" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#14b8a6" stopOpacity="0" />
            <stop offset="100%" stopColor="#14b8a6" />
          </linearGradient>
          <filter id="glowLine">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d={path1}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="2"
          fill="none"
        />
        <path
          d={path2}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="2"
          fill="none"
        />
        <path
          d={path3}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="2"
          fill="none"
        />
        <path
          d={path1}
          stroke={isProcessing ? "url(#gProcBeauty)" : "none"}
          strokeWidth="3"
          fill="none"
          className="animate-flow"
          strokeDasharray="8 6"
          filter="url(#glowLine)"
        />
        <path
          d={path2}
          stroke={isProcessing ? "url(#gProcBeauty)" : "none"}
          strokeWidth="3"
          fill="none"
          className="animate-flow"
          strokeDasharray="8 6"
          filter="url(#glowLine)"
        />
        <path
          d={path3}
          stroke={isProcessing ? "url(#gProcBeauty)" : "none"}
          strokeWidth="3"
          fill="none"
          className="animate-flow"
          strokeDasharray="8 6"
          filter="url(#glowLine)"
        />
        <path
          d={path4}
          stroke={hasResult ? "#14b8a6" : "rgba(255,255,255,0.05)"}
          strokeWidth="2"
          fill="none"
          filter={hasResult ? "url(#glowLine)" : ""}
        />

        {hasResult && positions.price && (
          <path
            d={getCurve(
              {
                x: positions.output.x + NODE_W,
                y: positions.output.y + ANCHOR_Y,
              },
              { x: positions.price.x, y: positions.price.y + ANCHOR_Y },
            )}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="2"
            fill="none"
          />
        )}
      </svg>
    );
  }

  const p1 = {
    x: positions.person.x + NODE_W,
    y: positions.person.y + ANCHOR_Y,
  };
  const p2 = {
    x: positions.clothing.x + NODE_W,
    y: positions.clothing.y + ANCHOR_Y,
  };
  const pBgPrompt = {
    x: positions.bgPrompt.x + NODE_W,
    y: positions.bgPrompt.y + ANCHOR_Y,
  };
  const pBgRefImage = {
    x: positions.bgRefImage.x + NODE_W,
    y: positions.bgRefImage.y + ANCHOR_Y,
  };
  const pFormat = {
    x: positions.format.x + NODE_W,
    y: positions.format.y + ANCHOR_Y,
  };
  const pPL = { x: positions.process.x, y: positions.process.y + ANCHOR_Y };
  const pPR = {
    x: positions.process.x + NODE_W,
    y: positions.process.y + ANCHOR_Y,
  };
  const pOL = { x: positions.output.x, y: positions.output.y + ANCHOR_Y };

  const path1 = getCurve(p1, pPL);
  const path2 = getCurve(p2, pPL);
  const pathBgPrompt = getCurve(pBgPrompt, pPL);
  const pathBgRefImage = getCurve(pBgRefImage, pPL);
  const pathFormat = getCurve(pFormat, pPL);
  const path3 = getCurve(pPR, pOL);

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
      <defs>
        <linearGradient id="gProc" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d={path1}
        stroke="rgba(255,255,255,0.05)"
        strokeWidth="2"
        fill="none"
      />
      <path
        d={path2}
        stroke="rgba(255,255,255,0.05)"
        strokeWidth="2"
        fill="none"
      />
      <path
        d={pathBgPrompt}
        stroke="rgba(255,255,255,0.05)"
        strokeWidth="2"
        fill="none"
      />
      <path
        d={pathBgRefImage}
        stroke="rgba(255,255,255,0.05)"
        strokeWidth="2"
        fill="none"
      />
      <path
        d={pathFormat}
        stroke="rgba(255,255,255,0.05)"
        strokeWidth="2"
        fill="none"
      />
      <path
        d={path1}
        stroke={isProcessing ? "url(#gProc)" : "none"}
        strokeWidth="3"
        fill="none"
        className="animate-flow"
        strokeDasharray="8 4"
        filter="url(#glow)"
      />
      <path
        d={path2}
        stroke={isProcessing ? "url(#gProc)" : "none"}
        strokeWidth="3"
        fill="none"
        className="animate-flow"
        strokeDasharray="8 4"
        filter="url(#glow)"
      />
      <path
        d={pathBgPrompt}
        stroke={isProcessing ? "url(#gProc)" : "none"}
        strokeWidth="3"
        fill="none"
        className="animate-flow"
        strokeDasharray="8 4"
        filter="url(#glow)"
      />
      <path
        d={pathBgRefImage}
        stroke={isProcessing ? "url(#gProc)" : "none"}
        strokeWidth="3"
        fill="none"
        className="animate-flow"
        strokeDasharray="8 4"
        filter="url(#glow)"
      />
      <path
        d={pathFormat}
        stroke={isProcessing ? "url(#gProc)" : "none"}
        strokeWidth="3"
        fill="none"
        className="animate-flow"
        strokeDasharray="8 4"
        filter="url(#glow)"
      />
      <path
        d={path3}
        stroke={hasResult ? "#10b981" : "rgba(255,255,255,0.05)"}
        strokeWidth="2"
        fill="none"
        filter={hasResult ? "url(#glow)" : ""}
      />

      {showEditor && positions.editor && positions.final && (
        <>
          <path
            d={getCurve(
              {
                x: positions.output.x + NODE_W,
                y: positions.output.y + ANCHOR_Y,
              },
              { x: positions.editor.x, y: positions.editor.y + ANCHOR_Y },
            )}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="2"
            fill="none"
          />
          <path
            d={getCurve(
              {
                x: positions.editor.x + NODE_W,
                y: positions.editor.y + ANCHOR_Y,
              },
              { x: positions.final.x, y: positions.final.y + ANCHOR_Y },
            )}
            stroke={hasFinalResult ? "#10b981" : "rgba(255,255,255,0.05)"}
            strokeWidth="2"
            fill="none"
            filter={hasFinalResult ? "url(#glow)" : ""}
          />
        </>
      )}
      {showEditor && positions.poseControl && positions.poseOutput && (
        <>
          <path
            d={getCurve(
              {
                x: positions.output.x + NODE_W,
                y: positions.output.y + ANCHOR_Y,
              },
              {
                x: positions.poseControl.x,
                y: positions.poseControl.y + ANCHOR_Y,
              },
            )}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="2"
            fill="none"
          />
          <path
            d={getCurve(
              {
                x: positions.poseControl.x + NODE_W,
                y: positions.poseControl.y + ANCHOR_Y,
              },
              {
                x: positions.poseOutput.x,
                y: positions.poseOutput.y + ANCHOR_Y,
              },
            )}
            stroke={hasPoseResult ? "#10b981" : "rgba(255,255,255,0.05)"}
            strokeWidth="2"
            fill="none"
            filter={hasPoseResult ? "url(#glow)" : ""}
          />
        </>
      )}
      {showEditor && positions.hairControl && positions.hairOutput && (
        <>
          <path
            d={getCurve(
              {
                x: positions.output.x + NODE_W,
                y: positions.output.y + ANCHOR_Y,
              },
              {
                x: positions.hairControl.x,
                y: positions.hairControl.y + ANCHOR_Y,
              },
            )}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="2"
            fill="none"
          />
          <path
            d={getCurve(
              {
                x: positions.hairControl.x + NODE_W,
                y: positions.hairControl.y + ANCHOR_Y,
              },
              {
                x: positions.hairOutput.x,
                y: positions.hairOutput.y + ANCHOR_Y,
              },
            )}
            stroke={hasHairResult ? "#10b981" : "rgba(255,255,255,0.05)"}
            strokeWidth="2"
            fill="none"
            filter={hasHairResult ? "url(#glow)" : ""}
          />
        </>
      )}
    </svg>
  );
};
