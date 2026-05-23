/* ── Primitives + inline lucide-style SVG icons ──
   Hand-rolled minimal versions matching the lucide pen
   (2-stroke, currentColor, rounded caps/joins). */

const Icon = ({ d, children, size = 14, ...p }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...p}
  >
    {children || (d && <path d={d} />)}
  </svg>
);

const I = {
  Activity:    (p) => <Icon {...p}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></Icon>,
  Search:      (p) => <Icon {...p}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></Icon>,
  Layout:      (p) => <Icon {...p}><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M3 9h18M9 21V9" /></Icon>,
  List:        (p) => <Icon {...p}><path d="M3 12h.01M3 18h.01M3 6h.01M8 6h13M8 12h13M8 18h13" /></Icon>,
  GitBranch:   (p) => <Icon {...p}><line x1="6" x2="6" y1="3" y2="15" /><circle cx="18" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M18 9a9 9 0 0 1-9 9" /></Icon>,
  Database:    (p) => <Icon {...p}><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M3 5v14a9 3 0 0 0 18 0V5" /><path d="M3 12a9 3 0 0 0 18 0" /></Icon>,
  Settings:    (p) => <Icon {...p}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></Icon>,
  Zap:         (p) => <Icon {...p}><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" /></Icon>,
  DollarSign:  (p) => <Icon {...p}><line x1="12" x2="12" y1="2" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></Icon>,
  Clock:       (p) => <Icon {...p}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></Icon>,
  TrendingUp:  (p) => <Icon {...p}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></Icon>,
  TrendingDown:(p) => <Icon {...p}><polyline points="22 17 13.5 8.5 8.5 13.5 2 7" /><polyline points="16 17 22 17 22 11" /></Icon>,
  ArrowRight:  (p) => <Icon {...p}><line x1="5" x2="19" y1="12" y2="12" /><polyline points="12 5 19 12 12 19" /></Icon>,
  ArrowLeft:   (p) => <Icon {...p}><line x1="19" x2="5" y1="12" y2="12" /><polyline points="12 19 5 12 12 5" /></Icon>,
  ChevronDown: (p) => <Icon {...p}><polyline points="6 9 12 15 18 9" /></Icon>,
  ChevronRight:(p) => <Icon {...p}><polyline points="9 18 15 12 9 6" /></Icon>,
  ChevronLeft: (p) => <Icon {...p}><polyline points="15 18 9 12 15 6" /></Icon>,
  ChevronsUpDown:(p) => <Icon {...p}><path d="m7 15 5 5 5-5" /><path d="m7 9 5-5 5 5" /></Icon>,
  X:           (p) => <Icon {...p}><path d="M18 6 6 18M6 6l12 12" /></Icon>,
  Check:       (p) => <Icon {...p}><polyline points="20 6 9 17 4 12" /></Icon>,
  Plus:        (p) => <Icon {...p}><path d="M5 12h14M12 5v14" /></Icon>,
  Filter:      (p) => <Icon {...p}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></Icon>,
  Sliders:     (p) => <Icon {...p}><line x1="4" x2="4" y1="21" y2="14" /><line x1="4" x2="4" y1="10" y2="3" /><line x1="12" x2="12" y1="21" y2="12" /><line x1="12" x2="12" y1="8" y2="3" /><line x1="20" x2="20" y1="21" y2="16" /><line x1="20" x2="20" y1="12" y2="3" /><line x1="2" x2="6" y1="14" y2="14" /><line x1="10" x2="14" y1="8" y2="8" /><line x1="18" x2="22" y1="16" y2="16" /></Icon>,
  Moon:        (p) => <Icon {...p}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></Icon>,
  Sun:         (p) => <Icon {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></Icon>,
  ThumbsUp:    (p) => <Icon {...p}><path d="M7 10v12" /><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H7V10l4.59-4.59A2 2 0 0 1 15 5.88Z" /></Icon>,
  ThumbsDown:  (p) => <Icon {...p}><path d="M17 14V2" /><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H17v12l-4.59 4.59A2 2 0 0 1 9 18.12Z" /></Icon>,
  ExternalLink:(p) => <Icon {...p}><path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></Icon>,
  Copy:        (p) => <Icon {...p}><rect width="14" height="14" x="8" y="8" rx="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></Icon>,
  AlertCircle: (p) => <Icon {...p}><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></Icon>,
  Cpu:         (p) => <Icon {...p}><rect x="4" y="4" width="16" height="16" rx="2" /><rect x="9" y="9" width="6" height="6" /><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" /></Icon>,
  Wrench:      (p) => <Icon {...p}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></Icon>,
  Shield:      (p) => <Icon {...p}><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /></Icon>,
  Layers:      (p) => <Icon {...p}><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" /><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" /><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" /></Icon>,
  PlayCircle:  (p) => <Icon {...p}><circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" /></Icon>,
  Pause:       (p) => <Icon {...p}><rect width="4" height="16" x="6" y="4" /><rect width="4" height="16" x="14" y="4" /></Icon>,
  RefreshCw:   (p) => <Icon {...p}><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M3 21v-5h5" /></Icon>,
  Eye:         (p) => <Icon {...p}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></Icon>,
  Compass:     (p) => <Icon {...p}><circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" /></Icon>,
  Sparkles:    (p) => <Icon {...p}><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" /><path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" /></Icon>,
  History:     (p) => <Icon {...p}><path d="M3 12a9 9 0 1 0 9-9 9.74 9.74 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l4 2" /></Icon>,
  Bell:        (p) => <Icon {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></Icon>,
  CornerDown:  (p) => <Icon {...p}><polyline points="15 10 20 15 15 20" /><path d="M4 4v7a4 4 0 0 0 4 4h12" /></Icon>,
  Server:      (p) => <Icon {...p}><rect width="20" height="8" x="2" y="2" rx="2" /><rect width="20" height="8" x="2" y="14" rx="2" /><path d="M6 6h.01M6 18h.01" /></Icon>,
  Globe:       (p) => <Icon {...p}><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></Icon>,
  HelpCircle:  (p) => <Icon {...p}><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" x2="12.01" y1="17" y2="17" /></Icon>,
  Inbox:       (p) => <Icon {...p}><polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></Icon>,
};

/* ── Primitives ── */
const Badge = ({ variant = 'muted', dot, children, ...p }) => (
  <span className={`badge ${variant}`} {...p}>
    {dot && <span className="dot" />}
    {children}
  </span>
);

const Button = ({ variant = 'outline', size, icon: Ic, children, ...p }) => (
  <button className={`btn ${variant} ${size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : ''}`} {...p}>
    {Ic && <Ic size={13} />}
    {children}
  </button>
);

const IconBtn = ({ icon: Ic, label, ...p }) => (
  <button className="icon-btn" aria-label={label} {...p}>
    <Ic size={15} />
  </button>
);

const Card = ({ children, className = '', ...p }) => (
  <div className={`card ${className}`} {...p}>{children}</div>
);
const CardHeader = ({ title, sub, right }) => (
  <div className="card-h">
    <div>
      <div className="card-title"><span className="h-bullet" />{title}</div>
      {sub && <div className="card-sub">{sub}</div>}
    </div>
    {right}
  </div>
);

const StatusBadge = ({ status }) => {
  const map = {
    SUCCESS: { v: 'success',  label: 'Success' },
    ERROR:   { v: 'error',    label: 'Error' },
    RUNNING: { v: 'warning',  label: 'Running' },
  };
  const m = map[status] || { v: 'muted', label: status };
  return <Badge variant={m.v} dot>{m.label}</Badge>;
};

const SpanTypeBadge = ({ type }) => {
  const map = {
    llm:       { variant: 'llm', label: 'LLM',   Ic: I.Sparkles },
    tool:      { variant: 'tool', label: 'Tool', Ic: I.Wrench },
    guardrail: { variant: 'guardrail', label: 'Guardrail', Ic: I.Shield },
    rag:       { variant: 'rag', label: 'RAG', Ic: I.Database },
    default:   { variant: 'muted', label: 'Span', Ic: I.Layers },
  };
  const m = map[type] || map.default;
  return <Badge variant={m.variant}><m.Ic size={9} />{m.label}</Badge>;
};

/* Sparkline svg */
const Sparkline = ({ data, color = 'currentColor', width = 80, height = 28, fill }) => {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data), min = Math.min(...data);
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
};

/* Mini stacked trace (used in feed rows + agent table) */
const MiniTrace = ({ mix }) => {
  const total = mix.reduce((s, [, w]) => s + w, 0);
  return (
    <div className="feed-mini-trace">
      {mix.map(([type, w], i) => (
        <div key={i} className="seg"
             style={{
               width: `${(w / total) * 100}%`,
               background: `hsl(var(--${type === 'default' ? 'muted-foreground' : type}))`,
             }}
        />
      ))}
    </div>
  );
};

Object.assign(window, {
  I, Icon, Badge, Button, IconBtn, Card, CardHeader,
  StatusBadge, SpanTypeBadge, Sparkline, MiniTrace,
});
