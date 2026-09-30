const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_PATH = path.join(__dirname, 'robots.json');

function loadRobots() {
  return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
}

// Specs where a HIGHER number is generally "better" for the highlight logic on the frontend.
// heightCm/weightKg/priceUsd are intentionally excluded — bigger isn't better there.
const HIGHER_IS_BETTER = ['payloadKg', 'topSpeedKmh', 'batteryLifeHrs', 'degreesOfFreedom'];

app.get('/api/robots', (req, res) => {
  try {
    let robots = loadRobots();
    const q = (req.query.q || '').toLowerCase().trim();
    const category = req.query.category || '';
    const manufacturer = req.query.manufacturer || '';
    const sort = req.query.sort || 'name';

    robots = robots.filter(r =>
      (!category || r.category === category) &&
      (!manufacturer || r.manufacturer === manufacturer) &&
      (!q || (r.name + ' ' + r.manufacturer + ' ' + r.description).toLowerCase().includes(q))
    );

    const sorters = {
      name: (a, b) => a.name.localeCompare(b.name),
      heightCm: (a, b) => b.heightCm - a.heightCm,
      weightKg: (a, b) => b.weightKg - a.weightKg,
      topSpeedKmh: (a, b) => b.topSpeedKmh - a.topSpeedKmh,
      releaseYear: (a, b) => b.releaseYear - a.releaseYear
    };
    robots.sort(sorters[sort] || sorters.name);

    const all = loadRobots();
    res.json({
      robots,
      categories: [...new Set(all.map(r => r.category))].sort(),
      manufacturers: [...new Set(all.map(r => r.manufacturer))].sort(),
      higherIsBetter: HIGHER_IS_BETTER
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load robot data.' });
  }
});

app.get('/api/robots/compare', (req, res) => {
  try {
    const ids = (req.query.ids || '').split(',').map(s => s.trim()).filter(Boolean);
    if (!ids.length) return res.status(400).json({ error: 'Provide at least one robot id, e.g. ?ids=spot,optimus' });

    const all = loadRobots();
    const byId = new Map(all.map(r => [r.id, r]));
    const missing = ids.filter(id => !byId.has(id));
    if (missing.length) return res.status(404).json({ error: `Unknown robot id(s): ${missing.join(', ')}` });

    res.json({ robots: ids.map(id => byId.get(id)), higherIsBetter: HIGHER_IS_BETTER });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not build comparison.' });
  }
});

const PUBLIC_DIR = path.join(__dirname);
app.use(express.static(PUBLIC_DIR));

app.get('/', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.listen(PORT, () => console.log(`Robot spec comparison tool running on http://localhost:${PORT}`));
