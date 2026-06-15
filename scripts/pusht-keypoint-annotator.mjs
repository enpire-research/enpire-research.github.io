import { createServer } from "node:http";
import { readFile, readdir, stat, writeFile } from "node:fs/promises";
import { extname, isAbsolute, join, normalize, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = normalize(join(fileURLToPath(import.meta.url), "..", ".."));
const publicRoot = join(repoRoot, "public");
const defaultVideoPath = join(publicRoot, "videos", "pusht-reset-only-1.mp4");
const defaultImageDir = join(publicRoot, "images", "pusht-reset-1-images");
const defaultDataPath = join(publicRoot, "data", "pusht-reset-1-keypoints.json");

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const [rawKey, inlineValue] = arg.slice(2).split("=");
    if (inlineValue !== undefined) {
      parsed[rawKey] = inlineValue;
    } else if (argv[i + 1] && !argv[i + 1].startsWith("--")) {
      parsed[rawKey] = argv[i + 1];
      i += 1;
    } else {
      parsed[rawKey] = true;
    }
  }
  return parsed;
}

function absPath(value, fallback) {
  if (!value) return fallback;
  return isAbsolute(value) ? normalize(value) : resolve(repoRoot, value);
}

function publicUrlForPath(fullPath) {
  const rel = relative(publicRoot, fullPath);
  return rel.startsWith("..") ? null : `/${rel.replaceAll("\\", "/")}`;
}

const args = parseArgs(process.argv.slice(2));
if (args.help || args.h) {
  console.log(`Usage:
  npm run annotate:pusht -- --video /path/to/video.mp4 --images /path/to/images --out /path/to/keypoints.json

Options:
  --video   Video file path. Defaults to public/videos/pusht-reset-only-1.mp4
  --images  Image folder path. Defaults to public/images/pusht-reset-1-images
  --out     JSON save path. Defaults to public/data/pusht-reset-1-keypoints.json
  --poster  Optional poster image path
  --port    Server port. Defaults to 4177`);
  process.exit(0);
}
const videoPath = absPath(args.video || process.env.PUSHT_ANNOTATOR_VIDEO, defaultVideoPath);
const imageDir = absPath(args.images || process.env.PUSHT_ANNOTATOR_IMAGES, defaultImageDir);
const dataPath = absPath(args.out || process.env.PUSHT_ANNOTATOR_OUT, defaultDataPath);
const posterPath = absPath(args.poster || process.env.PUSHT_ANNOTATOR_POSTER, join(publicRoot, "images", "pusht-reset-only-1-frame.jpg"));
const videoUrl = publicUrlForPath(videoPath) ?? "/source/video";
const posterUrl = publicUrlForPath(posterPath) ?? "/source/poster";
const imageBaseUrl = publicUrlForPath(imageDir) ?? "/source/images";
const port = Number(args.port || process.env.PORT || 4177);

const mime = {
  ".css": "text/css",
  ".html": "text/html",
  ".jpg": "image/jpeg",
  ".js": "text/javascript",
  ".json": "application/json",
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

function json(res, status, value) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(value, null, 2));
}

function safePublicPath(urlPath) {
  const clean = normalize(decodeURIComponent(urlPath.split("?")[0])).replace(/^(\.\.[/\\])+/, "");
  const full = join(publicRoot, clean);
  return relative(publicRoot, full).startsWith("..") ? null : full;
}

function safeImagePath(urlPath) {
  const prefix = "/source/images/";
  if (!urlPath.startsWith(prefix)) return null;
  const name = decodeURIComponent(urlPath.slice(prefix.length).split("?")[0]);
  if (name.includes("/") || name.includes("\\")) return null;
  const full = join(imageDir, name);
  return relative(imageDir, full).startsWith("..") ? null : full;
}

