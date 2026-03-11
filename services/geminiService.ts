
import { GoogleGenAI, Type } from "@google/genai";

// ─── Vertex AI Configuration ───────────────────────────────────────────────
const VERTEX_PROJECT_ID = 'midyear-spot-454018-j6';
const VERTEX_LOCATION = 'us-central1';
const VERTEX_API_KEY = 'AQ.Ab8RN6KACU2iB5jWOg3ZGPcdXou6hmJuO62zZ6QsU-3Vds6JUQ';

// Models
const IMAGEN_MODEL = 'imagen-3.0-generate-002';         // Text-to-image only
const GEMINI_IMAGE_MODEL = 'gemini-2.0-flash-preview-image-generation'; // Multi-modal editing
const GEMINI_TEXT_MODEL = 'gemini-2.0-flash-001';            // Text generation
const VEO_MODEL_FAST = 'veo-3.1-fast-generate-preview';
const VEO_MODEL_QUALITY = 'veo-3.1-generate-preview';

// Build Vertex AI endpoint URL
const vertexUrl = (model: string, method: string): string =>
    `https://${VERTEX_LOCATION}-aiplatform.googleapis.com/v1/projects/${VERTEX_PROJECT_ID}/locations/${VERTEX_LOCATION}/publishers/google/models/${model}:${method}?key=${VERTEX_API_KEY}`;

// ─── Utilities ────────────────────────────────────────────────────────────
const cleanBase64 = (base64: string): string => {
    const marker = ';base64,';
    const idx = base64.indexOf(marker);
    return idx !== -1 ? base64.substring(idx + marker.length) : base64;
};

const getMimeType = (base64: string): string => {
    const match = base64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
    if (match?.[1]) return match[1];
    if (base64.startsWith('/9j/')) return 'image/jpeg';
    if (base64.startsWith('iVBORw0KGgo')) return 'image/png';
    if (base64.startsWith('R0lGOD')) return 'image/gif';
    if (base64.startsWith('UklGR')) return 'image/webp';
    return 'image/jpeg';
};

// ─── Vertex AI: Image generation via Imagen 3 (text-to-image) ─────────────
const imagenGenerate = async (prompt: string, aspectRatio: string = '1:1'): Promise<string> => {
    const res = await fetch(vertexUrl(IMAGEN_MODEL, 'predict'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            instances: [{ prompt }],
            parameters: {
                sampleCount: 1,
                aspectRatio,
                safetyFilterLevel: 'block_some',
                personGeneration: 'allow_adult',
                outputOptions: { mimeType: 'image/png' }
            }
        })
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || `Vertex AI Imagen Error: ${res.status}`);
    }
    const data = await res.json();
    const encoded = data.predictions?.[0]?.bytesBase64Encoded;
    if (encoded) return `data:image/png;base64,${encoded}`;
    throw new Error('Imagen não retornou uma imagem válida.');
};

// ─── Vertex AI: Multi-modal image editing via Gemini ──────────────────────
type GeminiPart =
    | { text: string }
    | { inlineData: { mimeType: string; data: string } };

const geminiImageGenerate = async (parts: GeminiPart[]): Promise<string> => {
    const res = await fetch(vertexUrl(GEMINI_IMAGE_MODEL, 'generateContent'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ role: 'user', parts }],
            generationConfig: {
                responseModalities: ['IMAGE', 'TEXT']
            }
        })
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = err?.error?.message || `Vertex AI Gemini Error: ${res.status}`;
        if (res.status === 429 || msg.includes('429')) throw new Error('Cota da API excedida (429). Tente novamente em alguns minutos.');
        throw new Error(msg);
    }
    const data = await res.json();
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

// ─── Vertex AI: Text generation via Gemini ───────────────────────────────
const geminiText = async (prompt: string): Promise<string> => {
    const res = await fetch(vertexUrl(GEMINI_TEXT_MODEL, 'generateContent'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
        })
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || `Text Gen Error: ${res.status}`);
    }
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
};

