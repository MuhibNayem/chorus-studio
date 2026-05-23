/* ── Run detail — header, metric rail, waterfall, inspector ── */

const spanIcon = { llm: I.Sparkles, tool: I.Wrench, guardrail: I.Shield, rag: I.Database, default: I.Layers };

const buildTree = (spans) => {
  const byParent = new Map();
  for (const s of spans) {
    const p = s.parent;
    if (!byParent.has(p)) byParent.set(p, []);
    byParent.get(p).push(s);
  }
  const out = [];
  const walk = (parent, depth, isLast, ancestorsLast) => {
    const list = byParent.get(parent) ?? [];
    list.forEach((s, i) => {
      const last = i === list.length - 1;
      out.push({ span: s, depth, isLast: last, ancestorsLast: [...ancestorsLast, isLast] });
      walk(s.id, depth + 1, last, [...ancestorsLast, isLast]);
    });
  };
  walk(null, 0, true, []);
  return out;
};

const Waterfall = ({ run, spans, selected, setSelected }) => {
  const t0 = new Date(run.started).getTime();
  const total = run.latency;
  const flat = React.useMemo(() => buildTree(spans), [spans]);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(p => Math.round(total * p));

  return (
    <Card style={{overflow: 'hidden'}}>
      <div className="wf-toolbar">
        <div className="row" style={{gap: 8}}>
          <Button variant="outline" size="sm" icon={I.ChevronsUpDown}>Collapse all</Button>
          <Button variant="ghost" size="sm" icon={I.Eye}>Critical path</Button>
        </div>
        <div className="legend">
          {['llm', 'tool', 'rag', 'guardrail'].map(t => (
            <div key={t} className="leg">
              <span className="sw" style={{background: `hsl(var(--${t}))`}} />
              <span style={{textTransform: 'capitalize'}}>{t}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="wf-axis">
        <div>Span</div>
        <div className="ticks">
          {ticks.map((t, i) => (
            <span key={i} className="mono tabular">{formatDuration(t)}</span>
          ))}
        </div>
        <div style={{textAlign: 'right'}}>Duration</div>
        <div />
      </div>

      <div>
        {flat.map(({ span, depth, ancestorsLast }) => {
          const start = new Date(span.start).getTime();
          const end = new Date(span.end).getTime();
          const offset = ((start - t0) / total) * 100;
          const width = ((end - start) / total) * 100;
          const isSel = selected?.id === span.id;
          const Ic = spanIcon[span.type] || spanIcon.default;
          const ft = span.firstToken ? ((new Date(span.firstToken).getTime() - start) / (end - start)) * 100 : null;

          /* Build ascii tree connectors */
          const indent = ancestorsLast.slice(1).map((al, i) => al ? '   ' : '│  ').join('');
          const connector = depth === 0 ? '' : (ancestorsLast[ancestorsLast.length - 1] ? '└─ ' : '├─ ');

          return (
            <div key={span.id}
                 className={`wf-row ${isSel ? 'selected' : ''}`}
                 onClick={() => setSelected(isSel ? null : span)}>
              <div className="wf-name">
                <span className="tree-line">{indent}{connector}</span>
                <Ic size={11} style={{color: `hsl(var(--${span.type === 'default' ? 'muted-foreground' : span.type}))`, flexShrink: 0}} />
                <span className="label">{span.name}</span>
              </div>
              <div className="wf-track">
                <div className={`wf-bar ${span.type}`}
                     style={{
                       left: `${Math.max(0, offset)}%`,
                       width: `${Math.max(width, 0.5)}%`,
                     }}>
                  {width > 8 && (
                    <span style={{textShadow:'0 1px 2px rgb(0 0 0 / 0.3)'}}>
                      {formatDuration(end - start)}
                    </span>
                  )}
                  {ft != null && (
                    <span className="first-token" style={{ left: `${ft}%` }} title="first token" />
                  )}
                </div>
              </div>
              <div className="wf-dur">{formatDuration(end - start)}</div>
              <div className="wf-icon">
                {span.status === 'OK'
                  ? <I.Check size={12} style={{color: 'hsl(var(--success))'}} />
                  : <I.AlertCircle size={12} style={{color: 'hsl(var(--error))'}} />}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

const SpanInspector = ({ span, onClose, llmCall, toolCall }) => {
  const Ic = spanIcon[span.type] || spanIcon.default;
  const dur = new Date(span.end).getTime() - new Date(span.start).getTime();
  return (
    <Card>
      <div className="detail-drawer">
        <div className="dr-head">
          <SpanTypeBadge type={span.type} />
          <span className="mono" style={{fontSize: 13, fontWeight: 600}}>{span.name}</span>
          <Badge variant={span.status === 'OK' ? 'success' : 'error'} dot>{span.status}</Badge>
          <span className="mute mono tabular" style={{fontSize: 11}}>· {formatDuration(dur)}</span>
          <span className="dr-close">
            <IconBtn icon={I.X} label="Close" onClick={onClose} />
          </span>
        </div>

        <div className="row" style={{gap: 6, marginBottom: 14, flexWrap: 'wrap'}}>
          <span className="mute mono" style={{fontSize: 10}}>SPAN_ID</span>
          <code className="mono" style={{fontSize: 11}}>{span.id}</code>
          <span className="mute" style={{fontSize: 10}}>·</span>
          <span className="mute mono" style={{fontSize: 10}}>PARENT</span>
          <code className="mono" style={{fontSize: 11}}>{span.parent || '∅'}</code>
        </div>

        <div className="row" style={{fontSize: 10, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, fontWeight: 600}}>
          Attributes
        </div>
        <div className="kv-grid">
          {Object.entries(span.attrs).map(([k, v]) => (
            <React.Fragment key={k}>
              <div className="k">{k}</div>
              <div className="v">{typeof v === 'string' && v.length > 80 ? <code>{v.slice(0, 80)}…</code> : String(v)}</div>
            </React.Fragment>
          ))}
        </div>

        {llmCall && (
          <>
            <div className="row" style={{fontSize: 10, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 14, marginBottom: 6, fontWeight: 600, justifyContent: 'space-between'}}>
              <span>Prompt / Completion</span>
              <span className="mono tabular" style={{textTransform:'none', letterSpacing: 0, fontWeight: 500}}>
                {formatTokens(llmCall.input)} in → {formatTokens(llmCall.output)} out · {formatCost(llmCall.cost)}
              </span>
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
              {llmCall.messages.map((m, i) => (
                <pre key={i} className="code-block">
                  <span className={m.role === 'system' ? 'system' : 'role'}>{m.role}:</span> {m.text}
                </pre>
              ))}
              <pre className="code-block" style={{borderColor: 'hsl(var(--primary) / 0.4)', background: 'hsl(var(--primary) / 0.05)'}}>
                <span className="role">assistant:</span> {llmCall.completion}
              </pre>
            </div>
          </>
        )}

        {toolCall && (
          <>
            <div className="row" style={{fontSize: 10, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 14, marginBottom: 6, fontWeight: 600}}>
              Tool call · <code className="mono" style={{textTransform:'none', letterSpacing: 0}}>{toolCall.name}</code>
            </div>
            <div className="col" style={{gap: 8}}>
              <div>
                <div className="mute" style={{fontSize: 10, marginBottom: 4}}>arguments</div>
                <pre className="code-block">{JSON.stringify(toolCall.args, null, 2)}</pre>
              </div>
              <div>
                <div className="mute" style={{fontSize: 10, marginBottom: 4}}>result</div>
                <pre className="code-block">{typeof toolCall.result === 'string' ? toolCall.result : JSON.stringify(toolCall.result, null, 2)}</pre>
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  );
};

const ProvenanceDag = () => {
  const byId = Object.fromEntries(DAG_NODES.map(n => [n.id, n]));
  return (
    <Card>
      <CardHeader title="Provenance" sub="Causal decision graph from Chorus Engine"
        right={<Badge variant="primary">chorus-engine4j</Badge>} />
      <div className="card-pad">
        <div className="dag-canvas">
          <svg viewBox="0 0 800 280" preserveAspectRatio="none" width="100%" height="100%" style={{position: 'absolute', inset: 0}}>
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M0,0 L10,5 L0,10 Z" fill="hsl(var(--muted-foreground) / 0.6)" />
              </marker>
            </defs>
            {DAG_EDGES.map(([a, b], i) => {
              const A = byId[a], B = byId[b];
              const x1 = A.x + 120, y1 = A.y + 18;
              const x2 = B.x, y2 = B.y + 18;
              const mx = (x1 + x2) / 2;
              return (
                <path key={i}
                  d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2 - 6},${y2}`}
                  stroke="hsl(var(--muted-foreground) / 0.55)"
                  strokeWidth="1.4"
                  fill="none"
                  markerEnd="url(#arrow)"
                  strokeDasharray={i === 4 ? '3 3' : 'none'}
                />
              );
            })}
          </svg>
          {DAG_NODES.map(n => (
            <div key={n.id} className={`dag-node ${n.type}`}
                 style={{ left: n.x, top: n.y, width: 120 }}>
              <span className="ndot" />
              <div style={{minWidth: 0, flex: 1}}>
                <div style={{whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{n.label}</div>
                <div className="meta">{n.meta}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

const LlmCallList = () => (
  <div className="col" style={{gap: 12}}>
    {LLM_CALLS.map(c => (
      <Card key={c.id}>
        <div className="card-h" style={{borderBottom: '1px solid hsl(var(--border))'}}>
          <div className="row">
            <SpanTypeBadge type="llm" />
            <span className="mono" style={{fontWeight: 600, fontSize: 13}}>{c.model}</span>
            <Badge variant="muted">{c.provider}</Badge>
          </div>
          <div className="row mono tabular mute" style={{fontSize: 11, gap: 14}}>
            <span>{formatTokens(c.input)} → {formatTokens(c.output)} tok</span>
            <span>{formatCost(c.cost)}</span>
            <span>{formatDuration(c.latency)}</span>
          </div>
        </div>
        <div className="card-pad" style={{display:'flex', flexDirection:'column', gap: 8}}>
          {c.messages.map((m, i) => (
            <pre key={i} className="code-block">
              <span className={m.role === 'system' ? 'system' : 'role'}>{m.role}:</span> {m.text}
            </pre>
          ))}
          <pre className="code-block" style={{borderColor: 'hsl(var(--primary) / 0.4)', background: 'hsl(var(--primary) / 0.05)'}}>
            <span className="role">assistant:</span> {c.completion}
          </pre>
        </div>
      </Card>
    ))}
  </div>
);

const ToolCallList = () => (
  <div className="col" style={{gap: 12}}>
    {TOOL_CALLS.map(c => (
      <Card key={c.id}>
        <div className="card-h">
          <div className="row">
            <SpanTypeBadge type="tool" />
            <code className="mono" style={{fontWeight: 600, fontSize: 13}}>{c.name}()</code>
            <Badge variant={c.ok ? 'success' : 'error'} dot>{c.ok ? 'OK' : 'Error'}</Badge>
          </div>
          <div className="mono tabular mute" style={{fontSize: 11}}>{formatDuration(c.latency)}</div>
        </div>
        <div className="card-pad" style={{display:'flex', flexDirection:'column', gap: 8}}>
          <div>
            <div className="mute" style={{fontSize: 10, marginBottom: 4, textTransform:'uppercase', letterSpacing: '0.08em', fontWeight:600}}>arguments</div>
            <pre className="code-block">{JSON.stringify(c.args, null, 2)}</pre>
          </div>
          <div>
            <div className="mute" style={{fontSize: 10, marginBottom: 4, textTransform:'uppercase', letterSpacing: '0.08em', fontWeight:600}}>result</div>
            <pre className="code-block">{typeof c.result === 'string' ? c.result : JSON.stringify(c.result, null, 2)}</pre>
          </div>
        </div>
      </Card>
    ))}
  </div>
);

const RunDetailPage = ({ runId, setRoute }) => {
  const run = RUNS.find(r => r.id === runId) || RUNS[0];
  const [tab, setTab] = React.useState('trace');
  const [selected, setSelected] = React.useState(RUN_SPANS.find(s => s.id === 's_chat'));
  const [feedback, setFeedback] = React.useState(null);

  const llmBySpan = React.useMemo(() => Object.fromEntries(LLM_CALLS.map(c => [c.spanId, c])), []);
  const toolBySpan = React.useMemo(() => Object.fromEntries(TOOL_CALLS.map(c => [c.spanId, c])), []);

  const stats = [
    { lbl: 'Tokens',  val: formatTokens(run.tokens),  delta: '+812 vs prev', good: false },
    { lbl: 'Cost',    val: formatCost(run.cost),      delta: '−$0.003',  good: true  },
    { lbl: 'Latency', val: formatDuration(run.latency), delta: '+184ms', good: false },
    { lbl: 'Spans',   val: RUN_SPANS.length + '',     delta: '7 OK · 0 err' },
  ];

  return (
    <div className="page">
      <div className="row" style={{cursor: 'pointer', width: 'fit-content', fontSize: 12, color: 'hsl(var(--muted-foreground))', marginBottom: 16}}
           onClick={() => setRoute({ kind: 'runs' })}>
        <I.ArrowLeft size={13} /> All runs
      </div>

      <div className="page-h" style={{alignItems: 'flex-start'}}>
        <div style={{minWidth: 0, flex: 1}}>
          <div className="row" style={{gap: 10, flexWrap: 'wrap'}}>
            <h1 className="page-title mono" style={{fontSize: 22, letterSpacing: '-0.04em', wordBreak: 'break-all'}}>
              run_{run.id}
            </h1>
            <IconBtn icon={I.Copy} label="Copy" />
          </div>
          <div className="row" style={{gap: 8, marginTop: 8, flexWrap: 'wrap'}}>
            <StatusBadge status={run.status} />
            {run.status === 'RUNNING' && (
              <span className="live-pill"><span className="dot" />Streaming</span>
            )}
            <Badge variant="muted"><I.GitBranch size={9} />{run.framework}</Badge>
            <Badge variant="muted"><I.Cpu size={9} />{run.agent}</Badge>
            <Badge variant="muted"><I.Server size={9} />{run.model}</Badge>
            <span className="mute" style={{fontSize: 11, marginLeft: 6, fontFamily: 'var(--font-mono)'}}>
              started {formatRel(run.started)} · {formatHM(run.started)}
            </span>
          </div>
        </div>

        <div className="row" style={{gap: 6}}>
          <Button variant={feedback === 1 ? 'primary' : 'outline'} icon={I.ThumbsUp}
            disabled={feedback !== null} onClick={() => setFeedback(1)}>Good</Button>
          <Button variant={feedback === 0 ? 'danger' : 'outline'} icon={I.ThumbsDown}
            disabled={feedback !== null} onClick={() => setFeedback(0)}>Bad</Button>
          <div className="sep-v" />
          <Button variant="outline" icon={I.RefreshCw}>Replay</Button>
          <Button variant="outline" icon={I.Plus}>To dataset</Button>
        </div>
      </div>

      <div className="metric-rail" style={{marginBottom: 18}}>
        {stats.map((s, i) => (
          <div key={i} className="metric" style={{padding: '14px 18px'}}>
            <div className="m-lbl">{s.lbl}</div>
            <div className="m-val">{s.val}</div>
            <div className="mute" style={{fontSize: 10, marginTop: 6, fontFamily: 'var(--font-mono)'}}>{s.delta}</div>
          </div>
        ))}
      </div>

      <div className="tabs" style={{marginBottom: 16}}>
        {[
          ['trace', 'Trace', RUN_SPANS.length, I.Activity],
          ['llm',   'LLM',   LLM_CALLS.length, I.Sparkles],
          ['tools', 'Tools', TOOL_CALLS.length, I.Wrench],
          ['provenance', 'Provenance', null, I.GitBranch],
          ['evals', 'Evals', 4, I.Compass],
          ['raw',   'Raw',   null, I.Inbox],
        ].map(([key, label, count, Ic]) => (
          <div key={key} className={`tab ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>
            <Ic size={12} />
            {label}
            {count != null && <span className="count">{count}</span>}
          </div>
        ))}
      </div>

      {tab === 'trace' && (
        <div className="split-2">
          <Waterfall run={run} spans={RUN_SPANS} selected={selected} setSelected={setSelected} />
          {selected ? (
            <SpanInspector
              span={selected}
              onClose={() => setSelected(null)}
              llmCall={llmBySpan[selected.id]}
              toolCall={toolBySpan[selected.id]}
            />
          ) : (
            <Card>
              <div className="card-pad" style={{textAlign: 'center', padding: '48px 24px', color: 'hsl(var(--muted-foreground))'}}>
                <I.Eye size={28} style={{opacity: 0.4, marginBottom: 12}} />
                <div style={{fontSize: 13, fontWeight: 500, color: 'hsl(var(--foreground))'}}>Select a span</div>
                <div style={{fontSize: 11.5, marginTop: 6, maxWidth: 240, margin: '6px auto 0'}}>
                  Click any span in the trace to inspect its prompt, tool args, and attributes.
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {tab === 'llm' && <LlmCallList />}
      {tab === 'tools' && <ToolCallList />}
      {tab === 'provenance' && <ProvenanceDag />}
      {tab === 'evals' && <EvalTab />}
      {tab === 'raw' && <RawTab run={run} />}
    </div>
  );
};

const EvalTab = () => (
  <div className="split-2">
    <Card>
      <CardHeader title="Evaluators applied" sub="Auto-run on every production trace" />
      <div>
        {EVALUATORS.map((e, i) => (
          <div key={e.id} style={{
            display: 'grid',
            gridTemplateColumns: '1fr 60px 50px',
            alignItems: 'center',
            gap: 12,
            padding: '14px 20px',
            borderTop: i === 0 ? 'none' : '1px solid hsl(var(--border))',
          }}>
            <div>
              <div className="row" style={{gap: 8}}>
                <span className="mono" style={{fontSize: 12, fontWeight: 500}}>{e.name}</span>
                <Badge variant="muted">{e.kind}</Badge>
              </div>
              <div className="eval-bar" style={{marginTop: 8}}>
                <span style={{width: `${e.score * 100}%`}} />
              </div>
            </div>
            <div className="mono tabular" style={{fontSize: 16, fontWeight: 600, textAlign: 'right'}}>
              {e.score.toFixed(2)}
            </div>
            <Badge variant={e.score >= 0.85 ? 'success' : e.score >= 0.7 ? 'warning' : 'error'} dot>
              {e.score >= 0.85 ? 'Pass' : e.score >= 0.7 ? 'Watch' : 'Fail'}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
    <Card>
      <CardHeader title="Annotate" sub="Capture human feedback for this run" />
      <div className="card-pad eval-card">
        <div className="mute" style={{fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600}}>Score</div>
        <div className="row" style={{gap: 6}}>
          {[1,2,3,4,5].map(n => (
            <button key={n} className="filter-chip" style={{minWidth: 36, justifyContent: 'center'}}>{n}</button>
          ))}
        </div>
        <div className="mute" style={{fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginTop: 8}}>Tags</div>
        <div className="row" style={{flexWrap: 'wrap', gap: 6}}>
          {['hallucination', 'verbose', 'tool-misuse', 'guardrail-miss', 'helpful', 'concise'].map(t => (
            <button key={t} className="filter-chip">{t}</button>
          ))}
        </div>
        <div className="mute" style={{fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginTop: 8}}>Note</div>
        <textarea
          className="input"
          style={{height: 80, padding: 10, resize: 'vertical', fontFamily: 'var(--font-sans)'}}
          placeholder="What went well, what didn't…"
        />
        <Button variant="primary" style={{alignSelf: 'flex-start', marginTop: 4}} icon={I.Check}>Save annotation</Button>
      </div>
    </Card>
  </div>
);

const RawTab = ({ run }) => {
  const json = {
    runId: run.id,
    status: run.status,
    agent: { id: run.agent, framework: run.framework },
    model: run.model,
    metrics: { tokens: run.tokens, costUsd: run.cost, latencyMs: run.latency },
    spans: RUN_SPANS.length,
    startTime: run.started,
  };
  return (
    <Card>
      <CardHeader title="Raw OTLP" sub="JSON envelope from the OpenTelemetry collector"
        right={<Button size="sm" variant="outline" icon={I.Copy}>Copy</Button>} />
      <div className="card-pad">
        <pre className="code-block" style={{maxHeight: 480}}>{JSON.stringify(json, null, 2)}</pre>
      </div>
    </Card>
  );
};

Object.assign(window, { RunDetailPage, Waterfall, SpanInspector });
