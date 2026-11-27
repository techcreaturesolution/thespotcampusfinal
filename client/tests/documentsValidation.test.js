import test from "node:test";
import assert from "node:assert/strict";
import {
  validateDocumentFileSelection,
  formatFileSize,
} from "../src/utils/documentsValidation.js";

test("validateDocumentFileSelection enforces resume/doc extensions, MIME, size, and filename safety", () => {
  assert.equal(
    validateDocumentFileSelection(
      { name: "My_Resume.pdf", type: "application/pdf", size: 2048 },
      "RESUME",
    ),
    "",
  );
  assert.match(
    validateDocumentFileSelection(
      { name: "../secret.pdf", type: "application/pdf", size: 2048 },
      "RESUME",
    ),
    /Invalid filename/i,
  );
  assert.match(
    validateDocumentFileSelection(
      { name: "photo.png", type: "image/png", size: 2048 },
      "RESUME",
    ),
    /PDF, DOC, or DOCX/i,
  );
  assert.match(
    validateDocumentFileSelection(
      { name: "giant.pdf", type: "application/pdf", size: 12 * 1024 * 1024 },
      "RESUME",
    ),
    /10 MB/i,
  );
  assert.equal(formatFileSize(1536), "1.5 KB");
});
