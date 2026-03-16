import React, { useState, useRef, useEffect, useCallback } from "react";
import { NodeCard } from "./components/NodeCard";
import { ConnectionLines } from "./components/ConnectionLines";
import { NodeCanvas } from "./components/NodeCanvas";
import {
  ImageState,
  ProcessingStatus,
  Position,
  ControlOption,
  SavedFlowState,
  Coupon,
} from "./types";
import {
  generateOutfitSwap,
  refineImage,
  generatePoseVariation,
  generateHairVariation,
  generateSingerSwap,
  applyFlyerText,
  generateSingerVariation,
  generateBeautyBackground,
  generateUltraImage,
  generateVeoVideo,
  enhancePrompt,
  generatePromptVariations,
} from "./services/geminiService";
import {
  Key,
  LogOut,
  Wallet,
  Save,
  Upload,
  Download,
  Settings,
  X,
  Video,
  Wand2,
  Plus,
  Music,
  Sparkles,
} from "lucide-react";

const STYLE_OPTIONS: ControlOption[] = [
  {
    id: "bg_studio",
    label: "Fundo: Estúdio",
    prompt:
      "substitua o fundo por um estúdio fotográfico minimalista profissional",
  },
  {
    id: "bg_street",
    label: "Fundo: Rua Urbana",
    prompt: "substitua o fundo por uma rua urbana moderna e desfocada (bokeh)",
  },
  {
    id: "bg_beach",
    label: "Fundo: Praia",
    prompt: "substitua o fundo por uma praia paradisíaca ensolarada",
  },
  {
    id: "bg_cyber",
    label: "Estilo: Cyberpunk",
    prompt: "adicione uma atmosfera cyberpunk neon futurista ao ambiente",
  },
  {
    id: "light_sunset",
    label: "Luz: Pôr do Sol",
    prompt: "altere a iluminação para a hora dourada do pôr do sol",
  },
  {
    id: "style_vintage",
    label: "Filtro: Vintage",
    prompt: "aplique uma estética de fotografia de filme vintage anos 90",
  },
];

const POSE_OPTIONS: ControlOption[] = [
  {
    id: "pose_walking",
    label: "Andando",
    prompt: "andando em direção à câmera com confiança, estilo desfile",
  },
  {
    id: "pose_sitting",
    label: "Sentado",
    prompt:
      "sentado de forma relaxada e elegante em um banco ou cadeira invisível",
  },
  {
    id: "pose_hands_hip",
    label: "Mão na Cintura",
    prompt: "em pé com as mãos na cintura, pose clássica de poder",
  },
  {
    id: "pose_side",
    label: "Perfil",
    prompt: "de perfil lateral olhando para o horizonte",
  },
  {
    id: "pose_back",
    label: "Costas",
    prompt:
      "de costas, virando levemente a cabeça para olhar por cima do ombro",
  },
  {
    id: "pose_arms_crossed",
    label: "Braços Cruzados",
    prompt: "em pé com os braços cruzados e atitude confiante",
  },
  {
    id: "pose_jumping",
    label: "Pulando",
    prompt: "no ar, pulando com energia e expressão de alegria",
  },
  {
    id: "pose_leaning",
    label: "Encostado",
    prompt:
      "encostado casualmente em uma parede invisível, com uma perna cruzada",
  },
  {
    id: "pose_running",
    label: "Correndo",
    prompt: "correndo em movimento dinâmico, capturado em ação",
  },
  {
    id: "pose_dancing",
    label: "Dançando",
    prompt: "em uma pose de dança expressiva e fluida",
  },
  {
    id: "pose_squatting",
    label: "Agachado",
    prompt: "agachado com estilo urbano, olhando para a câmera",
  },
  {
    id: "pose_looking_up",
    label: "Olhando para Cima",
    prompt: "olhando para cima com expressão de esperança ou admiração",
  },
];

const HAIR_OPTIONS: ControlOption[] = [
  {
    id: "hair_fem_wavy",
    label: "Fem: Longo Ondulado",
    prompt: "cabelo longo, solto e com ondas naturais volumosas",
  },
  {
    id: "hair_fem_bob",
    label: "Fem: Bob Curto",
    prompt: "corte de cabelo bob curto e moderno, na altura do queixo",
  },
  {
    id: "hair_masc_fade",
    label: "Masc: Degradê (Fade)",
    prompt:
      "corte masculino com degradê (fade) clássico nas laterais e volume moderado no topo",
  },
  {
    id: "hair_masc_quiff",
    label: "Masc: Topete (Quiff)",
    prompt: "corte masculino com Topete Moderno (Quiff) volumoso",
  },
];

const SINGER_VARIATION_OPTIONS: ControlOption[] = [
  {
    id: "singer_fem",
    label: "Cantora Sertaneja (M)",
    prompt: "uma cantora sertaneja mulher carismática, segurando microfone",
  },
  {
    id: "singer_masc",
    label: "Cantor Sertanejo (H)",
    prompt: "um cantor sertanejo homem carismático, com chapéu e violão",
  },
  {
    id: "singer_pop",
    label: "Estilo Pop",
    prompt: "um cantor estilo pop moderno e estiloso",
  },
];

const FORMAT_OPTIONS: ControlOption[] = [
  { id: "1:1", label: "1:1", prompt: "1:1", icon: "Square" },
  { id: "3:4", label: "3:4", prompt: "3:4", icon: "RectangleVertical" },
  { id: "4:3", label: "4:3", prompt: "4:3", icon: "RectangleHorizontal" },
  { id: "9:16", label: "9:16", prompt: "9:16", icon: "RectangleVertical" },
  { id: "16:9", label: "16:9", prompt: "16:9", icon: "RectangleHorizontal" },
  { id: "1:4", label: "1:4", prompt: "1:4", icon: "RectangleVertical" },
  { id: "4:1", label: "4:1", prompt: "4:1", icon: "RectangleHorizontal" },
];

const ULTRA_CONFIG_OPTIONS: ControlOption[] = [
  { id: "1:1", label: "1:1", prompt: "1:1", icon: "Square" },
  { id: "3:4", label: "3:4", prompt: "3:4", icon: "RectangleVertical" },
  { id: "4:3", label: "4:3", prompt: "4:3", icon: "RectangleHorizontal" },
  { id: "9:16", label: "9:16", prompt: "9:16", icon: "RectangleVertical" },
  { id: "16:9", label: "16:9", prompt: "16:9", icon: "RectangleHorizontal" },
  { id: "1:4", label: "1:4", prompt: "1:4", icon: "RectangleVertical" },
  { id: "4:1", label: "4:1", prompt: "4:1", icon: "RectangleHorizontal" },
];

const VEO_QUALITY_OPTIONS: ControlOption[] = [
  { id: "fast", label: "720p (Rápido)", prompt: "fast" },
  { id: "quality", label: "1080p (Alta Qualidade)", prompt: "quality" },
];

const IMAGE_QTY_OPTIONS: ControlOption[] = [
  { id: "qty_img_1", label: "1 Imagem", prompt: "1" },
  { id: "qty_img_4", label: "4 Imagens", prompt: "4" },
  { id: "qty_img_10", label: "10 Imagens", prompt: "10" },
];

const VIDEO_QTY_OPTIONS: ControlOption[] = [
  { id: "qty_vid_1", label: "1 Vídeo", prompt: "1" },
  { id: "qty_vid_2", label: "2 Vídeos", prompt: "2" },
];

const VIDEO_DURATION_OPTIONS: ControlOption[] = [
  { id: "5s", label: "5 Segundos", prompt: "5s" },
  { id: "12s", label: "12 Segundos", prompt: "12s" },
  { id: "19s", label: "19 Segundos", prompt: "19s" },
];

const VIDEO_STYLE_OPTIONS: ControlOption[] = [
  {
    id: "pan_cinematic",
    label: "Panorâmica",
    prompt: "Slow cinematic pan showing the environment details.",
    icon: "MoveRight"
  },
  {
    id: "zoom_in",
    label: "Zoom In",
    prompt: "Slow smooth zoom in towards the subject.",
    icon: "ZoomIn"
  },
  {
    id: "zoom_out",
    label: "Zoom Out",
    prompt: "Slow smooth zoom out revealing the environment.",
    icon: "ZoomOut"
  },
  {
    id: "orbit",
    label: "Órbita",
    prompt: "Camera orbiting around the subject smoothly.",
    icon: "RotateCw"
  },
  {
    id: "handheld",
    label: "Handheld",
    prompt: "Handheld camera movement, slightly shaky and realistic.",
    icon: "Camera"
  },
  {
    id: "tilt_up",
    label: "Tilt Up",
    prompt: "Camera tilting up slowly.",
    icon: "MoveUp"
  },
  {
    id: "tilt_down",
    label: "Tilt Down",
    prompt: "Camera tilting down slowly.",
    icon: "MoveDown"
  },
  {
    id: "static",
    label: "Estático",
    prompt: "Static camera, no movement.",
    icon: "Video"
  }
];

const DEFAULT_POSITIONS = {
  person: { x: 80, y: 100 },
  clothing: { x: 80, y: 400 },
  bgPrompt: { x: 80, y: 700 },
  bgRefImage: { x: 80, y: 1000 },
  format: { x: 80, y: 1300 },
  process: { x: 400, y: 700 },
  output: { x: 720, y: 700 },
  editor: { x: 1040, y: 150 },
  final: { x: 1360, y: 150 },
  poseControl: { x: 1040, y: 450 },
  poseOutput: { x: 1360, y: 450 },
  hairControl: { x: 1040, y: 750 },
  hairOutput: { x: 1360, y: 750 },
};