// ─── Vertex AI: Text generation with JSON schema ──────────────────────────
const geminiTextJson = async (prompt: string): Promise<string> => {
    const res = await fetch(vertexUrl(GEMINI_TEXT_MODEL, 'generateContent'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: 'application/json'
            }
        })
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || `Text Gen Error: ${res.status}`);
    }
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
};


// ═══════════════════════════════════════════════════════════════════════════
// EXPORTED FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

export const generateOutfitSwap = async (
    personImageBase64: string,
    clothingImageBase64: string,
    aspectRatio: string = '1:1'
): Promise<string> => {
    const personMime = getMimeType(personImageBase64);
    const clothingMime = getMimeType(clothingImageBase64);

    return geminiImageGenerate([
        {
            text: "Atue como um especialista sênior em retoque digital e IA de moda (Virtual Try-On). Sua tarefa é realizar uma SUBSTITUIÇÃO TOTAL de vestuário.\n\nINSTRUÇÕES RIGOROSAS:\n1. APAGUE COMPLETAMENTE a roupa que a pessoa está vestindo na primeira imagem. Ignore a textura, cor e estampa da roupa antiga.\n2. VISTA a pessoa com a roupa fornecida na segunda imagem. A nova roupa deve ser opaca e cobrir totalmente a área do corpo correspondente.\n3. PROIBIDO: Não faça fusão (blending) entre a roupa antiga e a nova. Não deixe a roupa antiga 'vazar' ou aparecer por baixo. O resultado deve parecer que a pessoa vestiu apenas a nova peça.\n4. RECONSTRUÇÃO DE PELE: Se a nova roupa for mais curta, decotada ou sem mangas em comparação com a original, você DEVE reconstruir a pele visível (inpainting) com textura e tom de pele realistas e anatomicamente corretos.\n5. PRESERVE RIGOROSAMENTE: O rosto (identidade), cabelo, mãos, acessórios (relógios, anéis), pose exata e todo o cenário de fundo. A iluminação na nova roupa deve corresponder à iluminação da cena.\n\nGere apenas a imagem final realista em alta qualidade."
        },
        { inlineData: { mimeType: personMime, data: cleanBase64(personImageBase64) } },
        { inlineData: { mimeType: clothingMime, data: cleanBase64(clothingImageBase64) } },
    ]);
};

export const refineImage = async (
    baseImageBase64: string,
    instruction: string
): Promise<string> => {
    const mimeType = getMimeType(baseImageBase64);
    return geminiImageGenerate([
        {
            text: `Atue como um editor de fotografia de moda high-end. Siga estritamente esta instrução de edição: "${instruction}".\n\nREGRAS DE OURO:\n1. IMUTÁVEL: A pessoa, seu rosto, corpo, pose e, PRINCIPALMENTE, a roupa que ela está vestindo DEVEM PERMANECER IDÊNTICOS. Não mude a cor nem o corte da roupa.\n2. ALTERAÇÃO: Mude apenas o que foi pedido (fundo, luz ou filtro).\n3. REALISMO: Se mudar o fundo, ajuste sutilmente a iluminação nas bordas do sujeito para integrar com o novo ambiente, mas sem alterar a roupa.`
        },
        { inlineData: { mimeType, data: cleanBase64(baseImageBase64) } },
    ]);
};

export const generatePoseVariation = async (
    baseImageBase64: string,
    poseDescription: string,
    aspectRatio: string = '1:1'
): Promise<string> => {
    const mimeType = getMimeType(baseImageBase64);
    return geminiImageGenerate([
        {
            text: `Atue como um diretor criativo de moda. Sua tarefa é gerar uma VARIAÇÃO DE POSE da pessoa na imagem.\n\nINSTRUÇÕES:\n1. IDENTIDADE: Mantenha a mesma pessoa, rosto e características físicas.\n2. ROUPA: Mantenha EXATAMENTE a mesma roupa que ela está vestindo agora.\n3. AÇÃO: Gere uma nova imagem onde esta pessoa esteja na seguinte pose: "${poseDescription}".\n4. COERÊNCIA: A iluminação e o estilo fotográfico devem permanecer consistentes com a imagem original.\n\nRetorne apenas a imagem gerada.`
        },
        { inlineData: { mimeType, data: cleanBase64(baseImageBase64) } },
    ]);
};

