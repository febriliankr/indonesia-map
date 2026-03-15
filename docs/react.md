# Interactive Indonesia Map — React Implementation Guide

This guide walks you through building the interactive Indonesia province map in a React app using the SimpleMaps SVG data (`assets/id.svg`).

---

## Prerequisites

- React 18+ project (Vite, Next.js, or CRA)
- The `id.svg` file from [simplemaps.com/gis/country/id](https://simplemaps.com/gis/country/id)

---

## Step 1: Project Setup

```bash
npm create vite@latest indonesia-map -- --template react-ts
cd indonesia-map
npm install
```

Place `id.svg` in your `public/` folder:

```
public/
  id.svg
src/
  components/
    IndonesiaMap.tsx
    IndonesiaMap.css
  App.tsx
```

---

## Step 2: The Map Component

Create `src/components/IndonesiaMap.tsx`:

```tsx
import { useEffect, useRef, useState } from "react";
import "./IndonesiaMap.css";

interface Province {
  id: string;
  name: string;
}

interface TooltipState {
  visible: boolean;
  name: string;
  id: string;
  x: number;
  y: number;
}

export default function IndonesiaMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    name: "",
    id: "",
    x: 0,
    y: 0,
  });
  const [activeId, setActiveId] = useState<string | null>(null);

  function highlightProvince(id: string | null) {
    const svg = svgRef.current;
    if (!svg) return;

    // Clear all
    svg
      .querySelectorAll("#features path.hovered")
      .forEach((p) => p.classList.remove("hovered"));
    setActiveId(null);

    // Highlight new
    if (id) {
      svg
        .querySelectorAll(`#features path[id="${id}"]`)
        .forEach((p) => p.classList.add("hovered"));
      setActiveId(id);
    }
  }

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    fetch("/id.svg")
      .then((r) => r.text())
      .then((svgText) => {
        container.innerHTML = svgText;

        const svg = container.querySelector("svg");
        if (!svg) return;
        svgRef.current = svg;

        // Clean up SVG attributes
        svg.removeAttribute("fill");
        svg.removeAttribute("stroke");
        svg.removeAttribute("stroke-width");
        svg.removeAttribute("stroke-linecap");
        svg.removeAttribute("stroke-linejoin");
        svg.removeAttribute("width");
        svg.removeAttribute("height");
        svg.setAttribute("viewBox", "0 0 1000 368");
        svg.classList.add("map-svg");

        // Remove non-feature groups
        svg.querySelector("#points")?.remove();
        svg.querySelector("#label_points")?.remove();

        // Collect unique provinces for the legend
        const provinceMap = new Map<string, string>();
        svg.querySelectorAll("#features path").forEach((path) => {
          const id = path.getAttribute("id");
          const name = path.getAttribute("name");
          if (id && name && !provinceMap.has(id)) {
            provinceMap.set(id, name);
          }
        });

        const sorted = [...provinceMap.entries()]
          .map(([id, name]) => ({ id, name }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setProvinces(sorted);

        // Attach map path event listeners
        svg.querySelectorAll("#features path").forEach((path) => {
          const name = path.getAttribute("name") || "";
          const id = path.getAttribute("id") || "";

          path.addEventListener("mouseenter", () => {
            setTooltip((prev) => ({ ...prev, visible: true, name, id }));
            highlightProvince(id);
          });

          path.addEventListener("mousemove", (e: Event) => {
            const me = e as MouseEvent;
            setTooltip((prev) => ({
              ...prev,
              x: me.clientX + 16,
              y: me.clientY - 10,
            }));
          });

          path.addEventListener("mouseleave", () => {
            setTooltip((prev) => ({ ...prev, visible: false }));
            highlightProvince(null);
          });
        });
      });

    return () => {
      if (container) container.innerHTML = "";
    };
  }, []);

  // Legend hover → highlight province on map + show tooltip near it
  function handleLegendEnter(id: string, name: string) {
    highlightProvince(id);
    setTooltip((prev) => ({ ...prev, visible: true, name, id }));

    const svg = svgRef.current;
    if (!svg) return;
    const paths = svg.querySelectorAll(`#features path[id="${id}"]`);
    if (paths.length) {
      const bbox = paths[0].getBoundingClientRect();
      setTooltip((prev) => ({
        ...prev,
        x: bbox.left + bbox.width / 2,
        y: bbox.top + bbox.height / 2 - 40,
      }));
    }
  }

  function handleLegendLeave() {
    highlightProvince(null);
    setTooltip((prev) => ({ ...prev, visible: false }));
  }

  const clampedX = Math.min(
    Math.max(tooltip.x, 8),
    window.innerWidth - 200
  );
  const clampedY = Math.max(tooltip.y, 8);

  return (
    <div className="indonesia-map">
      <div ref={containerRef} className="map-container" />

      <div className="legend">
        <div className="legend-title">Provinsi</div>
        {provinces.map((p) => (
          <div
            key={p.id}
            className={`legend-item ${activeId === p.id ? "active" : ""}`}
            onMouseEnter={() => handleLegendEnter(p.id, p.name)}
            onMouseLeave={handleLegendLeave}
          >
            <div className="legend-dot" />
            <div className="legend-label">{p.name}</div>
          </div>
        ))}
      </div>

      <div
        className={`map-tooltip ${tooltip.visible ? "visible" : ""}`}
        style={{ left: clampedX, top: clampedY }}
      >
        <div className="tooltip-name">{tooltip.name}</div>
        <div className="tooltip-id">{tooltip.id}</div>
      </div>
    </div>
  );
}
```

### Key concepts:

1. **Fetch + inline SVG** — We fetch the `.svg` as text and inject via `innerHTML`. This makes every `<path>` part of the DOM so CSS can style it. Using `<img>` or `<object>` would sandbox the SVG.

2. **Province highlighting** — Some provinces (e.g. Maluku) have multiple `<path>` elements sharing the same `id`. On hover, we query all matching paths and toggle a `.hovered` class.

3. **Legend ↔ Map sync** — Hovering a legend item highlights the province on the map and shows a tooltip over it. Hovering the map highlights the legend item. Both use the shared `highlightProvince()` function.

4. **Provinces collected from SVG** — The legend is dynamically built from the actual SVG paths, so it stays in sync with the data.

---

## Step 3: The Styles

Create `src/components/IndonesiaMap.css`:

```css
/* Use a monospace font — add to your index.html or import in CSS:
   @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap');
*/

