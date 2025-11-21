import fs from 'fs';
import pdfParse from 'pdf-parse';


export async function extractTextFromPDF(pdfPath) {
const dataBuffer = fs.readFileSync(pdfPath);
const data = await pdfParse(dataBuffer);
return data.text;
}


// Simple chunker for small PDFs
export function chunkText(text, chunkSize = 500) {
const words = text.split(/\s+/);
const chunks = [];
let current = [];


for (const word of words) {
current.push(word);
if (current.join(' ').length >= chunkSize) {
chunks.push(current.join(' '));
current = [];
}
}


if (current.length) chunks.push(current.join(' '));
return chunks;
}