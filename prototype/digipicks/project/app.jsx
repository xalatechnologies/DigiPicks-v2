// app.jsx — DigiPicks shell + role switcher + screen router
const { useState: useAppState, useEffect: useAppEffect, useMemo: useAppMemo } = React;

const ROLES = [
  { id: 'public',   label: 'Public',     tag: 'Visitor', color: 'var(--t-2)' },
  { id: 'customer', label: 'Customer',   tag: 'Member',  color: 'var(--blue)' },
  { id: 'creator',  label: 'Creator',    tag: 'Pro',     color: 'var(--green)' },
  { id: 'admin',    label: 'Admin',      tag: 'Ops',     color: 'var(--gold)' },
];

const NAVS = {
  public: [
    { section: 'Browse', items: [
      { id: 'landing', label: 'Home', sub: 'The DigiPicks edge', icon: 'home' },
      { id: 'today', label: "Today's Events", sub: 'Live & starting soon', icon: 'calendar' },
      { id: 'discover', label: 'Creators', sub: 'Verified pros & sharps', icon: 'compass' },
      { id: 'apply', label: 'Apply for Access', sub: 'Become a creator', icon: 'sparkles' },
    ]},
  ],
  customer: [
    { section: 'My Network', items: [
      { id: 'feed', label: 'Feed', sub: 'Latest from your creators', icon: 'feed', badge: '12' },
      { id: 'discover', label: 'Discover', sub: 'Find new creators', icon: 'compass' },
      { id: 'today', label: "Today's Events", sub: 'Picks for tonight', icon: 'calendar' },
    ]},
    { section: 'Track', items: [
      { id: 'results', label: 'My Results', sub: 'Followed plays & ROI', icon: 'chart' },
      { id: 'saved', label: 'Saved', sub: 'Picks & creators bookmarked', icon: 'bookmark' },
      { id: 'subscriptions', label: 'Subscriptions', sub: 'Manage active plans', icon: 'card' },
    ]},
    { section: 'Account', items: [
      { id: 'notifications', label: 'Notifications', sub: 'Pick alerts & billing', icon: 'bell', badge: '4' },
      { id: 'settings', label: 'Settings', sub: 'Profile & preferences', icon: 'gear' },
    ]},
  ],
  creator: [
    { section: 'Studio', items: [
      { id: 'overview', label: 'Overview', sub: 'Today across your business', icon: 'home' },
      { id: 'picks', label: 'Posts & Picks', sub: 'Drafts, scheduled, graded', icon: 'feed' },
      { id: 'create', label: 'Create Pick', sub: 'Publish before cutoff', icon: 'plus' },
      { id: 'products', label: 'Products', sub: 'Plans & pricing tiers', icon: 'tag' },
    ]},
    { section: 'Audience', items: [
      { id: 'subscribers', label: 'Subscribers', sub: '426 active members', icon: 'users' },
      { id: 'messages', label: 'Messages', sub: 'DMs from your members', icon: 'message', badge: '3' },
      { id: 'performance', label: 'Performance', sub: 'Win rate, ROI, streaks', icon: 'chart' },
    ]},
    { section: 'Growth', items: [
      { id: 'growth', label: 'Growth Manager', sub: 'Promo, referrals, funnels', icon: 'megaphone' },
      { id: 'access', label: 'Access Control', sub: 'Map plans to content', icon: 'key' },
      { id: 'earnings', label: 'Earnings', sub: 'MRR, payouts, invoices', icon: 'dollar' },
    ]},
  ],
  admin: [
    { section: 'Trust & Quality', items: [
      { id: 'apps', label: 'Applications', sub: '12 awaiting review', icon: 'inbox', badge: '12' },
      { id: 'creators', label: 'Creators', sub: 'Verification & status', icon: 'verified' },
      { id: 'mod', label: 'Content Moderation', sub: '5 flagged this week', icon: 'flag', badge: '5' },
    ]},
    { section: 'Operations', items: [
      { id: 'billing', label: 'Billing Support', sub: 'Failed payments, refunds', icon: 'card' },
      { id: 'disputes', label: 'Disputes', sub: 'Graded pick reviews', icon: 'shield' },
      { id: 'audit', label: 'Audit Log', sub: 'Platform activity stream', icon: 'audit' },
    ]},
  ],
};

const DEFAULT_SCREEN = {
  public: 'landing', customer: 'feed', creator: 'overview', admin: 'apps',
};

