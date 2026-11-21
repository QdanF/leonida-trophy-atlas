/* Leonida Trophy Atlas: offline checklist, filters, spoiler guard, export and import.
   Progress lives in localStorage under one key; the guide data is fetched once
   from the app's own data file and never leaves the device. */
const KEY = 'leonida-trophy-atlas-v1';
const SPOILER_KEY = 'leonida-trophy-atlas-spoilers-v1';
const params = new URLSearchParams(location.search);
const shotMode = params.get('shot') || '';
const seedCount = Number(params.get('seed') || '0');

const listEl = document.getElementById('trophyList');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const upNextList = document.getElementById('upNextList');
const categoryProgress = document.getElementById('categoryProgress');
const spoilerToggle = document.getElementById('spoilerToggle');
const filterCount = document.getElementById('filterCount');
const searchInput = document.getElementById('search');
const gradeFilter = document.getElementById('gradeFilter');

let earned = new Set();
try { earned = new Set(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch (e) { earned = new Set(); }
let spoilersShown = localStorage.getItem(SPOILER_KEY) === 'shown';
let activeFilter = 'all';
let openGuides = new Set();

const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;

if (seedCount > 0 && earned.size === 0) {
  trophies.slice(0, seedCount).forEach(function (t) { earned.add(t.name); });
  saveProgress();
}

function saveProgress() {
  localStorage.setItem(KEY, JSON.stringify(Array.from(earned)));
}

function hiddenCount() {
  return trophies.filter(function (t) { return t.spoiler; }).length;
}

function isHidden(t) {
  return t.spoiler && !spoilersShown && !earned.has(t.name);
}

function matchesFilter(t) {
  if (gradeFilter.value !== 'all' && t.grade !== gradeFilter.value) return false;
  if (activeFilter === 'story' && t.category !== 'story') return false;
  if (activeFilter === 'missable' && !t.missable) return false;
  if (activeFilter === 'collectibles' && t.category !== 'collectibles') return false;
  if (activeFilter === 'activities' && t.category !== 'activities') return false;
  if (activeFilter === 'unearned' && earned.has(t.name)) return false;
  const q = searchInput.value.trim().toLowerCase();
  if (q && (t.name + ' ' + t.description + ' ' + t.guide).toLowerCase().indexOf(q) === -1) return false;
  return true;
}

function gradeLabel(g) { return g.charAt(0).toUpperCase() + g.slice(1); }

function renderProgress() {
  const n = earned.size;
  const total = trophies.length;
  const pct = Math.round((n / total) * 100);
  progressFill.style.width = pct + '%';
  progressText.textContent = n + ' of ' + total + ' earned · ' + pct + '% · ' + (total - n) + ' to go';
}

function renderUpNext() {
  const rest = trophies.filter(function (t) { return !earned.has(t.name); });
  rest.sort(function (a, b) {
    if (a.missable !== b.missable) return a.missable ? -1 : 1;
    if (a.stage !== b.stage) return a.stage - b.stage;
    return a.id - b.id;
  });
  const top = rest.slice(0, 5);
  upNextList.replaceChildren();
  if (top.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'Every trophy is ticked. Vice Got a Price! is yours.';
    upNextList.append(li);
    return;
  }
  top.forEach(function (t) {
    const li = document.createElement('li');
    const strong = document.createElement('strong');
    strong.textContent = t.missable ? 'MISSABLE — ' + t.name : t.name;
    if (t.missable) strong.className = 'tag-miss';
    li.append(strong);
    li.append(document.createTextNode(' — ' + t.description + ' (' + gradeLabel(t.grade) + ')'));
    upNextList.append(li);
  });
}

function renderCategories() {
  const cats = ['story', 'side', 'collectibles', 'activities', 'crime', 'hidden', 'completion'];
  categoryProgress.replaceChildren();
  cats.forEach(function (c) {
    const group = trophies.filter(function (t) { return t.category === c; });
    if (group.length === 0) return;
    const done = group.filter(function (t) { return earned.has(t.name); }).length;
    const card = document.createElement('div');
    card.className = 'cat-card';
    const name = document.createElement('strong');
    name.textContent = c;
    const bar = document.createElement('div');
    bar.className = 'bar';
    const fill = document.createElement('i');
    fill.style.width = Math.round((done / group.length) * 100) + '%';
    bar.append(fill);
    const count = document.createElement('span');
    count.textContent = done + ' of ' + group.length;
    card.append(name, bar, count);
    categoryProgress.append(card);
  });
}

function renderList() {
  const visible = trophies.filter(matchesFilter);
  listEl.replaceChildren();
  filterCount.textContent = visible.length + ' of ' + trophies.length + ' trophies shown';
  if (visible.length === 0) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = 'No trophies match this filter. Try clearing the search or picking another filter.';
    listEl.append(li);
    return;
  }
  visible.forEach(function (t) {
    const li = document.createElement('li');
    li.className = 'trophy' + (earned.has(t.name) ? ' earned' : '') + (isHidden(t) ? ' spoiler-hidden' : '');
    li.id = 'trophy-' + t.id;
    const head = document.createElement('div');
    head.className = 'trophy-head';
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.name);
    box.setAttribute('aria-label', 'Mark ' + t.name + ' as earned');
    box.addEventListener('change', function () {
      if (box.checked) earned.add(t.name); else earned.delete(t.name);
      saveProgress();
      renderAll();
    });
    const title = document.createElement('div');
    title.className = 'trophy-title';
    const h = document.createElement('h3');
    h.textContent = isHidden(t) ? 'Hidden trophy' : t.name;
    const desc = document.createElement('p');
    desc.className = 'desc';
    desc.textContent = isHidden(t) ? 'Hidden until earned — turn spoilers on to reveal it.' : t.description;
    title.append(h, desc);
    const grade = document.createElement('span');
    grade.className = 'grade ' + t.grade;
    grade.textContent = t.grade;
    head.append(box, title, grade);
    li.append(head);
    const flags = document.createElement('div');
    flags.className = 'flags';
    const cat = document.createElement('span');
    cat.className = 'flag';
    cat.textContent = t.category;
    flags.append(cat);
    if (t.missable) {
      const f = document.createElement('span');
      f.className = 'flag miss';
      f.textContent = 'MISSABLE — do in Chapter 1';
      flags.append(f);
    }
    if (t.spoiler && !earned.has(t.name)) {
      const f = document.createElement('span');
      f.className = 'flag hidden-flag';
      f.textContent = 'Hidden on PlayStation';
      flags.append(f);
    }
    if (t.unconfirmed) {
      const f = document.createElement('span');
      f.className = 'flag unconf';
      f.textContent = 'UNCONFIRMED — reported method, not verified';
      flags.append(f);
    }
    li.append(flags);
    if (isHidden(t)) {
      const note = document.createElement('p');
      note.className = 'spoiler-note';
      note.textContent = 'Spoilers are hidden. Earn it, or use the spoiler button above, to see its guide.';
      li.append(note);
    } else {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'detail-btn';
      btn.textContent = openGuides.has(t.id) ? 'Hide guide' : 'Show guide';
      btn.addEventListener('click', function () {
        if (openGuides.has(t.id)) openGuides.delete(t.id); else openGuides.add(t.id);
        renderAll();
      });
      li.append(btn);
      if (openGuides.has(t.id)) {
        const boxEl = document.createElement('div');
        boxEl.className = 'guide-box';
        const p = document.createElement('p');
        p.textContent = t.guide;
        const src = document.createElement('p');
        src.className = 'sources';
        src.textContent = 'Sources: ' + t.sources.join(', ') + '. Guide written in our own words; names and descriptions are the official PlayStation list.';
        boxEl.append(p, src);
        li.append(boxEl);
      }
    }
    listEl.append(li);
  });
}

