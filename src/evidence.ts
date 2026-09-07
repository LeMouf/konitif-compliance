import type {
  ComplianceCriticality,
  ComplianceDimension,
  ComplianceEvidence,
  ComplianceEvidenceKind,
  ComplianceMeasurementState,
  ComplianceStatus,
  ComplianceTrust
} from './schema.js';

export interface CreateComplianceEvidenceInput {
  id: string;
  dimension: ComplianceDimension;
  sourceId: string;
  owner: string;
  kind: ComplianceEvidenceKind;
  status: ComplianceStatus;
  criticality?: ComplianceCriticality;
  trust?: ComplianceTrust;
  measurementState?: ComplianceMeasurementState;
  summary: string;
  details?: Record<string, unknown>;
  rawArtifactPath?: string;
}

export function createComplianceEvidence(input: CreateComplianceEvidenceInput): ComplianceEvidence {
  return {
    id: input.id,
    dimension: input.dimension,
    sourceId: input.sourceId,
    owner: input.owner,
    kind: input.kind,
    status: input.status,
    criticality: input.criticality ?? resolveCriticality(input.status),
    trust: input.trust ?? 'medium',
    measurementState: input.measurementState ?? (input.status === 'NOT_MEASURED' ? 'NOT_MEASURED' : 'MEASURED'),
    baselineState: input.status === 'BASELINED' ? 'BASELINED' : 'UNKNOWN',
    summary: input.summary,
    details: input.details,
    rawArtifactPath: input.rawArtifactPath
  };
}

export function sortComplianceEvidence(evidence: readonly ComplianceEvidence[]): ComplianceEvidence[] {
  return [...evidence].sort((left, right) => left.id.localeCompare(right.id));
}

function resolveCriticality(status: ComplianceStatus): ComplianceCriticality {
  if (status === 'NON_COMPLIANT') {
    return 'blocking';
  }

  if (status === 'REVIEW_REQUIRED' || status === 'NOT_MEASURED') {
    return 'review-required';
  }

  return 'non-blocking';
}
