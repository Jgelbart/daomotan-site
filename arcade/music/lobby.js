/* THE ARCADE'S MUSIC: the NAN II Theme, dreamy, for the lobby (2026-09-30).
   The Black Hole cut stretched out: the Drift's floating sine and warm pad, the
   title's music-box bells on top, at a slow 80 in the theme's own G minor. Eight
   sections instead of four, so it wanders before it repeats, and it opens on the
   pad and the bells alone. It plays on the games' own engine (music/engine.js,
   copied from NAN II's source by tools/sync_arcade.py), through the same filter,
   limiter and trim as the games, so it is never louder than they are.

   A browser will not let a page start sound by itself: the music starts on the
   visitor's first click or key (not on a click that opens a game), and the MUSIC
   key in the bar turns it on and off. Off is remembered; on is the default. */
let AC = null, MASTER = null;

const MUSIC = {
  lobby: {bpm: 80, key: 0, vol: .42, echo: .5,
    form: ['PA', 'EPA', 'MPAB', 'MHPAB', 'OPAB', 'EPAB', 'MHPABd', 'OHPA'],
    lead: {w: 'sine', v: .12, a: .02, r: .25, vib: .22, len: 1.9, fx: .45},
    hi: {w: 'bell', v: .06, pl: .4, ratio: 4, idx: .7, fx: .45},
    harm: {w: 'triangle', v: .045, a: .02, r: .2, len: 1.9, fx: .4},
    pad: {w: 'sawtooth', det: 12, cut: 900, a: .8, r: 1.6, v: .026},
    arp: {w: 'bell', v: .03, pl: .25, ratio: 4, idx: .6, pat: [0, 1, 2, 3, 2, 1], rate: 2, oct: 12},
    bass: {w: 'sine', v: .14, pat: 'r-------r-------', r: .4},
    drums: {kit: 'soft', k: 'x...............', h: '........o.......'}},
};

const Lobby = (() => {
  const PREF = 'daomotan-arcade-music';            // 'off' once a visitor turns it off
  let on = false, key = null;
  const wanted = () => { try { return localStorage.getItem(PREF) !== 'off'; } catch (e) { return true; } };
  const remember = v => { try { localStorage.setItem(PREF, v ? 'on' : 'off'); } catch (e) { /* not kept */ } };

  function rig(){
    if (AC) return;
    AC = new (window.AudioContext || window.webkitAudioContext)();
    const hc = AC.createBiquadFilter(); hc.type = 'lowpass'; hc.frequency.value = 7000; hc.Q.value = .5;
    const lim = AC.createDynamicsCompressor();
    lim.threshold.value = -14; lim.knee.value = 10; lim.ratio.value = 6; lim.attack.value = .004; lim.release.value = .2;
    const mg = AC.createGain(); B9VOL.trim(mg, .5);   // the games' own output trim
    hc.connect(lim); lim.connect(mg); mg.connect(AC.destination);
    MASTER = hc;
  }
  function show(){
    if (!key) return;
    key.setAttribute('aria-pressed', on ? 'true' : 'false');
    key.querySelector('.state').textContent = on ? 'ON' : 'OFF';
  }
  function start(){
    rig();
    if (AC.state === 'suspended') AC.resume();
    if (!B9MUS.on) B9MUS.toggle();                    // music was turned off in a game: back on
    on = true; show();
  }
  function stop(){ on = false; show(); }

  function init(){
    key = document.getElementById('music');
    if (key) key.addEventListener('click', () => { on ? stop() : start(); remember(on); });
    const first = e => {
      if (e.target.closest && (e.target.closest('#music') || e.target.closest('a'))) return;
      removeEventListener('pointerdown', first); removeEventListener('keydown', first);
      if (!on && wanted()) start();
    };
    addEventListener('pointerdown', first); addEventListener('keydown', first);
    // a hidden tab slows the engine's clock and the music would stutter: rest it instead
    document.addEventListener('visibilitychange', () => {
      if (!AC) return;
      if (document.hidden) AC.suspend(); else if (on) AC.resume();
    });
    show();
  }
  return {init, get on(){ return on; }};
})();

function musicWant(){ return Lobby.on ? {id: 'lobby'} : null; }
Lobby.init();
