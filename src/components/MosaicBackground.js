"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "./ThemeProvider";

const BEAT_MS       = 860;
const GAP           = 2;
const CELL_BASE     = 38;
const TRANSITION_MS = 800;
const RIPPLE_SPEED  = 360;

// Dark: deep forest green near-blacks
const DARK = [
  [8,18,12],[10,22,14],[11,24,16],[12,26,17],[9,20,13],
  [13,28,18],[10,23,15],[8,19,12],[14,30,19],[11,25,16],
  [9,21,14],[12,27,17],[10,24,15],[13,29,18],[8,20,13],
];
const DARK_HOVER  = [42, 92, 58];   // warm forest green lit up
const DARK_RIPPLE = [55, 110, 70];  // slightly brighter for ripple

// Light: warm cream / parchment
const LIGHT = [
  [240,233,210],[244,237,215],[237,230,206],[242,235,212],[246,239,218],
  [238,231,207],[243,236,213],[239,232,208],[245,238,216],[241,234,210],
  [236,229,205],[247,240,219],[240,233,209],[244,237,214],[237,230,207],
];
const LIGHT_HOVER  = [190,172,128];
const LIGHT_RIPPLE = [175,155,108];

function eio(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }
function lerp(a, b, t) { return a + (b-a)*t; }
function lerpRGB(a, b, t) {
  return [
    Math.round(lerp(a[0],b[0],t)),
    Math.round(lerp(a[1],b[1],t)),
    Math.round(lerp(a[2],b[2],t)),
  ];
}

function buildCells(W, H) {
  const unit = CELL_BASE + GAP;
  const cols = Math.ceil(W / unit) + 1;
  const rows = Math.ceil(H / unit) + 1;
  const taken = new Uint8Array(cols * rows);
  const cells = [];

  function free(c, r, cs, rs) {
    if (c+cs > cols || r+rs > rows) return false;
    for (let dr=0; dr<rs; dr++)
      for (let dc=0; dc<cs; dc++)
        if (taken[(r+dr)*cols+(c+dc)]) return false;
    return true;
  }
  function occupy(c, r, cs, rs) {
    for (let dr=0; dr<rs; dr++)
      for (let dc=0; dc<cs; dc++)
        taken[(r+dr)*cols+(c+dc)] = 1;
  }

  for (let r=0; r<rows; r++) {
    for (let c=0; c<cols; c++) {
      if (taken[r*cols+c]) continue;
      let cs=1, rs=1;
      const roll = Math.random();
      if      (roll < 0.08 && free(c,r,2,2)) { cs=2; rs=2; }
      else if (roll < 0.20 && free(c,r,2,1)) { cs=2; rs=1; }
      else if (roll < 0.32 && free(c,r,1,2)) { cs=1; rs=2; }
      occupy(c, r, cs, rs);
      cells.push({
        x: c*unit, y: r*unit,
        w: cs*unit-GAP, h: rs*unit-GAP,
        cur: [0,0,0], from: [0,0,0], to: [0,0,0],
        t: 1, phase: Math.random()*Math.PI*2, hoverT: 0,
      });
    }
  }
  return cells;
}

