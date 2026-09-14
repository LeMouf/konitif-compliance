import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, isAbsolute, join, relative, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
// An explicit already-installed compiler can be used during local preparation.
const compiler = resolve(process.argv[2] ?? join(root,'node_modules/typescript/bin/tsc'));
assert.ok(existsSync(compiler), 'An existing compiler is required; no automatic installation');
const temp = mkdtempSync(join(tmpdir(),'konitif-compliance-package-'));
const run = (command,args,cwd=root) => execFileSync(command,args,{cwd,encoding:'utf8',env:{...process.env,npm_config_offline:'true',npm_config_cache:join(temp,'cache')}});
const args = ['pack','--offline','--ignore-scripts','--json','--pack-destination',temp];
const cli = join(dirname(process.execPath),'node_modules/npm/bin/npm-cli.js');
if(process.platform==='win32') assert.ok(existsSync(cli),'Installed npm CLI required');
const [packed] = JSON.parse(process.platform==='win32' ? run(process.execPath,[cli,...args]) : run('npm',args));
const paths = packed.files.map(f=>f.path);
for(const path of paths) assert.match(path,/^(dist\/|src\/|reference\/|README\.md$|LICENSE\.md$|package\.json$)/);
for(const path of ['dist/index.js','dist/index.d.ts','src/index.ts','LICENSE.md','reference/catalog.json']) assert.ok(paths.includes(path),path);
const consumer = join(temp,'consumer');
const pkg = join(consumer,'node_modules/@konitif/compliance');
mkdirSync(pkg,{recursive:true});
run('tar',['-xzf',join(temp,packed.filename),'-C',pkg,'--strip-components=1']);
const manifest = JSON.parse(readFileSync(join(pkg,'package.json'),'utf8'));
assert.equal(manifest.name,'@konitif/compliance');
assert.equal(manifest.version,'0.284.2');
assert.deepEqual(manifest.dependencies ?? {},{});
for(const path of paths.filter(p=>p.endsWith('.map'))) {
  const mapPath=join(pkg,path), map=JSON.parse(readFileSync(mapPath,'utf8'));
  for(const source of map.sources) {
    const target=resolve(dirname(mapPath),map.sourceRoot ?? '',source), rel=relative(pkg,target);
    assert.ok(!isAbsolute(rel) && !rel.startsWith('..') && existsSync(target),path);
  }
}
cpSync(join(root,'tests/consumer.mts'),join(consumer,'consumer.mts'));
run(process.execPath,[compiler,'--strict','--target','ES2022','--module','NodeNext','--moduleResolution','NodeNext','--outDir','out','consumer.mts'],consumer);
run(process.execPath,['out/consumer.mjs'],consumer);
console.log(JSON.stringify({consumer:'passed (ESM and TypeScript)',integrity:packed.integrity,files:paths.length,bytes:packed.size,evidence:temp}));
