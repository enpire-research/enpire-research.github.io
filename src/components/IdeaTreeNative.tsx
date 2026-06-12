// @ts-nocheck
"use client";

/*
 * Figure — ENPIRE execution trace.
 *
 * Two stacked panels sharing one wall-clock-time x-axis:
 *   - top:    the hypothesis git-tree (a `main` trunk with one lane per branch)
 *   - bottom: the team-avg best success-rate hillclimb curve
 * Sizes are tuned large so the figure stays legible when scaled to a paper
 * column. Nothing else is drawn — only these two plots.
 */

import { useState } from "react";
import { TREE, DETAILS } from "./IdeaTreeData";

const W = 1200;

// the two stacked panels, sharing the wall-clock-time x-axis
const TREE_BAND = { x: 16, y: 40, w: W - 32, h: 660 };
const HILL = { x: 16, y: 740, w: W - 32, h: 260 };
const H = 1016; // canvas height = just below the hillclimb panel

// tree vertical map: trunk a touch below band-center (most lanes fork upward),
// signed lanes step away from it. lane +1 = first lane above the trunk.
const TREE_MID = TREE_BAND.y + TREE_BAND.h * 0.556;
const LANE_PX = 74; // vertical distance between adjacent branch lanes
const ty = (lane) => TREE_MID - lane * LANE_PX;
const FORK_DX = 14; // px run of each fork/merge S-curve along x

// plot geometry for the success-rate panel
const PLOT_L = 74; // leaves room for the rotated y-axis label
const PLOT_R = W - 40;
const tx = (t) => PLOT_L + t * (PLOT_R - PLOT_L);

