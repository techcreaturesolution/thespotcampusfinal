export const id = "002_check_application_duplicates";
export const name = "Audit duplicate {student_id, job_id} in tbl_applications before unique index";

export async function precondition(db) {
  const duplicates = await db
    .collection("tbl_applications")
    .aggregate([
      { $match: { student_id: { $ne: null }, job_id: { $ne: null } } },
      { $group: { _id: { student_id: "$student_id", job_id: "$job_id" }, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
      { $limit: 5 },
    ])
    .toArray()
    .catch(() => []);
  return { ok: duplicates.length === 0, duplicateSampleCount: duplicates.length };
}

export async function up(db, { dryRun = false } = {}) {
  const pre = await precondition(db);
  if (dryRun) {
    return {
      action: pre.ok ? "WOULD_ENSURE_UNIQUE_student_id_job_id" : "BLOCKED_BY_EXISTING_DUPLICATES",
      duplicateSampleCount: pre.duplicateSampleCount,
    };
  }
  if (!pre.ok) {
    throw new Error(`Duplicate applications exist (${pre.duplicateSampleCount}+); resolve before creating unique index`);
  }
  await db.collection("tbl_applications").createIndex(
    { student_id: 1, job_id: 1 },
    { unique: true, partialFilterExpression: { student_id: { $exists: true }, job_id: { $exists: true } } }
  );
  return { uniqueIndexEnsured: true };
}

export async function down(db) {
  await db.collection("tbl_applications").dropIndex("student_id_1_job_id_1").catch(() => {});
  return { droppedIndex: "student_id_1_job_id_1" };
}
