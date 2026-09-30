const grid = document.getElementById('grid');
const statusEl = document.getElementById('status');
const searchEl = document.getElementById('search');
const categoryEl = document.getElementById('category');
const manufacturerEl = document.getElementById('manufacturer');
const compareSection = document.getElementById('compareSection');
const compareHead = document.getElementById('compareHead');
const compareBody = document.getElementById('compareBody');
const compareCount = document.getElementById('compareCount');
const clearCompareBtn = document.getElementById('clearCompare');

const MAX_COMPARE = 4;
let robots = [];
let higherIsBetter = [];
let selected = [];
let debounce;

function el(tag, props = {}, ...kids) {
  const node = document.createElement(tag);
  Object.assign(node, props);
  kids.forEach(k => node.append(k));
  return node;
}

function fmt(value, unit = '') {
  if (value === null || value === undefined) return 'Not disclosed';
  return typeof value === 'number' ? value.toLocaleString() + unit : value;
}

function populateSelect(sel, values) {
  const current = sel.value;
  const placeholder = sel.firstElementChild;
  sel.replaceChildren(placeholder);
  values.forEach(v => sel.append(el('option', { value: v, textContent: v })));
  sel.value = current;
}

function card(r) {
  const isSelected = selected.includes(r.id);
  const atLimit = selected.length >= MAX_COMPARE && !isSelected;
  const col = el('div', { className: 'col' });
  const c = el('div', { className: 'robot-card' + (isSelected ? ' selected' : '') + (atLimit ? ' disabled' : '') });

  c.append(
    el('span', { className: 'cat', textContent: r.category }),
    el('h3', { textContent: r.name }),
    el('div', { className: 'maker', textContent: r.manufacturer + ' · ' + r.releaseYear }),
    el('p', { className: 'desc', textContent: r.description }),
    el('div', { className: 'pick' },
      el('input', {
        type: 'checkbox',
        checked: isSelected,
        disabled: atLimit,
        onclick: e => e.stopPropagation(),
        onchange: () => toggle(r.id)
      }),
      document.createTextNode(isSelected ? 'Selected' : atLimit ? `Max ${MAX_COMPARE} at a time` : 'Add to compare')
    )
  );

  if (!atLimit) c.onclick = () => toggle(r.id);
  col.append(c);
  return col;
}

function toggle(id) {
  if (selected.includes(id)) selected = selected.filter(x => x !== id);
  else if (selected.length < MAX_COMPARE) selected = [...selected, id];
  renderGrid();
  renderCompare();
}

function renderGrid() {
  grid.replaceChildren(...robots.map(card));
}

const SPEC_ROWS = [
  { key: 'manufacturer', label: 'Manufacturer' },
  { key: 'category', label: 'Category' },
  { key: 'releaseYear', label: 'Release year' },
  { key: 'heightCm', label: 'Height', unit: ' cm' },
  { key: 'weightKg', label: 'Weight', unit: ' kg' },
  { key: 'payloadKg', label: 'Payload', unit: ' kg' },
  { key: 'topSpeedKmh', label: 'Top speed', unit: ' km/h' },
  { key: 'batteryLifeHrs', label: 'Battery life', unit: ' hrs' },
  { key: 'degreesOfFreedom', label: 'Degrees of freedom' },
  { key: 'priceUsd', label: 'Price', unit: ' USD' }
];

async function renderCompare() {
  compareCount.textContent = selected.length;
  if (!selected.length) {
    compareSection.classList.add('d-none');
    return;
  }
  compareSection.classList.remove('d-none');

  let items;
  try {
    const res = await fetch('/api/robots/compare?ids=' + selected.join(','));
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not build comparison.');
    items = data.robots;
  } catch (err) {
    compareBody.replaceChildren(el('tr', {}, el('td', { textContent: err.message, className: 'text-danger' })));
    return;
  }

  compareHead.replaceChildren(
    el('th', { textContent: 'Spec' }),
    ...items.map(r => el('th', {}, el('a', { href: r.url, target: '_blank', rel: 'noopener noreferrer', textContent: r.name })))
  );

  compareBody.replaceChildren(...SPEC_ROWS.map(spec => {
    const values = items.map(r => r[spec.key]);
    let bestValue = null;
    if (higherIsBetter.includes(spec.key)) {
      const numeric = values.filter(v => typeof v === 'number');
      if (numeric.length > 1) bestValue = Math.max(...numeric);
    }
    const tr = el('tr', {}, el('th', { scope: 'row', textContent: spec.label }));
    values.forEach(v => {
      const isBest = bestValue !== null && v === bestValue;
      tr.append(el('td', { textContent: fmt(v, spec.unit), className: isBest ? 'best' : '' }));
    });
    return tr;
  }));
}

function updateStatus() {
  if (!robots.length) {
    statusEl.textContent = 'No robots match. Try a different search or filter.';
  } else {
    statusEl.textContent = `${robots.length} robot${robots.length === 1 ? '' : 's'} shown. Select up to ${MAX_COMPARE} to compare.`;
  }
}

async function load() {
  statusEl.className = 'status';
  statusEl.textContent = 'Loading robots...';
  const params = new URLSearchParams({ q: searchEl.value, category: categoryEl.value, manufacturer: manufacturerEl.value });
  try {
    const res = await fetch('/api/robots?' + params);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    robots = data.robots;
    higherIsBetter = data.higherIsBetter;
    populateSelect(categoryEl, data.categories);
    populateSelect(manufacturerEl, data.manufacturers);
    renderGrid();
    updateStatus();
  } catch (err) {
    statusEl.className = 'status error';
    statusEl.textContent = err.message + ' Check your connection and reload.';
  }
}

searchEl.addEventListener('input', () => {
  clearTimeout(debounce);
  debounce = setTimeout(load, 300);
});
categoryEl.addEventListener('change', load);
manufacturerEl.addEventListener('change', load);
clearCompareBtn.addEventListener('click', () => { selected = []; renderGrid(); renderCompare(); });

load();
