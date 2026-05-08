// events.jsx — Today's Events page
const { useState: useE } = React;

function TodaysEvents({ ctx, isPublic }) {
  const [time, setTime] = useE('today');
  const [sport, setSport] = useE('All');

  const grouped = DATA.SPORTS.reduce((acc, s) => {
    const events = DATA.EVENTS_TODAY.filter(e => e.sport === s);
    if (events.length) acc[s] = events;
    return acc;
  }, {});

  const featured = DATA.EVENTS_TODAY.filter(e => e.featured);

  const Body = (
    <div style={{ maxWidth: isPublic ? 1280 : 'none', margin: '0 auto', padding: '24px 28px' }}>
      {isPublic && (
        <div style={{ padding: '40px 0 28px' }}>
          <div style={{ fontSize: 12, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Today's slate</div>
          <h1 className="serif" style={{ fontSize: 56, fontWeight: 400, letterSpacing: '-0.025em', margin: '0 0 14px', fontStyle: 'italic' }}>What's on tonight.</h1>
          <p style={{ fontSize: 16, color: 'var(--t-2)', maxWidth: 640, margin: 0 }}>Browse every event with active creator coverage. {DATA.EVENTS_TODAY.reduce((s,e) => s + e.picks, 0)} picks across {DATA.EVENTS_TODAY.length} games.</p>
        </div>
      )}
      {!isPublic && <PageHead title="Today's events" sub="Find creators covering the games you care about."/>}

      {/* Filters bar */}
      <div className="card row between" style={{ padding: '14px 18px', marginBottom: 22 }}>
        <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
          <div className="search" style={{ width: 280 }}>
            <Icon name="search" size={14}/>
            <input placeholder="Search teams, leagues, events"/>
          </div>
          <span style={{ width: 1, height: 24, background: 'var(--line)' }}/>
          <div className="row" style={{ gap: 4 }}>
            {[
              { id: 'starting', label: 'Starting soon' },
              { id: 'today', label: 'Today' },
              { id: 'tonight', label: 'Tonight' },
              { id: 'week', label: 'This week' },
            ].map(t => (
              <button key={t.id} onClick={() => setTime(t.id)} className={`chip ${time === t.id ? 'green-active' : ''}`}>{t.label}</button>
            ))}
          </div>
        </div>
        <div className="row" style={{ gap: 4 }}>
          <button onClick={() => setSport('All')} className={`chip ${sport === 'All' ? 'active' : ''}`}>All sports</button>
          {DATA.SPORTS.map(s => (
            <button key={s} onClick={() => setSport(s)} className={`chip ${sport === s ? 'active' : ''}`}>{s}</button>
          ))}
        </div>
      </div>

      {/* Featured */}
      {featured.length > 0 && (
        <Section title="Featured tonight" sub="Heaviest creator coverage right now">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
            {featured.map(e => <FeaturedEventCard key={e.id} event={e} ctx={ctx}/>)}
          </div>
        </Section>
      )}

      {/* Grouped */}
      {Object.entries(grouped).filter(([s]) => sport === 'All' || sport === s).map(([s, list]) => (
        <Section key={s} title={s} sub={`${list.length} game${list.length > 1 ? 's' : ''}`} style={{ marginTop: 28 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {list.map(e => <EventCard key={e.id} event={e} ctx={ctx}/>)}
          </div>
        </Section>
      ))}

      {Object.keys(grouped).length === 0 && (
        <EmptyState icon="calendar" title="No events match" subtitle="Try different filters."/>
      )}
    </div>
  );

  if (isPublic) return Body;
  return (<><Topbar title="Today's Events" search="Search events"/>{Body}</>);
}

function FeaturedEventCard({ event, ctx }) {
  return (
    <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 80,
        background: `linear-gradient(180deg, ${SPORT_TONE[event.sport]}14, transparent)`, pointerEvents: 'none' }}/>
      <div className="row between" style={{ position: 'relative' }}>
        <div className="row" style={{ gap: 8 }}>
          <SportTag sport={event.sport}/>
          <span style={{ fontSize: 11.5, color: 'var(--t-3)' }}>{event.league}</span>
        </div>
        <span className="mono" style={{ fontSize: 12, color: 'var(--amber)' }}>{event.time}</span>
      </div>
      <div style={{ position: 'relative' }}>
        <div className="serif" style={{ fontSize: 24, lineHeight: 1.2, fontWeight: 400, letterSpacing: '-0.01em' }}>
          {event.away} <span style={{ color: 'var(--t-3)', fontStyle: 'italic' }}>@</span> {event.home}
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--t-3)', marginTop: 4, fontFamily: 'var(--f-mono)' }}>{event.venue || 'Crypto.com Arena · Los Angeles'}</div>
      </div>
      <div className="row" style={{ gap: 14, padding: '12px 14px', background: 'var(--bg-2)', borderRadius: 8 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--t-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Coverage</div>
          <div className="mono" style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{event.creators} creators</div>
        </div>
        <div style={{ width: 1, height: 28, background: 'var(--line-soft)' }}/>
        <div>
          <div style={{ fontSize: 11, color: 'var(--t-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Available picks</div>
          <div className="mono" style={{ fontSize: 14, fontWeight: 500, marginTop: 2, color: 'var(--green)' }}>{event.picks}</div>
        </div>
      </div>
      <div className="row between" style={{ marginTop: 'auto' }}>
        <div className="row" style={{ gap: -6 }}>
          {DATA.CREATORS.slice(0, 3).map((c, i) => (
            <div key={c.id} style={{ marginLeft: i > 0 ? -8 : 0, border: '2px solid var(--bg-1)', borderRadius: 50 }}>
              <Avatar creator={c} size={26}/>
            </div>
          ))}
          <span style={{ fontSize: 12, color: 'var(--t-3)', marginLeft: 8 }}>+{event.creators - 3} more</span>
        </div>
        <button className="btn btn-primary btn-sm">View picks <Icon name="arrow-right" size={12}/></button>
      </div>
    </div>
  );
}

function EventCard({ event, ctx }) {
  return (
    <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 10, cursor: 'pointer', transition: 'border-color 120ms' }}>
      <div className="row between">
        <SportTag sport={event.sport}/>
        <span className="mono" style={{ fontSize: 11.5, color: 'var(--t-3)' }}>{event.time}</span>
      </div>
      <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.3 }}>
        {event.away ? `${event.away} @ ${event.home}` : event.home}
      </div>
      <div className="row between" style={{ marginTop: 'auto' }}>
        <span style={{ fontSize: 11.5, color: 'var(--t-3)' }}>{event.creators} creators · <span style={{ color: 'var(--green)' }}>{event.picks} picks</span></span>
        <Icon name="arrow-right" size={12} style={{ color: 'var(--t-3)' }}/>
      </div>
    </div>
  );
}

window.TodaysEvents = TodaysEvents;
