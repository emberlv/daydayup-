(()=>{
  class InputState{
    constructor(){
      this.pointer={x:0,y:0,nx:0,ny:0,dx:0,dy:0,startX:0,startY:0,down:false};
      this.wheel=0;this.hold=0;this.drag=0;
    }
    pointerDown(e){const p=this.pointer;p.down=true;p.startX=p.x=e.clientX;p.startY=p.y=e.clientY;p.dx=p.dy=0;this.drag=0;}
    pointerMove(e,w=innerWidth,h=innerHeight){const p=this.pointer;const ox=p.x,oy=p.y;p.x=e.clientX;p.y=e.clientY;p.dx=e.movementX??p.x-ox;p.dy=e.movementY??p.y-oy;p.nx=p.x/w*2-1;p.ny=-(p.y/h*2-1);if(p.down)this.drag=Math.hypot(p.x-p.startX,p.y-p.startY);}
    pointerUp(){this.pointer.down=false;this.hold=0;}
    addWheel(delta){this.wheel+=delta;}
    frame(dt){this.hold=this.pointer.down?this.hold+dt:0;this.wheel*=.86;}
  }

  class Chapter{
    constructor(id,label,hooks={}){this.id=id;this.label=label;this.progress=0;this.hooks=hooks;this.active=false;}
    enter(ctx){this.active=true;this.progress=0;this.hooks.enter?.(ctx,this);}
    update(ctx,dt,now){this.hooks.update?.(ctx,this,dt,now);}
    leave(ctx){this.hooks.leave?.(ctx,this);this.active=false;}
  }

  class ExperienceController{
    constructor({labels=[],onChapterChange=null}={}){
      this.input=new InputState();
      this.labels=labels;
      this.onChapterChange=onChapterChange;
      this.chapters=new Map();
      this.index=1;this.phase='chapter';this.transition=null;
    }
    register(index,hooks={}){const c=new Chapter(index,this.labels[index-1]||String(index),hooks);this.chapters.set(index,c);return c;}
    go(index,meta={}){
      if(index===this.index&&this.chapters.get(index)?.active)return;
      this.chapters.get(this.index)?.leave(this);
      this.index=index;this.phase='chapter';
      const c=this.chapters.get(index);c?.enter(this);
      this.onChapterChange?.(index,c?.label,meta);
    }
    setProgress(value){const c=this.chapters.get(this.index);if(c)c.progress=Math.max(0,Math.min(1,value));return c?.progress??0;}
    startTransition({duration=1,onUpdate,onComplete}={}){this.phase='transition';this.transition={t:0,duration,onUpdate,onComplete};}
    update(dt,now){
      this.input.frame(dt);
      if(this.phase==='transition'&&this.transition){const tr=this.transition;tr.t=Math.min(1,tr.t+dt/tr.duration);tr.onUpdate?.(tr.t,this,now);if(tr.t>=1){const done=tr.onComplete;this.transition=null;this.phase='chapter';done?.(this);}}
      this.chapters.get(this.index)?.update(this,dt,now);
    }
  }

  window.NomadicCore={InputState,Chapter,ExperienceController};
})();
