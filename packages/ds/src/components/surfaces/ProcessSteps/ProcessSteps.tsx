import React from 'react';
import { cx } from '../../../utils/cx';
import { Icon } from '../../atoms/Icon/Icon';
import { Card } from '../Card/Card';
import s from './ProcessSteps.module.css';

export interface ProcessStepItem {
  title: string;
  body: string;
}

export interface ProcessStepsProps {
  title?: string;
  steps: ProcessStepItem[];
  className?: string;
}

/** Numbered vertical timeline for onboarding / review flows. */
export function ProcessSteps({ title = 'Review Process', steps, className }: ProcessStepsProps) {
  return (
    <Card pad="xl" elev className={cx(s.card, className)}>
      <span className={s.watermark} aria-hidden="true">
        <Icon name="verified" size={96} />
      </span>
      <h2 className={s.title}>{title}</h2>
      <ol className={s.list}>
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          return (
            <li key={step.title} className={s.item}>
              <div className={s.rail} aria-hidden="true">
                <span className={s.badge}>{index + 1}</span>
                {!isLast ? <span className={s.connector} /> : null}
              </div>
              <div className={s.body}>
                <h3 className={s.stepTitle}>{step.title}</h3>
                <p className={s.stepSub}>{step.body}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
