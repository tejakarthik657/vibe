import * as fs from "fs";
import * as path from "path";
import { StorageAdapter } from "./interfaces/storage-adapter";
import { JSONStorageAdapter } from "./json-adapter";
import { SQLiteStorageAdapter } from "./sqlite-adapter";

export function getStorageAdapter(rootPath: string): StorageAdapter {
  const cfgPath = path.join(rootPath, ".vibe", "config.json");
  let storageType = "sqlite";
  if (fs.existsSync(cfgPath)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf-8"));
      if (cfg.storage === "json") {
        storageType = "json";
      }
    } catch {
      // Default to sqlite
    }
  }

  if (storageType === "json") {
    return new JSONStorageAdapter(rootPath);
  }
  return new SQLiteStorageAdapter(rootPath);
}
