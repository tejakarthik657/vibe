import { GuardReport } from "./guard";
import { DoctorFinding } from "./doctor";

export interface SarifLog {
  $schema: string;
  version: string;
  runs: SarifRun[];
}

export interface SarifRun {
  tool: {
    driver: {
      name: string;
      version: string;
      informationUri: string;
      rules: SarifRule[];
    };
  };
  results: SarifResult[];
}

export interface SarifRule {
  id: string;
  name: string;
  shortDescription: { text: string };
  defaultConfiguration: {
    level: "error" | "warning" | "note";
  };
}

export interface SarifResult {
  ruleId: string;
  level: "error" | "warning" | "note";
  message: { text: string };
  locations?: {
    physicalLocation: {
      artifactLocation: { uri: string };
    };
  }[];
}

export function generateGuardSarif(report: GuardReport): SarifLog {
  const rules: SarifRule[] = [];
  const results: SarifResult[] = [];

  for (const [index, check] of report.checks.entries()) {
    const ruleId = `VIBE-GUARD-${String(index + 1).padStart(3, "0")}`;
    const level: "error" | "warning" | "note" =
      check.status === "block" ? "error" : check.status === "warning" ? "warning" : "note";

    rules.push({
      id: ruleId,
      name: check.name.replace(/\s+/g, ""),
      shortDescription: { text: check.name },
      defaultConfiguration: { level },
    });

    if (check.status !== "ok") {
      results.push({
        ruleId,
        level,
        message: { text: `${check.name}: ${check.detail} (risk: ${check.risk.toFixed(2)})` },
      });
    }
  }

  return {
    $schema: "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
    version: "2.1.0",
    runs: [
      {
        tool: {
          driver: {
            name: "VIBE Guard",
            version: "0.4.5",
            informationUri: "https://github.com/tejakarthik657/vibe",
            rules,
          },
        },
        results,
      },
    ],
  };
}

export function generateDoctorSarif(findings: DoctorFinding[]): SarifLog {
  const rules: SarifRule[] = [];
  const results: SarifResult[] = [];

  for (const [index, finding] of findings.entries()) {
    const ruleId = `VIBE-DOC-${String(index + 1).padStart(3, "0")}`;
    const level: "error" | "warning" | "note" =
      finding.severity === "critical" || finding.severity === "high"
        ? "error"
        : finding.severity === "medium"
        ? "warning"
        : "note";

    rules.push({
      id: ruleId,
      name: `DoctorDiagnostic${finding.severity}`,
      shortDescription: { text: finding.message.slice(0, 80) },
      defaultConfiguration: { level },
    });

    results.push({
      ruleId,
      level,
      message: { text: finding.message },
    });
  }

  return {
    $schema: "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
    version: "2.1.0",
    runs: [
      {
        tool: {
          driver: {
            name: "VIBE Doctor",
            version: "0.4.5",
            informationUri: "https://github.com/tejakarthik657/vibe",
            rules,
          },
        },
        results,
      },
    ],
  };
}
