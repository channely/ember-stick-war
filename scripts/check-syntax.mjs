import {readdirSync,readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {Script} from 'node:vm';
function walk(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(`${dir}/${e.name}`):`${dir}/${e.name}`);}
let count=0;
for(const file of walk('dist')){
 if(file.endsWith('.js')){const r=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(r.status!==0){console.error(r.stderr);process.exit(1);}count++;}
 if(file.endsWith('.html')){for(const [,code] of readFileSync(file,'utf8').matchAll(/<script>([\s\S]*?)<\/script>/g)){new Script(code,{filename:file});count++;}}
}
console.log(`${count} JavaScript modules and embedded examples passed syntax checks.`);
