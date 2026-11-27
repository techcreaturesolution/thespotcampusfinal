import test from "node:test";
import assert from "node:assert/strict";
import {
  isSafeHttpsCredentialUrl,
  validateCertificationForm,
  validateCertificateFileSelection,
} from "../src/utils/certificationsValidation.js";

test("isSafeHttpsCredentialUrl enforces strict HTTPS and blocks unsafe protocols", () => {
  assert.equal(isSafeHttpsCredentialUrl("https://www.credly.com/badges/123"), true);
  assert.equal(isSafeHttpsCredentialUrl("http://credly.com/badges/123"), false);
  assert.equal(isSafeHttpsCredentialUrl("javascript:alert(1)"), false);
  assert.equal(isSafeHttpsCredentialUrl("data:text/html,hi"), false);
  assert.equal(isSafeHttpsCredentialUrl("file:///tmp/cert.pdf"), false);
});

test("validateCertificationForm enforces title, issuer, dates, and never-expire rules", () => {
  const valid = validateCertificationForm({
    title: "AWS Solutions Architect",
    issuing_organization: "Amazon Web Services",
    category: "Cloud & DevOps",
    credential_id: "AWS-123",
    credential_url: "https://aws.amazon.com/verify/123",
    issue_date: "2025-01-15",
    expiry_date: "2028-01-15",
    does_not_expire: false,
    description: "Architecture exam",
  });
  assert.deepEqual(valid, {});

  const invalid = validateCertificationForm({
    title: "A",
    issuing_organization: "",
    credential_url: "http://insecure.example.com",
    issue_date: "2025-05-01",
    expiry_date: "2025-01-01",
    does_not_expire: false,
  });
  assert.ok(invalid.title);
  assert.ok(invalid.issuing_organization);
  assert.ok(invalid.credential_url);
  assert.ok(invalid.expiry_date);

  const neverExp = validateCertificationForm({
    title: "Lifetime Award",
    issuing_organization: "IEEE",
    issue_date: "2025-05-01",
    expiry_date: "2020-01-01",
    does_not_expire: true,
  });
  assert.equal(neverExp.expiry_date, undefined);
});

test("validateCertificateFileSelection enforces allowed formats and 5MB max", () => {
  assert.equal(
    validateCertificateFileSelection({
      name: "cert.pdf",
      type: "application/pdf",
      size: 1024 * 1024,
    }),
    "",
  );
  assert.match(
    validateCertificateFileSelection({
      name: "script.exe",
      type: "application/octet-stream",
      size: 1000,
    }),
    /PDF, JPG, JPEG, or PNG/i,
  );
  assert.match(
    validateCertificateFileSelection({
      name: "huge.pdf",
      type: "application/pdf",
      size: 8 * 1024 * 1024,
    }),
    /5 MB/i,
  );
});
