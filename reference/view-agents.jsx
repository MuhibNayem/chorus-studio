/* ── Agents list + detail + register flow ── */

const statusToVariant = (s) => s === 'healthy' ? 'success' : s === 'degraded' ? 'warning' : 'error';

/* ── Agents list ──────────────────────────────────────── */
const AgentsListPage = ({ setRoute }) => (
  <div className="page">
    <div className="page-h">
      <div>
        <h1 className="page-title">Agents <span className="accent">/ {AGENTS.length}</span></h1>
        <div className="page-sub">Every agent emitting traces into this workspace.</div>
      </div>
      <div className="row" style={{gap: 8}}>
        <Button variant="outline" icon={I.ExternalLink}>Docs</Button>
        <Button variant="primary" icon={I.Plus} onClick={() => setRoute({ kind: 'agentRegister' })}>
          Register agent
        </Button>
      </div>
    </div>

    <Card style={{overflow: 'hidden'}}>
      <table className="runs-table">
        <thead>
          <tr>
            <th style={{width: 80}}>Status</th>
            <th>Agent</th>
            <th>Framework</th>
            <th>Owner</th>
            <th className="r" style={{width: 90}}>Runs (24h)</th>
            <th className="r" style={{width: 80}}>p95</th>
            <th className="r" style={{width: 70}}>Cost</th>
            <th className="r" style={{width: 70}}>Errors</th>
            <th style={{width: 90}} className="r">Version</th>
            <th style={{width: 28}} />
          </tr>
        </thead>
        <tbody>
          {AGENTS.map(a => (
            <tr key={a.id} onClick={() => setRoute({ kind: 'agentDetail', agentId: a.id })}>
              <td><Badge variant={statusToVariant(a.status)} dot>{a.status}</Badge></td>
              <td>
                <div className="row" style={{gap: 8, alignItems:'center'}}>
                  <div style={{
                    width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                    background: `hsl(var(--${a.health > 99 ? 'tool' : a.health > 98 ? 'primary' : 'warning'}) / 0.18)`,
                    display: 'grid', placeItems: 'center',
                    color: `hsl(var(--${a.health > 99 ? 'tool' : a.health > 98 ? 'primary' : 'warning'}))`,
                  }}>
                    <I.Cpu size={12} />
                  </div>
                  <div style={{minWidth: 0}}>
                    <div className="row-id">{a.id}</div>
                    <div className="mute" style={{fontSize: 10, marginTop: 2}}>{a.name}</div>
                  </div>
                </div>
              </td>
              <td><Badge variant="muted">{a.framework}</Badge></td>
              <td className="mute" style={{fontSize: 11.5}}>{a.owner}</td>
              <td className="r">{formatTokens(a.runs24h)}</td>
              <td className="r">{formatDuration(a.latencyP95)}</td>
              <td className="r">${a.cost24h.toFixed(2)}</td>
              <td className="r" style={{color: a.errors24h > 100 ? 'hsl(var(--error))' : 'hsl(var(--muted-foreground))'}}>{a.errors24h}</td>
              <td className="r mono mute" style={{fontSize: 11}}>{a.version}</td>
              <td><I.ChevronRight size={13} className="mute" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  </div>
);

/* ── Agent detail ─────────────────────────────────────── */

/* Dual-axis area chart: runs (bars) + latency (line) over 24h */
const AgentActivityChart = ({ runsSpark, latencySpark }) => {
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
  const linePath = "M" + latencyPoints.map(p => p.join(',')).join(' L');
  const areaPath = linePath + ` L${P + (latencySpark.length - 1) * stepX},${H - P} L${P},${H - P} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{display: 'block'}} preserveAspectRatio="none">
      <defs>
        <linearGradient id="lat-grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%"  stopColor="hsl(var(--primary-bright))" stopOpacity="0.35" />
          <stop offset="100%" stopColor="hsl(var(--primary-bright))" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Horizontal grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
        const y = P + p * (H - P * 2);
        return <line key={i} x1={P} x2={W - P} y1={y} y2={y}
                     stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray={i === 0 || i === 4 ? '' : '2 4'} />;
      })}

      {/* Y axis labels (left = latency, right = runs) */}
      {[0.0, 0.5, 1.0].map(p => {
        const y = H - P - p * (H - P * 2);
        return (
          <React.Fragment key={p}>
            <text x={P - 6} y={y + 3} fontSize="9" textAnchor="end"
                  fill="hsl(var(--muted-foreground))" fontFamily="var(--font-mono)">
              {formatDuration(minL + p * (maxL - minL))}
            </text>
            <text x={W - P + 6} y={y + 3} fontSize="9" textAnchor="start"
                  fill="hsl(var(--muted-foreground))" fontFamily="var(--font-mono)">
              {Math.round(p * maxR)}
            </text>
          </React.Fragment>
        );
      })}

      {/* Run bars */}
      {runsSpark.map((v, i) => {
        const x = P + i * (barW + 2);
        const h = (v / maxR) * (H - P * 2);
        return <rect key={i} x={x} y={H - P - h} width={barW} height={h}
                     fill="hsl(var(--primary) / 0.25)" rx="1" />;
      })}

      {/* Latency line + area */}
      <path d={areaPath} fill="url(#lat-grad)" />
      <path d={linePath} fill="none" stroke="hsl(var(--primary-bright))" strokeWidth="1.6"
            strokeLinecap="round" strokeLinejoin="round" />
      {latencyPoints.filter((_, i) => i % 4 === 0).map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.5" fill="hsl(var(--background))" stroke="hsl(var(--primary-bright))" strokeWidth="1.5" />
      ))}

      {/* X axis (hour labels) */}
      {[0, 6, 12, 18, 23].map(h => {
        const x = P + h * stepX;
        return <text key={h} x={x} y={H - 8} fontSize="9" textAnchor="middle"
                     fill="hsl(var(--muted-foreground))" fontFamily="var(--font-mono)">
                 {String(h).padStart(2,'0')}:00
               </text>;
      })}
    </svg>
  );
};

const AgentSnippet = ({ agent }) => {
  const code = `// Send OTLP traces from ${agent.framework}
import { ChorusObserve } from '@chorus/observe';

const observe = new ChorusObserve({
  endpoint: 'https://otlp.chorus.observe/v1/traces',
  projectToken: process.env.CHORUS_TOKEN,
});

observe.instrument({
  agentId: '${agent.id}',
  framework: '${agent.framework.toLowerCase()}',
  version: '${agent.version}',
});`;
  return (
    <Card>
      <CardHeader title="Integration" sub="Drop this in your agent runtime"
        right={<Button size="sm" variant="outline" icon={I.Copy}>Copy</Button>} />
      <div className="card-pad">
        <pre className="code-block" style={{maxHeight: 'none'}}>{code}</pre>
      </div>
    </Card>
  );
};

const AgentOverviewTab = ({ agent }) => (
  <div className="col" style={{gap: 18}}>
    <Card>
      <CardHeader title="Activity" sub="Runs + latency · last 24h" right={
        <div className="row" style={{gap: 12, fontSize: 11, color: 'hsl(var(--muted-foreground))'}}>
          <span className="row" style={{gap: 5}}>
            <span style={{width: 10, height: 10, borderRadius: 2, background: 'hsl(var(--primary) / 0.35)'}} />
            Runs
          </span>
          <span className="row" style={{gap: 5}}>
            <span style={{width: 14, height: 2, background: 'hsl(var(--primary-bright))'}} />
            p95 latency
          </span>
        </div>
      } />
      <div className="card-pad" style={{paddingTop: 10}}>
        <div style={{height: 220}}>
          <AgentActivityChart runsSpark={agent.runs24hSpark} latencySpark={agent.latencySpark} />
        </div>
      </div>
    </Card>

    <div className="split-2">
      <Card>
        <CardHeader title="Tool usage" sub={`${agent.tools.length} tools registered`} />
        <div>
          {agent.tools.length === 0 ? (
            <div className="card-pad mute" style={{fontSize: 12, padding: '24px 20px'}}>This agent makes no tool calls.</div>
          ) : agent.tools.map((t, i) => {
            const maxCalls = Math.max(...agent.tools.map(x => x.calls));
            return (
              <div key={t.name} style={{
                display: 'grid',
                gridTemplateColumns: '1fr 70px 50px',
                gap: 12,
                alignItems: 'center',
                padding: '12px 20px',
                borderTop: i === 0 ? 'none' : '1px solid hsl(var(--border))',
              }}>
                <div style={{minWidth: 0}}>
                  <div className="row" style={{gap: 8}}>
                    <I.Wrench size={11} style={{color: 'hsl(var(--tool))'}} />
                    <code className="mono" style={{fontSize: 12, fontWeight: 500}}>{t.name}()</code>
                  </div>
                  <div style={{marginTop: 6, height: 4, background: 'hsl(var(--muted) / 0.5)', borderRadius: 2, overflow: 'hidden'}}>
                    <div style={{width: `${(t.calls / maxCalls) * 100}%`, height: '100%', background: 'hsl(var(--tool))', opacity: 0.85}} />
                  </div>
                </div>
                <div className="mono tabular mute" style={{textAlign: 'right', fontSize: 11}}>{formatDuration(t.p95)}</div>
                <div className="mono tabular" style={{textAlign: 'right', fontSize: 11,
                       color: t.errRate > 0.02 ? 'hsl(var(--error))' : t.errRate > 0 ? 'hsl(var(--warning))' : 'hsl(var(--muted-foreground))'}}>
                  {(t.errRate * 100).toFixed(2)}%
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <CardHeader title="Model distribution" sub="By share of runs" />
        <div className="card-pad" style={{paddingTop: 14}}>
          {/* Stacked bar */}
          <div style={{display: 'flex', height: 24, borderRadius: 4, overflow: 'hidden', marginBottom: 16}}>
            {agent.models.map((m, i) => {
              const c = m.provider === 'openai' ? 'hsl(var(--tool))' :
                        m.provider === 'anthropic' ? 'hsl(var(--guardrail))' :
                        'hsl(var(--llm))';
              return <div key={m.model} style={{width: `${m.pct}%`, background: c, opacity: 0.9}} title={`${m.model} · ${m.pct}%`} />;
            })}
          </div>
          <div className="col" style={{gap: 10}}>
            {agent.models.map(m => {
              const c = m.provider === 'openai' ? 'hsl(var(--tool))' :
                        m.provider === 'anthropic' ? 'hsl(var(--guardrail))' :
                        'hsl(var(--llm))';
              return (
                <div key={m.model} className="row" style={{justifyContent: 'space-between'}}>
                  <div className="row" style={{gap: 8}}>
                    <span style={{width: 8, height: 8, borderRadius: 2, background: c}} />
                    <span className="mono" style={{fontSize: 12, fontWeight: 500}}>{m.model}</span>
                    <span className="mute" style={{fontSize: 10}}>{m.provider}</span>
                  </div>
                  <div className="row" style={{gap: 16, fontSize: 11}}>
                    <span className="mono tabular mute">{m.pct}%</span>
                    <span className="mono tabular" style={{fontWeight: 500, minWidth: 50, textAlign: 'right'}}>${m.cost.toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  </div>
);

const AgentRunsTab = ({ agent, setRoute }) => {
  const agentRuns = RUNS.filter(r => r.agent === agent.id);
  return (
    <Card style={{overflow: 'hidden'}}>
      <div className="card-h">
        <div className="card-title"><span className="h-bullet" />Recent runs</div>
        <Button size="sm" variant="outline" icon={I.ArrowRight}
          onClick={() => setRoute({ kind: 'runs' })}>All runs from this agent</Button>
      </div>
      {agentRuns.length === 0 ? (
        <div className="card-pad mute" style={{fontSize: 12, padding: '24px 20px'}}>No recent runs.</div>
      ) : (
        <table className="runs-table">
          <thead>
            <tr>
              <th style={{width: 80}}>Status</th>
              <th>Run ID</th>
              <th>Model</th>
              <th style={{width: 100}}>Span mix</th>
              <th className="r" style={{width: 70}}>Tokens</th>
              <th className="r" style={{width: 70}}>Cost</th>
              <th className="r" style={{width: 70}}>Latency</th>
              <th className="r" style={{width: 80}}>Started</th>
              <th style={{width: 28}} />
            </tr>
          </thead>
          <tbody>
            {agentRuns.map(r => (
              <tr key={r.id} onClick={() => setRoute({ kind: 'runDetail', runId: r.id })}>
                <td><StatusBadge status={r.status} /></td>
                <td className="row-id">run_{r.id.slice(0, 18)}…</td>
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
      )}
    </Card>
  );
};

const AgentDeploymentsTab = ({ agent }) => (
  <Card>
    <CardHeader title="Version history" sub="Most recent first" />
    <div style={{position: 'relative'}}>
      {agent.deployments.map((d, i) => (
        <div key={d.version} style={{
          display: 'grid',
          gridTemplateColumns: '110px 90px 1fr 130px',
          gap: 16,
          alignItems: 'center',
          padding: '14px 20px',
          borderTop: i === 0 ? 'none' : '1px solid hsl(var(--border))',
          position: 'relative',
        }}>
          {/* Vertical timeline rail */}
          <div style={{
            position: 'absolute',
            left: 24, top: 0, bottom: 0,
            width: 1, background: 'hsl(var(--border))',
            zIndex: 0,
          }} />
          <div className="row" style={{position:'relative', zIndex: 1, gap: 10}}>
            <div style={{
              width: 9, height: 9, borderRadius: '50%',
              background: d.state === 'active' ? 'hsl(var(--success))' : 'hsl(var(--muted-foreground) / 0.5)',
              boxShadow: d.state === 'active' ? '0 0 0 4px hsl(var(--success) / 0.18)' : 'none',
              flexShrink: 0, marginLeft: 0,
            }} />
            <code className="mono" style={{fontSize: 13, fontWeight: 600}}>{d.version}</code>
            {d.state === 'active' && <Badge variant="success">live</Badge>}
          </div>
          <div className="mono tabular mute" style={{fontSize: 11}}>{d.when}</div>
          <div style={{minWidth: 0}}>
            <div style={{fontSize: 12.5, fontFamily: 'var(--font-mono)'}}>{d.diff}</div>
            <div className="mute" style={{fontSize: 10, marginTop: 3}}>
              by <span className="mono">{d.by}</span>
            </div>
          </div>
          <div className="row" style={{justifyContent: 'flex-end', gap: 6}}>
            <Button size="sm" variant="ghost" icon={I.GitBranch}>diff</Button>
            {d.state !== 'active' && <Button size="sm" variant="outline">Roll back</Button>}
          </div>
        </div>
      ))}
    </div>
  </Card>
);

const AgentSettingsTab = ({ agent }) => (
  <div className="split-2">
    <Card>
      <CardHeader title="Identity" sub="How this agent shows up everywhere" />
      <div className="card-pad col" style={{gap: 14}}>
        {[
          ['Agent ID',     agent.id,         { mono: true, readonly: true }],
          ['Display name', agent.name],
          ['Description',  agent.description],
          ['Framework',    agent.framework,  { readonly: true }],
          ['Runtime',      agent.runtime,    { mono: true, readonly: true }],
          ['Repository',   agent.repo,       { mono: true }],
          ['Branch',       agent.branch,     { mono: true }],
        ].map(([lbl, v, opts = {}]) => (
          <div key={lbl}>
            <div className="mute" style={{fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 5}}>
              {lbl}
              {opts.readonly && <span style={{marginLeft: 6, opacity: 0.6, textTransform: 'none'}}>· locked</span>}
            </div>
            <input
              className="input"
              style={{
                fontFamily: opts.mono ? 'var(--font-mono)' : 'var(--font-sans)',
                fontSize: opts.mono ? 11.5 : 13,
                color: opts.readonly ? 'hsl(var(--muted-foreground))' : 'hsl(var(--foreground))',
              }}
              defaultValue={v}
              readOnly={opts.readonly}
            />
          </div>
        ))}
      </div>
    </Card>

    <div className="col" style={{gap: 18}}>
      <Card>
        <CardHeader title="Ownership" />
        <div className="card-pad col" style={{gap: 12}}>
          <div className="row" style={{justifyContent: 'space-between'}}>
            <div>
              <div className="mute" style={{fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600}}>Team</div>
              <div style={{fontSize: 13, marginTop: 4, fontFamily: 'var(--font-mono)'}}>{agent.owner}</div>
            </div>
            <div>
              <div className="mute" style={{fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600}}>On-call</div>
              <div style={{fontSize: 13, marginTop: 4}}>{agent.ownerEmail}</div>
            </div>
          </div>
          <div>
            <div className="mute" style={{fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 6}}>Tags</div>
            <div className="row" style={{flexWrap: 'wrap', gap: 6}}>
              {agent.tags.map(t => <span key={t} className="filter-chip">{t}</span>)}
              <button className="filter-chip" style={{borderStyle: 'dashed'}}><I.Plus size={10} />Tag</button>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Retention" sub="Per-agent overrides" />
        <div className="card-pad col" style={{gap: 14}}>
          {[
            ['Traces',  '30 days', 0.7],
            ['LLM I/O', '14 days', 0.45],
            ['Tool I/O','30 days', 0.7],
          ].map(([k, v, p]) => (
            <div key={k} className="col" style={{gap: 4}}>
              <div className="row" style={{justifyContent: 'space-between', fontSize: 12}}>
                <span>{k}</span>
                <span className="mono tabular mute">{v}</span>
              </div>
              <div style={{height: 4, background: 'hsl(var(--muted) / 0.5)', borderRadius: 2, overflow: 'hidden'}}>
                <div style={{width: `${p * 100}%`, height: '100%', background: 'hsl(var(--primary))'}} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="card-pad col" style={{gap: 10}}>
          <div className="row">
            <I.AlertCircle size={14} style={{color: 'hsl(var(--error))'}} />
            <span style={{fontSize: 13, fontWeight: 600}}>Danger zone</span>
          </div>
          <div className="mute" style={{fontSize: 11.5}}>
            Pausing stops ingest for this agent. Deletion removes it from the workspace; traces are retained per policy.
          </div>
          <div className="row" style={{gap: 8, marginTop: 4}}>
            <Button variant="outline" icon={I.Pause}>Pause ingest</Button>
            <Button variant="danger" icon={I.X}>Delete agent</Button>
          </div>
        </div>
      </Card>
    </div>
  </div>
);

const AgentAlertsTab = ({ agent }) => (
  <div className="col" style={{gap: 12}}>
    {agent.alerts.length === 0 ? (
      <Card>
        <div className="card-pad" style={{padding: '40px 24px', textAlign: 'center'}}>
          <I.Check size={28} style={{color: 'hsl(var(--success))', opacity: 0.6}} />
          <div style={{marginTop: 10, fontSize: 13, fontWeight: 500}}>No active alerts</div>
          <div className="mute" style={{fontSize: 11.5, marginTop: 4}}>
            Detectors are green across runs, cost, and latency.
          </div>
        </div>
      </Card>
    ) : agent.alerts.map((a, i) => (
      <Card key={i}>
        <div className="card-pad row" style={{gap: 14, alignItems: 'flex-start'}}>
          <div style={{
            width: 32, height: 32, borderRadius: 6,
            background: `hsl(var(--${a.sev === 'error' ? 'error' : 'warning'}) / 0.15)`,
            color: `hsl(var(--${a.sev === 'error' ? 'error' : 'warning'}))`,
            display: 'grid', placeItems: 'center', flexShrink: 0,
          }}>
            <I.AlertCircle size={16} />
          </div>
          <div style={{flex: 1}}>
            <div className="row" style={{gap: 8}}>
              <span style={{fontSize: 13, fontWeight: 600}}>{a.title}</span>
              <Badge variant={a.sev === 'error' ? 'error' : 'warning'} dot>firing</Badge>
            </div>
            <div className="mute" style={{fontSize: 11.5, marginTop: 4}}>Triggered {a.when}</div>
          </div>
          <Button variant="outline" size="sm">Silence 1h</Button>
          <Button variant="ghost" size="sm" icon={I.ExternalLink}>Investigate</Button>
        </div>
      </Card>
    ))}
  </div>
);

const AgentDetailPage = ({ agentId, setRoute }) => {
  const agent = AGENTS.find(a => a.id === agentId) || AGENTS[0];
  const [tab, setTab] = React.useState('overview');
  const [paused, setPaused] = React.useState(false);

  const stats = [
    { lbl: 'Runs (24h)',  val: formatTokens(agent.runs24h),       sub: `${(agent.runs24h / 24 / 60).toFixed(1)}/min avg`,        spark: agent.runs24hSpark,   color: 'hsl(var(--primary-bright))' },
    { lbl: 'p95 latency', val: formatDuration(agent.latencyP95),  sub: `p50 ${formatDuration(agent.latencyP50)} · p99 ${formatDuration(agent.latencyP99)}`, spark: agent.latencySpark, color: 'hsl(var(--tool))' },
    { lbl: 'Cost (24h)',  val: '$' + agent.cost24h.toFixed(2),    sub: `$${(agent.cost24h / agent.runs24h * 1000).toFixed(3)}/1k runs`,                     spark: agent.costSpark,     color: 'hsl(var(--guardrail))' },
    { lbl: 'Error rate',  val: agent.errorRate.toFixed(2) + '%',  sub: `${agent.errors24h} errors`,                                                          spark: agent.errorSpark,    color: agent.errorRate > 1 ? 'hsl(var(--error))' : 'hsl(var(--llm))' },
  ];

  return (
    <div className="page">
      <div className="row" style={{cursor: 'pointer', width: 'fit-content', fontSize: 12, color: 'hsl(var(--muted-foreground))', marginBottom: 16}}
           onClick={() => setRoute({ kind: 'agents' })}>
        <I.ArrowLeft size={13} /> All agents
      </div>

      <div className="page-h" style={{alignItems: 'flex-start'}}>
        <div style={{minWidth: 0, flex: 1}}>
          <div className="row" style={{gap: 12, flexWrap: 'wrap'}}>
            <div style={{
              width: 40, height: 40, borderRadius: 8, flexShrink: 0,
              background: `hsl(var(--${agent.status === 'healthy' ? 'tool' : agent.status === 'degraded' ? 'warning' : 'error'}) / 0.18)`,
              color: `hsl(var(--${agent.status === 'healthy' ? 'tool' : agent.status === 'degraded' ? 'warning' : 'error'}))`,
              display: 'grid', placeItems: 'center',
            }}>
              <I.Cpu size={20} />
            </div>
            <div style={{minWidth: 0}}>
              <h1 className="page-title" style={{fontSize: 26, lineHeight: 1.05}}>{agent.name}</h1>
              <div className="row" style={{gap: 8, marginTop: 6, flexWrap: 'wrap', fontSize: 11.5}}>
                <code className="mono mute">{agent.id}</code>
                <span className="mute">·</span>
                <span className="mono mute">{agent.version}</span>
                <span className="mute">·</span>
                <span className="mute">deployed {formatRel(agent.deployedAt)} by <code className="mono">{agent.deployedBy}</code></span>
              </div>
            </div>
          </div>

          <div className="row" style={{gap: 8, marginTop: 12, flexWrap: 'wrap'}}>
            <Badge variant={statusToVariant(agent.status)} dot>{agent.status}</Badge>
            {paused && <Badge variant="warning" dot>paused</Badge>}
            <Badge variant="muted"><I.GitBranch size={9} />{agent.framework}</Badge>
            <Badge variant="muted"><I.Server size={9} />{agent.runtime}</Badge>
            <Badge variant="primary"><I.Cpu size={9} />{agent.owner}</Badge>
            {agent.tags.map(t => <Badge key={t} variant="muted">{t}</Badge>)}
          </div>
        </div>

        <div className="row" style={{gap: 6}}>
          <Button variant="outline" icon={I.RefreshCw}>Replay last run</Button>
          <Button variant={paused ? 'primary' : 'outline'} icon={paused ? I.PlayCircle : I.Pause}
                  onClick={() => setPaused(p => !p)}>
            {paused ? 'Resume' : 'Pause'}
          </Button>
          <Button variant="outline" icon={I.ExternalLink}>Repo</Button>
        </div>
      </div>

      {/* Stat rail with sparklines */}
      <div className="metric-rail" style={{marginBottom: 18}}>
        {stats.map((s, i) => (
          <div key={i} className="metric">
            <div className="m-lbl">{s.lbl}</div>
            <div className="m-val">{s.val}</div>
            <div className="mute" style={{fontSize: 10, marginTop: 6, fontFamily: 'var(--font-mono)'}}>{s.sub}</div>
            <div className="m-spark"><Sparkline data={s.spark} color={s.color} fill={`${s.color.replace(')', ' / 0.15)')}`} /></div>
          </div>
        ))}
      </div>

      <div className="tabs" style={{marginBottom: 16}}>
        {[
          ['overview',     'Overview',     null,                       I.Activity],
          ['runs',         'Runs',         RUNS.filter(r => r.agent === agent.id).length, I.List],
          ['deployments',  'Deployments',  agent.deployments.length,   I.GitBranch],
          ['integration',  'Integration',  null,                       I.Server],
          ['alerts',       'Alerts',       agent.alerts.length || null,I.Bell],
          ['settings',     'Settings',     null,                       I.Settings],
        ].map(([key, label, count, Ic]) => (
          <div key={key} className={`tab ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>
            <Ic size={12} />
            {label}
            {count != null && <span className="count">{count}</span>}
          </div>
        ))}
      </div>

      {tab === 'overview'    && <AgentOverviewTab agent={agent} />}
      {tab === 'runs'        && <AgentRunsTab agent={agent} setRoute={setRoute} />}
      {tab === 'deployments' && <AgentDeploymentsTab agent={agent} />}
      {tab === 'integration' && <AgentSnippet agent={agent} />}
      {tab === 'alerts'      && <AgentAlertsTab agent={agent} />}
      {tab === 'settings'    && <AgentSettingsTab agent={agent} />}
    </div>
  );
};

