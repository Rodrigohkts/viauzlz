
// ─── Supabase Edge Function proxy for Vertex AI ───────────────────────────
// Set VITE_SUPABASE_URL in your .env / Vercel env vars
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const PROXY_URL    = `${SUPABASE_URL}/functions/v1/vertex-proxy`;

const VERTEX_PROJECT_ID = 'midyear-spot-454018-j6';

// Models
const IMAGEN_MODEL       = 'imagen-3.0-generate-002';
const GEMINI_IMAGE_MODEL = 'gemini-2.0-flash-preview-image-generation';
const GEMINI_TEXT_MODEL  = 'gemini-2.0-flash-001';
const VEO_MODEL_FAST     = 'veo-3.1-fast-generate-preview';
const VEO_MODEL_QUALITY  = 'veo-3.1-generate-preview';

// ─── Utilities ────────────────────────────────────────────────────────────
const cleanBase64 = (base64: string): string => {
    const marker = ';base64,';
    const idx = base64.indexOf(marker);
    return idx !== -1 ? base64.substring(idx + marker.length) : base64;
};

const getMimeType = (base64: string): string => {
    const match = base64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
    if (match?.[1]) return match[1];
    if (base64.startsWith('/9j/'))        return 'image/jpeg';
    if (base64.startsWith('iVBORw0KGgo')) return 'image/png';
    if (base64.startsWith('R0lGOD'))      return 'image/gif';
    if (base64.startsWith('UklGR'))       return 'image/webp';
    return 'image/jpeg';
};

// ─── Call proxy helper ────────────────────────────────────────────────────
const callProxy = async (body: object): Promise<any> => {
    if (!SUPABASE_URL) throw new Error('VITE_SUPABASE_URL não configurado. Adicione nas variáveis de ambiente.');

    const res = await fetch(PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
        const msg = data.error || `Proxy error: ${res.status}`;
        if (res.status === 429 || msg.includes('429')) throw new Error('Cota da API excedida (429). Tente novamente em alguns minutos.');
        throw new Error(msg);
    }

    return data;
};

// ─── Imagen 3: Text-to-image ──────────────────────────────────────────────
const imagenGenerate = async (prompt: string, aspectRatio: string = '1:1'): Promise<string> => {
    const data = await callProxy({
        type: 'imagen',
        model: IMAGEN_MODEL,
        instances: [{ prompt }],
        parameters: {
            sampleCount: 1,
            aspectRatio,
            safetyFilterLevel: 'block_some',
            personGeneration: 'allow_adult',
            outputOptions: { mimeType: 'image/png' },
        },
    });

    const encoded = data.predictions?.[0]?.bytesBase64Encoded;
    if (encoded) return `data:image/png;base64,${encoded}`;
    throw new Error('Imagen não retornou uma imagem válida.');
};

// ─── Gemini: Multi-modal image editing ───────────────────────────────────
type GeminiPart =
    | { text: string }
    | { inlineData: { mimeType: string; data: string } };

const geminiImageGenerate = async (parts: GeminiPart[]): Promise<string> => {
    const data = await callProxy({
        type: 'gemini',
        model: GEMINI_IMAGE_MODEL,
        contents: [{ role: 'user', parts }],
        generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
    });

    const respParts = data.candidates?.[0]?.content?.parts;
    if (respParts) {
        for (const p of respParts) {
            if (p.inlineData?.data) return `data:image/png;base64,${p.inlineData.data}`;
        }
        for (const p of respParts) {
            if (p.text) {
                console.warn('Model Refusal:', p.text);
                throw new Error('A IA recusou gerar a imagem (Safety/Policy). Tente uma imagem diferente.');
            }
        }
    }
    throw new Error('A IA não retornou uma imagem válida.');
};

// ─── Gemini: Text generation ──────────────────────────────────────────────
const geminiText = async (prompt: string, jsonMode = false): Promise<string> => {
    const data = await callProxy({
        type: 'gemini',
        model: GEMINI_TEXT_MODEL,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: jsonMode ? { responseMimeType: 'application/json' } : {},
    });
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
};


// ═══════════════════════════════════════════════════════════════════════════
// EXPORTED FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

