// Gráficas SVG sin dependencias para el módulo de reportes (RF-1.2.15.5).
export type ChartDatum = { label: string; count: number; percentage?: number };

const PALETTE = ["#7a2e3a", "#b8925a", "#2c1a1d", "#7d5f2c", "#94606c", "#c9a36e", "#5a4a4e", "#a3762f"];

const WIDTH = 640;
const HEIGHT = 280;
const MARGIN = { top: 16, right: 16, bottom: 48, left: 44 };

function ticks(max: number): number[] {
  if (max <= 4) return Array.from({ length: max + 1 }, (_, i) => i);
  return [0, Math.round(max / 2), max];
}

/** Rótulos del eje horizontal: si no caben, se muestra uno de cada `step`. */
function labelStep(count: number): number {
  return Math.max(1, Math.ceil(count / 10));
}

function Axes({ max, xLabel, yLabel }: { max: number; xLabel: string; yLabel: string }) {
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  return (
    <g className="text-muted">
      <line x1={MARGIN.left} y1={MARGIN.top} x2={MARGIN.left} y2={HEIGHT - MARGIN.bottom} stroke="currentColor" strokeWidth={1} />
      <line
        x1={MARGIN.left}
        y1={HEIGHT - MARGIN.bottom}
        x2={WIDTH - MARGIN.right}
        y2={HEIGHT - MARGIN.bottom}
        stroke="currentColor"
        strokeWidth={1}
      />
      {ticks(max).map((tick) => {
        const y = HEIGHT - MARGIN.bottom - (tick / max) * plotHeight;
        return (
          <g key={tick}>
            <line x1={MARGIN.left - 4} y1={y} x2={MARGIN.left} y2={y} stroke="currentColor" strokeWidth={1} />
            <text x={MARGIN.left - 8} y={y + 4} textAnchor="end" fontSize={11} fill="currentColor">
              {tick}
            </text>
          </g>
        );
      })}
      <text x={MARGIN.left} y={HEIGHT - 8} fontSize={11} fill="currentColor">
        {xLabel}
      </text>
      <text x={WIDTH - MARGIN.right} y={MARGIN.top - 4} textAnchor="end" fontSize={11} fill="currentColor">
        {yLabel}
      </text>
    </g>
  );
}

export function BarChart({ data, xLabel, yLabel }: { data: ChartDatum[]; xLabel: string; yLabel: string }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const plotWidth = WIDTH - MARGIN.left - MARGIN.right;
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const slot = plotWidth / Math.max(1, data.length);
  const barWidth = Math.min(48, slot * 0.68);
  const step = labelStep(data.length);

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={`Gráfica de barras: ${yLabel} por ${xLabel}`} className="w-full">
      <Axes max={max} xLabel={xLabel} yLabel={yLabel} />
      {data.map((datum, index) => {
        const height = (datum.count / max) * plotHeight;
        const x = MARGIN.left + slot * index + (slot - barWidth) / 2;
        const y = HEIGHT - MARGIN.bottom - height;
        return (
          <g key={`${datum.label}-${index}`}>
            <rect x={x} y={y} width={barWidth} height={Math.max(height, datum.count ? 2 : 0)} fill={PALETTE[0]} rx={2} />
            {index % step === 0 ? (
              <text x={x + barWidth / 2} y={HEIGHT - MARGIN.bottom + 16} textAnchor="middle" fontSize={10} fill="currentColor" className="text-muted">
                {datum.label}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

export function LineChart({ data, xLabel, yLabel }: { data: ChartDatum[]; xLabel: string; yLabel: string }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const plotWidth = WIDTH - MARGIN.left - MARGIN.right;
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const slot = plotWidth / Math.max(1, data.length);
  const step = labelStep(data.length);
  const points = data.map((datum, index) => {
    const x = MARGIN.left + slot * index + slot / 2;
    const y = HEIGHT - MARGIN.bottom - (datum.count / max) * plotHeight;
    return { x, y, datum };
  });

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={`Gráfica de líneas: ${yLabel} por ${xLabel}`} className="w-full">
      <Axes max={max} xLabel={xLabel} yLabel={yLabel} />
      <polyline points={points.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke={PALETTE[0]} strokeWidth={2} />
      {points.map((point, index) => (
        <g key={`${point.datum.label}-${index}`}>
          <circle cx={point.x} cy={point.y} r={3} fill={PALETTE[1]} />
          {index % step === 0 ? (
            <text x={point.x} y={HEIGHT - MARGIN.bottom + 16} textAnchor="middle" fontSize={10} fill="currentColor" className="text-muted">
              {point.datum.label}
            </text>
          ) : null}
        </g>
      ))}
    </svg>
  );
}

function polar(cx: number, cy: number, radius: number, angle: number) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return { x: cx + radius * Math.cos(radians), y: cy + radius * Math.sin(radians) };
}

function slicePath(cx: number, cy: number, radius: number, start: number, end: number) {
  const from = polar(cx, cy, radius, start);
  const to = polar(cx, cy, radius, end);
  const large = end - start > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${from.x} ${from.y} A ${radius} ${radius} 0 ${large} 1 ${to.x} ${to.y} Z`;
}

export function PieChart({ data }: { data: ChartDatum[] }) {
  const total = data.reduce((sum, datum) => sum + datum.count, 0) || 1;
  const offsets = data.map((_, index) => data.slice(0, index).reduce((sum, datum) => sum + datum.count, 0));
  const slices = data.map((datum, index) => ({
    datum,
    start: (offsets[index] / total) * 360,
    end: ((offsets[index] + datum.count) / total) * 360,
    color: PALETTE[index % PALETTE.length],
  }));

  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg viewBox="0 0 220 220" role="img" aria-label="Gráfica de pastel de participación" className="w-52 shrink-0">
        {slices.map((slice, index) =>
          slice.end - slice.start >= 359.99 ? (
            <circle key={index} cx={110} cy={110} r={100} fill={slice.color} />
          ) : (
            <path key={index} d={slicePath(110, 110, 100, slice.start, slice.end)} fill={slice.color} />
          ),
        )}
      </svg>
      <ul className="min-w-0 flex-1 space-y-1 text-sm">
        {slices.map((slice, index) => (
          <li key={index} className="flex items-center gap-2">
            <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: slice.color }} />
            <span className="min-w-0 flex-1 truncate">{slice.datum.label}</span>
            <span className="text-muted">{formatSlicePercent(slice.datum, total)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatSlicePercent(datum: ChartDatum, total: number): string {
  const percentage = datum.percentage ?? (datum.count / total) * 100;
  return `${percentage.toFixed(2)}%`;
}
