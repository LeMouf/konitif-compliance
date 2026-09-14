# @konitif/compliance

Deterministic evidence, policy evaluation and report contracts for assessing an
identified subject without conflating collected facts with a verdict.

## Installation

```sh
npm install @konitif/compliance
```

## What it provides

- Evidence and compliance-report contracts.
- Deterministic dimension aggregation and blocker evaluation.
- Snapshot manifests and comparisons.
- Guidance and report rendering derived from explicit findings.
- Repository-purity and validation models for build or release tooling.

## Authority boundary

This package owns generic assessment contracts and deterministic evaluation
rules. Callers own their collectors, policy profiles, promotion decisions and
the identity of the assessed subject. Guidance explains a verdict; it cannot
rewrite the evidence or turn missing evidence into success.

## Quick start

```ts
import { createComplianceReport } from '@konitif/compliance';

const report = createComplianceReport({
  reportId: 'subject:1.0.0:local',
  ruleSetVersion: 'baseline.v1',
  product: {
    productId: 'subject',
    productName: 'Example subject',
    version: '1.0.0',
  },
  environment: {
    sourceCommit: 'local',
    cleanTree: false,
  },
  collectorResults: [],
});
```

The `product` property is retained for API compatibility and identifies the
subject under assessment; it does not make this package a domain policy
authority.

## Public entry points

| Entry | Purpose |
| --- | --- |
| `@konitif/compliance` | Evidence, policy, report, snapshot and guidance contracts. |

## Reference

See [`reference/`](reference/) for the machine-readable capability catalog and
authority diagram. These artifacts describe the package; they are not an
assessment policy or executable configuration.

## License

Source-available under [PolyForm Noncommercial 1.0.0](LICENSE.md), not OSI open
source. Commercial use requires separate written authorization.
