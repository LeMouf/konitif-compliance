# @konitif/compliance

`@konitif/compliance` is the generic evidence and compliance engine for KONITIF-based systems.

It models evidence, aggregates dimensions, evaluates blockers, creates guidance, renders reports, compares snapshots and validates the trust of repository meta-tooling. It does not define a product's collectors or promotion policy.

## Owns

- generic compliance report and evidence contracts;
- deterministic aggregation and status semantics;
- snapshot manifests and comparisons;
- report rendering and guidance generation;
- repository-purity evidence models;
- meta-tooling trust and validation models.

## Must Not Own

- any product identity;
- product-specific collectors or profiles;
- product-specific release policy;
- UI, runtime state or build execution;
- assumptions about a particular repository layout.

## Product Composition

```text
@konitif/compliance
down
product compliance policy
down
product release and QA workflows
```

Products provide their own `ruleSetVersion`, collectors and promotion policy when creating a report.

## Development

With Node.js and npm already installed:

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run build
npm test
npm run verify:package
```

The package has no runtime dependencies. The locked development toolchain builds
ESM JavaScript and TypeScript declarations. Archive validation uses the installed
compiler and `tar`, without installing an external consumer's dependencies.
Publication is not enabled in this preparation.

## Usage

```ts
import {
  createComplianceEvidence,
  createComplianceReport
} from '@konitif/compliance';

const report = createComplianceReport({
  reportId: 'product:1.0.0:local',
  ruleSetVersion: 'product-compliance.v1',
  product: {
    productId: 'product',
    productName: 'Product',
    version: '1.0.0'
  },
  environment: {
    sourceCommit: 'local',
    cleanTree: false
  },
  collectorResults: []
});
```