export const generateOutfitSwap = async (
    personImageBase64: string,
    clothingImageBase64: string,
    _aspectRatio: string = '1:1'
): Promise<string> => {
    return geminiImageGenerate([
        {
            text: "Atue como um especialista sênior em retoque digital e IA de moda (Virtual Try-On). Sua tarefa é realizar uma SUBSTITUIÇÃO TOTAL de vestuário.\n\nINSTRUÇÕES RIGOROSAS:\n1. APAGUE COMPLETAMENTE a roupa que a pessoa está vestindo na primeira imagem.\n2. VISTA a pessoa com a roupa fornecida na segunda imagem. A nova roupa deve ser opaca e cobrir totalmente a área do corpo correspondente.\n3. PROIBIDO: Não faça fusão (blending) entre a roupa antiga e a nova.\n4. RECONSTRUÇÃO DE PELE: Reconstrua a pele visível com textura e tom realistas.\n5. PRESERVE: O rosto, cabelo, mãos, acessórios, pose e cenário. A iluminação deve corresponder à cena.\n\nGere apenas a imagem final realista em alta qualidade."
        },
        { inlineData: { mimeType: getMimeType(personImageBase64),   data: cleanBase64(personImageBase64) } },
        { inlineData: { mimeType: getMimeType(clothingImageBase64), data: cleanBase64(clothingImageBase64) } },
    ]);
};

export const refineImage = async (
    baseImageBase64: string,
    instruction: string
): Promise<string> => {
    return geminiImageGenerate([
        {
            text: `Atue como um editor de fotografia de moda high-end. Instrução: "${instruction}".\n\nREGRAS:\n1. IMUTÁVEL: rosto, corpo, pose e roupa DEVEM permanecer idênticos.\n2. ALTERAÇÃO: Mude apenas o que foi pedido (fundo, luz ou filtro).\n3. REALISMO: Ajuste iluminação nas bordas do sujeito para integrar com novo ambiente.`
        },
        { inlineData: { mimeType: getMimeType(baseImageBase64), data: cleanBase64(baseImageBase64) } },
    ]);
};

export const generatePoseVariation = async (
    baseImageBase64: string,
    poseDescription: string,
    _aspectRatio: string = '1:1'
): Promise<string> => {
    return geminiImageGenerate([
        {
            text: `Gere uma VARIAÇÃO DE POSE da pessoa na imagem.\n\nINSTRUÇÕES:\n1. Mantenha a mesma pessoa, rosto e características físicas.\n2. Mantenha EXATAMENTE a mesma roupa.\n3. Nova pose: "${poseDescription}".\n4. Iluminação e estilo fotográfico consistentes com o original.`
        },
        { inlineData: { mimeType: getMimeType(baseImageBase64), data: cleanBase64(baseImageBase64) } },
    ]);
};

export const generateHairVariation = async (
    baseImageBase64: string,
    hairDescription: string
): Promise<string> => {
    return geminiImageGenerate([
        {
            text: `Altere o CABELO da pessoa na imagem.\n\nINSTRUÇÕES:\n1. Mantenha rigorosamente o rosto e características faciais.\n2. Mantenha a mesma roupa e pose.\n3. Novo cabelo: "${hairDescription}". Natural, textura realista, integrado à iluminação da cena.`
        },
        { inlineData: { mimeType: getMimeType(baseImageBase64), data: cleanBase64(baseImageBase64) } },
    ]);
};

export const generateSingerSwap = async (
    flyerRefBase64: string,
    singerBase64: string
): Promise<string> => {
    return geminiImageGenerate([
        {
            text: `SUBSTITUIÇÃO TOTAL DO CANTOR NO FLYER.\n\nIMAGEM 1 = Flyer original. IMAGEM 2 = Novo cantor.\n\n1. APAGUE o cantor original completamente.\n2. LIMPE o espaço com o fundo (fumaça, luzes, palco).\n3. INSIRA o novo cantor em destaque no centro.\n4. ESCALA: igual ao anterior, grande e imponente.\n5. INTEGRAÇÃO: aplique a mesma iluminação e filtros do flyer.\n\nO cantor antigo NÃO PODE aparecer. Retorne o flyer finalizado.`
        },
        { inlineData: { mimeType: getMimeType(flyerRefBase64), data: cleanBase64(flyerRefBase64) } },
        { inlineData: { mimeType: getMimeType(singerBase64),   data: cleanBase64(singerBase64) } },
    ]);
};

export const applyFlyerText = async (
    flyerBase64: string,
    eventDetails: string,
    fontSize: string,
    fontColor: string,
    fontFamily: string
): Promise<string> => {
    const colorInstruction = fontColor
        ? `Cor: ${fontColor}. Se o fundo for muito próximo, adicione Glow/Sombra para contraste.`
        : 'Use a paleta original do flyer.';
    const familyInstruction = fontFamily === 'Original'
        ? `MODO CLONAGEM: Copie EXATAMENTE a fonte, peso e efeitos dos textos existentes no flyer.`
        : `Fonte: ${fontFamily}. Mantenha efeitos visuais (glow/sombra) do design original.`;

    return geminiImageGenerate([
        {
            text: `Designer Gráfico Sênior — diagrame a agenda de shows no flyer.\n\n1. TIPOGRAFIA: ${familyInstruction} | Tamanho: ${fontSize}. | ${colorInstruction}\n2. LAYOUT INTELIGENTE: Texto NUNCA cobre o rosto. Coloque no maior espaço negativo disponível.\n3. HIERARQUIA: DATAS em destaque (maiores), locais/horas menores.\n\nDADOS PARA INSERIR:\n${eventDetails}\n\nRetorne apenas o flyer com texto aplicado.`
        },
        { inlineData: { mimeType: getMimeType(flyerBase64), data: cleanBase64(flyerBase64) } },
    ]);
};

