
import { GoogleGenAI, Type } from "@google/genai";

// Helper to get API Key (Hardcoded as requested)
const getApiKey = (): string => {
    return 'AIzaSyDz4yN2UKivdKsFhBVzE1IeiUEjwBGwzMU';
};

// Helper to remove the data URL prefix for the API
const cleanBase64 = (base64: string): string => {
    // Robustly remove data URI prefix by finding the 'base64,' marker
    const marker = ';base64,';
    const markerIndex = base64.indexOf(marker);
    if (markerIndex !== -1) {
        return base64.substring(markerIndex + marker.length);
    }
    return base64;
};

const getMimeType = (base64: string): string => {
    // Attempt to extract mime type from data URI
    const match = base64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
    if (match && match[1]) {
        return match[1];
    }
    // Fallback detection based on magic bytes/header if possible, or default
    if (base64.startsWith('/9j/')) return 'image/jpeg';
    if (base64.startsWith('iVBORw0KGgo')) return 'image/png';
    if (base64.startsWith('R0lGODdh') || base64.startsWith('R0lGODlh')) return 'image/gif';
    if (base64.startsWith('UklGR')) return 'image/webp'; // WebP often starts with RIFF
    if (base64.startsWith('AAAAHGZ0eXBhdmlm')) return 'image/avif'; // Common AVIF header

    return 'image/jpeg'; // Safe default
}

// Pro model for High-Quality Fusion and Editing
const PRO_MODEL_ID = 'gemini-2.0-pro-exp-02-05';
const TEXT_MODEL_ID = 'gemini-3-flash-preview'; // Fast model for text enhancement

export const generateOutfitSwap = async (
    personImageBase64: string,
    clothingImageBase64: string,
    aspectRatio: string = '1:1'
): Promise<string> => {
    try {
        const apiKey = getApiKey();
        if (!apiKey) throw new Error("API Key não encontrada. Configure no menu secreto (41417).");

        const ai = new GoogleGenAI({ apiKey });

        const personMime = getMimeType(personImageBase64);
        const clothingMime = getMimeType(clothingImageBase64);

        const response = await ai.models.generateContent({
            model: PRO_MODEL_ID,
            contents: {
                parts: [
                    {
                        text: "Atue como um especialista sênior em retoque digital e IA de moda (Virtual Try-On). Sua tarefa é realizar uma SUBSTITUIÇÃO TOTAL de vestuário.\n\nINSTRUÇÕES RIGOROSAS:\n1. APAGUE COMPLETAMENTE a roupa que a pessoa está vestindo na primeira imagem. Ignore a textura, cor e estampa da roupa antiga.\n2. VISTA a pessoa com a roupa fornecida na segunda imagem. A nova roupa deve ser opaca e cobrir totalmente a área do corpo correspondente.\n3. PROIBIDO: Não faça fusão (blending) entre a roupa antiga e a nova. Não deixe a roupa antiga 'vazar' ou aparecer por baixo. O resultado deve parecer que a pessoa vestiu apenas a nova peça.\n4. RECONSTRUÇÃO DE PELE: Se a nova roupa for mais curta, decotada ou sem mangas em comparação com a original, você DEVE reconstruir a pele visível (inpainting) com textura e tom de pele realistas e anatomicamente corretos.\n5. PRESERVE RIGOROSAMENTE: O rosto (identidade), cabelo, mãos, acessórios (relógios, anéis), pose exata e todo o cenário de fundo. A iluminação na nova roupa deve corresponder à iluminação da cena.\n\nGere apenas a imagem final realista em alta qualidade."
                    },
                    {
                        inlineData: {
                            mimeType: personMime,
                            data: cleanBase64(personImageBase64),
                        },
                    },
                    {
                        inlineData: {
                            mimeType: clothingMime,
                            data: cleanBase64(clothingImageBase64),
                        },
                    },
                ],
            },
            config: {
                imageConfig: {
                    imageSize: "1K",
                    aspectRatio: aspectRatio as any
                }
            }
        });

        const parts = response.candidates?.[0]?.content?.parts;

        if (parts) {
            for (const part of parts) {
                if (part.inlineData && part.inlineData.data) {
                    return `data:image/png;base64,${part.inlineData.data}`;
                }
            }
            // If no image part, look for text to explain refusal
            for (const part of parts) {
                if (part.text) {
                    console.warn("Model Refusal/Text:", part.text);
                    throw new Error("A IA recusou gerar a imagem (Safety/Policy). Tente uma imagem diferente.");
                }
            }
        }

        throw new Error("A IA não retornou uma imagem válida.");

    } catch (error: any) {
        console.error("Gemini API Error:", error);
        if (error.status === 429 || (error.message && error.message.includes('429'))) {
            throw new Error("Cota da API excedida (429). Tente novamente em alguns minutos ou troque a chave.");
        }
        throw error;
    }
};

