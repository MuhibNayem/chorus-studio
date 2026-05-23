/* ── App shell: sidebar, topbar, live tick strip, command palette ── */

const Sidebar = ({ route, setRoute }) => {
  const isActive = (kind) => {
    if (route.kind === kind) return true;
    if (kind === 'agents' && (route.kind === 'agentDetail' || route.kind === 'agentRegister')) return true;
    if (kind === 'runs' && route.kind === 'runDetail') return true;
    return false;
  };

  const items = [
    { kind: 'overview', label: 'Overview',   icon: I.Layout,    kbd: 'G O' },
    { kind: 'runs',     label: 'Runs',       icon: I.List,      kbd: 'G R', badge: '128.4k' },
    { kind: 'datasets', label: 'Datasets',   icon: I.Database,  kbd: 'G D' },
    { kind: 'evals',    label: 'Evaluators', icon: I.Sparkles,  kbd: 'G E' },
    { kind: 'graph',    label: 'Provenance', icon: I.GitBranch },
  ];

  const platform = [
    { kind: 'agents',   label: 'Agents',     icon: I.Cpu,       badge: String(AGENTS.length) },
    { kind: 'models',   label: 'Models',     icon: I.Server },
    { kind: 'alerts',   label: 'Alerts',     icon: I.Bell,      badge: '3' },
    { kind: 'settings', label: 'Settings',   icon: I.Settings },
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          {/* Custom chorus mark — three concentric arcs + a pulse */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.4" />
            <circle cx="12" cy="12" r="6" stroke="hsl(var(--primary-bright))" strokeWidth="1.5" opacity="0.7" />
            <circle cx="12" cy="12" r="2.5" fill="hsl(var(--primary-bright))" />
            <path d="M1 12 L4 12 L6 8 L9 16 L12 4 L15 18 L18 10 L20 12 L23 12"
                  stroke="hsl(var(--primary-bright))" strokeWidth="1.2" fill="none"
                  strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
          </svg>
        </div>
        <div className="brand-name">
          Chorus <span style={{opacity:0.7}}>Observe</span>
          <span className="sub">β</span>
        </div>
      </div>

      <div className="proj-switcher" onClick={() => {}}>
        <div className="pdot">AO</div>
        <div className="pmeta">
          <div className="pname">acme-orchestrator</div>
          <div className="penv">production · us-east-1</div>
        </div>
        <I.ChevronsUpDown size={13} className="mute" />
      </div>

      <div className="side-section">Workspace</div>
      <nav className="side-nav">
        {items.map(it => (
          <div key={it.kind}
               className={`nav-item ${isActive(it.kind) ? 'active' : ''}`}
               onClick={() => setRoute({ kind: it.kind })}>
            <it.icon size={14} />
            <span>{it.label}</span>
            {it.badge ? (
              <span className="badge-count">{it.badge}</span>
            ) : (
              <span className="kbd">{it.kbd}</span>
            )}
          </div>
        ))}
      </nav>

      <div className="side-section">Platform</div>
      <nav className="side-nav">
        {platform.map(it => (
          <div key={it.kind}
               className={`nav-item ${isActive(it.kind) ? 'active' : ''}`}
               onClick={() => setRoute({ kind: it.kind })}>
            <it.icon size={14} />
            <span>{it.label}</span>
            {it.badge && <span className="badge-count">{it.badge}</span>}
          </div>
        ))}
      </nav>

      <div className="side-footer">
        <div className="row" style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>
          <span className="tick-strip" style={{padding: 0, border: 0, background: 'none'}}>
            <span className="live-dot" />
          </span>
          <span className="mono tabular">v1.4.2 · connected</span>
        </div>
        <div className="user">
          <div className="avatar">MN</div>
          <div className="flex-1">
            <div className="uname">Maya Nakamura</div>
            <div className="uorg">acme · platform</div>
          </div>
          <I.ChevronsUpDown size={13} className="mute" />
        </div>
      </div>
    </aside>
  );
};

const Crumbs = ({ route, setRoute }) => {
  const segs = [{ label: 'acme-orchestrator', onClick: () => setRoute({ kind: 'overview' }) }];
  if (route.kind === 'overview') segs.push({ label: 'Overview', cur: true });
  else if (route.kind === 'runs') segs.push({ label: 'Runs', cur: true });
  else if (route.kind === 'runDetail') {
    segs.push({ label: 'Runs', onClick: () => setRoute({ kind: 'runs' }) });
    segs.push({ label: <code>run_{route.runId.slice(0, 8)}…</code>, cur: true });
  }
  else if (route.kind === 'agents') segs.push({ label: 'Agents', cur: true });
  else if (route.kind === 'agentDetail') {
    segs.push({ label: 'Agents', onClick: () => setRoute({ kind: 'agents' }) });
    segs.push({ label: <code>{route.agentId}</code>, cur: true });
  }
  else if (route.kind === 'agentRegister') {
    segs.push({ label: 'Agents', onClick: () => setRoute({ kind: 'agents' }) });
    segs.push({ label: 'Register', cur: true });
  }
  else if (route.kind === 'datasets') segs.push({ label: 'Datasets', cur: true });
  else if (route.kind === 'evals') segs.push({ label: 'Evaluators', cur: true });
  else if (route.kind === 'graph') segs.push({ label: 'Provenance', cur: true });
  else if (route.kind === 'models') segs.push({ label: 'Models', cur: true });
  else if (route.kind === 'alerts') segs.push({ label: 'Alerts', cur: true });
  else if (route.kind === 'settings') segs.push({ label: 'Settings', cur: true });

  return (
    <div className="crumbs">
      {segs.map((s, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="sep">/</span>}
          {s.cur ? <span className="cur">{s.label}</span> :
            <span style={{cursor: s.onClick ? 'pointer' : 'default'}} onClick={s.onClick}>{s.label}</span>}
        </React.Fragment>
      ))}
    </div>
  );
};

