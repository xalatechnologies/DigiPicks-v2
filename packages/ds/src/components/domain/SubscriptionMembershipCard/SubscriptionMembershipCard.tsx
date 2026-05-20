import React from 'react';
import { cx } from '../../../utils/cx';
import { Avatar } from '../../atoms/Avatar/Avatar';
import { Icon } from '../../atoms/Icon/Icon';
import { VerifiedMark } from '../../atoms/VerifiedMark/VerifiedMark';
import s from './SubscriptionMembershipCard.module.css';

export interface SubscriptionMembershipMeta {
  label: string;
  tone?: 'default' | 'active' | 'warn' | 'danger';
  icon?: 'calendar' | 'check' | 'x' | 'clock';
}

export interface SubscriptionMembershipCardProps {
  creatorName: string;
  creatorMono: string;
  creatorColor: string;
  creatorVerified?: boolean;
  nicheTag?: string;
  planLabel: string;
  price: number;
  priceSuffix?: string;
  meta?: SubscriptionMembershipMeta[];
  activityBadge?: string;
  actions?: React.ReactNode;
  className?: string;
}

const META_ICON = {
  calendar: 'calendar',
  check: 'check',
  x: 'x',
  clock: 'clock',
} as const;

export function SubscriptionMembershipCard({
  creatorName,
  creatorMono,
  creatorColor,
  creatorVerified,
  nicheTag,
  planLabel,
  price,
  priceSuffix = '/mo',
  meta,
  activityBadge,
  actions,
  className,
}: SubscriptionMembershipCardProps) {
  const cssVars = { '--av-color': creatorColor } as React.CSSProperties;

  return (
    <article className={cx(s.card, className)} style={cssVars}>
      {activityBadge ? (
        <span className={s.activity}>
          <span className={s.activityDot} aria-hidden="true" />
          {activityBadge}
        </span>
      ) : null}

      <div className={s.body}>
        <div className={s.avatarWrap}>
          <Avatar mono={creatorMono} color={creatorColor} size={96} />
          {creatorVerified ? (
            <span className={s.verified} aria-label="Verified creator">
              <VerifiedMark size={14} />
            </span>
          ) : null}
        </div>

        <div className={s.copy}>
          <div className={s.nameRow}>
            <h3 className={s.name}>{creatorName}</h3>
            {nicheTag ? <span className={s.niche}>{nicheTag}</span> : null}
          </div>
          <p className={s.planRow}>
            {planLabel}
            <span className={s.planPrice}>
              · ${price}
              {priceSuffix}
            </span>
          </p>
          {meta && meta.length > 0 ? (
            <div className={s.meta}>
              {meta.map((item) => (
                <span
                  key={item.label}
                  className={cx(
                    s.metaItem,
                    item.tone === 'active' && s.metaItemActive,
                    item.tone === 'warn' && s.metaItemWarn,
                    item.tone === 'danger' && s.metaItemDanger,
                  )}
                >
                  {item.icon ? (
                    <Icon name={META_ICON[item.icon]} size={14} aria-hidden="true" />
                  ) : null}
                  {item.label}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {actions ? <div className={s.actions}>{actions}</div> : null}
      </div>
    </article>
  );
}