export const generateHairVariation = async (
    baseImageBase64: string,
    hairDescription: string
): Promise<string> => {
    const mimeType = getMimeType(baseImageBase64);
    return geminiImageGenerate([
        {
            text: `Atue como um cabeleireiro profissional e editor de imagem. Sua tarefa é alterar o CORTE DE CABELO da pessoa na imagem.\n\nINSTRUÇÕES:\n1. IDENTIDADE: Mantenha rigorosamente o rosto e as características faciais da pessoa.\n2. ROUPA: Mantenha EXATAMENTE a mesma roupa e a mesma pose.\n3. CABELO: Substitua o cabelo atual pelo seguinte estilo: "${hairDescription}". O cabelo deve parecer natural, com textura realista e integrado à iluminação da cena.\n\nRetorne apenas a imagem gerada.`
        },
        { inlineData: { mimeType, data: cleanBase64(baseImageBase64) } },
    ]);
};

export const generateSingerSwap = async (
    flyerRefBase64: string,
    singerBase64: string
): Promise<string> => {
    const flyerMime = getMimeType(flyerRefBase64);
    const singerMime = getMimeType(singerBase64);
    return geminiImageGenerate([
        {
            text: `VOCÊ É UM EXPERT EM PHOTOSHOP E COMPOSIÇÃO DE IMAGEM.
                        
OBJETIVO: SUBSTITUIÇÃO TOTAL DO CANTOR NO FLYER.

ENTRADAS:
- IMAGEM 1 (FLYER): O cartaz original.
- IMAGEM 2 (NOVO CANTOR): A pessoa que DEVE estar no cartaz.

INSTRUÇÕES RIGOROSAS (PASSO A PASSO):
1. **APAGAR**: Identifique o cantor original na Imagem 1. REMOVA-O COMPLETAMENTE. Imagine que você deletou a camada dele.
2. **LIMPAR**: Preencha o espaço onde ele estava com o fundo do flyer (fumaça, luzes, palco). Não deixe "fantasmas" do cantor antigo.
3. **INSERIR**: Recorte o Novo Cantor da Imagem 2 e coloque-o EM DESTAQUE no centro, onde estava o antigo.
4. **ESCALA**: O Novo Cantor deve ser GRANDE, ocupando o mesmo espaço visual e imponência do anterior.
5. **INTEGRAÇÃO**: Aplique a mesma iluminação, cor e filtros (glow, noise, contraste) do flyer no novo cantor para que ele pareça pertencer à imagem.

IMPORTANTE: O cantor antigo NÃO PODE aparecer. O novo cantor NÃO PODE ser translúcido.

Retorne o flyer finalizado.`
        },
        { inlineData: { mimeType: flyerMime, data: cleanBase64(flyerRefBase64) } },
        { inlineData: { mimeType: singerMime, data: cleanBase64(singerBase64) } },
    ]);
};

