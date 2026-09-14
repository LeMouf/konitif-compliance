export const KONITIF_COMPLIANCE_SCHEMA_VERSION = 'konitif-compliance-report.v1';

export type ComplianceStatus =
  | 'COMPLIANT'
  | 'PARTIAL'
  | 'NON_COMPLIANT'
  | 'REVIEW_REQUIRED'
  | 'NOT_MEASURED'
  | 'BASELINED';

export type ComplianceDimension =
  | 'architecture'
  | 'design-system'
  | 'tests'
  | 'documentation'
  | 'product-surface'
  | 'build-release'
  | 'repository-purity'
  | 'language-terminology'
  | 'security-supply-chain'
  | 'runtime-health'
  | 'accessibility'
  | 'data-privacy'
  | 'compatibility-migrations'
  | 'reproducibility'
  | 'licensing-provenance'
  | 'human-ux';

export type ComplianceEvidenceKind =
  | 'assertion'
  | 'measurement'
  | 'observation'
  | 'review'
  | 'exception'
  | 'baseline'
  | 'artifact-proof';

export type ComplianceCriticality =
  | 'blocking'
  | 'non-blocking'
  | 'informational'
  | 'review-required';

export type ComplianceTrust = 'high' | 'medium' | 'low' | 'unknown';
export type ComplianceMeasurementState =
  | 'MEASURED'
  | 'NOT_MEASURED'
  | 'NOT_RUN'
  | 'REUSED'
  | 'SKIPPED'
  | 'QUARANTINED'
  | 'MANUAL_QA'
  | 'PASSED';
export type ComplianceBaselineState = 'NEW' | 'BASELINED' | 'UNCHANGED' | 'REGRESSED' | 'IMPROVED' | 'UNKNOWN';

export interface ComplianceProductIdentity {
  productId: string;
  productName: string;
  version: string;
  profile?: string;
}

export interface ComplianceSourceIdentity {
  id: string;
  version?: string;
  owner: string;
  format: string;
  path?: string;
  generationCommand?: string;
  scope: string;
  freshness: 'current' | 'stored' | 'unknown';
  deterministic: boolean;
  cost: 'low' | 'medium' | 'high';
  trust: ComplianceTrust;
  reusable: boolean;
}

export interface ComplianceEnvironment {
  sourceCommit: string;
  branch?: string;
  platform?: string;
  cleanTree: boolean;
}

export interface ComplianceEvidence {
  id: string;
  dimension: ComplianceDimension;
  sourceId: string;
  owner: string;
  kind: ComplianceEvidenceKind;
  status: ComplianceStatus;
  criticality: ComplianceCriticality;
  trust: ComplianceTrust;
  measurementState: ComplianceMeasurementState;
  baselineState: ComplianceBaselineState;
  summary: string;
  details?: Record<string, unknown>;
  rawArtifactPath?: string;
}

export interface ComplianceDimensionResult {
  dimension: ComplianceDimension;
  status: ComplianceStatus;
  evidenceCount: number;
  blockerCount: number;
  reviewCount: number;
  notMeasuredCount: number;
  evidenceIds: string[];
}

export interface ComplianceReport {
  schemaVersion: string;
  ruleSetVersion: string;
  reportId: string;
  product: ComplianceProductIdentity;
  environment: ComplianceEnvironment;
  sources: ComplianceSourceIdentity[];
  dimensions: ComplianceDimensionResult[];
  evidence: ComplianceEvidence[];
  globalStatus: ComplianceStatus;
  blockers: ComplianceEvidence[];
  guidance: ComplianceGuidanceItem[];
}

export interface ComplianceGuidanceItem {
  id: string;
  priority: number;
  owner: string;
  dimension: ComplianceDimension;
  status: ComplianceStatus;
  action: string;
  evidenceId: string;
  reason: string;
}

export interface ComplianceCollectorContext {
  product: ComplianceProductIdentity;
  environment: ComplianceEnvironment;
}

export interface ComplianceCollectorResult {
  source: ComplianceSourceIdentity;
  evidence: ComplianceEvidence[];
}

export interface ComplianceCollector {
  id: string;
  dimension: ComplianceDimension;
  timeoutMs?: number;
  collect(context: ComplianceCollectorContext): Promise<ComplianceCollectorResult>;
}

export interface ComplianceSnapshotManifest {
  schemaVersion: string;
  ruleSetVersion: string;
  productVersion: string;
  sourceCommit: string;
  generatedFromCleanTree: boolean;
  platform: string;
  profiles: string[];
  commands: string[];
  collectorVersions: Record<string, string>;
  rawEvidencePaths: string[];
  previousSnapshot?: string | null;
}

export type ComplianceComparisonChange =
  | 'IMPROVED'
  | 'REGRESSED'
  | 'UNCHANGED'
  | 'NEWLY_MEASURED'
  | 'NO_LONGER_MEASURED'
  | 'NEW_FINDING'
  | 'RESOLVED_FINDING';

export interface ComplianceComparisonItem {
  id: string;
  dimension: ComplianceDimension;
  change: ComplianceComparisonChange;
  beforeStatus: ComplianceStatus | null;
  afterStatus: ComplianceStatus | null;
}

export interface ComplianceComparisonReport {
  schemaVersion: string;
  compatible: boolean;
  beforeReportId: string;
  afterReportId: string;
  items: ComplianceComparisonItem[];
}

export const COMPLIANCE_DIMENSIONS: readonly ComplianceDimension[] = [
  'architecture',
  'design-system',
  'tests',
  'documentation',
  'product-surface',
  'build-release',
  'repository-purity',
  'language-terminology',
  'security-supply-chain',
  'runtime-health',
  'accessibility',
  'data-privacy',
  'compatibility-migrations',
  'reproducibility',
  'licensing-provenance',
  'human-ux'
];

export const COMPLIANCE_STATUS_ORDER: readonly ComplianceStatus[] = [
  'COMPLIANT',
  'BASELINED',
  'PARTIAL',
  'REVIEW_REQUIRED',
  'NOT_MEASURED',
  'NON_COMPLIANT'
];
