import React from 'react';
import { cx } from '../../../utils/cx';
import { Card } from '../Card/Card';
import { Stack } from '../../layout/Stack/Stack';
import { Row } from '../../layout/Row/Row';
import { SectionHead } from '../../layout/SectionHead/SectionHead';
import { Muted } from '../../layout/Muted/Muted';
import { Button } from '../../atoms/Button/Button';

export interface AccountRefineCardProps {
  title?: string;
  sub?: string;
  summary?: React.ReactNode;
  onReset?: () => void;
  resetLabel?: string;
  /** Replaces the default summary + reset footer row when set. */
  footer?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

/** Unified filter / search toolbar for subscriber account pages. */
export function AccountRefineCard({
  title = 'Refine results',
  sub,
  summary,
  onReset,
  resetLabel = 'Reset filters',
  footer,
  children,
  className,
}: AccountRefineCardProps) {
  const showFooter = footer != null || summary != null || onReset != null;

  return (
    <Card pad="md" className={cx(className)}>
      <Stack gap={4}>
        <SectionHead size="sm" title={title} sub={sub} />
        {children}
        {showFooter
          ? (footer ?? (
              <Row between wrap>
                {summary != null ? <Muted>{summary}</Muted> : <span />}
                {onReset ? (
                  <Button variant="ghost" size="sm" onClick={onReset}>
                    {resetLabel}
                  </Button>
                ) : null}
              </Row>
            ))
          : null}
      </Stack>
    </Card>
  );
}
