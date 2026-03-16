import React, { useRef, useState, useEffect } from "react";
import { ImageState, ControlOption } from "../types";
import {
  Wand2,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Download,
  Play,
  Sparkles,
  ChevronRight,
  Check,
  Square,
  RectangleHorizontal,
  RectangleVertical,
  MoveRight,
  MoveLeft,
  MoveUp,
  MoveDown,
  RotateCw,
  Camera,
  Video
} from "lucide-react";

const IconMap: Record<string, any> = {
  Square,
  RectangleHorizontal,
  RectangleVertical,
  MoveRight,
  MoveLeft,
  MoveUp,
  MoveDown,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Camera,
  Video
};

interface NodeCardProps {
  id?: string;
  title: string;
  imageState?: ImageState;
  onImageUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  resultImage?: string | null;
  isActive?: boolean;
  type: "input" | "process" | "output" | "control" | "text-input";
  onClick?: () => void;
  disabled?: boolean;
  onDragStart?: (e: React.MouseEvent) => void;
  onTouchStart?: (e: React.TouchEvent) => void;
  style?: React.CSSProperties;
  options?: ControlOption[];
  onOptionSelect?: (option: ControlOption) => void;
  selectedOptionId?: string | null;
  isMobile?: boolean;
  onPreview?: () => void;
  textValue?: string;
  onTextChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  isVideoOutput?: boolean;
  onEnhance?: () => void;
  isEnhancing?: boolean;
  textConfig?: {
    fontSize: string;
    onFontSizeChange: (size: string) => void;
    fontColor: string;
    onFontColorChange: (color: string) => void;
    fontFamily: string;
    onFontFamilyChange: (font: string) => void;
  };
  gallery?: string[];
  onSelectFromGallery?: (item: string) => void;
  customInput?: {
    value: string;
    onChange: (val: string) => void;
    onSubmit: () => void;
    placeholder?: string;
  };
}

