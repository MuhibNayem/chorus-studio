/* ── Runs list view — filterable, dense table ── */

const RunsPage = ({ setRoute }) => {
  const [filters, setFilters] = React.useState({ status: '', framework: '', search: '' });
  const [sortBy, setSortBy] = React.useState('started');

  const statuses = ['SUCCESS', 'ERROR', 'RUNNING'];
  const frameworks = ['LangGraph', 'LangChain', 'Chorus'];

  const filtered = RUNS.filter(r => {
    if (filters.status && r.status !== filters.status) return false;
    if (filters.framework && r.framework !== filters.framework) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!(r.id + r.agent + r.model + r.framework).toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="page">
      <div className="page-h">
        <div>
          <h1 className="page-title">Runs <span className="accent">/ {filtered.length} of 128,471</span></h1>
          <div className="page-sub">All agent executions, newest first.</div>
        </div>
        <div className="row" style={{gap: 8}}>
          <Button variant="outline" icon={I.Sliders}>Customize</Button>
          <Button variant="outline" icon={I.ExternalLink}>Export</Button>
          <Button variant="primary" icon={I.PlayCircle}>Replay run</Button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <div style={{position: 'relative', width: 260}}>
          <I.Search size={13} style={{position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))', pointerEvents: 'none'}} />
          <input
            className="input"
            style={{paddingLeft: 30, fontFamily: 'var(--font-mono)', fontSize: 11.5}}
            placeholder="run_id, agent, model…"
            value={filters.search}
            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
          />
        </div>
        {statuses.map(s => (
          <button key={s}
            className={`filter-chip ${filters.status === s ? 'active' : ''}`}
            onClick={() => setFilters(f => ({ ...f, status: f.status === s ? '' : s }))}>
            <span className="dot" style={{
              width: 6, height: 6, borderRadius: '50%',
              background: s === 'SUCCESS' ? 'hsl(var(--success))' : s === 'ERROR' ? 'hsl(var(--error))' : 'hsl(var(--warning))',
            }} />
            {s.charAt(0) + s.slice(1).toLowerCase()}
            {filters.status === s && <I.X size={10} />}
          </button>
        ))}
        <div className="sep-v" />
        {frameworks.map(f => (
          <button key={f}
            className={`filter-chip ${filters.framework === f ? 'active' : ''}`}
            onClick={() => setFilters(p => ({ ...p, framework: p.framework === f ? '' : f }))}>
            {f}
            {filters.framework === f && <I.X size={10} />}
          </button>
        ))}
        <div style={{marginLeft: 'auto'}} className="row">
          <span className="mute" style={{fontSize: 11}}>Sort:</span>
          <select className="input" style={{width: 'auto', height: 28, paddingLeft: 8}}
            value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="started">Newest</option>
            <option value="latency">Slowest</option>
            <option value="cost">Most expensive</option>
            <option value="tokens">Most tokens</option>
          </select>
        </div>
      </div>

      <Card style={{overflow: 'hidden'}}>
        <table className="runs-table">
          <thead>
            <tr>
              <th style={{width: 80}}>Status</th>
              <th>Run ID</th>
              <th>Agent</th>
              <th>Model</th>
              <th style={{width: 110}}>Span mix</th>
              <th className="r" style={{width: 80}}>Tokens</th>
              <th className="r" style={{width: 70}}>Cost</th>
              <th className="r" style={{width: 80}}>Latency</th>
              <th className="r" style={{width: 80}}>Started</th>
              <th style={{width: 28}} />
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} onClick={() => setRoute({ kind: 'runDetail', runId: r.id })}>
                <td><StatusBadge status={r.status} /></td>
                <td>
                  <div className="row-id">run_{r.id.slice(0, 18)}…</div>
                  <div className="mute" style={{fontSize: 10, marginTop: 1, fontFamily:'var(--font-mono)'}}>{r.framework}</div>
                </td>
                <td className="mono">{r.agent}</td>
                <td className="mono mute">{r.model}</td>
                <td><MiniTrace mix={r.mix} /></td>
                <td className="r">{formatTokens(r.tokens)}</td>
                <td className="r">{formatCost(r.cost)}</td>
                <td className="r">{formatDuration(r.latency)}</td>
                <td className="r mute">{formatRel(r.started)}</td>
                <td><I.ChevronRight size={13} className="mute" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="row" style={{justifyContent: 'space-between', marginTop: 14}}>
        <div className="mute" style={{fontSize: 12}}>
          Showing <span className="mono tabular">1–{filtered.length}</span> of <span className="mono tabular">128,471</span>
        </div>
        <div className="row" style={{gap: 4}}>
          <Button variant="outline" size="sm" disabled icon={I.ChevronLeft}>Prev</Button>
          <span className="mute mono tabular" style={{fontSize: 11, padding: '0 8px'}}>1 / 6,424</span>
          <Button variant="outline" size="sm">Next <I.ChevronRight size={13} /></Button>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { RunsPage });
