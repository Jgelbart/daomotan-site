// THE DAOMSYS BOOT SCREEN, the arcade's copy. The same screen NAN II shows while he
// loads (b9_face.html daomsys()): a green phosphor tube, NAN II's drawing, and
// "> BOOT DAOMSYS / DAOMOTAN / PERSONAL ROBOTICS / UNIT NAN II : LINK OFFLINE".
// Slightly animated and nothing pulses: the tube switches on, the lines type, the
// drawing scans in, the cursor blinks, and every nine seconds NAN II turns his eye
// to look at you, then back to the road. Here it also sleeps while it is scrolled
// out of sight, and shows itself finished, still, to anyone who asked for less motion.
(function(){
  'use strict';
  const ROBOT = 'img/nan2-robot.png';        // white ink on clear, pupil cut out (drawn live)
  const INK = '#62ff7e', GLOW = 'rgba(98,255,126,.55)';
  const FONT = {
    'A':['01110','10001','10001','11111','10001','10001','10001'],
    'B':['11110','10001','10001','11110','10001','10001','11110'],
    'C':['01110','10001','10000','10000','10000','10001','01110'],
    'D':['11110','10001','10001','10001','10001','10001','11110'],
    'E':['11111','10000','10000','11110','10000','10000','11111'],
    'F':['11111','10000','10000','11110','10000','10000','10000'],
    'I':['01110','00100','00100','00100','00100','00100','01110'],
    'K':['10001','10010','10100','11000','10100','10010','10001'],
    'L':['10000','10000','10000','10000','10000','10000','11111'],
    'M':['10001','11011','10101','10101','10001','10001','10001'],
    'N':['10001','10001','11001','10101','10011','10001','10001'],
    'O':['01110','10001','10001','10001','10001','10001','01110'],
    'P':['11110','10001','10001','11110','10000','10000','10000'],
    'R':['11110','10001','10001','11110','10100','10010','10001'],
    'S':['01111','10000','10000','01110','00001','00001','11110'],
    'T':['11111','00100','00100','00100','00100','00100','00100'],
    'U':['10001','10001','10001','10001','10001','10001','01110'],
    'Y':['10001','10001','01010','00100','00100','00100','00100'],
    '>':['01000','00100','00010','00001','00010','00100','01000'],
    ':':['00000','01100','01100','00000','01100','01100','00000'],
    ' ':['00000','00000','00000','00000','00000','00000','00000'],
  };

  function line(text, px){
    const pad = Math.ceil(px * 2), adv = 6 * px, c = document.createElement('canvas');
    c.width = Math.ceil(text.length * adv + pad * 2); c.height = Math.ceil(7 * px + pad * 2);
    const x = c.getContext('2d');
    x.fillStyle = INK; x.shadowColor = GLOW; x.shadowBlur = px * 1.3;
    const s = px * 0.86, r = Math.min(px * 0.28, 3);
    [...text].forEach((ch, i) => {
      const g = FONT[ch] || FONT[' '];
      for(let row = 0; row < 7; row++) for(let col = 0; col < 5; col++){
        if(g[row][col] !== '1') continue;
        x.beginPath(); x.roundRect(pad + i * adv + col * px, pad + row * px, s, s, r); x.fill();
      }
    });
    return {c, pad, adv, n: text.length, px};
  }

  function boot(el){
    const W = 1280, H = 800, x = el.getContext('2d');
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const glass = document.createElement('canvas'); glass.width = W; glass.height = H;
    { const g = glass.getContext('2d'), rg = g.createRadialGradient(W/2, H/2, 80, W/2, H/2, 820);
      rg.addColorStop(0, '#07170c'); rg.addColorStop(1, '#020704'); g.fillStyle = rg; g.fillRect(0, 0, W, H); }
    const lines = document.createElement('canvas'); lines.width = W; lines.height = H;
    { const g = lines.getContext('2d'); g.fillStyle = 'rgba(0,0,0,.34)'; for(let y = 0; y < H; y += 3) g.fillRect(0, y, W, 1); }
    const robot = document.createElement('canvas'); let ready = false;
    const img = new Image();
    img.onload = () => { robot.width = img.width; robot.height = img.height;
      const g = robot.getContext('2d'); g.drawImage(img, 0, 0);
      g.globalCompositeOperation = 'source-in'; g.fillStyle = INK; g.fillRect(0, 0, img.width, img.height);
      ready = true; if(still) draw(1e9); };
    img.src = ROBOT;
    const RS = 0.95, RX = 170, RY = 226, EYE_X = RX + 271.5 * RS, EYE_Y = RY + 126 * RS, EYE_R = 25 * RS, TX = 578;
    const text = [
      {l: line('> BOOT DAOMSYS', 3), y: 262, at: 250, per: 45},
      {l: line('DAOMOTAN', 10), y: 300, at: 1500, per: 70},
      {l: line('PERSONAL ROBOTICS', 4.4), y: 404, at: 2150, per: 30},
      {l: line('UNIT NAN II : LINK OFFLINE', 3.2), y: 468, at: 2750, per: 30},
    ];
    const last = text[text.length - 1], typedAt = last.at + last.l.n * last.per;
    const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    function look(t){
      if(still || t < 3600) return 0;
      const k = (t - 3600) % 9000;
      if(k < 700) return ease(k / 700);
      if(k < 2600) return 1;
      if(k < 3300) return 1 - ease((k - 2600) / 700);
      return 0;
    }
    function draw(t){
      x.clearRect(0, 0, W, H); x.save();
      const on = Math.min(1, t / 260);
      if(on < 1){ x.translate(0, H / 2 * (1 - ease(on))); x.scale(1, Math.max(.004, ease(on))); }
      x.drawImage(glass, 0, 0);
      if(ready){
        const k = Math.max(0, Math.min(1, (t - 900) / 800)), rw = robot.width * RS, rh = robot.height * RS;
        if(k > 0){
          x.save(); x.beginPath(); x.rect(RX - 20, RY - 20, rw + 40, (rh + 40) * k); x.clip();
          x.shadowColor = GLOW; x.shadowBlur = 9; x.drawImage(robot, RX, RY, rw, rh);
          const p = look(t);
          x.strokeStyle = INK; x.lineWidth = 3.4 * RS; x.beginPath();
          x.ellipse(EYE_X + 33 * RS * (1 - p), EYE_Y, (9 + 16 * p) * RS, EYE_R, 0, 0, Math.PI * 2); x.stroke();
          x.restore();
          if(k < 1){ x.fillStyle = 'rgba(160,255,180,.55)'; x.fillRect(RX - 20, RY - 20 + (rh + 40) * k - 2, rw + 40, 2); }
        }
      }
      x.shadowBlur = 0;
      for(const w of text){
        const n = Math.max(0, Math.min(w.l.n, Math.floor((t - w.at) / w.per)));
        if(!n) continue;
        const cw = w.l.pad + n * w.l.adv;
        x.drawImage(w.l.c, 0, 0, cw, w.l.c.height, TX - w.l.pad, w.y - w.l.pad, cw, w.l.c.height);
      }
      const lastN = Math.max(0, Math.min(last.l.n, Math.floor((t - last.at) / last.per)));
      const blinkOn = still || t < typedAt || Math.floor((t - typedAt) / 530) % 2 === 0;
      if(t >= last.at && blinkOn){
        x.fillStyle = INK; x.shadowColor = GLOW; x.shadowBlur = 6;
        x.fillRect(TX + lastN * last.l.adv + 4, last.y - 2, 5 * last.l.px, 7 * last.l.px + 4);
        x.shadowBlur = 0;
      }
      x.drawImage(lines, 0, 0);
      x.restore();
    }
    if(still){ draw(1e9); return; }
    // draws only while it can be seen, and its clock only counts the time it was on screen
    let t = 0, prev = 0;
    function frame(now){
      const r = el.getBoundingClientRect();
      if(r.bottom > 0 && r.top < innerHeight){
        if(prev) t += Math.min(100, now - prev);
        prev = now; draw(t);
      }else prev = 0;
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  const el = document.getElementById('daomsys');
  if(el) boot(el);
})();