function App() {
  const [role, setRole] = useAppState('public');
  const [screen, setScreen] = useAppState(DEFAULT_SCREEN.public);
  const [creatorView, setCreatorView] = useAppState(null); // creator profile id
  const [pickView, setPickView] = useAppState(null); // pick id

  function switchRole(next) {
    setRole(next);
    setScreen(DEFAULT_SCREEN[next]);
    setCreatorView(null);
    setPickView(null);
  }
  function go(scr) {
    setScreen(scr);
    setCreatorView(null);
    setPickView(null);
  }
  function openCreator(id) { setScreen('creator-profile'); setCreatorView(id); }
  function openPick(id) { setScreen('pick-detail'); setPickView(id); }

  const ctx = { role, switchRole, screen, go, creatorView, openCreator, pickView, openPick };

  // public layout has no sidebar (it's a marketing site shell)
  if (role === 'public') {
    return <PublicShell ctx={ctx}/>;
  }

  return (
    <div className="app">
      <AppHeader ctx={ctx}/>
      <Sidebar ctx={ctx}/>
      <main className="main">
        <ScreenRouter ctx={ctx}/>
      </main>
    </div>
  );
}

function AppHeader({ ctx }) {
  const { role, switchRole } = ctx;
  const cur = ROLES.find(r => r.id === role) || ROLES[0];
  return (
    <header className="app-header">
      <div className="ah-brand">
        <Logo size={36}/>
        <div className="ah-brand-text">
          <span className="ah-name">DIGIPICKS</span>
          <span className="ah-sub">Creator Network</span>
        </div>
      </div>

      <div className="ah-search">
        <div className="search">
          <Icon name="search" size={16}/>
          <input placeholder="Search creators, picks, events…" aria-label="Search"/>
          <span className="kbd kbd-hint">⌘K</span>
        </div>
      </div>

      <div className="ah-actions">
        <button className="ah-iconbtn" aria-label="Favorites"><Icon name="bookmark" size={18}/></button>
        <button className="ah-iconbtn" aria-label="Help"><Icon name="help" size={18}/></button>
        <ThemeIconButton/>
        <div className="ah-user" onClick={() => {}}>
          <div className="ah-avatar">A</div>
          <div className="ah-user-text">
            <span className="ah-user-name">{cur.label}</span>
            <span className="ah-user-mail">{cur.id}@digipicks.io</span>
          </div>
          <Icon name="chevron-down" size={14} className="ah-user-chev"/>
        </div>
      </div>
    </header>
  );
}

function ThemeIconButton() {
  const [theme, setTheme] = useAppState(
    typeof document !== 'undefined' ? (document.documentElement.getAttribute('data-theme') || 'dark') : 'dark'
  );
  function toggle() {
    const t = theme === 'dark' ? 'light' : 'dark';
    setTheme(t);
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('dp-theme', t); } catch(e){}
  }
  return (
    <button className="ah-iconbtn" onClick={toggle} aria-label="Toggle theme">
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18}/>
    </button>
  );
}

function ScreenRouter({ ctx }) {
  const { role, screen, creatorView, pickView } = ctx;

  // shared screens
  if (screen === 'creator-profile') return <CreatorProfile ctx={ctx} creatorId={creatorView || 'courtvision'}/>;
  if (screen === 'pick-detail') return <PickDetail ctx={ctx} pickId={pickView || 'p1'}/>;

  if (role === 'customer') {
    if (screen === 'feed') return <CustomerFeed ctx={ctx}/>;
    if (screen === 'discover') return <Discover ctx={ctx}/>;
    if (screen === 'today') return <TodaysEvents ctx={ctx}/>;
    if (screen === 'results') return <CustomerResults ctx={ctx}/>;
    if (screen === 'saved') return <SavedLibrary ctx={ctx}/>;
    if (screen === 'subscriptions') return <Subscriptions ctx={ctx}/>;
    if (screen === 'notifications') return <Notifications ctx={ctx}/>;
    if (screen === 'settings') return <Settings ctx={ctx}/>;
  }
  if (role === 'creator') {
    if (screen === 'overview') return <CreatorOverview ctx={ctx}/>;
    if (screen === 'picks') return <CreatorPicks ctx={ctx}/>;
    if (screen === 'create' || screen === 'creator-create') return <CreatePick ctx={ctx}/>;
    if (screen === 'creator-picks') return <CreatorPicks ctx={ctx}/>;
    if (screen === 'products') return <CreatorProducts ctx={ctx}/>;
    if (screen === 'subscribers') return <CreatorSubscribers ctx={ctx}/>;
    if (screen === 'performance') return <CreatorPerformance ctx={ctx}/>;
    if (screen === 'growth') return <CreatorGrowth ctx={ctx}/>;
    if (screen === 'access') return <CreatorAccess ctx={ctx}/>;
  }
  if (role === 'admin') {
    return <AdminConsole ctx={ctx}/>;
  }
  return <Stub title={screen}/>;
}

