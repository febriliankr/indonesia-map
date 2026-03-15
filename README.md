# indonesia-map

Interactive Indonesia SVG map with 34 provinces. Hover to see province names.

![preview](assets/preview.gif)

## install

```bash
npm install indonesia-map
```

## react

```tsx
import { IndonesiaMap } from "indonesia-map";

function App() {
  return (
    <IndonesiaMap
      onProvinceClick={(id, name) => console.log(id, name)}
    />
  );
}
```

That's it. The SVG is embedded in the package — no need to copy files or configure anything.

### props

| prop | type | default | description |
|---|---|---|---|
| `svgUrl` | `string` | embedded | override with a custom SVG url |
| `onProvinceClick` | `(id, name) => void` | - | click handler |
| `showLegend` | `boolean` | `true` | show province legend |
| `colors` | `Record<string, string>` | - | custom fills per province id |
| `className` | `string` | - | wrapper class |

### custom colors

```tsx
<IndonesiaMap colors={{ IDJK: "#ff4444", IDJB: "#44aaff" }} />
```

## vanilla js

You can also use the SVG directly without React — see the [demo](index.html) or the [react guide](docs/react.md).

## data

SVG from [simplemaps.com/gis/country/id](https://simplemaps.com/gis/country/id) (free for commercial use with attribution).

## license

MIT