const DEFAULT_SINGER_POSITIONS = {
  flyerRef: { x: 80, y: 100 },
  singerImg: { x: 80, y: 400 },
  processSwap: { x: 400, y: 250 },
  baseResult: { x: 720, y: 250 },
  eventData: { x: 720, y: 550 },
  processText: { x: 1040, y: 400 },
  finalOutput: { x: 1360, y: 400 },
  singerVariationControl: { x: 1360, y: 700 },
  singerVariationOutput: { x: 1680, y: 700 },
};

const DEFAULT_BEAUTY_POSITIONS = {
  product: { x: 80, y: 100 },
  palette: { x: 80, y: 400 },
  format: { x: 80, y: 700 },
  bgPrompt: { x: 80, y: 1000 },
  price: { x: 400, y: 550 },
  process: { x: 400, y: 250 },
  output: { x: 720, y: 250 },
};

const DEFAULT_ULTRA_POSITIONS = {
  refImage: { x: 80, y: 100 },
  prompt: { x: 80, y: 400 },
  config: { x: 80, y: 650 },
  imgQty: { x: 80, y: 880 },
  processImg: { x: 400, y: 250 },
  outputImg: { x: 720, y: 250 },
  videoStyle: { x: 1040, y: 100 },
  vidQty: { x: 1040, y: 350 },
  veoConfig: { x: 1040, y: 600 },
  vidDuration: { x: 1040, y: 850 },
  processVideo: { x: 1360, y: 600 },
  outputVideo: { x: 1680, y: 600 },
};

const COST_BASE_SWAP = 3;
const COST_TEXT_EDIT = 1;
const COST_VARIATION = 1;
const COST_BEAUTY_GEN = 2;
const COST_ULTRA_IMG = 4;
const COST_ULTRA_VIDEO = 8;

