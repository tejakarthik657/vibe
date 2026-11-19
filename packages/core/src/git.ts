import simpleGit, { SimpleGit } from "simple-git";
import * as fs from "fs";
import * as path from "path";

export interface DiffSummary {
  isRepo: boolean;
  changedFiles: string[];
  insertions: number;
  deletions: number;
  raw: string;
}

const UNTRACKED_IGNORE_PREFIXES = [
  'node_modules/', '.venv/', 'venv/', 'env/', 'dist/', 'build/', '.next/',
  'coverage/', '__pycache__/', '.pytest_cache/', 'site-packages/', 'target/',
  'out/', '.mypy_cache/', 'htmlcov/', 'alembic/versions/', '.git/'
];

function isUntrackedIgnored(filePath: string): boolean {
  return UNTRACKED_IGNORE_PREFIXES.some((prefix) => filePath.startsWith(prefix));
}

export async function getWorkingDiff(root: string): Promise<DiffSummary> {
  const git: SimpleGit = simpleGit(root);
  const isRepo = await git.checkIsRepo().catch(() => false);
  if (!isRepo) {
    return { isRepo: false, changedFiles: [], insertions: 0, deletions: 0, raw: "" };
  }
  const status = await git.status();

  // Filter untracked files through the ignore prefix list
  const filteredUntracked = status.not_added.filter((f) => !isUntrackedIgnored(f));

  const changedFiles = [
    ...status.modified,
    ...filteredUntracked,
    ...status.created,
    ...status.renamed.map((r) => r.to),
  ];
  let raw = "";
  let insertions = 0;
  let deletions = 0;
  try {
    raw = await git.diff();
    const summary = await git.diffSummary();
    insertions = summary.insertions;
    deletions = summary.deletions;
  } catch {
    /* no diff available (e.g. no prior commit) */
  }
  // `git diff` omits untracked files, but guard must inspect them for secrets.
  // Only scan filtered untracked files, capped at 200.
  const untrackedToScan = filteredUntracked.slice(0, 200);
  for (const file of untrackedToScan) {
    try {
      const content = fs.readFileSync(path.join(root, file), "utf-8");
      raw += `\n+++ ${file}\n${content.split("\n").map((line) => `+${line}`).join("\n")}\n`;
    } catch {
      /* unreadable untracked file */
    }
  }
  return { isRepo: true, changedFiles: Array.from(new Set(changedFiles)), insertions, deletions, raw };
}
