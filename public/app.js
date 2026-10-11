const $ = s => document.querySelector(s);
let plan, busy=false, imageReady=false, selectedLookIndex=null;
const imageCache = new Map();
const imageTasks = new Map();
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const imageSource = url => /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(url) && url.length<300000 ? escape(url) : safe(url);
const safe = url => {try { const u=new URL(url); return ['http:','https:'].includes(u.protocol)?escape(u.href):'#'; } catch {return '#';}};
function step(n){[1,2,3].forEach(i=>{const el=$('#step'+i);el.classList.toggle('active',i<=n);el.classList.toggle('current',i===n);el.classList.toggle('complete',i<n);if(i===n)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');});}
function message(text,loading=false){$('#message').classList.toggle('is-loading',loading);$('#message').setAttribute('aria-busy',String(loading));$('#message').innerHTML=loading?`<span class="loading"></span>${escape(text)}`:escape(text);}
async function api(path,body){const res=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await res.json();if(!res.ok)throw Error(data.error||'Please try again.');return data;}
function lock(value){busy=value;document.querySelectorAll('button').forEach(b=>{if(b.id!=='generate-images')b.disabled=value;});$('#event').disabled=value;}
function demoBanner(){return plan.demo?'<p class="demo-banner">Demo preview · These four sample looks are illustrative. Event themes and shopping sources have not been researched.</p>':'';}
function renderIdeas(){
 $('#intro').hidden=true;$('#pieces').hidden=true;$('#results').hidden=false;step(2);
 const icons=['✿','✦','☾','✧'];
 $('#results').innerHTML=`<div class="section-top"><div><p class="eyebrow">${escape(plan.event)}</p><h2>Choose your look.</h2><p class="sub">Pick a look to explore its pieces and shopping sources.</p></div><button class="back" id="restart">Change event</button></div>${demoBanner()}<div class="cards">${plan.ideas.map((idea,i)=>`<article class="card"><div class="image-gallery" data-gallery="${i}"></div><h3>${escape(idea.name)}</h3><button class="primary" data-pick="${i}">Make this look mine <span>↗</span></button></article>`).join('')}</div><details class="inspirations"><summary>Inspirations behind these looks</summary><p class="sub">Sources can describe past editions. They are inspiration, not confirmation of this event’s dress code.</p><ul>${plan.themes.map(t=>{const source=plan.sources[t.sourceIndex];return `<li><strong>${escape(t.name)}</strong>${source?` · <a href="${safe(source.url)}" target="_blank" rel="noopener noreferrer">${escape(source.title)} ↗</a>`:' · Creative interpretation'}<small>${escape(t.reason)}</small></li>`;}).join('')}</ul></details>`;
 $('#restart').onclick=restart;

 plan.ideas.forEach((_,i)=>paintImages(plan.id,i));
 document.querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>pick(Number(b.dataset.pick)));
}
function paintImages(planId,index){
 if(!plan||plan.id!==planId)return;
 const galleries=document.querySelectorAll(`[data-gallery="${index}"]`);if(!galleries.length)return;
 for(const gallery of galleries){
 gallery.innerHTML=[0,1,2].map(variation=>{
   const key=`${planId}:${index}:${variation}`,image=imageCache.get(key);
   if(image?.dataUrl)return `<figure><button class="image-open" data-preview="${variation}" aria-label="Enlarge ${escape(plan.ideas[index].name)} image ${variation+1}"><img src="${image.dataUrl}" alt="${escape(plan.ideas[index].name)} — ${['studio look','party look','outfit flat lay'][variation]}"></button><figcaption>${['Studio look','Party look','The pieces'][variation]}</figcaption></figure>`;
   if(image?.error)return `<div class="image-placeholder"><span>${escape(image.error)}</span><button data-retry="${index}:${variation}">Retry image</button></div>`;
   return imageTasks.has(key)?'<div class="image-placeholder"><span class="loading"></span>Creating image…</div>':'';
 }).join('');
 gallery.querySelectorAll('[data-preview]').forEach(b=>b.onclick=()=>openImage(imageCache.get(`${planId}:${index}:${b.dataset.preview}`).dataUrl,plan.ideas[index].name));
 gallery.querySelectorAll('[data-retry]').forEach(b=>b.onclick=()=>{const [i,v]=b.dataset.retry.split(':').map(Number);loadImage(planId,i,v);});
 }
}
async function loadImage(planId,index,variation){
 const key=`${planId}:${index}:${variation}`;
 if(imageTasks.has(key)||imageCache.get(key)?.dataUrl)return;
 imageCache.delete(key);imageTasks.set(key,true);paintImages(planId,index);
 try {
   const deadline=Date.now()+300000;
   while(true){
     const data=await api('/api/images',{planId,index,variation});
     if(data.status==='complete'){imageCache.set(key,data);break;}
     if(Date.now()>deadline)throw Error('Image is taking longer than expected. Retry to check again.');
     await new Promise(resolve=>setTimeout(resolve,2500));
   }
 }catch(e){imageCache.set(key,{error:e.message});}
 finally{imageTasks.delete(key);paintImages(planId,index);if(plan?.id===planId&&!$("#pieces").hidden)loadPieceCrops(index);}
}
async function generateImages(){
 if(!imageReady){message('Add GEMINI_API_KEY to .env and restart the app to generate costume images.');return;}
 const planId=plan.id;
 await Promise.allSettled(plan.ideas.flatMap((_,index)=>[0,1,2].map(variation=>loadImage(planId,index,variation))));

}
function restart(){if(busy)return;plan=null;$('#intro').hidden=false;$('#results').hidden=true;$('#pieces').hidden=true;message('');step(1);$('#event').focus();}
async function pick(index,{showImages=false}={}){if(busy)return;lock(true);message('Preparing your look and its pieces…',true);
 try{const data=await api('/api/pieces',{planId:plan.id,index});selectedLookIndex=index;$('#results').hidden=true;$('#pieces').hidden=false;step(3);
 $('#pieces').innerHTML=`<div class="section-top"><div><p class="eyebrow">YOUR LOOK, PIECE BY PIECE</p><h2>${escape(data.name)}</h2><p class="sub">Find the pieces to complete your look.</p></div><button class="back" id="back">All four looks</button></div>${demoBanner()}${plan.direction?`<p class="demo-banner">Refined version · ${escape(plan.direction)}</p>`:''}<section class="look-chat" aria-label="Costume styling chat"><div class="chat-heading"><strong>Your costume stylist</strong><span>Keep shaping this look</span></div><div class="chat-messages" role="log" aria-live="polite"><div class="chat-bubble assistant">What would you like to change? Tell me about your style, comfort, budget, or pieces you already own.</div>${(plan.selectedIndex===index?plan.chat||[]:[]).map(m=>`<div class="chat-bubble ${m.role==='user'?'user':'assistant'}">${escape(m.text)}</div>`).join('')}</div><form id="refine-form" class="refine-form"><label class="sr-only" for="refine-direction">Message your costume stylist</label><div class="input-row"><input id="refine-direction" placeholder="More gothic, comfortable shoes, use my black jacket…" required minlength="2" maxlength="1000"><button type="submit">Send ↗</button></div><p class="sub">Updates this costume, its pieces, and images. Each revision is saved in Previous searches.</p></form></section><div class="selected-look-images"><div class="image-gallery" data-gallery="${index}"></div></div>${data.pieces.map((p,i)=>`<article class="piece"><div class="piece-head"><h3>${String(i+1).padStart(2,'0')} / ${escape(p.name)}</h3></div><p class="sub">${p.essential?'Essential':'Optional finishing touch'} · ${escape(p.instruction)}</p><div class="piece-crop" data-piece-crop="${i}"><p class="sub">Preparing a crop from your look image…</p></div><div class="lens-results" data-lens-results="${i}"></div></article>`).join('')}`;
 $('#refine-form').onsubmit=async e=>{
 e.preventDefault();if(busy)return;const direction=$('#refine-direction').value.trim();const messages=$('.chat-messages');const bubble=document.createElement('div');bubble.className='chat-bubble user';bubble.textContent=direction;messages.append(bubble);const typing=document.createElement('div');typing.className='chat-bubble assistant';typing.textContent='Updating your look…';messages.append(typing);messages.scrollTop=messages.scrollHeight;lock(true);message('Refining your costume and saving a new version…',true);
 try{plan=await api('/api/refine',{planId:plan.id,index,direction});refreshHistory();[0,1,2].forEach(v=>{if(imageReady)loadImage(plan.id,index,v);});lock(false);await pick(index,{showImages:true});}
 catch(error){message(error.message);}finally{lock(false);}
 };
 paintImages(plan.id,index);
 loadPieceCrops(index);
 if(imageReady)[0,1,2].forEach(v=>loadImage(plan.id,index,v));
 $('#back').onclick=()=>{message('');renderIdeas();};message('');(showImages?$('.selected-look-images'):$('#pieces')).scrollIntoView({behavior:showImages?'instant':'smooth',block:'start'});
 }catch(e){message(e.message);}finally{lock(false);}}
$('#event-form').onsubmit=async e=>{e.preventDefault();if(busy)return;lock(true);message('Researching the event with Nimble, then creating four costume ideas…',true);try{plan=await api('/api/ideas',{event:$('#event').value.trim(),});renderIdeas();message(plan.cached?'Opened saved search. Reusing its images and sourcing results.':'');refreshHistory();if(imageReady)generateImages();}catch(e){message(e.message);}finally{lock(false);}};
document.querySelectorAll('[data-event]').forEach(b=>b.onclick=()=>{$('#event').value=b.dataset.event;$('#event').focus();});
fetch('/api/config').then(r=>r.json()).then(config=>{imageReady=config.imageReady;if(!config.liveReady){message('Configure your local API keys to research events and generate costume ideas.');}}).catch(()=>message('Could not connect to the app. Refresh to retry.'));

function openImage(src,name){
 let dialog=document.querySelector('#image-preview');
 if(!dialog){
  dialog=document.createElement('dialog');dialog.id='image-preview';
  dialog.innerHTML='<button class="preview-close" aria-label="Close image preview">Close ×</button><img><p></p>';
  document.body.append(dialog);
  dialog.querySelector('button').onclick=()=>dialog.close();
  dialog.onclick=e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}};
 }
 dialog.querySelector('img').src=src;dialog.querySelector('img').alt=name;
 dialog.querySelector('p').textContent=name+' · AI-generated inspiration';
 dialog.showModal();
}

