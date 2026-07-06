import { GoogleGenAI } from "@google/genai";

export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

export async function chatWithGemini(messages: { role: 'user' | 'assistant' | 'system', content: string }[], onStream?: (text: string) => void): Promise<string> {
    // Convert messages to Gemini API format
    const formattedContents = messages
        .filter(m => m.role !== 'system')
        .map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
        }));

    const systemInstruction = messages.find(m => m.role === 'system')?.content;

    if (onStream) {
        const stream = await ai.models.generateContentStream({
            model: "gemini-1.5-pro",
            contents: formattedContents,
            config: systemInstruction ? { systemInstruction } : undefined
        });

        let fullText = "";
        for await (const chunk of stream) {
            const chunkText = chunk.text;
            fullText += chunkText;
            onStream(fullText);
        }
        return fullText;
    } else {
        const response = await ai.models.generateContent({
            model: "gemini-1.5-pro",
            contents: formattedContents,
            config: systemInstruction ? { systemInstruction } : undefined
        });
        return response.text || "";
    }
}
