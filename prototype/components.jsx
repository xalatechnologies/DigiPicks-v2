// components.jsx — shared UI primitives for DigiPicks
const { useState, useEffect, useMemo, useRef, Fragment } = React;

/* ─────────────────────────────────────────────────────────
   Icons (inline SVG, 1.5px stroke, currentColor)
   ───────────────────────────────────────────────────────── */
const Icon = ({ name, size = 16, ...rest }) => {
  const s = size;
  const sw = 1.5;
  const common = { width: s, height: s, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round', ...rest };
  switch (name) {
    case 'home': return <svg {...common}><path d="M3 11l9-7 9 7v9a2 2 0 01-2 2h-4v-7h-6v7H5a2 2 0 01-2-2v-9z"/></svg>;
    case 'search': return <svg {...common}><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>;
    case 'compass': return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M15.5 8.5L13 13l-4.5 2.5L11 11z"/></svg>;
    case 'feed': return <svg {...common}><path d="M3 5h18M3 12h18M3 19h12"/></svg>;
    case 'bookmark': return <svg {...common}><path d="M6 3h12v18l-6-4-6 4V3z"/></svg>;
    case 'chart': return <svg {...common}><path d="M3 20h18"/><path d="M6 16V9"/><path d="M11 16V5"/><path d="M16 16v-7"/><path d="M21 16v-4"/></svg>;
    case 'card': return <svg {...common}><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/></svg>;
    case 'bell': return <svg {...common}><path d="M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9z"/><path d="M10 21a2 2 0 004 0"/></svg>;
    case 'help': return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 015 0c0 1.7-2.5 2-2.5 4"/><circle cx="12" cy="17" r="0.6" fill="currentColor"/></svg>;
    case 'gear': return <svg {...common}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 01-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 01-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 012.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 012.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z"/></svg>;
    case 'user': return <svg {...common}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/></svg>;
    case 'users': return <svg {...common}><circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0114 0"/><path d="M16 4a4 4 0 010 8M22 21a7 7 0 00-6-7"/></svg>;
    case 'plus': return <svg {...common}><path d="M12 5v14M5 12h14"/></svg>;
    case 'chevron-right': return <svg {...common}><path d="M9 6l6 6-6 6"/></svg>;
    case 'chevron-left': return <svg {...common}><path d="M15 6l-6 6 6 6"/></svg>;
    case 'chevron-down': return <svg {...common}><path d="M6 9l6 6 6-6"/></svg>;
    case 'sun': return <svg {...common}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>;
    case 'moon': return <svg {...common}><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>;
    case 'check': return <svg {...common}><path d="M5 12l5 5L20 6"/></svg>;
    case 'x': return <svg {...common}><path d="M6 6l12 12M18 6L6 18"/></svg>;
    case 'arrow-up': return <svg {...common}><path d="M12 19V5M5 12l7-7 7 7"/></svg>;
    case 'arrow-right': return <svg {...common}><path d="M5 12h14M13 5l7 7-7 7"/></svg>;
    case 'arrow-left': return <svg {...common}><path d="M19 12H5M11 5l-7 7 7 7"/></svg>;
    case 'arrow-down': return <svg {...common}><path d="M12 5v14M5 12l7 7 7-7"/></svg>;
    case 'lock': return <svg {...common}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>;
    case 'shield': return <svg {...common}><path d="M12 3l8 4v6c0 5-3.5 7.5-8 8-4.5-.5-8-3-8-8V7l8-4z"/></svg>;
    case 'verified': return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12 1.5l2.6 1.9 3.2-.4 1.4 2.9 2.9 1.5-.4 3.2 1.9 2.6-1.9 2.6.4 3.2-2.9 1.5-1.4 2.9-3.2-.4L12 22.5l-2.6-1.9-3.2.4-1.4-2.9-2.9-1.5.4-3.2L.4 10.8l1.9-2.6-.4-3.2 2.9-1.5 1.4-2.9 3.2.4L12 1.5z"/><path d="M8 12l3 3 5-6" stroke="#08090B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>;
    case 'flame': return <svg {...common}><path d="M12 2c1 4 5 5 5 10a5 5 0 01-10 0c0-2 1-3 1-5 2 1 3 0 4-5z"/></svg>;
    case 'dollar': return <svg {...common}><path d="M12 2v20M17 6H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>;
    case 'sparkles': return <svg {...common}><path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3z"/><path d="M19 17l.7 2.3L22 20l-2.3.7L19 23l-.7-2.3L16 20l2.3-.7L19 17z"/></svg>;
    case 'tag': return <svg {...common}><path d="M3 13V5a2 2 0 012-2h8l8 8-10 10-8-8z"/><circle cx="8" cy="8" r="1.5"/></svg>;
    case 'message': return <svg {...common}><path d="M21 11a8 8 0 11-3-6.2L21 4l-1 4a8 8 0 011 3z"/></svg>;
    case 'link': return <svg {...common}><path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/></svg>;
    case 'gift': return <svg {...common}><rect x="3" y="8" width="18" height="13" rx="1"/><path d="M3 12h18M12 8v13M12 8c-2-3-6-3-6 0s4 0 6 0zM12 8c2-3 6-3 6 0s-4 0-6 0z"/></svg>;
    case 'megaphone': return <svg {...common}><path d="M3 11v2a1 1 0 001 1h2l5 4V6L6 10H4a1 1 0 00-1 1z"/><path d="M16 8a5 5 0 010 8M19 5a8 8 0 010 14"/></svg>;
    case 'key': return <svg {...common}><circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3"/></svg>;
    case 'inbox': return <svg {...common}><path d="M3 13l3-8h12l3 8"/><path d="M3 13v6a1 1 0 001 1h16a1 1 0 001-1v-6"/><path d="M3 13h5l1 2h6l1-2h5"/></svg>;
    case 'flag': return <svg {...common}><path d="M5 21V4M5 4h12l-2 4 2 4H5"/></svg>;
    case 'eye': return <svg {...common}><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>;
    case 'play': return <svg {...common}><path d="M6 4l14 8-14 8V4z" fill="currentColor"/></svg>;
    case 'edit': return <svg {...common}><path d="M12 20h9M16.5 3.5a2 2 0 113 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>;
    case 'trash': return <svg {...common}><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M6 6l1 14a2 2 0 002 2h6a2 2 0 002-2l1-14"/></svg>;
    case 'filter': return <svg {...common}><path d="M3 5h18M6 12h12M10 19h4"/></svg>;
    case 'more': return <svg {...common}><circle cx="5" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="19" cy="12" r="1.5" fill="currentColor"/></svg>;
    case 'calendar': return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>;
    case 'clock': return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
    case 'trophy': return <svg {...common}><path d="M8 21h8M12 17v4M5 4h14v4a5 5 0 01-5 5h-4a5 5 0 01-5-5V4z"/><path d="M5 6H3v3a3 3 0 003 3M19 6h2v3a3 3 0 01-3 3"/></svg>;
    case 'audit': return <svg {...common}><path d="M9 4h6l4 4v12a1 1 0 01-1 1H6a1 1 0 01-1-1V5a1 1 0 011-1h3z"/><path d="M14 4v4h4M9 13h6M9 17h4"/></svg>;
    default: return <svg {...common}/>;
  }
};

/* ─────────────────────────────────────────────────────────
   Avatar
   ───────────────────────────────────────────────────────── */
function Avatar({ creator, size = 32 }) {
  const c = typeof creator === 'string' ? creatorById(creator) : creator;
  if (!c) return <div className="avatar" style={{ width: size, height: size, background: 'var(--bg-3)' }}/>;
  return (
    <div className="avatar" style={{
      width: size, height: size,
      background: `linear-gradient(135deg, ${c.avatar.color}, ${c.avatar.color}AA)`,
      color: 'var(--primary-foreground)',
      fontSize: size * 0.36,
      fontFamily: 'var(--f-mono)',
      letterSpacing: '0.02em',
    }}>{c.avatar.mono}</div>
  );
}

/* ─────────────────────────────────────────────────────────
   Verified mark + creator handle row
   ───────────────────────────────────────────────────────── */
function VerifiedMark({ size = 13 }) {
  return <span style={{ color: 'var(--blue)', display: 'inline-flex', verticalAlign: 'middle', marginLeft: 3 }}><Icon name="verified" size={size}/></span>;
}

function CreatorChip({ creatorId, size = 28, sub = null, onClick }) {
  const c = creatorById(creatorId);
  if (!c) return null;
  return (
    <div className="row" style={{ gap: 9, cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
      <Avatar creator={c} size={size}/>
      <div style={{ lineHeight: 1.1 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--t-1)' }}>
          {c.name}{c.verified && <VerifiedMark/>}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--t-3)', marginTop: 2 }}>
          {sub || c.handle}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Badges
   ───────────────────────────────────────────────────────── */
function Badge({ tone = 'mute', dot = false, children, icon, style }) {
  const cls = {
    green:'b-green', gold:'b-gold', red:'b-red', amber:'b-amber',
    blue:'b-blue', violet:'b-violet', mute:'b-mute',
  }[tone] || 'b-mute';
  return (
    <span className={`badge-base ${cls}`} style={style}>
      {dot && <span className="dot"/>}
      {icon && <Icon name={icon} size={11}/>}
      {children}
    </span>
  );
}

function AccessBadge({ access }) {
  if (access === 'free') return <Badge tone="mute">Free</Badge>;
  if (access === 'premium') return <Badge tone="gold" icon="lock">Premium</Badge>;
  if (access === 'vip') return <Badge tone="violet" icon="sparkles">VIP</Badge>;
  return null;
}

function GradeBadge({ grade }) {
  if (!grade || grade === 'pending') return <Badge tone="amber" dot>Pending</Badge>;
  if (grade === 'win') return <Badge tone="green" dot>Win</Badge>;
  if (grade === 'loss') return <Badge tone="red" dot>Loss</Badge>;
  if (grade === 'push') return <Badge tone="mute" dot>Push</Badge>;
  if (grade === 'void') return <Badge tone="mute" dot>Void</Badge>;
  if (grade === 'disputed') return <Badge tone="violet" dot>Disputed</Badge>;
  return <Badge tone="mute">{grade}</Badge>;
}

/* ─────────────────────────────────────────────────────────
   Sport icon (text mono, no clip-art)
   ───────────────────────────────────────────────────────── */
const SPORT_TONE = {
  NFL: '#E2A66E', NBA: '#E8754F', NHL: '#6FA8E5',
  MLB: '#7AB87A', Soccer: '#A88EE5', Tennis: '#E0D472',
  UFC: '#E25E5E',
};
function SportTag({ sport }) {
  return (
    <span className="sport" style={{ color: SPORT_TONE[sport] || 'var(--t-2)' }}>
      {sport === 'Soccer' ? 'SOC' : (sport || '').slice(0,3).toUpperCase()}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────
   Sparkline (W/L last 10)
   ───────────────────────────────────────────────────────── */
function FormDots({ last10 = '' }) {
  return (
    <div style={{ display: 'inline-flex', gap: 3 }}>
      {last10.split('').map((c, i) => (
        <span key={i} style={{
          width: 7, height: 7, borderRadius: 2,
          background: c === 'W' ? 'var(--green)' : c === 'L' ? 'var(--red)' : 'var(--t-3)',
          opacity: c === '-' ? 0.3 : 1,
        }}/>
      ))}
    </div>
  );
}

/* line chart sparkline */
function Sparkline({ values, color = 'var(--green)', width = 80, height = 22 }) {
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 2) - 1;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg className="spark" width={width} height={height} style={{ overflow: 'visible' }}>
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={pts}/>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────
   Image placeholder
   ───────────────────────────────────────────────────────── */
function Placeholder({ label = 'image', height = 140, style }) {
  return (
    <div className="ph" style={{ height, borderRadius: 'var(--r-md)', ...style }}>
      <div className="ph-label">{label}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Pick card (full)
   ───────────────────────────────────────────────────────── */
function PickCard({ pick, onOpen, locked = false, saved, onSave }) {
  const c = creatorById(pick.creator);
  const isLocked = locked && pick.access !== 'free';
  return (
    <div className="pick-card" onClick={onOpen} style={{ cursor: 'pointer' }}>
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--line-soft)' }}>
        <CreatorChip creatorId={pick.creator} size={26}/>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
          <SportTag sport={pick.sport}/>
          <AccessBadge access={pick.access}/>
        </div>
      </div>
      <div style={{ padding: '14px 16px 16px' }}>
        <div className="row between" style={{ marginBottom: 6 }}>
          <span style={{ fontSize: 11.5, color: 'var(--t-3)', fontFamily: 'var(--f-mono)', letterSpacing: '0.02em' }}>{pick.event} · {pick.eventTime}</span>
          <span style={{ fontSize: 11.5, color: 'var(--t-3)' }}>{pick.posted}</span>
        </div>
        <div style={{ fontSize: 16, fontWeight: 500, letterSpacing: '-0.01em', color: 'var(--t-1)', marginBottom: 12 }}>
          {pick.title}
        </div>
        <div className="row" style={{ gap: 18, marginBottom: 12 }}>
          <DataPair label="Market" value={pick.market}/>
          <DataPair label="Selection" value={pick.selection}/>
          <DataPair label="Odds" value={pick.odds} mono/>
          <DataPair label="Stake" value={pick.units} mono/>
        </div>

        {isLocked ? (
          <div style={{
            padding: '14px 16px',
            border: '1px dashed var(--gold-line)',
            borderRadius: 10,
            background: 'rgba(232,194,117,0.04)',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--gold-soft)', display: 'flex', alignItems:'center', justifyContent:'center', color: 'var(--gold)' }}>
              <Icon name="lock" size={14}/>
            </div>
            <div style={{ flex: 1, fontSize: 12.5, color: 'var(--t-2)', lineHeight: 1.45 }}>
              Premium analysis hidden. Subscribe to {c?.name} to unlock pick reasoning, units, and confidence.
            </div>
            <button className="btn btn-sm btn-primary" onClick={(e)=>{ e.stopPropagation(); onOpen?.(); }}>Unlock</button>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: 'var(--t-2)', lineHeight: 1.55 }}>
            {pick.body || pick.teaser}
          </div>
        )}

        <div className="row between" style={{ marginTop: 14 }}>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn btn-sm btn-outline" onClick={(e)=>{e.stopPropagation(); onSave?.();}}>
              <Icon name="bookmark" size={13}/> {saved ? 'Saved' : 'Save'}
            </button>
            <button className="btn btn-sm btn-outline" onClick={(e)=>e.stopPropagation()}>
              <Icon name="check" size={13}/> Follow play
            </button>
          </div>
          <GradeBadge grade={pick.status}/>
        </div>
      </div>
    </div>
  );
}

function DataPair({ label, value, mono }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{ fontSize: 10.5, color: 'var(--t-3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--t-1)', fontFamily: mono ? 'var(--f-mono)' : 'inherit', fontWeight: 500 }}>{value}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Empty state
   ───────────────────────────────────────────────────────── */
function EmptyState({ icon = 'inbox', title, subtitle, action }) {
  return (
    <div style={{
      padding: '60px 28px',
      textAlign: 'center',
      border: '1px dashed var(--line)',
      borderRadius: 16,
      background: 'var(--bg-1)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12, background: 'var(--bg-3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t-3)',
        marginBottom: 6,
      }}><Icon name={icon} size={20}/></div>
      <div style={{ fontSize: 15, fontWeight: 500 }}>{title}</div>
      <div style={{ fontSize: 13, color: 'var(--t-3)', maxWidth: 320, lineHeight: 1.5 }}>{subtitle}</div>
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Confidence bar
   ───────────────────────────────────────────────────────── */
function ConfidenceBar({ level }) {
  const v = { Low: 0.33, Medium: 0.66, High: 1 }[level] || 0.5;
  return (
    <div className="row" style={{ gap: 8 }}>
      <div className="bar" style={{ width: 60 }}><i style={{ width: `${v * 100}%` }}/></div>
      <span className="mono" style={{ fontSize: 11, color: 'var(--t-2)' }}>{level}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Section heading
   ───────────────────────────────────────────────────────── */
function Section({ title, sub, action, children, style }) {
  return (
    <div style={{ marginBottom: 28, ...style }}>
      <div className="row between" style={{ marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 500, letterSpacing: '-0.01em' }}>{title}</div>
          {sub && <div style={{ fontSize: 12.5, color: 'var(--t-3)', marginTop: 3 }}>{sub}</div>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

/* responsibility footnote */
function ResponsibleNote({ style }) {
  return (
    <div style={{
      fontSize: 11.5,
      color: 'var(--t-3)',
      lineHeight: 1.55,
      padding: '12px 14px',
      borderRadius: 10,
      background: 'var(--bg-1)',
      border: '1px solid var(--line-soft)',
      ...style,
    }}>
      <div className="row" style={{ gap: 8, marginBottom: 6, color: 'var(--t-2)' }}>
        <Icon name="shield" size={13}/> <strong style={{ fontWeight: 500, fontSize: 12 }}>Bet responsibly</strong>
      </div>
      Past performance does not guarantee future results. Picks are for informational purposes; you alone are responsible for any wagers placed. If betting feels out of control, set a weekly cap in Settings or contact 1-800-GAMBLER.
    </div>
  );
}

Object.assign(window, {
  Icon, Avatar, VerifiedMark, CreatorChip,
  Badge, AccessBadge, GradeBadge,
  SportTag, FormDots, Sparkline,
  Placeholder, PickCard, DataPair,
  EmptyState, ConfidenceBar, Section, ResponsibleNote,
});