async function refreshHistory(){
 try{
  const res=await fetch('/api/history'),data=await res.json();
  $('#search-history').innerHTML=data.searches.length?data.searches.map(s=>`<button class="history-item" data-history="${escape(s.id)}"><strong>${escape(s.event)}</strong><small>${s.direction?'Refined: '+escape(s.direction)+' · ':''}${s.demo?'Demo':'Live'} · ${escape(new Date(s.createdAt*1000).toLocaleString())}</small></button>`).join(''):'No saved searches yet. Your next search will be saved automatically.';
  document.querySelectorAll('[data-history]').forEach(b=>b.onclick=async()=>{
   if(busy)return;lock(true);
   try{const res=await fetch('/api/history/'+encodeURIComponent(b.dataset.history));if(!res.ok)throw Error('Could not open saved search.');plan=await res.json();renderIdeas();message('Opened saved search. Previously generated images are reused.');if(imageReady)generateImages();}
   catch(e){message(e.message);}finally{lock(false);}
  });
 }catch{$('#search-history').textContent='Could not load search history. Refresh to retry.';}
}
refreshHistory();

step(1);

const cropTasks=new Set(), cropCache=new Map();
async function cropData(source,box){
 const img=new Image();img.src=source;await img.decode();
 const [y1,x1,y2,x2]=box;const x=Math.floor(x1*img.naturalWidth/1000),y=Math.floor(y1*img.naturalHeight/1000);
 const w=Math.max(1,Math.min(img.naturalWidth-x,Math.ceil((x2-x1)*img.naturalWidth/1000))),h=Math.max(1,Math.min(img.naturalHeight-y,Math.ceil((y2-y1)*img.naturalHeight/1000)));
 const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;canvas.getContext('2d').drawImage(img,x,y,w,h,0,0,w,h);return canvas.toDataURL('image/png');
}
async function loadPieceCrops(index){
 const id=plan?.id,key=`${id}:${index}`;if(!id||selectedLookIndex!==index||$("#pieces").hidden||cropTasks.has(key))return;
 cropTasks.add(key);
 try{
  let data=cropCache.get(key);if(!data){data=await api('/api/crops',{planId:id,index});if(data.status==='waiting-image'){document.querySelectorAll('[data-piece-crop]').forEach(el=>el.innerHTML='<p class="sub">Your piece crop will appear when a look image is ready.</p>');return;}cropCache.set(key,data);}
  if(plan?.id!==id||selectedLookIndex!==index||$('#pieces').hidden)return;
  for(const crop of data.crops){
   const el=document.querySelector(`[data-piece-crop="${crop.pieceIndex}"]`);if(!el)continue;
   const name=plan.ideas[index].pieces[crop.pieceIndex].name;
   const src=crop.box?await cropData(data.dataUrl,crop.box):null;
   el.innerHTML=`${src?`<img class="component-crop-image" src="${src}" alt="${escape(name)} cropped from your generated look">`:''}<div><strong>Find a visual match</strong><p class="sub">${data.error?escape(data.error):crop.needsReview?'Please check this crop — the piece may be hard to see.':'Cropped from your generated look.'}</p>${src?`<a class="back" href="${src}" download="costume-piece-${crop.pieceIndex+1}.png">Download crop</a> `:''}<button class="back" data-adjust-crop="${crop.pieceIndex}">${src?'Adjust crop':'Select crop'}</button> ${crop.publicUrl?`<a class="primary" href="https://lens.google.com/uploadbyurl?url=${encodeURIComponent(crop.publicUrl)}" target="_blank" rel="noopener noreferrer">Search this image ↗</a>`:src?`<a class="back" href="https://www.google.com/imghp" target="_blank" rel="noopener noreferrer">Open image search ↗</a>`:""}<small>${crop.publicUrl?"Opens Google Lens with this piece’s image.":"Public image hosting is starting. Download the crop to search manually meanwhile."}</small></div>`;
   el.querySelector('button').onclick=()=>adjustPieceCrop(id,index,crop.pieceIndex,data);
   if(crop.publicUrl)loadLensMatches(id,index,crop);

  }
 }catch(e){if(plan?.id===id)document.querySelectorAll('[data-piece-crop]').forEach(el=>el.innerHTML=`<p class="sub">${escape(e.message)}</p><button class="back">Retry crops</button>`);document.querySelectorAll('[data-piece-crop] button').forEach(b=>b.onclick=()=>loadPieceCrops(index));}
 finally{cropTasks.delete(key);}
}
function adjustPieceCrop(id,index,pieceIndex,data){
 let dialog=$('#crop-editor');if(dialog)dialog.remove();dialog=document.createElement('dialog');dialog.id='crop-editor';
 const current=data.crops[pieceIndex].box||[0,0,1000,1000];
 dialog.innerHTML=`<h3>Adjust ${escape(plan.ideas[index].pieces[pieceIndex].name)}</h3><p class="sub">Move the edges until the preview contains just this piece.</p><div class="crop-editor-images"><div class="crop-original"><img src="${data.dataUrl}" alt="Original look"><div class="crop-outline"></div></div><img class="crop-preview" alt="Selected crop"></div>${['Top','Left','Bottom','Right'].map((name,i)=>`<label>${name}<input type="range" min="0" max="1000" value="${current[i]}" data-edge="${i}"></label>`).join('')}<p class="crop-error" role="status"></p><button class="primary" id="save-crop">Save crop</button> <button class="back" id="cancel-crop">Cancel</button>`;
 document.body.append(dialog);dialog.showModal();
 const box=()=>Array.from(dialog.querySelectorAll('[data-edge]')).map(input=>Number(input.value));let previewRevision=0;
 async function preview(){const revision=++previewRevision,b=box(),valid=b[2]>b[0]+4&&b[3]>b[1]+4;dialog.querySelector('#save-crop').disabled=!valid;dialog.querySelector('.crop-error').textContent=valid?'':'Bottom must be below top, and right must be beyond left.';if(!valid)return;const outline=dialog.querySelector('.crop-outline');outline.style.cssText=`top:${b[0]/10}%;left:${b[1]/10}%;width:${(b[3]-b[1])/10}%;height:${(b[2]-b[0])/10}%`;const src=await cropData(data.dataUrl,b);if(revision===previewRevision)dialog.querySelector('.crop-preview').src=src;}
 dialog.querySelectorAll('input').forEach(input=>input.oninput=preview);preview();
 dialog.querySelector('#cancel-crop').onclick=()=>dialog.close();
 dialog.querySelector('#save-crop').onclick=async()=>{const button=dialog.querySelector('#save-crop');button.disabled=true;try{const b=box();const updated=await api('/api/crops/adjust',{planId:id,index,pieceIndex,box:b});cropCache.set(`${id}:${index}`,updated);dialog.close();loadPieceCrops(index);}catch(e){dialog.querySelector('.crop-error').textContent=e.message;}finally{button.disabled=false;}};
}

