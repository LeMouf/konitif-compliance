import { createComplianceEvidence } from './evidence.js';
import type {
  ComplianceCollector,
  ComplianceCollectorContext,
  ComplianceCollectorResult,
  ComplianceSourceIdentity
} from './schema.js';

export async function runComplianceCollectors(
  collectors: readonly ComplianceCollector[],
  context: ComplianceCollectorContext
): Promise<ComplianceCollectorResult[]> {
  const results: ComplianceCollectorResult[] = [];

  for (const collector of collectors) {
    results.push(await runCollectorWithTimeout(collector, context));
  }

  return results.sort((left, right) => left.source.id.localeCompare(right.source.id));
}

async function runCollectorWithTimeout(
  collector: ComplianceCollector,
  context: ComplianceCollectorContext
): Promise<ComplianceCollectorResult> {
  const timeoutMs = collector.timeoutMs ?? 5000;
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      collector.collect(context),
      new Promise<ComplianceCollectorResult>((resolve) => {
        timeout = setTimeout(() => {
          resolve({
            source: createTimeoutSource(collector),
            evidence: [
              createComplianceEvidence({
                id: `${collector.id}.timeout`,
                dimension: collector.dimension,
                sourceId: collector.id,
                owner: 'compliance',
                kind: 'exception',
                status: 'NOT_MEASURED',
                summary: `Collector timed out after ${timeoutMs}ms.`
              })
            ]
          });
        }, timeoutMs);
      })
    ]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

function createTimeoutSource(collector: ComplianceCollector): ComplianceSourceIdentity {
  return {
    id: collector.id,
    owner: 'compliance',
    format: 'collector',
    path: collector.id,
    scope: collector.dimension,
    freshness: 'current',
    deterministic: false,
    cost: 'low',
    trust: 'unknown',
    reusable: true
  };
}
