const $=id=>document.getElementById(id);
let manifest=[],original='',loadedLesson=0,loadSerial=0;
const PROGRESS='ember-workshop-v1',JOURNAL='ember-workshop-journal-v1';
function read(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}}
function write(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}}
const storedProgress=read(PROGRESS,[]);
const done=new Set((Array.isArray(storedProgress)?storedProgress:[]).filter(n=>Number.isInteger(n)&&n>=1&&n<=15));
function updateProgress(){document.querySelectorAll('[data-done]').forEach(el=>{el.checked=done.has(Number(el.dataset.done));});document.querySelectorAll('[data-lesson-link]').forEach(el=>el.classList.toggle('done',done.has(Number(el.dataset.lessonLink))));$('completed').textContent=done.size;$('progress-bar').style.width=(done.size/15*100)+'%';}
document.querySelectorAll('[data-done]').forEach(el=>el.addEventListener('change',()=>{const n=Number(el.dataset.done);if(el.checked)done.add(n);else done.delete(n);write(PROGRESS,[...done]);updateProgress();}));updateProgress();
function run(){const source=$('source').value;$('preview').srcdoc=source;$('editor-status').textContent='已运行当前代码；重新打开此课会恢复示例。';}
function download(content,name,type='text/plain;charset=utf-8'){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);}
async function chooseLesson(number){const serial=++loadSerial;const lesson=manifest.find(l=>l.lesson===number);if(!lesson)return;
  $('editor-status').textContent='正在打开小作品…';
  try{const response=await fetch('./examples/'+lesson.file);if(!response.ok)throw new Error('文件暂时无法读取');const source=await response.text();if(serial!==loadSerial)return;
    loadedLesson=number;original=source;$('source').value=source;$('example-select').value=number;$('lab-task').textContent=lesson.task;$('open-example').href='./examples/'+lesson.file;run();$('editor-status').textContent='示例已就绪。修改后点击运行，再下载保存。';
  }catch{$('editor-status').textContent='示例未能载入，请刷新重试，或下载材料包离线打开。';}
}
$('example-select').addEventListener('change',e=>chooseLesson(Number(e.target.value)));
$('run-code').onclick=run;$('restart-example').onclick=run;
$('restore-code').onclick=()=>{$('source').value=original;run();$('editor-status').textContent='已恢复示例。';};
$('save-code').onclick=()=>download($('source').value,'我们的王国-第'+loadedLesson+'课.html','text/html;charset=utf-8');
$('source').addEventListener('input',()=>{$('editor-status').textContent='代码已修改，点击运行查看。离开前请下载保存。';});
document.querySelectorAll('[data-open-lesson]').forEach(el=>el.onclick=()=>{chooseLesson(Number(el.dataset.openLesson));$('studio').scrollIntoView({behavior:'smooth'});});
const template='今天的日期：\n我们给作品起的名字：\n\n我预测：\n我只改了这一处：\n我观察到：\n这可能是因为：\n\n下一次我想试：\n';
$('journal').value=read(JOURNAL,template);$('journal').addEventListener('input',()=>{$('journal-status').textContent=write(JOURNAL,$('journal').value)?'已保存在这台浏览器':'无法自动保存，请下载日记';});$('save-journal').onclick=()=>download('# 小设计师日记\n\n'+$('journal').value,'小设计师日记.md');
const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){document.querySelectorAll('[data-lesson-link]').forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+entry.target.id));}},{rootMargin:'-10% 0px -65% 0px'});document.querySelectorAll('.reading section[id^="lesson-"]').forEach(el=>observer.observe(el));
try{const r=await fetch('./examples/manifest.json');if(!r.ok)throw new Error();manifest=await r.json();await chooseLesson(1);}catch{$('editor-status').textContent='材料暂时无法读取，请下载离线材料包。';}