function Stub({ title }) {
  return (
    <div style={{ padding: 60 }}>
      <EmptyState icon="sparkles" title={`"${title}" screen`}
        subtitle="Stub — included in the prototype scope but not the focus of this round. Use the role switcher to explore the high-fidelity screens."/>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Sidebar (role-aware)
   ───────────────────────────────────────────────────────── */
function Sidebar({ ctx }) {
  const { role, screen, go, switchRole } = ctx;
  const sections = NAVS[role] || [];
  return (
    <aside className="sidebar">
      <div className="sidebar-nav">
        {sections.map((sec, i) => (
          <div key={sec.section}>
            {i > 0 && <div className="nav-divider"/>}
            <div className="nav-section-title">{sec.section}</div>
            {sec.items.map(item => (
              <div key={item.id}
                className={`nav-item ${screen === item.id ? 'active' : ''}`}
                onClick={() => go(item.id)}
              >
                <span className="nav-icon"><Icon name={item.icon} size={16}/></span>
                <span className="nav-text">
                  <span className="nav-label">{item.label}</span>
                  {item.sub && <span className="nav-sub">{item.sub}</span>}
                </span>
                {item.badge && <span className="badge">{item.badge}</span>}
                <Icon name="chevron-right" size={14} className="nav-chev"/>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="sidebar-foot">
        <RoleSwitcher current={role} onChange={switchRole}/>
      </div>
    </aside>
  );
}

function ThemeToggle() {
  const [theme, setTheme] = useAppState(
    typeof document !== 'undefined' ? (document.documentElement.getAttribute('data-theme') || 'dark') : 'dark'
  );
  function set(t) {
    setTheme(t);
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('dp-theme', t); } catch(e){}
  }
  return (
    <div className="theme-toggle" role="group" aria-label="Theme">
      <button className={theme === 'dark' ? 'on' : ''} onClick={() => set('dark')} aria-pressed={theme === 'dark'}>
        <Icon name="moon" size={14}/>
        <span>Dark</span>
      </button>
      <button className={theme === 'light' ? 'on' : ''} onClick={() => set('light')} aria-pressed={theme === 'light'}>
        <Icon name="sun" size={14}/>
        <span>Light</span>
      </button>
    </div>
  );
}

function Logo({ size = 24 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 8,
      background: 'var(--primary)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--primary-foreground)', fontWeight: 700,
      fontSize: size * 0.5,
      fontFamily: 'var(--f-mono)',
      letterSpacing: '-0.04em',
      boxShadow: '0 1px 0 rgba(255,255,255,0.18) inset, 0 4px 14px -4px color-mix(in srgb, var(--primary) 50%, transparent)',
    }}>DP</div>
  );
}

function RoleSwitcher({ current, onChange }) {
  const [open, setOpen] = useAppState(false);
  const cur = ROLES.find(r => r.id === current);
  return (
    <div style={{ position: 'relative' }}>
      <div className="role-pill" onClick={() => setOpen(o => !o)} role="button" tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(o => !o); } }}>
        <div style={{
          width: 24, height: 24, borderRadius: 50,
          background: 'var(--bg-3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: cur.color,
        }}>
          <Icon name={current === 'admin' ? 'shield' : current === 'creator' ? 'sparkles' : current === 'customer' ? 'user' : 'eye'} size={13}/>
        </div>
        <div className="row" style={{ flex: 1, gap: 8 }}>
          <span className="role-name">{cur.label}</span>
          <span className="role-tag">{cur.tag}</span>
        </div>
        <Icon name="arrow-up" size={12} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s', color: 'var(--t-3)', marginRight: 6 }}/>
      </div>
      {open && (
        <div style={{
          position: 'absolute', bottom: 50, left: 0, right: 0,
          background: 'var(--bg-2)', border: '1px solid var(--line)',
          borderRadius: 12, padding: 6, zIndex: 100,
          boxShadow: 'var(--shadow-lg)',
        }}>
          <div style={{ fontSize: 10.5, color: 'var(--t-3)', textTransform: 'uppercase', letterSpacing: '0.07em', padding: '6px 8px 4px' }}>
            Switch role · prototype only
          </div>
          {ROLES.map(r => (
            <div key={r.id}
              onClick={() => { onChange(r.id); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 8px', borderRadius: 7, cursor: 'pointer',
                background: current === r.id ? 'var(--bg-3)' : 'transparent',
              }}
            >
              <div style={{ width: 22, height: 22, borderRadius: 50, background: 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: r.color }}>
                <Icon name={r.id === 'admin' ? 'shield' : r.id === 'creator' ? 'sparkles' : r.id === 'customer' ? 'user' : 'eye'} size={12}/>
              </div>
              <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{r.label}</span>
              <span className="role-tag">{r.tag}</span>
              {current === r.id && <Icon name="check" size={13} style={{ color: 'var(--green)' }}/>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Topbar (used by most screens)
   ───────────────────────────────────────────────────────── */
function Topbar({ title, crumb, actions, search }) {
  return (
    <header className="topbar">
      <div>
        {crumb && <div className="crumb">{crumb}</div>}
        <h2>{title}</h2>
      </div>
      <div className="spacer"/>
      {search && (
        <div className="search" style={{ width: 320 }}>
          <Icon name="search" size={14}/>
          <input placeholder={search} aria-label="Search"/>
        </div>
      )}
      {actions}
    </header>
  );
}

window.App = App;
window.Topbar = Topbar;
window.Logo = Logo;
