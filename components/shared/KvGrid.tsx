"use client";

export default function KvGrid({ items }: { items: [string, React.ReactNode][] }) {
  return (
    <div className="kv-grid">
      {items.map(([k, v], i) => (
        <div key={i} className="contents">
          <div className="k">{k}</div>
          <div className="v">{v}</div>
        </div>
      ))}
    </div>
  );
}
