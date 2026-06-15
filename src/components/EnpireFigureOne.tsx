/* eslint-disable @next/next/no-img-element, @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unused-vars */
// @ts-nocheck

"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/*
 * Figure 1 — ENPIRE method overview.
 *
 * One absolute-positioned canvas holds every box, frame and arrow so the SVG
 * overlay can draw between any two points (top schematic <-> bottom trace).
 *
 * LAYOUT SYSTEM — 8px grid (U). Every box derives from the tokens below so the
 * composition keeps a rhythm instead of scattered magic numbers:
 *   - center spine: 4U (32px) between pipeline boxes; 6U (48px) after Human
 *     (a different actor — the larger gap encodes the hand-off).
 *   - the two stage frames share an identical top + height (parallel structure).
 *   - the figure splits into two labeled zones: METHOD (schematic) and
 *     EXECUTION TRACE (tree + hillclimb), divided by a hairline at ZONE2_Y.
 */

const U = 8;
const W = 1200;
const H = 1212;
const FRAME_VISUAL_HEIGHT = H - 55;

// Three sections split the content band (16..1184) as 25% / 50% / 25%.
// Frames span 96..588 (20% taller than before) for more room in the center.
const FRAME = {
  s1: { x: 16,  y: 96, w: 292, h: 492 }, // left 25%   (16..308)
  s2: { x: 892, y: 96, w: 292, h: 492 }, // right 25%  (892..1184)
};

// center column — 50% region (308..892), boxes inset with ~64px gutters
const BOX = {
  human: { x: 372, y: 96,  w: 456, h: 44 },
  agent: { x: 372, y: 172, w: 456, h: 50 },
  tools: { x: 372, y: 244, w: 456, h: 114 }, // bottom = 358 (photos capped smaller)
  env:   { x: 372, y: 380, w: 456, h: 208 }, // bottom = 588; ~2.19:1, closer to 16:9
};

// Stage-1 internals (the zoomed-in environment)
const CODE_CARD = { x: 22, y: 168, w: 280, h: 398 };
const BADGE_Y = 124;

// env.py contents — tokenized so a few spans can be tinted (kw = clay,
// com = muted italic, str = ink-soft). Plain runs carry their own indent.
const CODE = [
  [['kw', 'class '], ['fn', 'InsertionEnv'], ['p', ':']],
  [['p', '    '], ['kw', 'def '], ['fn', 'reset'], ['p', '(self):']],
  [['p', '        '], ['com', '# TODO: auto task reset']],
  [['p', '        pick_and_place(obj, target)']],
  [['p', '        go_home()']],
  [['p', '        ...']],
  [],
  [['p', '    '], ['kw', 'def '], ['fn', 'get_reward'], ['p', '(self, obs, act):']],
  [['p', '        '], ['com', '# TODO: scalar reward']],
  [['p', '        mask = sam3(obs['], ['str', "'left'"], ['p', '])']],
  [['p', '        pos = boundlsdf(obs, mask)']],
  [['p', '        ...']],
  [],
  [['p', '    '], ['kw', 'def '], ['fn', 'get_observation'], ['p', '(self):']],
  [['p', '        ...']],
  [],
  [['p', '    '], ['kw', 'def '], ['fn', 'step'], ['p', '(self, act):']],
  [['p', '        ...']],
];

// execution-trace zone (success-rate panel only)
const HILL = { x: 16, y: 700, w: W - 32, h: 224 };
const TASKS_Y = 982; // top of the real-world tasks gallery
const STAGE_REVEAL_S = {
  env: 2.55,
  autoresearch: 5.15,
  hill: 7.65,
  tasks: 10.35,
};
const TIMELINE_INTRO_S = STAGE_REVEAL_S.hill + 0.45;
const TIMELINE_MOVE_S = 6.2;
const TIMELINE_PAUSE_S = 0.42;
const TIMELINE_HOLD_MINUTES = [20.65, 43.3, 53.03, 93.88, 117.47, 149.28];
const TIMELINE_REVEAL_S = TIMELINE_MOVE_S + TIMELINE_PAUSE_S * TIMELINE_HOLD_MINUTES.length;
const FIGURE_ONE_REPLAY_MS = Math.round((TIMELINE_INTRO_S + TIMELINE_REVEAL_S + 1.05) * 1000);

// plot geometry for the success-rate panel
const PLOT_L = 74; // leaves room for the rotated y-axis label
const PLOT_R = W - 40;
const tx = (t) => PLOT_L + t * (PLOT_R - PLOT_L);
const HILL_BASE = HILL.y + HILL.h - 44; // success-rate = 0 baseline (extra room below for axis)
const HILL_TOPV = HILL.y + 40;          // success-rate = 1 (headroom for caption)
const hy = (sr) => HILL_BASE + sr * (HILL_TOPV - HILL_BASE);