/* ── Agent Register flow ──────────────────────────────── */

const AgentRegisterPage = ({ setRoute }) => {
  const [step, setStep] = React.useState(1);
  const [form, setForm] = React.useState({
    name: '',
    id: '',
    description: '',
    framework: 'chorus',
    owner: 'platform',
    tags: [],
    sampleRate: 100,
  });
  const [tagInput, setTagInput] = React.useState('');
  const [pinging, setPinging] = React.useState(false);
  const [connected, setConnected] = React.useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const addTag = (t) => {
    const v = (t || tagInput).trim();
    if (!v || form.tags.includes(v)) return;
    setForm(f => ({ ...f, tags: [...f.tags, v] }));
    setTagInput('');
  };
  const removeTag = (t) => setForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) }));

  /* Auto-derive id from name */
  React.useEffect(() => {
    if (step === 1 && !form.id) {
      const id = 'ag_' + form.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 32);
      if (id !== 'ag_') set('id', id);
    }
  }, [form.name]);

  const fw = AGENT_FRAMEWORKS.find(f => f.id === form.framework);

  const codeSnippets = {
    chorus: `# Python — Chorus Engine
from chorus import Agent, Tracer

tracer = Tracer(
    project_token="<CHORUS_TOKEN>",
    agent_id="${form.id || 'ag_my_agent'}",
)

agent = Agent(name="${form.name || 'my-agent'}", tracer=tracer)
agent.run("Hello, world.")`,
    langgraph: `# Python — LangGraph + OTLP
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from langgraph.graph import StateGraph

trace.set_tracer_provider(TracerProvider(resource=Resource.create({
  "agent.id":        "${form.id || 'ag_my_agent'}",
  "agent.framework": "langgraph",
})))
trace.get_tracer_provider().add_span_processor(BatchSpanProcessor(
  OTLPSpanExporter(endpoint="https://otlp.chorus.observe/v1/traces",
                   headers={"chorus-token": "<CHORUS_TOKEN>"})
))`,
    langchain: `# Python — LangChain
import os
os.environ["CHORUS_TOKEN"]    = "<CHORUS_TOKEN>"
os.environ["CHORUS_AGENT_ID"] = "${form.id || 'ag_my_agent'}"

from chorus.langchain import attach_callbacks
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4o-mini",
                 callbacks=attach_callbacks(framework="langchain"))`,
    llamaidx: `# Python — LlamaIndex
from llama_index.core import set_global_handler
set_global_handler("chorus", project_token="<CHORUS_TOKEN>",
                   agent_id="${form.id || 'ag_my_agent'}")`,
    crewai: `# Python — CrewAI
from chorus.crewai import instrument
instrument(project_token="<CHORUS_TOKEN>",
           agent_id="${form.id || 'ag_my_agent'}")`,
    otlp: `# Direct OTLP — any language
curl -X POST https://otlp.chorus.observe/v1/traces \\
  -H "chorus-token: <CHORUS_TOKEN>" \\
  -H "content-type: application/json" \\
  -d '{
    "resourceSpans": [{
      "resource": { "attributes": [
        { "key": "agent.id", "value": { "stringValue": "${form.id || 'ag_my_agent'}" } }
      ]},
      "scopeSpans": [{ "spans": [...] }]
    }]
  }'`,
  };
  const code = codeSnippets[form.framework] || codeSnippets.otlp;

  const canStep2 = form.name.trim() && form.id.trim();

  const handlePing = () => {
    setPinging(true);
    setTimeout(() => { setPinging(false); setConnected(true); }, 1800);
  };

  return (
    <div className="page" style={{maxWidth: 1080}}>
      <div className="row" style={{cursor: 'pointer', width: 'fit-content', fontSize: 12, color: 'hsl(var(--muted-foreground))', marginBottom: 16}}
           onClick={() => setRoute({ kind: 'agents' })}>
        <I.ArrowLeft size={13} /> Agents
      </div>

      <div className="page-h">
        <div>
          <h1 className="page-title">Register agent</h1>
          <div className="page-sub">Get a new agent emitting traces into Chorus Observe.</div>
        </div>
      </div>

      {/* Stepper */}
      <div className="row" style={{gap: 0, marginBottom: 22, padding: 0}}>
        {[
          ['Identity',     '1'],
          ['Framework',    '2'],
          ['Verify',       '3'],
        ].map(([lbl, n], i, arr) => {
          const idx = i + 1;
          const done = idx < step, active = idx === step;
          return (
            <React.Fragment key={lbl}>
              <div className="row" style={{gap: 10, opacity: idx > step ? 0.5 : 1, cursor: idx <= step ? 'pointer' : 'default'}}
                   onClick={() => idx <= step && setStep(idx)}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: done ? 'hsl(var(--success))' : active ? 'hsl(var(--primary))' : 'transparent',
                  border: active || done ? 'none' : '1px solid hsl(var(--border-bright))',
                  color: done || active ? 'white' : 'hsl(var(--muted-foreground))',
                  display: 'grid', placeItems: 'center',
                  fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)',
                }}>
                  {done ? <I.Check size={13} /> : n}
                </div>
                <span style={{fontSize: 13, fontWeight: active ? 600 : 500,
                              color: active ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))'}}>
                  {lbl}
                </span>
              </div>
              {i < arr.length - 1 && (
                <div style={{flex: 1, height: 1, background: 'hsl(var(--border))', margin: '0 16px',
                             position: 'relative'}}>
                  <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    background: 'hsl(var(--success))',
                    width: idx < step ? '100%' : '0%',
                    transition: 'width 200ms ease',
                  }} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="split-2">
        {/* Step 1: Identity */}
        {step === 1 && (
          <Card>
            <CardHeader title="Identity" sub="What this agent is called, who owns it" />
            <div className="card-pad col" style={{gap: 16}}>
              <FormField label="Display name" hint="A human-readable name. Shows up in lists and breadcrumbs.">
                <input className="input" placeholder="Observability Copilot"
                  value={form.name} onChange={(e) => set('name', e.target.value)} />
              </FormField>

              <FormField label="Agent ID" hint="Stable identifier emitted on every span. Cannot change later.">
                <input className="input" placeholder="ag_observability_copilot"
                  style={{fontFamily: 'var(--font-mono)', fontSize: 12}}
                  value={form.id}
                  onChange={(e) => set('id', e.target.value.replace(/[^a-z0-9_]/gi, '').toLowerCase())} />
              </FormField>

              <FormField label="Description" hint="One line — what the agent does.">
                <textarea className="input" rows={2}
                  style={{height: 'auto', padding: 10, resize: 'vertical', fontFamily: 'var(--font-sans)', fontSize: 13}}
                  placeholder="Answers questions about agent traces, costs, and guardrails."
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)} />
              </FormField>

              <div className="split-3" style={{gridTemplateColumns: '1fr 1fr', gap: 16}}>
                <FormField label="Owner team">
                  <select className="input" value={form.owner} onChange={(e) => set('owner', e.target.value)}>
                    <option value="platform">platform</option>
                    <option value="research">research</option>
                    <option value="safety">safety</option>
                    <option value="growth">growth</option>
                  </select>
                </FormField>
                <FormField label="Sampling rate" hint="% of runs to ingest.">
                  <div className="row" style={{gap: 10}}>
                    <input type="range" min="1" max="100" value={form.sampleRate}
                      onChange={(e) => set('sampleRate', +e.target.value)}
                      style={{flex: 1, accentColor: 'hsl(var(--primary))'}} />
                    <span className="mono tabular" style={{minWidth: 38, fontSize: 13, fontWeight: 600}}>
                      {form.sampleRate}%
                    </span>
                  </div>
                </FormField>
              </div>

              <FormField label="Tags" hint="Press enter to add.">
                <div className="row" style={{flexWrap: 'wrap', gap: 6,
                  padding: 6, border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-md)', background: 'hsl(var(--card))', minHeight: 36}}>
                  {form.tags.map(t => (
                    <span key={t} className="filter-chip active" style={{cursor: 'default'}}>
                      {t}
                      <button onClick={() => removeTag(t)} style={{marginLeft: 2, opacity: 0.7}}>
                        <I.X size={10} />
                      </button>
                    </span>
                  ))}
                  <input
                    style={{flex: 1, minWidth: 80, border: 0, outline: 'none', background: 'transparent',
                      fontSize: 12, padding: '0 4px', color: 'hsl(var(--foreground))'}}
                    placeholder={form.tags.length === 0 ? 'copilot, internal…' : ''}
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); }
                      else if (e.key === 'Backspace' && !tagInput && form.tags.length) {
                        removeTag(form.tags[form.tags.length - 1]);
                      }
                    }}
                  />
                </div>
              </FormField>
            </div>
            <div className="card-h" style={{borderTop: '1px solid hsl(var(--border))', borderBottom: 'none'}}>
              <Button variant="ghost" onClick={() => setRoute({ kind: 'agents' })}>Cancel</Button>
              <Button variant="primary" disabled={!canStep2} onClick={() => setStep(2)}>
                Continue <I.ArrowRight size={13} />
              </Button>
            </div>
          </Card>
        )}

        {/* Step 2: Framework */}
        {step === 2 && (
          <Card>
            <CardHeader title="Framework" sub="How traces will reach Chorus Observe" />
            <div className="card-pad col" style={{gap: 16}}>
              <FormField label="Pick your stack">
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8}}>
                  {AGENT_FRAMEWORKS.map(f => (
                    <button key={f.id}
                      onClick={() => set('framework', f.id)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-md)',
                        border: `1px solid hsl(var(--${form.framework === f.id ? 'primary' : 'border'}) / ${form.framework === f.id ? 0.6 : 1})`,
                        background: form.framework === f.id ? 'hsl(var(--primary) / 0.08)' : 'hsl(var(--card))',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 120ms ease',
                      }}>
                      <div className="row" style={{justifyContent: 'space-between'}}>
                        <span style={{fontSize: 13, fontWeight: 600,
                          color: form.framework === f.id ? 'hsl(var(--primary-bright))' : 'hsl(var(--foreground))'}}>{f.name}</span>
                        {form.framework === f.id && <I.Check size={13} style={{color: 'hsl(var(--primary-bright))'}} />}
                      </div>
                      <div className="mute mono" style={{fontSize: 10.5, marginTop: 4}}>{f.sub}</div>
                    </button>
                  ))}
                </div>
              </FormField>

              <FormField label="Generated project token" hint="Use this in your CHORUS_TOKEN env var.">
                <div className="row" style={{gap: 6}}>
                  <input className="input" readOnly
                    style={{fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'hsl(var(--muted-foreground))'}}
                    value={`chs_dev_${(form.id || 'agent').slice(0, 8)}_${Math.random().toString(36).slice(2, 10)}`} />
                  <Button variant="outline" size="sm" icon={I.Copy}>Copy</Button>
                  <Button variant="ghost" size="sm" icon={I.RefreshCw}>Rotate</Button>
                </div>
              </FormField>
            </div>
            <div className="card-h" style={{borderTop: '1px solid hsl(var(--border))', borderBottom: 'none'}}>
              <Button variant="ghost" icon={I.ArrowLeft} onClick={() => setStep(1)}>Back</Button>
              <Button variant="primary" onClick={() => setStep(3)}>
                Continue <I.ArrowRight size={13} />
              </Button>
            </div>
          </Card>
        )}

        {/* Step 3: Verify */}
        {step === 3 && (
          <Card>
            <CardHeader title="Verify"
              sub="Once your agent emits its first span we'll confirm here." />
            <div className="card-pad col" style={{gap: 14}}>
              <div className="row" style={{
                padding: '14px 16px',
                background: connected ? 'hsl(var(--success) / 0.1)' : 'hsl(var(--card-elev))',
                border: `1px solid hsl(var(--${connected ? 'success' : 'border'}) / ${connected ? 0.4 : 1})`,
                borderRadius: 'var(--radius-md)',
                gap: 14,
                alignItems: 'flex-start',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: connected ? 'hsl(var(--success))' : 'hsl(var(--muted) / 0.5)',
                  display: 'grid', placeItems: 'center', flexShrink: 0,
                }}>
                  {connected ? <I.Check size={16} color="white" />
                    : pinging ? <I.RefreshCw size={16} className="mute" style={{animation: 'pulse-dot 1s linear infinite'}} />
                    : <I.Server size={16} className="mute" />}
                </div>
                <div style={{flex: 1}}>
                  <div style={{fontSize: 13, fontWeight: 600}}>
                    {connected ? 'First trace received — agent is live.' :
                     pinging ? 'Listening for the first OTLP span…' :
                     'Waiting for traces.'}
                  </div>
                  <div className="mute" style={{fontSize: 11.5, marginTop: 4}}>
                    {connected ? `${form.id} now appears in the Agents list and starts collecting metrics.`
                              : 'Run the snippet on the right against this workspace.'}
                  </div>
                </div>
                {!connected && (
                  <Button variant="outline" size="sm" disabled={pinging}
                    onClick={handlePing} icon={pinging ? I.RefreshCw : I.PlayCircle}>
                    {pinging ? 'Listening…' : 'Test connection'}
                  </Button>
                )}
              </div>

              <FormField label="Summary">
                <div className="kv-grid" style={{fontFamily: 'var(--font-mono)', fontSize: 11.5}}>
                  <div className="k">name</div>            <div className="v">{form.name || '—'}</div>
                  <div className="k">id</div>              <div className="v">{form.id || '—'}</div>
                  <div className="k">framework</div>       <div className="v">{fw?.name}</div>
                  <div className="k">owner</div>           <div className="v">{form.owner}</div>
                  <div className="k">sampling</div>        <div className="v">{form.sampleRate}%</div>
                  <div className="k">tags</div>            <div className="v">{form.tags.join(', ') || '—'}</div>
                </div>
              </FormField>
            </div>
            <div className="card-h" style={{borderTop: '1px solid hsl(var(--border))', borderBottom: 'none'}}>
              <Button variant="ghost" icon={I.ArrowLeft} onClick={() => setStep(2)}>Back</Button>
              <Button variant="primary" icon={I.Check}
                disabled={!connected}
                onClick={() => setRoute({ kind: 'agents' })}>
                Finish &amp; view agents
              </Button>
            </div>
          </Card>
        )}

        {/* Right column: live snippet */}
        <div className="col" style={{gap: 16}}>
          <Card>
            <div className="card-h">
              <div>
                <div className="card-title"><span className="h-bullet" />Integration snippet</div>
                <div className="card-sub">
                  Live preview · updates as you fill in the form
                </div>
              </div>
              <Button size="sm" variant="outline" icon={I.Copy}>Copy</Button>
            </div>
            <div className="card-pad" style={{padding: 0}}>
              <pre className="code-block"
                style={{maxHeight: 360, borderRadius: 0, border: 0,
                  borderTop: '1px solid hsl(var(--border))', margin: 0}}>{code}</pre>
            </div>
          </Card>

          <Card>
            <div className="card-pad col" style={{gap: 10}}>
              <div className="row" style={{gap: 8}}>
                <I.HelpCircle size={14} style={{color: 'hsl(var(--primary-bright))'}} />
                <span style={{fontSize: 13, fontWeight: 600}}>How sampling works</span>
              </div>
              <div className="mute" style={{fontSize: 11.5, lineHeight: 1.55}}>
                At 100% Chorus ingests every span this agent produces. Lower values
                pick traces uniformly at random — guardrail spans are always kept,
                and any span marked <code className="mono">error</code> bypasses the sampler.
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const FormField = ({ label, hint, children }) => (
  <div className="col" style={{gap: 6}}>
    <div className="row" style={{justifyContent: 'space-between', alignItems: 'baseline'}}>
      <label style={{fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600,
                    color: 'hsl(var(--muted-foreground))'}}>{label}</label>
      {hint && <span className="mute" style={{fontSize: 10.5}}>{hint}</span>}
    </div>
    {children}
  </div>
);

Object.assign(window, { AgentsListPage, AgentDetailPage, AgentRegisterPage });
