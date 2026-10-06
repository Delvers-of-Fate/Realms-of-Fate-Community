const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const {selectRelease, sizeLabel} = require('../assets/downloads.js');
const source = fs.readFileSync(path.join(__dirname, '../assets/downloads.js'), 'utf8');
const config = {repository:'Delvers-of-Fate/Realms-of-Fate',assetNames:[]};
const asset = name => ({name,state:'uploaded',size:1048576,browser_download_url:'https://github.com/'+config.repository+'/releases/download/v1/'+name});
const release = {name:'Test release',tag_name:'v1',draft:false,prerelease:false,published_at:'2026-09-28T00:00:00Z',body:'<img src=x onerror=alert(1)>',assets:[asset('game-windows.zip'),asset('game-linux.tar.gz'),asset('source.zip'),asset('debug.zip'),asset('checksums.txt')]};
assert.deepEqual(selectRelease(release,config).files.map(a=>a.name),['game-windows.zip','game-linux.tar.gz']);
assert.equal(selectRelease({...release,prerelease:true},config),null);
assert.equal(selectRelease({...release,draft:true},config),null);
assert.equal(selectRelease({...release,assets:[]},config).files.length,0);
assert.equal(selectRelease({...release,assets:[{...asset('game.zip'),state:'new'}]},config).files.length,0);
assert.equal(selectRelease({...release,assets:[{...asset('game.zip'),browser_download_url:'https://example.com/game.zip'}]},config).files.length,0);
assert.equal(selectRelease({...release,assets:[{...asset('game.zip'),browser_download_url:'https://github.com/other/repo/releases/download/v1/game.zip'}]},config).files.length,0);
assert.deepEqual(selectRelease(release,{...config,assetNames:['game-linux.tar.gz','game-windows.zip']}).files.map(a=>a.name),['game-linux.tar.gz','game-windows.zip']);
assert.equal(sizeLabel(1048576),'1.0 MB');

function element() {
  return {hidden:false,textContent:'',children:[],listeners:{},append(...items){this.children.push(...items);},replaceChildren(){this.children=[];},removeAttribute(key){delete this[key];},addEventListener(name,callback){this.listeners[name]=callback;}};
}
async function render(response, baseURI='http://localhost:8765/Realms-of-Fate-Community/index.html') {
  const elements = new Map();
  let respond=response;
  let configUrl;
  const document={baseURI,getElementById(id){if(!elements.has(id))elements.set(id,element());return elements.get(id);},createElement:element};
  const fetch=async url=>{
    if(String(url).endsWith('/assets/releases.json')) {configUrl=String(url);return {ok:true,json:async()=>config};}
    if(respond instanceof Error)throw respond;
    if(typeof respond==='number')return {ok:false,status:respond};
    return {ok:true,json:async()=>respond};
  };
  vm.runInNewContext(source,{document,fetch,URL,AbortController,setTimeout,clearTimeout});
  await new Promise(resolve=>setImmediate(resolve));
  return {elements,configUrl,retry:async value=>{respond=value;await elements.get('release-retry').listeners.click();}};
}
(async()=>{
  const success=await render(release);
  const e=success.elements;
  assert.equal(success.configUrl,'http://localhost:8765/Realms-of-Fate-Community/assets/releases.json');
  assert.equal(e.get('download-primary').href,release.assets[0].browser_download_url);
  assert.equal(e.get('download-primary').hidden,false);
  assert.equal(e.get('download-placeholder').hidden,true);
  assert.equal(e.get('download-files').children.length,2);
  assert.equal(e.get('release-notes-body').textContent,release.body);
  assert.equal(e.get('release-notes-body').innerHTML,undefined);
  await success.retry(404);
  assert.equal(e.get('download-primary').hidden,true);
  assert.equal(e.get('download-primary').href,undefined);
  assert.equal(e.get('download-placeholder').textContent,'No public build yet');
  assert.equal(e.get('release-notes').hidden,true);
  await success.retry(release);
  assert.equal(e.get('download-primary').hidden,false);
  for(const status of [403,429]) {
    const result=await render(status);
    assert.match(result.elements.get('release-status').textContent,/limiting/);
    assert.equal(result.elements.get('release-retry').hidden,false);
  }
  const offline=await render(new Error('offline'));
  assert.match(offline.elements.get('release-status').textContent,/connection/);
  const empty=await render({...release,assets:[]});
  assert.match(empty.elements.get('release-status').textContent,/no downloadable game package/);
  assert.equal(empty.elements.get('download-primary').hidden,true);
  console.log('PASS: direct asset links, source/debug filtering, repository checks, explicit file order, success/empty/404/rate-limit/offline states, retry, safe release notes and GitHub Pages subpaths.');
})().catch(error=>{console.error(error);process.exitCode=1;});
