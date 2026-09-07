import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read = path => readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('distribution locks only the approved development toolchain', () => {
  const manifest = JSON.parse(read('package.json'));
  const lock = JSON.parse(read('package-lock.json'));
  assert.deepEqual(manifest.dependencies ?? {}, {});
  assert.deepEqual(manifest.devDependencies, {'@types/node':'25.9.3',typescript:'5.9.3'});
  assert.deepEqual(manifest.overrides, {'undici-types':'7.24.6'});
  assert.deepEqual(lock.packages[''].devDependencies,manifest.devDependencies);
  assert.deepEqual(Object.keys(lock.packages).sort(),['','node_modules/@types/node','node_modules/typescript','node_modules/undici-types']);
  for(const [name,version] of Object.entries({'@types/node':'25.9.3',typescript:'5.9.3','undici-types':'7.24.6'})) {
    const entry=lock.packages['node_modules/'+name];
    assert.equal(entry.version,version);
    assert.ok(entry.resolved.startsWith('https://registry.npmjs.org/'));
    assert.ok(entry.integrity.startsWith('sha512-'));
  }
});

test('build and CI are standalone and publication remains disabled', () => {
  const config=JSON.parse(read('tsconfig.json'));
  assert.equal(config.extends,undefined);
  assert.equal(config.compilerOptions.paths,undefined);
  const workflow=read('.github/workflows/ci.yml');
  assert.match(workflow,/contents: read/);
  assert.match(workflow,/npm ci --ignore-scripts/);
  assert.doesNotMatch(workflow,/id-token|npm publish|secrets\./);
  assert.match(JSON.parse(read('package.json')).scripts.prepublishOnly,/throw new Error/);
  assert.match(read('scripts/select-ci-runtime.sh'),/24\.20\.0/);
  assert.doesNotMatch(read('scripts/select-ci-runtime.sh'),/curl|wget|npx/);
});
