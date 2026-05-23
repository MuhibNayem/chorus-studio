"use client";

export default function MiniTrace({ mix }: { mix: [string, number][] }) {
  const total = mix.reduce((s, [, w]) => s + w, 0);
  return (
    <div className="feed-mini-trace">
      {mix.map(([type, w], i) => (
        <div
          key={i}
          className="seg"
          style={{
            width: `${(w / total) * 100}%`,
            background: `hsl(var(--${type === "default" ? "muted-foreground" : type}))`,
          }}
        />
      ))}
    </div>
  );
}
