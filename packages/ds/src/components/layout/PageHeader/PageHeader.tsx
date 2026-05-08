import React from 'react';
import { Topbar } from '../../nav/Topbar/Topbar';
import { Breadcrumb } from '../../nav/Breadcrumb/Breadcrumb';

export interface PageHeaderCrumb {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  /** Title shown in the topbar (e.g. the page name). */
  title: string;
  /** Breadcrumb trail leading up to the current page. */
  crumbs?: PageHeaderCrumb[];
  /** Action slot — usually one or two Buttons. */
  actions?: React.ReactNode;
  /** Optional placeholder text — when set, the topbar renders a search input. */
  search?: string;
}

/**
 * Topbar + Breadcrumb composition used by every dashboard / studio page.
 * Pages just declare the crumb trail and pass actions — no manual
 * `<Topbar crumb={<Breadcrumb items={[...]} />} />` plumbing.
 */
export function PageHeader({ title, crumbs, actions, search }: PageHeaderProps) {
  return (
    <Topbar
      title={title}
      crumb={crumbs && crumbs.length > 0 ? <Breadcrumb items={crumbs} /> : undefined}
      actions={actions}
      search={search}
    />
  );
}