const lensTasks=new Map(),lensCache=new Map();
async function loadLensMatches(id,index,crop){
 const key=`${id}:${index}:${crop.pieceIndex}:${crop.publicUrl}`,selector=`[data-lens-results="${crop.pieceIndex}"]`;
 const current=()=>plan?.id===id&&selectedLookIndex===index&&!$('#pieces').hidden&&cropCache.get(`${id}:${index}`)?.crops.find(c=>c.pieceIndex===crop.pieceIndex)?.publicUrl===crop.publicUrl?document.querySelector(selector):null;
 function paint(data){const el=current();if(!el)return;el.innerHTML=`<p class="eyebrow">VISUAL PRODUCT MATCHES</p><div class="sources">${data.sources.length?data.sources.map(s=>`<a class="source" href="${safe(s.url)}" target="_blank" rel="noopener noreferrer"><img class="product-thumbnail" src="${safe(s.thumbnail)}" alt="${escape(s.title)}" loading="lazy" referrerpolicy="no-referrer">${escape(s.title)} ↗${s.price?`<strong class="product-price">${escape(s.price)}</strong>`:''}<small>${escape(s.merchant)}${s.inStock===false?' · Reported out of stock':''}</small><small>Google Lens · SerpApi</small></a>`).join(''):'<p class="sub">No product matches found for this crop. Try adjusting it or view Google Lens directly.</p>'}</div><p class="source-notice">Visually similar items · Check current price, sizing, and availability at the store.</p>`;}
 if(lensCache.has(key)){paint(lensCache.get(key));return;}
 if(lensTasks.has(key)){try{paint(await lensTasks.get(key));}catch{}return;}
 const el=current();if(el)el.innerHTML='<p class="sub"><span class="loading"></span>Finding matching products with Google Lens…</p>';
 const task=api('/api/lens',{planId:id,index,pieceIndex:crop.pieceIndex});lensTasks.set(key,task);
 try{const data=await task;lensCache.set(key,data);paint(data);}
 catch(error){const el=current();if(el){el.innerHTML=`<p class="sub">${escape(error.message)}</p><button class="back">Retry product matches</button>`;el.querySelector('button').onclick=()=>loadLensMatches(id,index,crop);}}
 finally{lensTasks.delete(key);}
}
