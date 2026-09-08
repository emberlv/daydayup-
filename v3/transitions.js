(()=>{
  const clamp01=v=>Math.max(0,Math.min(1,v));
  const ease={
    linear:t=>t,
    inOutCubic:t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,
    outExpo:t=>t===1?1:1-Math.pow(2,-10*t),
    inOutSine:t=>-(Math.cos(Math.PI*t)-1)/2,
    smooth:t=>t*t*(3-2*t)
  };
  const lerp=(a,b,t)=>a+(b-a)*t;
  const vec3=(a,b,t)=>({x:lerp(a.x,b.x,t),y:lerp(a.y,b.y,t),z:lerp(a.z,b.z,t)});

  class Timeline{
    constructor(){this.tracks=[];}
    add({from=0,to=1,start=0,end=1,easing='inOutCubic',apply}){this.tracks.push({from,to,start,end,easing,apply});return this;}
    sample(t,ctx){for(const tr of this.tracks){const local=clamp01((t-tr.start)/Math.max(.0001,tr.end-tr.start));const e=(ease[tr.easing]||ease.linear)(local);tr.apply?.(lerp(tr.from,tr.to,e),e,t,ctx);}return this;}
  }

  class CameraTrack{
    constructor(camera,keyframes=[]){this.camera=camera;this.keyframes=keyframes.sort((a,b)=>a.t-b.t);}
    sample(t){
      if(!this.keyframes.length)return;
      t=clamp01(t);
      let a=this.keyframes[0],b=this.keyframes[this.keyframes.length-1];
      for(let i=0;i<this.keyframes.length-1;i++){if(t>=this.keyframes[i].t&&t<=this.keyframes[i+1].t){a=this.keyframes[i];b=this.keyframes[i+1];break;}}
      const u=clamp01((t-a.t)/Math.max(.0001,b.t-a.t));const e=(ease[b.easing||'inOutCubic']||ease.inOutCubic)(u);
      if(a.position&&b.position){const p=vec3(a.position,b.position,e);this.camera.position.set(p.x,p.y,p.z);}
      if(a.fov!=null&&b.fov!=null){this.camera.fov=lerp(a.fov,b.fov,e);this.camera.updateProjectionMatrix();}
      if(a.rotation&&b.rotation){const r=vec3(a.rotation,b.rotation,e);this.camera.rotation.set(r.x,r.y,r.z);}
    }
  }

  class TransitionManager{
    constructor(){this.registry=new Map();this.active=null;}
    define(name,config){this.registry.set(name,config);return this;}
    start(name,ctx,override={}){const base=this.registry.get(name);if(!base)throw new Error(`Unknown transition: ${name}`);this.active={name,t:0,...base,...override,ctx};this.active.onStart?.(ctx,this.active);return this.active;}
    update(dt){if(!this.active)return false;const a=this.active;a.t=clamp01(a.t+dt/Math.max(.001,a.duration||1));const e=(ease[a.easing||'inOutCubic']||ease.inOutCubic)(a.t);a.onUpdate?.(e,a.t,a.ctx,a);if(a.t>=1){const done=a.onComplete;const ctx=a.ctx;this.active=null;done?.(ctx);return true;}return false;}
    get running(){return !!this.active;}
  }

  window.NomadicTransitions={clamp01,ease,Timeline,CameraTrack,TransitionManager};
})();
