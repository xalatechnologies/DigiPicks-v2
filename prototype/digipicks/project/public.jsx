// public.jsx — Public-side screens: Landing + PublicShell + Today + Discover + CreatorProfile + Apply
const { useState: usePub } = React;

/* ─────────────────────────────────────────────────────────
   Public shell: top nav + page area
   ───────────────────────────────────────────────────────── */
function PublicShell({ ctx }) {
  const { screen, go, switchRole } = ctx;
  return (
    <div className="public-app">
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'color-mix(in srgb, var(--bg-0) 85%, transparent)',
        backdropFilter: 'blur(16px) saturate(140%)',
        WebkitBackdropFilter: 'blur(16px) saturate(140%)',
        borderBottom: '1px solid var(--line)',
        color: 'var(--t-1)',
      }}>
        <div style={{
          maxWidth: 1280, margin: '0 auto',
          display: 'flex', alignItems: 'center', gap: 24,
          padding: '14px 28px',
        }}>
          <div className="row" style={{ gap: 10, cursor: 'pointer' }} onClick={() => go('landing')}>
            <Logo size={28}/>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, lineHeight: 1.1 }}>
              <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: '-0.01em' }}>DigiPicks</span>
              <span style={{ fontSize: 10.5, color: 'var(--t-3)', fontFamily: 'var(--f-mono)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Creator Network</span>
            </div>
          </div>
          <nav style={{ display: 'flex', gap: 4, marginLeft: 16 }}>
            {[
              { id: 'landing', label: 'Home' },
              { id: 'today', label: "Today's Events" },
              { id: 'discover', label: 'Creators' },
              { id: 'apply', label: 'Apply' },
            ].map(it => (
              <button key={it.id}
                className={`btn btn-sm ${screen === it.id ? 'btn-secondary' : 'btn-ghost'}`}
                onClick={() => go(it.id)}>{it.label}</button>
            ))}
          </nav>
          <div style={{ flex: 1 }}/>
          <button className="btn btn-sm btn-ghost" onClick={() => switchRole('customer')}>Sign in</button>
          <button className="btn btn-sm btn-primary" onClick={() => switchRole('customer')}>Get started</button>
        </div>
      </header>
      <main>
        {screen === 'landing' && <Landing ctx={ctx}/>}
        {screen === 'today' && <TodayEvents ctx={ctx} isPublic/>}
        {screen === 'discover' && <Discover ctx={ctx} isPublic/>}
        {screen === 'apply' && <ApplyFlow ctx={ctx}/>}
        {screen === 'creator-profile' && <CreatorProfile ctx={ctx} creatorId={ctx.creatorView || 'courtvision'} isPublic/>}
      </main>
      <PublicFooter/>
    </div>
  );
}

