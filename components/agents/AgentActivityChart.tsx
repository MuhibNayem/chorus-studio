"use client";

export default function AgentActivityChart({ runsSpark, latencySpark }: {
  runsSpark: number[];
  latencySpark: number[];
}) {
  const W = 720, H = 220, P = 28;
  const maxR = Math.max(...runsSpark);
  const maxL = Math.max(...latencySpark);
  const minL = Math.min(...latencySpark);
  const barW = (W - P * 2) / runsSpark.length - 2;
  const stepX = (W - P * 2) / (latencySpark.length - 1);

  const latencyPoints = latencySpark.map((v, i) => {
    const x = P + i * stepX;
    const y = H - P - ((v - minL) / (maxL - minL + 1)) * (H - P * 2);
    return [x, y];
  });
  const linePath = "M" + latencyPoints.map((p) => p.join(",")).join(" L");
  const areaPath = linePath + ` L${P + (latencySpark.length - 1) * stepX},${H - P} L${P},${H - P} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="lat-grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary-bright))" stopOpacity="0.35" />
          <stop offset="100%" stopColor="hsl(var(--primary-bright))" stopOpacity="0" />
        </linearGradient>
      </defs>

      {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
        const y = P + p * (H - P * 2);
        return <line key={i} x1={P} x2={W - P} y1={y} y2={y}
          stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray={i === 0 || i === 4 ? "" : "2 4"} />;
      })}

      {[0.0, 0.5, 1.0].map((p) => {
        const y = H - P - p * (H - P * 2);
        return (
          <g key={p}>
            <text x={P - 6} y={y + 3} fontSize="9" textAnchor="end"
              fill="hsl(var(--muted-foreground))" fontFamily="var(--font-mono)">
              {formatDuration(minL + p * (maxL - minL))}
            </text>
            <text x={W - P + 6} y={y + 3} fontSize="9" textAnchor="start"
              fill="hsl(var(--muted-foreground))" fontFamily="var(--font-mono)">
              {Math.round(p * maxR)}
            </text>
          </g>
        );
      })}

      {runsSpark.map((v, i) => {
        const x = P + i * (barW + 2);
        const h = (v / maxR) * (H - P * 2);
        return <rect key={i} x={x} y={H - P - h} width={barW} height={h}
          fill="hsl(var(--primary) / 0.25)" rx="1" />;
      })}

      <path d={areaPath} fill="url(#lat-grad)" />
      <path d={linePath} fill="none" stroke="hsl(var(--primary-bright))" strokeWidth="1.6"
        strokeLinecap="round" strokeLinejoin="round" />
      {latencyPoints.filter((_, i) => i % 4 === 0).map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.5" fill="hsl(var(--background))" stroke="hsl(var(--primary-bright))" strokeWidth="1.5" />
      ))}

      {[0, 6, 12, 18, 23].map((h) => {
        const x = P + h * stepX;
        return <text key={h} x={x} y={H - 8} fontSize="9" textAnchor="middle"
          fill="hsl(var(--muted-foreground))" fontFamily="var(--font-mono)">
          {String(h).padStart(2, "0")}:00
        </text>;
      })}
    </svg>
  );
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}
