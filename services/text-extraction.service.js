import { extractText } from "unpdf";

/**
 * Creates an HTTP-friendly error.
 */
function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

/**
 * Remove common extraction noise while preserving
 * paragraphs and the meaning of the content.
 */
function cleanExtractedText(text) {
  return (
    text
      // Remove null characters and the UTF-8 byte-order mark.
      .replace(/\u0000|\uFEFF/g, "")

      // Convert Windows and older Mac line endings to "\n".
      .replace(/\r\n?/g, "\n")

      // Replace non-breaking spaces with normal spaces.
      .replace(/\u00A0/g, " ")

      // Remove table-of-contents dot leaders.
      .replace(/\.{3,}/g, " ")

      // Remove spaces and tabs before line breaks.
      .replace(/[ \t]+\n/g, "\n")
      // Remove TOC dot leaders, including dots separated by spaces.
      .replace(/(?:\.[ \t]*){3,}/g, " ")

      // Replace repeated spaces and tabs with one space.
      .replace(/[ \t]{2,}/g, " ")

      // Keep a maximum of one empty line between paragraphs.
      .replace(/\n{3,}/g, "\n\n")

      // Remove whitespace from the beginning and end.
      .trim()
  );
}
/**
 * Extract text from a PDF buffer.
 */
async function extractPdfText(fileBuffer) {
  // Convert the Node.js Buffer into the binary format
  // expected by unpdf.
  const pdfData = new Uint8Array(fileBuffer);

  // unpdf creates and manages the PDF document internally.
  const { text } = await extractText(pdfData, {
    mergePages: true,
  });

  return text;
}

/**
 * Extract and clean text from an uploaded PDF or TXT file.
 */
export async function extractTextFromFile(fileBuffer, mimeType) {
  // Confirm that Multer provided a valid, non-empty buffer.
  if (!Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) {
    throw createError("A valid, non-empty file buffer is required", 400);
  }

  if (typeof mimeType !== "string" || mimeType.trim() === "") {
    throw createError("File MIME type is required", 400);
  }

  let extractedText;

  switch (mimeType) {
    case "application/pdf":
      extractedText = await extractPdfText(fileBuffer);
      break;

    case "text/plain":
      // TXT files already contain readable text.
      extractedText = fileBuffer.toString("utf8");
      break;

    default:
      throw createError(
        "Unsupported file type. Only PDF and TXT files are allowed",
        415,
      );
  }

  const cleanedText = cleanExtractedText(extractedText);

  if (!cleanedText) {
    throw createError("No readable text was found in the uploaded file", 422);
  }

  return cleanedText;
}
