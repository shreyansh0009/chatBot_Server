// pineconeLoader.js
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";
import pdfjs from "pdfjs-dist/legacy/build/pdf.js";

pdfjs.GlobalWorkerOptions.workerSrc = "pdfjs-dist/legacy/build/pdf.worker.js";

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const index = pinecone.Index(process.env.PINECONE_INDEX);

// ---------------- PDF TEXT EXTRACTOR USING pdfjs-dist --------------------
async function extractTextFromPDF(pdfPath) {
  const data = new Uint8Array(fs.readFileSync(pdfPath));

  const pdf = await pdfjs.getDocument({ data }).promise;

  let text = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((it) => it.str).join(" ") + "\n";
  }

  return text;
}
// ---------------- Text Chunking --------------------
function chunkText(text, chunkSize = 600) {
  const words = text.split(/\s+/);
  const chunks = [];
  let current = [];

  for (const word of words) {
    current.push(word);
    if (current.join(" ").length >= chunkSize) {
      chunks.push(current.join(" "));
      current = [];
    }
  }

  if (current.length) chunks.push(current.join(" "));
  return chunks;
}

// ---------------- Main Loader --------------------
export async function loadPDFtoPinecone() {
  try {
    const uploadDir = path.join(process.cwd(), "uploads");
    const files = fs.readdirSync(uploadDir).filter((f) => f.endsWith(".pdf"));

    if (files.length === 0) {
      console.log("📂 No PDF found — skipping ingestion.");
      return;
    }

    const pdfPath = path.join(uploadDir, files[0]);
    console.log("📄 Reading PDF:", pdfPath);

    const text = await extractTextFromPDF(pdfPath);

    if (!text || text.trim().length === 0) {
      console.log("⚠️ Extracted PDF text is EMPTY.");
      return;
    }

    const chunks = chunkText(text, 600);

    console.log(`📌 Extracted ${chunks.length} chunks.`);

    // Create embeddings
    const embedResp = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: chunks,
    });

    const vectors = embedResp.data.map((item, idx) => ({
      id: `chunk_${idx}_${Date.now()}`,
      values: item.embedding,
      metadata: { text: chunks[idx] },
    }));

    console.log("📤 Uploading vectors to Pinecone...");
    await index.namespace("demo").upsert(vectors);
    console.log("✅ Pinecone upload complete!");

  } catch (err) {
    console.error("❌ Error in loadPDFtoPinecone:", err);
  }
}
