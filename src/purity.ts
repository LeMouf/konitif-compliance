export const KONITIF_PURITY_SCHEMA_VERSION = 'konitif-repository-purity.v1';
export const KONITIF_PURITY_TARGET_VERSION = '1.0.0';

export type PurityStatus =
  | 'PURE'
  | 'CONVERGING'
  | 'IMPURE'
  | 'REVIEW_REQUIRED'
  | 'NOT_MEASURED'
  | 'BASELINED';

export type PurityFindingConfidence =
  | 'PROVEN'
  | 'HIGH_CONFIDENCE'
  | 'POSSIBLE'
  | 'REVIEW_ONLY';

export type PurityFindingPriority =
  | 'V1_BLOCKER'
  | 'V1_REQUIRED'
  | 'V1_RECOMMENDED'
  | 'POST_V1'
  | 'REVIEW';

export type PurityDimension =
  | 'target'
  | 'authority'
  | 'duplicates'
  | 'legacy'
  | 'packages'
  | 'configuration'
  | 'tests-docs'
  | 'product-surface'
  | 'conformance-compliance';

export interface PurityTargetAuthority {
  authority: string;
  status: 'MEASURED' | 'PARTIALLY_MEASURED' | 'NOT_MEASURED' | 'REVIEW_REQUIRED';
  owner: string;
}

export interface PurityTargetContract {
  schemaVersion: string;
  targetVersion: string;
  canonicalAuthorities: Record<string, PurityTargetAuthority>;
  allowedRegistries: Record<string, string>;
  profiles: string[];
  packageResponsibilities: Record<string, string>;
  legacyPolicy: Record<string, unknown>;
  duplicatePolicy: Record<string, unknown>;
  releaseRequirements: Record<string, unknown>;
}

export interface PurityFinding {
  id: string;
  fingerprint: string;
  dimension: PurityDimension;
  status: PurityStatus;
  confidence: PurityFindingConfidence;
  priority: PurityFindingPriority;
  owner: string;
  evidence: string;
  canonicalTarget: string;
  recommendedAction: string;
}

export interface PurityAuthorityMapEntry {
  conceptId: string;
  canonicalAuthority: string;
  writableSources: string[];
  derivedProjections: string[];
  persistenceOwner: string | null;
  runtimeOwner: string | null;
  uiConsumers: string[];
  migrationPath: string | null;
  confidence: PurityFindingConfidence;
}

export interface PurityReportMetrics {
  uniqueAuthorities: number;
  provenDuplicates: number;
  possibleOverlaps: number;
  unownedLegacy: number;
  packageDrifts: number;
  configDrifts: number;
  testDocFindings: number;
  v1Blockers: number;
  v1Required: number;
  notMeasured: number;
}

export interface PurityReport {
  schemaVersion: string;
  targetVersion: string;
  reportId: string;
  productVersion: string;
  sourceCommit: string;
  cleanTree: boolean;
  status: PurityStatus;
  metrics: PurityReportMetrics;
  target: {
    path: string;
    authorityCount: number;
    unresolvedAuthorities: string[];
  };
  authorityMap: PurityAuthorityMapEntry[];
  findings: PurityFinding[];
  guidance: PurityGuidanceItem[];
  consumedEvidence: {
    conformanceReportPath: string | null;
    complianceReportPath: string | null;
  };
}

export interface PurityGuidanceItem {
  id: string;
  priority: number;
  owner: string;
  findingId: string;
  action: string;
}

export interface PuritySnapshotManifest {
  schemaVersion: string;
  targetVersion: string;
  productVersion: string;
  sourceCommit: string;
  cleanTree: boolean;
  platform: string;
  collectorVersions: Record<string, string>;
  conformanceReportId: string | null;
  complianceReportId: string | null;
}

export interface PurityComparisonItem {
  id: string;
  change:
    | 'IMPROVED'
    | 'REGRESSED'
    | 'UNCHANGED'
    | 'NEWLY_MEASURED'
    | 'NO_LONGER_MEASURED'
    | 'NEW_FINDING'
    | 'RESOLVED_FINDING';
  beforeStatus: PurityStatus | null;
  afterStatus: PurityStatus | null;
}

export interface PurityComparisonReport {
  schemaVersion: string;
  compatible: boolean;
  beforeReportId: string;
  afterReportId: string;
  items: PurityComparisonItem[];
}