function PublicFooter() {
  return (
    <footer style={{ borderTop: '1px solid var(--line-soft)', marginTop: 60, padding: '40px 28px 60px', background: 'var(--bg-1)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 40 }}>
        <div>
          <div className="row" style={{ gap: 10, marginBottom: 14 }}>
            <Logo size={26}/>
            <span style={{ fontSize: 15, fontWeight: 500 }}>DigiPicks</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--t-3)', lineHeight: 1.6, maxWidth: 320 }}>
            A premium network for verified sports creators and the subscribers who back their edge. Bet responsibly.
          </p>
        </div>
        {[
          { title: 'Product', items: ['Creators','Today\'s Events','Pricing','Apply'] },
          { title: 'Trust', items: ['Verification','Results methodology','Disputes','Responsible betting'] },
          { title: 'Company', items: ['About','Press','Brand','Contact'] },
          { title: 'Legal', items: ['Terms','Privacy','Refunds','21+ only'] },
        ].map(col => (
          <div key={col.title}>
            <div style={{ fontSize: 12, color: 'var(--t-2)', fontWeight: 500, marginBottom: 12 }}>{col.title}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {col.items.map(it => <a key={it} href="#" style={{ color: 'var(--t-3)', fontSize: 13, textDecoration: 'none' }}>{it}</a>)}
            </div>
          </div>
        ))}
      </div>
      <div style={{ maxWidth: 1280, margin: '40px auto 0', paddingTop: 20, borderTop: '1px solid var(--line-soft)', display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--t-3)' }}>
        <div>© 2026 DigiPicks. Information only — not gambling advice. Must be 21+. Bet responsibly.</div>
        <div className="mono">1-800-GAMBLER</div>
      </div>
    </footer>
  );
}

/* ─────────────────────────────────────────────────────────
   Landing
   ───────────────────────────────────────────────────────── */
function Landing({ ctx }) {
  return (
    <div>
      {/* HERO */}
      <section style={{ position: 'relative', overflow: 'hidden', borderBottom: '1px solid var(--line-soft)' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(800px 400px at 70% 20%, rgba(0,224,143,0.08), transparent 60%), radial-gradient(600px 300px at 20% 80%, rgba(232,194,117,0.04), transparent 60%)', pointerEvents: 'none' }}/>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '88px 28px 100px', position: 'relative', display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 60, alignItems: 'center' }}>
          <div>
            <div className="row" style={{ gap: 8, marginBottom: 22 }}>
              <Badge tone="green" dot>Now onboarding · Spring '26 cohort</Badge>
              <span style={{ fontSize: 12, color: 'var(--t-3)' }}>· 142 verified creators</span>
            </div>
            <h1 style={{
              fontSize: 64, fontWeight: 400, letterSpacing: '-0.03em', lineHeight: 1.02,
              margin: '0 0 22px',
            }}>
              Follow verified <span className="serif" style={{ fontStyle: 'italic', color: 'var(--green)' }}>sports creators</span>.<br/>
              Track every play.
            </h1>
            <p style={{ fontSize: 17.5, color: 'var(--t-2)', lineHeight: 1.55, maxWidth: 540, margin: '0 0 32px' }}>
              DigiPicks is a curated network for sports betting creators and their subscribers — premium picks, transparent results, and clean monetization in one place.
            </p>
            <div className="row" style={{ gap: 12 }}>
              <button className="btn btn-lg btn-primary" onClick={() => ctx.go('discover')}>
                Discover creators <Icon name="arrow-right" size={14}/>
              </button>
              <button className="btn btn-lg btn-outline" onClick={() => ctx.go('apply')}>Apply as a creator</button>
            </div>
            <div className="row" style={{ gap: 22, marginTop: 36, color: 'var(--t-3)', fontSize: 12 }}>
              <span className="row" style={{ gap: 6 }}><Icon name="verified" size={14} style={{ color: 'var(--blue)' }}/> Manual verification</span>
              <span className="row" style={{ gap: 6 }}><Icon name="chart" size={14}/> Independent grading</span>
              <span className="row" style={{ gap: 6 }}><Icon name="shield" size={14}/> Stripe-backed billing</span>
            </div>
          </div>

          {/* hero panel — live "tonight" tracker */}
          <HeroLivePanel ctx={ctx}/>
        </div>
      </section>

      {/* MARQUEE — featured creators */}
      <section style={{ borderBottom: '1px solid var(--line-soft)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 28px', display: 'flex', alignItems: 'center', gap: 28, color: 'var(--t-3)', fontSize: 12 }}>
          <span className="mono" style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>Trusted by creators from</span>
          <div style={{ display: 'flex', gap: 32, flex: 1, flexWrap: 'wrap' }}>
            {['Action Network','The Athletic','Vegas Stats','OddsJam','Pinnacle Edge','Bet Labs'].map(n => (
              <span key={n} style={{ fontFamily: 'var(--f-serif)', fontSize: 18, color: 'var(--t-2)', opacity: 0.55 }}>{n}</span>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED CREATORS GRID */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '88px 28px 24px' }}>
        <div className="row between" style={{ marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Featured creators</div>
            <h2 style={{ fontSize: 38, fontWeight: 400, letterSpacing: '-0.025em', margin: 0, maxWidth: 600, lineHeight: 1.1 }}>
              Verified, transparent, and <span className="serif" style={{ fontStyle: 'italic' }}>actually good</span>.
            </h2>
          </div>
          <button className="btn btn-outline" onClick={() => ctx.go('discover')}>Browse all creators <Icon name="arrow-right" size={13}/></button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
          {DATA.CREATORS.slice(0,6).map(c => (
            <CreatorCard key={c.id} creator={c} onOpen={() => ctx.openCreator(c.id)}/>
          ))}
        </div>
      </section>

      {/* TONIGHT'S EVENTS PREVIEW */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '60px 28px 24px' }}>
        <div className="row between" style={{ marginBottom: 22 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Tonight's slate</div>
            <h2 style={{ fontSize: 32, fontWeight: 400, letterSpacing: '-0.02em', margin: 0 }}>Big events, covered.</h2>
          </div>
          <button className="btn btn-ghost" onClick={() => ctx.go('today')}>See today's full slate <Icon name="arrow-right" size={13}/></button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {DATA.EVENTS_TODAY.slice(0, 4).map(ev => <EventCard key={ev.id} event={ev}/>)}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '88px 28px' }}>
        <div style={{ fontSize: 12, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>How it works</div>
        <h2 style={{ fontSize: 38, fontWeight: 400, letterSpacing: '-0.025em', margin: '0 0 40px', maxWidth: 600, lineHeight: 1.1 }}>
          Built for both sides of the network.
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          <BenefitsCard
            kind="subscribers"
            title="For subscribers"
            tone="green"
            items={[
              { icon: 'verified', t: 'Verified creators only', s: 'We manually verify each creator and publish their grading methodology.' },
              { icon: 'feed',     t: 'A clean feed, not Discord chaos', s: 'Picks, analysis, and results in one focused timeline.' },
              { icon: 'chart',    t: 'Track your followed plays', s: 'Win rate, units, streaks — your portfolio of every play you backed.' },
              { icon: 'shield',   t: 'Cancel anytime, no haggling', s: 'Stripe-backed, transparent renewals, instant cancellations.' },
            ]}
            cta="Browse creators"
            onCta={() => ctx.go('discover')}
          />
          <BenefitsCard
            kind="creators"
            title="For creators"
            tone="gold"
            items={[
              { icon: 'dollar',  t: 'Subscriptions + products', s: 'Monthly tiers, single drops, VIP cards, promo codes — built in.' },
              { icon: 'sparkles', t: 'Smart pricing recommendations', s: 'We benchmark your niche and suggest a price that maximises LTV.' },
              { icon: 'megaphone', t: 'Built-in growth tooling', s: 'Referral links, share cards, free-preview funnels, retention nudges.' },
              { icon: 'audit',    t: 'Independent grading', s: 'Wins, losses, pushes graded by the platform — not by you.' },
            ]}
            cta="Apply for access"
            onCta={() => ctx.go('apply')}
          />
        </div>
      </section>

      {/* TRUST + STATS */}
      <section style={{ borderTop: '1px solid var(--line-soft)', borderBottom: '1px solid var(--line-soft)', background: 'var(--bg-1)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '60px 28px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 40 }}>
          {[
            { k: '142', l: 'Verified creators', s: 'across NFL, NBA, NHL, MLB, soccer, tennis, UFC' },
            { k: '38,420', l: 'Active subscribers', s: 'paying for premium picks this week' },
            { k: '$2.4M', l: 'Paid to creators', s: 'in the last 90 days' },
            { k: '100%', l: 'Of picks graded', s: 'by independent platform review' },
          ].map(s => (
            <div key={s.l}>
              <div style={{ fontSize: 44, fontFamily: 'var(--f-serif)', fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 8 }}>{s.k}</div>
              <div style={{ fontSize: 13, color: 'var(--t-1)', fontWeight: 500, marginBottom: 4 }}>{s.l}</div>
              <div style={{ fontSize: 12, color: 'var(--t-3)', lineHeight: 1.4 }}>{s.s}</div>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '88px 28px 60px' }}>
        <div style={{ fontSize: 12, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>From the network</div>
        <h2 style={{ fontSize: 32, fontWeight: 400, letterSpacing: '-0.02em', margin: '0 0 40px' }}>Receipts.</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
          {[
            { q: '"Replaced my Discord, my Telegram, and my spreadsheet. The grading on every pick is the killer feature."', who: 'Riley · subscriber', meta: 'Member since Dec \'25' },
            { q: '"Smart pricing nudged me from $19 to $39. Churn went down. I should have moved earlier."', who: 'CourtVision Pro', meta: 'Creator · 2,104 subs' },
            { q: '"Finally a platform that takes verification seriously. I\'m not embarrassed to send people my profile."', who: 'IceSharp NHL', meta: 'Creator · 421 subs' },
          ].map((t, i) => (
            <div key={i} className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <p className="serif" style={{ fontSize: 22, lineHeight: 1.35, margin: 0, color: 'var(--t-1)', letterSpacing: '-0.005em' }}>{t.q}</p>
              <div style={{ marginTop: 'auto' }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{t.who}</div>
                <div style={{ fontSize: 11.5, color: 'var(--t-3)', marginTop: 2 }}>{t.meta}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING / CTA */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '60px 28px 100px' }}>
        <div style={{
          padding: '56px 56px',
          borderRadius: 22,
          background: 'linear-gradient(135deg, rgba(0,224,143,0.08), transparent 60%), var(--bg-1)',
          border: '1px solid var(--line)',
          display: 'grid', gridTemplateColumns: '1.5fr 1fr', alignItems: 'center', gap: 60,
        }}>
          <div>
            <h2 className="serif" style={{ fontSize: 56, fontWeight: 400, letterSpacing: '-0.025em', margin: '0 0 18px', lineHeight: 1.05, fontStyle: 'italic' }}>
              Bring your edge — keep more of it.
            </h2>
            <p style={{ fontSize: 16, color: 'var(--t-2)', lineHeight: 1.5, margin: '0 0 24px', maxWidth: 460 }}>
              Creators keep <strong style={{ color: 'var(--t-1)' }}>87%</strong> of subscription revenue. No hidden fees. No upsell games.
            </p>
            <div className="row" style={{ gap: 12 }}>
              <button className="btn btn-lg btn-primary" onClick={() => ctx.go('apply')}>Apply for access</button>
              <button className="btn btn-lg btn-ghost" onClick={() => ctx.go('discover')}>See what subscribers see <Icon name="arrow-right" size={14}/></button>
            </div>
          </div>
          <div className="card" style={{ padding: 22 }}>
            <div className="row between" style={{ marginBottom: 14 }}>
              <span style={{ fontSize: 11, color: 'var(--t-3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Creator example</span>
              <Badge tone="gold">Top 10%</Badge>
            </div>
            <RevenueBreakdown/>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '0 28px 100px' }}>
        <h2 style={{ fontSize: 32, fontWeight: 400, letterSpacing: '-0.02em', margin: '0 0 32px' }}>Common questions.</h2>
        <FAQList/>
      </section>
    </div>
  );
}

function HeroLivePanel({ ctx }) {
  const ev = DATA.EVENTS_TODAY[0];
  const picks = DATA.FEED_PICKS.slice(0,3);
  return (
    <div style={{
      borderRadius: 18,
      border: '1px solid var(--line)',
      background: 'linear-gradient(180deg, var(--bg-1), var(--bg-0))',
      padding: 4,
      boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.02) inset',
    }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line-soft)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className="row" style={{ gap: 7, fontSize: 11.5, color: 'var(--green)', fontWeight: 500, letterSpacing: '0.04em' }}>
          <span style={{ width: 7, height: 7, borderRadius: 50, background: 'var(--green)', boxShadow: '0 0 0 4px rgba(0,224,143,0.18)' }}/>
          LIVE TONIGHT
        </span>
        <span className="mono" style={{ marginLeft: 'auto', color: 'var(--t-3)', fontSize: 11.5 }}>9:41 PM ET</span>
      </div>
      <div style={{ padding: 18 }}>
        <div className="row between" style={{ marginBottom: 16 }}>
          <div>
            <div className="row" style={{ gap: 8, marginBottom: 6 }}>
              <SportTag sport="NBA"/>
              <span style={{ fontSize: 11.5, color: 'var(--t-3)', fontFamily: 'var(--f-mono)' }}>NBA · 7:30 PM ET</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 500, letterSpacing: '-0.01em' }}>Lakers vs Nuggets</div>
          </div>
          <div className="row" style={{ gap: 6 }}>
            <span className="tag">8 creators</span>
            <span className="tag">14 picks</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {picks.map(p => {
            const c = creatorById(p.creator);
            return (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px',
                background: 'var(--bg-2)', borderRadius: 10,
                border: '1px solid var(--line-soft)',
              }}>
                <Avatar creator={c} size={26}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="row" style={{ gap: 6 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 500 }}>{c.name}</span>
                    {c.verified && <VerifiedMark size={11}/>}
                    <AccessBadge access={p.access}/>
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--t-3)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</div>
                </div>
                <span className="odds" style={{ fontSize: 13, color: 'var(--t-1)' }}>{p.odds}</span>
              </div>
            );
          })}
        </div>
        <button className="btn btn-secondary" style={{ width: '100%', marginTop: 14 }} onClick={() => ctx.go('today')}>
          See all 14 picks for tonight <Icon name="arrow-right" size={13}/>
        </button>
      </div>
    </div>
  );
}

function BenefitsCard({ title, tone, items, cta, onCta }) {
  const accent = tone === 'green' ? 'var(--green)' : 'var(--gold)';
  return (
    <div className="card" style={{ padding: 30, display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div className="row between">
        <h3 style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.01em', margin: 0 }}>{title}</h3>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {items.map((it, i) => (
          <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: tone === 'green' ? 'var(--green-soft)' : 'var(--gold-soft)',
              border: `1px solid ${tone === 'green' ? 'var(--green-line)' : 'var(--gold-line)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: accent, flexShrink: 0,
            }}>
              <Icon name={it.icon} size={15}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 3 }}>{it.t}</div>
              <div style={{ fontSize: 12.5, color: 'var(--t-3)', lineHeight: 1.5 }}>{it.s}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 'auto' }}>
        <button className={`btn ${tone === 'green' ? 'btn-primary' : 'btn-secondary'}`} onClick={onCta}>{cta} <Icon name="arrow-right" size={13}/></button>
      </div>
    </div>
  );
}

function RevenueBreakdown() {
  return (
    <div>
      <div className="row between" style={{ marginBottom: 8 }}>
        <span style={{ fontSize: 12.5, color: 'var(--t-2)' }}>Monthly subscription revenue</span>
        <span className="mono" style={{ fontSize: 13, fontWeight: 500 }}>$14,340</span>
      </div>
      <div style={{ height: 10, background: 'var(--bg-3)', borderRadius: 99, display: 'flex', overflow: 'hidden', marginBottom: 14 }}>
        <div style={{ width: '87%', background: 'var(--green)' }}/>
        <div style={{ width: '10%', background: 'var(--gold)' }}/>
        <div style={{ width: '3%', background: 'var(--bg-elev)' }}/>
      </div>
      {[
        { l: 'Creator earnings', v: '$12,476', pct: '87%', dot: 'var(--green)' },
        { l: 'Platform fee', v: '$1,434', pct: '10%', dot: 'var(--gold)' },
        { l: 'Stripe processing', v: '$430', pct: '3%', dot: 'var(--bg-elev)' },
      ].map(r => (
        <div key={r.l} className="row between" style={{ padding: '7px 0', fontSize: 12.5, color: 'var(--t-2)', borderBottom: '1px solid var(--line-soft)' }}>
          <span className="row" style={{ gap: 8 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: r.dot }}/>{r.l}</span>
          <span className="row mono" style={{ gap: 12 }}>{r.pct} <span style={{ color: 'var(--t-1)', minWidth: 60, textAlign: 'right' }}>{r.v}</span></span>
        </div>
      ))}
    </div>
  );
}

function FAQList() {
  const items = [
    { q: 'How are picks graded?', a: 'Every pick is graded by the platform, not by the creator. We use closing odds and resulted markets from our data provider; pushes and voids are graded as such, not as wins.' },
    { q: 'What does verification involve?', a: 'We verify identity, prior track record, source of audience, and content samples. Creators must have a transparent, datable history of picks before approval.' },
    { q: 'Can I cancel any time?', a: 'Yes. Cancellations are immediate, you keep access until the period end, and there is no haggling or retention dark patterns.' },
    { q: 'Do you offer refunds?', a: 'Refunds are reviewed case-by-case for billing errors, missed picks, and creator suspensions. See our refund policy for details.' },
    { q: 'Is this gambling?', a: 'No — DigiPicks is an information and creator network. We do not take wagers. Where you place bets is up to you and your local jurisdiction.' },
    { q: 'What\'s the creator revenue split?', a: 'Creators keep 87% of subscription revenue. Platform takes 10%. Stripe processing is ~3%. No additional fees.' },
  ];
  const [open, setOpen] = usePub(0);
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      {items.map((it, i) => (
        <div key={i} style={{ borderBottom: i < items.length - 1 ? '1px solid var(--line-soft)' : 'none' }}>
          <button onClick={() => setOpen(open === i ? -1 : i)} style={{
            width: '100%', textAlign: 'left', padding: '20px 22px',
            background: 'transparent', border: 'none', color: 'var(--t-1)',
            fontSize: 15, fontWeight: 500, cursor: 'pointer',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14,
          }}>
            <span>{it.q}</span>
            <Icon name={open === i ? 'arrow-up' : 'arrow-down'} size={14} style={{ color: 'var(--t-3)' }}/>
          </button>
          {open === i && (
            <div style={{ padding: '0 22px 22px', fontSize: 14, color: 'var(--t-2)', lineHeight: 1.6, maxWidth: 720 }}>{it.a}</div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Creator card (used on landing + discovery)
   ───────────────────────────────────────────────────────── */
function CreatorCard({ creator, onOpen }) {
  return (
    <div className="card card-hover" style={{ padding: 18, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 14 }} onClick={onOpen}>
      <div className="row" style={{ gap: 12 }}>
        <Avatar creator={creator} size={44}/>
        <div style={{ flex: 1 }}>
          <div className="row" style={{ gap: 4 }}>
            <span style={{ fontSize: 14.5, fontWeight: 500 }}>{creator.name}</span>
            {creator.verified && <VerifiedMark size={12}/>}
          </div>
          <div style={{ fontSize: 12, color: 'var(--t-3)', marginTop: 2 }}>{creator.handle} · {creator.niche}</div>
        </div>
        {creator.trending && <Badge tone="amber" icon="flame">Trending</Badge>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, padding: '12px 0', borderTop: '1px solid var(--line-soft)', borderBottom: '1px solid var(--line-soft)' }}>
        <Stat label="Win rate" value={`${(creator.winRate*100).toFixed(1)}%`} accent="var(--green)"/>
        <Stat label="Record" value={creator.record}/>
        <Stat label="Subs" value={creator.subs.toLocaleString()}/>
      </div>
      <div className="row between">
        <div className="row" style={{ gap: 8 }}>
          <FormDots last10={creator.last10}/>
          <span className="mono" style={{ fontSize: 11, color: 'var(--t-3)' }}>last 10</span>
        </div>
        <span className="mono" style={{ fontSize: 12, color: 'var(--t-1)' }}>from ${creator.startingPrice}/mo</span>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div>
      <div style={{ fontSize: 10.5, color: 'var(--t-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
      <div className="mono" style={{ fontSize: 14, color: accent || 'var(--t-1)', fontWeight: 500 }}>{value}</div>
    </div>
  );
}

/* event card */
function EventCard({ event }) {
  return (
    <div className="card card-hover" style={{ padding: 16, cursor: 'pointer' }}>
      <div className="row between" style={{ marginBottom: 12 }}>
        <SportTag sport={event.sport}/>
        <span className="mono" style={{ fontSize: 11, color: 'var(--t-3)' }}>{event.time}</span>
      </div>
      <div style={{ fontSize: 14.5, fontWeight: 500, marginBottom: 4, letterSpacing: '-0.005em' }}>
        {event.away ? `${event.away} @ ${event.home}` : event.home}
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--t-3)', marginBottom: 14 }}>{event.league}</div>
      <div className="row between" style={{ borderTop: '1px solid var(--line-soft)', paddingTop: 10 }}>
        <span style={{ fontSize: 11.5, color: 'var(--t-2)' }}><strong className="mono" style={{ color: 'var(--t-1)' }}>{event.creators}</strong> creators</span>
        <span style={{ fontSize: 11.5, color: 'var(--t-2)' }}><strong className="mono" style={{ color: 'var(--green)' }}>{event.picks}</strong> picks</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Today's events (full page)
   ───────────────────────────────────────────────────────── */
function TodayEvents({ ctx, isPublic }) {
  const [sport, setSport] = usePub('All');
  const [time, setTime] = usePub('Today');
  const events = DATA.EVENTS_TODAY.filter(e => sport === 'All' || e.sport === sport);
  const grouped = events.reduce((acc, e) => { (acc[e.sport] ||= []).push(e); return acc; }, {});

  const Body = (
    <div style={{ padding: '24px 28px', maxWidth: isPublic ? 1280 : 'none', margin: '0 auto' }}>
      {!isPublic && <PageHead title="Today's Events" sub="Live odds and creator coverage for tonight's slate."/>}
      {isPublic && (
        <div style={{ padding: '40px 0 24px' }}>
          <h1 className="serif" style={{ fontSize: 56, fontWeight: 400, letterSpacing: '-0.02em', margin: '0 0 12px', fontStyle: 'italic' }}>Tonight, on the slate.</h1>
          <p style={{ fontSize: 16, color: 'var(--t-2)', maxWidth: 560, margin: '0 0 28px' }}>Every event our verified creators are covering, in one place. Sign in to see picks.</p>
        </div>
      )}

      {/* filters */}
      <div className="row" style={{ gap: 10, marginBottom: 22, flexWrap: 'wrap' }}>
        <div className="search" style={{ width: 280 }}>
          <Icon name="search" size={14}/>
          <input placeholder="Search team, league, or event"/>
        </div>
        <div style={{ width: 1, height: 28, background: 'var(--line-soft)', margin: '0 6px' }}/>
        {['Today','Starting Soon','Tonight','This Week'].map(t => (
          <span key={t} className={`chip ${time === t ? 'green-active' : ''}`} onClick={() => setTime(t)}>
            <Icon name="clock" size={12}/> {t}
          </span>
        ))}
        <div style={{ width: 1, height: 28, background: 'var(--line-soft)', margin: '0 6px' }}/>
        {['All', ...DATA.SPORTS].map(s => (
          <span key={s} className={`chip ${sport === s ? 'active' : ''}`} onClick={() => setSport(s)}>{s}</span>
        ))}
      </div>

      {/* featured */}
      {events.filter(e => e.featured).length > 0 && (
        <Section title="Featured" sub="Most creator coverage tonight">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
            {events.filter(e => e.featured).map(e => <FeaturedEventCard key={e.id} event={e}/>)}
          </div>
        </Section>
      )}

      {Object.entries(grouped).map(([sp, evs]) => (
        <Section key={sp} title={sp} sub={`${evs.length} event${evs.length === 1 ? '' : 's'}`}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {evs.map(e => <EventCard key={e.id} event={e}/>)}
          </div>
        </Section>
      ))}

      {events.length === 0 && (
        <EmptyState icon="calendar" title="No events match those filters" subtitle="Try widening the time window or selecting all sports."/>
      )}
    </div>
  );

  if (isPublic) return Body;

  return (
    <>
      <Topbar title="Today's Events" search="Search teams, leagues, events"
        actions={<button className="btn btn-secondary"><Icon name="filter" size={13}/> Filters</button>}/>
      {Body}
    </>
  );
}

function FeaturedEventCard({ event }) {
  return (
    <div style={{
      padding: 20, borderRadius: 14,
      background: 'linear-gradient(135deg, rgba(0,224,143,0.04), transparent), var(--bg-1)',
      border: '1px solid var(--line)',
      cursor: 'pointer',
    }}>
      <div className="row between" style={{ marginBottom: 14 }}>
        <div className="row" style={{ gap: 8 }}>
          <SportTag sport={event.sport}/>
          <Badge tone="amber" icon="flame">Featured</Badge>
        </div>
        <span className="mono" style={{ fontSize: 12, color: 'var(--t-3)' }}>{event.time}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.01em', marginBottom: 4 }}>
        {event.away ? `${event.away} @ ${event.home}` : event.home}
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--t-3)', marginBottom: 18 }}>{event.league}</div>
      <div className="row between">
        <div className="row" style={{ gap: 18 }}>
          <span style={{ fontSize: 12, color: 'var(--t-2)' }}><strong className="mono" style={{ color: 'var(--t-1)' }}>{event.creators}</strong> creators</span>
          <span style={{ fontSize: 12, color: 'var(--t-2)' }}><strong className="mono" style={{ color: 'var(--green)' }}>{event.picks}</strong> picks</span>
        </div>
        <button className="btn btn-sm btn-secondary">View picks <Icon name="arrow-right" size={12}/></button>
      </div>
    </div>
  );
}

function PageHead({ title, sub, actions }) {
  return (
    <div className="row between" style={{ padding: '6px 0 22px' }}>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-0.015em', margin: 0 }}>{title}</h1>
        {sub && <div style={{ fontSize: 13, color: 'var(--t-3)', marginTop: 4 }}>{sub}</div>}
      </div>
      {actions}
    </div>
  );
}

window.PublicShell = PublicShell;
window.Landing = Landing;
window.PublicFooter = PublicFooter;
window.CreatorCard = CreatorCard;
window.EventCard = EventCard;
window.FeaturedEventCard = FeaturedEventCard;
window.TodayEvents = TodayEvents;
window.PageHead = PageHead;
