import zlib from "node:zlib";

/**
 * Compresses a string if it exceeds 400 characters, returning a Buffer.
 * If <= 400 chars, returns the original string.
 */
export function compressMessageContent(content) {
  if (typeof content !== "string") return content;
  if (content.length > 400) {
    const deflated = zlib.deflateRawSync(Buffer.from(content, "utf-8"));
    return { isCompressed: true, data: deflated };
  }
  return { isCompressed: false, data: content };
}

/**
 * Decompresses content if it is a compressed Buffer or binary payload.
 */
export function decompressMessageContent(rawContent) {
  if (!rawContent) return "";
  if (typeof rawContent === "string") return rawContent;
  
  // If stored as Buffer or binary object
  try {
    if (Buffer.isBuffer(rawContent)) {
      return zlib.inflateRawSync(rawContent).toString("utf-8");
    }
    // Handle MongoDB Binary object
    if (rawContent._bsontype === "Binary" || rawContent.buffer) {
      const buf = Buffer.isBuffer(rawContent.buffer) ? rawContent.buffer : Buffer.from(rawContent.buffer || rawContent);
      return zlib.inflateRawSync(buf).toString("utf-8");
    }
    if (typeof rawContent === "object" && rawContent.isCompressed && rawContent.data) {
      const buf = Buffer.isBuffer(rawContent.data) ? rawContent.data : Buffer.from(rawContent.data.buffer || rawContent.data);
      return zlib.inflateRawSync(buf).toString("utf-8");
    }
  } catch (err) {
    console.error("Failed to decompress message content:", err);
  }
  return String(rawContent);
}

/**
 * Compresses an entire array of 50 messages into a single BinData Buffer.
 */
export function compressMessageArray(messages) {
  const json = JSON.stringify(messages);
  return zlib.deflateRawSync(Buffer.from(json, "utf-8"));
}

/**
 * Decompresses an entire bucket's compressedPayload into the original message array.
 */
export function decompressMessageArray(compressedBuffer) {
  if (!compressedBuffer) return [];
  try {
    const buf = Buffer.isBuffer(compressedBuffer)
      ? compressedBuffer
      : Buffer.from(compressedBuffer.buffer || compressedBuffer);
    const json = zlib.inflateRawSync(buf).toString("utf-8");
    return JSON.parse(json);
  } catch (err) {
    console.error("Failed to decompress message bucket payload:", err);
    return [];
  }
}

