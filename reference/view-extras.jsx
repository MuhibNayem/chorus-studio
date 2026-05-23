/* ── Datasets / evaluators / placeholder pages ── */

const DatasetsPage = () => (
  <div className="page">
    <div className="page-h">
      <div>
        <h1 className="page-title">Datasets <span className="accent">/ {DATASETS.length}</span></h1>
        <div className="page-sub">Curated example sets, sliced from production traces.</div>
      </div>
      <div className="row" style={{gap: 8}}>
        <Button variant="outline" icon={I.ExternalLink}>Import CSV</Button>
        <Button variant="primary" icon={I.Plus}>New dataset</Button>
      </div>
    </div>

    <div className="split-2" style={{gridTemplateColumns: 'repeat(2, 1fr)'}}>
      {DATASETS.map(d => (
        <Card key={d.id}>
          <div className="card-pad" style={{display:'flex', flexDirection:'column', gap: 12}}>
            <div className="row" style={{justifyContent: 'space-between', alignItems: 'flex-start'}}>
              <div style={{minWidth: 0, flex: 1}}>
                <div className="row" style={{gap: 8}}>
                  <I.Database size={14} style={{color: 'hsl(var(--rag))'}} />
                  <span style={{fontSize: 14, fontWeight: 600}}>{d.name}</span>
                </div>
                <div className="mono mute" style={{fontSize: 11, marginTop: 4}}>{d.id}</div>
              </div>
              <Badge variant="muted">{d.owner}</Badge>
            </div>

            <div className="row" style={{gap: 16, fontSize: 11, color: 'hsl(var(--muted-foreground))'}}>
              <span><span className="mono tabular" style={{color: 'hsl(var(--foreground))', fontWeight: 600, fontSize: 13}}>{d.examples}</span> examples</span>
              <span>updated {d.updated}</span>
            </div>

            <div className="row" style={{flexWrap: 'wrap', gap: 6}}>
              {d.tags.map(t => <span key={t} className="filter-chip" style={{cursor: 'default', pointerEvents: 'none'}}>{t}</span>)}
            </div>

            <div className="row" style={{marginTop: 4, gap: 6}}>
              <Button size="sm" variant="outline" icon={I.PlayCircle}>Run eval</Button>
              <Button size="sm" variant="ghost" icon={I.Eye}>Browse</Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  </div>
);

const EvaluatorsPage = () => (
  <div className="page">
    <div className="page-h">
      <div>
        <h1 className="page-title">Evaluators <span className="accent">/ {EVALUATORS.length}</span></h1>
        <div className="page-sub">Auto-applied to every production trace.</div>
      </div>
      <Button variant="primary" icon={I.Plus}>New evaluator</Button>
    </div>
    <Card>
      <table className="runs-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Kind</th>
            <th>Score (24h)</th>
            <th className="r">Runs evaluated</th>
            <th className="r">Status</th>
          </tr>
        </thead>
        <tbody>
          {EVALUATORS.map(e => (
            <tr key={e.id}>
              <td>
                <div className="mono" style={{fontWeight: 500}}>{e.name}</div>
                <div className="mute" style={{fontSize: 10, marginTop: 2, fontFamily: 'var(--font-mono)'}}>{e.id}</div>
              </td>
              <td><Badge variant="muted">{e.kind}</Badge></td>
              <td>
                <div className="row" style={{gap: 10}}>
                  <div style={{width: 120, height: 5, background: 'hsl(var(--muted) / 0.5)', borderRadius: 3, overflow: 'hidden'}}>
                    <div style={{
                      width: `${e.score * 100}%`, height: '100%',
                      background: e.score >= 0.9 ? 'hsl(var(--success))' : e.score >= 0.8 ? 'hsl(var(--primary))' : 'hsl(var(--warning))',
                    }} />
                  </div>
                  <span className="mono tabular" style={{fontWeight: 600}}>{e.score.toFixed(2)}</span>
                </div>
              </td>
              <td className="r">{e.runs.toLocaleString()}</td>
              <td className="r"><Badge variant={e.score >= 0.85 ? 'success' : 'warning'} dot>{e.score >= 0.85 ? 'Pass' : 'Watch'}</Badge></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  </div>
);

const ProvenancePage = () => (
  <div className="page">
    <div className="page-h">
      <div>
        <h1 className="page-title">Provenance graph</h1>
        <div className="page-sub">All decision paths across the last 24h, deduplicated by structure.</div>
      </div>
      <Button variant="outline" icon={I.RefreshCw}>Recompute</Button>
    </div>
    <ProvenanceDag />
  </div>
);

const ModelsPage = () => (
  <div className="page">
    <div className="page-h">
      <div>
        <h1 className="page-title">Models</h1>
        <div className="page-sub">Cost, latency, and volume by model.</div>
      </div>
    </div>
    <TopModels />
  </div>
);

const AlertsPage = () => (
  <div className="page">
    <div className="page-h">
      <div>
        <h1 className="page-title">Alerts <span className="accent">/ 3 active</span></h1>
        <div className="page-sub">Threshold + anomaly detectors, page on call.</div>
      </div>
      <Button variant="primary" icon={I.Plus}>New alert</Button>
    </div>
    <div className="col" style={{gap: 12}}>
      {[
        { sev: 'error',   title: 'Error rate > 5% on ag_research',    sub: 'Triggered 12m ago · claude-3-5-sonnet · 132 of 2k runs', evt: 'firing' },
        { sev: 'warning', title: 'p95 latency > 5s on ag_research',   sub: 'Triggered 38m ago · degrading since 14:20', evt: 'firing' },
        { sev: 'warning', title: 'Spend pacing > $400/d',             sub: 'Triggered 2h ago · projected $487 by midnight', evt: 'firing' },
        { sev: 'success', title: 'Guardrail toxicity@v3 — all green', sub: 'Resolved 4h ago · auto-cleared', evt: 'resolved' },
      ].map((a, i) => (
        <Card key={i}>
          <div className="card-pad row" style={{gap: 14, alignItems: 'flex-start'}}>
            <div style={{
              width: 32, height: 32, borderRadius: 6,
              background: `hsl(var(--${a.sev === 'error' ? 'error' : a.sev === 'warning' ? 'warning' : 'success'}) / 0.15)`,
              color: `hsl(var(--${a.sev === 'error' ? 'error' : a.sev === 'warning' ? 'warning' : 'success'}))`,
              display: 'grid', placeItems: 'center', flexShrink: 0,
            }}>
              <I.AlertCircle size={16} />
            </div>
            <div style={{flex: 1, minWidth: 0}}>
              <div className="row" style={{gap: 8}}>
                <span style={{fontSize: 13, fontWeight: 600}}>{a.title}</span>
                <Badge variant={a.evt === 'firing' ? 'error' : 'success'} dot>{a.evt}</Badge>
              </div>
              <div className="mute" style={{fontSize: 11.5, marginTop: 4}}>{a.sub}</div>
            </div>
            <Button variant="outline" size="sm">Silence 1h</Button>
            <Button variant="ghost" size="sm" icon={I.ExternalLink}>Open</Button>
          </div>
        </Card>
      ))}
    </div>
  </div>
);

const SettingsPage = () => (
  <div className="page">
    <div className="page-h">
      <div>
        <h1 className="page-title">Settings</h1>
        <div className="page-sub">Configure Chorus Observe ingest, retention, and notifications.</div>
      </div>
    </div>
    <div className="split-2">
      <Card>
        <CardHeader title="OTLP endpoint" sub="Send traces to Chorus Observe." />
        <div className="card-pad col" style={{gap: 12}}>
          <div>
            <div className="mute" style={{fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 4}}>HTTP</div>
            <code className="code-block" style={{padding: 10, fontSize: 11, maxHeight: 40}}>https://otlp.chorus.observe/v1/traces</code>
          </div>
          <div>
            <div className="mute" style={{fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 4}}>gRPC</div>
            <code className="code-block" style={{padding: 10, fontSize: 11, maxHeight: 40}}>otlp.chorus.observe:4317</code>
          </div>
          <div>
            <div className="mute" style={{fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 4}}>Project token</div>
            <code className="code-block" style={{padding: 10, fontSize: 11, maxHeight: 40}}>chs_prod_8f3c•••••••••••••61cc</code>
          </div>
        </div>
      </Card>
      <Card>
        <CardHeader title="Retention" sub="Hot storage windows by tier" />
        <div className="card-pad col" style={{gap: 14}}>
          {[
            ['Traces',     '30 days', 0.7],
            ['LLM I/O',    '14 days', 0.45],
            ['Tool I/O',   '30 days', 0.7],
            ['Annotations','forever', 1.0],
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
    </div>
  </div>
);

Object.assign(window, {
  DatasetsPage, EvaluatorsPage, ProvenancePage, ModelsPage, AlertsPage, SettingsPage,
});