export const refineImage = async (
    baseImageBase64: string,
    instruction: string
): Promise<string> => {
    try {
        const apiKey = getApiKey();
        if (!apiKey) throw new Error("API Key não encontrada.");
        const ai = new GoogleGenAI({ apiKey });

        const mimeType = getMimeType(baseImageBase64);

        const response = await ai.models.generateContent({
            model: PRO_MODEL_ID, // Updated to Pro
            contents: {
                parts: [
                    {
                        text: `Atue como um editor de fotografia de moda high-end. Siga estritamente esta instrução de edição: "${instruction}".\n\nREGRAS DE OURO:\n1. IMUTÁVEL: A pessoa, seu rosto, corpo, pose e, PRINCIPALMENTE, a roupa que ela está vestindo DEVEM PERMANECER IDÊNTICOS. Não mude a cor nem o corte da roupa.\n2. ALTERAÇÃO: Mude apenas o que foi pedido (fundo, luz ou filtro).\n3. REALISMO: Se mudar o fundo, ajuste sutilmente a iluminação nas bordas do sujeito para integrar com o novo ambiente, mas sem alterar a roupa.`
                    },
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: cleanBase64(baseImageBase64),
                        },
                    },
                ],
            },
            config: {
                imageConfig: {
                    imageSize: "1K"
                }
            }
        });

        const parts = response.candidates?.[0]?.content?.parts;
        if (parts) {
            for (const part of parts) {
                if (part.inlineData && part.inlineData.data) {
                    return `data:image/png;base64,${part.inlineData.data}`;
                }
            }
        }
        throw new Error("Falha ao gerar a edição.");
    } catch (error: any) {
        console.error("Gemini Refine Error:", error);
        if (error.status === 429 || (error.message && error.message.includes('429'))) {
            throw new Error("Cota excedida (429). Aguarde um momento.");
        }
        throw error;
    }
};

export const generatePoseVariation = async (
    baseImageBase64: string,
    poseDescription: string,
    aspectRatio: string = '1:1'
): Promise<string> => {
    try {
        const apiKey = getApiKey();
        const ai = new GoogleGenAI({ apiKey });
        const mimeType = getMimeType(baseImageBase64);

        const response = await ai.models.generateContent({
            model: PRO_MODEL_ID, // Updated to Pro
            contents: {
                parts: [
                    {
                        text: `Atue como um diretor criativo de moda. Sua tarefa é gerar uma VARIAÇÃO DE POSE da pessoa na imagem.\n\nINSTRUÇÕES:\n1. IDENTIDADE: Mantenha a mesma pessoa, rosto e características físicas.\n2. ROUPA: Mantenha EXATAMENTE a mesma roupa que ela está vestindo agora.\n3. AÇÃO: Gere uma nova imagem onde esta pessoa esteja na seguinte pose: "${poseDescription}".\n4. COERÊNCIA: A iluminação e o estilo fotográfico devem permanecer consistentes com a imagem original.\n\nRetorne apenas a imagem gerada.`
                    },
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: cleanBase64(baseImageBase64),
                        },
                    },
                ],
            },
            config: {
                imageConfig: {
                    imageSize: "1K",
                    aspectRatio: aspectRatio as any
                }
            }
        });

        const parts = response.candidates?.[0]?.content?.parts;
        if (parts) {
            for (const part of parts) {
                if (part.inlineData && part.inlineData.data) {
                    return `data:image/png;base64,${part.inlineData.data}`;
                }
            }
        }
        throw new Error("Falha ao gerar a variação de pose.");

    } catch (error: any) {
        console.error("Gemini Pose Error:", error);
        if (error.status === 429 || (error.message && error.message.includes('429'))) {
            throw new Error("Cota excedida (429).");
        }
        throw error;
    }
};

