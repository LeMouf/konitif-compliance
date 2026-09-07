import { sortComplianceEvidence } from './evidence.js';
import {
  KONITIF_COMPLIANCE_SCHEMA_VERSION,
  COMPLIANCE_DIMENSIONS,
  type ComplianceCollectorResult,
  type ComplianceDimension,
  type ComplianceDimensionResult,
  type ComplianceEnvironment,
  type ComplianceEvidence,
  type ComplianceProductIdentity,
  type ComplianceReport,
  type ComplianceSourceIdentity,
  type ComplianceStatus
} from './schema.js';

export interface CreateComplianceReportInput {
  reportId: string;
  ruleSetVersion: string;
  product: ComplianceProductIdentity;
  environment: ComplianceEnvironment;
  collectorResults: readonly ComplianceCollectorResult[];
}

export function createComplianceReport(input: CreateComplianceReportInput): ComplianceReport {
  const sources = sortSources(input.collectorResults.map((result) => result.source));
  const evidence = sortComplianceEvidence(input.collectorResults.flatMap((result) => result.evidence));
  const dimensions = COMPLIANCE_DIMENSIONS.map((dimension) => evaluateDimension(dimension, evidence));
  const blockers = evidence.filter((item) => item.status === 'NON_COMPLIANT' && item.criticality === 'blocking');
  const globalStatus = evaluateGlobalStatus(dimensions, blockers);

  return {
    schemaVersion: KONITIF_COMPLIANCE_SCHEMA_VERSION,
    ruleSetVersion: input.ruleSetVersion,
    reportId: input.reportId,
    product: input.product,
    environment: input.environment,
    sources,
    dimensions,
    evidence,
    globalStatus,
    blockers,
    guidance: []
  };
}

export function evaluateDimension(
  dimension: ComplianceDimension,
  evidence: readonly ComplianceEvidence[]
): ComplianceDimensionResult {
  const dimensionEvidence = evidence.filter((item) => item.dimension === dimension);
  const blockerCount = dimensionEvidence.filter((item) => item.status === 'NON_COMPLIANT' && item.criticality === 'blocking').length;
  const reviewCount = dimensionEvidence.filter((item) => item.status === 'REVIEW_REQUIRED').length;
  const notMeasuredCount = dimensionEvidence.filter((item) => item.status === 'NOT_MEASURED').length;

  return {
    dimension,
    status: resolveDimensionStatus(dimensionEvidence, blockerCount, reviewCount, notMeasuredCount),
    evidenceCount: dimensionEvidence.length,
    blockerCount,
    reviewCount,
    notMeasuredCount,
    evidenceIds: dimensionEvidence.map((item) => item.id).sort()
  };
}

export function evaluateGlobalStatus(
  dimensions: readonly ComplianceDimensionResult[],
  blockers: readonly ComplianceEvidence[]
): ComplianceStatus {
  if (blockers.length > 0 || dimensions.some((dimension) => dimension.status === 'NON_COMPLIANT')) {
    return 'NON_COMPLIANT';
  }

  if (dimensions.some((dimension) => dimension.status === 'REVIEW_REQUIRED')) {
    return 'REVIEW_REQUIRED';
  }

  if (dimensions.some((dimension) => dimension.status === 'NOT_MEASURED')) {
    return 'NOT_MEASURED';
  }

  if (dimensions.some((dimension) => dimension.status === 'PARTIAL')) {
    return 'PARTIAL';
  }

  if (dimensions.some((dimension) => dimension.status === 'BASELINED')) {
    return 'BASELINED';
  }

  return 'COMPLIANT';
}

export function attachGuidance(report: ComplianceReport, guidance: ComplianceReport['guidance']): ComplianceReport {
  return {
    ...report,
    guidance: [...guidance].sort((left, right) => left.priority - right.priority || left.id.localeCompare(right.id))
  };
}

function resolveDimensionStatus(
  evidence: readonly ComplianceEvidence[],
  blockerCount: number,
  reviewCount: number,
  notMeasuredCount: number
): ComplianceStatus {
  if (evidence.length === 0) {
    return 'NOT_MEASURED';
  }

  if (blockerCount > 0) {
    return 'NON_COMPLIANT';
  }

  if (reviewCount > 0) {
    return 'REVIEW_REQUIRED';
  }

  if (notMeasuredCount > 0) {
    return evidence.length === notMeasuredCount ? 'NOT_MEASURED' : 'PARTIAL';
  }

  if (evidence.some((item) => item.status === 'PARTIAL')) {
    return 'PARTIAL';
  }

  if (evidence.some((item) => item.status === 'BASELINED')) {
    return 'BASELINED';
  }

  return 'COMPLIANT';
}

function sortSources(sources: readonly ComplianceSourceIdentity[]): ComplianceSourceIdentity[] {
  const byId = new Map<string, ComplianceSourceIdentity>();

  for (const source of sources) {
    byId.set(source.id, source);
  }

  return [...byId.values()].sort((left, right) => left.id.localeCompare(right.id));
}
