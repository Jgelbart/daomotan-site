/* ================= B9 THEME MUSIC =================
   The boss's B9 Theme, written in his Melody Cartridge (2026-09-24): four bars of
   G minor at 132 BPM, 29 eighth notes. This engine is the same in all three B9
   games; each game dresses the tune in its own arrangements (MUSIC, just above):
   tempo, key, sounds, chords and a beat. Chords under the tune: Gm | Eb | Cm | Bb F.
   The game says what it wants to hear through musicWant(). MUSIC in the pause
   menu sets its level, 0-10 (0 is off), and M turns it off and back on --
   remembered for all three games ('b9musvol'; 'b9music', the old on/off, is
   still written and read). VOLUME, under it, is everything (B9VOL, below).
   An arrangement is sections of four bars; each section is a string of parts:
   M the tune, O the tune an octave up, E the tune in bars 1 and 3 only (call and
   answer), H a harmony under the tune, P pad chords, A arpeggio, B bass,
   D the drums, d kick and hats only, F a snare fill into the next section. */
const B9MUS=(()=>{
/* the tune as written: 16th step -> MIDI note, every note an eighth */
const TUNE={};[0,16,32].forEach(o=>[[0,55],[4,67],[6,67],[8,58],[10,58],[12,60],[14,62]].forEach(([s,p])=>TUNE[s+o]=p));
[[48,67],[50,67],[52,62],[54,62],[56,65],[58,65],[60,58],[62,58]].forEach(([s,p])=>TUNE[s]=p);
/* one chord per half bar, voiced round G3, and the bass root under each */
const CH=[[55,58,62],[55,58,62],[55,58,63],[55,58,63],[55,60,63],[55,60,63],[53,58,62],[53,57,60]];
const RT=[43,43,39,39,48,48,46,41];
const same=(a,b)=>CH[a]&&CH[b]&&CH[a].join()===CH[b].join();
/* the harmony voice: the highest chord note at least a minor third under the tune */
function harm(p,ch){let b=null;for(const c of ch)for(let o=-36;o<=36;o+=12){const q=c+o;if(q<=p-3&&(b===null||q>b))b=q;}return b;}
const hz=m=>440*Math.pow(2,(m-69)/12);
const PW=new WeakMap(),NZ=new WeakMap();
function pulse(c){let w=PW.get(c);if(!w){const N=48,re=new Float32Array(N),im=new Float32Array(N);
  for(let n=1;n<N;n++)re[n]=2/(n*Math.PI)*Math.sin(n*Math.PI*.25);w=c.createPeriodicWave(re,im);PW.set(c,w);}return w;}
function noise(c){let b=NZ.get(c);if(!b){b=c.createBuffer(1,c.sampleRate,c.sampleRate);const d=b.getChannelData(0);
  for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;NZ.set(c,b);}return b;}
function panTo(c,x,dst){if(!x||!c.createStereoPanner)return dst;const p=c.createStereoPanner();p.pan.value=x;p.connect(dst);return p;}
/* ONE NOTE. o is the instrument: w wave (sine triangle square sawtooth pulse bell), v volume,
   a attack, r release, pl pluck (rings down with this time constant instead of holding),
   cut low-pass, sw filter sweep (starts sw times higher), q resonance, det detune in cents
   (two voices), vib vibrato in semitones, fx echo send, bus 'pump' to duck under the kick */
function voice(c,out,o,m,t,dur,px){
  const g=c.createGain();g.connect(panTo(c,px||o.pan,out[o.bus||'main']));
  if(o.fx){const s=c.createGain();s.gain.value=o.fx;g.connect(s);s.connect(out.fx);}
  let head=g;
  if(o.cut){const lp=c.createBiquadFilter();lp.type='lowpass';lp.Q.value=o.q||.7;
    if(o.sw){lp.frequency.setValueAtTime(o.cut*o.sw,t);lp.frequency.exponentialRampToValueAtTime(o.cut,t+(o.swt||.25));}
    else lp.frequency.value=o.cut;lp.connect(g);head=lp;}
  const f=hz(m),a=o.a||.005,r=o.r||.04,end=Math.max(t+a+.02,t+dur),stop=o.pl?t+a+o.pl*5:end+r*2;
  const car=[],all=[];
  const mk=d=>{const x=c.createOscillator();if(o.w==='pulse')x.setPeriodicWave(pulse(c));else x.type=o.w==='bell'?'sine':o.w;
    x.frequency.value=f;if(d)x.detune.value=d;x.connect(head);car.push(x);all.push(x);};
  if(o.det){mk(o.det);mk(-o.det);}else mk(0);
  if(o.w==='bell'){const mo=c.createOscillator(),mg=c.createGain();mo.frequency.value=f*(o.ratio||3.5);
    mg.gain.setValueAtTime(f*(o.idx||1.2),t);mg.gain.exponentialRampToValueAtTime(f*.01,t+(o.idt||.5));
    mo.connect(mg);for(const x of car)mg.connect(x.frequency);all.push(mo);}
  if(o.vib){const l=c.createOscillator(),lg=c.createGain();l.frequency.value=o.vibr||5.5;
    lg.gain.setValueAtTime(0,t);lg.gain.linearRampToValueAtTime(f*(Math.pow(2,o.vib/12)-1),t+Math.max(.05,Math.min(.35,dur)));
    l.connect(lg);for(const x of car)lg.connect(x.frequency);all.push(l);}
  const v=o.det?o.v*.6:o.v;
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+a);
  if(o.pl)g.gain.setTargetAtTime(0,t+a,o.pl);else g.gain.setTargetAtTime(0,end,r/3);
  for(const x of all){x.start(t);x.stop(stop);}}
/* THE KITS: chip (NES-style), club (drum machine), soft (brushes), junk (clanks) */
function hit(c,out,k,kit,t,v){const d=out.main;
  if(k==='k'){const o=c.createOscillator(),g=c.createGain(),chip=kit==='chip';o.type=chip?'triangle':'sine';
    o.frequency.setValueAtTime(chip?210:150,t);o.frequency.exponentialRampToValueAtTime(chip?48:42,t+.11);
    const vol=v*(kit==='soft'?.2:chip?.34:.3),len=kit==='club'?.34:.22;
    g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+len);o.connect(g);g.connect(d);o.start(t);o.stop(t+len+.02);
    if(out.pumpOn){const p=out.pump.gain;p.cancelScheduledValues(t);p.setValueAtTime(1,t);p.linearRampToValueAtTime(.3,t+.012);p.linearRampToValueAtTime(1,t+out.sd*3.5);}
    return;}
  if(k==='m'){/* a clank: two squares at a clashing ratio through a band-pass */
    const g=c.createGain(),bp=c.createBiquadFilter();bp.type='bandpass';bp.frequency.value=2400;bp.Q.value=1.5;
    for(const f of [540,540*1.53]){const o=c.createOscillator();o.type='square';o.frequency.value=f*(.97+Math.random()*.06);o.connect(bp);o.start(t);o.stop(t+.12);}
    g.gain.setValueAtTime(.1*v,t);g.gain.exponentialRampToValueAtTime(.001,t+.1);bp.connect(g);g.connect(panTo(c,.3,d));return;}
  const s=c.createBufferSource();s.buffer=noise(c);const f=c.createBiquadFilter(),g=c.createGain();
  let len,vol,px=0;
  if(k==='s'){f.type='bandpass';f.frequency.value=kit==='chip'?3200:1800;f.Q.value=.8;len=kit==='soft'?.12:.16;vol=kit==='soft'?.07:.16;
    if(kit!=='chip'&&kit!=='soft'){const o=c.createOscillator(),og=c.createGain();o.type='triangle';o.frequency.setValueAtTime(190,t);o.frequency.exponentialRampToValueAtTime(150,t+.08);
      og.gain.setValueAtTime(.12*v,t);og.gain.exponentialRampToValueAtTime(.001,t+.09);o.connect(og);og.connect(d);o.start(t);o.stop(t+.1);}}
  else if(k==='h'){f.type='highpass';f.frequency.value=8000;len=.035;vol=kit==='soft'?.03:.05;px=-.25;}
  else{f.type='highpass';f.frequency.value=6500;len=.18;vol=.045;px=.25;}
  g.gain.setValueAtTime(vol*v,t);g.gain.exponentialRampToValueAtTime(.001,t+len);
  s.connect(f);f.connect(g);g.connect(panTo(c,px,d));s.start(t,Math.random()*.5);s.stop(t+len+.02);}
