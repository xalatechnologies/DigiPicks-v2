// public2.jsx — Discover, Creator Profile, Apply Flow
const { useState: usePub2 } = React;

/* ─────────────────────────────────────────────────────────
   Discover — creator marketplace
   ───────────────────────────────────────────────────────── */
function Discover({ ctx, isPublic }) {
  const [sport, setSport] = usePub2('All');
  const [pricing, setPricing] = usePub2('All');
  const [sort, setSort] = usePub2('Trending');
  const [verifiedOnly, setVerifiedOnly] = usePub2(false);

  let list = DATA.CREATORS.filter(c => sport === 'All' || c.sports.includes(sport));
  if (pricing === 'Free') list = list.filter(c => c.startingPrice === 0);
  if (pricing === 'Premium') list = list.filter(c => c.startingPrice > 0);
  if (verifiedOnly) list = list.filter(c => c.verified);
  if (sort === 'Highest win rate') list = [...list].sort((a,b) => b.winRate - a.winRate);
  if (sort === 'Most subscribers') list = [...list].sort((a,b) => b.subs - a.subs);
  if (sort === 'Best value') list = [...list].sort((a,b) => (b.winRate / Math.max(b.startingPrice,1)) - (a.winRate / Math.max(a.startingPrice,1)));

  const Body = (
    <div style={{ maxWidth: isPublic ? 1280 : 'none', margin: '0 auto', padding: '24px 28px' }}>
      {isPublic && (
        <div style={{ padding: '40px 0 24px' }}>
          <div style={{ fontSize: 12, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Creator marketplace</div>
          <h1 className="serif" style={{ fontSize: 56, fontWeight: 400, letterSpacing: '-0.025em', margin: '0 0 14px', fontStyle: 'italic' }}>Find a creator worth following.</h1>
          <p style={{ fontSize: 16, color: 'var(--t-2)', maxWidth: 640, margin: 0 }}>Verified, transparently graded, and disciplined. Filter by sport, niche, and proven track record.</p>
        </div>
      )}
      {!isPublic && <PageHead title="Discover Creators" sub="Find verified creators in your niche."/>}

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 22 }}>
        {/* filters */}
        <aside style={{ position: 'sticky', top: 80, alignSelf: 'flex-start' }}>
          <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            <FilterGroup title="Sport">
              {['All', ...DATA.SPORTS].map(s => (
                <FilterRadio key={s} label={s} checked={sport === s} onClick={() => setSport(s)}/>
              ))}
            </FilterGroup>
            <FilterGroup title="Pricing">
              {['All','Free','Premium'].map(p => (
                <FilterRadio key={p} label={p} checked={pricing === p} onClick={() => setPricing(p)}/>
              ))}
            </FilterGroup>
            <FilterGroup title="Trust">
              <FilterCheck label="Verified only" checked={verifiedOnly} onClick={() => setVerifiedOnly(v => !v)}/>
              <FilterCheck label="60%+ win rate" checked={false}/>
              <FilterCheck label="500+ subscribers" checked={false}/>
            </FilterGroup>
            <FilterGroup title="Win rate">
              <div className="bar" style={{ marginBottom: 8 }}><i style={{ width: '60%' }}/></div>
              <div className="row between mono" style={{ fontSize: 11, color: 'var(--t-3)' }}><span>50%</span><span>70%</span></div>
            </FilterGroup>
          </div>
        </aside>

        {/* results */}
        <div>
          <div className="row between" style={{ marginBottom: 16 }}>
            <div className="row" style={{ gap: 8 }}>
              <div className="search" style={{ width: 280 }}>
                <Icon name="search" size={14}/>
                <input placeholder="Search creators or niches"/>
              </div>
              <span style={{ fontSize: 12.5, color: 'var(--t-3)' }}>{list.length} creators</span>
            </div>
            <div className="row" style={{ gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--t-3)' }}>Sort</span>
              <select className="input" style={{ width: 180, height: 32 }} value={sort} onChange={(e) => setSort(e.target.value)}>
                {['Trending','Highest win rate','Most subscribers','New creators','Best value'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
            {list.map(c => <CreatorCard key={c.id} creator={c} onOpen={() => ctx.openCreator(c.id)}/>)}
          </div>
          {list.length === 0 && <EmptyState icon="search" title="No creators match" subtitle="Try widening your filters."/>}
        </div>
      </div>
    </div>
  );

  if (isPublic) return Body;
  return (<><Topbar title="Discover Creators" search="Search creators, niches"/>{Body}</>);
}

function FilterGroup({ title, children }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--t-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8, fontWeight: 500 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{children}</div>
    </div>
  );
}
function FilterRadio({ label, checked, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 9,
      background: 'transparent', border: 'none',
      padding: '6px 6px', borderRadius: 6, cursor: 'pointer',
      color: checked ? 'var(--t-1)' : 'var(--t-2)',
      fontSize: 13, textAlign: 'left',
    }}>
      <span style={{
        width: 14, height: 14, borderRadius: 50,
        border: `1px solid ${checked ? 'var(--green)' : 'var(--line-strong)'}`,
        background: checked ? 'var(--green)' : 'transparent',
        boxShadow: checked ? 'inset 0 0 0 3px var(--bg-1)' : 'none',
      }}/>
      {label}
    </button>
  );
}
function FilterCheck({ label, checked, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 9,
      background: 'transparent', border: 'none',
      padding: '6px 6px', borderRadius: 6, cursor: 'pointer',
      color: checked ? 'var(--t-1)' : 'var(--t-2)',
      fontSize: 13, textAlign: 'left',
    }}>
      <span style={{
        width: 14, height: 14, borderRadius: 4,
        border: `1px solid ${checked ? 'var(--green)' : 'var(--line-strong)'}`,
        background: checked ? 'var(--green)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#001A0F',
      }}>{checked && <Icon name="check" size={10}/>}</span>
      {label}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────
   Creator profile
   ───────────────────────────────────────────────────────── */
