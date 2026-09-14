import test from 'node:test';
import assert from 'node:assert/strict';
import {
  compareComplianceReports,
  createComplianceEvidence,
  createComplianceReport,
  createComplianceSnapshotManifest,
  renderComplianceHtml,
  renderComplianceMarkdown,
  runComplianceCollectors
} from '../dist/index.js';

const context = {product:{productId:'test',productName:'Test',version:'0.0.0'},environment:{sourceCommit:'test',cleanTree:true}};
const source = {id:'test',owner:'test',format:'collector',scope:'tests',freshness:'current',deterministic:true,cost:'low',trust:'high',reusable:true};
const report = results => createComplianceReport({...context,reportId:'test',ruleSetVersion:'test.v1',collectorResults:results});

test('absence of collected evidence never becomes compliance', () => {
  assert.equal(report([]).globalStatus, 'NOT_MEASURED');
});
test('a blocking finding dominates the report', () => {
  const evidence = createComplianceEvidence({id:'block',dimension:'tests',sourceId:'test',owner:'test',kind:'assertion',status:'NON_COMPLIANT',summary:'Test blocker'});
  const result = report([{source,evidence:[evidence]}]);
  assert.equal(result.globalStatus,'NON_COMPLIANT');
  assert.deepEqual(result.blockers,[evidence]);
});
test('a timed-out collector remains unmeasured', async () => {
  const result = await runComplianceCollectors([{id:'slow',dimension:'tests',timeoutMs:1,collect:()=>new Promise(()=>{})}],context);
  assert.equal(result[0].evidence[0].status,'NOT_MEASURED');
});
test('collector failures are observable, not converted to successful evidence', async () => {
  await assert.rejects(runComplianceCollectors([{id:'fail',dimension:'tests',collect:async()=>{throw Error('test failure');}}],context),/test failure/);
});
test('snapshot provenance preserves collector versions without borrowing the policy version', () => {
  const result = report([{source:{...source,version:'collector.v2'},evidence:[]}]);
  const snapshot = createComplianceSnapshotManifest({
    report: result,
    platform: 'test',
    profiles: [],
    commands: [],
    rawEvidencePaths: []
  });
  assert.deepEqual(snapshot.collectorVersions,{test:'collector.v2'});
  const unknown = createComplianceSnapshotManifest({
    report: report([{source,evidence:[]}]),
    platform: 'test',
    profiles: [],
    commands: [],
    rawEvidencePaths: []
  });
  assert.deepEqual(unknown.collectorVersions,{test:'unknown'});
});
test('report comparison requires the same subject and rule set', () => {
  const before = report([]);
  assert.equal(compareComplianceReports(before,{...before,reportId:'after'}).compatible,true);
  assert.equal(compareComplianceReports(before,{...before,ruleSetVersion:'other.v1'}).compatible,false);
  assert.equal(compareComplianceReports(before,{
    ...before,
    product:{...before.product,productId:'other'}
  }).compatible,false);
});
test('rendering names a compliance report without claiming a compliant verdict', () => {
  const result = report([]);
  assert.match(renderComplianceMarkdown(result),/^# KONITIF Compliance Report/);
  assert.match(renderComplianceHtml(result),/<h1>KONITIF Compliance Report<\/h1>/);
  assert.doesNotMatch(renderComplianceMarkdown(result),/Compliant Report/);
});
