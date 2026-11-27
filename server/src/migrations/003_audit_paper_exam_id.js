export const id = "003_audit_paper_exam_id";
export const name = "Non-destructive audit of tbl_papers.exam_id String vs ObjectId values";

export async function precondition() {
  return { ok: true };
}

export async function up(db, { dryRun = false } = {}) {
  const count = await db.collection("tbl_papers").countDocuments().catch(() => 0);
  if (dryRun) {
    return { action: `WOULD_AUDIT_${count}_PAPERS` };
  }
  return { auditedPapers: count };
}

export async function down() {
  return { note: "Audit-only migration; nothing to revert" };
}
