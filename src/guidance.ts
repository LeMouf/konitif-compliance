import type { ComplianceEvidence, ComplianceGuidanceItem, ComplianceReport } from './schema.js';

export function createComplianceGuidance(report: ComplianceReport): ComplianceGuidanceItem[] {
  return report.evidence
    .filter((evidence) =>
      evidence.status === 'NON_COMPLIANT'
      || evidence.status === 'REVIEW_REQUIRED'
      || evidence.status === 'NOT_MEASURED'
      || evidence.status === 'PARTIAL'
    )
    .map((evidence) => createGuidanceItem(evidence))
    .sort((left, right) => left.priority - right.priority || left.id.localeCompare(right.id));
}

function createGuidanceItem(evidence: ComplianceEvidence): ComplianceGuidanceItem {
  return {
    id: `guidance:${evidence.id}`,
    priority: resolvePriority(evidence),
    owner: evidence.owner,
    dimension: evidence.dimension,
    status: evidence.status,
    evidenceId: evidence.id,
    action: resolveAction(evidence),
    reason: evidence.summary
  };
}

function resolvePriority(evidence: ComplianceEvidence): number {
  if (evidence.status === 'NON_COMPLIANT' && evidence.criticality === 'blocking') {
    return 10;
  }

  if (evidence.status === 'REVIEW_REQUIRED') {
    return 30;
  }

  if (evidence.status === 'NOT_MEASURED') {
    return 40;
  }

  if (evidence.status === 'PARTIAL') {
    return 50;
  }

  return 90;
}

function resolveAction(evidence: ComplianceEvidence): string {
  if (evidence.status === 'NON_COMPLIANT') {
    return `Resolve blocking ${evidence.dimension} evidence: ${evidence.id}.`;
  }

  if (evidence.status === 'REVIEW_REQUIRED') {
    return `Review unresolved ${evidence.dimension} evidence: ${evidence.id}.`;
  }

  if (evidence.status === 'NOT_MEASURED') {
    return `Provide measurement evidence for ${evidence.dimension}: ${evidence.id}.`;
  }

  return `Complete partial ${evidence.dimension} evidence: ${evidence.id}.`;
}
