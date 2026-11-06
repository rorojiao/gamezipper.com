const fs=require('fs');
const html=fs.readFileSync('/home/junze/gamezipper.com/queens/index.html','utf8');
const re=/function\s+countSolutions\s*\(/;
const m=re.exec(html);
let i=html.indexOf('{',m.index);
console.log('fn start',m.index,'brace at',i);
console.log('between:',JSON.stringify(html.slice(m.index,i)));
let depth=1; let j=i+1; let line=1;
const upto=html.slice(0,m.index).split('\n').length;
while(j<html.length&&depth>0){const c=html[j]; if(c==='{')depth++; else if(c==='}')depth--; j++;}
console.log('end at char',j,'depth',depth);
const snippet=html.slice(m.index,j);
console.log('snippet len',snippet.length);
console.log('TAIL:',JSON.stringify(snippet.slice(-120)));