function renderSpoilerButton() {
  const n = hiddenCount();
  spoilerToggle.textContent = spoilersShown ? 'Hide ' + n + ' hidden trophies' : 'Show ' + n + ' hidden trophies';
}

function renderAll() {
  renderProgress();
  renderUpNext();
  renderCategories();
  renderList();
  renderSpoilerButton();
}

spoilerToggle.addEventListener('click', function () {
  spoilersShown = !spoilersShown;
  localStorage.setItem(SPOILER_KEY, spoilersShown ? 'shown' : 'hidden');
  renderAll();
});

document.querySelectorAll('.filter-btn').forEach(function (btn) {
  btn.addEventListener('click', function () {
    activeFilter = btn.dataset.filter;
    document.querySelectorAll('.filter-btn').forEach(function (b) {
      b.classList.toggle('active', b === btn);
    });
    renderAll();
  });
});
searchInput.addEventListener('input', renderAll);
gradeFilter.addEventListener('change', renderAll);

document.getElementById('exportBtn').addEventListener('click', function () {
  const blob = new Blob([JSON.stringify({ app: 'leonida-trophy-atlas', earned: Array.from(earned) }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'leonida-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});

document.getElementById('importFile').addEventListener('change', async function (e) {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const names = Array.isArray(data) ? data : data.earned;
    const known = new Set(trophies.map(function (t) { return t.name; }));
    earned = new Set(names.filter(function (n) { return known.has(n); }));
    saveProgress();
    renderAll();
  } catch (err) {
    filterCount.textContent = 'That file could not be imported. Pick a progress file exported from this tracker.';
  }
});

document.getElementById('resetBtn').addEventListener('click', function () {
  earned = new Set();
  saveProgress();
  renderAll();
});

renderAll();

if (shotMode === 'guides') { openGuides.add(50); spoilersShown = true; }
if (shotMode === 'detail') openGuides.add(28);
if (openGuides.size > 0) renderAll();

requestAnimationFrame(function () {
  if (shotMode === 'roadmap') {
    document.getElementById('roadmap').scrollIntoView();
  } else if (shotMode === 'guides') {
    document.getElementById('trophy-50').scrollIntoView({ block: 'center' });
  } else if (shotMode === 'detail') {
    document.getElementById('trophy-28').scrollIntoView({ block: 'center' });
  }
  window.__shotReady = true;
});
