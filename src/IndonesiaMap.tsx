import { useEffect, useRef, useState, useCallback } from "react";
import { injectSvg, highlightPaths, type Province } from "./svg";

export interface IndonesiaMapProps {
  /** Optional URL to load SVG from. If omitted, uses the embedded SVG (no setup needed). */
  svgUrl?: string;
  /** Called when a province is clicked */
  onProvinceClick?: (provinceId: string, provinceName: string) => void;
  /** Custom class name for the wrapper */
  className?: string;
  /** Show the province legend below the map */
  showLegend?: boolean;
  /** Custom fill colors per province id, e.g. { IDJK: "#ff0000" } */
  colors?: Record<string, string>;
}

export function IndonesiaMap({
  svgUrl,
  onProvinceClick,
  className,
  showLegend = true,
  colors,
}: IndonesiaMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState({
    visible: false,
    name: "",
    id: "",
    x: 0,
    y: 0,
  });

  const highlight = useCallback((id: string | null) => {
    const svg = svgRef.current;
    if (!svg) return;
    highlightPaths(svg, id);
    setActiveId(id);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    injectSvg(container, svgUrl).then(({ svg, provinces }) => {
      svgRef.current = svg;
      svg.style.width = "100%";
      svg.style.height = "auto";
      setProvinces(provinces);

      // Apply custom colors
      if (colors) {
        svg.querySelectorAll("#features path").forEach((path) => {
          const id = path.getAttribute("id");
          if (id && colors[id]) {
            (path as SVGPathElement).style.fill = colors[id];
          }
        });
      }

      svg.querySelectorAll("#features path").forEach((path) => {
        const name = path.getAttribute("name") || "";
        const id = path.getAttribute("id") || "";

        path.addEventListener("mouseenter", () => {
          setTooltip((prev) => ({ ...prev, visible: true, name, id }));
          highlightPaths(svg, id);
          setActiveId(id);
        });

        path.addEventListener("mousemove", (e) => {
          const me = e as MouseEvent;
          setTooltip((prev) => ({
            ...prev,
            x: me.clientX + 16,
            y: me.clientY - 10,
          }));
        });

        path.addEventListener("mouseleave", () => {
          setTooltip((prev) => ({ ...prev, visible: false }));
          highlightPaths(svg, null);
          setActiveId(null);
        });

        if (onProvinceClick) {
          path.addEventListener("click", () => onProvinceClick(id, name));
        }
      });
    });

    return () => {
      if (container) container.innerHTML = "";
    };
  }, [svgUrl, onProvinceClick, colors]);

  const handleLegendEnter = useCallback(
    (id: string, name: string) => {
      highlight(id);
      setTooltip((prev) => ({ ...prev, visible: true, name, id }));

      const svg = svgRef.current;
      if (!svg) return;
      const path = svg.querySelector(`#features path[id="${id}"]`);
      if (path) {
        const bbox = path.getBoundingClientRect();
        setTooltip((prev) => ({
          ...prev,
          x: bbox.left + bbox.width / 2,
          y: bbox.top + bbox.height / 2 - 40,
        }));
      }
    },
    [highlight]
  );

  const handleLegendLeave = useCallback(() => {
    highlight(null);
    setTooltip((prev) => ({ ...prev, visible: false }));
  }, [highlight]);

  return (
    <>
      <div
        className={className}
        style={{ display: "flex", flexDirection: "column", gap: 16 }}
      >
        <div ref={containerRef} />

        {showLegend && provinces.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              borderTop: "1px solid #eee",
              paddingTop: 12,
              gap: 0,
            }}
          >
            {provinces.map((p) => (
              <div
                key={p.id}
                onMouseEnter={() => handleLegendEnter(p.id, p.name)}
                onMouseLeave={handleLegendLeave}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "3px 8px",
                  cursor: "pointer",
                  borderRadius: 3,
                  background: activeId === p.id ? "#f0f0f0" : "transparent",
                  fontSize: "0.6rem",
                  color: activeId === p.id ? "#222" : "#888",
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 1,
                    background: activeId === p.id ? "#e85d3a" : "#d0d0d0",
                    flexShrink: 0,
                    transition: "background 0.2s",
                  }}
                />
                {p.name}
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          position: "fixed",
          pointerEvents: "none",
          zIndex: 100,
          background: "#fff",
          border: "1px solid #e0e0e0",
          borderRadius: 4,
          padding: "6px 12px",
          opacity: tooltip.visible ? 1 : 0,
          transform: tooltip.visible ? "translateY(0)" : "translateY(4px)",
          transition: "opacity 0.15s, transform 0.15s",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          left: Math.min(
            Math.max(tooltip.x, 8),
            typeof window !== "undefined" ? window.innerWidth - 200 : 800
          ),
          top: Math.max(tooltip.y, 8),
        }}
      >
        <div style={{ fontSize: "0.8rem", fontWeight: 500, color: "#222" }}>
          {tooltip.name}
        </div>
        <div style={{ fontSize: "0.65rem", color: "#aaa", marginTop: 1 }}>
          {tooltip.id}
        </div>
      </div>
    </>
  );
}
