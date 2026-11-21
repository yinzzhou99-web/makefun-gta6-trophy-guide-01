// Leonida Legend — tracker logic.
// State lives in localStorage; the trophy data is data/trophies.json, fetched
// once from this app's own folder. Nothing here reaches the network beyond
// that one same-folder file, so the guide works fully offline once loaded.

const STORAGE_KEY = 'leonida-legend-progress-v1';
const GRADE_ORDER = { platinum: 0, gold: 1, silver: 2, bronze: 3 };

const ROADMAP_STAGES = [
  {
    name: 'Stage 1 — Story first',
    note: 'Play the campaign straight through: chapters 1–4, the named story missions and the finale. Six trophies on this road can be missed (they are flagged in the list), so keep a manual save before The Cartel Heist, VCIA Takedown and the final mission.',
  },
  {
    name: 'Stage 2 — Friends, strangers & freaks',
    note: 'Clear every character strand the story unlocked: Andy, Kenton, Billy, Randy and Tyrone, plus eight Strangers & Freaks strands and Bret’s unique hunt.',
  },
  {
    name: 'Stage 3 — The Leonida grind',
    note: 'The 100% completion push: 250 stunts, gold in all 42 Shooting Range challenges, drone races, races, meditation spots, card sets, WAiNK spots, vehicle discoveries and full map exploration.',
  },
  {
    name: 'Stage 4 — Money, mayhem & moments',
    note: 'Free-roam clean-up: bank vaults, the armored truck, gang operations, partner crime trophies, the laundering and spending totals, garages, and the one-off Leonida moments.',
  },
  {
    name: 'Stage 5 — The platinum',
    note: 'With the other 54 in hand, Vice Got a Price! unlocks and the Leonida Legend is yours.',
  },
];

let trophies = [];
let earned = new Set();
let activeKind = 'all';
let selectedId = null;

const els = {};

function cacheElements() {
  for (const id of ['progress-count', 'progress-fill', 'progress-detail', 'grade-counts', 'progress-ring',
    'search-box', 'kind-filters', 'spoiler-toggle', 'earned-toggle', 'export-btn', 'import-btn',
    'import-file', 'reset-btn', 'roadmap-list', 'list-status', 'trophy-list', 'detail-empty',
    'detail-card', 'detail-grade', 'detail-name', 'detail-desc', 'detail-flags', 'detail-guide',
    'detail-stage', 'detail-sources', 'detail-toggle-earned']) {
    els[id] = document.getElementById(id);
  }
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) earned = new Set(JSON.parse(raw).earned ?? []);
  } catch {
    earned = new Set();
  }
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ earned: [...earned], savedAt: new Date().toISOString() }));
}

function seedDemoProgress(ids) {
  earned = new Set(ids);
  saveProgress();
}

function isSpoilerHidden(trophy) {
  return els['spoiler-toggle'].checked && trophy.kind === 'story' && !earned.has(trophy.id);
}

