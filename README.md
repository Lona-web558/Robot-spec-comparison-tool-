# Robot Spec Comparison Tool

Compare real-world robots side by side — height, weight, payload, speed, battery life, degrees of freedom and price.

**Stack:** HTML5, CSS3, Bootstrap 5, JavaScript, Node.js, Express.js

## Features

- Card grid of 12 robots (Spot, Atlas, Optimus, Go2, H1, Digit, Figure 02, ANYmal D, TALOS, Apollo, Walker S, Stretch)
- Select up to 4 robots and compare them in a side-by-side table
- Best value in each numeric spec (payload, speed, battery life, degrees of freedom) is highlighted
- Filter by category and manufacturer, search by name or description
- Data served from a local JSON file, so it works with no external API and no rate limits

## Data accuracy

Specs are drawn from public manufacturer pages and press materials and are marked "Not disclosed" where a manufacturer hasn't published a figure. Some specs (especially unreleased or research robots) change as manufacturers update their machines. Double-check anything you plan to publish or rely on against the manufacturer's own site — the `url` field in `data/robots.json` links to each one.

## Project structure

```
robot-spec-compare/
├── server.js          Express server: filter, sort, and compare endpoints
├── package.json
├── data/
│   └── robots.json    Robot specs dataset — edit this to add or update robots
└── public/
    ├── index.html     Page markup
    ├── style.css      Styles
    └── app.js         Frontend logic
```

## Run locally

Requires Node.js 18 or newer.

```bash
npm install
npm start
```

Open http://localhost:3000

## API

`GET /api/robots` — list and filter

| Query parameter | Description |
|---|---|
| `q` | Search text, matched against name, manufacturer and description |
| `category` | Exact category, e.g. `Humanoid`, `Quadruped`, `Mobile manipulator` |
| `manufacturer` | Exact manufacturer name |
| `sort` | `name` (default), `heightCm`, `weightKg`, `topSpeedKmh`, or `releaseYear` |

`GET /api/robots/compare?ids=spot,optimus,go2` — returns full specs for the given robot ids (2–4 recommended)

## Add or edit robots

Edit `data/robots.json`. Each entry needs:

```json
{
  "id": "unique-slug",
  "name": "Display Name",
  "manufacturer": "Company",
  "category": "Humanoid",
  "releaseYear": 2024,
  "heightCm": 170,
  "weightKg": 60,
  "payloadKg": 10,
  "topSpeedKmh": 5,
  "batteryLifeHrs": 4,
  "degreesOfFreedom": 28,
  "priceUsd": null,
  "description": "One sentence about the robot.",
  "url": "https://manufacturer.com/robot"
}
```

Use `null` for any spec the manufacturer hasn't disclosed — the frontend shows "Not disclosed" for it.

## Deploy to Render

1. Push the project to a GitHub repository.
2. Create a new **Web Service** on Render and connect the repository.
3. Set these options:
   - **Root directory:** the folder containing `server.js` and `package.json`
   - **Build command:** `npm install`
   - **Start command:** `npm start`
4. Deploy. Render sets the `PORT` variable automatically.

## Troubleshooting

- **Blank page or "Cannot GET /":** check that `index.html`, `style.css` and `app.js` are inside a `public/` folder next to `server.js`.
- **Robot list is empty:** check `data/robots.json` is valid JSON — a trailing comma will break the whole file.

## Ideas for next steps

- Radar chart visualizing the compared specs (Chart.js)
- Shareable comparison links (encode selected ids in the URL)
- CSV export of the comparison table