/* ONE 16th of an arrangement, i steps in */
function step(c,out,A,i,t,sd){
  out.sd=sd;out.pumpOn=!!A.pump;
  if(A.seq){for(const e of A.seq)if(e[0]===i)voice(c,out,A[e[3]||'lead'],e[2]+(A.key||0),t,e[1]*sd);return;}
  const s=i%64,sec=A.form[Math.floor(i/64)%A.form.length],K=A.key||0,h=s>>3,bar=s>>4,j=s%16,has=x=>sec.includes(x);
  const ch=CH[h].map(n=>n+K),mid=!same(bar*2,bar*2+1);
  const p0=TUNE[s];
  if(p0!=null&&!(has('E')&&bar%2)){const L=A.lead,p=p0+K+(L.oct||0),len=(L.len||1.7)*sd,low=has('M')||has('E');
    if(low)voice(c,out,L,p,t,len);
    if(has('O'))voice(c,out,A.hi||L,p+12,t,len);
    if(has('H')){const q=harm(low?p:p+12,ch);if(q!==null)voice(c,out,A.harm||L,q,t,len);}}
  if(has('P')&&s%8===0&&(j===0||!same(h,h-1))){const n=h<7&&same(h,h+1)?16:8;
    for(const x of ch)voice(c,out,A.pad,x+(A.pad.oct||0),t,n*sd);}
  if(has('A')){const R=A.arp,rt=R.rate||1;if(s%rt===0){const k=s/rt,tn=[ch[0],ch[1],ch[2],ch[0]+12,ch[1]+12,ch[2]+12];
    voice(c,out,R,tn[R.pat[k%R.pat.length]]+(R.oct||0),t,rt*sd*(R.gate||.7),k%2?.35:-.35);}}
  if(has('B')){const B=A.bass,pt=B.pat;let x=pt[j];if(x==='-'&&j===8&&mid)x='r';
    if(x==='r'||x==='o'||x==='f'){const lim=mid&&j<8?8:16;let n=1;while(j+n<lim&&pt[j+n]==='-')n++;
      voice(c,out,B,RT[h]+K+(B.oct||0)+(x==='o'?12:x==='f'?7:0),t,n*sd*(B.gate||.85));}}
  const D=A.drums;
  if(D&&(has('D')||has('d'))){const full=has('D'),fill=has('F')&&s>=56;
    const at=(str,k)=>{const q=str&&str[j];if(q&&q!=='.')hit(c,out,k,D.kit,t,q==='x'?1:.5);};
    at(D.k,'k');at(D.h,'h');if(full&&!fill){at(D.s,'s');at(D.o,'o');at(D.m,'m');}
    if(fill&&s%(D.fr||1)===0)hit(c,out,'s',D.kit,t,.35+.65*(s-56)/7);}}