export function createPurityReport(input: {
  reportId: string;
  productVersion: string;
  sourceCommit: string;
  cleanTree: boolean;
  targetPath: string;
  target: PurityTargetContract;
  authorityMap: readonly PurityAuthorityMapEntry[];
  findings: readonly PurityFinding[];
  conformanceReportPath?: string | null;
  complianceReportPath?: string | null;
}): PurityReport {
  const findings = sortPurityFindings(input.findings);
  const metrics = createPurityMetrics(findings, input.authorityMap);
  const unresolvedAuthorities = Object.entries(input.target.canonicalAuthorities)
    .filter(([, authority]) => authority.status === 'REVIEW_REQUIRED' || authority.status === 'NOT_MEASURED')
    .map(([concept]) => concept)
    .sort();
  const status = evaluatePurityStatus(findings, unresolvedAuthorities);

  return {
    schemaVersion: KONITIF_PURITY_SCHEMA_VERSION,
    targetVersion: input.target.targetVersion,
    reportId: input.reportId,
    productVersion: input.productVersion,
    sourceCommit: input.sourceCommit,
    cleanTree: input.cleanTree,
    status,
    metrics,
    target: {
      path: input.targetPath,
      authorityCount: Object.keys(input.target.canonicalAuthorities).length,
      unresolvedAuthorities
    },
    authorityMap: [...input.authorityMap].sort((left, right) => left.conceptId.localeCompare(right.conceptId)),
    findings,
    guidance: createPurityGuidance(findings),
    consumedEvidence: {
      conformanceReportPath: input.conformanceReportPath ?? null,
      complianceReportPath: input.complianceReportPath ?? null
    }
  };
}

export function evaluatePurityStatus(
  findings: readonly PurityFinding[],
  unresolvedAuthorities: readonly string[] = []
): PurityStatus {
  if (findings.some((finding) => finding.priority === 'V1_BLOCKER' && finding.confidence === 'PROVEN')) {
    return 'IMPURE';
  }

  if (
    findings.some((finding) => finding.priority === 'V1_BLOCKER' || finding.confidence === 'HIGH_CONFIDENCE')
    || unresolvedAuthorities.length > 0
    || findings.some((finding) => finding.status === 'REVIEW_REQUIRED')
  ) {
    return 'REVIEW_REQUIRED';
  }

  if (findings.some((finding) => finding.priority === 'V1_REQUIRED' || finding.priority === 'V1_RECOMMENDED')) {
    return 'CONVERGING';
  }

  if (findings.some((finding) => finding.status === 'NOT_MEASURED')) {
    return 'NOT_MEASURED';
  }

  if (findings.some((finding) => finding.status === 'BASELINED')) {
    return 'BASELINED';
  }

  return 'PURE';
}

export function createPurityMetrics(
  findings: readonly PurityFinding[],
  authorityMap: readonly PurityAuthorityMapEntry[]
): PurityReportMetrics {
  return {
    uniqueAuthorities: new Set(authorityMap.map((entry) => entry.canonicalAuthority)).size,
    provenDuplicates: findings.filter((finding) => finding.id.includes('duplicate') && finding.confidence === 'PROVEN').length,
    possibleOverlaps: findings.filter((finding) => finding.id.includes('overlap') || finding.confidence === 'POSSIBLE').length,
    unownedLegacy: findings.filter((finding) => finding.id.includes('legacy') && finding.owner === 'unknown').length,
    packageDrifts: findings.filter((finding) => finding.dimension === 'packages').length,
    configDrifts: findings.filter((finding) => finding.dimension === 'configuration').length,
    testDocFindings: findings.filter((finding) => finding.dimension === 'tests-docs').length,
    v1Blockers: findings.filter((finding) => finding.priority === 'V1_BLOCKER').length,
    v1Required: findings.filter((finding) => finding.priority === 'V1_REQUIRED').length,
    notMeasured: findings.filter((finding) => finding.status === 'NOT_MEASURED').length
  };
}

export function createPurityGuidance(findings: readonly PurityFinding[]): PurityGuidanceItem[] {
  return sortPurityFindings(findings)
    .filter((finding) => finding.priority !== 'POST_V1')
    .map((finding) => ({
      id: `purity-guidance:${finding.id}`,
      priority: priorityRank(finding.priority),
      owner: finding.owner,
      findingId: finding.id,
      action: finding.recommendedAction
    }))
    .sort((left, right) => left.priority - right.priority || left.id.localeCompare(right.id));
}

