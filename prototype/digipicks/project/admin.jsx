// admin.jsx — Admin operations console
const { useState: useA } = React;

function AdminConsole({ ctx }) {
  const [tab, setTab] = useA('applications');
  return (
    <>
      <Topbar title="Admin operations" crumb="Trust & safety"
        actions={<><Badge tone="amber" dot>14 pending</Badge><button className="btn btn-secondary btn-sm">Audit log</button></>}/>
      <div style={{ padding: '24px 28px', maxWidth: 1500 }}>
        <div className="row between" style={{ marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 500, margin: '0 0 4px', letterSpacing: '-0.015em' }}>Operations console</h1>
            <p style={{ fontSize: 13, color: 'var(--t-3)', margin: 0 }}>Trust, safety, billing, and compliance for DigiPicks.</p>
          </div>
          <div className="row" style={{ gap: 6 }}>
            <Badge tone="green" dot>All systems operational</Badge>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 22 }}>
          <Metric label="Pending applications" value="14" sub="3 over SLA" accent="var(--amber)"/>
          <Metric label="Moderation queue" value="6" sub="2 disputed picks"/>
          <Metric label="Billing cases" value="9" sub="3 open · 6 awaiting user"/>
          <Metric label="Active creators" value="84" delta="+6 this mo" accent="var(--green)"/>
          <Metric label="Active subscribers" value="6,284" delta="+412" accent="var(--green)"/>
        </div>

        <div className="row" style={{ gap: 0, marginBottom: 18, borderBottom: '1px solid var(--line-soft)' }}>
          {[
            { id: 'applications', label: 'Applications', count: 14 },
            { id: 'moderation', label: 'Content moderation', count: 6 },
            { id: 'billing', label: 'Billing support', count: 9 },
            { id: 'audit', label: 'Audit log' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              background: 'transparent', border: 'none', padding: '12px 18px',
              color: tab === t.id ? 'var(--t-1)' : 'var(--t-3)',
              fontSize: 13.5, fontWeight: 500, cursor: 'pointer',
              borderBottom: `2px solid ${tab === t.id ? 'var(--green)' : 'transparent'}`,
              marginBottom: -1,
            }}>{t.label}{t.count != null && <span className="mono" style={{ marginLeft: 6, fontSize: 11, opacity: 0.7 }}>{t.count}</span>}</button>
          ))}
        </div>

        {tab === 'applications' && <ApplicationsQueue/>}
        {tab === 'moderation' && <ModerationQueue/>}
        {tab === 'billing' && <BillingCases/>}
        {tab === 'audit' && <AuditLog/>}
      </div>
    </>
  );
}

