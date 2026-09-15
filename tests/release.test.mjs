import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assertReleaseInputs, assertPublishingTools} from '../scripts/check-release.mjs';
const read = p => readFileSync(new URL('../'+p,import.meta.url),'utf8');
const policy=JSON.parse(read('release-policy.json'));
const manifest=JSON.parse(read('package.json'));
const lock=JSON.parse(read('package-lock.json'));
const env={GITHUB_REPOSITORY:'LeMouf/konitif-compliance',GITHUB_EVENT_NAME:'push',GITHUB_REF:'refs/tags/v0.284.3'};
test('release guard accepts only the intended package, source repository and version tag', () => {
  assertReleaseInputs(policy,manifest,lock,env);
  for(const changed of [{GITHUB_REPOSITORY:'other/repo'},{GITHUB_EVENT_NAME:'pull_request'},{GITHUB_EVENT_NAME:'workflow_dispatch'},{GITHUB_REF:'refs/heads/main'},{GITHUB_REF:'refs/tags/v0.284.1'}]) {
    assert.throws(()=>assertReleaseInputs(policy,manifest,lock,{...env,...changed}));
  }
  assert.throws(()=>assertReleaseInputs(policy,{...manifest,name:'@other/package'},lock,env));
  assert.throws(()=>assertReleaseInputs(policy,manifest,{...lock,version:'0.284.0'},env));
});
test('publishing tool versions fail closed without automatic upgrade', () => {
  assertPublishingTools('24.20.0','11.6.2');
  assert.throws(()=>assertPublishingTools('22.13.0','11.6.2'));
  assert.throws(()=>assertPublishingTools('24.20.0','11.5.0'));
});
test('workflow requires opt-in, tag-only environment boundary and verified archive', () => {
  const workflow=read('.github/workflows/publish.yml');
  assert.match(workflow,/github.repository == 'LeMouf\/konitif-compliance' && vars.COMPLIANCE_NPM_PUBLISH_ENABLED == 'true'/);
  assert.match(workflow,/environment: npm-release/);
  assert.match(workflow,/git -C \.release-source merge-base --is-ancestor HEAD origin\/main/);
  assert.match(workflow,/GITHUB_EVENT_NAME.*push/);
  assert.match(workflow,/GITHUB_REF.*refs\/tags/);
  assert.doesNotMatch(workflow,/workflow_dispatch|refs\/heads\/main/);
  assert.match(workflow,/npm publish \.release\/package.tgz --access public --provenance --ignore-scripts/);
  assert.ok(workflow.indexOf('prepare-release-archive.mjs') < workflow.indexOf('npm publish'));
  assert.doesNotMatch(workflow,/NODE_AUTH_TOKEN|secrets\.|npm install/);
});
