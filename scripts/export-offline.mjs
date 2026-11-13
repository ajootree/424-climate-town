import {readFile,writeFile,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,join} from 'node:path';
const root=fileURLToPath(new URL('..',import.meta.url));
let html=await readFile(join(root,'index.html'),'utf8');
let css=await readFile(join(root,'style.css'),'utf8');
for(const file of await readdir(join(root,'assets/fonts')))if(file.endsWith('.woff')){
 const data='data:font/woff;base64,'+(await readFile(join(root,'assets/fonts',file))).toString('base64');
 css=css.replaceAll('assets/fonts/'+file,data);
}
const core=(await readFile(join(root,'core.js'),'utf8')).replaceAll('export ','');
let js=(await readFile(join(root,'game.js'),'utf8')).replace(/^import .*?;\n/,'');
const assets={};for(const n of await readdir(join(root,'assets')))if(n.endsWith('.png'))assets[n]='data:image/png;base64,'+(await readFile(join(root,'assets',n))).toString('base64');
js=js.replace('img.src=`assets/${file}`;','img.src=EMBEDDED_IMAGES[file];');
html=html.replace(/\s*<link rel="preload"[^>]*>/g,'').replace(/<link rel="stylesheet" href="style\.css(?:\?[^"]*)?">/,'<style>'+css+'</style>').replace(/<script type="module" src="game\.js(?:\?[^"]*)?"><\/script>/,'<script>const EMBEDDED_IMAGES='+JSON.stringify(assets)+';\n'+core+'\n'+js+'</script>');
const notice=await readFile(join(root,'assets/fonts/LICENSE.txt'),'utf8');
html=html.replace('</body>','<script type="text/plain" id="font-license">'+notice+'</script>\n</body>');
const output=resolve(process.argv[2]||join(root,'standalone.html'));await writeFile(output,html);console.log('Saved offline game:',output);