/* the music's own little mixer: parts -> main -> bus (off switch) -> low-pass (muffled
   in the pause menu) -> the game's master. The echo is its own too, a dotted eighth. */
function rig(c,dest){const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=16000;lp.connect(dest);
  const bus=c.createGain();bus.connect(lp);const main=c.createGain();main.connect(bus);
  const pump=c.createGain();pump.connect(main);
  const fx=c.createGain(),dl=c.createDelay(2),fb=c.createGain(),fl=c.createBiquadFilter();fl.type='lowpass';fl.frequency.value=2600;
  fx.connect(dl);dl.connect(fl);fl.connect(fb);fb.connect(dl);fl.connect(main);
  return {lp,bus,main,pump,fx,dl,fb,sd:.1,pumpOn:false};}
function dress(out,A,bpm,t){out.main.gain.setValueAtTime(A.vol||1,t);out.dl.delayTime.setValueAtTime(Math.min(1.5,.75*60/bpm),t);out.fb.gain.setValueAtTime(A.echo!=null?A.echo:.3,t);}
/* the level, 0-10, 3 dB a step; 0 is off, and last is where M brings it back to */
const S={lv:10,last:10,id:null,A:null,i:0,next:0,done:true,muf:null,out:null};
const lvl=v=>Math.max(0,Math.min(10,Math.round(+v)||0)),lvGain=v=>v>0?Math.pow(10,(v-10)*3/20):0;
try{const v=localStorage.getItem('b9musvol');S.lv=v!==null?lvl(v):localStorage.getItem('b9music')==='0'?0:10;
  S.last=lvl(localStorage.getItem('b9muslast')||10)||10;}catch(e){}
