import simpleGit, { SimpleGit } from "simple-git";
import * as fs from "fs";
import * as path from "path";
import { IgnoreEngine, normalizePath } from "./ignore";

export interface DiffSummary {
  isRepo: boolean;
  baseline: "ci-merge-base" | "head" | "initial-tree";
  changedFiles: string[]; // All unignored changed files (source + config + doc)
  sourceFiles: string[];  // Strictly application source files
  testFiles: string[];    // Test files changed
  configFiles: string[];  // Configuration files changed
  ignoredFilesCount: number; // Ignored/generated files in working tree
  trackedCount: number;
  untrackedSourceCount: number;
  insertions: number;
  deletions: number;
  raw: string;
}

export async function getWorkingDiff(root: string): Promise<DiffSummary> {
  const git: SimpleGit = simpleGit(root);
  const isRepo = await git.checkIsRepo().catch(() => false);
  if (!isRepo) {
    return {
      isRepo: false,
      baseline: "initial-tree",
      changedFiles: [],
      sourceFiles: [],
      testFiles: [],
      configFiles: [],
      ignoredFilesCount: 0,
      trackedCount: 0,
      untrackedSourceCount: 0,
      insertions: 0,
      deletions: 0,
      raw: "",
    };
  }

  const ignoreEngine = IgnoreEngine.fromRoot(root);
  const status = await git.status();

  // Determine baseline: CI merge-base vs local HEAD vs initial
  let baseline: "ci-merge-base" | "head" | "initial-tree" = "head";
  let hasCommits = false;
  try {
    await git.revparse(["HEAD"]);
    hasCommits = true;
  } catch {
    hasCommits = false;
    baseline = "initial-tree";
  }

  // Check CI merge base
  if (hasCommits && (process.env.CI || process.env.GITHUB_BASE_REF)) {
    const targetBranch = process.env.GITHUB_BASE_REF || "origin/main";
    try {
      await git.raw(["merge-base", targetBranch, "HEAD"]);
      baseline = "ci-merge-base";
    } catch {
      baseline = "head";
    }
  }

  // Separate untracked files into unignored vs ignored/generated
  const rawUntracked = status.not_added.map(normalizePath);
  const untrackedFiltered = ignoreEngine.filterPaths(rawUntracked);

  // Collect raw tracked changes
  const rawTracked = [
    ...status.modified,
    ...status.created,
    ...status.renamed.map((r) => r.to),
  ].map(normalizePath);

  const trackedFiltered = ignoreEngine.filterPaths(rawTracked);

  // Total unignored changed files
  const changedFiles = Array.from(new Set([...trackedFiltered.allUnignored, ...untrackedFiltered.allUnignored]));
  const sourceFiles = Array.from(new Set([...trackedFiltered.sourceFiles, ...untrackedFiltered.sourceFiles]));
  const testFiles = Array.from(new Set([...trackedFiltered.testFiles, ...untrackedFiltered.testFiles]));
  const configFiles = Array.from(new Set([...trackedFiltered.configFiles, ...untrackedFiltered.configFiles]));
  const ignoredFilesCount = untrackedFiltered.ignoredFiles.length + trackedFiltered.ignoredFiles.length;

  let raw = "";
  let insertions = 0;
  let deletions = 0;

  try {
    if (hasCommits) {
      raw = await git.diff();
      const summary = await git.diffSummary();
      insertions = summary.insertions;
      deletions = summary.deletions;
    }
  } catch {
    /* best effort */
  }

  // Append untracked unignored source files into raw diff for secret scanning (capped at 200 files)
  const untrackedToInspect = untrackedFiltered.allUnignored.slice(0, 200);
  for (const file of untrackedToInspect) {
    try {
      const content = fs.readFileSync(path.join(root, file), "utf-8");
      raw += `\n+++ ${file}\n${content
        .split("\n")
        .map((line) => `+${line}`)
        .join("\n")}\n`;
    } catch {
      /* skip unreadable */
    }
  }

  return {
    isRepo: true,
    baseline,
    changedFiles,
    sourceFiles,
    testFiles,
    configFiles,
    ignoredFilesCount,
    trackedCount: trackedFiltered.allUnignored.length,
    untrackedSourceCount: untrackedFiltered.sourceFiles.length,
    insertions,
    deletions,
    raw,
  };
}
