import simpleGit, { SimpleGit } from "simple-git";

export interface DiffSummary {
  isRepo: boolean;
  changedFiles: string[];
  insertions: number;
  deletions: number;
  raw: string;
}

export async function getWorkingDiff(root: string): Promise<DiffSummary> {
  const git: SimpleGit = simpleGit(root);
  const isRepo = await git.checkIsRepo().catch(() => false);
  if (!isRepo) {
    return { isRepo: false, changedFiles: [], insertions: 0, deletions: 0, raw: "" };
  }
  const status = await git.status();
  const changedFiles = [
    ...status.modified,
    ...status.not_added,
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
  return { isRepo: true, changedFiles: Array.from(new Set(changedFiles)), insertions, deletions, raw };
}
