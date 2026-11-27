import test from "node:test";
import assert from "node:assert/strict";
import {
  isSafeHttpUrl,
  validateProjectForm,
  validateProjectLinkInput,
} from "../src/utils/projectsValidation.js";

test("isSafeHttpUrl allows http/https and blocks dangerous protocols", () => {
  assert.equal(isSafeHttpUrl("https://github.com/org/repo"), true);
  assert.equal(isSafeHttpUrl("http://example.com/demo"), true);
  assert.equal(isSafeHttpUrl("javascript:alert(1)"), false);
  assert.equal(isSafeHttpUrl("data:text/html,<script>"), false);
  assert.equal(isSafeHttpUrl("vbscript:msgbox(1)"), false);
});

test("validateProjectForm enforces title, description, dates, team size, and URLs", () => {
  const valid = validateProjectForm({
    title: "Placement Portal",
    description: "End-to-end campus placement management web and mobile app.",
    role: "Developer",
    status: "Completed",
    visibility: "Public",
    is_ongoing: false,
    start_date: "2025-01-01",
    end_date: "2025-06-01",
    team_size: "3",
    repository_url: "https://github.com/team/portal",
  });
  assert.deepEqual(valid, {});

  const invalid = validateProjectForm({
    title: "A",
    description: "Too short",
    status: "Unknown",
    visibility: "Hidden",
    is_ongoing: false,
    start_date: "2025-06-01",
    end_date: "2025-01-01",
    team_size: "0",
    repository_url: "javascript:alert(1)",
  });
  assert.ok(invalid.title);
  assert.ok(invalid.description);
  assert.ok(invalid.status);
  assert.ok(invalid.visibility);
  assert.ok(invalid.end_date);
  assert.ok(invalid.team_size);
  assert.ok(invalid.repository_url);
});

test("validateProjectLinkInput enforces GitHub host/path, safe schemes, and duplicate rules", () => {
  assert.deepEqual(
    validateProjectLinkInput(
      { link_type: "GITHUB_REPOSITORY", url: "https://github.com/org/repo" },
      [],
    ),
    {},
  );

  const spoofed = validateProjectLinkInput(
    { link_type: "GITHUB_REPOSITORY", url: "https://github.com.attacker.example/org/repo" },
    [],
  );
  assert.ok(spoofed.url);

  const secondGithub = validateProjectLinkInput(
    { link_type: "GITHUB_REPOSITORY", url: "https://github.com/org/second" },
    [{ link_type: "GITHUB_REPOSITORY", url: "https://github.com/org/first" }],
  );
  assert.ok(secondGithub.link_type);

  const dupUrl = validateProjectLinkInput(
    { link_type: "LIVE_DEMO", url: "https://demo.example.com/" },
    [{ link_type: "LIVE_DEMO", url: "https://demo.example.com" }],
  );
  assert.ok(dupUrl.url);
});
