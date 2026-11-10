import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read = name => readFile(path.join(root,name),'utf8');
const hash = text => createHash('sha256').update(text).digest('hex');
const lock = JSON.parse(await read('src/family-ui.lock.json'));
const kit = await read(`src/${lock.module.replace('./','')}`);
for (const [name,expected] of Object.entries(lock.files)) {
  if (hash(await read(`src/family-ui/${lock.version}/${name}`)) !== expected) throw new Error('UI Kit checksum mismatch: '+name);
}
if (hash(await read(`src/family-ui/${lock.version}/LICENSE`)) !== lock.licenseSha256) throw new Error('UI Kit license mismatch');
const kitExports = [...kit.matchAll(/^export (?:async )?(?:const|function) (\w+)/gm)].map(m=>m[1]);
const uiImport = /import\s*\{([\s\S]*?)\}\s*from '\.\/family-ui\/1\.2\.2\/family-ui\.js';/;
const cardSource = await read('src/music-manager-card.js');
const names = cardSource.match(uiImport)?.[1];
if (!names) throw new Error('Expected pinned UI Kit import');
const card = cardSource.replace(uiImport,`const {${names}} = MusicManagerUI;`).replace(/import\s*\{[\s\S]*?\}\s*from '\.\/core\.js';/,'');
const output = `/* Music Manager ${JSON.parse(await read('package.json')).version} | MIT | HA UI Kit ${lock.version} bundled locally, unchanged | See LICENSES.txt */\nconst MusicManagerUI = (() => {\n${kit.replace(/^export /gm,'')}\nreturn {${kitExports.join(',')}};\n})();\n${await read('src/core.js')}\n${card}`;
const licenses = `Music Manager\n${await read('LICENSE')}\n\nHA UI Kit ${lock.version}\n${await read('src/family-ui/1.2.2/LICENSE')}`;
const manifest = JSON.stringify({version:JSON.parse(await read('package.json')).version,ui_version:lock.version,ui_source_commit:'6e398ba9415ed5a0b64e9703d11ab935ee7ea47d',files:{'music-manager-card.js':hash(output),'LICENSES.txt':hash(licenses)}},null,2)+'\n';
await mkdir(path.join(root,'dist'),{recursive:true});
for (const [name,value] of [['music-manager-card.js',output],['LICENSES.txt',licenses],['manifest.json',manifest]]) {
  if (process.argv.includes('--check')) { if (await read('dist/'+name) !== value) throw new Error('Stale generated file: '+name); }
  else await writeFile(path.join(root,'dist',name),value);
}
console.log(`Music Manager 1.1.0 · UI Kit ${lock.version} · ${process.argv.includes('--check')?'verified':'built'}`);
