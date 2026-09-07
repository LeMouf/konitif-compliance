import test from 'node:test';
import assert from 'node:assert/strict';
import {createComplianceReport, createComplianceEvidence, runComplianceCollectors} from '../dist/index.js';

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