// Real team-averaged best success rate over the May-26 run (mean of 8 agents'
// personal-best SR so far). Rendered as a cliff/step curve: the value holds
// flat, then jumps vertically at the wall-clock time of each improvement.
// Each entry is [relativeMinutes, SR%].
const SR_TOTAL_MIN = 202.4;
const SR_STEPS = [
  [0, 0], [8.75, 12.5], [13.78, 13.16], [15.63, 17.33], [19.58, 19.41],
  [20.65, 23.2], [23.5, 24.51], [28.08, 36.07], [31.1, 37.75], [32.65, 38.04],
  [33.88, 38.8], [40.68, 43.08], [42.78, 48.32], [43.3, 59.14], [47.92, 59.72],
  [53.03, 72.22], [59.6, 74.72], [61.23, 76.11], [66.87, 81.69], [74.23, 82.47],
  [83.3, 88.68], [93.88, 89.11], [117.47, 90.04], [123.08, 91.07], [148.9, 93.18],
  [149.28, 94.48], [171.13, 95.12], [183.18, 96.5], [192.98, 97.38],
];
const sx = (relMin) => tx(relMin / SR_TOTAL_MIN);
const sy = (srPct) => hy(srPct / 100);
const timelineDelay = (relMin) => {
  const pausesBefore = TIMELINE_HOLD_MINUTES.filter((holdMin) => holdMin < relMin - 0.001).length;
  return `${(TIMELINE_INTRO_S + (relMin / SR_TOTAL_MIN) * TIMELINE_MOVE_S + pausesBefore * TIMELINE_PAUSE_S).toFixed(2)}s`;
};

// Labelled key hypotheses (key_hypotheses with label:true in
// branch_graph_include.yaml). Each lands on a specific cliff of the team-avg
// curve; we annotate it with its short name + the pp it added to the best SR.
// place: 'above' (open space over the low part of the curve) or 'below'
// (callout dropped into the green fill, on a paper pill). rowY = label row for
// the clustered high-SR ones; dx nudges the open-space labels clear of the rise.
const KEY_HS = [
  { relMin: 20.65,  sr: 23.2,  name: ['Online RL mix Demo'],        delta: '+3.8 pp',  place: 'above', dx: -20 },
  { relMin: 43.3,   sr: 59.14, name: ['BC regularization'],      delta: '+10.8 pp', place: 'above', dx: -54 },
  { relMin: 53.03,  sr: 72.22, name: ['Re-evaluate'],            delta: '+12.5 pp', place: 'above', dx: 42 },
  { relMin: 93.88,  sr: 89.11, name: ['Tweak BC term weight'],             delta: '+0.4 pp',  place: 'below', rowY: 716 },
  { relMin: 117.47, sr: 90.04, name: ['Tune batch size 1024→512'],  delta: '+0.9 pp',  place: 'below', rowY: 778 },
  { relMin: 149.28, sr: 94.48, name: ['Compensate controller'],  delta: '+1.3 pp',  place: 'below', rowY: 716 },
];
// A step counts as a "prominent" jump (big-dot) when SR rises by >= this much.
const PROMINENT_DELTA = 6;
// Stage-2 cone target: the largest jump in the right half (+2.1pp at ~149 min),
// sitting within the frame's x-span so the cone stays nearly vertical.
const ZOOM_MIN = 183.18;
const ZOOM_SR = 96.5;
const NODE_X = sx(ZOOM_MIN);
const NODE_Y = sy(ZOOM_SR);

// design tokens (kept in JS so SVG strokes/fills stay in sync with CSS)
const C = {
  ink:    'oklch(22% 0.022 60)',
  inkSoft:'oklch(34% 0.018 60)',
  hair:   'oklch(72% 0.014 65)',
  s1:     'oklch(56% 0.115 42)',
  s2:     'oklch(48% 0.075 218)',
  paper:  'oklch(98.4% 0.012 85)',
};

// Label with a paper "halo" for legibility over arrows/curves. The halo is a
// separate underlay glyph (paper fill + paper stroke) rather than CSS
// paint-order:stroke — some PDF viewers ignore paint-order on text and paint the
// stroke OVER the fill in the fill colour, smudging the glyph. Drawing the halo
// as its own all-paper underlay renders correctly in every viewer.
function HaloText({ className, x, y, textAnchor = 'middle', transform, style, children }) {
  const common = { x, y, textAnchor, transform };
  return (
    <>
      <text
        {...common}
        className={className}
        aria-hidden="true"
        style={{ ...style, fill: 'var(--paper)', stroke: 'var(--paper)', strokeWidth: 4, strokeLinejoin: 'round' }}
      >
        {children}
      </text>
      <text {...common} className={className} style={{ ...style, stroke: 'none' }}>
        {children}
      </text>
    </>
  );
}

function ArrowLabel({ x, y, children, dy = -8, variant = 'italic' }) {
  const cls = variant === 'caps' ? 'arrow-label-caps' : 'arrow-label';
  return (
    <HaloText className={cls} x={x} y={y + dy}>
      {children}
    </HaloText>
  );
}

