/** Rolling window start for studio analytics filters. */
export function periodStartMs(range: string, now = Date.now()): number {
  switch (range) {
    case '7d':
      return now - 7 * 24 * 60 * 60 * 1000;
    case '30d':
      return now - 30 * 24 * 60 * 60 * 1000;
    case '90d':
      return now - 90 * 24 * 60 * 60 * 1000;
    case 'ytd': {
      const d = new Date(now);
      return new Date(d.getFullYear(), 0, 1).getTime();
    }
    default:
      return 0;
  }
}

export function periodLabel(range: string): string {
  switch (range) {
    case '7d':
      return 'Last 7 days';
    case '90d':
      return 'Last 90 days';
    case 'ytd':
      return 'Year to date';
    default:
      return 'Last 30 days';
  }
}