function CreatorProfile({ ctx, creatorId, isPublic }) {
  const c = creatorById(creatorId);
  const [tab, setTab] = usePub2('picks');
  if (!c) return <EmptyState icon="user" title="Creator not found"/>;

  const Body = (
    <div style={{ maxWidth: isPublic ? 1280 : 'none', margin: '0 auto', padding: '0 28px' }}>
      {/* hero */}
      <div style={{
        position: 'relative', borderRadius: 16, overflow: 'hidden',
        marginTop: 24,
        background: `linear-gradient(135deg, ${c.avatar.color}22, transparent 60%), var(--bg-1)`,
        border: '1px solid var(--line)',
        padding: 30,
      }}>
        <div className="row" style={{ gap: 24, alignItems: 'flex-start' }}>
          <Avatar creator={c} size={88}/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="row" style={{ gap: 8, marginBottom: 6 }}>
              <h1 style={{ fontSize: 30, fontWeight: 500, letterSpacing: '-0.015em', margin: 0 }}>{c.name}</h1>
              {c.verified && <VerifiedMark size={18}/>}
              <Badge tone="green" icon="flame">Trending</Badge>
            </div>
            <div style={{ fontSize: 13, color: 'var(--t-3)', marginBottom: 14, fontFamily: 'var(--f-mono)' }}>{c.handle} · {c.niche}</div>
            <p style={{ fontSize: 15, color: 'var(--t-2)', lineHeight: 1.55, maxWidth: 640, margin: '0 0 18px' }}>{c.bio}</p>
            <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
              {c.tags.map(t => <span key={t} className="tag">{t}</span>)}
              {c.sports.map(s => <span key={s} className="tag" style={{ color: SPORT_TONE[s] }}>{s}</span>)}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 220 }}>
            <button className="btn btn-lg btn-primary">Subscribe — from ${c.startingPrice}/mo</button>
            <button className="btn btn-secondary">Follow free</button>
          </div>
        </div>

        {/* stats strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0, marginTop: 26, borderTop: '1px solid var(--line)', paddingTop: 20 }}>
          <BigStat label="Win rate" value={`${(c.winRate*100).toFixed(1)}%`} accent="var(--green)" sub="Last 90 days"/>
          <BigStat label="Record" value={c.record} sub="W–L–P"/>
          <BigStat label="Units" value={c.units} accent="var(--green)" sub="Net (1u stake)"/>
          <BigStat label="Streak" value={c.streak} accent={c.streak.startsWith('W') ? 'var(--green)' : 'var(--red)'} sub="Active"/>
          <BigStat label="Subscribers" value={c.subs.toLocaleString()} sub="Active members"/>
        </div>
      </div>

      {/* tabs */}
      <div style={{ display: 'flex', gap: 4, marginTop: 28, marginBottom: 20, borderBottom: '1px solid var(--line-soft)' }}>
        {[
          { id: 'picks', label: 'Recent picks' },
          { id: 'pricing', label: 'Pricing' },
          { id: 'performance', label: 'Performance' },
          { id: 'about', label: 'About' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: 'transparent', border: 'none', padding: '12px 16px',
            color: tab === t.id ? 'var(--t-1)' : 'var(--t-3)',
            fontSize: 13.5, fontWeight: 500, cursor: 'pointer',
            borderBottom: `2px solid ${tab === t.id ? 'var(--green)' : 'transparent'}`,
            marginBottom: -1,
          }}>{t.label}</button>
        ))}
      </div>

      {tab === 'picks' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 22 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {DATA.FEED_PICKS.filter(p => p.creator === creatorId || creatorId === 'courtvision').slice(0,3).map(p => (
              <PickCard key={p.id} pick={p} onOpen={() => ctx.openPick(p.id)}
                locked={isPublic && p.access !== 'free'}/>
            ))}
            <div style={{ padding: 18, border: '1px dashed var(--gold-line)', borderRadius: 12, background: 'rgba(232,194,117,0.03)', textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: 'var(--t-2)', marginBottom: 10 }}>+ 142 more premium picks behind subscription</div>
              <button className="btn btn-sm btn-primary">Subscribe to unlock</button>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="card card-pad">
              <div style={{ fontSize: 11, color: 'var(--t-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Recent form</div>
              <FormDots last10={c.last10}/>
              <div style={{ fontSize: 12.5, color: 'var(--t-2)', marginTop: 12, lineHeight: 1.5 }}>
                {c.last10.split('').filter(x => x === 'W').length}–{c.last10.split('').filter(x => x === 'L').length} over last 10 graded picks
              </div>
            </div>
            <div className="card card-pad">
              <div style={{ fontSize: 11, color: 'var(--t-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>What subscribers say</div>
              <p className="serif" style={{ fontSize: 17, lineHeight: 1.4, color: 'var(--t-1)', margin: '0 0 12px', fontStyle: 'italic' }}>"Disciplined, no chase bets, transparent log. Worth the price."</p>
              <div style={{ fontSize: 11.5, color: 'var(--t-3)' }}>Riley · subscriber, 4 months</div>
            </div>
            <ResponsibleNote/>
          </div>
        </div>
      )}

      {tab === 'pricing' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <PriceCard title="Free Follow" price="0" period="forever" features={['Public picks (~2/wk)','Free preview posts','Weekly free slate notes']} cta="Follow free"/>
          <PriceCard title="Premium Picks" price={c.startingPrice} period="month" featured features={['All daily picks (~10/wk)','Premium analysis & units','Pre-game alerts','Discord access']} cta="Subscribe"/>
          <PriceCard title="VIP Card" price={c.startingPrice * 2 + 21} period="month" features={['Everything in Premium','VIP-only plays','Bankroll templates','1:1 monthly Q&A','Priority message replies']} cta="Go VIP"/>
        </div>
      )}

      {tab === 'performance' && <PerformanceView c={c}/>}

      {tab === 'about' && (
        <div className="card card-pad" style={{ maxWidth: 760 }}>
          <p style={{ fontSize: 15, lineHeight: 1.65, color: 'var(--t-2)' }}>{c.bio}</p>
          <hr className="hr" style={{ margin: '16px 0' }}/>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, fontSize: 13 }}>
            <div><span style={{ color: 'var(--t-3)' }}>Sports covered:</span> {c.sports.join(', ')}</div>
            <div><span style={{ color: 'var(--t-3)' }}>Joined DigiPicks:</span> Jan 2024</div>
            <div><span style={{ color: 'var(--t-3)' }}>Verification status:</span> {c.verified ? 'Verified' : 'Pending'}</div>
            <div><span style={{ color: 'var(--t-3)' }}>Grading:</span> Independent, platform-graded</div>
          </div>
        </div>
      )}

      <ResponsibleNote style={{ margin: '32px 0' }}/>
    </div>
  );

  if (isPublic) return Body;
  return (
    <>
      <Topbar title={c.name} crumb="Discover › Creator"
        actions={<><button className="btn btn-secondary" onClick={() => ctx.go('discover')}><Icon name="arrow-left" size={13}/> Back</button><button className="btn btn-primary">Subscribe</button></>}/>
      {Body}
    </>
  );
}

