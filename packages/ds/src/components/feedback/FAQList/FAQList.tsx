import React from 'react';
import { Accordion } from '../Accordion/Accordion';
import { AccordionItem } from '../AccordionItem/AccordionItem';

export interface FAQItem {
  q: string;
  a: string;
}

export interface FAQListProps {
  items: FAQItem[];
  className?: string;
}

export const FAQList: React.FC<FAQListProps> = ({ items, className }) => {
  return (
    <Accordion className={className}>
      {items.map((item, i) => (
        <AccordionItem key={`${item.q}-${i}`} title={item.q}>
          {item.a}
        </AccordionItem>
      ))}
    </Accordion>
  );
};