export const applyFlyerText = async (
    flyerBase64: string,
    eventDetails: string,
    fontSize: string,
    fontColor: string,
    fontFamily: string
): Promise<string> => {
    const flyerMime = getMimeType(flyerBase64);
    const colorInstruction = fontColor
        ? `Cor Base: ${fontColor}. IMPORTANTE: Se o fundo for da mesma cor ou muito próximo, adicione AUTOMATICAMENTE um Glow Externo ou Sombra Projetada para garantir contraste.`
        : 'Cor: Use a paleta original do flyer.';
    const familyInstruction = fontFamily === 'Original'
        ? `MODO CLONAGEM (CRÍTICO): Analise os pixels dos textos existentes no flyer (datas, locais). Copie EXATAMENTE a fonte, o peso (bold/black), o estilo (itálico/reto) e os efeitos (brilho/neon/3D). O novo texto deve ser INDISTINGUÍVEL do original.`
        : `Use a família de fonte: ${fontFamily}. Mantenha os efeitos visuais (glow/sombra) do design original.`;

    return geminiImageGenerate([
        {
            text: `Atue como um Designer Gráfico Sênior especialista em Tipografia e Layout de Eventos.
TAREFA: Diagramar a agenda de shows no flyer de forma INTELIGENTE e ESTETICAMENTE INTEGRADA.

1. ANÁLISE FORENSE DE TIPOGRAFIA:
   - ${familyInstruction}
   - Tamanho solicitado: ${fontSize}.
   - ${colorInstruction}

2. ALGORITMO DE POSICIONAMENTO INTELIGENTE (ADAPTATIVE LAYOUT):
   - **PASSO A**: Detecte a silhueta do Cantor. O texto NUNCA deve cobrir o rosto ou o peito do cantor.
   - **PASSO B**: Detecte o "Espaço Negativo" (áreas de fundo vazio, céu, fumaça ou chão).
   - **PASSO C**: Mova o bloco de texto para o maior espaço negativo disponível (Lateral Esquerda, Lateral Direita ou Rodapé).
   - **PASSO D**: Se o cantor estiver muito grande e sobrar pouco espaço, reduza levemente a fonte para caber no espaço disponível sem poluir.

3. ESTILO DE LISTA:
   - Formate os dados abaixo em uma lista vertical limpa e alinhada.
   - Use hierarquia visual: Destaque as DATAS (maiores) e mantenha os LOCAIS/HORAS (menores).

DADOS DA AGENDA PARA INSERIR:
${eventDetails}

Retorne apenas o flyer finalizado com o texto aplicado.`
        },
        { inlineData: { mimeType: flyerMime, data: cleanBase64(flyerBase64) } },
    ]);
};

export const generateSingerVariation = async (
    flyerBase64: string,
    variationPrompt: string
): Promise<string> => {
    const mimeType = getMimeType(flyerBase64);
    return geminiImageGenerate([
        {
            text: `Atue como um designer gráfico. Sua tarefa é SUBSTITUIR o cantor principal deste flyer por um NOVO personagem: "${variationPrompt}".

REGRAS DE OURO PARA PRESERVAÇÃO:
1. **PROTEJA O TEXTO**: O flyer JÁ CONTÉM a agenda de shows escrita. Você NÃO DEVE TOCAR, BORRAR OU COBRIR O TEXTO.
2. **POSICIONAMENTO INTELIGENTE**: Gere o novo cantor de forma que ele se integre ao design (atrás dos textos se necessário, ou ao lado). O novo cantor NÃO pode bloquear a leitura das datas e locais.
3. PROTEJA O FUNDO: Mantenha o design gráfico de fundo inalterado.
4. ESTILO: Mantenha a mesma iluminação dramática e qualidade fotográfica.

Retorne apenas o flyer com o novo cantor.`
        },
        { inlineData: { mimeType, data: cleanBase64(flyerBase64) } },
    ]);
};