async function serveFile(res, full) {
  res.writeHead(200, { "Content-Type": mime[extname(full).toLowerCase()] || "application/octet-stream" });
  res.end(await readFile(full));
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

async function handleApi(req, res, url) {
  if (url.pathname === "/api/images") {
    const files = (await readdir(imageDir))
      .filter((name) => /\.(png|jpe?g|webp)$/i.test(name))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
    const imageEntries = await Promise.all(files.map(async (name) => {
      const info = await stat(join(imageDir, name));
      const version = Math.round(info.mtimeMs);
      return {
        name,
        src: `${imageBaseUrl}/${encodeURIComponent(name)}?v=${version}`,
        version,
      };
    }));
    json(res, 200, {
      imageBase: imageBaseUrl,
      images: imageEntries,
    });
    return true;
  }

  if (url.pathname === "/api/keypoints" && req.method === "GET") {
    try {
      json(res, 200, JSON.parse(await readFile(dataPath, "utf8")));
    } catch {
      json(res, 200, { video: videoUrl, imageBase: imageBaseUrl, keypoints: [] });
    }
    return true;
  }

  if (url.pathname === "/api/keypoints" && req.method === "POST") {
    const body = JSON.parse(await readBody(req));
    const saved = {
      video: videoUrl,
      videoPath,
      imageBase: imageBaseUrl,
      imageDir,
      updatedAt: new Date().toISOString(),
      keypoints: (body.keypoints || [])
        .map((point, index) => ({
          id: String(point.id || `kp-${index + 1}`),
          label: String(point.label || `Keypoint ${index + 1}`),
          time: Number(point.time || 0),
          progress: Number(point.progress || 0),
          image: point.image ? String(point.image) : "",
        }))
        .sort((a, b) => a.time - b.time),
    };
    await writeFile(dataPath, `${JSON.stringify(saved, null, 2)}\n`);
    json(res, 200, saved);
    return true;
  }

  return false;
}

function annotatorHtml() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Push-T Reset Keypoint Annotator</title>
  <style>
    :root { --paper:#f6f6ef; --ink:#3b3d39; --muted:rgba(59,61,57,.62); --hair:rgba(59,61,57,.22); }
    * { box-sizing:border-box; }
    body { margin:0; background:var(--paper); color:var(--ink); font-family: Georgia, "Times New Roman", serif; }
    main { width:min(1180px, calc(100vw - 48px)); margin:28px auto 60px; }
    header { display:flex; justify-content:space-between; align-items:end; gap:24px; margin-bottom:16px; }
    h1 { margin:0; font-size:28px; font-weight:400; letter-spacing:0; }
    .status { color:var(--muted); font-size:13px; }
    .stage { display:grid; grid-template-columns:minmax(0, 1fr) 300px; gap:20px; align-items:start; }
    .video-wrap { border:1px solid var(--hair); background:#000; }
    video { display:block; width:100%; aspect-ratio:16/9; object-fit:contain; }
    .toolbar { display:grid; grid-template-columns:auto auto minmax(0, 1fr) auto auto; gap:10px; align-items:center; margin:14px 0; }
    button { height:32px; border:1px solid var(--hair); background:transparent; color:var(--ink); padding:0 12px; cursor:pointer; font:inherit; }
    button:hover, button[data-active="true"] { border-color:var(--ink); background:rgba(59,61,57,.06); }
    .icon-button { width:34px; padding:0; display:inline-grid; place-items:center; }
    .time { font-variant-numeric:tabular-nums; font-size:13px; color:var(--muted); text-align:right; }
    .timeline { position:relative; height:48px; cursor:crosshair; }
    .rail { position:absolute; inset:20px 0 auto; height:8px; border:1px solid rgba(59,61,57,.34); border-radius:999px; overflow:hidden; background:transparent; }
    .fill { position:absolute; inset:-1px auto -1px -1px; width:0; background:var(--ink); border-radius:inherit; }
    .thumb { position:absolute; top:14px; left:0; width:18px; height:18px; border-radius:999px; background:var(--ink); transform:translateX(-50%); cursor:grab; }
    .scrub { position:absolute; inset:0; z-index:2; width:100%; height:48px; opacity:0; cursor:pointer; }
    .kp { position:absolute; top:0; z-index:3; width:32px; height:48px; border:0; background:transparent; padding:0; transform:translateX(-50%); cursor:grab; touch-action:none; }
    .kp:active { cursor:grabbing; }
    .kp::before { content:""; position:absolute; top:16px; left:50%; width:12px; height:12px; border-radius:999px; background:var(--paper); border:2px solid var(--ink); transform:translateX(-50%); }
    .kp[data-selected="true"]::before { background:var(--ink); box-shadow:0 0 0 4px rgba(59,61,57,.16); }
    .panel { border:1px solid var(--hair); padding:12px; background:rgba(255,255,255,.22); }
    .panel h2 { margin:0 0 10px; font-size:16px; font-weight:500; }
    .field { display:grid; gap:5px; margin:10px 0; }
    label { font-size:12px; color:var(--muted); }
    input[type="text"] { height:30px; border:1px solid var(--hair); background:transparent; padding:0 8px; color:var(--ink); font:inherit; }
    .associate-row { display:grid; grid-template-columns:1fr auto; gap:8px; align-items:center; margin:10px 0; }
    .selected-image-name { overflow:hidden; color:var(--muted); font-size:12px; text-overflow:ellipsis; white-space:nowrap; }
    .image-grid { display:grid; grid-template-columns:1fr; gap:8px; max-height:560px; overflow:auto; padding-right:3px; }
    .image-card { border:1px solid var(--hair); background:transparent; padding:5px; text-align:left; height:auto; }
    .image-card img { display:block; width:100%; aspect-ratio:16/9; object-fit:cover; background:#000; }
    .image-card span { display:block; margin-top:5px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:11px; color:var(--muted); }
    .image-card[data-active="true"] { border-color:var(--ink); box-shadow:inset 0 0 0 1px var(--ink); }
    .image-card[data-associated="true"] span::before { content:"Associated · "; color:var(--ink); }
    .keypoint-list { display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; }
    .chip { height:28px; border:1px solid var(--hair); padding:0 10px; display:inline-flex; align-items:center; gap:7px; cursor:pointer; }
    .chip[data-active="true"] { border-color:var(--ink); background:rgba(59,61,57,.07); }
    @media (max-width:900px) { .stage { grid-template-columns:1fr; } .toolbar { grid-template-columns:auto auto 1fr; } }
  </style>
</head>
<body>
  <main>
    <header>
      <h1>Push-T Reset Keypoint Annotator</h1>
      <div class="status" id="status">Loading…</div>
    </header>
    <div class="stage">
      <section>
        <div class="video-wrap"><video id="video" src="${videoUrl}" poster="${posterUrl}" muted playsinline preload="auto"></video></div>
        <div class="toolbar">
          <button id="play">Play</button>
          <button class="icon-button" id="add" title="Add keypoint">${icon("plus")}</button>
          <div class="timeline" id="timeline">
            <div class="rail"><div class="fill" id="fill"></div></div>
            <div class="thumb" id="thumb" title="Drag video time"></div>
            <input class="scrub" id="scrub" min="0" max="1" step="0.001" type="range" value="0" aria-label="Video timeline" />
          </div>
          <button class="icon-button" id="remove" title="Remove selected keypoint">${icon("trash")}</button>
          <button class="icon-button" id="save" title="Save relationship">${icon("save")}</button>
        </div>
        <div class="time"><span id="clock">0.00s</span> / <span id="duration">0.00s</span></div>
        <div class="keypoint-list" id="keypointList"></div>
      </section>
      <aside class="panel">
        <h2>Associate Selected Keypoint</h2>
        <div class="field">
          <label for="label">Label</label>
          <input id="label" type="text" placeholder="Keypoint label" />
        </div>
        <div class="associate-row">
          <div class="selected-image-name" id="selectedImageName">No image selected</div>
          <button id="associate" type="button">Associate</button>
        </div>
        <div class="image-grid" id="images"></div>
      </aside>
    </div>
  </main>
  <script>
    const video = document.getElementById('video');
    const timeline = document.getElementById('timeline');
    const scrub = document.getElementById('scrub');
    const fill = document.getElementById('fill');
    const thumb = document.getElementById('thumb');
    const play = document.getElementById('play');
    const add = document.getElementById('add');
    const remove = document.getElementById('remove');
    const save = document.getElementById('save');
    const associate = document.getElementById('associate');
    const statusEl = document.getElementById('status');
    const imageGrid = document.getElementById('images');
    const selectedImageNameEl = document.getElementById('selectedImageName');
    const labelInput = document.getElementById('label');
    const keypointList = document.getElementById('keypointList');
    const clock = document.getElementById('clock');
    const durationEl = document.getElementById('duration');
    let images = [];
    let keypoints = [];
    let selectedId = null;
    let selectedImageName = '';
    let dragPointId = null;
    let activePointerId = null;
    let lastScrubValue = '0';
    const fmt = (s) => (Number.isFinite(s) ? s : 0).toFixed(2) + 's';
    const selected = () => keypoints.find((p) => p.id === selectedId) || null;
    const progressFromEvent = (event) => {
      const rect = timeline.getBoundingClientRect();
      return Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    };
    const isKeypointTarget = (target) => target?.classList?.contains('kp');
    function iconLabel(point, index) { return point.label || 'Keypoint ' + (index + 1); }
    function setStatus(text) { statusEl.textContent = text; }
    function sortImages(nextImages) {
      return (nextImages || []).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
    }
    function imageSignature(nextImages) {
      return nextImages.map((image) => image.name + ':' + (image.version || image.src)).join('|');
    }
    async function refreshImages({ quiet = false } = {}) {
      const imageData = await fetch('/api/images?ts=' + Date.now()).then(r => r.json());
      const nextImages = sortImages(imageData.images || []);
      const changed = imageSignature(nextImages) !== imageSignature(images);
      if (!changed) return;
      images = nextImages;
      if (!images.some((image) => image.name === selectedImageName)) {
        selectedImageName = selected()?.image || '';
      }
      if (!quiet) setStatus('Reloaded ' + images.length + ' images from folder');
      render();
    }
    function paintTimeline(progress, time) {
      fill.style.width = (progress * 100) + '%';
      thumb.style.left = (progress * 100) + '%';
      scrub.value = String(progress);
      lastScrubValue = scrub.value;
      clock.textContent = fmt(time);
      durationEl.textContent = fmt(video.duration || 0);
      const point = selected();
      if (point) {
        const node = timeline.querySelector('.kp[data-id="' + point.id + '"]');
        if (node) node.style.left = (point.progress * 100) + '%';
      }
      renderKeypointList();
    }
    function setVideoProgress(progress) {
      if (!video.duration) return;
      const clamped = Math.max(0, Math.min(1, progress));
      const time = clamped * video.duration;
      try {
        if (typeof video.fastSeek === 'function') {
          video.fastSeek(time);
        } else {
          video.currentTime = time;
        }
      } catch {
        video.currentTime = time;
      }
      if (video.paused) {
        video.play().then(() => {
          video.pause();
          video.currentTime = time;
          paintTimeline(clamped, time);
        }).catch(() => {});
      }
      paintTimeline(clamped, time);
    }
    function selectPoint(id) {
      selectedId = id;
      const point = selected();
      selectedImageName = point?.image || '';
      if (point && video.duration) setVideoProgress(point.progress);
      render();
    }
    function seek(progress) {
      setVideoProgress(progress);
      render();
    }
    function moveKeypointToEvent(event) {
      const point = keypoints.find((item) => item.id === dragPointId);
      if (!point || !video.duration) return;
      const next = progressFromEvent(event);
      point.progress = next;
      point.time = next * video.duration;
      setVideoProgress(next);
      const node = timeline.querySelector('.kp[data-id="' + point.id + '"]');
      if (node) node.dataset.selected = 'true';
    }
    function render() {
      const duration = video.duration || 0;
      const progress = duration ? video.currentTime / duration : 0;
      fill.style.width = (progress * 100) + '%';
      thumb.style.left = (progress * 100) + '%';
      clock.textContent = fmt(video.currentTime);
      durationEl.textContent = fmt(duration);
      play.textContent = video.paused ? 'Play' : 'Pause';
      document.querySelectorAll('.kp').forEach((el) => el.remove());
      keypoints.forEach((point) => {
        const node = document.createElement('button');
        node.className = 'kp';
        node.type = 'button';
        node.dataset.id = point.id;
        node.dataset.selected = String(point.id === selectedId);
        node.style.left = (point.progress * 100) + '%';
        node.title = (point.label || point.id) + ' @ ' + fmt(point.time);
        node.addEventListener('pointerdown', (event) => {
          event.preventDefault();
          event.stopPropagation();
          selectedId = point.id;
          selectedImageName = point.image || '';
          dragPointId = point.id;
          activePointerId = event.pointerId;
          timeline.setPointerCapture?.(event.pointerId);
          setVideoProgress(point.progress);
          render();
        });
        node.addEventListener('mousedown', (event) => {
          event.preventDefault();
          event.stopPropagation();
          selectedId = point.id;
          selectedImageName = point.image || '';
          dragPointId = point.id;
          activePointerId = null;
          setVideoProgress(point.progress);
          render();
        });
        timeline.appendChild(node);
      });
      labelInput.value = selected()?.label || '';
      selectedImageNameEl.textContent = selectedImageName || 'No image selected';
      renderImages();
      renderKeypointList();
    }
    function renderImages() {
      const point = selected();
      imageGrid.innerHTML = '';
      images.forEach((image) => {
        const btn = document.createElement('button');
        btn.className = 'image-card';
        btn.type = 'button';
        btn.dataset.active = String(selectedImageName === image.name);
        btn.dataset.associated = String(Boolean(point && point.image === image.name));
        btn.innerHTML = '<img src="' + image.src + '" alt=""><span>' + image.name + '</span>';
        btn.addEventListener('click', () => {
          selectedImageName = image.name;
          selectedImageNameEl.textContent = selectedImageName;
          renderImages();
        });
        imageGrid.appendChild(btn);
      });
    }
    function renderKeypointList() {
      keypointList.innerHTML = '';
      keypoints.forEach((point, index) => {
        const chip = document.createElement('button');
        chip.className = 'chip';
        chip.type = 'button';
        chip.dataset.active = String(point.id === selectedId);
        chip.textContent = iconLabel(point, index) + ' · ' + fmt(point.time);
        chip.addEventListener('click', () => selectPoint(point.id));
        keypointList.appendChild(chip);
      });
    }
    labelInput.addEventListener('input', () => {
      const point = selected();
      if (!point) return;
      point.label = labelInput.value;
      renderKeypointList();
    });
    associate.addEventListener('click', () => {
      const point = selected();
      if (!point || !selectedImageName) return;
      point.image = selectedImageName;
      setStatus('Associated ' + point.label + ' with ' + selectedImageName);
      render();
    });
    timeline.addEventListener('pointerdown', (event) => {
      if (isKeypointTarget(event.target)) return;
      if (event.target === scrub) return;
      seek(progressFromEvent(event));
      const move = (moveEvent) => seek(progressFromEvent(moveEvent));
      timeline.addEventListener('pointermove', move);
      timeline.addEventListener('pointerup', () => timeline.removeEventListener('pointermove', move), { once:true });
    });
    timeline.addEventListener('mousedown', (event) => {
      if (isKeypointTarget(event.target)) return;
      if (event.target === scrub) return;
      seek(progressFromEvent(event));
      const move = (moveEvent) => seek(progressFromEvent(moveEvent));
      document.addEventListener('mousemove', move);
      document.addEventListener('mouseup', () => document.removeEventListener('mousemove', move), { once:true });
    });
    scrub.addEventListener('input', () => setVideoProgress(Number(scrub.value)));
    scrub.addEventListener('change', () => setVideoProgress(Number(scrub.value)));
    scrub.addEventListener('click', () => setVideoProgress(Number(scrub.value)));
    scrub.addEventListener('mouseup', () => setVideoProgress(Number(scrub.value)));
    scrub.addEventListener('pointerup', () => setVideoProgress(Number(scrub.value)));
    scrub.addEventListener('mousemove', (event) => {
      if (event.buttons === 1) setVideoProgress(Number(scrub.value));
    });
    scrub.addEventListener('pointermove', (event) => {
      if (event.buttons === 1) setVideoProgress(Number(scrub.value));
    });
    window.setInterval(() => {
      if (scrub.value === lastScrubValue) return;
      setVideoProgress(Number(scrub.value));
    }, 33);
    timeline.addEventListener('pointermove', (event) => {
      if (!dragPointId) return;
      event.preventDefault();
      moveKeypointToEvent(event);
    });
    document.addEventListener('pointermove', (event) => {
      if (!dragPointId) return;
      event.preventDefault();
      moveKeypointToEvent(event);
    });
    document.addEventListener('mousemove', (event) => {
      if (!dragPointId) return;
      event.preventDefault();
      moveKeypointToEvent(event);
    });
    document.addEventListener('pointerup', () => {
      if (!dragPointId) return;
      if (activePointerId !== null) timeline.releasePointerCapture?.(activePointerId);
      dragPointId = null;
      activePointerId = null;
      render();
    });
    document.addEventListener('mouseup', () => {
      if (!dragPointId) return;
      dragPointId = null;
      activePointerId = null;
      render();
    });
    play.addEventListener('click', async () => video.paused ? video.play() : video.pause());
    add.addEventListener('click', () => {
      const duration = video.duration || 0;
      const time = video.currentTime || 0;
      const point = { id: 'kp-' + Date.now(), label: 'Keypoint ' + (keypoints.length + 1), time, progress: duration ? time / duration : 0, image: '' };
      keypoints.push(point);
      selectedId = point.id;
      selectedImageName = '';
      render();
    });
    remove.addEventListener('click', () => {
      if (!selectedId) return;
      keypoints = keypoints.filter((point) => point.id !== selectedId);
      selectedId = keypoints[0]?.id || null;
      selectedImageName = selected()?.image || '';
      render();
    });
    save.addEventListener('click', async () => {
      const body = { keypoints };
      const res = await fetch('/api/keypoints', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      keypoints = data.keypoints || [];
      selectedImageName = selected()?.image || '';
      setStatus('Saved ' + keypoints.length + ' keypoints to public/data/pusht-reset-1-keypoints.json');
      render();
    });
    video.addEventListener('timeupdate', render);
    video.addEventListener('loadedmetadata', render);
    video.addEventListener('play', render);
    video.addEventListener('pause', render);
    Promise.all([fetch('/api/images').then(r => r.json()), fetch('/api/keypoints').then(r => r.json())]).then(([imageData, pointData]) => {
      images = sortImages(imageData.images || []);
      keypoints = pointData.keypoints || [];
      selectedId = keypoints[0]?.id || null;
      selectedImageName = selected()?.image || '';
      setStatus('Loaded ' + images.length + ' images and ' + keypoints.length + ' keypoints');
      render();
      window.setInterval(() => refreshImages({ quiet: true }).catch(() => {}), 2000);
    });
  </script>
</body>
</html>`;
}

function icon(name) {
  const paths = {
    plus: '<path d="M12 5v14M5 12h14"/>',
    save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l3 3v15Z"/><path d="M8 21v-8h8v8M8 3v5h8"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 16h10l1-16"/>' ,
  };
  return '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + paths[name] + '</svg>';
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://localhost:${port}`);
    if (url.pathname.startsWith("/api/") && await handleApi(req, res, url)) return;
    if (url.pathname === "/" || url.pathname === "/annotator") {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(annotatorHtml());
      return;
    }
    if (url.pathname === "/source/video") {
      await serveFile(res, videoPath);
      return;
    }
    if (url.pathname === "/source/poster") {
      await serveFile(res, posterPath);
      return;
    }
    const sourceImagePath = safeImagePath(url.pathname);
    if (sourceImagePath) {
      await serveFile(res, sourceImagePath);
      return;
    }
    const full = safePublicPath(url.pathname);
    if (!full || !(await stat(full).catch(() => null))) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    await serveFile(res, full);
  } catch (error) {
    json(res, 500, { error: error instanceof Error ? error.message : String(error) });
  }
});

server.listen(port, () => {
  console.log(`Push-T keypoint annotator: http://localhost:${port}/annotator`);
  console.log(`Video: ${videoPath}`);
  console.log(`Images: ${imageDir}`);
  console.log(`Saving to: ${dataPath}`);
});