export const generateHairVariation = async (
    baseImageBase64: string,
    hairDescription: string
): Promise<string> => {
    try {
        const apiKey = getApiKey();
        const ai = new GoogleGenAI({ apiKey });
        const mimeType = getMimeType(baseImageBase64);

        const response = await ai.models.generateContent({
            model: PRO_MODEL_ID, // Updated to Pro
            contents: {
                parts: [
                    {
                        text: `Atue como um cabeleireiro profissional e editor de imagem. Sua tarefa é alterar o CORTE DE CABELO da pessoa na imagem.\n\nINSTRUÇÕES:\n1. IDENTIDADE: Mantenha rigorosamente o rosto e as características faciais da pessoa.\n2. ROUPA: Mantenha EXATAMENTE a mesma roupa e a mesma pose.\n3. CABELO: Substitua o cabelo atual pelo seguinte estilo: "${hairDescription}". O cabelo deve parecer natural, com textura realista e integrado à iluminação da cena.\n\nRetorne apenas a imagem gerada.`
                    },
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: cleanBase64(baseImageBase64),
                        },
                    },
                ],
            },
            config: {
                imageConfig: {
                    imageSize: "1K"
                }
            }
        });

        const parts = response.candidates?.[0]?.content?.parts;
        if (parts) {
            for (const part of parts) {
                if (part.inlineData && part.inlineData.data) {
                    return `data:image/png;base64,${part.inlineData.data}`;
                }
            }
        }
        throw new Error("Falha ao gerar o corte de cabelo.");

    } catch (error) {
        console.error("Gemini Hair Error:", error);
        throw error;
    }
};

// STEP 1: Swap the Singer Only
export const generateSingerSwap = async (
    flyerRefBase64: string,
    singerBase64: string
): Promise<string> => {
    try {
        const apiKey = getApiKey();
        const ai = new GoogleGenAI({ apiKey });
        const flyerMime = getMimeType(flyerRefBase64);
        const singerMime = getMimeType(singerBase64);

        const response = await ai.models.generateContent({
            model: PRO_MODEL_ID, // Updated to Pro
            contents: {
                parts: [
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
                    {
                        inlineData: {
                            mimeType: flyerMime,
                            data: cleanBase64(flyerRefBase64),
                        },
                    },
                    {
                        inlineData: {
                            mimeType: singerMime,
                            data: cleanBase64(singerBase64),
                        },
                    },
                ],
            },
            config: {
                imageConfig: {
                    imageSize: "1K"
                }
            }
        });

        const parts = response.candidates?.[0]?.content?.parts;
        if (parts) {
            for (const part of parts) {
                if (part.inlineData && part.inlineData.data) {
                    return `data:image/png;base64,${part.inlineData.data}`;
                }
            }
        }
        throw new Error("Falha ao trocar o cantor.");
    } catch (error: any) {
        console.error("Gemini Singer Swap Error:", error);
        if (error.status === 429) throw new Error("Cota excedida (429).");
        throw error;
    }
};

// STEP 2: Apply Text to the Flyer (UPDATED FOR INTELLIGENT LAYOUT & FORENSIC FONT MATCHING)
export const applyFlyerText = async (
    flyerBase64: string,
    eventDetails: string,
    fontSize: string,
    fontColor: string,
    fontFamily: string
): Promise<string> => {
    try {
        const apiKey = getApiKey();
        const ai = new GoogleGenAI({ apiKey });
        const flyerMime = getMimeType(flyerBase64);

        // Enhance the user's color selection with instructions to maintain contrast
        const colorInstruction = fontColor
            ? `Cor Base: ${fontColor}. IMPORTANTE: Se o fundo for da mesma cor ou muito próximo, adicione AUTOMATICAMENTE um Glow Externo ou Sombra Projetada para garantir contraste.`
            : 'Cor: Use a paleta original do flyer.';

        const familyInstruction = fontFamily === 'Original'
            ? `MODO CLONAGEM (CRÍTICO): Analise os pixels dos textos existentes no flyer (datas, locais). Copie EXATAMENTE a fonte, o peso (bold/black), o estilo (itálico/reto) e os efeitos (brilho/neon/3D). O novo texto deve ser INDISTINGUÍVEL do original.`
            : `Use a família de fonte: ${fontFamily}. Mantenha os efeitos visuais (glow/sombra) do design original.`;

        const response = await ai.models.generateContent({
            model: PRO_MODEL_ID, // Updated to Pro
            contents: {
                parts: [
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
                    {
                        inlineData: {
                            mimeType: flyerMime,
                            data: cleanBase64(flyerBase64),
                        },
                    },
                ],
            },
            config: {
                imageConfig: {
                    imageSize: "1K"
                }
            }
        });

        const parts = response.candidates?.[0]?.content?.parts;
        if (parts) {
            for (const part of parts) {
                if (part.inlineData && part.inlineData.data) {
                    return `data:image/png;base64,${part.inlineData.data}`;
                }
            }
        }
        throw new Error("Falha ao aplicar o texto.");
    } catch (error) {
        console.error("Gemini Text Apply Error:", error);
        throw error;
    }
};