function visibleTrophies() {
  const query = els['search-box'].value.trim().toLowerCase();
  return trophies.filter((trophy) => {
    if (activeKind === 'missable' && !trophy.missable) return false;
    if (activeKind !== 'all' && activeKind !== 'missable' && trophy.kind !== activeKind) return false;
    if (els['earned-toggle'].checked && !earned.has(trophy.id)) return false;
    if (query) {
      const haystack = `${trophy.name} ${trophy.description} ${trophy.guide}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

function renderProgress() {
  const total = trophies.length;
  const done = earned.size;
  const pct = total ? Math.round((done / total) * 100) : 0;
  els['progress-count'].textContent = `${done}/${total}`;
  els['progress-fill'].style.width = `${pct}%`;
  els['progress-ring'].style.setProperty('--pct', `${pct}%`);
  els['progress-detail'].textContent = done === 0
    ? '0 earned · platinum hunt not started'
    : `${done} earned · ${total - done} to go · ${pct}% of the list`;
  const byGrade = {};
  for (const trophy of trophies) {
    byGrade[trophy.grade] ??= { have: 0, all: 0 };
    byGrade[trophy.grade].all += 1;
    if (earned.has(trophy.id)) byGrade[trophy.grade].have += 1;
  }
  els['grade-counts'].textContent = Object.keys(byGrade)
    .sort((a, b) => GRADE_ORDER[a] - GRADE_ORDER[b])
    .map((grade) => `${grade} ${byGrade[grade].have}/${byGrade[grade].all}`)
    .join(' · ');
}

function renderRoadmap() {
  els['roadmap-list'].innerHTML = '';
  for (const [index, stage] of ROADMAP_STAGES.entries()) {
    const inStage = trophies.filter((trophy) => trophy.stage === index + 1);
    const done = inStage.filter((trophy) => earned.has(trophy.id)).length;
    const li = document.createElement('li');
    const name = document.createElement('span');
    name.className = 'stage-name';
    name.textContent = stage.name;
    const progress = document.createElement('span');
    progress.className = 'stage-progress';
    progress.textContent = ` — ${done}/${inStage.length} earned`;
    const note = document.createElement('div');
    note.className = 'stage-note';
    note.textContent = stage.note;
    li.append(name, progress, note);
    els['roadmap-list'].append(li);
  }
}

function flagChip(text, className) {
  const span = document.createElement('span');
  span.className = `flag ${className}`;
  span.textContent = text;
  return span;
}

function renderList() {
  const shown = visibleTrophies();
  els['trophy-list'].innerHTML = '';
  els['list-status'].textContent = activeKind === 'online' && shown.length === 0
    ? 'The PlayStation 5 list has no online trophies — every one of the 55 is earned in the single-player game.'
    : `Showing ${shown.length} of ${trophies.length} trophies.`;
  for (const trophy of shown) {
    const li = document.createElement('li');
    li.className = 'trophy-card' + (earned.has(trophy.id) ? ' earned' : '') + (trophy.id === selectedId ? ' selected' : '');

    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(trophy.id);
    box.setAttribute('aria-label', `Mark ${trophy.name} as earned`);
    box.addEventListener('change', () => toggleEarned(trophy.id));

    const grade = document.createElement('span');
    grade.className = `grade grade-${trophy.grade}`;
    grade.textContent = trophy.grade;

    const main = document.createElement('div');
    main.className = 'trophy-main';
    const title = document.createElement('h3');
    const desc = document.createElement('p');
    if (isSpoilerHidden(trophy)) {
      title.textContent = 'Hidden story trophy';
      desc.innerHTML = '<span class="spoiler-note">Name and description hidden by the spoiler setting until earned.</span>';
    } else {
      title.textContent = trophy.name;
      desc.textContent = trophy.description;
    }
    main.append(title, desc);

    const flags = document.createElement('div');
    flags.className = 'flags';
    if (trophy.missable) flags.append(flagChip('Missable', 'flag-missable'));
    flags.append(flagChip(trophy.kind, 'flag-kind'));
    if (trophy.target) flags.append(flagChip(`Target ${trophy.target}`, 'flag-target'));

    li.append(box, grade, main, flags);
    li.addEventListener('click', (event) => {
      if (event.target !== box) openGuide(trophy.id);
    });
    els['trophy-list'].append(li);
  }
}

function openGuide(id) {
  selectedId = id;
  const trophy = trophies.find((entry) => entry.id === id);
  if (!trophy) return;
  els['detail-empty'].hidden = true;
  els['detail-card'].hidden = false;
  els['detail-grade'].className = `grade grade-${trophy.grade}`;
  els['detail-grade'].textContent = trophy.grade;
  if (isSpoilerHidden(trophy)) {
    els['detail-name'].textContent = 'Hidden story trophy';
    els['detail-desc'].textContent = 'Turn off “Hide story spoilers” or earn this trophy to reveal it.';
    els['detail-guide'].textContent = 'This is a story trophy. Play on — it unlocks as the campaign reaches it, and its guide is waiting here once spoilers are off.';
  } else {
    els['detail-name'].textContent = trophy.name;
    els['detail-desc'].textContent = `“${trophy.description}”`;
    els['detail-guide'].textContent = trophy.guide;
  }
  els['detail-flags'].innerHTML = '';
  if (trophy.missable) els['detail-flags'].append(flagChip('Missable — see guide', 'flag-missable'));
  els['detail-flags'].append(flagChip(`Kind: ${trophy.kind}`, 'flag-kind'));
  if (trophy.hidden) els['detail-flags'].append(flagChip('Hidden on PlayStation', 'flag-kind'));
  if (trophy.target) els['detail-flags'].append(flagChip(`Count target: ${trophy.target}`, 'flag-target'));
  els['detail-stage'].textContent = ROADMAP_STAGES[trophy.stage - 1].name;
  els['detail-sources'].textContent = trophy.sources;
  els['detail-toggle-earned'].textContent = earned.has(trophy.id) ? 'Mark as not earned' : 'Mark as earned';
  renderList();
}

function toggleEarned(id) {
  if (earned.has(id)) earned.delete(id); else earned.add(id);
  saveProgress();
  renderProgress();
  renderRoadmap();
  renderList();
  if (selectedId === id) openGuide(id);
}

function exportProgress() {
  const payload = JSON.stringify({ app: 'leonida-legend', version: 1, earned: [...earned] }, null, 2);
  const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'leonida-legend-progress.json';
  link.click();
  URL.revokeObjectURL(url);
}

function importProgress(file) {
  file.text().then((text) => {
    const parsed = JSON.parse(text);
    earned = new Set((parsed.earned ?? []).filter((id) => trophies.some((trophy) => trophy.id === id)));
    saveProgress();
    renderProgress();
    renderRoadmap();
    renderList();
  }).catch(() => {
    els['list-status'].textContent = 'That file could not be read as a progress export.';
  });
}

function wireControls() {
  els['kind-filters'].addEventListener('click', (event) => {
    const button = event.target.closest('button[data-kind]');
    if (!button) return;
    activeKind = button.dataset.kind;
    for (const chip of els['kind-filters'].querySelectorAll('.chip')) {
      chip.classList.toggle('active', chip === button);
    }
    renderList();
  });
  els['search-box'].addEventListener('input', renderList);
  els['spoiler-toggle'].addEventListener('change', () => { renderList(); if (selectedId) openGuide(selectedId); });
  els['earned-toggle'].addEventListener('change', renderList);
  els['export-btn'].addEventListener('click', exportProgress);
  els['import-btn'].addEventListener('click', () => els['import-file'].click());
  els['import-file'].addEventListener('change', () => {
    if (els['import-file'].files[0]) importProgress(els['import-file'].files[0]);
  });
  els['reset-btn'].addEventListener('click', () => {
    earned = new Set();
    saveProgress();
    renderProgress();
    renderRoadmap();
    renderList();
  });
  els['detail-toggle-earned'].addEventListener('click', () => { if (selectedId) toggleEarned(selectedId); });
}

// Shareable views: ?filter=missable, ?spoiler=1, ?open=17, ?demo=1 seeds a
// sample hunt so the screenshots (and curious friends) see a tracker mid-run.
function applyQueryParams() {
  const params = new URLSearchParams(location.search);
  if (params.get('demo') === '1') {
    seedDemoProgress([2, 3, 4, 8, 9, 16, 21, 28, 36, 44]);
    renderProgress();
    renderRoadmap();
    renderList();
  }
  const kind = params.get('filter');
  if (kind) {
    const button = els['kind-filters'].querySelector(`button[data-kind="${kind}"]`);
    if (button) button.click();
  }
  if (params.get('spoiler') === '1') els['spoiler-toggle'].checked = true;
  const open = Number(params.get('open'));
  if (open) openGuide(open);
}

async function loadTrophyData() {
  const response = await fetch('data/trophies.json');
  const data = await response.json();
  trophies = data.trophies;
}

async function startTracker() {
  cacheElements();
  loadProgress();
  wireControls();
  await loadTrophyData();
  renderProgress();
  renderRoadmap();
  renderList();
  applyQueryParams();
}

startTracker();
