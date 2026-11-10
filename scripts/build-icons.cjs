// Extend the existing repo-native Manager logo style deterministically.
const fs=require('node:fs/promises'),path=require('node:path');
let sharp;try{sharp=require('sharp');}catch(error){if(!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES)throw error;sharp=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'sharp'));}
(async()=>{
 const root=path.resolve(__dirname,'..'),brand=path.join(root,'brand');
 const svg=await fs.readFile(path.join(brand,'music-manager.svg'),'utf8');
 for(const [prefix,source] of [['',svg],['dark_',svg.replaceAll('#078bb5','#54c9ee').replaceAll('#ffd16a','#ffcf65')]]){
  for(const [suffix,size] of [['',256],['@2x',512]])await sharp(Buffer.from(source)).resize(size,size).png({compressionLevel:9}).toFile(path.join(brand,prefix+'icon'+suffix+'.png'));
  await fs.copyFile(path.join(brand,prefix+'icon@2x.png'),path.join(brand,prefix+'logo.png'));
 }
 for(const name of ['icon.png','logo.png'])await fs.copyFile(path.join(brand,name),path.join(root,name));
 console.log('Manager logo: SVG, 256/512 px PNG, transparent, light/dark');
})().catch(error=>{console.error(error);process.exit(1)});
