import { GoogleGenAI, Chat, Part } from "@google/genai";

// Initialize the client
// API Key is guaranteed to be available in process.env.API_KEY per instructions
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-3-pro-preview';

const SYSTEM_INSTRUCTION = `
You are a compassionate, Socratic AI math tutor. Your goal is to help the user learn, not just to provide answers. 
When the user presents a problem (via text or an image):

1.  **Acknowledge & Analyze**: Briefly acknowledge the problem to confirm you see it.
2.  **Do NOT Solve Immediately**: Never provide the full solution or the final answer upfront.
3.  **Guide Step-by-Step**: Break the problem down. Ask a guiding question to check the user's understanding or prompt them to attempt the first step.
4.  **Explain Concepts**: If the user is stuck or asks "Why?", explain the specific underlying concept clearly, gently, and simply. Use analogies if helpful.
5.  **Encourage**: Be patient, warm, and encouraging. Celebrate small wins when they get a step right.
6.  **Format**: Use clean Markdown. Use bolding for key terms.

Treat this as a collaborative session. You are sitting next to the student, helping them find the way.
`;

let chatSession: Chat | null = null;

/**
 * Resets the current chat session.
 */
export const startNewSession = () => {
  chatSession = ai.chats.create({
    model: MODEL_NAME,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      // Enable Thinking Mode
      thinkingConfig: {
        thinkingBudget: 32768, // Max budget for gemini-3-pro
      },
      // explicitly NOT setting maxOutputTokens as per requirements
    },
  });
};

/**
 * Sends a message to the model, optionally with an image.
 * Uses streaming for a better user experience.
 */
export const sendMessageStream = async function* (
  text: string,
  imageBase64?: string,
  imageMimeType?: string
) {
  if (!chatSession) {
    startNewSession();
  }

  if (!chatSession) {
    throw new Error("Failed to initialize chat session");
  }

  const parts: Part[] = [];

  // Add text part if it exists
  if (text.trim()) {
    parts.push({ text: text });
  }

  // Add image part if it exists
  if (imageBase64 && imageMimeType) {
    // Remove data URL prefix if present (e.g., "data:image/png;base64,")
    const cleanBase64 = imageBase64.split(',')[1] || imageBase64;
    
    parts.push({
      inlineData: {
        mimeType: imageMimeType,
        data: cleanBase64,
      },
    });
  }

  if (parts.length === 0) {
    throw new Error("Message must contain text or an image.");
  }

  // Send message to the chat session
  // Note: The SDK type definition for sendMessageStream expects `message` which can be string or Part[]
  // We treat it as any to bypass strict type checks if the local definition is outdated, 
  // but standard usage supports the Part[] structure.
  const result = await chatSession.sendMessageStream({
    message: parts.length === 1 && parts[0].text ? parts[0].text : parts,
  });

  for await (const chunk of result) {
    yield chunk.text;
  }
};