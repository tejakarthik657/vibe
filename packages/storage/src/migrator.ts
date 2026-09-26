import { JSONStorageAdapter } from "./json-adapter";
import { SQLiteStorageAdapter } from "./sqlite-adapter";

export async function migrateJSONToSQLite(rootPath: string): Promise<{ migratedState: boolean; decisionLogsCount: number }> {
  const jsonAdapter = new JSONStorageAdapter(rootPath);
  const sqliteAdapter = new SQLiteStorageAdapter(rootPath);

  await jsonAdapter.initialize();
  await sqliteAdapter.initialize();

  // 1. Migrate State
  let migratedState = false;
  const jsonState = await jsonAdapter.loadState();
  if (jsonState) {
    await sqliteAdapter.saveState(jsonState);
    migratedState = true;
  }

  // 2. Migrate Decisions Log
  const jsonLogs = await jsonAdapter.getDecisionLogs();
  for (const log of jsonLogs) {
    await sqliteAdapter.logDecision(log);
  }

  return {
    migratedState,
    decisionLogsCount: jsonLogs.length,
  };
}