export const NodeCard = React.memo(
  React.forwardRef<HTMLDivElement, NodeCardProps>(
    (
      {
        id,
        title,
        imageState,
        onImageUpload,
        resultImage,
        isActive,
        type,
        onClick,
        disabled,
        onDragStart,
        onTouchStart,
        style,
        options,
        onOptionSelect,
        selectedOptionId,
        isMobile = false,
        onPreview,
        textValue,
        onTextChange,
        isVideoOutput,
        onEnhance,
        isEnhancing,
        gallery,
        onSelectFromGallery,
        customInput,
      },
      ref,
    ) => {
      const fileInputRef = useRef<HTMLInputElement>(null);
      const [scale, setScale] = useState(1);
      const [position, setPosition] = useState({ x: 0, y: 0 });
      const [isDraggingImage, setIsDraggingImage] = useState(false);
      const dragStartRef = useRef({ x: 0, y: 0 });

      const isVideo =
        isVideoOutput ||
        resultImage?.includes(".mp4") ||
        resultImage?.startsWith("data:video");

      useEffect(() => {
        if (resultImage) {
          setScale(1);
          setPosition({ x: 0, y: 0 });
        }
      }, [resultImage]);

      const handleBoxClick = () => {
        if (
          type === "input" &&
          !imageState?.previewUrl &&
          fileInputRef.current
        ) {
          fileInputRef.current.click();
        } else if (type === "process" && onClick && !disabled) {
          onClick();
        }
      };

      const clearImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onImageUpload && fileInputRef.current) {
          fileInputRef.current.value = "";
          onImageUpload({ target: { files: null } } as any);
        }
      };

      const sizeClass = "w-72 aspect-square";
      const baseContainer = `absolute flex flex-col rounded-[2.5rem] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] transition duration-500 backdrop-blur-3xl border border-white/10 ring-1 ring-white/10 ${sizeClass}`;

      let typeClasses = "";
      if (type === "input")
        typeClasses = "bg-white/5 hover:bg-white/[0.08] cursor-pointer group";
      else if (type === "process")
        typeClasses = `justify-center items-center ${isActive ? "bg-indigo-500 scale-105 shadow-[0_0_50px_rgba(99,102,241,0.5)]" : disabled ? "bg-slate-900/60 opacity-50 grayscale" : "bg-slate-900/80 hover:bg-indigo-950/40 cursor-pointer group hover:scale-105"}`;
      else if (type === "output") typeClasses = "bg-black/40 border-white/5";
      else typeClasses = "bg-slate-950/80";

      return (
        <div
          id={id}
          ref={ref}
          className={`${baseContainer} ${typeClasses}`}
          style={style}
          onClick={type !== "text-input" ? handleBoxClick : undefined}
        >
          {/* Premium Header */}
          <div
            className="absolute top-0 left-0 right-0 h-12 flex items-center justify-between px-6 z-20 cursor-move"
            onMouseDown={onDragStart}
            onTouchStart={onTouchStart}
          >
            <span className="font-display font-bold text-[11px] uppercase tracking-widest text-slate-300 drop-shadow-md">
              {title}
            </span>
            <div
              className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-green-400 shadow-[0_0_8px_#4ade80]" : "bg-white/20"}`}
            ></div>
          </div>

          {/* --- CONTENT AREA --- */}
          {type === "input" && (
            <div className="w-full h-full pt-0 relative flex items-center justify-center">
              <input
                type="file"
                ref={fileInputRef}
                onChange={onImageUpload}
                accept="image/*"
                className="hidden"
              />
              {imageState?.previewUrl ? (
                <>
                  <img
                    src={imageState.previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={clearImage}
                    className="absolute top-4 right-4 bg-black/60 hover:bg-rose-500 text-white rounded-2xl p-2.5 backdrop-blur-xl transition-all opacity-0 group-hover:opacity-100"
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-4 text-slate-500 group-hover:text-white transition-all">
                  <div className="p-5 rounded-3xl bg-white/5 border border-white/10 group-hover:border-indigo-500/50 group-hover:bg-indigo-500/10">
                    <Upload size={28} />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-widest">
                    Carregar
                  </span>
                </div>
              )}
            </div>
          )}

          {type === "process" && (
            <div className="flex flex-col items-center justify-center p-6 text-center w-full h-full relative group">
              {isActive ? (
                <div className="flex flex-col items-center gap-4">
                  <Wand2 className="w-14 h-14 text-white animate-spin-slow" />
                  <span className="text-white text-xs font-bold uppercase tracking-widest">
                    Processando
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center border border-white/20 shadow-xl group-hover:bg-white group-hover:text-black transition-all">
                    <Play className="w-8 h-8 fill-current ml-1" />
                  </div>
                  <span className="text-slate-400 group-hover:text-white text-[11px] font-bold uppercase tracking-widest">
                    Iniciar Workflow
                  </span>
                </div>
              )}
            </div>
          )}

          {type === "control" && options && (
            <div className="w-full h-full pt-14 pb-6 px-4 overflow-y-auto custom-scrollbar">
              <div className="flex flex-col gap-2">
                {options.map((opt) => {
                  const IconComponent = opt.icon ? IconMap[opt.icon] : null;
                  return (
                    <button
                      key={opt.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOptionSelect?.(opt);
                      }}
                      className={`group flex items-center justify-between px-5 py-3.5 rounded-2xl border transition-all duration-300 ${selectedOptionId === opt.id ? "bg-indigo-500 border-transparent text-white shadow-lg" : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/[0.08] hover:text-white"}`}
                    >
                      <div className="flex items-center gap-3">
                        {opt.icon && (
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedOptionId === opt.id ? "border-white bg-white/20" : "border-slate-500"}`}
                          >
                            {selectedOptionId === opt.id && (
                              <Check size={12} className="text-white" />
                            )}
                          </div>
                        )}
                        {IconComponent && (
                          <IconComponent
                            size={16}
                            className={
                              selectedOptionId === opt.id
                                ? "text-white"
                                : "text-slate-400 group-hover:text-white"
                            }
                          />
                        )}
                        <span className="text-[13px] font-semibold">
                          {opt.label}
                        </span>
                      </div>
                      {!opt.icon && (
                        <ChevronRight
                          size={14}
                          className={`transition-transform duration-300 ${selectedOptionId === opt.id ? "translate-x-1" : "opacity-0 group-hover:opacity-100"}`}
                        />
                      )}
                    </button>
                  );
                })}
                {customInput && (
                  <div className="mt-2 flex flex-col gap-2">
                    <input
                      type="text"
                      value={customInput.value}
                      onChange={(e) => customInput.onChange(e.target.value)}
                      placeholder={
                        customInput.placeholder || "Prompt customizado..."
                      }
                      className="w-full bg-white/5 text-white text-[13px] px-4 py-3 rounded-xl border border-white/10 focus:outline-none focus:border-indigo-500/50 transition-all"
                      onMouseDown={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && customInput.value.trim()) {
                          customInput.onSubmit();
                        }
                      }}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        customInput.onSubmit();
                      }}
                      disabled={!customInput.value.trim() || disabled}
                      className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-400 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-bold text-[11px] uppercase tracking-wider shadow-lg transition-all active:scale-95"
                    >
                      Gerar Customizado
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {type === "text-input" && (
            <div className="w-full h-full pt-14 pb-6 px-6 flex flex-col gap-4">
              <textarea
                className="w-full flex-1 bg-white/5 text-white text-[13px] p-5 rounded-[2rem] resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 border border-white/10 placeholder-slate-600 transition-all font-medium"
                placeholder="Descreva sua visão criativa..."
                value={textValue || ""}
                onChange={onTextChange}
                onMouseDown={(e) => e.stopPropagation()}
              />
              {onEnhance && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEnhance();
                  }}
                  disabled={isEnhancing}
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-indigo-500 hover:bg-indigo-400 disabled:bg-indigo-500/50 text-white rounded-2xl font-bold text-[11px] uppercase tracking-wider shadow-lg transition-all active:scale-95"
                >
                  {isEnhancing ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Sparkles size={14} />
                  )}
                  {isEnhancing ? "Otimizando..." : "IA Otimizar"}
                </button>
              )}
            </div>
          )}

          {type === "output" && (
            <div className="w-full h-full pt-12 relative flex items-center justify-center group/output">
              {resultImage ? (
                <>
                  <div
                    className="w-full h-full relative overflow-hidden bg-black/20"
                    onClick={onPreview}
                  >
                    {isVideo ? (
                      <video
                        src={resultImage}
                        controls
                        autoPlay
                        loop
                        muted
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <img
                        src={resultImage}
                        alt="Final"
                        className="w-full h-full object-contain transition-transform duration-500 hover:scale-105"
                        draggable={false}
                      />
                    )}
                  </div>
                  {/* Floating Controls */}
                  <div className="absolute bottom-6 flex gap-2 opacity-0 group-hover/output:opacity-100 transition-all translate-y-2 group-hover/output:translate-y-0">
                    <a
                      href={resultImage}
                      download
                      className="bg-white text-black p-3.5 rounded-2xl shadow-xl hover:scale-110 active:scale-90 transition-all"
                    >
                      <Download size={18} />
                    </a>
                    <button
                      onClick={onPreview}
                      className="bg-white/10 backdrop-blur-xl text-white p-3.5 rounded-2xl border border-white/20 hover:bg-white/20 transition-all"
                    >
                      <Maximize2 size={18} />
                    </button>
                  </div>
                  {/* Gallery Thumbs */}
                  {gallery && gallery.length > 1 && (
                    <div className="absolute top-14 right-4 flex flex-col gap-2 overflow-y-auto max-h-[70%] pr-1 custom-scrollbar">
                      {gallery.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectFromGallery?.(item);
                          }}
                          className={`flex-shrink-0 w-12 h-12 rounded-xl border-2 transition-all cursor-pointer overflow-hidden ${resultImage === item ? "border-indigo-500 scale-110" : "border-white/10 opacity-60 hover:opacity-100"}`}
                        >
                          <img
                            src={item}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 opacity-20">
                  <div className="w-20 h-20 border-2 border-dashed border-white rounded-[2rem]" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">
                    Visualização
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      );
    },
  ),
);

NodeCard.displayName = "NodeCard";