export const generateSingerVariation = async (
    flyerBase64: string,
    variationPrompt: string
): Promise<string> => {
    try {
        const apiKey = getApiKey();
        const ai = new GoogleGenAI({ apiKey });
        const mimeType = getMimeType(flyerBase64);

        const response = await ai.models.generateContent({
            model: PRO_MODEL_ID, // Updated to Pro
            contents: {
                parts: [
                    {
                        text: `Atue como um designer gráfico. Sua tarefa é SUBSTITUIR o cantor principal deste flyer por um NOVO personagem: "${variationPrompt}".

REGRAS DE OURO PARA PRESERVAÇÃO:
1. **PROTEJA O TEXTO**: O flyer JÁ CONTÉM a agenda de shows escrita. Você NÃO DEVE TOCAR, BORRAR OU COBRIR O TEXTO.
2. **POSICIONAMENTO INTELIGENTE**: Gere o novo cantor de forma que ele se integre ao design (atrás dos textos se necessário, ou ao lado). O novo cantor NÃO pode bloquear a leitura das datas e locais.
3. PROTEJA O FUNDO: Mantenha o design gráfico de fundo inalterado.
4. ESTILO: Mantenha a mesma iluminação dramática e qualidade fotográfica.

Retorne apenas o flyer com o novo cantor.`
                    },
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: cleanBase64(flyerBase64),
                        },
                    },
                ],
            },
            config: {
                imageConfig: {
                    imageSize: "1K"
                }
            }
        });

        const parts = response.candidates?.[0]?.content?.parts;
        if (parts) {
            for (const part of parts) {
                if (part.inlineData && part.inlineData.data) {
                    return `data:image/png;base64,${part.inlineData.data}`;
                }
            }
        }
        throw new Error("Falha ao gerar a variação de cantor.");

    } catch (error) {
        console.error("Gemini Singer Variation Error:", error);
        throw error;
    }
};

export const generateBeautyBackground = async (
    productBase64: string,
    paletteBase64: string,
    aspectRatio: string,
    priceValue?: string
): Promise<string> => {
    try {
        const apiKey = getApiKey();
        const ai = new GoogleGenAI({ apiKey });
        const productMime = getMimeType(productBase64);
        const paletteMime = getMimeType(paletteBase64);

        let priceInstruction = "";
        if (priceValue && priceValue.trim() !== "") {
            priceInstruction = `6. **ADICIONAR PREÇO (OFERTA)**: O usuário informou o preço: "${priceValue}". 
            - Insira um balão 3D ou Sticker de oferta ao lado do produto.
            - Texto do preço: GRANDE, BRANCO e NÍTIDO.
            - Cor do balão: Vermelho ou Rosa Pink (Alto Contraste).`;
        } else {
            priceInstruction = "6. **SEM PREÇO**: Não adicione nenhum texto ou etiqueta de preço.";
        }

        const response = await ai.models.generateContent({
            model: PRO_MODEL_ID, // Use Pro for best texture/lighting
            contents: {
                parts: [
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
                    {
                        inlineData: {
                            mimeType: productMime,
                            data: cleanBase64(productBase64),
                        },
                    },
                    {
                        inlineData: {
                            mimeType: paletteMime,
                            data: cleanBase64(paletteBase64),
                        },
                    },
                ],
            },
            config: {
                imageConfig: {
                    imageSize: "2K",
                    aspectRatio: aspectRatio
                }
            }
        });

        const parts = response.candidates?.[0]?.content?.parts;
        if (parts) {
            for (const part of parts) {
                if (part.inlineData && part.inlineData.data) {
                    return `data:image/png;base64,${part.inlineData.data}`;
                }
            }
        }
        throw new Error("Falha ao gerar o cenário de beleza.");
    } catch (error: any) {
        console.error("Gemini Beauty Gen Error:", error);
        if (error.status === 429) throw new Error("Cota excedida (429).");
        throw error;
    }
};

