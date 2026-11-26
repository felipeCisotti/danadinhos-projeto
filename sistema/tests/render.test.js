import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import React from 'react';
import {renderToString} from 'react-dom/server';

const require=createRequire(import.meta.url);
async function component(name){
 const result=await build({entryPoints:[fileURLToPath(new URL(`../src/${name}.jsx`,import.meta.url))],bundle:true,write:false,format:'cjs',platform:'node',packages:'external',loader:{'.css':'empty'},plugins:[{name:'no-network',setup(b){b.onResolve({filter:/\/supabase$/},()=>({path:'supabase',namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},()=>({contents:'export const supabase=null;',loader:'js'}));}}]});
 const module={exports:{}};new Function('require','module','exports',result.outputFiles[0].text)(require,module,module.exports);return module.exports.default;
}
for(const [name,role,expected] of [['Manager','gestora','Módulos da gestora'],['Reception','recepcao','SISTEMA DE RECEPÇÃO'],['Kitchen','cozinha','SISTEMA DE COZINHA']]){
 test(`${name} renderiza sem erro ao abrir o perfil`,async()=>{
  const Component=await component(name);
  const html=renderToString(React.createElement(Component,{user:{email:'teste@example.invalid',app_metadata:{role}},onSignOut(){},onReception(){},onKitchen(){}}));
  assert.ok(html.includes(expected));
 });
}