// smooth git-graph S-curve (horizontal tangents at both ends) as an SVG path
const sCurve = (x0, y0, x1, y1) => {
  const cx = (x0 + x1) / 2;
  return `M ${x0} ${y0} C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
};
const HILL_BASE = HILL.y + HILL.h - 50; // success-rate = 0 baseline (room for axis)
const HILL_TOPV = HILL.y + 44;          // success-rate = 1 (headroom for caption)
const hy = (sr) => HILL_BASE + sr * (HILL_TOPV - HILL_BASE);

// Real team-averaged best success rate over the run (mean of 8 agents' personal-
// best SR so far). Rendered as a cliff/step curve: the value holds flat, then
// jumps vertically at the wall-clock time of each improvement. [relMin, SR%].
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

// relMin -> {lane, idx} lookups over every tree node (node->rung connectors +
// the "I{n}" idea tag shared between the tree node and its hillclimb callout)
const LANE_AT = {};
const IDX_AT = {};
const KEY_AT = {};
for (const br of TREE.branches)
  for (const nd of br.nodes) {
    LANE_AT[nd.relMin.toFixed(2)] = br.lane;
    IDX_AT[nd.relMin.toFixed(2)] = nd.idx;
    KEY_AT[nd.relMin.toFixed(2)] = `a${nd.agent}.${nd.hid}`;
  }
const laneAt = (relMin) => LANE_AT[relMin.toFixed(2)] ?? 0;
const idxAt = (relMin) => IDX_AT[relMin.toFixed(2)];
const keyAt = (relMin) => KEY_AT[relMin.toFixed(2)];

// relMin -> pp the idea added to the team-avg best success rate. Each score-
// raising idea lands on a cliff of the SR step curve; the increment is that
// step's rise over the previous held value.
const INC_AT = {};
for (let i = 1; i < SR_STEPS.length; i++)
  INC_AT[SR_STEPS[i][0].toFixed(2)] = SR_STEPS[i][1] - SR_STEPS[i - 1][1];
const incAt = (relMin) => INC_AT[relMin.toFixed(2)];

// node key -> pp the idea added to the team-avg best success rate, for the
// raised nodes. Surfaced inside the click popover rather than inline on the tree.
const INC_BY_KEY = {};
for (const br of TREE.branches)
  for (const nd of br.nodes) {
    const inc = incAt(nd.relMin);
    if (nd.raised && inc != null) INC_BY_KEY[`a${nd.agent}.${nd.hid}`] = inc;
  }

// Cross-agent inspiration edges, derived from DETAILS[*].borrowed
// ("Agent 3 idea H1" -> source key "a3.H1"). Edges whose source H is not an
// included tree node are dropped.
const NODE_POS = {};
for (const br of TREE.branches)
  for (const nd of br.nodes)
    NODE_POS[`a${nd.agent}.${nd.hid}`] = { x: sx(nd.relMin), y: ty(br.lane) };
const INSPIRE_EDGES = [];
for (const [to, d] of Object.entries(DETAILS))
  for (const b of d.borrowed) {
    const from = `a${b.replace('Agent ', '').replace(' idea ', '.')}`;
    if (NODE_POS[from] && NODE_POS[to]) INSPIRE_EDGES.push({ from, to });
  }

// De-overlap the tree node labels: within each lane, push crowded labels onto a
// few stacked rows. Text-only — node/edge geometry is unchanged. Returns
// {idx -> level}; the label is nudged level*13px further from its lane.
const LABEL_LEVEL = (() => {
  const byLane = {};
  for (const br of TREE.branches)
    for (const nd of br.nodes)
      (byLane[br.lane] ||= []).push({ x: sx(nd.relMin), idx: nd.idx, raised: nd.raised });
  // ~half label width @12px mono ("I" + the index digits).
  const halfW = (it) => (String(it.idx).length + 1) * 3.3;
  const MAXLV = 3, GAP = 3;
  const level = {};
  for (const lane of Object.keys(byLane)) {
    const arr = byLane[lane].sort((a, b) => a.x - b.x);
    const right = [];
    for (const it of arr) {
      const hw = halfW(it);
      let lv = 0;
      while (lv < MAXLV && it.x - hw < (right[lv] ?? -Infinity) + GAP) lv++;
      if (lv === MAXLV) { // every row busy -> reuse the least-crowded one
        lv = 0;
        for (let j = 1; j < MAXLV; j++)
          if ((right[j] ?? -Infinity) < (right[lv] ?? -Infinity)) lv = j;
      }
      level[it.idx] = lv;
      right[lv] = it.x + hw;
    }
  }
  return level;
})();

// Labelled key hypotheses (key_hypotheses with label:true in
// branch_graph_include.yaml). Each lands on a cliff of the team-avg curve; we
// annotate it with its short name + the pp it added to the best SR.
// place: 'above' (open space over the low part of the curve) or 'below'
// (dropped into the green fill). rowY = label row for the clustered high-SR
// ones; dx nudges the open-space labels clear of the rise.
const KEY_HS = [
  { relMin: 20.65,  sr: 23.2,  name: 'Online RL mix Demo',       delta: '+3.8 pp',  place: 'above', dx: -26 },
  { relMin: 43.3,   sr: 59.14, name: 'BC regularization',        delta: '+10.8 pp', place: 'above', dx: -70 },
  { relMin: 93.88,  sr: 89.11, name: 'Tweak BC term weight',     delta: '+0.4 pp',  place: 'below', rowY: 856 },
  { relMin: 117.47, sr: 90.04, name: 'Tune batch size 1024→512', delta: '+0.9 pp',  place: 'below', rowY: 892 },
  { relMin: 149.28, sr: 94.48, name: 'Compensate controller',    delta: '+1.3 pp',  place: 'below', rowY: 856 },
];
// A step counts as a "prominent" jump (big-dot) when SR rises by >= this much.
const PROMINENT_DELTA = 6;

// Only the labelled ideas (those with a callout + dashed connector below) get a
// ring in the tree — keyed by their relMin so tree node and milestone agree.
const KEY_RELMIN = new Set(KEY_HS.map((k) => k.relMin.toFixed(2)));

function Defs() {
  return (
    <defs>
      {/* hillclimb green fill, fading from the curve down to the baseline */}
      <linearGradient id="hill-grad" x1="0" y1={HILL_TOPV} x2="0" y2={HILL_BASE}
                      gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="oklch(68% 0.09 150)" stopOpacity="0.42" />
        <stop offset="1" stopColor="oklch(68% 0.09 150)" stopOpacity="0.03" />
      </linearGradient>
    </defs>
  );
}

// Cross-agent inspiration edges: a green curve from the inspiring node to each
// node it inspired. Selecting a node lifts its incident edges and dims the rest.
function InspireLayer({ selected }) {
  return (
    <g>
      {INSPIRE_EDGES.map((e, i) => {
        const a = NODE_POS[e.from];
        const b = NODE_POS[e.to];
        const hot = selected === e.from || selected === e.to;
        return (
          <path key={`ie-${i}`}
                className={`insp-edge${hot ? ' key' : selected ? ' dim' : ''}`}
                d={sCurve(a.x, a.y, b.x, b.y)} />
        );
      })}
    </g>
  );
}

// Hypothesis git-tree: a `main` trunk with one signed lane per branch. Branches
// fork from main at their first node and drop a merge curve back to main at every
// node that raised the team-avg best.
function TreeBand({ selected, onSelect }) {
  const maxRel = Math.max(
    ...TREE.branches.flatMap((b) => b.nodes.map((n) => n.relMin))
  );
  return (
    <g>
      {/* main trunk: starts at the first branch's fork base (FORK_DX left of the
          first node), solid through the last node, faded to the right edge */}
      <line className="tree-trunk" x1={sx(0) - FORK_DX} y1={TREE_MID} x2={sx(maxRel)} y2={TREE_MID} />
      <line className="tree-trunk" x1={sx(maxRel)} y1={TREE_MID} x2={PLOT_R} y2={TREE_MID}
            strokeOpacity="0.3" />

      {/* branches */}
      {TREE.branches.map((br, bi) => {
        const laneY = ty(br.lane);
        const xs = br.nodes.map((n) => sx(n.relMin));
        const x0 = xs[0];
        const x1 = xs[xs.length - 1];
        const above = br.lane >= 0;
        return (
          <g key={`br-${bi}`}>
            {/* fork from main up to the lane, then the horizontal branch body */}
            <path className="tree-stem" d={sCurve(x0 - FORK_DX, TREE_MID, x0, laneY)} />
            {x1 > x0 && (
              <line className="tree-stem" x1={x0} y1={laneY} x2={x1} y2={laneY} />
            )}
            {/* merge curves back to main at every raised node */}
            {br.nodes.map((n, ni) => n.raised && (
              <g key={`mg-${ni}`}>
                <path className="tree-merge"
                      d={sCurve(xs[ni], laneY, xs[ni] + FORK_DX, TREE_MID)} />
                <circle className="merge-dot" cx={xs[ni] + FORK_DX} cy={TREE_MID} r="3" />
              </g>
            ))}
            {/* node markers + idea labels (click a node to inspect the idea) */}
            {br.nodes.map((n, ni) => {
              const key = `a${n.agent}.${n.hid}`;
              return (
                <g key={`nd-${ni}`} className="node-hit"
                   onClick={() => onSelect(selected === key ? null : { key, x: xs[ni], y: laneY })}>
                  <text className="tree-hid" x={xs[ni]} textAnchor="middle"
                        y={laneY + (above ? -9 - (LABEL_LEVEL[n.idx] || 0) * 13
                                          :  16 + (LABEL_LEVEL[n.idx] || 0) * 13)}>
                    {`I${n.idx}`}
                  </text>
                  {/* invisible widened hit target so small dots are easy to click */}
                  <circle className="hit-area" cx={xs[ni]} cy={laneY} r="11" />
                  {selected === key && (
                    <circle className="sel-ring" cx={xs[ni]} cy={laneY} r="10.5" />
                  )}
                  <circle className="node-halo" cx={xs[ni]} cy={laneY} r="6.2" />
                  {n.raised && <circle className="node-raised-ring" cx={xs[ni]} cy={laneY} r="8" />}
                  <circle className="idea-dot" cx={xs[ni]} cy={laneY} r="4.1" />
                  {KEY_RELMIN.has(n.relMin.toFixed(2)) && (
                    <>
                      <circle className="hc-key-ring" cx={xs[ni]} cy={laneY} r="7.8" />
                      <circle className="idea-dot" cx={xs[ni]} cy={laneY} r="4.1" />
                    </>
                  )}
                </g>
              );
            })}
          </g>
        );
      })}
    </g>
  );
}

function TraceLayer({ selected, onSelect }) {
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
    <svg className="trace" viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <Defs />

      {/* hypothesis git-tree (top panel); inspiration edges drawn first so the
          branch lines and node dots stay on top */}
      <InspireLayer selected={selected} />
      <TreeBand selected={selected} onSelect={onSelect} />

      {/* dotted connectors: each labelled key node -> its rung on the curve */}
      {KEY_HS.map((k, i) => (
        <line key={`cn-${i}`} className="tree-conn"
              x1={sx(k.relMin)} y1={ty(laneAt(k.relMin)) + 10}
              x2={sx(k.relMin)} y2={sy(k.sr) - 9} />
      ))}

      {/* gridlines + y-axis ticks */}
      {[0, 0.5, 1].map((g) => (
        <g key={g}>
          <line className="grid" x1={PLOT_L} y1={hy(g)} x2={PLOT_R} y2={hy(g)} />
          <text className="axis-num" x={PLOT_L - 10} y={hy(g) + 5} textAnchor="end">
            {g === 0 ? '0' : g === 1 ? '100%' : '50%'}
          </text>
        </g>
      ))}

      {/* y-axis label */}
      <text
        className="axis-cap"
        x={26}
        y={(HILL_TOPV + HILL_BASE) / 2}
        textAnchor="middle"
        transform={`rotate(-90 26 ${(HILL_TOPV + HILL_BASE) / 2})`}
      >
        team-avg best success rate
      </text>

      {/* cliff curve + gradient shadow */}
      <path className="hill-area" d={area} fill="url(#hill-grad)" />
      <path className="hill-line" d={line} />

      {/* a dot at every step change; big jumps (>= PROMINENT_DELTA) get a larger dot */}
      {SR_STEPS.slice(1).map(([t, v], i) => {
        const prominent = v - SR_STEPS[i][1] >= PROMINENT_DELTA;
        return (
          <circle
            key={t}
            className={prominent ? 'node-key' : 'step-dot'}
            cx={sx(t)} cy={sy(v)} r={prominent ? 5.6 : 3.2}
          />
        );
      })}

      {/* labelled key-hypothesis milestones: leader + callout + ringed node */}
      {KEY_HS.map((k, i) => {
        const nx = sx(k.relMin);
        const ny = sy(k.sr);
        const above = k.place === 'above';
        const lx = nx + (k.dx || 0);
        let nameY, deltaY, leadTo;
        if (above) {            // name on top, delta below it, both above the node
          deltaY = ny - 20; nameY = deltaY - 17; leadTo = deltaY + 4;
        } else {                // name + delta dropped below into the green fill
          nameY = k.rowY; deltaY = nameY + 17; leadTo = nameY - 13;
        }
        const key = keyAt(k.relMin);
        return (
          <g key={`kh-${i}`} className={key ? 'node-hit' : undefined}
             onClick={key ? () => onSelect(selected === key ? null : { key, x: nx, y: ny }) : undefined}>
            <line className="hc-leader" x1={nx} y1={ny + (above ? -7 : 7)} x2={lx} y2={leadTo} />
            {selected === key && key && (
              <circle className="sel-ring" cx={nx} cy={ny} r="12.5" />
            )}
            <circle className="hc-key-ring" cx={nx} cy={ny} r="9" />
            <circle className="idea-dot" cx={nx} cy={ny} r="4.1" />
            <circle className="hit-area" cx={nx} cy={ny} r="12" />
            <text className="hc-name" x={lx} y={nameY} textAnchor="middle">
              {idxAt(k.relMin) ? `I${idxAt(k.relMin)} ${k.name}` : k.name}
            </text>
            <text className="hc-delta" x={lx} y={deltaY} textAnchor="middle">{k.delta}</text>
          </g>
        );
      })}

      {/* x-axis: baseline, hourly ticks, label */}
      <line className="axis" x1={PLOT_L} y1={HILL_BASE} x2={PLOT_R} y2={HILL_BASE} />
      {[0, 60, 120, 180].map((m) => (
        <g key={m}>
          <line className="axis" x1={sx(m)} y1={HILL_BASE} x2={sx(m)} y2={HILL_BASE + 5} />
          <text className="axis-num" x={sx(m)} y={HILL_BASE + 20} textAnchor="middle">
            {m === 0 ? '0' : `${m / 60} h`}
          </text>
        </g>
      ))}
      <text className="axis-cap" x={(PLOT_L + PLOT_R) / 2} y={HILL_BASE + 36} textAnchor="middle">
        research wall-clock time &rarr;
      </text>

      {/* legend — swatches mirror the actual tree node markers so the key and
          the figure render every idea point the same way */}
      <g transform="translate(74, 30)">
        <circle className="node-halo" cx="7" cy="0" r="6.2" />
        <circle className="idea-dot" cx="7" cy="0" r="4.1" />
        <text className="legend-txt" x="22" y="5">each dot = an idea</text>
        <circle className="node-halo" cx="212" cy="0" r="6.2" />
        <circle className="node-raised-ring" cx="212" cy="0" r="8" />
        <circle className="idea-dot" cx="212" cy="0" r="4.1" />
        <text className="legend-txt" x="228" y="5">green ring = idea that raised the team score</text>
        <path className="insp-edge key" d={sCurve(566, 8, 594, -4)} />
        <text className="legend-txt" x="606" y="5">green curve = cross-agent inspiration</text>
      </g>
    </svg>
  );
}

function IdeaPopover({ detail, position, onClose }) {
  if (!detail) return null;

  const d = detail;
  const x = position?.x ?? W / 2;
  const y = position?.y ?? H / 2;
  const className = x > W * 0.68 ? "idea-popover idea-popover--left" : "idea-popover";
  const agent = position?.key?.match(/^a(\d+)\./)?.[1];
  const inc = position?.key ? INC_BY_KEY[position.key] : null;

  return (
    <div className={className} style={{ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%` }}>
      <button className="idea-close" onClick={onClose} aria-label="close">×</button>
      <div className="idea-head">
        <span className="idea-tag">{agent ? `Agent ${agent}` : "Agent"} · I{d.idx}</span>
        <span className="idea-title">
          {d.keyShort || `Idea I${d.idx}`}
        </span>
      </div>
      {inc != null && (
        <p className="idea-inc">
          Raised team-avg best success rate by
          <span className="idea-inc-val">+{inc.toFixed(1)} pp</span>
        </p>
      )}
      {d.coreIdea && <p className="idea-core">{d.coreIdea}</p>}
    </div>
  );
}

export default function Figure1() {
  const [selected, setSelected] = useState(null);
  const selectedKey = selected?.key ?? null;
  return (
    <section className="idea-tree-native" aria-label="Pin insertion idea tree">
      <div className="figure-frame">
        <div className="schematic" style={{ height: H }}>
          <TraceLayer selected={selectedKey} onSelect={setSelected} />
          <IdeaPopover detail={selectedKey ? DETAILS[selectedKey] : null}
                       position={selected}
                       onClose={() => setSelected(null)} />
        </div>
      </div>
      <p className="idea-tree-caption">
        Each coding agent explores its own branch of hypotheses, one lane per branch. Every
        dot is an idea it tried; a green ring marks an idea that raised the team&rsquo;s best
        success rate, and green curves trace cross-agent inspiration. The lower panel tracks
        the team-average best success rate climbing over research wall-clock time.
      </p>
    </section>
  );
}