.indonesia-map {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: 95vw;
  max-width: 1400px;
  margin: 0 auto;
  font-family: 'JetBrains Mono', monospace;
}

/* Map */
.map-container {
  width: 100%;
}

.map-svg {
  width: 100%;
  height: auto;
}

/* Province paths — light bg, dark monotone fills, orange hover */
#features path {
  fill: #d0d0d0;
  stroke: #fafafa;
  stroke-width: 0.5;
  stroke-linejoin: round;
  stroke-linecap: round;
  cursor: pointer;
  transition: fill 0.2s ease;
}

#features path:hover,
#features path.hovered {
  fill: #e85d3a;
}

/* Legend — horizontal wrap at bottom */
.legend {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  padding: 0;
  border-top: 1px solid #eee;
  padding-top: 12px;
}

.legend-title {
  width: 100%;
  font-size: 0.6rem;
  font-weight: 500;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 0 4px 6px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  cursor: pointer;
  border-radius: 3px;
  transition: background 0.15s ease;
}

.legend-item:hover,
.legend-item.active {
  background: #f0f0f0;
}

.legend-dot {
  width: 6px;
  height: 6px;
  border-radius: 1px;
  background: #d0d0d0;
  flex-shrink: 0;
  transition: background 0.2s ease;
}

.legend-item:hover .legend-dot,
.legend-item.active .legend-dot {
  background: #e85d3a;
}

.legend-label {
  font-size: 0.6rem;
  color: #888;
  white-space: nowrap;
  transition: color 0.15s ease;
}

.legend-item:hover .legend-label,
.legend-item.active .legend-label {
  color: #222;
}

/* Tooltip */
.map-tooltip {
  position: fixed;
  pointer-events: none;
  z-index: 100;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 6px 12px;
  opacity: 0;
  transform: translateY(4px);
  transition: opacity 0.15s ease, transform 0.15s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  font-family: 'JetBrains Mono', monospace;
}

.map-tooltip.visible {
  opacity: 1;
  transform: translateY(0);
}

.tooltip-name {
  font-size: 0.8rem;
  font-weight: 500;
  color: #222;
  white-space: nowrap;
}

.tooltip-id {
  font-size: 0.65rem;
  color: #aaa;
  margin-top: 1px;
}

@media (max-width: 768px) {
  .legend-label { font-size: 0.55rem; }
  .indonesia-map { width: 100vw; }
}
```

---

## Step 4: Use It in Your App

```tsx
// src/App.tsx
import IndonesiaMap from "./components/IndonesiaMap";

export default function App() {
  return (
    <div style={{ background: "#fafafa", minHeight: "100vh", padding: "2rem 0" }}>
      <h1
        style={{
          textAlign: "center",
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 500,
          fontSize: "1rem",
          color: "#333",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: "1rem",
        }}
      >
        Republik Indonesia
        <span style={{ display: "block", fontWeight: 400, fontSize: "0.7em", color: "#999", marginTop: 4 }}>
          34 Provinsi
        </span>
      </h1>
      <IndonesiaMap />
    </div>
  );
}
```

---

## How It Works — Architecture

```
┌──────────────────────────────────────────────────┐
│  IndonesiaMap                                    │
│                                                  │
│  useEffect (on mount):                           │
│    1. fetch("/id.svg") → text                    │
│    2. Inject into containerRef div               │
│    3. Strip fill/stroke/width/height attrs       │
│    4. Remove #points, #label_points groups       │
│    5. Collect unique provinces → setProvinces()  │
│    6. Attach mouseenter/move/leave to paths      │
│                                                  │
│  State:                                          │
│    tooltip: { visible, name, id, x, y }          │
│    provinces: [{ id, name }]                     │
│    activeId: string | null                       │
│                                                  │
│  ┌──────────────────────────────────────┐        │
│  │ .map-container  (inlined SVG)        │        │
│  │   hover path → highlight + tooltip   │        │
│  └──────────────────────────────────────┘        │
│  ┌──────────────────────────────────────┐        │
│  │ .legend  (bottom, flex-wrap)         │        │
│  │   hover item → highlight on map      │        │
│  │   + tooltip positioned over province │        │
│  └──────────────────────────────────────┘        │
│  ┌────────────────┐                              │
│  │ .map-tooltip    │  (position: fixed)          │
│  └────────────────┘                              │
└──────────────────────────────────────────────────┘
```

---

## SVG Structure (from SimpleMaps)

```xml
<svg viewBox="0 0 1000 368">
  <g id="features">
    <path id="IDAC" name="Aceh" d="M..."/>
    <path id="IDSU" name="Sumatera Utara" d="M..."/>
    <!-- ...34 provinces total -->
  </g>
  <g id="points">...</g>        <!-- we remove these -->
  <g id="label_points">...</g>  <!-- we remove these -->
