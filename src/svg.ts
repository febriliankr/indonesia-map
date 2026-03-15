import { SVG_CONTENT } from "./svg-data";

const SVG_ATTRS_TO_REMOVE = [
  "fill",
  "stroke",
  "stroke-width",
  "stroke-linecap",
  "stroke-linejoin",
  "width",
  "height",
];

const GROUPS_TO_REMOVE = ["#points", "#label_points"];

export interface Province {
  id: string;
  name: string;
}

function parseSvg(
  container: HTMLElement,
  svgText: string
): { svg: SVGSVGElement; provinces: Province[] } {
  container.innerHTML = svgText;
  const svg = container.querySelector("svg");
  if (!svg) throw new Error("Failed to parse SVG");

  SVG_ATTRS_TO_REMOVE.forEach((attr) => svg.removeAttribute(attr));
  svg.setAttribute("viewBox", "0 0 1000 368");

  GROUPS_TO_REMOVE.forEach((sel) => svg.querySelector(sel)?.remove());

  const provinceMap = new Map<string, string>();
  svg.querySelectorAll("#features path").forEach((path) => {
    const id = path.getAttribute("id");
    const name = path.getAttribute("name");
    if (id && name && !provinceMap.has(id)) {
      provinceMap.set(id, name);
    }
  });

  const provinces = [...provinceMap.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return { svg, provinces };
}

/**
 * Inject the Indonesia SVG map into a container element.
 * Uses the embedded SVG by default — no need to serve or copy any files.
 * Pass a custom svgUrl to fetch from a different source instead.
 */
export function injectSvg(
  container: HTMLElement,
  svgUrl?: string
): Promise<{ svg: SVGSVGElement; provinces: Province[] }> {
  if (svgUrl) {
    return fetch(svgUrl)
      .then((r) => r.text())
      .then((text) => parseSvg(container, text));
  }

  return Promise.resolve(parseSvg(container, SVG_CONTENT));
}

export function highlightPaths(
  svg: SVGSVGElement,
  id: string | null,
  className = "hovered"
) {
  svg
    .querySelectorAll(`#features path.${className}`)
    .forEach((p) => p.classList.remove(className));

  if (id) {
    svg
      .querySelectorAll(`#features path[id="${id}"]`)
      .forEach((p) => p.classList.add(className));
  }
}
