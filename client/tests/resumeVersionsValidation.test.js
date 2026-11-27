import test from "node:test";
import assert from "node:assert/strict";
import { validateResumeVersionForm } from "../src/utils/resumeVersionsValidation.js";

test("validateResumeVersionForm validates name, color hex, font, layout, and margins", () => {
  assert.deepEqual(
    validateResumeVersionForm({
      name: "Backend Engineer — Placement",
      target_role: "Node.js Developer",
      color_theme: "#3730a3",
      font_family: "Inter",
      layout_columns: "two_column_left",
      page_margin: "medium",
    }),
    {},
  );

  const bad = validateResumeVersionForm({
    name: "A",
    color_theme: "not-a-hex",
    font_family: "ComicSans",
    layout_columns: "invalid",
    page_margin: "huge",
  });
  assert.ok(bad.name);
  assert.ok(bad.color_theme);
  assert.ok(bad.font_family);
  assert.ok(bad.layout_columns);
  assert.ok(bad.page_margin);
});
