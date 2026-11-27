import tbl_audit_log from "./auditLog.model.js";

const SENSITIVE_KEYS = new Set([
  "password",
  "student_password",
  "admin_password",
  "company_password",
  "college_password",
  "university_password",
  "tpo_password",
  "token",
  "secret",
  "jwt",
]);

/**
 * Remove sensitive authentication keys before persisting audit snapshots.
 */
export const sanitizeAuditValues = (values) => {
  if (!values || typeof values !== "object") return {};
  const cleaned = {};
  for (const [key, val] of Object.entries(values)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) continue;
    cleaned[key] = val;
  }
  return cleaned;
};

/**
 * Record an audit log entry without blocking core business flows on transient log errors.
 */
export const recordAuditLog = async (
  {
    actorId,
    actorRole,
    targetUserId,
    targetModel,
    targetId,
    collegeId = null,
    universityId = null,
    action,
    changedFields = [],
    previousValues = {},
    newValues = {},
    ipAddress = "",
    userAgent = "",
  },
  AuditModel = tbl_audit_log,
) => {
  try {
    return await AuditModel.create({
      actor_id: actorId,
      actor_role: actorRole,
      target_user_id: targetUserId,
      target_model: targetModel,
      target_id: targetId,
      college_id: collegeId || null,
      university_id: universityId || null,
      action,
      changed_fields: changedFields,
      previous_values: sanitizeAuditValues(previousValues),
      new_values: sanitizeAuditValues(newValues),
      ip_address: ipAddress,
      user_agent: userAgent,
    });
  } catch (err) {
    console.error("Audit log error:", err.message);
    return null;
  }
};
