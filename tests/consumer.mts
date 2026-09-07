import {createComplianceReport, type ComplianceReport} from '@konitif/compliance';
const report: ComplianceReport = createComplianceReport({
  reportId:'external',ruleSetVersion:'test.v1',
  product:{productId:'external',productName:'External',version:'0.0.0'},
  environment:{sourceCommit:'test',cleanTree:true},collectorResults:[]
});
if (report.globalStatus !== 'NOT_MEASURED') throw Error('Missing evidence admitted');
