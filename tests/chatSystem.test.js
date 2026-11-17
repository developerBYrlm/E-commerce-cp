import test from "node:test";
import assert from "node:assert/strict";
import {
  compressMessageContent,
  decompressMessageContent,
  compressMessageArray,
  decompressMessageArray,
} from "../server/utils/chatCompression.js";
import Conversation from "../server/models/Conversation.js";
import MessageBucket from "../server/models/MessageBucket.js";

test("chat text under 400 chars is kept raw for fast read/write", () => {
  const shortText = "Hello! Is this product available in stock?";
  const result = compressMessageContent(shortText);
  assert.equal(result.isCompressed, false);
  assert.equal(result.data, shortText);
  assert.equal(decompressMessageContent(result.data), shortText);
});

test("chat text over 400 chars is compressed with zlib deflateRawSync into compact Buffer", () => {
  const longText = "LocalSphere neighborhood commerce ".repeat(25); // ~850 chars
  assert.ok(longText.length > 400);

  const result = compressMessageContent(longText);
  assert.equal(result.isCompressed, true);
  assert.ok(Buffer.isBuffer(result.data));
  assert.ok(result.data.length < longText.length); // significantly smaller

  // Decompresses transparently back to original text
  const decompressed = decompressMessageContent(result.data);
  assert.equal(decompressed, longText);
});

test("closed message bucket (50 messages) compresses into single BinData buffer and decompresses identically", () => {
  const messages = [];
  for (let i = 0; i < 50; i++) {
    messages.push({
      s: "6acb8bc5d167033f911dde3c",
      c: `Message sequence test number ${i} with sample neighborhood text`,
      t: "text",
      st: i % 2 === 0 ? "read" : "sent",
      ts: new Date(1700000000000 + i * 1000).toISOString(),
    });
  }
  assert.equal(messages.length, 50);

  const compressedBuffer = compressMessageArray(messages);
  assert.ok(Buffer.isBuffer(compressedBuffer));
  assert.ok(compressedBuffer.length > 0);

  const decompressed = decompressMessageArray(compressedBuffer);
  assert.equal(decompressed.length, 50);
  assert.equal(decompressed[0].c, messages[0].c);
  assert.equal(decompressed[49].c, messages[49].c);
  assert.equal(decompressed[25].st, messages[25].st);
});

test("Conversation schema defines compound index { participants: 1, updatedAt: -1 }", () => {
  const indexes = Conversation.schema.indexes();
  const compoundMatch = indexes.some(([fields]) => {
    return fields.participants === 1 && fields.updatedAt === -1;
  });
  assert.ok(compoundMatch, "Conversation must have compound index { participants: 1, updatedAt: -1 }");
});

test("MessageBucket schema defines compound index { conversationId: 1, bucketSeq: -1 }", () => {
  const indexes = MessageBucket.schema.indexes();
  const compoundMatch = indexes.some(([fields]) => {
    return fields.conversationId === 1 && fields.bucketSeq === -1;
  });
  assert.ok(compoundMatch, "MessageBucket must have compound index { conversationId: 1, bucketSeq: -1 }");
});

