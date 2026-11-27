import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectToMongoDB } from "../config/db.js";
import tbl_project from "../modules/projects/project.model.js";
import tbl_project_link from "../modules/projects/projectLink.model.js";
import { PROJECT_LINK_TYPES } from "../utils/constants.js";
import {
  inferRepositoryLinkType,
  validateProviderLink,
} from "../modules/projects/projects.service.js";

dotenv.config();

/**
 * Forward migration: migrate legacy URL fields (repository_url, live_demo_url, project_url)
 * on tbl_project into normalized tbl_project_link documents without losing data.
 */
export const up = async () => {
  await tbl_project_link.syncIndexes();

  const projects = await tbl_project.find({
    is_deleted: false,
    $or: [
      { repository_url: { $exists: true, $nin: [null, ""] } },
      { live_demo_url: { $exists: true, $nin: [null, ""] } },
      { project_url: { $exists: true, $nin: [null, ""] } },
    ],
  });

  let migratedLinks = 0;
  let clearedLegacyDocs = 0;
  const skippedInvalid = [];

  for (const project of projects) {
    const candidates = [];
    if (project.repository_url) {
      candidates.push({
        link_type: inferRepositoryLinkType(project.repository_url),
        url: project.repository_url,
      });
    }
    if (project.live_demo_url) {
      candidates.push({
        link_type: PROJECT_LINK_TYPES.LIVE_DEMO,
        url: project.live_demo_url,
      });
    }
    if (project.project_url) {
      candidates.push({
        link_type: PROJECT_LINK_TYPES.PROJECT_WEBSITE,
        url: project.project_url,
      });
    }

    let order = await tbl_project_link.countDocuments({
      project_id: project._id,
      is_deleted: false,
    });

    for (const c of candidates) {
      try {
        const checked = validateProviderLink(c.link_type, c.url);
        const dupUrl = await tbl_project_link.findOne({
          project_id: project._id,
          normalized_url: checked.normalized_url,
          is_deleted: false,
        });
        if (dupUrl) continue;

        if (checked.link_type === PROJECT_LINK_TYPES.GITHUB_REPOSITORY) {
          const dupGh = await tbl_project_link.findOne({
            project_id: project._id,
            link_type: PROJECT_LINK_TYPES.GITHUB_REPOSITORY,
            is_deleted: false,
          });
          if (dupGh) continue;
        }

        await tbl_project_link.create({
          project_id: project._id,
          student_id: project.student_id,
          link_type: checked.link_type,
          url: checked.url,
          normalized_url: checked.normalized_url,
          label: checked.label,
          display_order: order++,
          is_deleted: false,
        });
        migratedLinks++;
      } catch (err) {
        skippedInvalid.push({ project_id: project._id, url: c.url, reason: err.message });
      }
    }

    await tbl_project.findByIdAndUpdate(project._id, {
      $set: { repository_url: "", live_demo_url: "", project_url: "" },
    });
    clearedLegacyDocs++;
  }

  console.log(
    `Project Links migration UP completed. Migrated links: ${migratedLinks}, Projects normalized: ${clearedLegacyDocs}, Skipped invalid: ${skippedInvalid.length}`,
  );
  return { migratedLinks, clearedLegacyDocs, skippedInvalid };
};

/**
 * Rollback migration: restores primary repository_url, live_demo_url, project_url from tbl_project_link.
 */
export const down = async () => {
  const links = await tbl_project_link.find({ is_deleted: false }).sort({ display_order: 1 });
  const byProject = new Map();
  for (const l of links) {
    const key = String(l.project_id);
    if (!byProject.has(key)) byProject.set(key, []);
    byProject.get(key).push(l);
  }

  let restored = 0;
  for (const [projectId, pLinks] of byProject.entries()) {
    const repo = pLinks.find((l) =>
      [
        PROJECT_LINK_TYPES.GITHUB_REPOSITORY,
        PROJECT_LINK_TYPES.GITLAB_REPOSITORY,
        PROJECT_LINK_TYPES.BITBUCKET_REPOSITORY,
      ].includes(l.link_type),
    );
    const demo = pLinks.find((l) => l.link_type === PROJECT_LINK_TYPES.LIVE_DEMO);
    const site = pLinks.find(
      (l) =>
        l.link_type === PROJECT_LINK_TYPES.PROJECT_WEBSITE ||
        l.link_type === PROJECT_LINK_TYPES.DOCUMENTATION,
    );

    await tbl_project.findByIdAndUpdate(projectId, {
      $set: {
        repository_url: repo?.url || "",
        live_demo_url: demo?.url || "",
        project_url: site?.url || "",
      },
    });
    restored++;
  }

  console.log(`Project Links migration DOWN completed. Restored legacy fields on ${restored} projects.`);
  return { restored };
};

const isDirectExecution = process.argv[1] && process.argv[1].endsWith("migrateProjectLinks.js");

if (isDirectExecution) {
  const isRollback = process.argv.includes("--rollback");
  connectToMongoDB()
    .then(async () => {
      if (isRollback) {
        await down();
      } else {
        await up();
      }
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error("Project Links migration failed:", err);
      await mongoose.disconnect();
      process.exit(1);
    });
}
