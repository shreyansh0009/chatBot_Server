// aiAgentService.js
import OpenAI from "openai";
import dotenv from "dotenv";
import { Pinecone } from "@pinecone-database/pinecone";

dotenv.config();

const SYSTEM_PROMPT = `
You are Lupin's assistant.
- Reply in 1–2 short sentences.
- Always use retrieved KB snippet for answers.
- If the question is outside domain, say:
"I can only help with Lupin product info, medical queries, HO requests, training & performance insights."
`;

class AIAgentService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });

    this.index = this.pinecone.Index(process.env.PINECONE_INDEX);

    this.sessions = new Map();
  }

  // -------------------------
  // SESSION HANDLING
  // -------------------------
  getSession(id) {
    if (!this.sessions.has(id)) {
      this.sessions.set(id, {
        history: [],
        userDetails: {},
      });
    }
    return this.sessions.get(id);
  }

  getWelcomeMessage() {
    return "Hello! I'm your Lupin assistant — how can I help you today?";
  }

  clearSession(sessionId) {
    this.sessions.delete(sessionId);
  }

  getUserDetails(sessionId) {
    const session = this.getSession(sessionId);
    return session.userDetails || {};
  }

  // -------------------------
  // RAG: Pinecone Retrieval
  // -------------------------
  async getRelevantKBSnippet(message) {
    try {
      // 1. Create embedding for query
      const embedResp = await this.openai.embeddings.create({
        model: "text-embedding-3-small",
        input: message,
      });

      const queryVector = embedResp.data[0].embedding;

      // 2. Query Pinecone (NEW SDK style)
      const result = await this.index
        .namespace("demo")
        .query({
          vector: queryVector,
          topK: 3,
          includeMetadata: true,
        });

      if (!result?.matches) return "";

      // 3. Merge retrieved chunks
      return result.matches
        .map(m => m.metadata?.text || "")
        .join("\n")
        .slice(0, 800); // keep small for short responses

    } catch (error) {
      console.error("❌ Pinecone Query Error:", error);
      return "";
    }
  }

  // -------------------------
  // CHAT FUNCTION
  // -------------------------
  async chat(sessionId, message) {
    try {
      const session = this.getSession(sessionId);

      // Keep last 2 messages only
      const history = session.history.slice(-2);

      // Retrieve KB (RAG)
      const kbSnippet = await this.getRelevantKBSnippet(message);

      const messages = [
        { role: "system", content: SYSTEM_PROMPT },
        ...history,
        {
          role: "user",
          content: `KB:\n${kbSnippet}\n\nUSER: ${message}`,
        },
      ];

      const resp = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        max_tokens: 60,
        temperature: 0.1,
      });

      const reply =
        resp.choices?.[0]?.message?.content?.trim() ||
        "I'm sorry, I couldn't generate a response.";

      // Save in history
      session.history.push({ role: "user", content: message });
      session.history.push({ role: "assistant", content: reply });

      return {
        response: reply,
        userDetails: session.userDetails,
        conversationHistory: session.history,
      };

    } catch (error) {
      console.error("❌ Chat Error:", error);
      return { response: "Something went wrong. Please try again." };
    }
  }
}

export default new AIAgentService();