function ArrowDefs() {
  return (
    <defs>
      {/* clay gradient for the zoom cone — stronger at the wide (Stage 1) end,
          fading toward the narrow (Environment) end, like a zoom beam */}
      <linearGradient id="cone-grad" x1="308" y1="0" x2="372" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="oklch(87% 0.05 55)" stopOpacity="0.9" />
        <stop offset="1" stopColor="oklch(87% 0.05 55)" stopOpacity="0.15" />
      </linearGradient>

      {/* teal beam for the Stage-2 cone — light at the frame, fading to clear */}
      <linearGradient id="cone-grad-2" x1="0" y1={FRAME.s2.y + FRAME.s2.h} x2="0" y2={HILL.y + 46} gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="oklch(89% 0.03 220)" stopOpacity="0.5" />
        <stop offset="0.55" stopColor="oklch(89% 0.03 220)" stopOpacity="0.16" />
        <stop offset="1" stopColor="oklch(89% 0.03 220)" stopOpacity="0" />
      </linearGradient>

      {/* hillclimb shadow (green) — same gradient style as the cones, fading to baseline */}
      <linearGradient id="hill-grad" x1="0" y1={HILL_TOPV} x2="0" y2={HILL_BASE} gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="oklch(68% 0.09 150)" stopOpacity="0.42" />
        <stop offset="1" stopColor="oklch(68% 0.09 150)" stopOpacity="0.03" />
      </linearGradient>

      {/* one marker per ink color so SVG keeps arrowheads matched to strokes */}
      {[
        ['arrow-ink', C.ink],
        ['arrow-s1',  C.s1],
        ['arrow-s2',  C.s2],
      ].map(([id, fill]) => (
        <marker
          key={id}
          id={id}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6.5"
          markerHeight="6.5"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={fill} />
        </marker>
      ))}
    </defs>
  );
}

