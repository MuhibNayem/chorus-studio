"use client";

export default function Sparkline({
  data,
  color = "currentColor",
  width = 80,
  height = 28,
  fill,
}: {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  fill?: string;
}) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const points = data.map((v, i) => `${i * step},${height - ((v - min) / range) * (height - 4) - 2}`);
  const line = "M" + points.join(" L");
  const area = `M0,${height} L${points.join(" L")} L${width},${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} preserveAspectRatio="none">
      {fill && <path d={area} fill={fill} />}
      <path d={line} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