const TickStrip = () => (
  <div className="tick-strip">
    <div className="lbl"><span className="live-dot" />LIVE · LAST 80 RUNS</div>
    <div className="tick-row">
      {TICKS.map((t, i) => (
        <div key={i} className={`tick ${t}`}
             style={{ width: 4, opacity: 0.55 + (i / TICKS.length) * 0.45 }}
             title={t === 's' ? 'success' : t === 'e' ? 'error' : 'running'} />
      ))}
    </div>
    <div className="meta tabular">
      <span><b>847</b>/min</span>
      <span>err <b>0.4%</b></span>
      <span>p95 <b>2.4s</b></span>
    </div>
  </div>
);

const TopBar = ({ route, setRoute, theme, setTheme, openCmd }) => (
  <div className="topbar">
    <Crumbs route={route} setRoute={setRoute} />
    <div className="cmd-trigger" onClick={openCmd}>
      <I.Search size={13} />
      <span>Search runs, spans, agents…</span>
      <span className="kbd">⌘K</span>
    </div>
    <div className="row" style={{gap: 4}}>
      <IconBtn icon={I.RefreshCw} label="Refresh" />
      <IconBtn icon={I.Bell} label="Alerts" />
      <IconBtn icon={theme === 'dark' ? I.Sun : I.Moon} label="Theme"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />
    </div>
  </div>
);

/* Command palette */
const CommandPalette = ({ onClose, setRoute }) => {
  const [q, setQ] = React.useState('');
  const [sel, setSel] = React.useState(0);
  const inputRef = React.useRef(null);

  React.useEffect(() => { inputRef.current?.focus(); }, []);

  const all = [
    { sec: 'Navigate', items: [
      { label: 'Overview',    icon: I.Layout,    kbd: 'G O', action: () => setRoute({ kind: 'overview' }) },
      { label: 'All runs',    icon: I.List,      kbd: 'G R', action: () => setRoute({ kind: 'runs' }) },
      { label: 'Datasets',    icon: I.Database,  kbd: 'G D', action: () => setRoute({ kind: 'datasets' }) },
      { label: 'Evaluators',  icon: I.Sparkles,  kbd: 'G E', action: () => setRoute({ kind: 'evals' }) },
    ]},
    { sec: 'Recent runs', items:
      RUNS.slice(0, 5).map(r => ({
        label: `run_${r.id.slice(0,8)}…`,
        sub: `${r.framework} · ${r.agent}`,
        icon: I.Activity,
        action: () => setRoute({ kind: 'runDetail', runId: r.id }),
      }))
    },
    { sec: 'Actions', items: [
      { label: 'Create dataset from selection', icon: I.Plus, action: () => {} },
      { label: 'Replay last failed run',        icon: I.RefreshCw, action: () => {} },
      { label: 'Open Chorus engine docs',       icon: I.ExternalLink, action: () => {} },
    ]},
  ];

  const filtered = all.map(s => ({
    ...s,
    items: s.items.filter(it => (it.label + (it.sub || '')).toLowerCase().includes(q.toLowerCase())),
  })).filter(s => s.items.length > 0);

  const flat = filtered.flatMap(s => s.items);

  const onKey = (e) => {
    if (e.key === 'ArrowDown') { setSel(s => Math.min(s + 1, flat.length - 1)); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { setSel(s => Math.max(s - 1, 0)); e.preventDefault(); }
    else if (e.key === 'Enter') { flat[sel]?.action(); onClose(); }
    else if (e.key === 'Escape') { onClose(); }
  };

  let idx = -1;
  return (
    <div className="cmd-overlay" onClick={onClose}>
      <div className="cmd-modal" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          className="cmd-input"
          placeholder="Search runs, spans, agents, datasets…"
          value={q}
          onChange={(e) => { setQ(e.target.value); setSel(0); }}
          onKeyDown={onKey}
        />
        <div className="cmd-list">
          {filtered.map((s, si) => (
            <div key={si}>
              <div className="cmd-section">{s.sec}</div>
              {s.items.map((it) => {
                idx++;
                const mine = idx;
                return (
                  <div key={mine} className={`cmd-item ${mine === sel ? 'sel' : ''}`}
                       onClick={() => { it.action(); onClose(); }}
                       onMouseEnter={() => setSel(mine)}>
                    <it.icon size={14} className="icon" />
                    <span>
                      {it.label}
                      {it.sub && <span style={{marginLeft: 8, color: 'hsl(var(--muted-foreground))', fontSize: 11, fontFamily: 'var(--font-mono)'}}>{it.sub}</span>}
                    </span>
                    {it.kbd && <span className="kbd">{it.kbd}</span>}
                  </div>
                );
              })}
            </div>
          ))}
          {flat.length === 0 && (
            <div style={{padding: '24px 16px', textAlign: 'center', fontSize: 12, color: 'hsl(var(--muted-foreground))'}}>
              No results.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { Sidebar, TopBar, TickStrip, CommandPalette });