export const generateBeautyBackground = async (
    productBase64: string,
    paletteBase64: string,
    aspectRatio: string,
    priceValue?: string
): Promise<string> => {
    const productMime = getMimeType(productBase64);
    const paletteMime = getMimeType(paletteBase64);

    let priceInstruction = '';
    if (priceValue && priceValue.trim() !== '') {
        priceInstruction = `6. **ADICIONAR PREÇO (OFERTA)**: O usuário informou o preço: "${priceValue}". 
            - Insira um balão 3D ou Sticker de oferta ao lado do produto.
            - Texto do preço: GRANDE, BRANCO e NÍTIDO.
            - Cor do balão: Vermelho ou Rosa Pink (Alto Contraste).`;
    } else {
        priceInstruction = "6. **SEM PREÇO**: Não adicione nenhum texto ou etiqueta de preço.";
    }

    return geminiImageGenerate([
        {
            text: `ATUE COMO UM SPECIALISTA EM COMPOSIÇÃO DIGITAL E PRESERVAÇÃO FORENSE DE IMAGEM.

OBJETIVO CRÍTICO: Preservar a legibilidade de MICRO-TEXTOS e DETALHES FINOS do produto enquanto altera o fundo.

INSTRUÇÕES DE SEGURANÇA MÁXIMA PARA O RÓTULO:
1. **PROTEÇÃO DE MICRO-TEXTO**: O produto contém letras pequenas que SÃO ESSENCIAIS. Você está PROIBIDO de "alucinar", "redesenhar" ou "interpretar" essas letras.
2. **COMPOSIÇÃO, NÃO GERAÇÃO**: Trate a Imagem 1 (Produto) como um objeto sólido. Recorte-o mentalmente e coloque-o sobre o novo fundo. Os pixels de dentro do produto (especialmente o texto) devem permanecer INALTERADOS.
3. **FALHA ZERO EM OCR**: Se as letras pequenas ficarem borradas ou ilegíveis, o resultado será rejeitado. Mantenha a nitidez original da foto de entrada.

ESTÉTICA DO FUNDO:
- Use a paleta de cores da Imagem 2.
- Estilo: Fotografia Macro de Alta Definição, Profundidade de Campo rasa (fundo desfocado) para destacar ainda mais a nitidez do produto.
- Elementos: Seda, Água, Vidro ou Pedras Polidas.

${priceInstruction}

Gere a imagem focando 100% na nitidez do texto do produto.`
        },
        { inlineData: { mimeType: productMime, data: cleanBase64(productBase64) } },
        { inlineData: { mimeType: paletteMime, data: cleanBase64(paletteBase64) } },
    ]);
};

export const generateImageFromText = async (
    prompt: string,
    aspectRatio: string = '1:1'
): Promise<string> => {
    // Use Imagen 3 for pure text-to-image (best quality)
    return imagenGenerate(prompt, aspectRatio);
};

// --- ULTRA CREATION FUNCTIONS ---

export const enhancePrompt = async (currentPrompt: string): Promise<string> => {
    try {
        const result = await geminiText(
            `Você é um especialista em Prompt Engineering para geração de vídeo com IA (Veo).
            
            Sua tarefa é REESCREVER a descrição abaixo para criar um vídeo visualmente deslumbrante, OBRIGATORIAMENTE definindo ILUMINAÇÃO, ESTILO e MOVIMENTO.
            
            Descrição Original: "${currentPrompt}"
            
            INSTRUÇÕES OBRIGATÓRIAS (Traduzir tudo para Inglês):
            1. LIGHTING (Iluminação): Especifique a luz (ex: 'volumetric lighting', 'golden hour', 'neon rim lights', 'dramatic noir lighting').
            2. STYLE (Estilo): Defina a estética visual (ex: 'photorealistic 8k', 'cinematic film stock', 'Unreal Engine 5 render', 'vintage 90s camcorder').
            3. MOVEMENT (Movimento - CRUCIAL): O prompt DEVE conter movimento de câmera ou do sujeito para evitar vídeos estáticos. Use termos como: 'slow pan right', 'tracking shot', 'push in', 'dynamic handheld', 'wind blowing fabric'.
            4. Resuma em um único parágrafo denso e direto em INGLÊS.
            
            Retorne APENAS o prompt melhorado em inglês, sem aspas e sem introduções.`
        );
        return result || currentPrompt;
    } catch (error) {
        console.error('Enhance Prompt Error:', error);
        return currentPrompt;
    }
};

export const generatePromptVariations = async (basePrompt: string, count: number): Promise<string[]> => {
    try {
        const text = await geminiTextJson(
            `Generate ${count} distinct but related variations of the following prompt for AI video generation. 
            Each variation should explore a slightly different angle, lighting, or mood while keeping the core subject the same.
            
            Base Prompt: "${basePrompt}"
            
            Return ONLY a JSON array of strings. No markdown formatting.
            Example: ["prompt 1", "prompt 2"]`
        );
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) return parsed.slice(0, count);
        return Array(count).fill(basePrompt);
    } catch (error) {
        console.error('Prompt Variation Error:', error);
        return Array(count).fill(basePrompt);
    }
};