export const generateImageFromText = async (
    prompt: string,
    aspectRatio: string = '1:1'
): Promise<string> => {
    try {
        const apiKey = getApiKey();
        if (!apiKey) throw new Error("API Key não encontrada.");
        const ai = new GoogleGenAI({ apiKey });

        const response = await ai.models.generateContent({
            model: PRO_MODEL_ID,
            contents: {
                parts: [
                    {
                        text: prompt
                    }
                ]
            },
            config: {
                imageConfig: {
                    imageSize: "1K",
                    aspectRatio: aspectRatio
                }
            }
        });

        const parts = response.candidates?.[0]?.content?.parts;
        if (parts) {
            for (const part of parts) {
                if (part.inlineData && part.inlineData.data) {
                    return `data:image/png;base64,${part.inlineData.data}`;
                }
            }
        }
        throw new Error("Falha ao gerar a imagem.");
    } catch (error: any) {
        console.error("Gemini Generate Img Error:", error);
        if (error.status === 429 || (error.message && error.message.includes('429'))) {
            throw new Error("Cota excedida (429).");
        }
        throw error;
    }
};

// --- ULTRA CREATION FUNCTIONS (NEW) ---

export const enhancePrompt = async (currentPrompt: string): Promise<string> => {
    try {
        const apiKey = getApiKey();
        const ai = new GoogleGenAI({ apiKey });

        const response = await ai.models.generateContent({
            model: TEXT_MODEL_ID,
            contents: `Você é um especialista em Prompt Engineering para geração de vídeo com IA (Veo).
            
            Sua tarefa é REESCREVER a descrição abaixo para criar um vídeo visualmente deslumbrante, OBRIGATORIAMENTE definindo ILUMINAÇÃO, ESTILO e MOVIMENTO.
            
            Descrição Original: "${currentPrompt}"
            
            INSTRUÇÕES OBRIGATÓRIAS (Traduzir tudo para Inglês):
            1. LIGHTING (Iluminação): Especifique a luz (ex: 'volumetric lighting', 'golden hour', 'neon rim lights', 'dramatic noir lighting').
            2. STYLE (Estilo): Defina a estética visual (ex: 'photorealistic 8k', 'cinematic film stock', 'Unreal Engine 5 render', 'vintage 90s camcorder').
            3. MOVEMENT (Movimento - CRUCIAL): O prompt DEVE conter movimento de câmera ou do sujeito para evitar vídeos estáticos. Use termos como: 'slow pan right', 'tracking shot', 'push in', 'dynamic handheld', 'wind blowing fabric'.
            4. Resuma em um único parágrafo denso e direto em INGLÊS.
            
            Retorne APENAS o prompt melhorado em inglês, sem aspas e sem introduções.`
        });

        return response.text || currentPrompt;
    } catch (error) {
        console.error("Enhance Prompt Error:", error);
        return currentPrompt; // Fallback to original
    }
}

export const generatePromptVariations = async (basePrompt: string, count: number): Promise<string[]> => {
    try {
        const apiKey = getApiKey();
        const ai = new GoogleGenAI({ apiKey });

        const response = await ai.models.generateContent({
            model: TEXT_MODEL_ID,
            contents: `Generate ${count} distinct but related variations of the following prompt for AI video generation. 
            Each variation should explore a slightly different angle, lighting, or mood while keeping the core subject the same.
            
            Base Prompt: "${basePrompt}"
            
            Return ONLY a JSON array of strings. No markdown formatting.
            Example: ["prompt 1", "prompt 2"]`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });

        const text = response.text;
        if (text) {
            const parsed = JSON.parse(text);
            if (Array.isArray(parsed)) {
                return parsed.slice(0, count);
            }
        }
        return Array(count).fill(basePrompt); // Fallback

    } catch (error) {
        console.error("Prompt Variation Error:", error);
        return Array(count).fill(basePrompt);
    }
}

