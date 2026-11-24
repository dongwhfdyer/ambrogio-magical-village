const nameKey = 'magical-treehouse.display-name';
const first = ['Fern','Hazel','Briar','Robin','Clover','Juniper','Maple','Willow','Alder','Rowan','Laurel','Sage'];
const last = ['Brook','Hill','Bell','Reed','Vale','Wren','Birch','Glen','Finch','Moss','Dale','Bay'];

export function villageName(value,id) {
  const clean=typeof value==='string' ? Array.from(value.normalize('NFC')
    .replace(/[\p{Cc}\u202a-\u202e\u2066-\u2069]/gu,'').trim().replace(/\s+/gu,' ')).slice(0,24).join('') : '';
  return clean || first[parseInt(id.slice(0,4),16)%first.length]+' '+last[parseInt(id.slice(4,8),16)%last.length];
}

export function nameTag(name){
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
  ctx.font='600 36px system-ui';canvas.width=Math.ceil(ctx.measureText(name).width)+48;canvas.height=64;
  ctx.font='600 36px system-ui';ctx.fillStyle='rgba(42,41,29,.91)';
  ctx.beginPath();ctx.roundRect(1,1,canvas.width-2,62,26);ctx.fill();
  ctx.fillStyle='#fff5d9';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(name,canvas.width/2,32);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const tag=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false}));
  tag.name='Visitor name · '+name;tag.scale.set(canvas.width/190,.34,1);
  return tag;
}

export function peoplePanel(id,actions){
  // Only the chosen display name is stored on the device. Each tab joins independently.
  let saved='';try{saved=localStorage.getItem(nameKey)}catch{}
  let name=villageName(saved,id),connected=false;
  const panel=document.createElement('details');panel.className='village-people';
  panel.innerHTML=`<summary></summary><div class="people-content">
    <form><label>Your village name<input maxlength="48" required autocomplete="nickname" placeholder="Display name"></label><button>Save</button></form>
    <ul aria-label="People in the village"></ul>
    <div class="people-actions"><button type="button" data-wave>Wave hello</button><button type="button" data-invite>Copy village link</button></div>
    </div><output aria-live="polite"></output>`;
  document.body.append(panel);
  const summary=panel.querySelector('summary'), input=panel.querySelector('input'),list=panel.querySelector('ul');
  const output=panel.querySelector('output'),wave=panel.querySelector('[data-wave]');
  summary.title='People in the village';
  let count=1,noticeTimer;
  function title(){summary.textContent=name+' · '+(connected?count+' online':'Joining…')}
  function notice(text){output.textContent=text;panel.dataset.notice=text;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>{output.textContent='';delete panel.dataset.notice},4000)}
  panel.querySelector('form').onsubmit=e=>{
    e.preventDefault();name=villageName(input.value,id);input.value=name;
    try{localStorage.setItem(nameKey,name)}catch{}
    title();actions.rename();input.blur();notice('Name saved');
  };
  input.value=name;wave.disabled=true;title();
  if(!saved){try{localStorage.setItem(nameKey,name)}catch{}}
  wave.onclick=()=>{if(actions.wave())notice('You waved hello')};
  panel.querySelector('[data-invite]').onclick=async()=>{
    const url=new URL('./',location.href).href;
    try{await navigator.clipboard.writeText(url);notice('Village link copied')}
    catch{notice(url)}
  };
  function refresh(peers,online){
    connected=online;count=1+peers.size;title();wave.disabled=!online;
    list.replaceChildren();
    for(const [key,peer] of peers){
      const item=document.createElement('li'),label=document.createElement('span'),button=document.createElement('button');
      label.textContent=peer.name;
      button.type='button';button.textContent=peer.riding?'Flying':'Meet';
      button.setAttribute('aria-label','Meet '+peer.name);button.disabled=Boolean(peer.riding)||!online;
      button.onclick=()=>{const result=actions.meet(key);if(result===true){panel.open=false;notice('Joined '+peer.name)}else notice(result)};
      item.append(label,button);list.append(item);
    }
  }
  return {get name(){return name},refresh,notice};
}