</svg>
```

Each province path has:
- `id` — ISO 3166-2:ID code (e.g. `IDAC`, `IDJK`, `IDPA`)
- `name` — Province name in English
- `d` — SVG path data (the geographic shape)

---

## Extending the Component

### Add onClick callback

```tsx
interface IndonesiaMapProps {
  onProvinceClick?: (provinceId: string, provinceName: string) => void;
}

// Inside useEffect, after existing event listeners:
path.addEventListener("click", () => {
  onProvinceClick?.(id, name);
});
```

### Color provinces by data (e.g. population heatmap)

```tsx
interface IndonesiaMapProps {
  data?: Record<string, number>;  // { "IDAC": 5000, "IDJK": 10000 }
  colorScale?: (value: number) => string;
}

// After injecting SVG, apply colors:
if (data) {
  paths.forEach((path) => {
    const id = path.getAttribute("id") || "";
    const value = data[id];
    if (value !== undefined && colorScale) {
      (path as SVGPathElement).style.fill = colorScale(value);
    }
  });
}
```

### Add selected state

```tsx
const [selected, setSelected] = useState<string | null>(null);

path.addEventListener("click", () => {
  svg.querySelectorAll("#features path.selected")
    .forEach((p) => p.classList.remove("selected"));
  svg.querySelectorAll(`#features path[id="${id}"]`)
    .forEach((p) => p.classList.add("selected"));
  setSelected(id);
});
```

```css
#features path.selected {
  fill: #c45a2d;
  stroke: #fff;
  stroke-width: 1;
}
```

---

## Design Specifications

| Element        | Property     | Value                              |
|----------------|--------------|------------------------------------|
| Font           | Family       | `JetBrains Mono`, monospace        |
| Background     | Color        | `#fafafa`                          |
| Province fill  | Default      | `#d0d0d0`                          |
| Province fill  | Hover        | `#e85d3a` (orange)                 |
| Province stroke| Color        | `#fafafa` (matches background)     |
| Tooltip bg     | Color        | `#fff`                             |
| Tooltip border | Color        | `#e0e0e0`                          |
| Legend dot     | Default      | `#d0d0d0`                          |
| Legend dot     | Hover        | `#e85d3a`                          |
| Legend text    | Default      | `#888`                             |
| Legend text    | Hover        | `#222`                             |
| Title          | Color        | `#333`                             |
| Subtitle       | Color        | `#999`                             |

---

## Province ID Reference

| ID     | Province              | ID     | Province              |
|--------|-----------------------|--------|-----------------------|
| IDAC   | Aceh                  | IDLA   | Lampung               |
| IDSU   | Sumatera Utara        | IDBT   | Banten                |
| IDSB   | Sumatera Barat        | IDJK   | Jakarta Raya          |
| IDRI   | Riau                  | IDJB   | Jawa Barat            |
| IDKR   | Kepulauan Riau        | IDJT   | Jawa Tengah           |
| IDJA   | Jambi                 | IDYO   | Yogyakarta            |
| IDBE   | Bengkulu              | IDJI   | Jawa Timur            |
| IDSS   | Sumatera Selatan      | IDBA   | Bali                  |
| IDBB   | Bangka-Belitung       | IDNB   | Nusa Tenggara Barat   |
| IDKB   | Kalimantan Barat      | IDNT   | Nusa Tenggara Timur   |
| IDKT   | Kalimantan Tengah     | IDSN   | Sulawesi Selatan      |
| IDKS   | Kalimantan Selatan    | IDSR   | Sulawesi Barat        |
| IDKI   | Kalimantan Timur      | IDST   | Sulawesi Tengah       |
| IDKU   | Kalimantan Utara      | IDSG   | Sulawesi Tenggara     |
| IDSA   | Sulawesi Utara        | IDGO   | Gorontalo             |
| IDMA   | Maluku                | IDPA   | Papua                 |
| IDMU   | Maluku Utara          | IDPB   | Papua Barat           |
