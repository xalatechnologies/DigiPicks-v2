// creator.jsx — Creator dashboard screens
const { useState: useCr, Fragment: FragCr } = React;

/* ─────────────────────────────────────────────────────────
   Creator Overview
   ───────────────────────────────────────────────────────── */
function CreatorOverview({ ctx }) {
  return (
    <>
      <Topbar title="Overview" crumb="CourtVision Pro · Creator"
        actions={<>
          <button className="btn btn-secondary btn-sm"><Icon name="message" size={13}/> Message subscribers</button>
          <button className="btn btn-primary btn-sm" onClick={() => ctx.go('creator-create')}><Icon name="plus" size={13}/> Create pick</button>
        </>}/>
      <div style={{ padding: '24px 28px', maxWidth: 1400 }}>
        <div className="row between" style={{ marginBottom: 22 }}>
          <div>
            <h1 className="serif" style={{ fontSize: 30, fontWeight: 400, fontStyle: 'italic', margin: '0 0 4px', letterSpacing: '-0.015em' }}>Good evening, Marco.</h1>
            <p style={{ fontSize: 14, color: 'var(--t-3)', margin: 0 }}>Tuesday, May 14 · 7 picks pending grade · 2 events tonight</p>
          </div>
          <div className="row" style={{ gap: 6 }}>{['Today','7D','30D','90D'].map((t,i) => <span key={t} className={`chip ${i===2 ? 'active' : ''}`}>{t}</span>)}</div>
        </div>

        {/* Top metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 18 }}>
          <Metric label="Monthly revenue" value="$12,480" delta="+18.4%" accent="var(--t-1)"/>
          <Metric label="Active subscribers" value="426" delta="+34 this mo" accent="var(--green)"/>
          <Metric label="Win rate · 30d" value="61.2%" delta="+1.8%" accent="var(--green)"/>
          <Metric label="Churn · 30d" value="3.1%" delta="−0.4%" accent="var(--green)"/>
        </div>

        {/* Revenue + funnel */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18, marginBottom: 18 }}>
          <div className="card card-pad">
            <div className="row between" style={{ marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>Revenue · last 30 days</div>
                <div className="mono" style={{ fontSize: 28, fontWeight: 500, marginTop: 4, color: 'var(--t-1)' }}>$12,480.00 <span style={{ fontSize: 13, color: 'var(--green)', marginLeft: 6 }}>+18.4%</span></div>
              </div>
              <div className="row" style={{ gap: 16, fontSize: 11.5, color: 'var(--t-3)' }}>
                <span className="row" style={{ gap: 6 }}><i style={{ width: 10, height: 10, background: 'var(--green)', borderRadius: 2 }}/>Premium</span>
                <span className="row" style={{ gap: 6 }}><i style={{ width: 10, height: 10, background: 'var(--gold)', borderRadius: 2 }}/>VIP</span>
              </div>
            </div>
            <RevenueChart/>
          </div>

          <div className="card card-pad">
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 14 }}>Subscriber funnel · 30d</div>
            {[
              { l: 'Profile views', v: 4820, w: 100 },
              { l: 'Started checkout', v: 612, w: 26 },
              { l: 'New subscribers', v: 142, w: 12 },
              { l: 'Trial → paid', v: 96, w: 8 },
            ].map((r, i) => (
              <div key={r.l} style={{ marginBottom: 12 }}>
                <div className="row between" style={{ marginBottom: 5 }}>
                  <span style={{ fontSize: 12.5, color: 'var(--t-2)' }}>{r.l}</span>
                  <span className="mono" style={{ fontSize: 12, fontWeight: 500 }}>{r.v.toLocaleString()}</span>
                </div>
                <div style={{ height: 8, borderRadius: 50, background: 'var(--bg-2)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${r.w}%`, background: i === 0 ? 'var(--blue)' : i === 1 ? 'var(--green)' : i === 2 ? 'var(--green)' : 'var(--gold)' }}/>
                </div>
              </div>
            ))}
            <div style={{ padding: 12, background: 'var(--bg-2)', borderRadius: 8, fontSize: 12, color: 'var(--t-2)', marginTop: 12, lineHeight: 1.55 }}>
              <span style={{ color: 'var(--green)', fontWeight: 500 }}>↑ 2.4 pts</span> conversion vs last 30d. Try a free pick on Friday's slate to drive checkout.
            </div>
          </div>
        </div>

        {/* Quick actions row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 18 }}>
          <QuickAction icon="plus" title="Create pick" sub="Publish or schedule" cta="Start" onClick={() => ctx.go('creator-create')}/>
          <QuickAction icon="card" title="Smart pricing" sub="Try $54/mo (recommended)" cta="Review" tone="gold"/>
          <QuickAction icon="rocket" title="Growth manager" sub="3 new opportunities" cta="View"/>
        </div>

        {/* Bottom: pending grade + recent picks */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18 }}>
          <div className="card">
            <div className="row between" style={{ padding: '14px 20px', borderBottom: '1px solid var(--line-soft)' }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>Recent picks</div>
              <button className="btn btn-ghost btn-sm" onClick={() => ctx.go('creator-picks')}>Open manager <Icon name="arrow-right" size={12}/></button>
            </div>
            <table className="tbl">
              <thead><tr><th>Pick</th><th>Access</th><th>Published</th><th>Views</th><th>Result</th></tr></thead>
              <tbody>
                {DATA.RECENT_RESULTS.slice(0,5).map(r => (
                  <tr key={r.id}>
                    <td><div style={{ fontWeight: 500, fontSize: 13 }}>{r.title}</div><div style={{ fontSize: 11, color: 'var(--t-3)', marginTop: 2 }}>{r.sport} · {r.market || 'Player Prop'}</div></td>
                    <td><AccessBadge access={r.access || 'premium'}/></td>
                    <td className="num" style={{ color: 'var(--t-3)' }}>{r.date}</td>
                    <td className="num">{r.views || (840 + Math.floor(Math.random()*500))}</td>
                    <td><GradeBadge grade={r.result}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card card-pad">
            <div className="row between" style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>Pending grade</div>
              <Badge tone="amber">7</Badge>
            </div>
            <p style={{ fontSize: 12, color: 'var(--t-3)', margin: '0 0 12px' }}>These picks are awaiting an event result. Grading is automatic — manual review only on disputes.</p>
            {[
              { t: 'LAL/DEN H1 Total Over 112.5', s: 'NBA · 7:30 PM ET' },
              { t: 'Dončić O 7.5 assists', s: 'NBA · 8:00 PM ET' },
              { t: 'Edmonton ML', s: 'NHL · 9:00 PM ET' },
            ].map((r, i) => (
              <div key={i} style={{ padding: '10px 0', borderBottom: i < 2 ? '1px solid var(--line-soft)' : 'none' }}>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{r.t}</div>
                <div className="mono" style={{ fontSize: 11.5, color: 'var(--t-3)' }}>{r.s}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function QuickAction({ icon, title, sub, cta, tone, onClick }) {
  return (
    <button onClick={onClick} className="card card-pad" style={{
      cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 14,
      background: tone === 'gold' ? 'linear-gradient(135deg, rgba(232,194,117,0.06), transparent)' : undefined,
      borderColor: tone === 'gold' ? 'var(--gold-line)' : undefined,
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: 10,
        background: tone === 'gold' ? 'var(--gold-soft)' : 'var(--bg-2)',
        color: tone === 'gold' ? 'var(--gold)' : 'var(--green)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '1px solid var(--line-soft)',
      }}><Icon name={icon} size={18}/></div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--t-3)', marginTop: 2 }}>{sub}</div>
      </div>
      <span style={{ fontSize: 12.5, color: tone === 'gold' ? 'var(--gold)' : 'var(--green)', fontWeight: 500 }}>{cta} →</span>
    </button>
  );
}

function RevenueChart() {
  const data = [220, 380, 320, 410, 540, 480, 620, 580, 720, 690, 810, 880, 940, 870, 1020, 1110, 1080, 1240, 1380, 1320, 1420, 1380, 1520, 1640, 1480, 1720, 1810, 1880, 1940, 2120];
  const tiers = data.map(v => ({ p: v * 0.7, vip: v * 0.3 }));
  const w = 740, h = 200, pad = 16;
  const max = Math.max(...data);
  const bw = (w - pad * 2) / data.length - 2;
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`}>
      {[0.25, 0.5, 0.75, 1].map((q, i) => (
        <line key={i} x1={pad} x2={w-pad} y1={h - pad - q * (h - pad*2)} y2={h - pad - q * (h - pad*2)} stroke="var(--line-soft)"/>
      ))}
      {tiers.map((t, i) => {
        const x = pad + i * (bw + 2);
        const ph = (t.p / max) * (h - pad*2);
        const vh = (t.vip / max) * (h - pad*2);
        return (
          <FragCr key={i}>
            <rect x={x} y={h - pad - ph} width={bw} height={ph} rx="2" fill="var(--green)" opacity="0.85"/>
            <rect x={x} y={h - pad - ph - vh} width={bw} height={vh} rx="2" fill="var(--gold)" opacity="0.9"/>
          </FragCr>
        );
      })}
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────
   Picks Manager
   ───────────────────────────────────────────────────────── */
function CreatorPicks({ ctx }) {
  const [tab, setTab] = useCr('all');
  const all = [
    ...DATA.RECENT_RESULTS.map(r => ({ ...r, status: r.result, view: r.views || 1200, saves: r.saves || 84 })),
    { id: 'cp1', title: 'Lakers vs Nuggets — H1 Total Over 112.5', sport: 'NBA', market: 'Totals', access: 'premium', date: 'Today 6:48 PM', status: 'pending', views: 1284, saves: 312, units: '2u', odds: '-110' },
    { id: 'cp2', title: 'Dončić Over 7.5 assists', sport: 'NBA', market: 'Player Prop', access: 'premium', date: 'Today 5:22 PM', status: 'pending', views: 856, saves: 188, units: '1.5u', odds: '+105' },
    { id: 'cp3', title: 'Free preview · Knicks ML', sport: 'NBA', market: 'Moneyline', access: 'free', date: 'Today 2:10 PM', status: 'pending', views: 4012, saves: 522, units: '1u', odds: '-135' },
    { id: 'cp4', title: 'Friday slate notes', sport: 'NBA', market: 'Analysis', access: 'premium', date: 'Tomorrow 9:00 AM', status: 'scheduled', views: 0, saves: 0, units: '—', odds: '—' },
    { id: 'cp5', title: 'Bills vs Chiefs preview', sport: 'NFL', market: 'Spread', access: 'premium', date: 'Draft', status: 'draft', views: 0, saves: 0, units: '—', odds: '—' },
  ];
  const list = tab === 'all' ? all : all.filter(p => p.status === tab || (tab === 'graded' && ['win','loss','push'].includes(p.status)));

  return (
    <>
      <Topbar title="Posts & picks" crumb="Creator · Posts"
        actions={<button className="btn btn-primary btn-sm" onClick={() => ctx.go('creator-create')}><Icon name="plus" size={13}/> Create pick</button>}/>
      <div style={{ padding: '24px 28px', maxWidth: 1400 }}>
        <PageHead title="All posts" sub="Drafts, scheduled, published, and graded picks."/>

        <div className="row between" style={{ marginBottom: 14 }}>
          <div className="row" style={{ gap: 4 }}>
            {[
              { id: 'all', label: 'All', count: all.length },
              { id: 'draft', label: 'Drafts', count: 1 },
              { id: 'scheduled', label: 'Scheduled', count: 1 },
              { id: 'pending', label: 'Pending grade', count: 3 },
              { id: 'graded', label: 'Graded', count: 6 },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`chip ${tab === t.id ? 'green-active' : ''}`}>{t.label} <span style={{ opacity: 0.6, marginLeft: 4 }}>{t.count}</span></button>
            ))}
          </div>
          <div className="row" style={{ gap: 8 }}>
            <div className="search" style={{ width: 240 }}><Icon name="search" size={14}/><input placeholder="Search picks"/></div>
            <button className="btn btn-secondary btn-sm"><Icon name="filter" size={13}/> Filters</button>
          </div>
        </div>

        <div className="card">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 32 }}><input type="checkbox" disabled/></th>
                <th>Pick</th>
                <th>Sport</th>
                <th>Market</th>
                <th>Access</th>
                <th className="num">Stake</th>
                <th className="num">Odds</th>
                <th>Date</th>
                <th className="num">Views</th>
                <th className="num">Saves</th>
                <th>Status</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {list.map(p => (
                <tr key={p.id} onClick={() => ctx.openPick(p.id)} style={{ cursor: 'pointer' }}>
                  <td><input type="checkbox" onClick={(e) => e.stopPropagation()}/></td>
                  <td><div style={{ fontWeight: 500, fontSize: 13 }}>{p.title}</div></td>
                  <td><SportTag sport={p.sport}/></td>
                  <td style={{ color: 'var(--t-2)' }}>{p.market}</td>
                  <td><AccessBadge access={p.access}/></td>
                  <td className="num">{p.units}</td>
                  <td className="num">{p.odds}</td>
                  <td className="num" style={{ color: 'var(--t-3)' }}>{p.date}</td>
                  <td className="num">{p.views ? p.views.toLocaleString() : '—'}</td>
                  <td className="num">{p.saves || '—'}</td>
                  <td><GradeBadge grade={p.status}/></td>
                  <td><button className="btn btn-icon btn-ghost" style={{ width: 28, height: 28 }} onClick={(e) => e.stopPropagation()}><Icon name="more" size={14}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────
   Create Pick — split form + preview
   ───────────────────────────────────────────────────────── */
function CreatePick({ ctx }) {
  const [access, setAccess] = useCr('premium');
  const [title, setTitle] = useCr('Lakers vs Nuggets — First Half Total Over 112.5');
  const [analysis, setAnalysis] = useCr('Both teams hovering 53–55% pace tier vs quality defenses. Denver on a back-to-back, Murray played 38 minutes Thursday.\n\nLakers 6-1 on H1 over at home this season when line sits 110.5–113.5.');
  return (
    <>
      <Topbar title="Create pick" crumb="Posts › New"
        actions={<>
          <button className="btn btn-secondary btn-sm" onClick={() => ctx.go('creator-picks')}>Cancel</button>
          <button className="btn btn-outline btn-sm">Save draft</button>
          <button className="btn btn-primary btn-sm">Publish now</button>
        </>}/>
      <div style={{ padding: '24px 28px', maxWidth: 1300, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 22 }}>
        <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <SectionHead title="Pick details"/>
          <Field label="Title">
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)}/>
          </Field>
          <FormGrid cols={3}>
            <Field label="Sport">
              <select className="input"><option>NBA</option><option>NFL</option><option>NHL</option><option>MLB</option></select>
            </Field>
            <Field label="League">
              <select className="input"><option>NBA · Regular</option><option>NBA · Playoffs</option></select>
            </Field>
            <Field label="Event">
              <select className="input"><option>LAL @ DEN · Tonight 7:30 PM ET</option><option>BOS @ NYK · Tonight 8:00 PM ET</option></select>
            </Field>
          </FormGrid>
          <FormGrid cols={3}>
            <Field label="Market">
              <select className="input"><option>Totals (H1)</option><option>Spread</option><option>Player prop</option></select>
            </Field>
            <Field label="Selection">
              <input className="input" defaultValue="Over 112.5"/>
            </Field>
            <Field label="Odds">
              <input className="input mono" defaultValue="-110"/>
            </Field>
          </FormGrid>
          <FormGrid cols={2}>
            <Field label="Stake (units)">
              <input className="input" defaultValue="2u"/>
            </Field>
            <Field label="Confidence">
              <select className="input"><option>High</option><option>Medium</option><option>Low</option></select>
            </Field>
          </FormGrid>

          <hr className="hr"/>
          <SectionHead title="Analysis"/>
          <textarea className="input" rows={8} value={analysis} onChange={(e) => setAnalysis(e.target.value)}/>

          <hr className="hr"/>
          <SectionHead title="Visibility & timing"/>
          <Field label="Access">
            <div className="row" style={{ gap: 8 }}>
              {[
                { id: 'free', label: 'Free', sub: 'Public + free followers' },
                { id: 'premium', label: 'Premium', sub: 'All paying subscribers' },
                { id: 'vip', label: 'VIP', sub: 'VIP tier only' },
              ].map(o => (
                <button key={o.id} onClick={() => setAccess(o.id)}
                  className={access === o.id ? 'chip green-active' : 'chip'}
                  style={{ flex: 1, padding: '12px 14px', flexDirection: 'column', alignItems: 'flex-start', gap: 4, height: 'auto', textAlign: 'left' }}>
                  <span style={{ fontWeight: 500 }}>{o.label}</span>
                  <span style={{ fontSize: 11, color: 'var(--t-3)' }}>{o.sub}</span>
                </button>
              ))}
            </div>
          </Field>
          <FormGrid cols={2}>
            <Field label="Publish">
              <select className="input"><option>Publish now</option><option>Schedule</option><option>Save as draft</option></select>
            </Field>
            <Field label="Cutoff">
              <input className="input" defaultValue="At tip-off (7:30 PM ET)"/>
            </Field>
          </FormGrid>

          <div className="row" style={{ gap: 10, padding: 14, borderRadius: 10, background: 'rgba(245,166,35,0.05)', border: '1px solid rgba(245,166,35,0.2)' }}>
            <Icon name="alert" size={16} style={{ color: 'var(--amber)', flexShrink: 0, marginTop: 2 }}/>
            <div style={{ fontSize: 12.5, color: 'var(--t-2)', lineHeight: 1.55 }}>
              <strong style={{ color: 'var(--t-1)' }}>Cutoff in 42 minutes.</strong> Publishing after the cutoff is allowed but the pick will be marked <em>Late</em> and excluded from your win-rate.
            </div>
          </div>
        </div>

        {/* Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--t-3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Live preview</div>
          <PickCard pick={{
            id: 'preview',
            creator: 'courtvision',
            sport: 'NBA',
            event: 'LAL @ DEN · Tonight 7:30 PM ET',
            eventTime: 'Tonight 7:30 PM ET',
            title,
            market: 'Totals',
            selection: 'Over 112.5',
            odds: '-110',
            units: '2u',
            access,
            posted: 'just now',
            confidence: 'high',
            status: 'pending',
          }}/>
          <div className="card card-pad" style={{ fontSize: 12, color: 'var(--t-2)', lineHeight: 1.55 }}>
            <div style={{ fontSize: 12, color: 'var(--t-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Audience reach</div>
            This pick will reach <strong style={{ color: 'var(--t-1)' }}>426 paying subscribers</strong>. Based on recent picks, expect ~1,200 views and ~280 saves in the first 4 hours.
          </div>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────
   Subscribers
   ───────────────────────────────────────────────────────── */
function CreatorSubscribers({ ctx }) {
  const subs = [
    { name: 'Alex Morgan', email: 'alex@morgan.co', plan: 'Premium', status: 'active', start: 'Mar 14, 2026', renew: 'Jun 14, 2026', ltv: '$294', tag: '' },
    { name: 'Riley Chen', email: 'riley@chen.io', plan: 'VIP', status: 'active', start: 'Jan 03, 2026', renew: 'Jun 03, 2026', ltv: '$594', tag: 'VIP' },
    { name: 'Jordan Pike', email: 'jp@pike.com', plan: 'Premium', status: 'past_due', start: 'Apr 22, 2026', renew: 'May 22, 2026', ltv: '$98', tag: '' },
    { name: 'Casey Park', email: 'casey@park.so', plan: 'Premium', status: 'active', start: 'Feb 11, 2026', renew: 'Jun 11, 2026', ltv: '$196', tag: 'New' },
    { name: 'Sam Olin', email: 'sam@olin.dev', plan: 'VIP', status: 'cancelled', start: 'Dec 02, 2025', renew: 'Ends Jun 02', ltv: '$594', tag: '' },
    { name: 'Drew Hayek', email: 'drew@hayek.org', plan: 'Premium', status: 'active', start: 'May 04, 2026', renew: 'Jun 04, 2026', ltv: '$49', tag: 'New' },
    { name: 'Mira Solis', email: 'mira@solis.studio', plan: 'Premium', status: 'trial', start: 'May 12, 2026', renew: 'Trial ends May 19', ltv: '$0', tag: '' },
  ];
  return (
    <>
      <Topbar title="Subscribers" crumb="Creator · Subscribers"
        actions={<><button className="btn btn-secondary btn-sm">Export CSV</button><button className="btn btn-primary btn-sm"><Icon name="message" size={13}/> Message all</button></>}/>
      <div style={{ padding: '24px 28px', maxWidth: 1400 }}>
        <PageHead title="Subscribers" sub="426 active members across 2 tiers."/>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 18 }}>
          <Metric label="Active" value="426" delta="+34 this mo" accent="var(--green)"/>
          <Metric label="VIP" value="58" sub="13.6% of active"/>
          <Metric label="Past due" value="12" sub="Retry within 3 days" accent="var(--amber)"/>
          <Metric label="ARPU" value="$32.10" delta="+$2.40"/>
        </div>

        <div className="row between" style={{ marginBottom: 14 }}>
          <div className="row" style={{ gap: 4 }}>
            {['All','Active','VIP','New this month','Past due','Cancelled'].map((t, i) => <span key={t} className={`chip ${i === 0 ? 'green-active' : ''}`}>{t}</span>)}
          </div>
          <div className="search" style={{ width: 280 }}><Icon name="search" size={14}/><input placeholder="Search subscribers"/></div>
        </div>

        <div className="card">
          <table className="tbl">
            <thead>
              <tr>
                <th>Subscriber</th><th>Plan</th><th>Status</th><th>Started</th><th>Renews</th><th className="num">LTV</th><th>Engagement</th><th></th>
              </tr>
            </thead>
            <tbody>
              {subs.map((s, i) => (
                <tr key={i}>
                  <td>
                    <div className="row" style={{ gap: 10 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 50, background: `oklch(60% 0.12 ${(i*60)%360})`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 500 }}>
                        {s.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="row" style={{ gap: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 500 }}>{s.name}</span>
                          {s.tag && <Badge tone={s.tag === 'VIP' ? 'gold' : 'blue'}>{s.tag}</Badge>}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--t-3)', marginTop: 2 }}>{s.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="tag">{s.plan}</span></td>
                  <td>
                    {s.status === 'active' && <Badge tone="green" dot>Active</Badge>}
                    {s.status === 'past_due' && <Badge tone="red" dot>Past due</Badge>}
                    {s.status === 'cancelled' && <Badge tone="neutral" dot>Cancelling</Badge>}
                    {s.status === 'trial' && <Badge tone="blue" dot>Trial</Badge>}
                  </td>
                  <td className="num" style={{ color: 'var(--t-3)' }}>{s.start}</td>
                  <td className="num" style={{ color: s.status === 'past_due' ? 'var(--amber)' : 'var(--t-2)' }}>{s.renew}</td>
                  <td className="num" style={{ fontWeight: 500 }}>{s.ltv}</td>
                  <td>
                    <div className="row" style={{ gap: 2 }}>
                      {Array.from({ length: 12 }).map((_, j) => (
                        <i key={j} style={{ width: 4, height: 14, borderRadius: 1, background: j < 3 + (i % 8) ? 'var(--green)' : 'var(--bg-3)' }}/>
                      ))}
                    </div>
                  </td>
                  <td><button className="btn btn-icon btn-ghost" style={{ width: 28, height: 28 }}><Icon name="more" size={14}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────
   Performance
   ───────────────────────────────────────────────────────── */
function CreatorPerformance({ ctx }) {
  const c = creatorById('courtvision');
  return (
    <>
      <Topbar title="Performance" crumb="Creator · Performance"/>
      <div style={{ padding: '24px 28px', maxWidth: 1400 }}>
        <PageHead title="Performance" sub="Public-facing track record. Updates automatically as picks are graded."/>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 18 }}>
          <Metric label="Win rate · 90d" value="61.2%" delta="+1.8%" accent="var(--green)"/>
          <Metric label="Net units" value="+62.7u" delta="+8.4u" accent="var(--green)"/>
          <Metric label="ROI" value="+18.4%" delta="+2.1%" accent="var(--green)"/>
          <Metric label="Total picks" value="253" sub="246 graded · 7 pending"/>
          <Metric label="Streak" value="W3" accent="var(--green)" sub="Current"/>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18, marginBottom: 18 }}>
          <div className="card card-pad">
            <div className="row between" style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>Cumulative units · last 90 days</div>
              <div className="row" style={{ gap: 6 }}>{['7D','30D','90D','YTD','All'].map((t,i) => <span key={t} className={`chip ${i === 2 ? 'active' : ''}`}>{t}</span>)}</div>
            </div>
            <PerformanceChart/>
          </div>
          <div className="card card-pad">
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 14 }}>By market</div>
            {[
              { m: 'NBA Player Props', wr: 0.638, picks: 124, units: '+42.1u' },
              { m: 'NBA Sides', wr: 0.598, picks: 56, units: '+12.8u' },
              { m: 'NBA Totals', wr: 0.572, picks: 73, units: '+7.8u' },
            ].map(r => (
              <div key={r.m} style={{ padding: '10px 0', borderBottom: '1px solid var(--line-soft)' }}>
                <div className="row between" style={{ marginBottom: 6 }}>
                  <span style={{ fontSize: 13 }}>{r.m}</span>
                  <span className="mono" style={{ fontSize: 12, color: 'var(--green)' }}>{r.units}</span>
                </div>
                <div className="row" style={{ gap: 8 }}>
                  <div className="bar" style={{ flex: 1 }}><i style={{ width: `${r.wr * 100}%` }}/></div>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--t-2)' }}>{(r.wr*100).toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="row between" style={{ padding: '14px 20px', borderBottom: '1px solid var(--line-soft)' }}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Recent graded picks</div>
            <div className="row" style={{ gap: 6 }}>
              <Badge tone="amber" dot>1 disputed</Badge>
              <Badge tone="green" dot>0 voided</Badge>
            </div>
          </div>
          <table className="tbl">
            <thead><tr><th>Pick</th><th>Sport</th><th>Market</th><th className="num">Stake</th><th className="num">Odds</th><th>Date</th><th>Result</th><th className="num">Net</th></tr></thead>
            <tbody>
              {DATA.RECENT_RESULTS.map(r => (
                <tr key={r.id}>
                  <td><span style={{ fontWeight: 500 }}>{r.title}</span></td>
                  <td><SportTag sport={r.sport}/></td>
                  <td>{r.market || '—'}</td>
                  <td className="num">{r.units}</td>
                  <td className="num">{r.odds}</td>
                  <td className="num" style={{ color: 'var(--t-3)' }}>{r.date}</td>
                  <td><GradeBadge grade={r.result}/></td>
                  <td className="num" style={{ color: r.result === 'win' ? 'var(--green)' : r.result === 'loss' ? 'var(--red)' : 'var(--t-2)', fontWeight: 500 }}>{r.netUnits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────
   Products & Pricing
   ───────────────────────────────────────────────────────── */
function CreatorProducts({ ctx }) {
  return (
    <>
      <Topbar title="Products & pricing" crumb="Creator · Products"
        actions={<button className="btn btn-primary btn-sm"><Icon name="plus" size={13}/> Create plan</button>}/>
      <div style={{ padding: '24px 28px', maxWidth: 1400 }}>
        <PageHead title="Products & pricing" sub="Manage subscription tiers and one-off products."/>

        <Section title="Subscription plans">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            <PlanCard title="Free Follow" price="0" period="forever" status="published" subs={1284} mrr="$0"
              features={['Public picks (~2/wk)','Free preview posts','Discord lobby']}/>
            <PlanCard title="Premium Picks" price="49" period="month" status="published" subs={368} mrr="$18,032" featured
              features={['All daily picks','Premium analysis & units','Pre-game alerts','Discord access']}/>
            <PlanCard title="VIP Card" price="99" period="month" status="published" subs={58} mrr="$5,742"
              features={['Everything in Premium','VIP-only plays','Bankroll templates','1:1 monthly Q&A']}/>
          </div>
        </Section>

        <Section title="Smart pricing experiment" style={{ marginTop: 28 }}>
          <div className="card card-pad" style={{ background: 'linear-gradient(135deg, rgba(232,194,117,0.05), transparent)', borderColor: 'var(--gold-line)' }}>
            <div className="row between" style={{ marginBottom: 16 }}>
              <div className="row" style={{ gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--gold-soft)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="rocket" size={16}/></div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>Test $54/mo for new Premium subscribers</div>
                  <div style={{ fontSize: 12, color: 'var(--t-3)', marginTop: 2 }}>Based on your win-rate, 90-day retention, and similar creators in NBA props</div>
                </div>
              </div>
              <Badge tone="gold">+$1,890/mo projected</Badge>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              <SmartCol label="Current price" value="$49" sub="Premium tier"/>
              <SmartCol label="Recommended" value="$54" sub="+10.2%" accent="var(--gold)"/>
              <SmartCol label="Risk" value="Low" sub="< 1.5% expected churn impact"/>
            </div>
            <div className="row" style={{ gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost btn-sm">Dismiss</button>
              <button className="btn btn-secondary btn-sm">Run for 30 days</button>
              <button className="btn btn-primary btn-sm">Apply now</button>
            </div>
          </div>
        </Section>
      </div>
    </>
  );
}

function PlanCard({ title, price, period, status, subs, mrr, features, featured }) {
  return (
    <div className={`price-card ${featured ? 'featured' : ''}`}>
      <div className="row between">
        <div className="row" style={{ gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 500 }}>{title}</span>
          <Badge tone="green" dot>{status}</Badge>
        </div>
        <button className="btn btn-icon btn-ghost" style={{ width: 28, height: 28 }}><Icon name="more" size={14}/></button>
      </div>
      <div className="row" style={{ alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 38, fontFamily: 'var(--f-serif)', fontWeight: 400, letterSpacing: '-0.02em' }}>${price}</span>
        <span style={{ fontSize: 13, color: 'var(--t-3)' }}>/ {period}</span>
      </div>
      <div className="row" style={{ gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--t-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Subscribers</div>
          <div className="mono" style={{ fontSize: 16, fontWeight: 500, marginTop: 2 }}>{subs.toLocaleString()}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--t-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>MRR</div>
          <div className="mono" style={{ fontSize: 16, fontWeight: 500, marginTop: 2, color: 'var(--green)' }}>{mrr}</div>
        </div>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {features.map((f, i) => (
          <li key={i} style={{ display: 'flex', gap: 10, fontSize: 12.5, color: 'var(--t-2)' }}>
            <Icon name="check" size={13} style={{ color: 'var(--green)', marginTop: 2, flexShrink: 0 }}/>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <div className="row" style={{ gap: 8 }}>
        <button className="btn btn-secondary btn-sm" style={{ flex: 1 }}>Edit</button>
        <button className="btn btn-ghost btn-sm">Analytics</button>
      </div>
    </div>
  );
}

function SmartCol({ label, value, sub, accent }) {
  return (
    <div style={{ padding: 14, background: 'var(--bg-1)', border: '1px solid var(--line-soft)', borderRadius: 10 }}>
      <div style={{ fontSize: 11, color: 'var(--t-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div className="mono" style={{ fontSize: 22, fontWeight: 500, color: accent || 'var(--t-1)', margin: '6px 0 4px' }}>{value}</div>
      <div style={{ fontSize: 11.5, color: 'var(--t-3)' }}>{sub}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Growth + Access (lighter)
   ───────────────────────────────────────────────────────── */
function CreatorGrowth({ ctx }) {
  return (
    <>
      <Topbar title="Growth manager" crumb="Creator · Growth"/>
      <div style={{ padding: '24px 28px', maxWidth: 1300 }}>
        <PageHead title="Growth manager" sub="Funnel, referrals, and promo campaigns in one place."/>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 18 }}>
          <Metric label="New subs · 30d" value="142" delta="+24%" accent="var(--green)"/>
          <Metric label="Conversion" value="2.94%" delta="+0.4 pts" accent="var(--green)"/>
          <Metric label="Referral revenue" value="$2,184" sub="From 18 referrers"/>
          <Metric label="Promo redeemed" value="68" sub="LAUNCH50 · ends Jun 1"/>
        </div>

        <Section title="Acquisition sources">
          <div className="card card-pad">
            {[
              { s: 'X / Twitter threads', p: 38, v: 1830 },
              { s: 'DigiPicks Discover', p: 26, v: 1252 },
              { s: 'Direct profile link', p: 18, v: 866 },
              { s: 'Referrals', p: 12, v: 578 },
              { s: 'Other', p: 6, v: 290 },
            ].map(r => (
              <div key={r.s} style={{ marginBottom: 12 }}>
                <div className="row between" style={{ marginBottom: 5 }}>
                  <span style={{ fontSize: 13, color: 'var(--t-2)' }}>{r.s}</span>
                  <span className="mono" style={{ fontSize: 12 }}><span style={{ color: 'var(--t-3)' }}>{r.v.toLocaleString()} visits</span><span style={{ marginLeft: 12, fontWeight: 500 }}>{r.p}%</span></span>
                </div>
                <div className="bar"><i style={{ width: `${r.p * 2.6}%` }}/></div>
              </div>
            ))}
          </div>
        </Section>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginTop: 28 }}>
          <Section title="Referral program">
            <div className="card card-pad">
              <div style={{ fontSize: 12.5, color: 'var(--t-2)', marginBottom: 14 }}>Earn 20% commission on every paid subscriber referred via your unique link.</div>
              <div className="row" style={{ gap: 8, marginBottom: 14 }}>
                <input className="input mono" readOnly value="https://digipicks.app/c/courtvision?ref=cvp"/>
                <button className="btn btn-secondary btn-sm">Copy</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                <Stat label="Clicks" value="1,420"/>
                <Stat label="Signups" value="68"/>
                <Stat label="Earnings" value="$2,184" accent="var(--green)"/>
              </div>
            </div>
          </Section>
          <Section title="Promo codes">
            <div className="card">
              {[
                { code: 'LAUNCH50', off: '50% off first month', uses: '68 / 200', ends: 'Jun 1' },
                { code: 'NBAFINALS', off: '$10 off Premium', uses: '12 / 100', ends: 'Jun 22' },
                { code: 'VIPCOMP', off: '7-day VIP trial', uses: '4 / 50', ends: 'Jun 30' },
              ].map((p, i) => (
                <div key={p.code} className="row between" style={{ padding: '14px 18px', borderBottom: i < 2 ? '1px solid var(--line-soft)' : 'none' }}>
                  <div>
                    <div className="mono" style={{ fontSize: 13, fontWeight: 500 }}>{p.code}</div>
                    <div style={{ fontSize: 12, color: 'var(--t-3)', marginTop: 2 }}>{p.off}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="mono" style={{ fontSize: 12 }}>{p.uses}</div>
                    <div style={{ fontSize: 11, color: 'var(--t-3)', marginTop: 2 }}>Ends {p.ends}</div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </>
  );
}

function CreatorAccess({ ctx }) {
  return (
    <>
      <Topbar title="Access control" crumb="Creator · Access"/>
      <div style={{ padding: '24px 28px', maxWidth: 1200 }}>
        <PageHead title="Access control" sub="Map plans to content and manage entitlement edge cases."/>

        <Section title="Content access matrix">
          <div className="card" style={{ overflow: 'hidden' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Content type</th>
                  <th style={{ textAlign: 'center' }}>Free</th>
                  <th style={{ textAlign: 'center' }}>Premium</th>
                  <th style={{ textAlign: 'center' }}>VIP</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Public free picks', 'all', 'all', 'all'],
                  ['Daily premium picks', 'preview', 'all', 'all'],
                  ['VIP-only plays', '—', '—', 'all'],
                  ['Premium analysis', 'preview', 'all', 'all'],
                  ['Pre-game alerts', '—', 'all', 'all'],
                  ['Discord — VIP channel', '—', '—', 'all'],
                  ['Bankroll templates', '—', '—', 'all'],
                ].map(([row, a, b, c], i) => (
                  <tr key={i}>
                    <td><span style={{ fontWeight: 500 }}>{row}</span></td>
                    {[a,b,c].map((v, j) => (
                      <td key={j} style={{ textAlign: 'center' }}>
                        {v === 'all' && <Icon name="check" size={14} style={{ color: 'var(--green)' }}/>}
                        {v === 'preview' && <span style={{ fontSize: 11.5, color: 'var(--t-3)', fontStyle: 'italic' }}>preview</span>}
                        {v === '—' && <span style={{ color: 'var(--t-4)' }}>—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Edge cases" style={{ marginTop: 28 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
            <div className="card card-pad">
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>Past-due grace period</div>
              <p style={{ fontSize: 12.5, color: 'var(--t-3)', margin: '0 0 12px' }}>Allow access for N days after a failed payment while we retry.</p>
              <div className="row" style={{ gap: 8 }}>
                {['0 days','3 days','7 days','14 days'].map((d, i) => <span key={d} className={`chip ${i === 1 ? 'green-active' : ''}`}>{d}</span>)}
              </div>
            </div>
            <div className="card card-pad">
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>Manual access overrides</div>
              <p style={{ fontSize: 12.5, color: 'var(--t-3)', margin: '0 0 12px' }}>Grant complimentary access to specific subscribers.</p>
              <button className="btn btn-secondary btn-sm">Grant access</button>
            </div>
          </div>
        </Section>
      </div>
    </>
  );
}

window.CreatorOverview = CreatorOverview;
window.CreatorPicks = CreatorPicks;
window.CreatePick = CreatePick;
window.CreatorSubscribers = CreatorSubscribers;
window.CreatorPerformance = CreatorPerformance;
window.CreatorProducts = CreatorProducts;
window.CreatorGrowth = CreatorGrowth;
window.CreatorAccess = CreatorAccess;