export const App: React.FC = () => {
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");

  // Check for API Key on mount (Gemini)
  useEffect(() => {
    const checkKey = async () => {
      const localKey = localStorage.getItem("gemini_api_key");
      if (localKey) {
        setHasApiKey(true);
        return;
      }
      const win = window as any;
      if (win.aistudio && win.aistudio.hasSelectedApiKey) {
        const has = await win.aistudio.hasSelectedApiKey();
        setHasApiKey(has);
      } else if (
        typeof process !== "undefined" &&
        process.env &&
        process.env.API_KEY
      ) {
        setHasApiKey(true);
      } else {
        setHasApiKey(false);
      }
    };
    checkKey();
  }, []);

  const handleConnectApiKey = async () => {
    if (apiKeyInput.trim()) {
      localStorage.setItem("gemini_api_key", apiKeyInput.trim());
      setHasApiKey(true);
      return;
    }
    const win = window as any;
    if (win.aistudio && win.aistudio.openSelectKey) {
      await win.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // --- App State ---
  const [activeTab, setActiveTab] = useState<
    "canvas" | "flow" | "singer" | "beauty" | "credits" | "ultra"
  >("canvas");

  // Studio Flow State
  const [personImage, setPersonImage] = useState<ImageState>({
    file: null,
    previewUrl: null,
    base64: null,
  });
  const [clothingImage, setClothingImage] = useState<ImageState>({
    file: null,
    previewUrl: null,
    base64: null,
  });
  const [bgRefImage, setBgRefImage] = useState<ImageState>({
    file: null,
    previewUrl: null,
    base64: null,
  });
  const [mainAspectRatio, setMainAspectRatio] = useState<string>("1:1");
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [finalResultImage, setFinalResultImage] = useState<string | null>(null);
  const [poseResultImage, setPoseResultImage] = useState<string | null>(null);
  const [hairResultImage, setHairResultImage] = useState<string | null>(null);

  // Singer Flow State
  const [flyerRefImage, setFlyerRefImage] = useState<ImageState>({
    file: null,
    previewUrl: null,
    base64: null,
  });
  const [singerImage, setSingerImage] = useState<ImageState>({
    file: null,
    previewUrl: null,
    base64: null,
  });
  const [eventDetails, setEventDetails] = useState<string>("");
  const [eventFontSize, setEventFontSize] = useState<string>("Médio");
  const [eventFontColor, setEventFontColor] = useState<string>("#FFFFFF");
  const [eventFontFamily, setEventFontFamily] = useState<string>("Original");

  const [flyerBaseResult, setFlyerBaseResult] = useState<string | null>(null);
  const [flyerFinalResult, setFlyerFinalResult] = useState<string | null>(null);
  const [singerVariationResultImage, setSingerVariationResultImage] = useState<
    string | null
  >(null);

  // Beauty Flow State
  const [beautyProductImage, setBeautyProductImage] = useState<ImageState>({
    file: null,
    previewUrl: null,
    base64: null,
  });
  const [beautyPaletteImage, setBeautyPaletteImage] = useState<ImageState>({
    file: null,
    previewUrl: null,
    base64: null,
  });
  const [beautyResultImage, setBeautyResultImage] = useState<string | null>(
    null,
  );
  const [beautyAspectRatio, setBeautyAspectRatio] = useState<string>("1:1");
  const [beautyPrice, setBeautyPrice] = useState<string>("");
  const [beautyBgPrompt, setBeautyBgPrompt] = useState<string>("");

  // Ultra Flow State
  const [ultraRefImage, setUltraRefImage] = useState<ImageState>({
    file: null,
    previewUrl: null,
    base64: null,
  });
  const [ultraPrompt, setUltraPrompt] = useState<string>("");
  const [ultraResultImage, setUltraResultImage] = useState<string | null>(null);
  const [ultraVideoUrl, setUltraVideoUrl] = useState<string | null>(null);
  const [ultraConfig, setUltraConfig] = useState<string>("1:1");
  const [ultraVideoStyle, setUltraVideoStyle] = useState<string | null>(null);
  const [veoModel, setVeoModel] = useState<"fast" | "quality">("quality");
  const [veoFormat, setVeoFormat] = useState<string>("16:9");
  const [ultraVideoDuration, setUltraVideoDuration] = useState<string>("5s");

  // Ultra Variations State
  const [ultraImageCount, setUltraImageCount] = useState<number>(1);
  const [ultraVideoCount, setUltraVideoCount] = useState<number>(1);
  const [ultraImageGallery, setUltraImageGallery] = useState<string[]>([]);
  const [ultraVideoGallery, setUltraVideoGallery] = useState<string[]>([]);

  // Common State
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedControl, setSelectedControl] = useState<string | null>(null);
  const [customStylePrompt, setCustomStylePrompt] = useState<string>("");
  const [initialBgPrompt, setInitialBgPrompt] = useState<string>("");
  const [selectedPose, setSelectedPose] = useState<string | null>(null);
  const [selectedHair, setSelectedHair] = useState<string | null>(null);
  const [selectedSingerVar, setSelectedSingerVar] = useState<string | null>(
    null,
  );

  const getStorageKeys = () => ({
    credits: `styleSwap_credits_local`,
    coupons: `styleSwap_coupons_local`,
    pos: `styleSwap_pos_local`,
  });

  const [credits, setCredits] = useState<number>(0);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [redeemCode, setRedeemCode] = useState("");

  const [positions, setPositions] = useState(DEFAULT_POSITIONS);
  const [singerPositions, setSingerPositions] = useState(
    DEFAULT_SINGER_POSITIONS,
  );
  const [beautyPositions, setBeautyPositions] = useState(
    DEFAULT_BEAUTY_POSITIONS,
  );
  const [ultraPositions, setUltraPositions] = useState(DEFAULT_ULTRA_POSITIONS);

  const [showExtendedFlow, setShowExtendedFlow] = useState(false);

  // Load User Data
  useEffect(() => {
    const keys = getStorageKeys();
    const savedCredits = localStorage.getItem(keys.credits);
    setCredits(savedCredits ? parseInt(savedCredits, 10) : 50);
    const savedCoupons = localStorage.getItem(keys.coupons);
    setCoupons(savedCoupons ? JSON.parse(savedCoupons) : []);
    const savedPos = localStorage.getItem(keys.pos);
    if (savedPos) {
      setPositions({ ...DEFAULT_POSITIONS, ...JSON.parse(savedPos) });
    } else {
      setPositions(DEFAULT_POSITIONS);
    }
  }, []);

  // Save User Data
  useEffect(() => {
    const keys = getStorageKeys();
    localStorage.setItem(keys.credits, credits.toString());
  }, [credits]);

  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<{
    id: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const positionsRef = useRef(positions);
  useEffect(() => {
    positionsRef.current = positions;
  }, [positions]);

  const singerPositionsRef = useRef(singerPositions);
  useEffect(() => {
    singerPositionsRef.current = singerPositions;
  }, [singerPositions]);

  const beautyPositionsRef = useRef(beautyPositions);
  useEffect(() => {
    beautyPositionsRef.current = beautyPositions;
  }, [beautyPositions]);

  const ultraPositionsRef = useRef(ultraPositions);
  useEffect(() => {
    ultraPositionsRef.current = ultraPositions;
  }, [ultraPositions]);

  const updatePosition = useCallback(
    (id: string, newX: number, newY: number) => {
      const updateState = (
        setter: React.Dispatch<React.SetStateAction<any>>,
      ) => {
        setter((prev: any) => ({ ...prev, [id]: { x: newX, y: newY } }));
      };

      if (activeTab === "singer") {
        updateState(setSingerPositions);
      } else if (activeTab === "beauty") {
        updateState(setBeautyPositions);
      } else if (activeTab === "ultra") {
        updateState(setUltraPositions);
      } else {
        updateState(setPositions);
      }
    },
    [activeTab],
  );

  const handleDragStart = (
    e: React.MouseEvent,
    id: string,
    currentX: number,
    currentY: number,
  ) => {
    e.preventDefault();
    draggingRef.current = {
      id,
      offsetX: e.clientX - currentX,
      offsetY: e.clientY - currentY,
    };
  };

  const lastUpdateRef = useRef<number>(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingRef.current) return;
    e.preventDefault();

    const now = Date.now();
    if (now - lastUpdateRef.current < 16) return; // ~60fps
    lastUpdateRef.current = now;

    if (animationFrameRef.current) return;

    const { id, offsetX, offsetY } = draggingRef.current;
    const clientX = e.clientX;
    const clientY = e.clientY;

    animationFrameRef.current = requestAnimationFrame(() => {
      const newX = clientX - offsetX;
      const newY = clientY - offsetY;

      const nodeElement = document.getElementById(`node-${id}`);
      if (nodeElement) {
        nodeElement.style.left = `${newX}px`;
        nodeElement.style.top = `${newY}px`;
      }

      let refToUpdate;
      if (activeTab === "singer") refToUpdate = singerPositionsRef;
      else if (activeTab === "beauty") refToUpdate = beautyPositionsRef;
      else if (activeTab === "ultra") refToUpdate = ultraPositionsRef;
      else refToUpdate = positionsRef;

      if (refToUpdate.current[id]) {
        refToUpdate.current[id] = { x: newX, y: newY };
      }

      window.dispatchEvent(new CustomEvent("node-dragged"));
      animationFrameRef.current = null;
    });
  };

  const handleTouchStart = (
    e: React.TouchEvent,
    id: string,
    currentX: number,
    currentY: number,
  ) => {
    const touch = e.touches[0];
    draggingRef.current = {
      id,
      offsetX: touch.clientX - currentX,
      offsetY: touch.clientY - currentY,
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!draggingRef.current) return;
    if (e.cancelable) e.preventDefault();

    const now = Date.now();
    if (now - lastUpdateRef.current < 16) return; // ~60fps
    lastUpdateRef.current = now;

    if (animationFrameRef.current) return;

    const touch = e.touches[0];
    const { id, offsetX, offsetY } = draggingRef.current;
    const clientX = touch.clientX;
    const clientY = touch.clientY;

    animationFrameRef.current = requestAnimationFrame(() => {
      const newX = clientX - offsetX;
      const newY = clientY - offsetY;

      const nodeElement = document.getElementById(`node-${id}`);
      if (nodeElement) {
        nodeElement.style.left = `${newX}px`;
        nodeElement.style.top = `${newY}px`;
      }

      let refToUpdate;
      if (activeTab === "singer") refToUpdate = singerPositionsRef;
      else if (activeTab === "beauty") refToUpdate = beautyPositionsRef;
      else if (activeTab === "ultra") refToUpdate = ultraPositionsRef;
      else refToUpdate = positionsRef;

      if (refToUpdate.current[id]) {
        refToUpdate.current[id] = { x: newX, y: newY };
      }

      window.dispatchEvent(new CustomEvent("node-dragged"));
      animationFrameRef.current = null;
    });
  };

  const handleDragEnd = () => {
    if (draggingRef.current) {
      const { id } = draggingRef.current;
      let refToUpdate;
      if (activeTab === "singer") refToUpdate = singerPositionsRef;
      else if (activeTab === "beauty") refToUpdate = beautyPositionsRef;
      else if (activeTab === "ultra") refToUpdate = ultraPositionsRef;
      else refToUpdate = positionsRef;

      if (refToUpdate.current[id]) {
        updatePosition(
          id,
          refToUpdate.current[id].x,
          refToUpdate.current[id].y,
        );
      }
      draggingRef.current = null;
    }
  };

  const handleTouchEnd = handleDragEnd;
  const handleMouseUp = handleDragEnd;

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<ImageState>>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter({
          file,
          previewUrl: URL.createObjectURL(file),
          base64: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    } else {
      setter({ file: null, previewUrl: null, base64: null });
    }
  };

  const checkCredits = (cost: number) => {
    if (credits < cost) {
      setErrorMessage(
        `Créditos insuficientes! Você precisa de ${cost} créditos.`,
      );
      return false;
    }
    return true;
  };

  const deductCredits = (cost: number) => {
    setCredits((prev) => Math.max(0, prev - cost));
  };

  const handleGeminiError = (error: any) => {
    setStatus(ProcessingStatus.ERROR);

    const msg =
      error?.message && typeof error.message === "string" ? error.message : String(error || "");

    if (msg.includes("429") || msg.includes("quota")) {
      setErrorMessage("Limite de uso (Cota) excedido. Aguarde alguns minutos.");
    } else if (
      msg.includes("Requested entity was not found") ||
      msg.includes("API key not valid") ||
      msg.includes("leaked") ||
      msg.includes("PERMISSION_DENIED")
    ) {
      setHasApiKey(false);
      setErrorMessage(
        "Chave API inválida ou vazada. Por favor, conecte outra chave.",
      );
    } else {
      setErrorMessage(msg || "Erro desconhecido na geração.");
    }
  };

  const processSwap = async () => {
    if (!personImage.base64 || !clothingImage.base64) return;
    if (!checkCredits(COST_BASE_SWAP)) return;
    setStatus(ProcessingStatus.PROCESSING);
    setErrorMessage(null);
    setResultImage(null);
    setFinalResultImage(null);
    setShowExtendedFlow(false);
    try {
      const generatedImage = await generateOutfitSwap(
        personImage.base64,
        clothingImage.base64,
        mainAspectRatio,
        initialBgPrompt,
        bgRefImage.base64 || undefined,
      );
      deductCredits(COST_BASE_SWAP);
      setResultImage(generatedImage);
      setStatus(ProcessingStatus.SUCCESS);
      setTimeout(() => setShowExtendedFlow(true), 500);
    } catch (error: any) {
      handleGeminiError(error);
    }
  };

  const processSingerSwap = async () => {
    if (!flyerRefImage.base64 || !singerImage.base64) {
      setErrorMessage("Carregue o Flyer e o Cantor primeiro.");
      return;
    }
    if (!checkCredits(COST_BASE_SWAP)) return;
    setStatus(ProcessingStatus.GENERATING_SINGER_SWAP);
    setErrorMessage(null);
    setFlyerBaseResult(null);
    setFlyerFinalResult(null);
    try {
      const generatedFlyer = await generateSingerSwap(
        flyerRefImage.base64,
        singerImage.base64,
      );
      deductCredits(COST_BASE_SWAP);
      setFlyerBaseResult(generatedFlyer);
      setStatus(ProcessingStatus.SUCCESS);
    } catch (error: any) {
      handleGeminiError(error);
    }
  };

  const processFlyerText = async () => {
    if (!flyerBaseResult || !eventDetails) {
      setErrorMessage(
        "Gere o flyer com o cantor e preencha os dados do evento.",
      );
      return;
    }
    if (!checkCredits(COST_TEXT_EDIT)) return;
    setStatus(ProcessingStatus.GENERATING_FLYER_TEXT);
    setErrorMessage(null);
    setFlyerFinalResult(null);
    try {
      const finishedFlyer = await applyFlyerText(
        flyerBaseResult,
        eventDetails,
        eventFontSize,
        eventFontColor,
        eventFontFamily,
      );
      deductCredits(COST_TEXT_EDIT);
      setFlyerFinalResult(finishedFlyer);
      setStatus(ProcessingStatus.SUCCESS);
    } catch (error: any) {
      handleGeminiError(error);
    }
  };

  const processBeautyBackground = async () => {
    if (!beautyProductImage.base64 || !beautyPaletteImage.base64) {
      setErrorMessage("Carregue o Produto e a Paleta primeiro.");
      return;
    }
    if (!checkCredits(COST_BEAUTY_GEN)) return;
    setStatus(ProcessingStatus.GENERATING_BEAUTY_BG);
    setErrorMessage(null);
    setBeautyResultImage(null);
    try {
      const result = await generateBeautyBackground(
        beautyProductImage.base64,
        beautyPaletteImage.base64,
        beautyAspectRatio,
        beautyPrice,
        beautyBgPrompt,
      );
      deductCredits(COST_BEAUTY_GEN);
      setBeautyResultImage(result);
      setStatus(ProcessingStatus.SUCCESS);
    } catch (error: any) {
      handleGeminiError(error);
    }
  };

  const handleUltraConfigSelect = (option: ControlOption) => {
    setUltraConfig(option.id);
  };

  const handleUltraImageQtySelect = (option: ControlOption) => {
    setUltraImageCount(parseInt(option.prompt));
  };

  const handleUltraVideoQtySelect = (option: ControlOption) => {
    setUltraVideoCount(parseInt(option.prompt));
  };

  const handleVeoConfigSelect = (option: ControlOption) => {
    if (option.id === "fast" || option.id === "quality") {
      setVeoModel(option.id as "fast" | "quality");
    } else if (option.id === "16:9" || option.id === "9:16") {
      setVeoFormat(option.id);
    }
  };

  const processUltraImage = async () => {
    if (!ultraRefImage.base64 || !ultraPrompt) {
      setErrorMessage("Adicione uma imagem de referência e um prompt.");
      return;
    }

    const totalCost = COST_ULTRA_IMG * ultraImageCount;
    if (!checkCredits(totalCost)) return;

    setStatus(ProcessingStatus.GENERATING_ULTRA_IMG);
    setErrorMessage(null);
    setUltraResultImage(null);
    setUltraVideoUrl(null);
    setUltraImageGallery([]);

    const ar =
      ultraConfig === "9:16" ? "9:16" : ultraConfig === "16:9" ? "16:9" : "1:1";

    try {
      const cameraVariations = [
        "Close-up Portrait (Focus on face details)",
        "Full Body Shot (Wide view)",
        "Low Angle Hero Shot",
        "Side Profile View",
        "Medium Shot (Cinematic)",
      ];

      const requests = [];
      for (let i = 0; i < ultraImageCount; i++) {
        let prompt = ultraPrompt;
        if (ultraImageCount > 1) {
          const variation = cameraVariations[i % cameraVariations.length];
          prompt += `\n\n[CAMERA VARIATION: ${variation}]`;
        }
        requests.push(generateUltraImage(ultraRefImage.base64, prompt, ar));
      }

      const results = await Promise.all(requests);
      deductCredits(totalCost);

      setUltraResultImage(results[0]);
      setUltraImageGallery(results);

      setStatus(ProcessingStatus.SUCCESS);
    } catch (error: any) {
      handleGeminiError(error);
    }
  };

  const handleEnhancePrompt = async () => {
    if (!ultraPrompt) return;
    setStatus(ProcessingStatus.GENERATING_PROMPT_ENHANCEMENT);
    try {
      const enhanced = await enhancePrompt(ultraPrompt);
      setUltraPrompt(enhanced);
      setStatus(ProcessingStatus.SUCCESS);
    } catch (error) {
      setStatus(ProcessingStatus.IDLE);
    }
  };

  const handleEnhanceBgPrompt = async () => {
    if (!initialBgPrompt) return;
    setStatus(ProcessingStatus.GENERATING_PROMPT_ENHANCEMENT);
    try {
      const enhanced = await enhancePrompt(initialBgPrompt);
      setInitialBgPrompt(enhanced);
      setStatus(ProcessingStatus.SUCCESS);
    } catch (error) {
      setStatus(ProcessingStatus.IDLE);
    }
  };

  const handleEnhanceBeautyBgPrompt = async () => {
    if (!beautyBgPrompt) return;
    setStatus(ProcessingStatus.GENERATING_PROMPT_ENHANCEMENT);
    try {
      const enhanced = await enhancePrompt(beautyBgPrompt);
      setBeautyBgPrompt(enhanced);
      setStatus(ProcessingStatus.SUCCESS);
    } catch (error) {
      setStatus(ProcessingStatus.IDLE);
    }
  };

  const handleVideoStyleSelect = (option: ControlOption) => {
    setUltraVideoStyle(prev => prev === option.id ? null : option.id);
  };

  const processUltraVideo = async () => {
    const sourceImage = ultraResultImage || ultraRefImage.base64;
    if (!sourceImage) {
      setErrorMessage("Adicione uma imagem de referência ou gere a imagem Ultra primeiro.");
      return;
    }

    const totalCost = COST_ULTRA_VIDEO * ultraVideoCount;
    if (!checkCredits(totalCost)) return;

    setStatus(ProcessingStatus.GENERATING_ULTRA_VIDEO);
    setErrorMessage(null);
    setUltraVideoUrl(null);
    setUltraVideoGallery([]);

    try {
      let promptsToUse = [ultraPrompt];
      if (ultraVideoCount > 1) {
        promptsToUse = await generatePromptVariations(
          ultraPrompt,
          ultraVideoCount,
        );
      }
      // Only use the currently selected image to avoid triggering the multi-image 720p fallback
      const imagesToUse = [sourceImage];

      const videoRequests = promptsToUse.map(async (promptVar, index) => {
        let finalPrompt = promptVar;
        if (ultraVideoStyle) {
          const styleOption = VIDEO_STYLE_OPTIONS.find(
            (o) => o.id === ultraVideoStyle,
          );
          if (styleOption)
            finalPrompt += `. Camera Movement: ${styleOption.prompt}`;
        }
        const ar = ultraConfig === "9:16" ? "9:16" : "16:9";
        return generateVeoVideo(imagesToUse, finalPrompt, ar, veoModel, ultraVideoDuration);
      });

      const videos = await Promise.all(videoRequests);
      deductCredits(totalCost);
      setUltraVideoUrl(videos[0]);
      setUltraVideoGallery(videos);
      setStatus(ProcessingStatus.SUCCESS);
    } catch (error: any) {
      handleGeminiError(error);
    }
  };

  const isBusy =
    status !== ProcessingStatus.IDLE &&
    status !== ProcessingStatus.SUCCESS &&
    status !== ProcessingStatus.ERROR;

  const handleStyleSelect = async (option: ControlOption) => {
    if (!resultImage || isBusy || !checkCredits(COST_VARIATION)) return;
    setSelectedControl(option.id);
    setStatus(ProcessingStatus.REFINING);
    try {
      const refined = await refineImage(resultImage, option.prompt);
      deductCredits(COST_VARIATION);
      setFinalResultImage(refined);
      setStatus(ProcessingStatus.SUCCESS);
    } catch (error: any) {
      handleGeminiError(error);
    }
  };

  const handleCustomStyleSubmit = async () => {
    if (
      !resultImage ||
      isBusy ||
      !checkCredits(COST_VARIATION) ||
      !customStylePrompt.trim()
    )
      return;
    setSelectedControl("custom");
    setStatus(ProcessingStatus.REFINING);
    try {
      const refined = await refineImage(resultImage, customStylePrompt);
      deductCredits(COST_VARIATION);
      setFinalResultImage(refined);
      setStatus(ProcessingStatus.SUCCESS);
    } catch (error: any) {
      handleGeminiError(error);
    }
  };

  const handlePoseSelect = async (option: ControlOption) => {
    if (!resultImage || isBusy || !checkCredits(COST_VARIATION)) return;
    setSelectedPose(option.id);
    setStatus(ProcessingStatus.GENERATING_POSE);
    try {
      const generatedPose = await generatePoseVariation(
        resultImage,
        option.prompt,
      );
      deductCredits(COST_VARIATION);
      setPoseResultImage(generatedPose);
      setStatus(ProcessingStatus.SUCCESS);
    } catch (error: any) {
      handleGeminiError(error);
    }
  };

  const handleHairSelect = async (option: ControlOption) => {
    if (!resultImage || isBusy || !checkCredits(COST_VARIATION)) return;
    setSelectedHair(option.id);
    setStatus(ProcessingStatus.GENERATING_HAIR);
    try {
      const generatedHair = await generateHairVariation(
        resultImage,
        option.prompt,
      );
      deductCredits(COST_VARIATION);
      setHairResultImage(generatedHair);
      setStatus(ProcessingStatus.SUCCESS);
    } catch (error: any) {
      handleGeminiError(error);
    }
  };

  const handleSingerVariationSelect = async (option: ControlOption) => {
    if (!flyerFinalResult || isBusy || !checkCredits(COST_VARIATION)) return;
    setSelectedSingerVar(option.id);
    setStatus(ProcessingStatus.GENERATING_SINGER_VAR);
    try {
      const generatedVar = await generateSingerVariation(
        flyerFinalResult,
        option.prompt,
      );
      deductCredits(COST_VARIATION);
      setSingerVariationResultImage(generatedVar);
      setStatus(ProcessingStatus.SUCCESS);
    } catch (error: any) {
      handleGeminiError(error);
    }
  };

  const handleFormatSelect = (option: ControlOption) => {
    setBeautyAspectRatio(option.id);
  };

  const generateCoupon = (value: number) => {
    const code =
      "VIZUALZ-" + Math.random().toString(36).substring(2, 10).toUpperCase();
    const newCoupon: Coupon = {
      code,
      value,
      isRedeemed: false,
      createdAt: Date.now(),
    };
    setCoupons((prev) => [newCoupon, ...prev]);
    setRedeemCode(code);
    alert(
      `Cupom gerado: ${code}\nO código foi preenchido automaticamente, basta clicar em Resgatar!`,
    );
  };

  const redeemCoupon = () => {
    const normalizedCode = redeemCode.trim().toUpperCase();
    const couponIndex = coupons.findIndex((c) => c.code === normalizedCode);
    if (couponIndex === -1) {
      setErrorMessage("Código inválido.");
      return;
    }
    if (coupons[couponIndex].isRedeemed) {
      setErrorMessage("Código já usado.");
      return;
    }
    const updatedCoupons = [...coupons];
    updatedCoupons[couponIndex].isRedeemed = true;
    setCoupons(updatedCoupons);
    setCredits((prev) => prev + coupons[couponIndex].value);
    setRedeemCode("");
    setErrorMessage(null);
  };

  const handleSaveFlow = () => {
    const flowData: SavedFlowState = {
      version: 8,
      timestamp: Date.now(),
      credits,
      positions,
      images: {
        person: personImage,
        clothing: clothingImage,
        result: resultImage,
        finalResult: finalResultImage,
        poseResult: poseResultImage,
        hairResult: hairResultImage,
      },
      singerFlow: {
        positions: singerPositions,
        text: eventDetails,
        textConfig: {
          fontSize: eventFontSize,
          fontColor: eventFontColor,
          fontFamily: eventFontFamily,
        },
        images: {
          flyerRef: flyerRefImage,
          singer: singerImage,
          baseResult: flyerBaseResult,
          finalResult: flyerFinalResult,
          variationResult: singerVariationResultImage,
        },
      },
      beautyFlow: {
        positions: beautyPositions,
        aspectRatio: beautyAspectRatio,
        priceValue: beautyPrice,
        images: {
          product: beautyProductImage,
          palette: beautyPaletteImage,
          result: beautyResultImage,
        },
      },
      ultraFlow: {
        positions: ultraPositions,
        textPrompt: ultraPrompt,
        videoStyleId: ultraVideoStyle || undefined,
        images: {
          ref: ultraRefImage,
          resultImg: ultraResultImage,
          resultVideo: ultraVideoUrl,
        },
      },
      ui: { showExtendedFlow },
    };
    const blob = new Blob([JSON.stringify(flowData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vizualz-project-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadFlow = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(
          event.target?.result as string,
        ) as SavedFlowState;
        if (json.positions)
          setPositions({ ...DEFAULT_POSITIONS, ...json.positions });
        if (json.credits) setCredits(json.credits);
        setStatus(ProcessingStatus.IDLE);
      } catch (err) {
        setErrorMessage("Falha ao carregar projeto.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const renderNodes = () => {
    if (activeTab === "canvas") {
      return <NodeCanvas />;
    } else if (activeTab === "flow") {
      return (
        <div className="relative w-[2200px] h-[1400px]">
          <ConnectionLines
            status={status}
            hasResult={!!resultImage}
            hasFinalResult={!!finalResultImage}
            hasPoseResult={!!poseResultImage}
            hasHairResult={!!hairResultImage}
            showEditor={showExtendedFlow}
            positionsRef={positionsRef}
            activeTab="flow"
          />
          <NodeCard
            id="node-person"
            title="Pessoa (Base)"
            type="input"
            imageState={personImage}
            onImageUpload={(e) => handleImageUpload(e, setPersonImage)}
            style={{ left: positions.person.x, top: positions.person.y }}
            onDragStart={(e) =>
              handleDragStart(
                e,
                "person",
                positions.person.x,
                positions.person.y,
              )
            }
            onTouchStart={(e) =>
              handleTouchStart(
                e,
                "person",
                positions.person.x,
                positions.person.y,
              )
            }
            isMobile={isMobile}
          />
          <NodeCard
            id="node-clothing"
            title="Nova Peça"
            type="input"
            imageState={clothingImage}
            onImageUpload={(e) => handleImageUpload(e, setClothingImage)}
            style={{ left: positions.clothing.x, top: positions.clothing.y }}
            onDragStart={(e) =>
              handleDragStart(
                e,
                "clothing",
                positions.clothing.x,
                positions.clothing.y,
              )
            }
            onTouchStart={(e) =>
              handleTouchStart(
                e,
                "clothing",
                positions.clothing.x,
                positions.clothing.y,
              )
            }
            isMobile={isMobile}
          />
          <NodeCard
            id="node-bgPrompt"
            title="Prompt de Fundo"
            type="text-input"
            textValue={initialBgPrompt}
            onTextChange={(e) => setInitialBgPrompt(e.target.value)}
            onEnhance={handleEnhanceBgPrompt}
            isEnhancing={
              status === ProcessingStatus.GENERATING_PROMPT_ENHANCEMENT
            }
            style={{ left: positions.bgPrompt.x, top: positions.bgPrompt.y }}
            onDragStart={(e) =>
              handleDragStart(
                e,
                "bgPrompt",
                positions.bgPrompt.x,
                positions.bgPrompt.y,
              )
            }
            onTouchStart={(e) =>
              handleTouchStart(
                e,
                "bgPrompt",
                positions.bgPrompt.x,
                positions.bgPrompt.y,
              )
            }
            isMobile={isMobile}
          />
          <NodeCard
            id="node-bgRefImage"
            title="Lugar de Referência"
            type="input"
            imageState={bgRefImage}
            onImageUpload={(e) => handleImageUpload(e, setBgRefImage)}
            style={{
              left: positions.bgRefImage.x,
              top: positions.bgRefImage.y,
            }}
            onDragStart={(e) =>
              handleDragStart(
                e,
                "bgRefImage",
                positions.bgRefImage.x,
                positions.bgRefImage.y,
              )
            }
            onTouchStart={(e) =>
              handleTouchStart(
                e,
                "bgRefImage",
                positions.bgRefImage.x,
                positions.bgRefImage.y,
              )
            }
            isMobile={isMobile}
          />
          <NodeCard
            id="node-format"
            title="Formato"
            type="control"
            options={FORMAT_OPTIONS}
            onOptionSelect={(opt) => setMainAspectRatio(opt.prompt)}
            selectedOptionId={
              FORMAT_OPTIONS.find((o) => o.prompt === mainAspectRatio)?.id || ""
            }
            style={{ left: positions.format.x, top: positions.format.y }}
            onDragStart={(e) =>
              handleDragStart(
                e,
                "format",
                positions.format.x,
                positions.format.y,
              )
            }
            onTouchStart={(e) =>
              handleTouchStart(
                e,
                "format",
                positions.format.x,
                positions.format.y,
              )
            }
            isMobile={isMobile}
          />
          <NodeCard
            id="node-process"
            title="Executar Swap"
            type="process"
            isActive={status === ProcessingStatus.PROCESSING}
            onClick={processSwap}
            disabled={!personImage.base64 || !clothingImage.base64 || isBusy}
            style={{ left: positions.process.x, top: positions.process.y }}
            onDragStart={(e) =>
              handleDragStart(
                e,
                "process",
                positions.process.x,
                positions.process.y,
              )
            }
            onTouchStart={(e) =>
              handleTouchStart(
                e,
                "process",
                positions.process.x,
                positions.process.y,
              )
            }
            isMobile={isMobile}
          />
          <NodeCard
            id="node-output"
            title="Visualização"
            type="output"
            resultImage={resultImage}
            style={{ left: positions.output.x, top: positions.output.y }}
            onDragStart={(e) =>
              handleDragStart(
                e,
                "output",
                positions.output.x,
                positions.output.y,
              )
            }
            onTouchStart={(e) =>
              handleTouchStart(
                e,
                "output",
                positions.output.x,
                positions.output.y,
              )
            }
            isMobile={isMobile}
            onPreview={
              resultImage ? () => setPreviewImage(resultImage) : undefined
            }
          />
          {showExtendedFlow && (
            <>
              <NodeCard
                id="node-editor"
                title="Ambiente & Luz"
                type="control"
                options={STYLE_OPTIONS}
                onOptionSelect={handleStyleSelect}
                selectedOptionId={selectedControl}
                style={{ left: positions.editor.x, top: positions.editor.y }}
                onDragStart={(e) =>
                  handleDragStart(
                    e,
                    "editor",
                    positions.editor.x,
                    positions.editor.y,
                  )
                }
                onTouchStart={(e) =>
                  handleTouchStart(
                    e,
                    "editor",
                    positions.editor.x,
                    positions.editor.y,
                  )
                }
                isMobile={isMobile}
                customInput={{
                  value: customStylePrompt,
                  onChange: setCustomStylePrompt,
                  onSubmit: handleCustomStyleSubmit,
                  placeholder: "Ex: Fundo de floresta mágica...",
                }}
              />
              <NodeCard
                id="node-final"
                title="Final"
                type="output"
                resultImage={finalResultImage}
                style={{ left: positions.final.x, top: positions.final.y }}
                onDragStart={(e) =>
                  handleDragStart(
                    e,
                    "final",
                    positions.final.x,
                    positions.final.y,
                  )
                }
                onTouchStart={(e) =>
                  handleTouchStart(
                    e,
                    "final",
                    positions.final.x,
                    positions.final.y,
                  )
                }
                isMobile={isMobile}
                onPreview={
                  finalResultImage
                    ? () => setPreviewImage(finalResultImage)
                    : undefined
                }
              />
              <NodeCard
                id="node-poseControl"
                title="Variação de Pose"
                type="control"
                options={POSE_OPTIONS}
                onOptionSelect={handlePoseSelect}
                selectedOptionId={selectedPose}
                style={{
                  left: positions.poseControl.x,
                  top: positions.poseControl.y,
                }}
                onDragStart={(e) =>
                  handleDragStart(
                    e,
                    "poseControl",
                    positions.poseControl.x,
                    positions.poseControl.y,
                  )
                }
                onTouchStart={(e) =>
                  handleTouchStart(
                    e,
                    "poseControl",
                    positions.poseControl.x,
                    positions.poseControl.y,
                  )
                }
                isMobile={isMobile}
              />
              <NodeCard
                id="node-poseOutput"
                title="Resultado Pose"
                type="output"
                resultImage={poseResultImage}
                style={{
                  left: positions.poseOutput.x,
                  top: positions.poseOutput.y,
                }}
                onDragStart={(e) =>
                  handleDragStart(
                    e,
                    "poseOutput",
                    positions.poseOutput.x,
                    positions.poseOutput.y,
                  )
                }
                onTouchStart={(e) =>
                  handleTouchStart(
                    e,
                    "poseOutput",
                    positions.poseOutput.x,
                    positions.poseOutput.y,
                  )
                }
                isMobile={isMobile}
                onPreview={
                  poseResultImage
                    ? () => setPreviewImage(poseResultImage)
                    : undefined
                }
              />
              <NodeCard
                id="node-hairControl"
                title="Cabelo & Estilo"
                type="control"
                options={HAIR_OPTIONS}
                onOptionSelect={handleHairSelect}
                selectedOptionId={selectedHair}
                style={{
                  left: positions.hairControl.x,
                  top: positions.hairControl.y,
                }}
                onDragStart={(e) =>
                  handleDragStart(
                    e,
                    "hairControl",
                    positions.hairControl.x,
                    positions.hairControl.y,
                  )
                }
                onTouchStart={(e) =>
                  handleTouchStart(
                    e,
                    "hairControl",
                    positions.hairControl.x,
                    positions.hairControl.y,
                  )
                }
                isMobile={isMobile}
              />
              <NodeCard
                id="node-hairOutput"
                title="Resultado Cabelo"
                type="output"
                resultImage={hairResultImage}
                style={{
                  left: positions.hairOutput.x,
                  top: positions.hairOutput.y,
                }}
                onDragStart={(e) =>
                  handleDragStart(
                    e,
                    "hairOutput",
                    positions.hairOutput.x,
                    positions.hairOutput.y,
                  )
                }
                onTouchStart={(e) =>
                  handleTouchStart(
                    e,
                    "hairOutput",
                    positions.hairOutput.x,
                    positions.hairOutput.y,
                  )
                }
                isMobile={isMobile}
                onPreview={
                  hairResultImage
                    ? () => setPreviewImage(hairResultImage)
                    : undefined
                }
              />
            </>
          )}
        </div>
      );
    } else if (activeTab === "singer") {
      return (
        <div className="relative w-[2200px] h-[1400px]">
          <ConnectionLines
            status={status}
            hasResult={!!flyerBaseResult}
            hasFinalResult={!!flyerFinalResult}
            hasPoseResult={false}
            hasHairResult={false}
            showEditor={!!flyerBaseResult}
            positionsRef={singerPositionsRef}
            activeTab="singer"
          />
          <NodeCard
            id="node-flyerRef"
            title="Flyer (Base)"
            type="input"
            imageState={flyerRefImage}
            onImageUpload={(e) => handleImageUpload(e, setFlyerRefImage)}
            style={{
              left: singerPositions.flyerRef.x,
              top: singerPositions.flyerRef.y,
            }}
            onDragStart={(e) =>
              handleDragStart(
                e,
                "flyerRef",
                singerPositions.flyerRef.x,
                singerPositions.flyerRef.y,
              )
            }
            onTouchStart={(e) =>
              handleTouchStart(
                e,
                "flyerRef",
                singerPositions.flyerRef.x,
                singerPositions.flyerRef.y,
              )
            }
            isMobile={isMobile}
          />
          <NodeCard
            id="node-singerImg"
            title="Cantor(a)"
            type="input"
            imageState={singerImage}
            onImageUpload={(e) => handleImageUpload(e, setSingerImage)}
            style={{
              left: singerPositions.singerImg.x,
              top: singerPositions.singerImg.y,
            }}
            onDragStart={(e) =>
              handleDragStart(
                e,
                "singerImg",
                singerPositions.singerImg.x,
                singerPositions.singerImg.y,
              )
            }
            onTouchStart={(e) =>
              handleTouchStart(
                e,
                "singerImg",
                singerPositions.singerImg.x,
                singerPositions.singerImg.y,
              )
            }
            isMobile={isMobile}
          />
          <NodeCard
            id="node-processSwap"
            title="Executar Swap"
            type="process"
            isActive={status === ProcessingStatus.GENERATING_SINGER_SWAP}
            onClick={processSingerSwap}
            disabled={!flyerRefImage.base64 || !singerImage.base64 || isBusy}
            style={{
              left: singerPositions.processSwap.x,
              top: singerPositions.processSwap.y,
            }}
            onDragStart={(e) =>
              handleDragStart(
                e,
                "processSwap",
                singerPositions.processSwap.x,
                singerPositions.processSwap.y,
              )
            }
            onTouchStart={(e) =>
              handleTouchStart(
                e,
                "processSwap",
                singerPositions.processSwap.x,
                singerPositions.processSwap.y,
              )
            }
            isMobile={isMobile}
          />
          <NodeCard
            id="node-baseResult"
            title="Resultado Base"
            type="output"
            resultImage={flyerBaseResult}
            style={{
              left: singerPositions.baseResult.x,
              top: singerPositions.baseResult.y,
            }}
            onDragStart={(e) =>
              handleDragStart(
                e,
                "baseResult",
                singerPositions.baseResult.x,
                singerPositions.baseResult.y,
              )
            }
            onTouchStart={(e) =>
              handleTouchStart(
                e,
                "baseResult",
                singerPositions.baseResult.x,
                singerPositions.baseResult.y,
              )
            }
            isMobile={isMobile}
            onPreview={
              flyerBaseResult
                ? () => setPreviewImage(flyerBaseResult)
                : undefined
            }
          />
          {flyerBaseResult && (
            <>
              <NodeCard
                id="node-eventData"
                title="Dados do Evento"
                type="text-input"
                textValue={eventDetails}
                onTextChange={(e) => setEventDetails(e.target.value)}
                style={{
                  left: singerPositions.eventData.x,
                  top: singerPositions.eventData.y,
                }}
                onDragStart={(e) =>
                  handleDragStart(
                    e,
                    "eventData",
                    singerPositions.eventData.x,
                    singerPositions.eventData.y,
                  )
                }
                onTouchStart={(e) =>
                  handleTouchStart(
                    e,
                    "eventData",
                    singerPositions.eventData.x,
                    singerPositions.eventData.y,
                  )
                }
                isMobile={isMobile}
              />
              <NodeCard
                id="node-processText"
                title="Aplicar Texto"
                type="process"
                isActive={status === ProcessingStatus.GENERATING_FLYER_TEXT}
                onClick={processFlyerText}
                disabled={!eventDetails || isBusy}
                style={{
                  left: singerPositions.processText.x,
                  top: singerPositions.processText.y,
                }}
                onDragStart={(e) =>
                  handleDragStart(
                    e,
                    "processText",
                    singerPositions.processText.x,
                    singerPositions.processText.y,
                  )
                }
                onTouchStart={(e) =>
                  handleTouchStart(
                    e,
                    "processText",
                    singerPositions.processText.x,
                    singerPositions.processText.y,
                  )
                }
                isMobile={isMobile}
              />
              <NodeCard
                id="node-finalOutput"
                title="Flyer Final"
                type="output"
                resultImage={flyerFinalResult}
                style={{
                  left: singerPositions.finalOutput.x,
                  top: singerPositions.finalOutput.y,
                }}
                onDragStart={(e) =>
                  handleDragStart(
                    e,
                    "finalOutput",
                    singerPositions.finalOutput.x,
                    singerPositions.finalOutput.y,
                  )
                }
                onTouchStart={(e) =>
                  handleTouchStart(
                    e,
                    "finalOutput",
                    singerPositions.finalOutput.x,
                    singerPositions.finalOutput.y,
                  )
                }
                isMobile={isMobile}
                onPreview={
                  flyerFinalResult
                    ? () => setPreviewImage(flyerFinalResult)
                    : undefined
                }
              />
              <NodeCard
                id="node-singerVariationControl"
                title="Variação Cantor"
                type="control"
                options={SINGER_OPTIONS}
                onOptionSelect={handleSingerVariationSelect}
                selectedOptionId={selectedSingerVariation}
                style={{
                  left: singerPositions.singerVariationControl.x,
                  top: singerPositions.singerVariationControl.y,
                }}
                onDragStart={(e) =>
                  handleDragStart(
                    e,
                    "singerVariationControl",
                    singerPositions.singerVariationControl.x,
                    singerPositions.singerVariationControl.y,
                  )
                }
                onTouchStart={(e) =>
                  handleTouchStart(
                    e,
                    "singerVariationControl",
                    singerPositions.singerVariationControl.x,
                    singerPositions.singerVariationControl.y,
                  )
                }
                isMobile={isMobile}
              />
              <NodeCard
                id="node-singerVariationOutput"
                title="Resultado Variação"
                type="output"
                resultImage={singerVariationResultImage}
                style={{
                  left: singerPositions.singerVariationOutput.x,
                  top: singerPositions.singerVariationOutput.y,
                }}
                onDragStart={(e) =>
                  handleDragStart(
                    e,
                    "singerVariationOutput",
                    singerPositions.singerVariationOutput.x,
                    singerPositions.singerVariationOutput.y,
                  )
                }
                onTouchStart={(e) =>
                  handleTouchStart(
                    e,
                    "singerVariationOutput",
                    singerPositions.singerVariationOutput.x,
                    singerPositions.singerVariationOutput.y,
                  )
                }
                isMobile={isMobile}
                onPreview={
                  singerVariationResultImage
                    ? () => setPreviewImage(singerVariationResultImage)
                    : undefined
                }
              />
            </>
          )}
        </div>
      );
    } else if (activeTab === "beauty") {
      return (
        <div className="relative w-[2200px] h-[1400px]">
          <ConnectionLines
            status={status}
            hasResult={!!beautyResultImage}
            hasFinalResult={false}
            hasPoseResult={false}
            hasHairResult={false}
            showEditor={false}
            positionsRef={beautyPositionsRef}
            activeTab="beauty"
          />
          <NodeCard
            id="node-product"
            title="Produto"
            type="input"
            imageState={beautyProductImage}
            onImageUpload={(e) => handleImageUpload(e, setBeautyProductImage)}
            style={{
              left: beautyPositions.product.x,
              top: beautyPositions.product.y,
            }}
            onDragStart={(e) =>
              handleDragStart(
                e,
                "product",
                beautyPositions.product.x,
                beautyPositions.product.y,
              )
            }
            onTouchStart={(e) =>
              handleTouchStart(
                e,
                "product",
                beautyPositions.product.x,
                beautyPositions.product.y,
              )
            }
            isMobile={isMobile}
          />
          <NodeCard
            id="node-palette"
            title="Paleta/Ref"
            type="input"
            imageState={beautyPaletteImage}
            onImageUpload={(e) => handleImageUpload(e, setBeautyPaletteImage)}
            style={{
              left: beautyPositions.palette.x,
              top: beautyPositions.palette.y,
            }}
            onDragStart={(e) =>
              handleDragStart(
                e,
                "palette",
                beautyPositions.palette.x,
                beautyPositions.palette.y,
              )
            }
            onTouchStart={(e) =>
              handleTouchStart(
                e,
                "palette",
                beautyPositions.palette.x,
                beautyPositions.palette.y,
              )
            }
            isMobile={isMobile}
          />
          <NodeCard
            id="node-format"
            title="Formato"
            type="control"
            options={FORMAT_OPTIONS}
            onOptionSelect={(opt) => setBeautyAspectRatio(opt.prompt)}
            selectedOptionId={
              FORMAT_OPTIONS.find((o) => o.prompt === beautyAspectRatio)?.id ||
              ""
            }
            style={{
              left: beautyPositions.format.x,
              top: beautyPositions.format.y,
            }}
            onDragStart={(e) =>
              handleDragStart(
                e,
                "format",
                beautyPositions.format.x,
                beautyPositions.format.y,
              )
            }
            onTouchStart={(e) =>
              handleTouchStart(
                e,
                "format",
                beautyPositions.format.x,
                beautyPositions.format.y,
              )
            }
            isMobile={isMobile}
          />
          <NodeCard
            id="node-bgPrompt"
            title="Prompt de Fundo"
            type="text-input"
            textValue={beautyBgPrompt}
            onTextChange={(e) => setBeautyBgPrompt(e.target.value)}
            onEnhance={handleEnhanceBeautyBgPrompt}
            isEnhancing={
              status === ProcessingStatus.GENERATING_PROMPT_ENHANCEMENT
            }
            style={{
              left: beautyPositions.bgPrompt.x,
              top: beautyPositions.bgPrompt.y,
            }}
            onDragStart={(e) =>
              handleDragStart(
                e,
                "bgPrompt",
                beautyPositions.bgPrompt.x,
                beautyPositions.bgPrompt.y,
              )
            }
            onTouchStart={(e) =>
              handleTouchStart(
                e,
                "bgPrompt",
                beautyPositions.bgPrompt.x,
                beautyPositions.bgPrompt.y,
              )
            }
            isMobile={isMobile}
          />
          <NodeCard
            id="node-process"
            title="Gerar Fundo"
            type="process"
            isActive={status === ProcessingStatus.GENERATING_BEAUTY_BG}
            onClick={processBeautyBackground}
            disabled={
              !beautyProductImage.base64 || !beautyPaletteImage.base64 || isBusy
            }
            style={{
              left: beautyPositions.process.x,
              top: beautyPositions.process.y,
            }}
            onDragStart={(e) =>
              handleDragStart(
                e,
                "process",
                beautyPositions.process.x,
                beautyPositions.process.y,
              )
            }
            onTouchStart={(e) =>
              handleTouchStart(
                e,
                "process",
                beautyPositions.process.x,
                beautyPositions.process.y,
              )
            }
            isMobile={isMobile}
          />
          <NodeCard
            id="node-output"
            title="Resultado"
            type="output"
            resultImage={beautyResultImage}
            style={{
              left: beautyPositions.output.x,
              top: beautyPositions.output.y,
            }}
            onDragStart={(e) =>
              handleDragStart(
                e,
                "output",
                beautyPositions.output.x,
                beautyPositions.output.y,
              )
            }
            onTouchStart={(e) =>
              handleTouchStart(
                e,
                "output",
                beautyPositions.output.x,
                beautyPositions.output.y,
              )
            }
            isMobile={isMobile}
            onPreview={
              beautyResultImage
                ? () => setPreviewImage(beautyResultImage)
                : undefined
            }
          />
          {beautyResultImage && (
            <>
              <NodeCard
                id="node-price"
                title="Preço"
                type="text-input"
                textValue={beautyPrice}
                onTextChange={(e) => setBeautyPrice(e.target.value)}
                style={{
                  left: beautyPositions.price.x,
                  top: beautyPositions.price.y,
                }}
                onDragStart={(e) =>
                  handleDragStart(
                    e,
                    "price",
                    beautyPositions.price.x,
                    beautyPositions.price.y,
                  )
                }
                onTouchStart={(e) =>
                  handleTouchStart(
                    e,
                    "price",
                    beautyPositions.price.x,
                    beautyPositions.price.y,
                  )
                }
                isMobile={isMobile}
              />
            </>
          )}
        </div>
      );
    } else if (activeTab === "ultra") {
      return (
        <div className="relative w-[2500px] h-[1600px]">
          <ConnectionLines
            status={status}
            hasResult={false}
            hasFinalResult={false}
            hasPoseResult={false}
            hasHairResult={false}
            showEditor={false}
            positionsRef={positionsRef}
            ultraPositionsRef={ultraPositionsRef}
            activeTab="ultra"
            hasUltraImageResult={!!ultraResultImage}
            hasUltraVideoResult={!!ultraVideoUrl}
            hasUltraRefImage={!!ultraRefImage.base64}
          />
          <NodeCard
            id="node-refImage"
            title="Input Visual"
            type="input"
            imageState={ultraRefImage}
            onImageUpload={(e) => handleImageUpload(e, setUltraRefImage)}
            style={{
              left: ultraPositions.refImage.x,
              top: ultraPositions.refImage.y,
            }}
            onDragStart={(e) =>
              handleDragStart(
                e,
                "refImage",
                ultraPositions.refImage.x,
                ultraPositions.refImage.y,
              )
            }
            onTouchStart={(e) =>
              handleTouchStart(
                e,
                "refImage",
                ultraPositions.refImage.x,
                ultraPositions.refImage.y,
              )
            }
            isMobile={isMobile}
          />
          <NodeCard
            id="node-prompt"
            title="Prompt Direcional"
            type="text-input"
            textValue={ultraPrompt}
            onTextChange={(e) => setUltraPrompt(e.target.value)}
            onEnhance={handleEnhancePrompt}
            isEnhancing={
              status === ProcessingStatus.GENERATING_PROMPT_ENHANCEMENT
            }
            style={{
              left: ultraPositions.prompt.x,
              top: ultraPositions.prompt.y,
            }}
            onDragStart={(e) =>
              handleDragStart(
                e,
                "prompt",
                ultraPositions.prompt.x,
                ultraPositions.prompt.y,
              )
            }
            onTouchStart={(e) =>
              handleTouchStart(
                e,
                "prompt",
                ultraPositions.prompt.x,
                ultraPositions.prompt.y,
              )
            }
            isMobile={isMobile}
          />
          <NodeCard
            id="node-config"
            title="Configuração"
            type="control"
            options={ULTRA_CONFIG_OPTIONS}
            onOptionSelect={handleUltraConfigSelect}
            selectedOptionId={ultraConfig}
            style={{
              left: ultraPositions.config.x,
              top: ultraPositions.config.y,
            }}
            onDragStart={(e) =>
              handleDragStart(
                e,
                "config",
                ultraPositions.config.x,
                ultraPositions.config.y,
              )
            }
            onTouchStart={(e) =>
              handleTouchStart(
                e,
                "config",
                ultraPositions.config.x,
                ultraPositions.config.y,
              )
            }
            isMobile={isMobile}
          />
          <NodeCard
            id="node-imgQty"
            title="Qtd. Imagens"
            type="control"
            options={IMAGE_QTY_OPTIONS}
            onOptionSelect={handleUltraImageQtySelect}
            selectedOptionId={`qty_img_${ultraImageCount}`}
            style={{
              left: ultraPositions.imgQty.x,
              top: ultraPositions.imgQty.y,
            }}
            onDragStart={(e) =>
              handleDragStart(
                e,
                "imgQty",
                ultraPositions.imgQty.x,
                ultraPositions.imgQty.y,
              )
            }
            onTouchStart={(e) =>
              handleTouchStart(
                e,
                "imgQty",
                ultraPositions.imgQty.x,
                ultraPositions.imgQty.y,
              )
            }
            isMobile={isMobile}
          />
          <NodeCard
            id="node-processImg"
            title="Render Imagem"
            type="process"
            isActive={status === ProcessingStatus.GENERATING_ULTRA_IMG}
            onClick={processUltraImage}
            disabled={!ultraRefImage.base64 || !ultraPrompt || isBusy}
            style={{
              left: ultraPositions.processImg.x,
              top: ultraPositions.processImg.y,
            }}
            onDragStart={(e) =>
              handleDragStart(
                e,
                "processImg",
                ultraPositions.processImg.x,
                ultraPositions.processImg.y,
              )
            }
            onTouchStart={(e) =>
              handleTouchStart(
                e,
                "processImg",
                ultraPositions.processImg.x,
                ultraPositions.processImg.y,
              )
            }
            isMobile={isMobile}
          />
          <NodeCard
            id="node-outputImg"
            title="Galeria Ultra"
            type="output"
            resultImage={ultraResultImage}
            gallery={ultraImageGallery}
            onSelectFromGallery={(item) => setUltraResultImage(item)}
            style={{
              left: ultraPositions.outputImg.x,
              top: ultraPositions.outputImg.y,
            }}
            onDragStart={(e) =>
              handleDragStart(
                e,
                "outputImg",
                ultraPositions.outputImg.x,
                ultraPositions.outputImg.y,
              )
            }
            onTouchStart={(e) =>
              handleTouchStart(
                e,
                "outputImg",
                ultraPositions.outputImg.x,
                ultraPositions.outputImg.y,
              )
            }
            isMobile={isMobile}
            onPreview={
              ultraResultImage
                ? () => setPreviewImage(ultraResultImage)
                : undefined
            }
          />
          {(ultraResultImage || ultraRefImage.base64) && (
            <>
              <NodeCard
                id="node-videoStyle"
                title="Motion FX"
                type="control"
                options={VIDEO_STYLE_OPTIONS}
                onOptionSelect={handleVideoStyleSelect}
                selectedOptionId={ultraVideoStyle}
                style={{
                  left: ultraPositions.videoStyle.x,
                  top: ultraPositions.videoStyle.y,
                }}
                onDragStart={(e) =>
                  handleDragStart(
                    e,
                    "videoStyle",
                    ultraPositions.videoStyle.x,
                    ultraPositions.videoStyle.y,
                  )
                }
                onTouchStart={(e) =>
                  handleTouchStart(
                    e,
                    "videoStyle",
                    ultraPositions.videoStyle.x,
                    ultraPositions.videoStyle.y,
                  )
                }
                isMobile={isMobile}
              />
              <NodeCard
                id="node-vidQty"
                title="Qtd. Vídeos"
                type="control"
                options={VIDEO_QTY_OPTIONS}
                onOptionSelect={handleUltraVideoQtySelect}
                selectedOptionId={`qty_vid_${ultraVideoCount}`}
                style={{
                  left: ultraPositions.vidQty.x,
                  top: ultraPositions.vidQty.y,
                }}
                onDragStart={(e) =>
                  handleDragStart(
                    e,
                    "vidQty",
                    ultraPositions.vidQty.x,
                    ultraPositions.vidQty.y,
                  )
                }
                onTouchStart={(e) =>
                  handleTouchStart(
                    e,
                    "vidQty",
                    ultraPositions.vidQty.x,
                    ultraPositions.vidQty.y,
                  )
                }
                isMobile={isMobile}
              />
              <NodeCard
                id="node-veoConfig"
                title="Resolução Veo"
                type="control"
                options={VEO_QUALITY_OPTIONS}
                onOptionSelect={handleVeoConfigSelect}
                selectedOptionId={veoModel}
                style={{
                  left: ultraPositions.veoConfig.x,
                  top: ultraPositions.veoConfig.y,
                }}
                onDragStart={(e) =>
                  handleDragStart(
                    e,
                    "veoConfig",
                    ultraPositions.veoConfig.x,
                    ultraPositions.veoConfig.y,
                  )
                }
                onTouchStart={(e) =>
                  handleTouchStart(
                    e,
                    "veoConfig",
                    ultraPositions.veoConfig.x,
                    ultraPositions.veoConfig.y,
                  )
                }
                isMobile={isMobile}
              />
              <NodeCard
                id="node-vidDuration"
                title="Duração do Vídeo"
                type="control"
                options={VIDEO_DURATION_OPTIONS}
                onOptionSelect={(opt) => setUltraVideoDuration(opt.id)}
                selectedOptionId={ultraVideoDuration}
                style={{
                  left: ultraPositions.vidDuration.x,
                  top: ultraPositions.vidDuration.y,
                }}
                onDragStart={(e) =>
                  handleDragStart(
                    e,
                    "vidDuration",
                    ultraPositions.vidDuration.x,
                    ultraPositions.vidDuration.y,
                  )
                }
                onTouchStart={(e) =>
                  handleTouchStart(
                    e,
                    "vidDuration",
                    ultraPositions.vidDuration.x,
                    ultraPositions.vidDuration.y,
                  )
                }
                isMobile={isMobile}
              />
              <NodeCard
                id="node-processVideo"
                title="Veo Engine"
                type="process"
                isActive={status === ProcessingStatus.GENERATING_ULTRA_VIDEO}
                onClick={processUltraVideo}
                disabled={isBusy}
                style={{
                  left: ultraPositions.processVideo.x,
                  top: ultraPositions.processVideo.y,
                }}
                onDragStart={(e) =>
                  handleDragStart(
                    e,
                    "processVideo",
                    ultraPositions.processVideo.x,
                    ultraPositions.processVideo.y,
                  )
                }
                onTouchStart={(e) =>
                  handleTouchStart(
                    e,
                    "processVideo",
                    ultraPositions.processVideo.x,
                    ultraPositions.processVideo.y,
                  )
                }
                isMobile={isMobile}
              />
              <NodeCard
                id="node-outputVideo"
                title="Vídeo Final"
                type="output"
                resultImage={ultraVideoUrl}
                isVideoOutput={true}
                gallery={ultraVideoGallery}
                onSelectFromGallery={(item) => setUltraVideoUrl(item)}
                style={{
                  left: ultraPositions.outputVideo.x,
                  top: ultraPositions.outputVideo.y,
                }}
                onDragStart={(e) =>
                  handleDragStart(
                    e,
                    "outputVideo",
                    ultraPositions.outputVideo.x,
                    ultraPositions.outputVideo.y,
                  )
                }
                onTouchStart={(e) =>
                  handleTouchStart(
                    e,
                    "outputVideo",
                    ultraPositions.outputVideo.x,
                    ultraPositions.outputVideo.y,
                  )
                }
                isMobile={isMobile}
                onPreview={
                  ultraVideoUrl
                    ? () => setPreviewImage(ultraVideoUrl)
                    : undefined
                }
              />
            </>
          )}
        </div>
      );
    }
    return (
      <div className="p-20 text-slate-500 font-medium">
        Modo em desenvolvimento...
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-screen bg-[#020617] overflow-hidden relative selection:bg-indigo-500/30 text-white"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {renderNodes()}

      {!hasApiKey && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xl p-4">
          <div className="bg-slate-900/40 border border-white/10 p-10 rounded-[2.5rem] max-w-md w-full shadow-2xl text-center backdrop-blur-3xl ring-1 ring-white/5">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-[0_0_50px_rgba(99,102,241,0.3)]">
              <Key className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-display font-bold mb-3 tracking-tight">
              Bem-vindo ao Vizualz
            </h2>
            <p className="text-slate-400 mb-6 text-sm leading-relaxed font-medium px-4">
              Insira sua chave de API do Google Gemini para começar a criar
              visuais incríveis.
            </p>
            <input
              type="password"
              placeholder="Sua API Key (AIzaSy...)"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all mb-6 text-center"
            />
            <button
              onClick={handleConnectApiKey}
              className="group relative w-full overflow-hidden py-4 px-6 bg-white text-black font-bold rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                Salvar Chave
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Modern High-End Header */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 h-16 bg-white/5 backdrop-blur-2xl border border-white/10 flex items-center px-4 rounded-3xl z-[60] shadow-2xl ring-1 ring-white/5">
        <div className="flex items-center gap-3 px-4 border-r border-white/10">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg">
            <Wand2 className="text-white w-5 h-5" />
          </div>
          <h1 className="font-display font-bold text-xl tracking-tight hidden md:block">
            Vizualz
          </h1>
        </div>

        <div className="flex items-center p-1.5 gap-1 overflow-x-auto max-w-[50vw] md:max-w-none custom-scrollbar">
          {[
            { id: "canvas", label: "Canvas", icon: <Wand2 size={14} /> },
            { id: "flow", label: "Roupas", icon: <Plus size={14} /> },
            { id: "singer", label: "Cantor", icon: <Music size={14} /> },
            { id: "beauty", label: "Beleza", icon: <Sparkles size={14} /> },
            { id: "ultra", label: "Ultra (Veo)", icon: <Video size={14} /> },
            {
              id: "credits",
              label: `${credits} CR`,
              icon: <Wallet size={14} />,
              special: true,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[13px] font-semibold transition-all duration-300 ${activeTab === tab.id ? (tab.special ? "bg-indigo-500 text-white shadow-lg" : "bg-white/10 text-white") : "text-slate-400 hover:text-white hover:bg-white/5"}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 px-4 border-l border-white/10">
          <button
            onClick={handleSaveFlow}
            className="p-2.5 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all"
          >
            <Save size={18} />
          </button>
          <label className="p-2.5 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer">
            <Upload size={18} />
            <input type="file" onChange={handleLoadFlow} className="hidden" />
          </label>
        </div>
      </div>

      {activeTab === "credits" && (
        <div className="absolute inset-0 z-[80] bg-[#020617]/90 backdrop-blur-2xl flex items-center justify-center p-4">
          <div className="bg-slate-900/50 border border-white/10 rounded-[3rem] max-w-2xl w-full max-h-[85vh] overflow-y-auto custom-scrollbar shadow-2xl ring-1 ring-white/5">
            <div className="p-8 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-2xl font-display font-bold text-white flex items-center gap-3">
                <Wallet className="text-indigo-400" /> Créditos
              </h2>
              <button
                onClick={() => setActiveTab("flow")}
                className="p-2 hover:bg-white/10 rounded-xl transition-all"
              >
                <X />
              </button>
            </div>
            <div className="p-8 space-y-10">
              <div className="bg-white/5 p-10 rounded-[2rem] border border-white/5 flex flex-col items-center text-center shadow-inner">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">
                  Saldo Disponível
                </span>
                <span className="text-7xl font-display font-bold bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">
                  {credits}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div
                  className="bg-white/5 p-6 rounded-[2rem] border border-white/5 hover:border-indigo-500/50 transition-all cursor-pointer group"
                  onClick={() => generateCoupon(100)}
                >
                  <h3 className="text-lg font-bold mb-1">Carga Pro</h3>
                  <p className="text-slate-400 text-xs mb-6">
                    Uso intensivo para estúdios.
                  </p>
                  <div className="flex justify-between items-end">
                    <span className="text-3xl font-display font-bold">
                      100 <span className="text-sm text-slate-500">CR</span>
                    </span>
                    <span className="text-indigo-400 text-sm font-bold opacity-0 group-hover:opacity-100 transition-all">
                      Gerar +
                    </span>
                  </div>
                </div>
                <div
                  className="bg-white/5 p-6 rounded-[2rem] border border-white/5 hover:border-purple-500/50 transition-all cursor-pointer group"
                  onClick={() => generateCoupon(25)}
                >
                  <h3 className="text-lg font-bold mb-1">Carga Base</h3>
                  <p className="text-slate-400 text-xs mb-6">
                    Testes e criações rápidas.
                  </p>
                  <div className="flex justify-between items-end">
                    <span className="text-3xl font-display font-bold">
                      25 <span className="text-sm text-slate-500">CR</span>
                    </span>
                    <span className="text-purple-400 text-sm font-bold opacity-0 group-hover:opacity-100 transition-all">
                      Gerar +
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={redeemCode}
                    onChange={(e) => setRedeemCode(e.target.value)}
                    placeholder="Código de resgate..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all uppercase"
                  />
                  <button
                    onClick={redeemCoupon}
                    className="bg-white text-black px-8 py-4 rounded-2xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Resgatar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-rose-500/90 backdrop-blur-xl text-white px-8 py-4 rounded-[2rem] shadow-2xl z-[150] flex items-center gap-3 animate-bounce">
          <span className="text-sm font-bold">{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="p-1 hover:bg-black/20 rounded-lg"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {previewImage && (
        <div
          className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-5xl w-full max-h-[90vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-12 right-0 text-white/50 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-full"
            >
              <X size={24} />
            </button>
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
            />
            <a
              href={previewImage}
              download="imagem_gerada.png"
              className="absolute -bottom-16 left-1/2 -translate-x-1/2 bg-white text-black px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform"
            >
              <Download size={18} /> Baixar Imagem
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