export const generateUltraImage = async (
    refImageBase64: string,
    prompt: string,
    aspectRatio: string = '1:1'
): Promise<string> => {
    try {
        const apiKey = getApiKey();
        const ai = new GoogleGenAI({ apiKey });
        const mimeType = getMimeType(refImageBase64);

        const response = await ai.models.generateContent({
            model: PRO_MODEL_ID,
            contents: {
                parts: [
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
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: cleanBase64(refImageBase64),
                        },
                    },
                ],
            },
            config: {
                imageConfig: {
                    aspectRatio: aspectRatio
                }
            }
        });

        const parts = response.candidates?.[0]?.content?.parts;
        if (parts) {
            for (const part of parts) {
                if (part.inlineData && part.inlineData.data) {
                    return `data:image/png;base64,${part.inlineData.data}`;
                }
            }
        }
        throw new Error("Falha ao gerar a imagem Ultra.");

    } catch (error: any) {
        console.error("Gemini Ultra Img Error:", error);
        if (error.status === 429) throw new Error("Cota excedida (429).");
        throw error;
    }
};

export const generateVeoVideo = async (
    inputImages: string[],
    prompt: string,
    aspectRatio: string = '16:9',
    modelType: 'fast' | 'quality' = 'fast'
): Promise<string> => {
    try {
        const apiKey = getApiKey();
        const ai = new GoogleGenAI({ apiKey });

        // Use the first image as the primary frame
        const primaryImage = inputImages[0];
        const mimeType = getMimeType(primaryImage);

        // Determine Model & Mode
        let modelId = modelType === 'quality' ? 'veo-3.1-generate-preview' : 'veo-3.1-fast-generate-preview';
        let validRatio = (aspectRatio === '9:16') ? '9:16' : '16:9';
        let veoConfig: any = {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: validRatio
        };

        // MULTI-IMAGE LOGIC:
        // If we have multiple images, we use Veo's "Reference Images" feature.
        // This REQUIRES 'veo-3.1-generate-preview', 16:9 ratio, and '720p'.
        // We override user selection to make this feature work if multiple images are passed.
        if (inputImages.length > 1) {
            console.log("Multi-image Veo generation triggered.");
            modelId = 'veo-3.1-generate-preview';
            validRatio = '16:9'; // Constraint: Reference images only work with 16:9 in preview

            const referenceImagesPayload = [];

            // We can pass up to 3 reference images (limit for safety/API constraints)
            // We use the images *after* the first one as context references, 
            // or we could use all of them. Let's use up to 3 distinctive frames from the input.
            const refsToUse = inputImages.slice(0, 3);

            for (const img of refsToUse) {
                referenceImagesPayload.push({
                    image: {
                        imageBytes: cleanBase64(img),
                        mimeType: getMimeType(img) as any,
                    },
                    referenceType: 'ASSET', // Use 'ASSET' to guide style/content
                });
            }

            veoConfig = {
                numberOfVideos: 1,
                referenceImages: referenceImagesPayload,
                resolution: '720p',
                aspectRatio: validRatio
            };
        }

        // 1. Start Video Operation
        // Note: When using referenceImages, we pass them in config, and technically don't need the 'image' property
        // at the top level if we want purely prompt + refs, OR we can pass a starting image.
        // For consistency with single-image flow, we pass primary image unless in multi-mode where we rely on config.

        let operation;

        if (inputImages.length > 1) {
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

        // 2. Polling loop
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        // Check for error
        if (operation.error) {
            throw new Error(`Erro na API do Veo: ${operation.error.message || 'Erro desconhecido'}`);
        }

        console.log("Veo Operation Result:", JSON.stringify(operation, null, 2));

        // 3. Get Result
        const videos = operation.response?.generatedVideos;
        const videoUri = videos?.[0]?.video?.uri;

        if (videoUri) {
            try {
                const videoResponse = await fetch(videoUri, {
                    method: 'GET',
                    headers: {
                        'x-goog-api-key': apiKey,
                    },
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
            } catch (fetchError: any) {
                console.error("Video Download Error:", fetchError);
                throw new Error(fetchError.message || "Erro ao baixar o vídeo gerado.");
            }
        }

        throw new Error("A IA gerou o vídeo mas não retornou o link.");

    } catch (error: any) {
        console.error("Veo Video Gen Error:", error);
        throw new Error("Erro na API do Veo: Video generation failed due to an internal server issue. Please try again in a few minutes. If the problem persists, please contact Gemini API support.");
    }
};
