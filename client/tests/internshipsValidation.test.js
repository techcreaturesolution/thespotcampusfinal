import test from "node:test";
import assert from "node:assert/strict";
import {
  validateInternshipForm,
  validateInternshipLinkInput,
} from "../src/utils/internshipsValidation.js";

test("validateInternshipForm enforces role, org, dates, currently_working, and website URLs", () => {
  const valid = validateInternshipForm({
    role_title: "Full Stack Intern",
    organization_name: "Tech Creature Solution",
    employment_type: "Internship",
    work_mode: "Remote",
    start_date: "2025-01-01",
    end_date: "2025-06-01",
    currently_working: false,
    company_website: "https://techcreaturesolution.com",
  });
  assert.deepEqual(valid, {});

  const currentOk = validateInternshipForm({
    role_title: "Backend Intern",
    organization_name: "Acme Labs",
    start_date: "2025-05-01",
    end_date: "",
    currently_working: true,
  });
  assert.deepEqual(currentOk, {});

  const invalid = validateInternshipForm({
    role_title: "A",
    organization_name: "",
    start_date: "2025-06-01",
    end_date: "2025-01-01",
    currently_working: false,
    company_website: "javascript:alert(1)",
  });
  assert.ok(invalid.role_title);
  assert.ok(invalid.organization_name);
  assert.ok(invalid.end_date);
  assert.ok(invalid.company_website);
});

test("validateInternshipLinkInput validates link types, safe URLs, and duplicates", () => {
  assert.deepEqual(
    validateInternshipLinkInput(
      { link_type: "VERIFICATION_PAGE", url: "https://verify.acme.com/1", label: "Letter" },
      [],
    ),
    {},
  );
  assert.ok(
    validateInternshipLinkInput({ link_type: "OTHER", url: "javascript:alert(1)" }, []).url,
  );
  assert.ok(
    validateInternshipLinkInput(
      { link_type: "OTHER", url: "https://verify.acme.com/1" },
      [{ link_type: "OTHER", url: "https://verify.acme.com/1/" }],
    ).url,
  );
});
