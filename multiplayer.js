import {villageName,nameTag,peoplePanel} from './village-people.js';
// One public, ephemeral village. Each tab owns its avatar and its balloon trip.
export function joinVillage(client, { scene, position, heading, riding, visitorId, appearance=visitorId, createVisitor, meetVisitor, shuttle, draw, status }) {
  const id = visitorId || crypto.randomUUID();
  const peers = new Map();
  const clothes = [0x498184, 0xa76442, 0x68794b, 0x815976, 0xb18139];
  let channel, timer, ready = false, disposed = false, previous = '', nextSend = 0;

  let nextWave=0;
  const people=peoplePanel(id,{
    rename(){if(ready)channel.track({...pose(),name:people.name,appearance})},
    wave(){
      if(!ready || performance.now()<nextWave)return false;
      nextWave=performance.now()+2000;
      channel.send({type:'broadcast',event:'wave',payload:{id}});return true;
    },
    meet(key){
      const peer=peers.get(key);
      if(!peer || peer.balloon)return 'Wait for your friend to land';
      return meetVisitor?.(peer.to,peer.yaw) ?? 'Refresh the viewer to meet here';
    }
  });
  function label(peer,text){
    if(peer.tag){
      peer.body.remove(peer.tag);peer.tag.material.map.dispose();peer.tag.material.dispose();
    }
    peer.tag=nameTag(text);peer.tag.position.y=2.10;peer.body.add(peer.tag);
  }
  function pose() {
    const round = n => Math.round(n * 100) / 100;
    return { id, x: round(position.x), y: round(position.y), z: round(position.z),
      yaw: round(heading() % (2*Math.PI)), riding: riding() };
  }
  function valid(p) {
    return p && typeof p.id === 'string' && /^[a-f0-9-]{36}$/i.test(p.id) &&
      [p.x,p.y,p.z,p.yaw].every(Number.isFinite) && Math.abs(p.x)<=150 &&
      Math.abs(p.z)<=150 && p.y>=-31 && p.y<=155 && typeof p.riding==='boolean';
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
    peer.to.set(p.x,p.y,p.z);peer.yaw=p.yaw;
    if(initial) {peer.body.position.copy(peer.to);peer.body.rotation.y=p.yaw}
    const hadBalloon=Boolean(peer.balloon);
    if(p.riding && !peer.balloon) {
      peer.balloon=new THREE.Group();
      for(const part of shuttle) {
        const copy=part.clone();copy.position.set(3,-.60,-16);peer.balloon.add(copy);
      }
      scene.add(peer.balloon);
    }else if(!p.riding && peer.balloon){scene.remove(peer.balloon);peer.balloon=null}
    if(peer.balloon)peer.balloon.position.copy(peer.body.position);
    if(hadBalloon!==Boolean(peer.balloon))people.refresh(peers,ready);
    draw();
  }
  function remove(key) {
    const peer=peers.get(key);scene.remove(peer.body);
    if(peer.balloon)scene.remove(peer.balloon);
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
      if(!peer){peer=outfit(key,/^[0-9a-f-]{36}$/i.test(p.appearance)?p.appearance:key);peer.name=name;peers.set(key,peer);label(peer,name);update(p,true)}
      else if(peer.name!==name){peer.name=name;label(peer,name)}

    }
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
    room.on('broadcast',{event:'wave'},({payload})=>{
      const peer=peers.get(payload?.id);
      if(channel!==room||!peer||performance.now()<(peer.waveUntil||0))return;
      peer.waveUntil=performance.now()+2600;label(peer,'👋 '+peer.name);
      people.notice(peer.name+' waved hello');draw();
    });
    function reconnect(){
      if(channel!==room||disposed)return;
      channel=null;ready=false;previous='';
      for(const key of peers.keys())remove(key);
      people.refresh(peers,false);
      status.textContent='Reconnecting to village…';draw();
      client.removeChannel(room).finally(()=>{if(!disposed)timer=setTimeout(connect,2500)});
    }
    room.subscribe(async state=>{
      if(channel!==room)return;
      if(state==='SUBSCRIBED'){
        if(await room.track({...pose(),name:people.name,appearance})!=='ok'){reconnect();return}
        if(channel===room){ready=true;previous='';people.refresh(peers,true)}
      }else if(['CLOSED','TIMED_OUT','CHANNEL_ERROR'].includes(state))reconnect();
    });
  }
  connect();
  addEventListener('pagehide',e=>{
    if(e.persisted)return;
    disposed=true;ready=false;clearTimeout(timer);
    if(channel)client.removeChannel(channel);
  });
  return (now,dt)=>{
    if(ready && now>=nextSend){
      nextSend=now+125;
      const p=pose(),message=JSON.stringify(p);
      if(message!==previous){
        previous=message;channel.send({type:'broadcast',event:'pose',payload:p});
      }
    }
    let changed=false;
    for(const peer of peers.values()){
      const {body,to,yaw,balloon}=peer;
      if(peer.waveUntil && now>=peer.waveUntil){peer.waveUntil=0;label(peer,peer.name);changed=true}
      // Both visitors initially arrive at the same landing.
      const visible=body.position.distanceToSquared(position)>.15;
      if(body.visible!==visible){body.visible=visible;changed=true}
      const angle=Math.atan2(Math.sin(yaw-body.rotation.y),Math.cos(yaw-body.rotation.y));
      if(body.position.distanceToSquared(to)<.00001 && Math.abs(angle)<.002){
        if(body.userData.stride?.(0,dt))changed=true;
        continue;
      }
      const f=1-Math.exp(-16*dt);
      const traveled=f*Math.hypot(to.x-body.position.x,to.z-body.position.z);
      body.userData.stride?.(balloon?0:traveled,dt);
      body.position.lerp(to,f);body.rotation.y+=angle*f;
      if(balloon)balloon.position.copy(body.position);
      changed=true;
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