function ApplicationsQueue() {
  const [selected, setSelected] = useA(0);
  const apps = [
    { id: 'a1', name: 'Marco Diaz', handle: '@sharpedge_bets', niche: 'NBA props · sides', audience: '500–2,000', sport: 'NBA', sla: 'Today', status: 'in_review', claim: '63% / 90 days · +18u' },
    { id: 'a2', name: 'Sienna Park', handle: '@parklines', niche: 'NFL spreads · totals', audience: '2,000–10,000', sport: 'NFL', sla: 'Day 2', status: 'pending', claim: '57% / season · +9.2u' },
    { id: 'a3', name: 'Rohan Aggarwal', handle: '@aggro_props', niche: 'NBA player props', audience: '10,000+', sport: 'NBA', sla: 'Day 4', status: 'more_info', claim: '61% / 60 days · +24u' },
    { id: 'a4', name: 'Vera Toft', handle: '@vera_pucks', niche: 'NHL goalies', audience: '500–2,000', sport: 'NHL', sla: 'Day 1', status: 'pending', claim: '59% / season · +12u' },
    { id: 'a5', name: 'Theo Kwame', handle: '@theo_courts', niche: 'College basketball', audience: '0–500', sport: 'NCAA', sla: 'Day 3', status: 'flagged', claim: '72% / 30 days · +14u' },
  ];
  const a = apps[selected];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 18, alignItems: 'flex-start' }}>
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="row between" style={{ padding: '12px 14px', borderBottom: '1px solid var(--line-soft)', fontSize: 12, color: 'var(--t-3)' }}>
          <span>{apps.length} pending</span>
          <select className="input" style={{ width: 130, height: 26, fontSize: 11.5 }}><option>All sports</option></select>
        </div>
        {apps.map((x, i) => (
          <button key={x.id} onClick={() => setSelected(i)} style={{
            display: 'block', width: '100%', textAlign: 'left',
            padding: '14px 16px', background: i === selected ? 'var(--bg-2)' : 'transparent',
            border: 'none', borderBottom: '1px solid var(--line-soft)',
            borderLeft: `2px solid ${i === selected ? 'var(--green)' : 'transparent'}`,
            cursor: 'pointer',
          }}>
            <div className="row between" style={{ marginBottom: 4 }}>
              <span style={{ fontSize: 13.5, fontWeight: 500 }}>{x.name}</span>
              {x.status === 'flagged' && <Badge tone="red" dot>Flagged</Badge>}
              {x.status === 'more_info' && <Badge tone="amber">More info</Badge>}
              {x.status === 'in_review' && <Badge tone="blue">In review</Badge>}
              {x.status === 'pending' && <Badge tone="neutral">Pending</Badge>}
            </div>
            <div className="mono" style={{ fontSize: 11.5, color: 'var(--t-3)', marginBottom: 6 }}>{x.handle}</div>
            <div style={{ fontSize: 12, color: 'var(--t-2)', marginBottom: 4 }}>{x.niche}</div>
            <div className="row between" style={{ fontSize: 11, color: 'var(--t-3)' }}>
              <span>{x.audience}</span>
              <span>SLA: {x.sla}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="card card-pad">
        <div className="row between" style={{ marginBottom: 18, paddingBottom: 18, borderBottom: '1px solid var(--line-soft)' }}>
          <div className="row" style={{ gap: 14 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg, oklch(60% 0.14 200), oklch(45% 0.14 200))', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 500 }}>
              {a.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <div className="row" style={{ gap: 8, marginBottom: 4 }}>
                <h2 style={{ fontSize: 22, fontWeight: 500, margin: 0, letterSpacing: '-0.01em' }}>{a.name}</h2>
                {a.status === 'flagged' && <Badge tone="red" icon="alert">Flagged</Badge>}
              </div>
              <div className="mono" style={{ fontSize: 12.5, color: 'var(--t-3)' }}>{a.handle} · Submitted 3 days ago · {a.sport}</div>
            </div>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn btn-ghost btn-sm">Flag for review</button>
            <button className="btn btn-secondary btn-sm">Request more info</button>
            <button className="btn btn-outline btn-sm" style={{ borderColor: 'var(--red)', color: 'var(--red)' }}>Reject</button>
            <button className="btn btn-primary btn-sm"><Icon name="check" size={13}/> Approve</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 22 }}>
          <div>
            <KV label="Niche" value={a.niche}/>
            <KV label="Audience size" value={a.audience}/>
            <KV label="Existing channels" value="X (12.4k), Discord (1,820), Substack archive"/>
            <KV label="Performance claim" value={a.claim}/>
            <KV label="Planned price" value="$29/mo Premium · $79/mo VIP"/>
            <KV label="Posting cadence" value="Daily · 4–6 picks/night"/>

            <hr className="hr" style={{ margin: '20px 0' }}/>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Proof files</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { n: 'pikkit-export.csv', s: '142 KB · CSV' },
                { n: 'x-thread-screens.pdf', s: '4.2 MB · PDF'},
                { n: 'discord-history.png', s: '880 KB · PNG'},
              ].map(f => (
                <div key={f.n} className="card" style={{ padding: 12, background: 'var(--bg-2)' }}>
                  <Icon name="audit" size={14} style={{ color: 'var(--blue)', marginBottom: 8 }}/>
                  <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 2, wordBreak: 'break-all' }}>{f.n}</div>
                  <div className="mono" style={{ fontSize: 10.5, color: 'var(--t-3)' }}>{f.s}</div>
                </div>
              ))}
            </div>

            <hr className="hr" style={{ margin: '20px 0' }}/>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Subscriber promise</div>
            <p className="serif" style={{ fontSize: 15, color: 'var(--t-1)', fontStyle: 'italic', lineHeight: 1.5, padding: 14, background: 'var(--bg-2)', borderRadius: 8, borderLeft: '2px solid var(--green)', margin: 0 }}>
              "4–6 NBA player prop picks per night with full statistical analysis. No parlays, units transparent, every pick tracked publicly."
            </p>
          </div>

          <div>
            <div className="card card-pad" style={{ background: 'var(--bg-2)' }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Verification checks</div>
              {[
                { l: 'Identity (KYC)', s: 'Passed · Persona', ok: true },
                { l: 'Track-record cross-check', s: 'Pikkit verified · 142 picks', ok: true },
                { l: 'Social audience', s: '12.4k followers (X)', ok: true },
                { l: 'Compliance flag', s: 'Clean history', ok: true },
                { l: 'Payment/payout setup', s: 'Pending Stripe Connect', ok: false },
              ].map(c => (
                <div key={c.l} style={{ padding: '10px 0', borderBottom: '1px solid var(--line-soft)' }}>
                  <div className="row" style={{ gap: 10 }}>
                    {c.ok ? <Icon name="check" size={14} style={{ color: 'var(--green)' }}/> : <Icon name="clock" size={14} style={{ color: 'var(--amber)' }}/>}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13 }}>{c.l}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--t-3)', marginTop: 2 }}>{c.s}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="card card-pad" style={{ marginTop: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>Reviewer notes</div>
              <textarea className="input" rows={5} placeholder="Note for the audit log..."/>
              <div className="row" style={{ justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
                <button className="btn btn-secondary btn-sm">Save note</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KV({ label, value }) {
  return (
    <div style={{ padding: '10px 0', borderBottom: '1px solid var(--line-soft)', display: 'grid', gridTemplateColumns: '160px 1fr', gap: 12 }}>
      <span style={{ fontSize: 12, color: 'var(--t-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      <span style={{ fontSize: 13.5, color: 'var(--t-1)' }}>{value}</span>
    </div>
  );
}

function ModerationQueue() {
  const cases = [
    { id: 'm1', kind: 'Disputed pick', title: 'Lakers vs Nuggets H1 Total Over 112.5', creator: 'CourtVision Pro', why: 'Subscriber claims pick was edited after tip-off', sev: 'high', age: '2h' },
    { id: 'm2', kind: 'Reported analysis', title: '"Lock of the year" — Eagles ML', creator: 'GoalLine Insider', why: 'Misleading confidence language', sev: 'medium', age: '6h' },
    { id: 'm3', kind: 'Disputed pick', title: 'Edmonton ML', creator: 'IceSharp NHL', why: 'Push vs Loss disagreement', sev: 'low', age: '1d' },
    { id: 'm4', kind: 'Compliance', title: 'Profile mentions guaranteed wins', creator: 'PropLab', why: 'Marketing language review', sev: 'medium', age: '1d' },
    { id: 'm5', kind: 'Subscriber report', title: 'Chase-bet pattern', creator: 'NewSharp', why: 'Pattern flag from subscriber', sev: 'low', age: '2d' },
    { id: 'm6', kind: 'Disputed pick', title: 'Dončić assists prop', creator: 'CourtVision Pro', why: 'Stat correction request', sev: 'low', age: '3d' },
  ];
  return (
    <div className="card">
      <table className="tbl">
        <thead><tr><th>Case</th><th>Kind</th><th>Creator</th><th>Reason</th><th>Severity</th><th>Age</th><th></th></tr></thead>
        <tbody>
          {cases.map(c => (
            <tr key={c.id}>
              <td><span style={{ fontWeight: 500 }}>{c.title}</span></td>
              <td>{c.kind}</td>
              <td><CreatorChip creatorId={c.creator === 'CourtVision Pro' ? 'courtvision' : c.creator === 'GoalLine Insider' ? 'goalline' : c.creator === 'IceSharp NHL' ? 'icesharp' : c.creator === 'PropLab' ? 'proplab' : 'sharpedge'} size={22}/></td>
              <td style={{ color: 'var(--t-2)' }}>{c.why}</td>
              <td><Badge tone={c.sev === 'high' ? 'red' : c.sev === 'medium' ? 'amber' : 'neutral'} dot>{c.sev}</Badge></td>
              <td className="num" style={{ color: 'var(--t-3)' }}>{c.age}</td>
              <td>
                <div className="row" style={{ gap: 6 }}>
                  <button className="btn btn-ghost btn-sm">Resolve</button>
                  <button className="btn btn-secondary btn-sm">Open</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BillingCases() {
  const cases = [
    { id: 'b1', user: 'Jordan Pike', creator: 'Nordic Picks', issue: 'Failed payment · 3 retries', amount: '$29.00', status: 'Awaiting user', age: '2d' },
    { id: 'b2', user: 'Sam Olin', creator: 'CourtVision Pro', issue: 'Refund request · cancelled mid-cycle', amount: '$49.00', status: 'Needs review', age: '4h' },
    { id: 'b3', user: 'Mira Solis', creator: 'SharpEdge Bets', issue: 'Access mismatch after upgrade', amount: '—', status: 'In progress', age: '6h' },
    { id: 'b4', user: 'Drew Hayek', creator: 'GoalLine Insider', issue: 'Duplicate charge', amount: '$39.00', status: 'Resolved', age: '1d' },
  ];
  return (
    <div className="card">
      <table className="tbl">
        <thead><tr><th>User</th><th>Creator</th><th>Issue</th><th className="num">Amount</th><th>Status</th><th>Age</th><th></th></tr></thead>
        <tbody>
          {cases.map(c => (
            <tr key={c.id}>
              <td><span style={{ fontWeight: 500 }}>{c.user}</span></td>
              <td style={{ color: 'var(--t-2)' }}>{c.creator}</td>
              <td>{c.issue}</td>
              <td className="num">{c.amount}</td>
              <td>
                {c.status === 'Resolved' && <Badge tone="green" dot>Resolved</Badge>}
                {c.status === 'In progress' && <Badge tone="blue" dot>In progress</Badge>}
                {c.status === 'Needs review' && <Badge tone="amber" dot>Needs review</Badge>}
                {c.status === 'Awaiting user' && <Badge tone="neutral" dot>Awaiting user</Badge>}
              </td>
              <td className="num" style={{ color: 'var(--t-3)' }}>{c.age}</td>
              <td><button className="btn btn-secondary btn-sm">Open case</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AuditLog() {
  const events = [
    { t: '2 min ago', who: 'system', action: 'Pick graded', target: 'CourtVision Pro · LAL/DEN H1 Over', meta: 'Result: Win · Auto' },
    { t: '14 min ago', who: 'admin@digipicks (S. Park)', action: 'Application approved', target: 'Sienna Park · @parklines', meta: 'NFL spreads · Premium tier' },
    { t: '1h ago', who: 'admin@digipicks (T. Lee)', action: 'Refund issued', target: 'Drew Hayek · $39.00', meta: 'Duplicate charge' },
    { t: '3h ago', who: 'system', action: 'Compliance flag raised', target: 'PropLab', meta: '"Guaranteed" language detected' },
    { t: '6h ago', who: 'admin@digipicks (S. Park)', action: 'Pick disputed → upheld', target: 'IceSharp NHL · Edmonton ML', meta: 'Push confirmed by data feed' },
    { t: '1d ago', who: 'system', action: 'Smart pricing recommendation', target: 'CourtVision Pro', meta: '+10.2% suggestion · low risk' },
  ];
  return (
    <div className="card">
      {events.map((e, i) => (
        <div key={i} className="row" style={{ padding: '14px 18px', gap: 14, borderBottom: i < events.length - 1 ? '1px solid var(--line-soft)' : 'none', alignItems: 'flex-start' }}>
          <span className="mono" style={{ fontSize: 11.5, color: 'var(--t-3)', width: 90, flexShrink: 0, marginTop: 2 }}>{e.t}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13 }}><span style={{ fontWeight: 500 }}>{e.action}</span> · <span style={{ color: 'var(--t-2)' }}>{e.target}</span></div>
            <div style={{ fontSize: 11.5, color: 'var(--t-3)', marginTop: 3 }}>{e.meta}</div>
          </div>
          <span className="tag" style={{ flexShrink: 0 }}>{e.who}</span>
        </div>
      ))}
    </div>
  );
}

window.AdminConsole = AdminConsole;
