import type { ComplianceComparisonReport, ComplianceReport } from './schema.js';

export function renderComplianceMarkdown(report: ComplianceReport): string {
  const dimensionRows = report.dimensions
    .map((dimension) => `| ${dimension.dimension} | ${dimension.status} | ${dimension.evidenceCount} | ${dimension.blockerCount} | ${dimension.notMeasuredCount} |`)
    .join('\n');
  const guidanceRows = report.guidance.length === 0
    ? '| none | - | - | - |'
    : report.guidance
      .map((item) => `| ${item.priority} | ${item.status} | ${item.owner} | ${item.action} |`)
      .join('\n');

  return `# KONITIF Compliance Report

Status: ${report.globalStatus}

Product: ${report.product.productName} ${report.product.version}

Commit: ${report.environment.sourceCommit}

## Dimensions

| Dimension | Status | Evidence | Blockers | Not Measured |
|-----------|--------|----------|----------|--------------|
${dimensionRows}

## Guidance

| Priority | Status | Owner | Action |
|----------|--------|-------|--------|
${guidanceRows}
`;
}

export function renderComplianceHtml(report: ComplianceReport): string {
  const dimensions = report.dimensions
    .map((dimension) => `<li><strong>${escapeHtml(dimension.dimension)}</strong>: ${escapeHtml(dimension.status)}</li>`)
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>KONITIF Compliance Report</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 2rem; color: #dbeafe; background: #020617; }
    code, strong { color: #e0f2fe; }
  </style>
</head>
<body>
  <h1>KONITIF Compliance Report</h1>
  <p><strong>Status:</strong> ${escapeHtml(report.globalStatus)}</p>
  <p><strong>Product:</strong> ${escapeHtml(report.product.productName)} ${escapeHtml(report.product.version)}</p>
  <ul>${dimensions}</ul>
</body>
</html>
`;
}

export function renderComplianceComparisonMarkdown(report: ComplianceComparisonReport): string {
  const rows = report.items
    .map((item) => `| ${item.id} | ${item.dimension} | ${item.change} | ${item.beforeStatus ?? '-'} | ${item.afterStatus ?? '-'} |`)
    .join('\n');

  return `# KONITIF Compliance Comparison

Compatible: ${report.compatible ? 'yes' : 'no'}

| Evidence | Dimension | Change | Before | After |
|----------|-----------|--------|--------|-------|
${rows}
`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
