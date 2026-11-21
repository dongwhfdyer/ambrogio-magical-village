// One public, ephemeral village. Each tab owns its avatar and its balloon trip.
export function joinVillage(client, { scene, position, heading, riding, shuttle, draw, status }) {
  const id = crypto.randomUUID();
  const peers = new Map();
  const clothes = [0x498184, 0xa76442, 0x68794b, 0x815976, 0xb18139];
  let channel, timer, ready = false, disposed = false, previous = '', nextSend = 0;

  function pose() {
    const round = n => Math.round(n * 100) / 100;
    return { id, x: round(position.x), y: round(position.y), z: round(position.z),
      yaw: round(heading() % (2*Math.PI)), riding: riding() };
  }
  function valid(p) {
    return p && typeof p.id === 'string' && /^[a-f0-9-]{36}$/i.test(p.id) &&
      [p.x,p.y,p.z,p.yaw].every(Number.isFinite) && Math.abs(p.x)<100 &&
      Math.abs(p.z)<100 && p.y>=-1 && p.y<110 && typeof p.riding==='boolean';
  }
  function outfit(key) {
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
    if(p.riding && !peer.balloon) {
      peer.balloon=new THREE.Group();
      for(const part of shuttle) {
        const copy=part.clone();copy.position.set(3,-.60,-16);peer.balloon.add(copy);
      }
      scene.add(peer.balloon);
    }else if(!p.riding && peer.balloon){scene.remove(peer.balloon);peer.balloon=null}
    if(peer.balloon)peer.balloon.position.copy(peer.body.position);
    draw();
  }
  function remove(key) {
    const peer=peers.get(key);scene.remove(peer.body);
    if(peer.balloon)scene.remove(peer.balloon);
    for(const part of peer.body.children){part.geometry.dispose();part.material.dispose()}
    peers.delete(key);
  }
  function sync() {
    const members=channel.presenceState();
    for(const key of peers.keys())if(!members[key])remove(key);
    for(const [key,rows] of Object.entries(members)){
      const p=rows[0];
      if(key===id||peers.has(key)||!valid(p)||key!==p.id)continue;
      peers.set(key,outfit(key));update(p,true);
    }
    status.textContent=(peers.size+1)+' in village';
    previous='';draw();
  }
  function connect() {
    const room=client.channel('ambrogio-village-v1',{config:{presence:{key:id}}});
    channel=room;
    room.on('presence',{event:'sync'},()=>{if(channel===room)sync()});
    room.on('broadcast',{event:'pose'},({payload})=>{
      if(channel===room && valid(payload))update(payload);
    });
    function reconnect(){
      if(channel!==room||disposed)return;
      channel=null;ready=false;previous='';
      for(const key of peers.keys())remove(key);
      status.textContent='Reconnecting to village…';draw();
      client.removeChannel(room).finally(()=>{if(!disposed)timer=setTimeout(connect,2500)});
    }
    room.subscribe(async state=>{
      if(channel!==room)return;
      if(state==='SUBSCRIBED'){
        if(await room.track(pose())!=='ok'){reconnect();return}
        if(channel===room){ready=true;previous=''}
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
    for(const {body,to,yaw,balloon} of peers.values()){
      // Both visitors initially arrive at the same landing.
      const visible=body.position.distanceToSquared(position)>.15;
      if(body.visible!==visible){body.visible=visible;changed=true}
      const angle=Math.atan2(Math.sin(yaw-body.rotation.y),Math.cos(yaw-body.rotation.y));
      if(body.position.distanceToSquared(to)<.00001 && Math.abs(angle)<.002)continue;
      const f=1-Math.exp(-16*dt);
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