export const generateUltraImage = async (
    refImageBase64: string,
    prompt: string,
    aspectRatio: string = '1:1'
): Promise<string> => {
    const mimeType = getMimeType(refImageBase64);
    return geminiImageGenerate([
        {
            text: `ATUE COMO UM ARTISTA DIGITAL SÊNIOR.
TAREFA: Transformar a imagem de referência seguindo rigorosamente o prompt do usuário.

PROMPT DO USUÁRIO: "${prompt}"

INSTRUÇÕES TÉCNICAS:
1. **FIDELIDADE**: Use a imagem de referência como base estrutural (composição e objetos principais).
2. **CRIATIVIDADE**: Aplique o estilo, iluminação e modificações solicitadas no prompt com alta qualidade artística.
3. **QUALIDADE**: Gere em 2K, fotorrealista e detalhado.

Retorne apenas a imagem final.`
        },
        { inlineData: { mimeType, data: cleanBase64(refImageBase64) } },
    ]);
};

// ─── Video Generation (Veo via @google/genai SDK with Vertex AI) ──────────
export const generateVeoVideo = async (
    inputImages: string[],
    prompt: string,
    aspectRatio: string = '16:9',
    modelType: 'fast' | 'quality' = 'fast'
): Promise<string> => {
    try {
        // Use @google/genai SDK configured for Vertex AI
        const ai = new GoogleGenAI({
            vertexai: true,
            project: VERTEX_PROJECT_ID,
            location: VERTEX_LOCATION,
        });

        const primaryImage = inputImages[0];
        const mimeType = getMimeType(primaryImage);

        let modelId = modelType === 'quality' ? VEO_MODEL_QUALITY : VEO_MODEL_FAST;
        let validRatio = (aspectRatio === '9:16') ? '9:16' : '16:9';
        let veoConfig: any = {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: validRatio
        };

        let operation;

        if (inputImages.length > 1) {
            console.log("Multi-image Veo generation triggered.");
            modelId = VEO_MODEL_QUALITY;
            validRatio = '16:9';

            const referenceImagesPayload = inputImages.slice(0, 3).map(img => ({
                image: {
                    imageBytes: cleanBase64(img),
                    mimeType: getMimeType(img) as any,
                },
                referenceType: 'ASSET',
            }));

            veoConfig = {
                numberOfVideos: 1,
                referenceImages: referenceImagesPayload,
                resolution: '720p',
                aspectRatio: validRatio
            };

            operation = await ai.models.generateVideos({
                model: modelId,
                prompt: prompt || "Animate this scene naturally and cinematically.",
                config: veoConfig
            });
        } else {
            operation = await ai.models.generateVideos({
                model: modelId,
                prompt: prompt || "Animate this scene naturally and cinematically.",
                image: {
                    imageBytes: cleanBase64(primaryImage),
                    mimeType: mimeType as any,
                },
                config: veoConfig
            });
        }

        // Polling loop
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        if (operation.error) {
            throw new Error(`Erro na API do Veo: ${operation.error.message || 'Erro desconhecido'}`);
        }

        console.log("Veo Operation Result:", JSON.stringify(operation, null, 2));

        const videos = operation.response?.generatedVideos;
        const videoUri = videos?.[0]?.video?.uri;

        if (videoUri) {
            const videoResponse = await fetch(videoUri, {
                method: 'GET',
                headers: { 'x-goog-api-key': VERTEX_API_KEY },
            });
            if (!videoResponse.ok) throw new Error(`Falha ao baixar o vídeo (Status ${videoResponse.status}).`);
            const blob = await videoResponse.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (typeof reader.result === 'string') resolve(reader.result);
                    else reject(new Error("Falha na conversão do vídeo."));
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        }

        throw new Error("A IA gerou o vídeo mas não retornou o link.");

    } catch (error: any) {
        console.error("Veo Video Gen Error:", error);
        throw new Error("Erro na API do Veo: " + (error.message || "Video generation failed. Please try again in a few minutes."));
    }
};
