/* ── App root: route state, theme, tweaks ── */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "dark",
  "density": "default",
  "accent": "#8b7cff",
  "monoEverywhere": false
}/*EDITMODE-END*/;

const ACCENT_PRESETS = {
  '#8b7cff': '250 80% 66%',  // indigo-violet (canonical)
  '#22d3ee': '188 90% 53%',  // cyan
  '#f97316': '24 95% 53%',   // orange
  '#10b981': '160 84% 39%',  // emerald
};

function App() {
  const [route, setRoute] = React.useState({ kind: 'overview' });
  const [cmdOpen, setCmdOpen] = React.useState(false);
  const [t, setT] = useTweaks(TWEAK_DEFAULTS);

  /* Theme + accent application */
  React.useEffect(() => {
    const root = document.documentElement;
    if (t.theme === 'light') root.classList.add('theme-light');
    else root.classList.remove('theme-light');

    const hsl = ACCENT_PRESETS[t.accent] || ACCENT_PRESETS['#8b7cff'];
    document.documentElement.style.setProperty('--primary', hsl);
    const [h, s, l] = hsl.split(' ');
    const lighterL = Math.min(85, parseFloat(l) + 6);
    document.documentElement.style.setProperty('--primary-bright', `${h} ${s} ${lighterL}%`);
  }, [t.theme, t.accent]);

  /* Mono everywhere */
  React.useEffect(() => {
    if (t.monoEverywhere) document.documentElement.classList.add('mono-all');
    else document.documentElement.classList.remove('mono-all');
  }, [t.monoEverywhere]);

  /* Cmd-K */
  React.useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen(true);
      }
      if (e.key === 'Escape') setCmdOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  let view;
  if (route.kind === 'overview')        view = <OverviewPage setRoute={setRoute} />;
  else if (route.kind === 'runs')       view = <RunsPage setRoute={setRoute} />;
  else if (route.kind === 'runDetail')  view = <RunDetailPage runId={route.runId} setRoute={setRoute} />;
  else if (route.kind === 'datasets')   view = <DatasetsPage />;
  else if (route.kind === 'evals')      view = <EvaluatorsPage />;
  else if (route.kind === 'graph')      view = <ProvenancePage />;
  else if (route.kind === 'agents')         view = <AgentsListPage setRoute={setRoute} />;
  else if (route.kind === 'agentDetail')    view = <AgentDetailPage agentId={route.agentId} setRoute={setRoute} />;
  else if (route.kind === 'agentRegister')  view = <AgentRegisterPage setRoute={setRoute} />;
  else if (route.kind === 'models')     view = <ModelsPage />;
  else if (route.kind === 'alerts')     view = <AlertsPage />;
  else if (route.kind === 'settings')   view = <SettingsPage />;
  else view = <OverviewPage setRoute={setRoute} />;

  const screenLabel =
    route.kind === 'overview' ? 'Overview' :
    route.kind === 'runs' ? 'Runs list' :
    route.kind === 'runDetail' ? 'Run detail' :
    route.kind === 'agents' ? 'Agents' :
    route.kind === 'agentDetail' ? 'Agent detail' :
    route.kind === 'agentRegister' ? 'Register agent' :
    route.kind.charAt(0).toUpperCase() + route.kind.slice(1);

  return (
    <div className={`app density-${t.density}`} data-screen-label={screenLabel}>
      <Sidebar route={route} setRoute={setRoute} />
      <div className="main">
        <TopBar route={route} setRoute={setRoute}
                theme={t.theme}
                setTheme={(v) => setT('theme', v)}
                openCmd={() => setCmdOpen(true)} />
        <TickStrip />
        {view}
      </div>

      {cmdOpen && <CommandPalette onClose={() => setCmdOpen(false)} setRoute={setRoute} />}

      <TweaksPanel title="Tweaks">
        <TweakSection title="Appearance">
          <TweakRadio label="Theme" value={t.theme}
            onChange={(v) => setT('theme', v)}
            options={[
              { value: 'dark',  label: 'Dark' },
              { value: 'light', label: 'Light' },
            ]} />
          <TweakColor label="Accent" value={t.accent}
            onChange={(v) => setT('accent', v)}
            options={['#8b7cff', '#22d3ee', '#f97316', '#10b981']} />
        </TweakSection>

        <TweakSection title="Layout">
          <TweakRadio label="Density" value={t.density}
            onChange={(v) => setT('density', v)}
            options={[
              { value: 'compact',     label: 'Tight' },
              { value: 'default',     label: 'Default' },
              { value: 'comfortable', label: 'Roomy' },
            ]} />
          <TweakToggle label="Mono everywhere" value={t.monoEverywhere}
            onChange={(v) => setT('monoEverywhere', v)} />
        </TweakSection>

        <TweakSection title="Navigate">
          <TweakSelect label="Open page" value={route.kind}
            onChange={(v) => {
              if (v === 'runDetail')         setRoute({ kind: v, runId: RUNS[0].id });
              else if (v === 'agentDetail')  setRoute({ kind: v, agentId: AGENTS[0].id });
              else                            setRoute({ kind: v });
            }}
            options={[
              { value: 'overview',       label: 'Overview' },
              { value: 'runs',           label: 'Runs list' },
              { value: 'runDetail',      label: 'Run detail' },
              { value: 'agents',         label: 'Agents' },
              { value: 'agentDetail',    label: 'Agent detail' },
              { value: 'agentRegister',  label: 'Register agent' },
              { value: 'datasets',       label: 'Datasets' },
              { value: 'evals',          label: 'Evaluators' },
              { value: 'graph',          label: 'Provenance' },
              { value: 'alerts',         label: 'Alerts' },
              { value: 'settings',       label: 'Settings' },
            ]} />
          <TweakButton label="Open command palette (⌘K)" onClick={() => setCmdOpen(true)} />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
