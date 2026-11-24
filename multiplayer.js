import {villageName,nameTag,peoplePanel} from './village-people.js?v=crown1';
// One public, ephemeral village. Each tab owns its avatar and its balloon trip.
export function joinVillage(client, { scene, position, heading, riding, visitorId, appearance=visitorId, createVisitor, meetVisitor, player, setAvatarName, shuttle, draw, status, extras=()=>({}), broomState=()=>{}, networkHooks=()=>{} }) {
  const id = visitorId || crypto.randomUUID();
  const peers = new Map();
  const clothes = [0x498184, 0xa76442, 0x68794b, 0x815976, 0xb18139];
  let channel, timer, ready = false, disposed = false, previous = '', nextSend = 0;

  let nextWave=0,nextSnapshot=0,broomOwner='';
  function markChanged(){
    previous='';
  }
  function gesture(kind){
    if(ready)channel.send({type:'broadcast',event:'gesture',payload:{id,kind}});
  }
  function selectBroom(){
    const candidates=[...peers].map(([key,peer])=>[key,peer.claim]);
    candidates.push([id,extras().claim]);
    const winner=candidates.filter(([,claim])=>Number.isSafeInteger(claim)&&claim>0)
      .sort((a,b)=>a[1]-b[1]||a[0].localeCompare(b[0]))[0];
    broomOwner=winner?.[0]||'';
    const peer=peers.get(broomOwner);
    broomState(broomOwner,peer?.body.position,peer?.yaw);
  }
  const people=peoplePanel(id,{
    rename(){
      if(player)setAvatarName?.(player,people.name);
      markChanged();
      draw();
    },
    wave(){
      if(!ready || performance.now()<nextWave)return false;
      nextWave=performance.now()+2000;
      player?.userData.emote?.('wave');
      channel.send({type:'broadcast',event:'wave',payload:{id}});return true;
    },
    meet(key){
      const peer=peers.get(key);
      if(!peer || peer.riding)return 'Wait for your friend to land';
      return meetVisitor?.(peer.to,peer.yaw) ?? 'Refresh the viewer to meet here';
    }
  });
  if(player)setAvatarName?.(player,people.name);
  function label(peer,text){
    if(setAvatarName){setAvatarName(peer.body,text);return}
    if(peer.tag){
      peer.body.remove(peer.tag);peer.tag.material.map.dispose();peer.tag.material.dispose();
    }
    peer.tag=nameTag(text);peer.tag.position.y=2.10;peer.body.add(peer.tag);
  }
  function pose() {
    const round = n => Math.round(n * 100) / 100;
    return { id, x: round(position.x), y: round(position.y), z: round(position.z),
      yaw: round(heading() % (2*Math.PI)), riding: riding(), name:people.name, ...extras() };
  }
  function valid(p) {
    return p && typeof p.id === 'string' && /^[a-f0-9-]{36}$/i.test(p.id) &&
      [p.x,p.y,p.z,p.yaw].every(Number.isFinite) && Math.abs(p.x)<=150 &&
      Math.abs(p.z)<=150 && p.y>=-48 && p.y<=155 && typeof p.riding==='boolean';
  }
  function outfit(key,look) {
    if(createVisitor){
      const body=createVisitor(look);scene.add(body);
      return {body,to:new THREE.Vector3(),yaw:0,balloon:null};
    }
    // Compatibility with cached viewers from before the walking camera update.
    const body = new THREE.Group();
    function part(shape, color, y, z=0) {
      const mesh = new THREE.Mesh(shape, new THREE.MeshStandardMaterial({color}));
      mesh.position.set(0,y,z); body.add(mesh);
    }
    part(new THREE.CylinderGeometry(.19,.31,.91,9),clothes[parseInt(key.slice(0,4),16)%clothes.length],.77);
    part(new THREE.SphereGeometry(.235,12,8),0xd7a278,1.46);
    part(new THREE.CylinderGeometry(.23,.27,.14,12),0x604331,1.63);
    part(new THREE.SphereGeometry(.055,6,5),0xd7a278,1.45,-.222);
    for(const side of [-1,1]) {
      part(new THREE.CylinderGeometry(.086,.095,.43,8),0x493c33,.215);
      body.children.at(-1).position.x=side*.12;
    }
    scene.add(body);
    return {body, to:new THREE.Vector3(), yaw:0, balloon:null};
  }
  function update(p, initial=false) {
    const peer=peers.get(p.id);
    if(!peer)return;
    if(p.name){
      const name=villageName(p.name,p.id);
      if(name!==peer.name){peer.name=name;label(peer,name);people.refresh(peers,ready)}
    }
    peer.to.set(p.x,p.y,p.z);peer.yaw=p.yaw;
    if(initial) {peer.body.position.copy(peer.to);peer.body.rotation.y=p.yaw}
    const wasRiding=peer.riding;
    peer.riding=p.riding;peer.jump=Number.isFinite(p.jump)&&!p.riding?p.jump:null;
    const claim=p.riding&&Number.isSafeInteger(p.claim)?p.claim:0;
    if(claim!==peer.claim){peer.claim=claim;selectBroom()}
    const styleKey=JSON.stringify(p.style);
    if(styleKey!==peer.styleKey){peer.styleKey=styleKey;peer.body.userData.style?.(p.style)}
    const at=Array.isArray(p.balloon)&&p.balloon.length===3&&p.balloon.every(n=>Number.isFinite(n)&&Math.abs(n)<=155)
      ?p.balloon:(!p.claim && p.riding?[p.x,p.y,p.z]:null);
    if(at && !peer.balloon){
      peer.balloon=new THREE.Group();peer.balloon.name='Visitor balloon';
      for(const part of shuttle){
        const copy=part.clone();copy.position.set(3,-.60,-16);copy.visible=true;peer.balloon.add(copy);
      }
      scene.add(peer.balloon);
    }else if(!at && peer.balloon){scene.remove(peer.balloon);peer.balloon=null}
    if(at)peer.balloon.position.fromArray(at);
    if(wasRiding!==peer.riding)people.refresh(peers,ready);
    draw();
  }
  function remove(key) {
    const peer=peers.get(key);scene.remove(peer.body);
    if(peer.balloon)scene.remove(peer.balloon);
    setAvatarName?.(peer.body,null);
    if(peer.tag){peer.body.remove(peer.tag);peer.tag.material.map.dispose();peer.tag.material.dispose()}
    if(peer.body.userData.release)peer.body.userData.release();
    else for(const part of peer.body.children){part.geometry.dispose();part.material.dispose()}
    peers.delete(key);
  }
  function sync() {
    const members=channel.presenceState();
    for(const key of peers.keys())if(!members[key])remove(key);
    for(const [key,rows] of Object.entries(members)){
      const p=rows[0];
      if(key===id||!valid(p)||key!==p.id)continue;
      const name=villageName(p.name,key);
      let peer=peers.get(key);
      if(!peer){peer=outfit(key,/^[0-9a-f-]{36}$/i.test(p.appearance)?p.appearance:key);peer.name=name;peer.body.userData.visitorId=key;peers.set(key,peer);label(peer,name);update(p,true)}
    }
    selectBroom();
    status.textContent=(peers.size+1)+' in village';
    people.refresh(peers,ready);
    if(ready)channel.send({type:'broadcast',event:'pose',payload:pose()});
    previous='';draw();
  }
  function connect() {
    const room=client.channel('ambrogio-village-v1',{config:{presence:{key:id}}});
    channel=room;
    room.on('presence',{event:'sync'},()=>{if(channel===room)sync()});
    room.on('broadcast',{event:'pose'},({payload})=>{
      if(channel===room && valid(payload))update(payload);
    });
    room.on('broadcast',{event:'gesture'},({payload})=>{
      if(channel!==room)return;
      peers.get(payload?.id)?.body.userData.emote?.(payload?.kind);
    });
    room.on('broadcast',{event:'wave'},({payload})=>{
      const peer=peers.get(payload?.id);
      if(channel!==room||!peer||performance.now()<(peer.waveUntil||0))return;
      peer.body.userData.emote?.('wave');peer.waveUntil=performance.now()+2600;label(peer,'👋 '+peer.name);
      people.notice(peer.name+' waved hello');draw();
    });
    function reconnect(){
      if(channel!==room||disposed)return;
      channel=null;ready=false;previous='';
      for(const key of peers.keys())remove(key);
      broomOwner='';networkHooks(markChanged,gesture,false);broomState('');people.refresh(peers,false);
      status.textContent='Reconnecting to village…';draw();
      client.removeChannel(room).finally(()=>{if(!disposed)timer=setTimeout(connect,2500)});
    }
    room.subscribe(async state=>{
      if(channel!==room)return;
      if(state==='SUBSCRIBED'){
        if(await room.track({...pose(),name:people.name,appearance})!=='ok'){reconnect();return}
        if(channel===room){ready=true;previous='';networkHooks(markChanged,gesture,true);people.refresh(peers,true)}
      }else if(['CLOSED','TIMED_OUT','CHANNEL_ERROR'].includes(state))reconnect();
    });
  }
  connect();
  addEventListener('pagehide',()=>{
    disposed=true;ready=false;clearTimeout(timer);
    const leaving=channel;channel=null;
    if(leaving)client.removeChannel(leaving);
  });
  addEventListener('pageshow',e=>{if(e.persisted)location.reload()});
  return (now,dt)=>{
    if(ready && now>=nextSend){
      nextSend=now+125;
      const p=pose(),message=JSON.stringify(p);
      if(message!==previous || now>=nextSnapshot){
        nextSnapshot=now+3500;
        previous=message;channel.send({type:'broadcast',event:'pose',payload:p});
      }
    }
    let changed=false;
    for(const peer of peers.values()){
      const {body,to,yaw,balloon}=peer;
      if(peer.waveUntil && now>=peer.waveUntil){peer.waveUntil=0;label(peer,peer.name);changed=true}
      // Both visitors initially arrive at the same landing.
      const visible=Boolean(player?.visible) || body.position.distanceToSquared(position)>.15;
      if(body.visible!==visible){body.visible=visible;changed=true}
      const angle=Math.atan2(Math.sin(yaw-body.rotation.y),Math.cos(yaw-body.rotation.y));
      if(body.position.distanceToSquared(to)<.00001 && Math.abs(angle)<.002){
        if(body.userData.stride?.(0,dt))changed=true;
      }else{
        const f=1-Math.exp(-16*dt);
        const traveled=f*Math.hypot(to.x-body.position.x,to.z-body.position.z);
        body.userData.stride?.(peer.riding||peer.jump!==null?0:traveled,dt);
        body.position.lerp(to,f);body.rotation.y+=angle*f;
        if(balloon && peer.riding && !peer.claim)balloon.position.copy(body.position);
        changed=true;
      }
      if(body.userData.animateAction?.(now,broomOwner===peer.body.userData.visitorId,peer.jump))changed=true;
      if(broomOwner===peer.body.userData.visitorId)broomState(broomOwner,body.position,body.rotation.y);
    }
    if(changed)draw();
  };
}

export async function startMultiplayer(world) {
  const config=await fetch('./multiplayer-config.json',{cache:'no-cache'}).then(r=>r.json());
  if(!config.url || !config.publishableKey)return;
  world.status.textContent='Joining village…';
  const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.4/+esm');
  const client=createClient(config.url,config.publishableKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  return joinVillage(client,world);
}
