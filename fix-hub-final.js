#!/usr/bin/env node
const fs=require('fs'),path=require('path');
const target=process.argv[2]||path.join(__dirname,'public','construction-suite','construction-hub.html');
if(!fs.existsSync(target)){console.error('❌ File not found:',target);process.exit(1);}
let html=fs.readFileSync(target,'utf8');const original=html;let fixes=0;
function patch(desc,search,replace){const n=(html.match(search)||[]).length;if(!n){console.warn('⚠️  skipped:',desc);return;}html=html.replace(search,replace);console.log(`✅ (${n}x)`,desc);fixes+=n;}
patch('Broken href /htmlconstruction-',/\/htmlconstruction-/g,'/html/construction-');
const MAP={'material-theft':'/construction-suite/html/construction-pro.html','safety-protocol':'/construction-suite/html/compliance.html','subcontractor-exposure':'/construction-suite/html/legal.html','cash-flow':'/construction-suite/financial/index.html','osha-audit':'/construction-suite/html/compliance.html','lien-exposure':'/construction-suite/html/legal.html','bid-strategy':'/construction-suite/financial/index.html','bnca':'/construction-suite/html/construction-strategist.html'};
Object.entries(MAP).forEach(([k,d])=>patch(`runDemo('${k}') → ${d}`,new RegExp(`onclick="runDemo\\\\('${k}'\\\\)"`,'g'),`onclick="window.location.href='${d}'"`));
if(html===original){console.log('⚠️  No changes.');process.exit(0);}
fs.writeFileSync(target+'.bak',original);console.log('📦 Backup saved');
fs.writeFileSync(target,html);console.log(`✅ Patched → ${target}\n🎯 Total: ${fixes} fixes`);