function CodeCard() {
  const totalLines = CODE.length;
  return (
    <div
      className="code-card enpire-reveal enpire-reveal--code-env"
      style={{ left: CODE_CARD.x, top: CODE_CARD.y, width: CODE_CARD.w, height: CODE_CARD.h }}
    >
      <div className="code-tabs">
        <div className="code-tab active">
          <span className="code-tab-dot" />
          env.py
        </div>
      </div>
      <div className="code-editor">
        {CODE.map((line, i) => (
          <div className="code-row" key={i}>
            <div className="code-gutter-line">{i + 1}</div>
            <div className="code-line">
              {line.length === 0
                ? ' '
                : line.map((tok, j) => (
                    <span key={j} className={`tok-${tok[0]}`}>{tok[1]}</span>
                  ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TraceLayer() {
  // cliff/step curve: hold the current value, then a vertical jump at the
  // wall-clock time of each improvement (no sloped lead-ins).
  let line = `M ${sx(SR_STEPS[0][0]).toFixed(1)} ${sy(SR_STEPS[0][1]).toFixed(1)}`;
  for (let i = 1; i < SR_STEPS.length; i++) {
    const [t, v] = SR_STEPS[i];
    const vPrev = SR_STEPS[i - 1][1];
    line += ` L ${sx(t).toFixed(1)} ${sy(vPrev).toFixed(1)}`; // hold flat
    line += ` L ${sx(t).toFixed(1)} ${sy(v).toFixed(1)}`;     // vertical cliff
  }
  const last = SR_STEPS[SR_STEPS.length - 1];
  line += ` L ${sx(SR_TOTAL_MIN).toFixed(1)} ${sy(last[1]).toFixed(1)}`; // hold to end
  const area = `${line} L ${sx(SR_TOTAL_MIN).toFixed(1)} ${HILL_BASE} L ${sx(0).toFixed(1)} ${HILL_BASE} Z`;

  return (
    <svg className="trace enpire-reveal enpire-reveal--hill" viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <clipPath id="hill-reveal-clip">
          <rect className="hill-reveal-window" x={PLOT_L} y={HILL.y} width={PLOT_R - PLOT_L} height={HILL.h} />
        </clipPath>
      </defs>

      {/* panel: square top-left (capped by the tab), other corners rounded r=4 */}
      <path
        className="panel-bg hill-panel"
        pointerEvents="all"
        d={`M ${HILL.x} ${HILL.y} H ${HILL.x + HILL.w - 4} Q ${HILL.x + HILL.w} ${HILL.y} ${HILL.x + HILL.w} ${HILL.y + 4} V ${HILL.y + HILL.h - 4} Q ${HILL.x + HILL.w} ${HILL.y + HILL.h} ${HILL.x + HILL.w - 4} ${HILL.y + HILL.h} H ${HILL.x + 4} Q ${HILL.x} ${HILL.y + HILL.h} ${HILL.x} ${HILL.y + HILL.h - 4} Z`}
      />

      {/* gridlines + y-axis ticks */}
      {[0, 0.5, 1].map((g) => (
        <g key={g}>
          <line className="grid" x1={PLOT_L} y1={hy(g)} x2={PLOT_R} y2={hy(g)} />
          <text className="axis-num" x={PLOT_L - 8} y={hy(g) + 3} textAnchor="end">
            {g === 0 ? '0' : g === 1 ? '100%' : '50%'}
          </text>
        </g>
      ))}

      {/* y-axis label */}
      <text
        className="axis-cap"
        x={28}
        y={(HILL_TOPV + HILL_BASE) / 2}
        textAnchor="middle"
        transform={`rotate(-90 28 ${(HILL_TOPV + HILL_BASE) / 2})`}
        style={{ fontSize: '17.25px' }}
      >
        team-avg best success rate
      </text>

      {/* cliff curve + gradient shadow */}
      <g className="hill-reveal-content" clipPath="url(#hill-reveal-clip)">
        <path className="hill-area" d={area} fill="url(#hill-grad)" />
        <path className="hill-line" d={line} pathLength="1" />
      </g>

      {/* a dot at every step change; big jumps (>= PROMINENT_DELTA) get a larger dot */}
      {SR_STEPS.slice(1).map(([t, v], i) => {
        const prominent = v - SR_STEPS[i][1] >= PROMINENT_DELTA;
        return (
          <circle
            key={t}
            className={prominent ? 'node-key' : 'step-dot'}
            cx={sx(t)} cy={sy(v)} r={prominent ? 4 : 2.2}
            style={{ "--timestamp-delay": timelineDelay(t) }}
            pointerEvents="all"
          />
        );
      })}

      {/* Stage-2 zoom-target rung (one of the prominent jumps) */}
      <circle className="zoom-ring" cx={NODE_X} cy={NODE_Y} r="9" style={{ "--timestamp-delay": timelineDelay(ZOOM_MIN) }} pointerEvents="all" />
      <circle className="node-key" cx={NODE_X} cy={NODE_Y} r="4" style={{ "--timestamp-delay": timelineDelay(ZOOM_MIN) }} pointerEvents="all" />

      {/* labelled key-hypothesis milestones: leader + callout + ringed node */}
      {KEY_HS.map((k, i) => {
        const nx = sx(k.relMin);
        const ny = sy(k.sr);
        const above = k.place === 'above';
        const lx = nx + (k.dx || 0);
        let name0Y, name1Y, deltaY, leadTo;
        if (above) {
          deltaY = ny - 17; name1Y = deltaY - 11; name0Y = name1Y - 10;
          leadTo = deltaY + 3;
        } else {
          name0Y = k.rowY; name1Y = name0Y + 10; deltaY = name1Y + 11;
          leadTo = name0Y - 10;
        }
        return (
          <g key={`kh-${i}`} className="hc-annotation" style={{ "--timestamp-delay": timelineDelay(k.relMin) }} pointerEvents="all">
            <line className="hc-leader" x1={nx} y1={ny + (above ? -5 : 5)} x2={lx} y2={leadTo} />
            <circle className="hc-key-ring" cx={nx} cy={ny} r="6.5" />
            <circle className="hc-key" cx={nx} cy={ny} r="3.4" />
            {k.name[0] && (
              <text className="hc-name" x={lx} y={name0Y} textAnchor="middle">{k.name[0]}</text>
            )}
            {k.name[1] && (
              <text className="hc-name" x={lx} y={name1Y} textAnchor="middle">{k.name[1]}</text>
            )}
            <text className="hc-delta" x={lx} y={deltaY} textAnchor="middle">{k.delta}</text>
          </g>
        );
      })}

      {/* x-axis: baseline, hourly ticks, label */}
      <line className="axis" x1={PLOT_L} y1={HILL_BASE} x2={PLOT_R} y2={HILL_BASE} />
      {[0, 60, 120, 180].map((m) => (
        <g key={m}>
          <line className="axis" x1={sx(m)} y1={HILL_BASE} x2={sx(m)} y2={HILL_BASE + 4} />
          <text className="axis-num" x={sx(m)} y={HILL_BASE + 15} textAnchor="middle">
            {m === 0 ? '0' : `${m / 60}h`}
          </text>
        </g>
      ))}
      <text className="axis-cap" x={(PLOT_L + PLOT_R) / 2} y={HILL_BASE + 28} textAnchor="middle">
        research wall-clock time &rarr;
      </text>
    </svg>
  );
}

// Coding-agent brand marks. Claude + OpenAI are the official monochrome glyphs
// from Simple Icons (single-color, unified set). Antigravity is not in that set,
// so it uses a neutral orbit placeholder until an official SVG is dropped in.
const ICON_CLAUDE =
  "m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z";
const ICON_CODEX =
  "M8.086.457a6.105 6.105 0 013.046-.415c1.333.153 2.521.72 3.564 1.7a.117.117 0 00.107.029c1.408-.346 2.762-.224 4.061.366l.063.03.154.076c1.357.703 2.33 1.77 2.918 3.198.278.679.418 1.388.421 2.126a5.655 5.655 0 01-.18 1.631.167.167 0 00.04.155 5.982 5.982 0 011.578 2.891c.385 1.901-.01 3.615-1.183 5.14l-.182.22a6.063 6.063 0 01-2.934 1.851.162.162 0 00-.108.102c-.255.736-.511 1.364-.987 1.992-1.199 1.582-2.962 2.462-4.948 2.451-1.583-.008-2.986-.587-4.21-1.736a.145.145 0 00-.14-.032c-.518.167-1.04.191-1.604.185a5.924 5.924 0 01-2.595-.622 6.058 6.058 0 01-2.146-1.781c-.203-.269-.404-.522-.551-.821a7.74 7.74 0 01-.495-1.283 6.11 6.11 0 01-.017-3.064.166.166 0 00.008-.074.115.115 0 00-.037-.064 5.958 5.958 0 01-1.38-2.202 5.196 5.196 0 01-.333-1.589 6.915 6.915 0 01.188-2.132c.45-1.484 1.309-2.648 2.577-3.493.282-.188.55-.334.802-.438.286-.12.573-.22.861-.304a.129.129 0 00.087-.087A6.016 6.016 0 015.635 2.31C6.315 1.464 7.132.846 8.086.457zm-.804 7.85a.848.848 0 00-1.473.842l1.694 2.965-1.688 2.848a.849.849 0 001.46.864l1.94-3.272a.849.849 0 00.007-.854l-1.94-3.393zm5.446 6.24a.849.849 0 000 1.695h4.848a.849.849 0 000-1.696h-4.848z";
const ICON_KIMI = [
  "M21.846 0a1.923 1.923 0 110 3.846H20.15a.226.226 0 01-.227-.226V1.923C19.923.861 20.784 0 21.846 0z",
  "M11.065 11.199l7.257-7.2c.137-.136.06-.41-.116-.41H14.3a.164.164 0 00-.117.051l-7.82 7.756c-.122.12-.302.013-.302-.179V3.82c0-.127-.083-.23-.185-.23H3.186c-.103 0-.186.103-.186.23V19.77c0 .128.083.23.186.23h2.69c.103 0 .186-.102.186-.23v-3.25c0-.069.025-.135.069-.178l2.424-2.406a.158.158 0 01.205-.023l6.484 4.772a7.677 7.677 0 003.453 1.283c.108.012.2-.095.2-.23v-3.06c0-.117-.07-.212-.164-.227a5.028 5.028 0 01-2.027-.807l-5.613-4.064c-.117-.078-.132-.279-.028-.381z",
];

function AgentLogos() {
  return (
    <div className="agent-logos">
      <div className="agent-logo">
        <svg viewBox="0 0 24 24" aria-label="Claude Code"><path d={ICON_CLAUDE} /></svg>
      </div>
      <div className="agent-logo">
        <svg viewBox="0 0 24 24" aria-label="Codex"><path d={ICON_CODEX} fillRule="evenodd" clipRule="evenodd" /></svg>
      </div>
      <div className="agent-logo">
        <svg viewBox="0 0 24 24" aria-label="Kimi">
          {ICON_KIMI.map((d, i) => (
            <path key={i} d={d} fillRule="evenodd" clipRule="evenodd" />
          ))}
        </svg>
      </div>
    </div>
  );
}

const TOOLS = [
  { cat: 'Perception', name: 'SAM 3', src: '/sam.min.jpg' },
  { cat: 'Planning', name: 'cuRobo', src: '/curobo.min.jpg' },
  { cat: 'Control', name: 'YAM arm', src: '/control.min.jpg' },
];

function ToolPhotos() {
  return (
    <div className="tool-grid">
      {TOOLS.map((t) => (
        <figure className="tool-item" key={t.cat}>
          <div className="tool-photo">
            <img src={t.src} alt={`${t.cat} — ${t.name}`} />
          </div>
          <figcaption>
            <span className="tool-cat">{t.cat}</span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

// step head icons
const ICO_REVIEW = <svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5" /><line x1="15.4" y1="15.4" x2="20" y2="20" /></svg>;
const ICO_IDEA = <svg viewBox="0 0 24 24"><path d="M12 3a6 6 0 0 0-3.8 10.6c.6.5.9 1 .9 1.9v.4h5.8v-.4c0-.9.3-1.4.9-1.9A6 6 0 0 0 12 3Z" /><line x1="9.6" y1="20" x2="14.4" y2="20" /></svg>;
const ICO_CODE = <svg viewBox="0 0 24 24"><polyline points="8.5 7 3.5 12 8.5 17" /><polyline points="15.5 7 20.5 12 15.5 17" /></svg>;
const ICO_CHART = <svg viewBox="0 0 24 24"><line x1="4" y1="20" x2="20" y2="20" /><line x1="8" y1="13" x2="8" y2="20" /><line x1="12" y1="8" x2="12" y2="20" /><line x1="16" y1="15" x2="16" y2="20" /></svg>;
// small chip / artifact icons
const ICO_DOC = <svg viewBox="0 0 24 24"><path d="M6 3h9l3 3v15H6z" /><polyline points="14.5 3 14.5 6.5 18 6.5" /><line x1="9" y1="12" x2="15" y2="12" /><line x1="9" y1="15.5" x2="15" y2="15.5" /></svg>;
const ICO_SPARK = <svg viewBox="0 0 24 24"><path d="M12 3l1.7 5.1 5.1 1.7-5.1 1.7L12 17l-1.7-5.5L5.2 9.8l5.1-1.7z" /></svg>;
const ICO_FILM = <svg viewBox="0 0 24 24"><rect x="3.5" y="5.5" width="17" height="13" rx="2" /><path d="M10.5 9.5l4.5 2.7-4.5 2.7z" /></svg>;
const ICO_LOG = <svg viewBox="0 0 24 24"><rect x="5" y="3.5" width="14" height="17" rx="1.5" /><line x1="8" y1="8" x2="16" y2="8" /><line x1="8" y1="11.5" x2="16" y2="11.5" /><line x1="8" y1="15" x2="13" y2="15" /></svg>;

const STEP_PAPERS = ['PLD', 'RL-Token', 'CaP-X'];
const STEP_IDEAS = ['Heuristics', 'Off2On RL', 'Code-as-policy', 'BC'];
const STEP_INFRA = ['Data Sampler', 'Param Sweep'];

const TASKS = [
  { src: '/gpu_insertion.min.jpg', label: 'GPU insertion' },
  { src: '/pin_insertion_2.min.jpg', label: 'Pin insertion' },
  { src: '/push_t.min.jpg', label: 'Push-T' },
  { src: '/zip_tie.min.jpg', label: 'Zip tie cutting' },
];

function TaskGallery() {
  return (
    <div className="task-gallery enpire-reveal enpire-reveal--tasks" style={{ left: 16, top: TASKS_Y, width: W - 32 }}>
      {TASKS.map((t) => (
        <figure className="task-item" key={t.label}>
          <div className="task-photo">
            <img src={t.src} alt={t.label} />
          </div>
          <figcaption>{t.label}</figcaption>
        </figure>
      ))}
    </div>
  );
}

function StepHead({ n, icon, title }) {
  return (
    <div className="step-head">
      <span className="step-num">{n}</span>
      <span className="step-icon">{icon}</span>
      <span className="step-title">{title}</span>
    </div>
  );
}

function Stage2Steps() {
  return (
    <div className="step-list enpire-reveal enpire-reveal--autoresearch" style={{ left: 906, top: 132, width: 264 }}>
      {/* 01 — search through archive papers */}
      <div className="step">
        <StepHead n="01" icon={ICO_REVIEW} title="Literature review" />
        <div className="step-sub paper-row">
          {STEP_PAPERS.map((p) => (
            <span className="paper-chip" key={p}>{ICO_DOC}{p}</span>
          ))}
        </div>
      </div>

      {/* 02 — ideas for algorithm variants pop up */}
      <div className="step">
        <StepHead n="02" icon={ICO_IDEA} title="Propose algorithm variant" />
        <div className="step-sub idea-row">
          {STEP_IDEAS.map((i) => (
            <span className="idea-chip" key={i}>{ICO_SPARK}{i}</span>
          ))}
        </div>
      </div>

      {/* 03 */}
      <div className="step">
        <StepHead n="03" icon={ICO_CODE} title="Optimize Infra" />
        <div className="step-sub infra-row">
          {STEP_INFRA.map((i) => (
            <span className="infra-chip" key={i}>{i}</span>
          ))}
        </div>
      </div>

      {/* 04 */}
      <div className="step">
        <StepHead n="04" icon={ICO_CHART} title="Summarize experiment result" />
      </div>
    </div>
  );
}

function Schematic() {
  return (
    <div className="schematic" style={{ height: H }}>
      {/* ----- stage frames (parallel: same top + height) ----- */}
      <div className="stage-box s1 enpire-reveal enpire-reveal--env-frame" style={{ left: FRAME.s1.x, top: FRAME.s1.y, width: FRAME.s1.w, height: FRAME.s1.h }}>
        <span className="stage-box-label">Construct Environment</span>
      </div>
      <div className="stage-box s2 enpire-reveal enpire-reveal--autoresearch" style={{ left: FRAME.s2.x, top: FRAME.s2.y, width: FRAME.s2.w, height: FRAME.s2.h }}>
        <span className="stage-box-label">Policy Improvement</span>
      </div>

      {/* ----- Stage 1 contents: env.py code + its I/O ports.
           Input (Action) on the left; outputs (Obs, Reward) on the right. ----- */}
      <div className="badge enpire-reveal enpire-reveal--code-env" style={{ left: 30,  top: BADGE_Y, width: 78 }}>Action</div>
      <div className="badge enpire-reveal enpire-reveal--code-env" style={{ left: 124, top: BADGE_Y, width: 56 }}>Obs</div>
      <div className="badge enpire-reveal enpire-reveal--code-env" style={{ left: 196, top: BADGE_Y, width: 88 }}>Reward</div>

      <CodeCard />

      {/* ----- center spine: Human -> Coding Agent -> Tool APIs -> Environment ----- */}
      <div className="box enpire-reveal enpire-reveal--human" style={{ left: BOX.human.x, top: BOX.human.y, width: BOX.human.w, height: BOX.human.h }}>
        <div className="box-title" style={{ margin: 0 }}>Human User</div>
      </div>

      <div className="box figure-agent-focus" style={{ left: BOX.agent.x, top: BOX.agent.y, width: BOX.agent.w, height: BOX.agent.h }}>
        <div className="agent-row">
          <span className="box-title" style={{ margin: 0 }}>Coding Agent</span>
          <AgentLogos />
        </div>
      </div>

      <div className="box tools-box enpire-reveal enpire-reveal--tools" style={{ left: BOX.tools.x, top: BOX.tools.y, width: BOX.tools.w, height: BOX.tools.h }}>
        <div className="box-title">Tool APIs</div>
        <ToolPhotos />
      </div>

      <div className="box env-box enpire-reveal enpire-reveal--robot-env" style={{ left: BOX.env.x, top: BOX.env.y, width: BOX.env.w, height: BOX.env.h }}>
        <img className="env-img" src="/robot_farm.min.jpg" alt="a real robot farm" />
        <span className="env-title"><span className="env-title-text">ENPIRE</span></span>
        <span className="env-tag">Environment</span>
      </div>

      {/* ----- Stage 2: four-step autoresearch loop, one icon per step ----- */}
      <Stage2Steps />

      {/* ----- hillclimb timeline: tab on the success-rate plot block ----- */}
      <TraceLayer />
      <div className="section-tab hill-tab enpire-reveal enpire-reveal--hill" style={{ left: HILL.x, top: HILL.y, width: HILL.w, background: 'var(--s3)' }}>
        Hillclimb Timeline
      </div>

      {/* ----- real-world tasks: tab on the gallery block ----- */}
      <TaskGallery />
      <div className="section-tab enpire-reveal enpire-reveal--tasks" style={{ left: 16, top: TASKS_Y, width: W - 32, background: 'var(--ink)' }}>
        Real-world tasks
      </div>

      {/* ----- arrow overlay -----
           Convention: every arrowhead retracts ~3-4px short of the destination
           box edge. Labels live in negative space, never on top of a box. */}
      <svg className="arrows" viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
        <ArrowDefs />

        {/* ==========================================================
            Zoom-out perspective cones (dashed, no arrowheads)
            ========================================================== */}

        {/* Stage 1 (big, left)  <->  Environment block (small, center).
            Both lines bow into the gutter between Stage 1 and the spine. */}
        <path
          className="figure-stage-piece figure-stage-piece--env"
          d="M 372 380 C 346 310, 330 150, 308 100 L 308 586 C 330 588, 352 588, 372 586 Z"
          fill="url(#cone-grad)"
          stroke="none"
        />
        <g className="figure-stage-piece figure-stage-piece--env" stroke={C.s1} strokeOpacity="0.6" strokeWidth="1" strokeDasharray="4 4" fill="none">
          <path d="M 372 380 C 346 310, 330 150, 308 100" />
          <path d="M 372 586 C 352 588, 330 588, 308 586" />
        </g>
        {/* Stage 2 (big, right)  <->  one rung on the success-rate curve. */}
        <path
          className="figure-stage-piece figure-stage-piece--hill"
          d={`M 896 588 L 1184 588 L ${NODE_X + 6} ${NODE_Y - 9} L ${NODE_X - 6} ${NODE_Y - 9} Z`}
          fill="url(#cone-grad-2)"
          stroke="none"
        />
        <g className="figure-stage-piece figure-stage-piece--hill" stroke={C.s2} strokeOpacity="0.6" strokeWidth="1" strokeDasharray="4 4" fill="none">
          <line x1="896"  y1="588" x2={NODE_X - 6} y2={NODE_Y - 9} />
          <line x1="1184" y1="588" x2={NODE_X + 6} y2={NODE_Y - 9} />
        </g>

        {/* ==========================================================
            Stage-1 env I/O ports (clay accent).
            env emits Obs + Reward (get_observation / get_reward),
            and receives Action (step). Short vertical connectors between
            the code card's top edge and the capsules above it.
            ========================================================== */}
        <g className="figure-stage-piece figure-stage-piece--env" stroke={C.s1} fill="none" strokeWidth="1.2">
          {/* Action -> env (receive), input on the left */}
          <path d="M 69 153 L 69 165" markerEnd="url(#arrow-s1)" />
          {/* env -> Obs (emit) */}
          <path d="M 152 165 L 152 153" markerEnd="url(#arrow-s1)" />
          {/* env -> Reward (emit) */}
          <path d="M 240 165 L 240 153" markerEnd="url(#arrow-s1)" />
        </g>

        {/* ==========================================================
            Inter-block arrows (ink charcoal)
            ========================================================== */}

        {/* Coding Agent left edge  ->  env.py code card header.
            The agent authors / iterates on the environment file. */}
        <path
          className="figure-stage-piece figure-stage-piece--env"
          d="M 372 200 L 313 200"
          stroke={C.ink} fill="none" strokeWidth="2.4"
          markerEnd="url(#arrow-ink)"
        />
        <g className="figure-stage-piece figure-stage-piece--env">
          <HaloText className="arrow-label-caps" x={342} y={193} style={{ fontSize: '17px' }}>
            BUILD
          </HaloText>
        </g>

        {/* Tool APIs feeds Stage 1 (env.py) and the Environment block.
            Unlabeled arrows pointing at each destination. */}
        <g className="figure-stage-piece figure-stage-piece--env" stroke={C.ink} strokeWidth="2.4" fill="none">
          <path d="M 372 344 L 313 344" markerEnd="url(#arrow-ink)" />
          <path d="M 305 484 L 368 484" markerEnd="url(#arrow-ink)" />
          <path d="M 600 224 L 600 241" markerEnd="url(#arrow-ink)" />
        </g>

        {/* Human bottom  ->  Coding Agent top edge (connector offset right so the
            centered label sits cleanly in the gap). */}
        <path
          className="figure-stage-piece figure-stage-piece--env"
          d="M 690 142 L 690 170"
          stroke={C.ink} fill="none" strokeWidth="2.4"
          markerEnd="url(#arrow-ink)"
        />
        <g className="figure-stage-piece figure-stage-piece--env">
          <HaloText className="arrow-label" x={600} y={152}>
            <tspan x={600} dy="0">task objective</tspan>
            <tspan x={600} dy="13">&amp; feedback</tspan>
          </HaloText>
        </g>

        {/* Coding Agent right  ->  Stage 2 frame (left edge, at step 1). */}
        <path
          className="figure-stage-piece figure-stage-piece--autoresearch"
          d="M 828 197 L 886 197"
          stroke={C.ink} fill="none" strokeWidth="2.4"
          markerEnd="url(#arrow-ink)"
        />
        <g className="figure-stage-piece figure-stage-piece--autoresearch">
          <HaloText className="arrow-label-caps" x={857} y={188} style={{ fontSize: '17px' }}>
            RUN
          </HaloText>
        </g>

        {/* Stage-2 iteration loop (teal): exit from step 4's bottom, route
            outside the stack, then enter step 1 from above. */}
        <path
          className="figure-stage-piece figure-stage-piece--autoresearch"
          d="M 1038 556 V 576 H 1172 Q 1174 576 1174 574 V 108 Q 1174 104 1170 104 H 1038 V 129"
          stroke={C.s2} fill="none" strokeWidth="1.55"
          strokeLinecap="round" strokeLinejoin="round"
          markerEnd="url(#arrow-s2)"
        />
        {/* 03 (Optimize Infra) -> ENPIRE env: rollouts go out to be executed */}
        <path
          className="figure-stage-piece figure-stage-piece--autoresearch"
          d="M 906 470 L 832 470"
          stroke={C.s2} fill="none" strokeWidth="1.6"
          markerEnd="url(#arrow-s2)"
        />
        {/* rollouts label, above the arrow */}
        <g className="figure-stage-piece figure-stage-piece--autoresearch" transform="translate(862 458)">
          <HaloText className="arrow-label" x={0} y={0} textAnchor="middle" style={{ fill: C.s2 }}>rollouts</HaloText>
        </g>

        {/* ENPIRE env -> 04 (Summarize): logs come back for analysis */}
        <path
          className="figure-stage-piece figure-stage-piece--autoresearch"
          d="M 832 520 L 906 520"
          stroke={C.s2} fill="none" strokeWidth="1.6"
          markerEnd="url(#arrow-s2)"
        />
        {/* logs label, below the arrow */}
        <g className="figure-stage-piece figure-stage-piece--autoresearch" transform="translate(862 540)">
          <HaloText className="arrow-label" x={0} y={0} textAnchor="middle" style={{ fill: C.s2 }}>logs</HaloText>
        </g>
      </svg>
    </div>
  );
}

export default function EnpireFigureOne() {
  const shellRef = useRef(null);
  const replayStartedAtRef = useRef(0);
  const replayRemainingMsRef = useRef(FIGURE_ONE_REPLAY_MS);
  const [scale, setScale] = useState(925 / W);
  const [isPaused, setIsPaused] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) {
      return;
    }

    const updateScale = () => {
      setScale(Math.min(1, shell.clientWidth / W));
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(shell);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isPaused) {
      const elapsedMs = Date.now() - replayStartedAtRef.current;
      replayRemainingMsRef.current = Math.max(350, replayRemainingMsRef.current - elapsedMs);
      return;
    }

    replayStartedAtRef.current = Date.now();
    const replayTimer = window.setTimeout(() => {
      replayRemainingMsRef.current = FIGURE_ONE_REPLAY_MS;
      setAnimationKey((current) => current + 1);
    }, replayRemainingMsRef.current);

    return () => window.clearTimeout(replayTimer);
  }, [animationKey, isPaused]);

  return (
    <div
      className="figure-one-native-shell"
      data-paused={isPaused}
      ref={shellRef}
      style={{
        "--figure-one-height": `${FRAME_VISUAL_HEIGHT * scale}px`,
        "--figure-one-unscaled-height": `${FRAME_VISUAL_HEIGHT}px`,
        "--figure-one-scale": scale,
      }}
    >
      <button
        aria-label={isPaused ? "Resume Figure 1 animation" : "Pause Figure 1 animation"}
        className="figure-one-native__pause"
        onClick={() => setIsPaused((current) => !current)}
        type="button"
      >
        {isPaused ? <Play aria-hidden="true" size={15} strokeWidth={1.9} /> : <Pause aria-hidden="true" size={15} strokeWidth={1.9} />}
      </button>
      <div className="figure-one-native" key={animationKey}>
        <div className="figure-frame">
          <Schematic />
        </div>
      </div>
    </div>
  );
}