function BigStat({ label, value, accent, sub }) {
  return (
    <div style={{ borderRight: '1px solid var(--line-soft)', padding: '0 18px' }}>
      <div style={{ fontSize: 10.5, color: 'var(--t-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{label}</div>
      <div className="mono" style={{ fontSize: 22, color: accent || 'var(--t-1)', fontWeight: 500, letterSpacing: '-0.01em' }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--t-3)', marginTop: 4 }}>{sub}</div>
    </div>
  );
}

function PriceCard({ title, price, period, features, cta, featured }) {
  return (
    <div className={`price-card ${featured ? 'featured' : ''}`}>
      <div className="row between">
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--t-1)' }}>{title}</div>
        {featured && <Badge tone="green">Most popular</Badge>}
      </div>
      <div className="row" style={{ alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 38, fontFamily: 'var(--f-serif)', fontWeight: 400, letterSpacing: '-0.02em' }}>${price}</span>
        <span style={{ fontSize: 13, color: 'var(--t-3)' }}>/ {period}</span>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
        {features.map((f, i) => (
          <li key={i} style={{ display: 'flex', gap: 10, fontSize: 13, color: 'var(--t-2)', alignItems: 'flex-start' }}>
            <Icon name="check" size={14} style={{ color: featured ? 'var(--green)' : 'var(--t-2)', marginTop: 2, flexShrink: 0 }}/>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <button className={`btn ${featured ? 'btn-primary' : 'btn-outline'}`} style={{ marginTop: 'auto' }}>{cta}</button>
    </div>
  );
}

function PerformanceView({ c }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18 }}>
      <div className="card card-pad">
        <div className="row between" style={{ marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--t-3)' }}>Cumulative units · last 90 days</div>
            <div className="mono" style={{ fontSize: 28, fontWeight: 500, color: 'var(--green)', marginTop: 4 }}>{c.units}</div>
          </div>
          <div className="row" style={{ gap: 6 }}>
            {['7D','30D','90D','YTD'].map((t, i) => <span key={t} className={`chip ${i === 2 ? 'active' : ''}`}>{t}</span>)}
          </div>
        </div>
        <PerformanceChart/>
      </div>
      <div className="card card-pad">
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Breakdown by sport</div>
        {[
          { s: 'NBA Player Props', wr: 0.638, picks: 124, units: '+42.1' },
          { s: 'NBA Sides', wr: 0.598, picks: 56, units: '+12.8' },
          { s: 'NBA Totals', wr: 0.572, picks: 73, units: '+7.8' },
        ].map(r => (
          <div key={r.s} style={{ padding: '10px 0', borderBottom: '1px solid var(--line-soft)' }}>
            <div className="row between" style={{ marginBottom: 6 }}>
              <span style={{ fontSize: 13 }}>{r.s}</span>
              <span className="mono" style={{ fontSize: 12, color: 'var(--green)' }}>{r.units}u</span>
            </div>
            <div className="row" style={{ gap: 8 }}>
              <div className="bar" style={{ flex: 1 }}><i style={{ width: `${r.wr * 100}%` }}/></div>
              <span className="mono" style={{ fontSize: 11, color: 'var(--t-2)' }}>{(r.wr*100).toFixed(1)}%</span>
              <span className="mono" style={{ fontSize: 11, color: 'var(--t-3)' }}>{r.picks}p</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PerformanceChart() {
  // sample 90-day cumulative units
  const data = [0, 1.2, 2.1, 1.8, 3.2, 4.1, 5.0, 4.6, 6.2, 7.4, 8.1, 7.5, 9.2, 10.8, 12.4, 13.6, 14.2, 15.8, 18.2, 17.6, 19.8, 22.1, 24.4, 26.0, 28.2, 31.1, 33.4, 35.0, 37.2, 38.6, 41.0, 43.2, 45.6, 47.8, 49.2, 51.0, 53.4, 55.8, 58.2, 60.4, 62.7];
  const w = 700, h = 220, pad = 12;
  const min = 0, max = Math.max(...data);
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / (max - min)) * (h - pad * 2);
    return [x, y];
  });
  const line = pts.map(([x,y]) => `${x},${y}`).join(' ');
  const area = `${pts[0][0]},${h - pad} ${line} ${pts[pts.length-1][0]},${h - pad}`;
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="cgrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(0,224,143,0.3)"/>
          <stop offset="100%" stopColor="rgba(0,224,143,0)"/>
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((p, i) => (
        <line key={i} x1={pad} x2={w-pad} y1={pad + p * (h - pad*2)} y2={pad + p * (h - pad*2)} stroke="var(--line-soft)"/>
      ))}
      <polygon points={area} fill="url(#cgrad)"/>
      <polyline points={line} fill="none" stroke="var(--green)" strokeWidth="2"/>
      {pts.filter((_, i) => i === 0 || i === pts.length - 1).map(([x,y], i) => (
        <circle key={i} cx={x} cy={y} r="3" fill="var(--green)" stroke="var(--bg-1)" strokeWidth="2"/>
      ))}
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────
   Apply flow — multi-step
   ───────────────────────────────────────────────────────── */
function ApplyFlow({ ctx }) {
  const [step, setStep] = usePub2(1);
  const steps = [
    'Basics', 'Niche', 'Track record', 'Monetization', 'Review',
  ];
  return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: '60px 28px 80px' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 12, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Apply for creator access</div>
        <h1 className="serif" style={{ fontSize: 42, fontWeight: 400, letterSpacing: '-0.02em', margin: '0 0 12px', fontStyle: 'italic' }}>Tell us about your edge.</h1>
        <p style={{ fontSize: 15, color: 'var(--t-2)', maxWidth: 560, margin: 0, lineHeight: 1.6 }}>We manually review every application. Most decisions take 3–5 business days. We're looking for a transparent, datable history of picks.</p>
      </div>

      {/* progress */}
      <div className="row" style={{ gap: 0, marginBottom: 28 }}>
        {steps.map((s, i) => {
          const done = step > i + 1;
          const active = step === i + 1;
          return (
            <Fragment key={s}>
              <div className="row" style={{ gap: 10, opacity: active || done ? 1 : 0.5 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 50,
                  background: done ? 'var(--green)' : active ? 'var(--bg-3)' : 'var(--bg-2)',
                  border: `1px solid ${active ? 'var(--green)' : done ? 'var(--green)' : 'var(--line)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: done ? '#001A0F' : active ? 'var(--green)' : 'var(--t-3)',
                  fontFamily: 'var(--f-mono)', fontSize: 12, fontWeight: 600,
                }}>{done ? <Icon name="check" size={12}/> : i + 1}</div>
                <span style={{ fontSize: 13, fontWeight: active ? 500 : 400, color: active ? 'var(--t-1)' : 'var(--t-3)' }}>{s}</span>
              </div>
              {i < steps.length - 1 && <div style={{ flex: 1, height: 1, background: done ? 'var(--green)' : 'var(--line)', margin: '0 14px' }}/>}
            </Fragment>
          );
        })}
      </div>

      <div className="card" style={{ padding: 32 }}>
        {step === 1 && <ApplyStep1/>}
        {step === 2 && <ApplyStep2/>}
        {step === 3 && <ApplyStep3/>}
        {step === 4 && <ApplyStep4/>}
        {step === 5 && <ApplyStep5/>}
      </div>

      <div className="row between" style={{ marginTop: 22 }}>
        <button className="btn btn-ghost" onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}>
          <Icon name="arrow-left" size={13}/> Back
        </button>
        <div className="row" style={{ gap: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--t-3)' }}>Step {step} of {steps.length}</span>
          {step < 5 ? (
            <button className="btn btn-primary" onClick={() => setStep(s => Math.min(5, s + 1))}>Continue <Icon name="arrow-right" size={13}/></button>
          ) : (
            <button className="btn btn-primary" onClick={() => alert('Application submitted (prototype). You\'d see the under-review state next.')}>Submit application</button>
          )}
        </div>
      </div>

      <div style={{ marginTop: 28, textAlign: 'center' }}>
        <ApplicationStatusExamples/>
      </div>
    </div>
  );
}

function FormGrid({ children, cols = 2 }) {
  return <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 18 }}>{children}</div>;
}
function Field({ label, children, hint, full }) {
  return (
    <div style={{ gridColumn: full ? '1 / -1' : 'auto' }}>
      <label className="field-label">{label}</label>
      {children}
      {hint && <div style={{ fontSize: 11.5, color: 'var(--t-3)', marginTop: 6 }}>{hint}</div>}
    </div>
  );
}

function ApplyStep1() {
  return (
    <div>
      <SectionHead title="The basics" sub="We need a real name and a verifiable email."/>
      <FormGrid>
        <Field label="Full name"><input className="input" placeholder="Marco Diaz"/></Field>
        <Field label="Email"><input className="input" placeholder="you@example.com"/></Field>
        <Field label="Creator handle" hint="Lowercase, letters and numbers, no spaces.">
          <input className="input" placeholder="sharpedge_bets"/>
        </Field>
        <Field label="Location & timezone">
          <select className="input"><option>Pacific Time (PT)</option><option>Eastern Time (ET)</option><option>Central European Time</option></select>
        </Field>
      </FormGrid>
    </div>
  );
}
function ApplyStep2() {
  return (
    <div>
      <SectionHead title="Your niche" sub="Be specific. Specialists do better than generalists."/>
      <FormGrid>
        <Field label="Sports covered" full>
          <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
            {DATA.SPORTS.map((s, i) => <span key={s} className={`chip ${[0,1].includes(i) ? 'green-active' : ''}`}>{s}</span>)}
          </div>
        </Field>
        <Field label="Markets you cover" full>
          <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
            {['Sides','Totals','Player props','Anytime TD','Goalies','First half','SGPs','Live'].map((m, i) => (
              <span key={m} className={`chip ${[0,1,2].includes(i) ? 'active' : ''}`}>{m}</span>
            ))}
          </div>
        </Field>
        <Field label="Existing audience size">
          <select className="input"><option>0–500</option><option>500–2,000</option><option>2,000–10,000</option><option>10,000+</option></select>
        </Field>
        <Field label="Where do they live now?">
          <input className="input" placeholder="Discord, Telegram, X, Substack, etc."/>
        </Field>
      </FormGrid>
    </div>
  );
}
function ApplyStep3() {
  return (
    <div>
      <SectionHead title="Track record" sub="Show us your work. Verifiable history matters more than win-rate claims."/>
      <FormGrid cols={1}>
        <Field label="Performance summary" full>
          <textarea className="input" rows={4} placeholder="Win rate, units, sport-specific records. Be precise — we'll cross-check."/>
        </Field>
        <Field label="Links to your tracked history" full hint="X threads, Discord channels, Pikkit/BetTracker exports, Substack archive, etc.">
          <input className="input" placeholder="https://"/>
          <input className="input" style={{ marginTop: 8 }} placeholder="https://"/>
          <button className="btn btn-sm btn-ghost" style={{ marginTop: 8 }}><Icon name="plus" size={12}/> Add another link</button>
        </Field>
        <Field label="Proof files" full>
          <div style={{
            border: '1px dashed var(--line)', borderRadius: 12, padding: 22,
            display: 'flex', alignItems: 'center', gap: 14, background: 'var(--bg-2)',
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t-2)' }}>
              <Icon name="audit" size={16}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 500, marginBottom: 2 }}>Drop screenshots, CSV exports, PDF reports</div>
              <div style={{ fontSize: 12, color: 'var(--t-3)' }}>PNG, JPG, PDF, CSV up to 10MB each</div>
            </div>
            <button className="btn btn-secondary btn-sm">Browse</button>
          </div>
        </Field>
      </FormGrid>
    </div>
  );
}
function ApplyStep4() {
  return (
    <div>
      <SectionHead title="Monetization plan" sub="What will you charge for, and how often will you publish?"/>
      <FormGrid>
        <Field label="Planned starting price">
          <input className="input" placeholder="$29 / month"/>
        </Field>
        <Field label="Tiers you plan to offer">
          <select className="input"><option>Premium only</option><option>Free + Premium</option><option>Free + Premium + VIP</option></select>
        </Field>
        <Field label="Posting frequency">
          <select className="input"><option>Daily</option><option>5×/week</option><option>3×/week</option><option>Slate-based</option></select>
        </Field>
        <Field label="Premium content style">
          <select className="input"><option>Picks + analysis</option><option>Picks only</option><option>Analysis-led</option></select>
        </Field>
        <Field label="What's your subscriber promise?" full hint="One sentence subscribers can hold you to.">
          <textarea className="input" rows={3} placeholder="e.g. 4–6 NBA player prop picks per night with full analysis, no parlays, units transparent."/>
        </Field>
      </FormGrid>
    </div>
  );
}
function ApplyStep5() {
  return (
    <div>
      <SectionHead title="Review & submit" sub="Double-check, then send. Most reviews finish within 5 business days."/>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[
          { l: 'Marco Diaz', s: 'marco@example.com · @marco_diaz · Pacific Time' },
          { l: 'MLB run lines & totals', s: 'Existing audience: 500–2,000 (Discord)' },
          { l: '3 links · 2 files', s: 'Pikkit export, X thread, Substack archive' },
          { l: '$25/mo · Free + Premium', s: 'Daily posting · Picks + analysis' },
        ].map((r, i) => (
          <div key={i} className="card card-pad row between">
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 3 }}>{r.l}</div>
              <div style={{ fontSize: 12.5, color: 'var(--t-3)' }}>{r.s}</div>
            </div>
            <button className="btn btn-ghost btn-sm">Edit</button>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 22, padding: 16, background: 'var(--bg-2)', borderRadius: 10, fontSize: 12.5, color: 'var(--t-2)', lineHeight: 1.6 }}>
        <Icon name="shield" size={14} style={{ verticalAlign: '-2px', marginRight: 6, color: 'var(--blue)' }}/>
        I confirm my track-record claims are honest and verifiable. I understand DigiPicks may verify with third-party trackers and reject applications with inflated claims.
      </div>
    </div>
  );
}

function SectionHead({ title, sub }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <h3 style={{ fontSize: 19, fontWeight: 500, letterSpacing: '-0.01em', margin: '0 0 4px' }}>{title}</h3>
      <p style={{ fontSize: 13, color: 'var(--t-3)', margin: 0 }}>{sub}</p>
    </div>
  );
}

function ApplicationStatusExamples() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 14 }}>
      {[
        { t: 'Submitted', d: 'We got your application.', tone: 'blue', icon: 'check' },
        { t: 'Under review', d: 'Typically 3–5 business days.', tone: 'amber', icon: 'clock' },
        { t: 'More info needed', d: "We'll email you for clarification.", tone: 'amber', icon: 'message' },
        { t: 'Approved', d: 'Welcome to the network.', tone: 'green', icon: 'check' },
      ].map(s => (
        <div key={s.t} className="card" style={{ padding: 14, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Badge tone={s.tone} icon={s.icon}>{s.t}</Badge>
          <div style={{ fontSize: 12, color: 'var(--t-3)', lineHeight: 1.5 }}>{s.d}</div>
        </div>
      ))}
    </div>
  );
}

window.Discover = Discover;
window.CreatorProfile = CreatorProfile;
window.ApplyFlow = ApplyFlow;
window.PriceCard = PriceCard;
window.PerformanceChart = PerformanceChart;
