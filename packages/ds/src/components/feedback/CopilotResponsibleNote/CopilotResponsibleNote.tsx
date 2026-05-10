import React from 'react';
import { ResponsibleNote } from '../ResponsibleNote/ResponsibleNote';

export interface CopilotResponsibleNoteProps {
  className?: string;
}

const TITLE = 'Copilot answers cite live data.';
const BODY = 'Copilot answers cite live data. Numbers can change. Not betting advice.';

/**
 * Standing disclaimer for AI Copilot answer surfaces (M24). Wraps
 * `ResponsibleNote` with the canonical copilot copy so consumers don't
 * re-invent the wording per page.
 */
export function CopilotResponsibleNote({ className }: CopilotResponsibleNoteProps) {
  return <ResponsibleNote className={className} title={TITLE} body={BODY} hideHelpline />;
}