export function createPuritySnapshotManifest(input: {
  report: PurityReport;
  platform: string;
}): PuritySnapshotManifest {
  return {
    schemaVersion: input.report.schemaVersion,
    targetVersion: input.report.targetVersion,
    productVersion: input.report.productVersion,
    sourceCommit: input.report.sourceCommit,
    cleanTree: input.report.cleanTree,
    platform: input.platform,
    collectorVersions: {
      target: KONITIF_PURITY_SCHEMA_VERSION,
      authority: KONITIF_PURITY_SCHEMA_VERSION,
      duplicates: KONITIF_PURITY_SCHEMA_VERSION,
      legacy: KONITIF_PURITY_SCHEMA_VERSION,
      packages: KONITIF_PURITY_SCHEMA_VERSION,
      configuration: KONITIF_PURITY_SCHEMA_VERSION
    },
    conformanceReportId: input.report.consumedEvidence.conformanceReportPath,
    complianceReportId: input.report.consumedEvidence.complianceReportPath
  };
}

export function comparePurityReports(before: PurityReport, after: PurityReport): PurityComparisonReport {
  const beforeById = new Map(before.findings.map((finding) => [finding.id, finding]));
  const afterById = new Map(after.findings.map((finding) => [finding.id, finding]));
  const ids = [...new Set([...beforeById.keys(), ...afterById.keys()])].sort();

  return {
    schemaVersion: KONITIF_PURITY_SCHEMA_VERSION,
    compatible: before.schemaVersion === after.schemaVersion && before.targetVersion === after.targetVersion,
    beforeReportId: before.reportId,
    afterReportId: after.reportId,
    items: ids.map((id) => {
      const beforeFinding = beforeById.get(id) ?? null;
      const afterFinding = afterById.get(id) ?? null;
      return {
        id,
        beforeStatus: beforeFinding?.status ?? null,
        afterStatus: afterFinding?.status ?? null,
        change: comparePurityStatus(beforeFinding?.status ?? null, afterFinding?.status ?? null)
      };
    })
  };
}

function sortPurityFindings(findings: readonly PurityFinding[]): PurityFinding[] {
  return [...findings].sort((left, right) =>
    priorityRank(left.priority) - priorityRank(right.priority)
    || confidenceRank(left.confidence) - confidenceRank(right.confidence)
    || left.id.localeCompare(right.id)
  );
}

function priorityRank(priority: PurityFindingPriority): number {
  switch (priority) {
    case 'V1_BLOCKER':
      return 10;
    case 'V1_REQUIRED':
      return 20;
    case 'V1_RECOMMENDED':
      return 30;
    case 'REVIEW':
      return 40;
    case 'POST_V1':
      return 50;
  }
}

function confidenceRank(confidence: PurityFindingConfidence): number {
  switch (confidence) {
    case 'PROVEN':
      return 0;
    case 'HIGH_CONFIDENCE':
      return 1;
    case 'POSSIBLE':
      return 2;
    case 'REVIEW_ONLY':
      return 3;
  }
}

function comparePurityStatus(before: PurityStatus | null, after: PurityStatus | null): PurityComparisonItem['change'] {
  if (!before && after) {
    return after === 'NOT_MEASURED' ? 'NO_LONGER_MEASURED' : 'NEW_FINDING';
  }
  if (before && !after) {
    return 'RESOLVED_FINDING';
  }
  if (before === after) {
    return 'UNCHANGED';
  }
  if (before === 'NOT_MEASURED' && after !== 'NOT_MEASURED') {
    return 'NEWLY_MEASURED';
  }
  if (after === 'NOT_MEASURED') {
    return 'NO_LONGER_MEASURED';
  }
  return statusRank(after) < statusRank(before) ? 'IMPROVED' : 'REGRESSED';
}

function statusRank(status: PurityStatus | null): number {
  switch (status) {
    case 'PURE':
      return 0;
    case 'BASELINED':
      return 1;
    case 'CONVERGING':
      return 2;
    case 'REVIEW_REQUIRED':
      return 3;
    case 'NOT_MEASURED':
      return 4;
    case 'IMPURE':
      return 5;
    default:
      return 6;
  }
}
