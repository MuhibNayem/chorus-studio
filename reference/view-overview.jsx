/* ── Overview / dashboard view ── */

const MetricRail = () => {
  const m = DASHBOARD;
  const items = [
    {
      lbl: 'Runs (24h)',
      val: m.runsSpark.reduce((a,b)=>a+b,0).toLocaleString(),
      delta: m.runsDelta,
      spark: m.runsSpark,
      color: 'hsl(var(--primary-bright))',
      fill: 'hsl(var(--primary) / 0.12)',
    },
    {
      lbl: 'Tokens (24h)',
      val: formatTokens(m.totalTokens),
      delta: m.tokensDelta,
      spark: m.tokensSpark,
      color: 'hsl(var(--llm))',
      fill: 'hsl(var(--llm) / 0.12)',
    },
    {
      lbl: 'Cost (24h)',
      unit: 'USD',
      val: '$' + m.costSpark.reduce((a,b)=>a+b,0).toFixed(2),
      delta: m.costDelta,
      spark: m.costSpark,
      color: 'hsl(var(--guardrail))',
      fill: 'hsl(var(--guardrail) / 0.12)',
    },
    {
      lbl: 'p95 latency',
      val: formatDuration(m.p95LatencyMs),
      delta: m.latencyDelta,
      spark: m.latencySpark,
      color: 'hsl(var(--tool))',
      fill: 'hsl(var(--tool) / 0.12)',
    },
  ];
  return (
    <div className="metric-rail">
      {items.map((it, i) => {
        const isUp = it.delta > 0;
        const goodWhenUp = i < 2;
        const goodColor = (isUp && goodWhenUp) || (!isUp && !goodWhenUp);
        return (
          <div className="metric" key={i}>
            <div className="m-lbl">{it.lbl}</div>
            <div className="m-val">
              {it.val}
              {it.unit && <span className="unit">{it.unit}</span>}
            </div>
            <div className={`m-delta ${goodColor ? 'up' : 'dn'}`}>
              {isUp ? <I.TrendingUp size={10} /> : <I.TrendingDown size={10} />}
              {isUp ? '+' : ''}{it.delta}%
            </div>
            <div className="m-spark">
              <Sparkline data={it.spark} color={it.color} fill={it.fill} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const LiveFeed = ({ setRoute }) => (
  <Card>
    <CardHeader
      title="Live feed"
      sub="Latest agent runs — updating every 2s"
      right={
        <div className="row" style={{gap: 8}}>
          <span className="badge muted"><span className="dot" style={{background:'hsl(var(--llm))'}}/>LLM</span>
          <span className="badge muted"><span className="dot" style={{background:'hsl(var(--tool))'}}/>Tool</span>
          <span className="badge muted"><span className="dot" style={{background:'hsl(var(--rag))'}}/>RAG</span>
          <span className="badge muted"><span className="dot" style={{background:'hsl(var(--guardrail))'}}/>Guard</span>
          <Button size="sm" icon={I.ArrowRight} onClick={() => setRoute({ kind: 'runs' })}>View all</Button>
        </div>
      }
    />
    <div className="feed">
      {RUNS.slice(0, 7).map(r => (
        <div key={r.id} className={`feed-row ${r.status === 'RUNNING' ? 'is-running' : ''}`}
             onClick={() => setRoute({ kind: 'runDetail', runId: r.id })}>
          <StatusBadge status={r.status} />
          <div style={{minWidth: 0}}>
            <div className="feed-id">run_{r.id}</div>
            <div className="feed-meta">
              <span>{r.framework}</span>
              <span className="sep">·</span>
              <span className="mono">{r.agent}</span>
              <span className="sep">·</span>
              <span className="mono mute">{r.model}</span>
            </div>
          </div>
          <MiniTrace mix={r.mix} />
          <div className="feed-stats">
            <b>{formatTokens(r.tokens)} tok</b>
            <span>{formatCost(r.cost)} · {formatDuration(r.latency)}</span>
          </div>
          <div className="feed-ts">{formatRel(r.started)}</div>
        </div>
      ))}
    </div>
  </Card>
);

/* Activity heatmap (24×7 hours × days) */
const ActivityHeatmap = () => (
  <Card>
    <CardHeader title="Activity" sub="Run volume by hour, last 7 days"
      right={<span className="badge muted">PT</span>} />
    <div className="card-pad">
      <div style={{display:'grid', gridTemplateColumns: '36px 1fr', gap: 6}}>
        <div />
        <div style={{display:'grid', gridTemplateColumns:'repeat(24, 1fr)', gap: 3, marginBottom: 2}}>
          {Array.from({length: 24}).map((_, h) => (
            <div key={h} style={{fontSize: 9, color: 'hsl(var(--muted-foreground))', textAlign: 'center', fontFamily: 'var(--font-mono)'}}>
              {h % 3 === 0 ? String(h).padStart(2, '0') : ''}
            </div>
          ))}
        </div>
        {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((day, di) => (
          <React.Fragment key={day}>
            <div style={{fontSize: 10, color: 'hsl(var(--muted-foreground))', fontWeight: 500, alignSelf:'center'}}>{day}</div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(24, 1fr)', gap: 3}}>
              {DASHBOARD.heatmap[di].map((v, hi) => (
                <div key={hi} className="heatmap"
                  style={{display:'block', aspectRatio:'1.2/1', borderRadius:2,
                          background: v === 0 ? 'hsl(var(--muted) / 0.4)' : `hsl(var(--primary) / ${0.18 + v * 0.18})`}}
                  title={`${day} ${String(hi).padStart(2,'0')}:00 — ${v * 200 + Math.floor(Math.random()*120)} runs`}
                />
              ))}
            </div>
          </React.Fragment>
        ))}
      </div>
      <div className="row" style={{justifyContent: 'flex-end', marginTop: 12, gap: 6, fontSize: 10, color: 'hsl(var(--muted-foreground))'}}>
        <span>less</span>
        {[0,1,2,3,4].map(v => (
          <div key={v} style={{width: 12, height: 12, borderRadius: 2,
            background: v === 0 ? 'hsl(var(--muted) / 0.4)' : `hsl(var(--primary) / ${0.18 + v * 0.18})`}} />
        ))}
        <span>more</span>
      </div>
    </div>
  </Card>
);

/* Status donut + breakdown */
const StatusDonut = () => {
  const data = DASHBOARD.statusBreakdown;
  const total = data.reduce((s, d) => s + d.count, 0);
  const colors = { SUCCESS: 'hsl(var(--success))', ERROR: 'hsl(var(--error))', RUNNING: 'hsl(var(--warning))' };
  let cur = 0;
  const stops = data.map(d => {
    const pct = (d.count / total) * 100;
    const seg = `${colors[d.status]} ${cur}% ${cur + pct}%`;
    cur += pct;
    return seg;
  }).join(', ');

  return (
    <Card>
      <CardHeader title="Status" sub="Last 24h outcomes" />
      <div className="card-pad">
        <div className="row" style={{gap: 24, alignItems: 'center'}}>
          <div style={{
            width: 124, height: 124, borderRadius: '50%',
            background: `conic-gradient(${stops})`,
            position: 'relative',
            flexShrink: 0,
          }}>
            <div style={{
              position: 'absolute', inset: 18, borderRadius: '50%',
              background: 'hsl(var(--card))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column',
            }}>
              <div className="mono tabular" style={{fontSize: 18, fontWeight: 700, letterSpacing: '-0.03em'}}>
                {(100 - (data[1].count / total * 100)).toFixed(1)}%
              </div>
              <div style={{fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'hsl(var(--muted-foreground))', fontWeight: 600}}>OK</div>
            </div>
          </div>
          <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 10}}>
            {data.map(d => (
              <div key={d.status} className="row" style={{justifyContent: 'space-between', fontSize: 12}}>
                <div className="row" style={{gap: 8}}>
                  <span style={{width: 8, height: 8, borderRadius: 2, background: colors[d.status]}} />
                  <span className="mute" style={{textTransform:'capitalize'}}>{d.status.toLowerCase()}</span>
                </div>
                <div className="row" style={{gap: 10}}>
                  <span className="mono tabular" style={{fontWeight: 600}}>{d.count.toLocaleString()}</span>
                  <span className="mono tabular mute" style={{minWidth: 42, textAlign: 'right'}}>{d.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

/* Top agents leaderboard */
const TopAgents = () => (
  <Card>
    <CardHeader title="Top agents" sub="By volume · last 24h" />
    <div>
      {DASHBOARD.topAgents.map((a, i) => {
        const maxRuns = DASHBOARD.topAgents[0].runs;
        return (
          <div key={a.id} style={{
            display: 'grid',
            gridTemplateColumns: '20px 1fr 60px 60px 60px',
            gap: 12,
            alignItems: 'center',
            padding: '10px 20px',
            borderTop: i === 0 ? 'none' : '1px solid hsl(var(--border))',
            fontSize: 12,
          }}>
            <div className="mono tabular mute">{String(i + 1).padStart(2, '0')}</div>
            <div style={{minWidth: 0}}>
              <div className="mono" style={{fontSize: 11.5, fontWeight: 500}}>{a.id}</div>
              <div className="row" style={{gap: 6, marginTop: 2}}>
                <span style={{fontSize: 10, color: 'hsl(var(--muted-foreground))'}}>{a.framework}</span>
                <div style={{height: 3, flex: 1, background: 'hsl(var(--muted) / 0.5)', borderRadius: 2, overflow: 'hidden', maxWidth: 120}}>
                  <div style={{
                    width: `${(a.runs / maxRuns) * 100}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary-bright)))',
                  }} />
                </div>
              </div>
            </div>
            <div className="mono tabular" style={{textAlign: 'right'}}>{formatTokens(a.runs)}</div>
            <div className="mono tabular mute" style={{textAlign: 'right'}}>{formatDuration(a.p95)}</div>
            <div className="mono tabular" style={{textAlign: 'right', color: a.errors > 100 ? 'hsl(var(--error))' : 'hsl(var(--muted-foreground))'}}>
              {a.errors}
            </div>
          </div>
        );
      })}
    </div>
  </Card>
);

const TopModels = () => (
  <Card>
    <CardHeader title="Top models" sub="By spend · last 24h" />
    <div>
      {DASHBOARD.topModels.map((m, i) => {
        const maxCost = Math.max(...DASHBOARD.topModels.map(x => x.cost));
        const provColor = { openai: 'hsl(var(--tool))', anthropic: 'hsl(var(--guardrail))', google: 'hsl(var(--llm))' }[m.provider] || 'hsl(var(--muted-foreground))';
        return (
          <div key={m.model} style={{
            display: 'grid',
            gridTemplateColumns: '1fr 80px 80px',
            gap: 12,
            alignItems: 'center',
            padding: '12px 20px',
            borderTop: i === 0 ? 'none' : '1px solid hsl(var(--border))',
            fontSize: 12,
          }}>
            <div style={{minWidth: 0}}>
              <div className="row" style={{gap: 8}}>
                <span style={{width: 6, height: 6, borderRadius: 2, background: provColor}} />
                <span className="mono" style={{fontWeight: 500}}>{m.model}</span>
                <span className="mute" style={{fontSize: 10}}>{m.provider}</span>
              </div>
              <div style={{marginTop: 6, height: 4, background: 'hsl(var(--muted) / 0.5)', borderRadius: 2, overflow: 'hidden'}}>
                <div style={{
                  width: `${(m.cost / maxCost) * 100}%`,
                  height: '100%',
                  background: provColor,
                  opacity: 0.85,
                }} />
              </div>
            </div>
            <div className="mono tabular mute" style={{textAlign: 'right'}}>{formatTokens(m.tokens)}</div>
            <div className="mono tabular" style={{textAlign: 'right', fontWeight: 500}}>${m.cost.toFixed(2)}</div>
          </div>
        );
      })}
    </div>
  </Card>
);

const OverviewPage = ({ setRoute }) => (
  <div className="page">
    <div className="page-h">
      <div>
        <h1 className="page-title">Overview <span className="accent">/ last 24h</span></h1>
        <div className="page-sub">
          <span className="live-pill"><span className="dot" />Live</span>
          <span style={{marginLeft: 10}}>847 runs/min sustained · 99.6% delivery</span>
        </div>
      </div>
      <div className="row" style={{gap: 8}}>
        <Button variant="outline" icon={I.Filter}>Filters</Button>
        <Button variant="outline" icon={I.History}>24h</Button>
        <Button variant="primary" icon={I.Plus}>New view</Button>
      </div>
    </div>

    <MetricRail />

    <LiveFeed setRoute={setRoute} />

    <div style={{height: 18}} />
    <div className="split-2">
      <ActivityHeatmap />
      <StatusDonut />
    </div>

    <div style={{height: 18}} />
    <div className="split-2">
      <TopAgents />
      <TopModels />
    </div>
  </div>
);

Object.assign(window, { OverviewPage, MetricRail, LiveFeed });