function tick(){if(typeof AC==='undefined'||!AC||!MASTER)return;
  if(!S.out){S.out=rig(AC,MASTER);S.out.bus.gain.value=lvGain(S.lv);}
  const now=AC.currentTime,w=S.lv>0?musicWant():null,muf=!!(w&&w.muffle);
  if(muf!==S.muf){S.muf=muf;S.out.lp.frequency.setTargetAtTime(muf?520:16000,now,.15);}
  const A=w&&MUSIC[w.id];if(!A){S.id=null;return;}
  const bpm=w.bpm||A.bpm;
  if(w.id!==S.id){S.id=w.id;S.A=A;S.i=0;S.done=false;S.next=Math.max(S.next,now+.05);dress(S.out,A,bpm,S.next);}
  if(S.next<now-.2)S.next=now+.05;
  while(!S.done&&S.next<now+.25){const sd=60/bpm/4;step(AC,S.out,A,S.i,S.next,sd);S.next+=sd;
    if(++S.i>=(A.len||A.form.length*64)){if(A.once)S.done=true;S.i=0;}}}
function setLevel(v){v=lvl(v);if(v===S.lv)return;if(S.lv>0)S.last=S.lv;S.lv=v;
  try{localStorage.setItem('b9musvol',v);localStorage.setItem('b9muslast',S.last);localStorage.setItem('b9music',v>0?'1':'0');}catch(e){}
  if(S.out)S.out.bus.gain.setTargetAtTime(lvGain(v),AC.currentTime,.06);if(!v)S.id=null;}
function toggle(){setLevel(S.lv>0?0:S.last);}
setInterval(tick,40);
return {toggle,setLevel,step,rig,dress,get level(){return S.lv;},get on(){return S.lv>0;},get playing(){return S.id;}};})();
/* THE VOLUME (the boss, 2026-09-24: "volume settings in their pause menus"): everything
   the game plays, 0-10, 3 dB a step (0 is silent), remembered for all three games
   ('b9vol'). It turns the output trim after the limiter, and 10 is the level the games
   already had -- clear of the chest speaker's ceiling -- so it only ever comes down. */
const B9VOL=(()=>{let v=10,node=null,base=1;
try{const s=localStorage.getItem('b9vol');if(s!==null)v=Math.max(0,Math.min(10,Math.round(+s)||0));}catch(e){}
const g=()=>v>0?base*Math.pow(10,(v-10)*3/20):0;
function trim(n,b){node=n;base=b;n.gain.value=g();}
function set(x){v=Math.max(0,Math.min(10,Math.round(x)));try{localStorage.setItem('b9vol',v);}catch(e){}
  if(node)node.gain.setTargetAtTime(g(),node.context.currentTime,.03);}
return {trim,set,get level(){return v;}};})();
