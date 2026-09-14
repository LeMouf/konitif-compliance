import {
  KONITIF_COMPLIANCE_SCHEMA_VERSION,
  type ComplianceComparisonChange,
  type ComplianceComparisonItem,
  type ComplianceComparisonReport,
  type ComplianceEvidence,
  type ComplianceReport,
  type ComplianceSnapshotManifest,
  type ComplianceStatus
} from './schema.js';

export interface CreateComplianceSnapshotManifestInput {
  report: ComplianceReport;
  platform: string;
  profiles: readonly string[];
  commands: readonly string[];
  rawEvidencePaths: readonly string[];
  previousSnapshot?: string | null;
}

export function createComplianceSnapshotManifest(
  input: CreateComplianceSnapshotManifestInput
): ComplianceSnapshotManifest {
  return {
    schemaVersion: input.report.schemaVersion,
    ruleSetVersion: input.report.ruleSetVersion,
    productVersion: input.report.product.version,
    sourceCommit: input.report.environment.sourceCommit,
    generatedFromCleanTree: input.report.environment.cleanTree,
    platform: input.platform,
    profiles: [...input.profiles].sort(),
    commands: [...input.commands],
    collectorVersions: Object.fromEntries(
      input.report.sources.map((source) => [source.id, source.version ?? 'unknown'])
    ),
    rawEvidencePaths: [...input.rawEvidencePaths].sort(),
    previousSnapshot: input.previousSnapshot ?? null
  };
}

export function compareComplianceReports(
  before: ComplianceReport,
  after: ComplianceReport
): ComplianceComparisonReport {
  const compatible = before.schemaVersion === after.schemaVersion
    && before.ruleSetVersion === after.ruleSetVersion
    && before.product.productId === after.product.productId;
  const beforeById = new Map(before.evidence.map((evidence) => [evidence.id, evidence]));
  const afterById = new Map(after.evidence.map((evidence) => [evidence.id, evidence]));
  const ids = [...new Set([...beforeById.keys(), ...afterById.keys()])].sort();
  const items = ids.map((id) => compareEvidence(id, beforeById.get(id) ?? null, afterById.get(id) ?? null));

  return {
    schemaVersion: KONITIF_COMPLIANCE_SCHEMA_VERSION,
    compatible,
    beforeReportId: before.reportId,
    afterReportId: after.reportId,
    items
  };
}

function compareEvidence(
  id: string,
  before: ComplianceEvidence | null,
  after: ComplianceEvidence | null
): ComplianceComparisonItem {
  const dimension = after?.dimension ?? before?.dimension ?? 'architecture';

  return {
    id,
    dimension,
    beforeStatus: before?.status ?? null,
    afterStatus: after?.status ?? null,
    change: resolveChange(before?.status ?? null, after?.status ?? null)
  };
}

function resolveChange(before: ComplianceStatus | null, after: ComplianceStatus | null): ComplianceComparisonChange {
  if (!before && after) {
    return after === 'NOT_MEASURED' ? 'NO_LONGER_MEASURED' : 'NEW_FINDING';
  }

  if (before && !after) {
    return 'RESOLVED_FINDING';
  }

  if (before === after) {
    return 'UNCHANGED';
  }

  if (before === 'NOT_MEASURED' && after && after !== 'NOT_MEASURED') {
    return 'NEWLY_MEASURED';
  }

  if (after === 'NOT_MEASURED') {
    return 'NO_LONGER_MEASURED';
  }

  return statusRank(after) < statusRank(before) ? 'IMPROVED' : 'REGRESSED';
}

function statusRank(status: ComplianceStatus | null): number {
  switch (status) {
    case 'COMPLIANT':
      return 0;
    case 'BASELINED':
      return 1;
    case 'PARTIAL':
      return 2;
    case 'REVIEW_REQUIRED':
      return 3;
    case 'NOT_MEASURED':
      return 4;
    case 'NON_COMPLIANT':
      return 5;
    default:
      return 6;
  }
}