export default function MosaicBackground() {
  const canvasRef = useRef(null);
  const { theme } = useTheme();

  const S = useRef({
    cells: [], theme: "dark",
    lastBeat: 0,
    mouse: { x: -9999, y: -9999 },
    ripples: [],
    raf: null, lastTs: 0,
  });

  function getPalette(t)  { return t === "light" ? LIGHT       : DARK;        }
  function getHover(t)    { return t === "light" ? LIGHT_HOVER  : DARK_HOVER;  }
  function getRipple(t)   { return t === "light" ? LIGHT_RIPPLE : DARK_RIPPLE; }

  function randomColor(p) { return [...p[Math.floor(Math.random()*p.length)]]; }

  function startTransition(cell, palette) {
    cell.from = [...cell.cur];
    cell.to   = randomColor(palette);
    cell.t    = 0;
  }

  function initCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Use actual viewport dimensions
    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width  = W;
    canvas.height = H;
    canvas.style.width  = W + "px";
    canvas.style.height = H + "px";

    const s = S.current;
    const palette = getPalette(s.theme);
    s.cells = buildCells(W, H);
    s.cells.forEach(cell => {
      const c = randomColor(palette);
      cell.cur=[...c]; cell.from=[...c]; cell.to=[...c];
      cell.t=1; cell.hoverT=0;
    });
  }

  function hitTest(mx, my) {
    const cells = S.current.cells;
    for (let i=0; i<cells.length; i++) {
      const c = cells[i];
      if (mx>=c.x && mx<=c.x+c.w && my>=c.y && my<=c.y+c.h) return i;
    }
    return -1;
  }

  function tick(ts) {
    const s = S.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dt = Math.min(ts - s.lastTs, 50);
    s.lastTs = ts;

    const palette      = getPalette(s.theme);
    const hoverColor   = getHover(s.theme);
    const rippleColor  = getRipple(s.theme);
    const HOVER_IN     = dt / 100;
    const HOVER_OUT    = dt / 200;

    // Heartbeat
    if (ts - s.lastBeat > BEAT_MS) {
      s.lastBeat = ts;
      s.cells.forEach(cell => {
        const chance = 0.10 + 0.08*Math.sin(cell.phase);
        if (Math.random() < chance) startTransition(cell, palette);
      });
    }

    // Expire ripples
    s.ripples = s.ripples.filter(rp => ts - rp.born < 1600);

    // Hit test — use raw page mouse coords mapped to canvas
    const hitIdx = hitTest(s.mouse.x, s.mouse.y);

    // Advance cell states
    s.cells.forEach((cell, i) => {
      // Color lerp
      if (cell.t < 1) {
        cell.t = Math.min(1, cell.t + dt/TRANSITION_MS);
        cell.cur = lerpRGB(cell.from, cell.to, eio(cell.t));
      }
      // Hover lerp
      if (i === hitIdx) {
        cell.hoverT = Math.min(1, cell.hoverT + HOVER_IN);
      } else {
        cell.hoverT = Math.max(0, cell.hoverT - HOVER_OUT);
      }
    });

    // Draw
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    s.cells.forEach(cell => {
      let rgb = [...cell.cur];
      const cx = cell.x + cell.w*0.5;
      const cy = cell.y + cell.h*0.5;

      // Hover highlight
      if (cell.hoverT > 0) {
        rgb = lerpRGB(rgb, hoverColor, eio(cell.hoverT));
      }

      // Ripple waves
      s.ripples.forEach(rp => {
        const age   = (ts - rp.born) / 1000;
        const front = age * RIPPLE_SPEED;
        const dist  = Math.hypot(cx-rp.x, cy-rp.y);
        const delta = Math.abs(dist - front);
        const waveW = 56;
        if (delta < waveW) {
          const fade = 1 - age/1.6;
          const str  = (1 - delta/waveW) * fade * 0.85;
          rgb = lerpRGB(rgb, rippleColor, str);
        }
      });

      ctx.fillStyle = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
      ctx.fillRect(cell.x, cell.y, cell.w, cell.h);
    });

    s.raf = requestAnimationFrame(tick);
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const s = S.current;

    initCanvas();
    s.lastTs = performance.now();
    s.raf = requestAnimationFrame(tick);

    // ── CRITICAL FIX: listen on WINDOW, not canvas ──
    // The canvas is behind all UI layers so it never gets mouse events.
    // Window always gets them regardless of what's on top.
    function onMove(e) {
      // Raw page coords map 1:1 to canvas coords since canvas is fixed at 0,0
      s.mouse = { x: e.clientX, y: e.clientY };
    }
    function onLeave() {
      s.mouse = { x: -9999, y: -9999 };
    }
    function onClick(e) {
      // Only fire ripple if not clicking a button/link/input
      const tag = e.target.tagName.toLowerCase();
      const isInteractive = ["button","a","input","select","textarea","label"].includes(tag)
        || e.target.closest("button,a,input,select,textarea,label");
      if (!isInteractive) {
        s.ripples.push({ x: e.clientX, y: e.clientY, born: performance.now() });
      }
    }

    const ro = new ResizeObserver(() => initCanvas());
    ro.observe(document.documentElement);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    window.addEventListener("click", onClick);

    return () => {
      cancelAnimationFrame(s.raf);
      ro.disconnect();
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("click", onClick);
    };
  }, []);

  // Smooth theme transition
  useEffect(() => {
    const s = S.current;
    s.theme = theme;
    const palette = getPalette(theme);
    s.cells.forEach(cell => startTransition(cell, palette));
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0, left: 0,
        zIndex: 0,
        display: "block",
        pointerEvents: "none", // canvas itself doesn't need events — window handles them
      }}
    />
  );
}
