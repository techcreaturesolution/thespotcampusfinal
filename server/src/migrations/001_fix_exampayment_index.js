export const id = "001_fix_exampayment_index";
export const name = "Drop legacy unique user_id index on exam_payments and ensure compound index";

export async function precondition(db) {
  const cols = await db.listCollections({ name: "exam_payments" }).toArray();
  return { ok: true, collectionExists: cols.length > 0 };
}

export async function up(db, { dryRun = false } = {}) {
  const col = db.collection("exam_payments");
  const indexes = await col.indexes().catch(() => []);
  const hasLegacyUnique = indexes.some((i) => i.name === "user_id_1" && i.unique);
  if (dryRun) {
    return { action: hasLegacyUnique ? "WOULD_DROP_user_id_1_AND_CREATE_COMPOUND" : "NOOP_INDEX_OK" };
  }
  if (hasLegacyUnique) {
    await col.dropIndex("user_id_1");
  }
  await col.createIndex({ user_id: 1, examId: 1 });
  return { droppedLegacyUnique: hasLegacyUnique };
}

export async function down() {
  return { note: "Non-destructive rollback: compound index retained to prevent data loss" };
}