export const generateSingerVariation = async (
    flyerBase64: string,
    variationPrompt: string
): Promise<string> => {
    return geminiImageGenerate([
        {
            text: `SUBSTITUA o cantor do flyer por: "${variationPrompt}".\n\n1. PROTEJA O TEXTO: Não toque, borre ou cubra o texto da agenda.\n2. POSICIONAMENTO: O novo cantor não pode bloquear leitura das datas/locais.\n3. Mantenha o design gráfico de fundo inalterado.\n4. Mesma iluminação dramática e qualidade fotográfica.`
        },
        { inlineData: { mimeType: getMimeType(flyerBase64), data: cleanBase64(flyerBase64) } },
    ]);
};

export const generateBeautyBackground = async (
    productBase64: string,
    paletteBase64: string,
    aspectRatio: string,
    priceValue?: string
): Promise<string> => {
    const priceInstruction = (priceValue && priceValue.trim())
        ? `ADICIONE o preço "${priceValue}" em balão 3D vermelho/rosa com texto branco grande.`
        : 'SEM PREÇO: Não adicione texto ou etiqueta de preço.';

    return geminiImageGenerate([
        {
            text: `COMPOSIÇÃO DIGITAL — preserve micro-textos do produto.\n\n1. O produto é um objeto sólido. Pixels internos (especialmente texto) INALTERADOS.\n2. FUNDO: use a paleta de cores da Imagem 2. Estilo macro HD, profundidade de campo rasa. Elementos: seda, água, vidro ou pedras polidas.\n3. ${priceInstruction}\n\nFoco 100% na nitidez do texto do produto.`
        },
        { inlineData: { mimeType: getMimeType(productBase64), data: cleanBase64(productBase64) } },
        { inlineData: { mimeType: getMimeType(paletteBase64), data: cleanBase64(paletteBase64) } },
    ]);
};

export const generateImageFromText = async (
    prompt: string,
    aspectRatio: string = '1:1'
): Promise<string> => {
    return imagenGenerate(prompt, aspectRatio);
};

export const generateUltraImage = async (
    refImageBase64: string,
    prompt: string,
    _aspectRatio: string = '1:1'
): Promise<string> => {
    return geminiImageGenerate([
        {
            text: `TRANSFORME a imagem de referência seguindo: "${prompt}".\n\n1. Use a imagem como base estrutural.\n2. Aplique o estilo e modificações solicitadas com alta qualidade artística.\n3. Gere em 2K, fotorrealista e detalhado.`
        },
        { inlineData: { mimeType: getMimeType(refImageBase64), data: cleanBase64(refImageBase64) } },
    ]);
};

// ─── Text helpers ─────────────────────────────────────────────────────────

export const enhancePrompt = async (currentPrompt: string): Promise<string> => {
    try {
        return await geminiText(
            `Você é um especialista em Prompt Engineering para vídeo com IA (Veo).\n\nReescreva em INGLÊS para criar um vídeo deslumbrante. Defina obrigatoriamente LIGHTING, STYLE e MOVEMENT de câmera/sujeito.\n\nDescrição Original: "${currentPrompt}"\n\nRetorne APENAS o prompt melhorado em inglês, sem introduções.`
        ) || currentPrompt;
    } catch {
        return currentPrompt;
    }
};

export const generatePromptVariations = async (basePrompt: string, count: number): Promise<string[]> => {
    try {
        const text = await geminiText(
            `Generate ${count} distinct variations of this AI video prompt. Same subject, different angle/lighting/mood.\n\nBase Prompt: "${basePrompt}"\n\nReturn ONLY a JSON array of strings.`,
            true
        );
        const parsed = JSON.parse(text);
        return Array.isArray(parsed) ? parsed.slice(0, count) : Array(count).fill(basePrompt);
    } catch {
        return Array(count).fill(basePrompt);
    }
};

// ─── Video Generation (Veo) ───────────────────────────────────────────────
// Veo uses @google/genai SDK with Vertex AI mode (handles OAuth internally via project config)
export const generateVeoVideo = async (
    inputImages: string[],
    prompt: string,
    aspectRatio: string = '16:9',
    modelType: 'fast' | 'quality' = 'fast'
): Promise<string> => {
    // Veo via Supabase proxy (Vertex AI OAuth handled server-side)
    throw new Error('Geração de vídeo via Supabase em breve. Use a versão anterior por enquanto.');
};
