/**
 * Parse AI-generated action date string into a Date (end of that day).
 * Used for countdown timers and due-date display.
 */
export function parseActionDate(dateString: string): Date {
  try {
    let date = new Date(dateString);

    if (isNaN(date.getTime())) {
      const lower = dateString.toLowerCase();
      if (lower.includes('next')) {
        date = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      } else if (lower.includes('tomorrow')) {
        date = new Date(Date.now() + 24 * 60 * 60 * 1000);
      } else {
        const cleaned = dateString.replace(/(\d+)(st|nd|rd|th)/, '$1');
        date = new Date(cleaned);
      }
    }

    if (isNaN(date.getTime())) {
      date = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    date.setHours(23, 59, 59, 999);
    return date;
  } catch {
    return new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
}
