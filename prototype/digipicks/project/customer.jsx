// customer.jsx — Customer screens: Feed, Pick Detail, Results, Saved, Subscriptions, Notifications, Settings
const { useState: useC } = React;

/* ─────────────────────────────────────────────────────────
   Feed
   ───────────────────────────────────────────────────────── */
function CustomerFeed({ ctx }) {
  const [tab, setTab] = useC('all');
  const [saved, setSaved] = useC({});
  const picks = DATA.FEED_PICKS.filter(p => tab === 'all' ? true : tab === 'free' ? p.access === 'free' : p.access !== 'free');
  return (
    <>
      <Topbar title="Feed" search="Search picks, creators, events"
        actions={<><button className="btn btn-secondary"><Icon name="filter" size={13}/> Filters</button><button className="btn btn-icon btn-ghost"><Icon name="bell" size={15}/></button></>}/>
      <div style={{ padding: '24px 28px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, maxWidth: 1400 }}>
        <div>
          <div className="row between" style={{ marginBottom: 18 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 500, letterSpacing: '-0.015em', margin: '0 0 4px' }}>Tonight's picks</h1>
              <p style={{ fontSize: 13, color: 'var(--t-3)', margin: 0 }}>5 creators · 12 picks · 3 starting in the next hour</p>
            </div>
          </div>

          <div className="row" style={{ gap: 6, marginBottom: 18 }}>
            {[
              { id: 'all', label: 'All picks', count: 12 },
              { id: 'premium', label: 'Premium', count: 8 },
              { id: 'free', label: 'Free', count: 4 },
              { id: 'urgent', label: 'Starting soon', count: 3 },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`chip ${tab === t.id ? 'green-active' : ''}`}>
                {t.label} <span style={{ opacity: 0.6, marginLeft: 4 }}>{t.count}</span>
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {picks.map(p => (
              <PickCard key={p.id} pick={p} onOpen={() => ctx.openPick(p.id)}
                saved={!!saved[p.id]} onSave={() => setSaved(s => ({ ...s, [p.id]: !s[p.id] }))}/>
            ))}
          </div>
        </div>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="card card-pad">
            <div style={{ fontSize: 12, color: 'var(--t-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Starting in the next hour</div>
            {DATA.EVENTS_TODAY.slice(0, 3).map(e => (
              <div key={e.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--line-soft)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <SportTag sport={e.sport}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {e.away ? `${e.away} @ ${e.home}` : e.home}
                  </div>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--t-3)', marginTop: 2 }}>{e.time} · {e.picks} picks</div>
                </div>
              </div>
            ))}
          </div>

          <div className="card card-pad">
            <div className="row between" style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: 'var(--t-3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>This week</div>
              <Badge tone="green" dot>Live</Badge>
            </div>
            <div className="mono" style={{ fontSize: 28, fontWeight: 500, marginBottom: 4, color: 'var(--green)' }}>+8.4u</div>
            <div style={{ fontSize: 12, color: 'var(--t-3)', marginBottom: 12 }}>Net units across followed plays</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              <Stat label="W–L" value="14–8" accent="var(--green)"/>
              <Stat label="Win rate" value="63.6%" accent="var(--green)"/>
              <Stat label="Streak" value="W3" accent="var(--green)"/>
            </div>
          </div>

          <div className="card card-pad">
            <div className="row between" style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--t-3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Suggested for you</div>
            </div>
            {DATA.CREATORS.filter(c => !['courtvision','sharpedge','nordic','icesharp'].includes(c.id)).slice(0,2).map(c => (
              <div key={c.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--line-soft)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar creator={c} size={32}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="row" style={{ gap: 4 }}><span style={{ fontSize: 13, fontWeight: 500 }}>{c.name}</span>{c.verified && <VerifiedMark size={11}/>}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--t-3)' }}>{(c.winRate*100).toFixed(0)}% · ${c.startingPrice}/mo</div>
                </div>
                <button className="btn btn-sm btn-outline" onClick={() => ctx.openCreator(c.id)}>View</button>
              </div>
            ))}
          </div>

          <ResponsibleNote/>
        </aside>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────
   Pick detail
   ───────────────────────────────────────────────────────── */
function PickDetail({ ctx, pickId }) {
  const p = DATA.FEED_PICKS.find(x => x.id === pickId) || DATA.FEED_PICKS[0];
  const c = creatorById(p.creator);
  const isLocked = p.access !== 'free' && false; // assume subscribed for prototype

  return (
    <>
      <Topbar title={p.title} crumb={`Feed › ${p.event}`}
        actions={<>
          <button className="btn btn-ghost btn-sm" onClick={() => ctx.go(ctx.role === 'public' ? 'discover' : 'feed')}><Icon name="arrow-left" size={13}/> Back</button>
          <button className="btn btn-secondary btn-sm"><Icon name="bookmark" size={13}/> Save</button>
          <button className="btn btn-primary btn-sm"><Icon name="check" size={13}/> Follow play</button>
        </>}/>
      <div style={{ padding: '24px 28px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 26 }}>
          <article>
            <div className="row" style={{ gap: 10, marginBottom: 14 }}>
              <SportTag sport={p.sport}/>
              <span className="mono" style={{ fontSize: 12, color: 'var(--t-3)' }}>{p.event} · {p.eventTime}</span>
              <AccessBadge access={p.access}/>
              <GradeBadge grade={p.status}/>
            </div>
            <h1 style={{ fontSize: 34, fontWeight: 500, letterSpacing: '-0.02em', margin: '0 0 18px', lineHeight: 1.15 }}>{p.title}</h1>
            <CreatorChip creatorId={p.creator} size={36} sub={`${c.handle} · Posted ${p.posted}`}/>

            {/* Pick payload */}
            <div className="card" style={{ marginTop: 22, padding: 20, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
              <DataPair label="Market" value={p.market}/>
              <DataPair label="Selection" value={p.selection}/>
              <DataPair label="Odds" value={p.odds} mono/>
              <DataPair label="Stake" value={p.units} mono/>
            </div>

            {/* Confidence + cutoff */}
            <div className="row" style={{ gap: 14, marginTop: 14, padding: 14, borderRadius: 10, background: 'var(--bg-2)', border: '1px solid var(--line-soft)' }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--t-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Confidence</div>
                <ConfidenceBar level={p.confidence}/>
              </div>
              <div style={{ width: 1, height: 32, background: 'var(--line-soft)' }}/>
              <div>
                <div style={{ fontSize: 11, color: 'var(--t-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Cutoff</div>
                <div className="mono" style={{ fontSize: 13, color: 'var(--amber)' }}>Tip-off · 7:30 PM ET</div>
              </div>
              <div style={{ width: 1, height: 32, background: 'var(--line-soft)' }}/>
              <div>
                <div style={{ fontSize: 11, color: 'var(--t-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Engagement</div>
                <div className="mono" style={{ fontSize: 13 }}>1,284 views · 312 saves</div>
              </div>
            </div>

            {/* Analysis */}
            <h2 style={{ fontSize: 17, fontWeight: 500, margin: '32px 0 14px' }}>Analysis</h2>
            {isLocked ? (
              <LockedAnalysis creator={c}/>
            ) : (
              <div style={{ fontSize: 15, color: 'var(--t-2)', lineHeight: 1.7, fontFamily: 'var(--f-serif)' }}>
                <p>Both teams hovering 53–55% pace tier in last 5 games against quality defenses. Denver coming off a back-to-back with the second night on the road; Murray played 38 minutes Thursday and the Lakers' early offense should accelerate possessions.</p>
                <p>Lakers are 6-1 on the over for first half totals at home this season when the line sits between 110.5 and 113.5. Reddick's halftime adjustments have leaned aggressive; expect a quick start with Davis getting opportunities at the rim.</p>
                <p>Numbers I care about: 23.8 expected possessions in the first half (vs market-implied ~22.6), Lakers home halftime average of 58.2 over last 12 games.</p>
              </div>
            )}

            {/* Related picks */}
            <Section title="Related picks" sub="Other creators on this game" style={{ marginTop: 40 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                {DATA.FEED_PICKS.slice(1, 3).map(rp => (
                  <div key={rp.id} className="card card-pad row" style={{ gap: 10, cursor: 'pointer' }}
                    onClick={() => ctx.openPick(rp.id)}>
                    <Avatar creator={creatorById(rp.creator)} size={28}/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rp.title}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--t-3)', marginTop: 3 }}>{creatorById(rp.creator).name} · {rp.posted}</div>
                    </div>
                    <span className="odds" style={{ fontSize: 12 }}>{rp.odds}</span>
                  </div>
                ))}
              </div>
            </Section>

            <ResponsibleNote style={{ marginTop: 26 }}/>
          </article>

          <aside style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="card card-pad">
              <div className="row" style={{ gap: 10, marginBottom: 14 }}><Avatar creator={c} size={40}/>
                <div style={{ flex: 1 }}>
                  <div className="row" style={{ gap: 4 }}><span style={{ fontSize: 14, fontWeight: 500 }}>{c.name}</span>{c.verified && <VerifiedMark size={12}/>}</div>
                  <div style={{ fontSize: 12, color: 'var(--t-3)' }}>{c.handle}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 12 }}>
                <Stat label="Win rate" value={`${(c.winRate*100).toFixed(1)}%`} accent="var(--green)"/>
                <Stat label="Streak" value={c.streak} accent={c.streak.startsWith('W') ? 'var(--green)' : 'var(--red)'}/>
              </div>
              <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => ctx.openCreator(c.id)}>View profile</button>
            </div>
            <div className="card card-pad">
              <div style={{ fontSize: 12, color: 'var(--t-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Status timeline</div>
              {[
                { t: 'Posted', s: '6:48 PM ET', dot: 'var(--blue)' },
                { t: 'Cutoff at tip-off', s: '7:30 PM ET', dot: 'var(--amber)' },
                { t: 'Game ends', s: '~10:15 PM ET', dot: 'var(--t-3)' },
                { t: 'Graded', s: 'Within 30 min of result', dot: 'var(--t-3)' },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '7px 0' }}>
                  <span style={{ width: 8, height: 8, borderRadius: 50, background: s.dot, marginTop: 6 }}/>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13 }}>{s.t}</div>
                    <div className="mono" style={{ fontSize: 11.5, color: 'var(--t-3)', marginTop: 2 }}>{s.s}</div>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

function LockedAnalysis({ creator }) {
  return (
    <div style={{
      position: 'relative',
      padding: 22,
      borderRadius: 12,
      background: 'linear-gradient(180deg, rgba(232,194,117,0.04), transparent), var(--bg-1)',
      border: '1px solid var(--gold-line)',
    }}>
      <div style={{ filter: 'blur(5px)', userSelect: 'none', color: 'var(--t-3)', lineHeight: 1.6 }}>
        Both teams hovering 53–55% pace tier in last 5 games against quality defenses. Denver coming off a back-to-back with the second night on the road; Murray played 38 minutes Thursday…
      </div>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 12, padding: 24,
        background: 'radial-gradient(circle at 50% 50%, rgba(8,9,11,0.95), rgba(8,9,11,0.6))',
        borderRadius: 12,
      }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--gold-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)' }}>
          <Icon name="lock" size={20}/>
        </div>
        <div style={{ fontSize: 17, fontWeight: 500, textAlign: 'center' }}>Premium analysis is locked</div>
        <div style={{ fontSize: 13, color: 'var(--t-3)', textAlign: 'center', maxWidth: 360 }}>
          Subscribe to {creator?.name} for full analysis, units, confidence, and grading.
        </div>
        <button className="btn btn-primary">Subscribe — from ${creator?.startingPrice || 29}/mo</button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Customer Results
   ───────────────────────────────────────────────────────── */
function CustomerResults({ ctx }) {
  return (
    <>
      <Topbar title="My Results" search="Filter by creator, sport, market"
        actions={<><button className="btn btn-secondary btn-sm"><Icon name="filter" size={13}/> Filters</button><button className="btn btn-outline btn-sm">Export CSV</button></>}/>
      <div style={{ padding: '24px 28px', maxWidth: 1300 }}>
        <PageHead title="Your portfolio" sub="Performance across every play you've followed."/>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 22 }}>
          <Metric label="Win rate" value="58.2%" delta="+2.1%" accent="var(--green)"/>
          <Metric label="Net units" value="+12.4u" delta="+3.6u this wk" accent="var(--green)"/>
          <Metric label="Followed plays" value="42" delta="6 pending"/>
          <Metric label="Wins · Losses" value="22 · 16" sub="3 push · 1 void"/>
          <Metric label="Streak" value="W3" accent="var(--green)" sub="Current"/>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18, marginBottom: 22 }}>
          <div className="card card-pad">
            <div className="row between" style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>Cumulative units · last 90 days</div>
              <div className="row" style={{ gap: 6 }}>{['7D','30D','90D','YTD'].map((t, i) => <span key={t} className={`chip ${i === 2 ? 'active' : ''}`}>{t}</span>)}</div>
            </div>
            <PerformanceChart/>
          </div>
          <div className="card card-pad">
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 14 }}>Best performing creator</div>
            <div className="row" style={{ gap: 10, marginBottom: 14 }}>
              <Avatar creator={creatorById('courtvision')} size={36}/>
              <div>
                <div className="row" style={{ gap: 4 }}><span style={{ fontSize: 14, fontWeight: 500 }}>CourtVision Pro</span><VerifiedMark size={12}/></div>
                <div className="mono" style={{ fontSize: 12, color: 'var(--green)', marginTop: 2 }}>+8.6u over 18 plays</div>
              </div>
            </div>
            <hr className="hr"/>
            <div style={{ fontSize: 13, fontWeight: 500, margin: '14px 0 10px' }}>By sport</div>
            {[
              { s: 'NBA', wr: '64%', units: '+9.2u' },
              { s: 'NFL', wr: '52%', units: '+1.8u' },
              { s: 'NHL', wr: '60%', units: '+1.4u' },
            ].map(r => (
              <div key={r.s} className="row between" style={{ padding: '8px 0', fontSize: 13, borderBottom: '1px solid var(--line-soft)' }}>
                <span className="row" style={{ gap: 8 }}><SportTag sport={r.s}/>{r.s}</span>
                <span className="row mono" style={{ gap: 12 }}><span>{r.wr}</span><span style={{ color: 'var(--green)' }}>{r.units}</span></span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="row between" style={{ padding: '14px 20px', borderBottom: '1px solid var(--line-soft)' }}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Recent plays</div>
            <div className="row" style={{ gap: 6 }}>
              {['All','Wins','Losses','Pending','Push'].map((t, i) => <span key={t} className={`chip ${i === 0 ? 'active' : ''}`}>{t}</span>)}
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead>
                <tr><th>Pick</th><th>Creator</th><th>Sport</th><th>Stake</th><th>Odds</th><th>Date</th><th>Result</th><th className="num">Net</th></tr>
              </thead>
              <tbody>
                {DATA.RECENT_RESULTS.map(r => (
                  <tr key={r.id}>
                    <td><span style={{ fontWeight: 500 }}>{r.title}</span></td>
                    <td><CreatorChip creatorId={r.creator} size={22}/></td>
                    <td><SportTag sport={r.sport}/></td>
                    <td className="num">{r.units}</td>
                    <td className="num">{r.odds}</td>
                    <td style={{ color: 'var(--t-3)' }}>{r.date}</td>
                    <td><GradeBadge grade={r.result}/></td>
                    <td className="num" style={{ color: r.result === 'win' ? 'var(--green)' : r.result === 'loss' ? 'var(--red)' : 'var(--t-2)', fontWeight: 500 }}>{r.netUnits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

function Metric({ label, value, delta, sub, accent }) {
  return (
    <div className="metric">
      <span className="label">{label}</span>
      <span className="value" style={{ color: accent || 'var(--t-1)' }}>{value}</span>
      {delta && <span className={`delta ${delta.startsWith('+') ? 'up' : 'down'}`}>{delta}</span>}
      {sub && !delta && <span style={{ fontSize: 11.5, color: 'var(--t-3)' }}>{sub}</span>}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Saved Library
   ───────────────────────────────────────────────────────── */
function SavedLibrary({ ctx }) {
  const [tab, setTab] = useC('posts');
  return (
    <>
      <Topbar title="Saved" search="Search saved"/>
      <div style={{ padding: '24px 28px', maxWidth: 1200 }}>
        <PageHead title="Saved library" sub="Posts and creators you bookmarked."/>
        <div className="row" style={{ gap: 0, marginBottom: 18, borderBottom: '1px solid var(--line-soft)' }}>
          {[
            { id: 'posts', label: 'Saved posts', count: 14 },
            { id: 'creators', label: 'Bookmarked creators', count: 6 },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              background: 'transparent', border: 'none', padding: '12px 18px',
              color: tab === t.id ? 'var(--t-1)' : 'var(--t-3)',
              fontSize: 13.5, fontWeight: 500, cursor: 'pointer',
              borderBottom: `2px solid ${tab === t.id ? 'var(--green)' : 'transparent'}`,
              marginBottom: -1,
            }}>{t.label} <span className="mono" style={{ marginLeft: 6, fontSize: 11, opacity: 0.7 }}>{t.count}</span></button>
          ))}
        </div>

        {tab === 'posts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {DATA.FEED_PICKS.slice(0, 4).map(p => (
              <PickCard key={p.id} pick={p} onOpen={() => ctx.openPick(p.id)}/>
            ))}
          </div>
        )}
        {tab === 'creators' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
            {DATA.CREATORS.slice(0, 4).map(c => <CreatorCard key={c.id} creator={c} onOpen={() => ctx.openCreator(c.id)}/>)}
          </div>
        )}
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────
   Subscriptions
   ───────────────────────────────────────────────────────── */
function Subscriptions({ ctx }) {
  return (
    <>
      <Topbar title="Subscriptions"/>
      <div style={{ padding: '24px 28px', maxWidth: 1100 }}>
        <PageHead title="Subscriptions & billing" sub="Transparent control over what you pay for."/>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 22 }}>
          <Metric label="Active subscriptions" value="3" sub="Across 3 creators"/>
          <Metric label="Monthly cost" value="$117" sub="Next billed Jun 14"/>
          <Metric label="Lifetime spend" value="$348" sub="Since Dec 2025"/>
        </div>

        <div className="card" style={{ marginBottom: 22 }}>
          <div className="row between" style={{ padding: '14px 20px', borderBottom: '1px solid var(--line-soft)' }}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Active subscriptions</div>
            <button className="btn btn-secondary btn-sm" onClick={() => ctx.go('discover')}>Discover more</button>
          </div>
          {[
            { creator: 'courtvision', plan: 'Premium Picks', price: '$49.00', renew: 'Jun 14, 2026', status: 'active' },
            { creator: 'sharpedge', plan: 'Premium Picks', price: '$39.00', renew: 'Jun 02, 2026', status: 'active' },
            { creator: 'nordic', plan: 'Premium Picks', price: '$29.00', renew: 'May 18, 2026', status: 'past_due' },
          ].map((s, i) => {
            const c = creatorById(s.creator);
            return (
              <div key={i} className="row" style={{ padding: '16px 20px', borderBottom: i < 2 ? '1px solid var(--line-soft)' : 'none', gap: 14 }}>
                <Avatar creator={c} size={38}/>
                <div style={{ flex: 1 }}>
                  <div className="row" style={{ gap: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{c.name}</span>
                    {c.verified && <VerifiedMark size={12}/>}
                    <span className="tag">{s.plan}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--t-3)', marginTop: 4 }}>
                    {s.status === 'past_due' ? 'Payment failed · retry needed' : `Renews ${s.renew}`}
                  </div>
                </div>
                <div className="mono" style={{ fontSize: 14, fontWeight: 500 }}>{s.price}<span style={{ color: 'var(--t-3)', fontSize: 12 }}>/mo</span></div>
                {s.status === 'past_due' ? <Badge tone="red" dot>Past due</Badge> : <Badge tone="green" dot>Active</Badge>}
                <button className="btn btn-ghost btn-sm">Manage</button>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          <div className="card card-pad">
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>Payment methods</div>
            <div className="row" style={{ padding: '12px 14px', background: 'var(--bg-2)', borderRadius: 10, gap: 12, marginBottom: 8 }}>
              <div style={{ width: 38, height: 26, borderRadius: 5, background: 'linear-gradient(135deg, #4F8CFF, #2A6FDB)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--f-mono)', fontSize: 9, color: '#fff', fontWeight: 700, letterSpacing: '0.05em' }}>VISA</div>
              <div style={{ flex: 1 }}>
                <div className="mono" style={{ fontSize: 13 }}>•••• •••• •••• 4242</div>
                <div style={{ fontSize: 11.5, color: 'var(--t-3)', marginTop: 2 }}>Expires 09/28 · Default</div>
              </div>
              <button className="btn btn-ghost btn-sm">Edit</button>
            </div>
            <button className="btn btn-outline btn-sm" style={{ width: '100%' }}><Icon name="plus" size={12}/> Add payment method</button>
          </div>
          <div className="card card-pad">
            <div className="row between" style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>Billing history</div>
              <button className="btn btn-ghost btn-sm">All invoices</button>
            </div>
            {[
              { d: 'May 14', n: 'CourtVision Pro · Premium', a: '$49.00' },
              { d: 'May 02', n: 'SharpEdge Bets · Premium', a: '$39.00' },
              { d: 'Apr 18', n: 'Nordic Picks · Premium', a: '$29.00' },
            ].map((r, i) => (
              <div key={i} className="row between" style={{ padding: '10px 0', fontSize: 13, borderBottom: i < 2 ? '1px solid var(--line-soft)' : 'none' }}>
                <span className="mono" style={{ color: 'var(--t-3)', width: 60 }}>{r.d}</span>
                <span style={{ flex: 1 }}>{r.n}</span>
                <span className="mono" style={{ fontWeight: 500 }}>{r.a}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────
   Notifications, Settings (compact)
   ───────────────────────────────────────────────────────── */
function Notifications({ ctx }) {
  return (
    <>
      <Topbar title="Notifications"
        actions={<button className="btn btn-ghost btn-sm">Mark all read</button>}/>
      <div style={{ padding: '24px 28px', maxWidth: 760 }}>
        <PageHead title="Inbox" sub="Picks, billing, and platform updates."/>
        <div className="card">
          {DATA.NOTIFICATIONS.map((n, i) => (
            <div key={n.id} style={{
              padding: '14px 18px',
              display: 'flex', gap: 12, alignItems: 'flex-start',
              borderBottom: i < DATA.NOTIFICATIONS.length - 1 ? '1px solid var(--line-soft)' : 'none',
              background: n.unread ? 'rgba(0,224,143,0.02)' : 'transparent',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'var(--bg-2)', border: '1px solid var(--line-soft)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: n.kind === 'pick' ? 'var(--green)' : n.kind === 'grade' ? 'var(--gold)' : n.kind === 'billing' ? 'var(--blue)' : 'var(--t-2)',
                flexShrink: 0,
              }}>
                <Icon name={n.kind === 'pick' ? 'feed' : n.kind === 'grade' ? 'trophy' : n.kind === 'billing' ? 'card' : 'bell'} size={14}/>
              </div>
              <div style={{ flex: 1 }}>
                <div className="row" style={{ gap: 8 }}>
                  <span style={{ fontSize: 13.5, fontWeight: n.unread ? 500 : 400 }}>{n.title}</span>
                  {n.unread && <span style={{ width: 6, height: 6, borderRadius: 50, background: 'var(--green)' }}/>}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--t-3)', marginTop: 4 }}>{n.sub}</div>
              </div>
              <span className="mono" style={{ fontSize: 11.5, color: 'var(--t-3)' }}>{n.time}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function Settings({ ctx }) {
  return (
    <>
      <Topbar title="Settings"/>
      <div style={{ padding: '24px 28px', maxWidth: 760 }}>
        <PageHead title="Settings" sub="Account, notifications, and responsible-betting limits."/>
        <div className="card">
          {[
            { t: 'Account', s: 'Email, password, profile photo' },
            { t: 'Notification preferences', s: 'New picks, grades, billing, platform' },
            { t: 'Responsible-betting limits', s: 'Set a weekly cap on plays you follow', badge: 'Recommended' },
            { t: 'Privacy', s: 'Make your followed plays private' },
            { t: 'Danger zone', s: 'Pause account, export data, delete', danger: true },
          ].map((s, i, arr) => (
            <div key={s.t} className="row between" style={{ padding: '16px 20px', borderBottom: i < arr.length - 1 ? '1px solid var(--line-soft)' : 'none', cursor: 'pointer' }}>
              <div>
                <div className="row" style={{ gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: s.danger ? 'var(--red)' : 'var(--t-1)' }}>{s.t}</span>
                  {s.badge && <Badge tone="green">{s.badge}</Badge>}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--t-3)', marginTop: 3 }}>{s.s}</div>
              </div>
              <Icon name="arrow-right" size={14} style={{ color: 'var(--t-3)' }}/>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

window.CustomerFeed = CustomerFeed;
window.PickDetail = PickDetail;
window.CustomerResults = CustomerResults;
window.SavedLibrary = SavedLibrary;
window.Subscriptions = Subscriptions;
window.Notifications = Notifications;
window.Settings = Settings;
window.Metric = Metric;
