import { format, isToday, isTomorrow, isYesterday } from 'date-fns';

export const formatDueDate = (dateString?: string | null): string => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const timeFormat = format(date, 'h:mm a'); // e.g. "1:30 PM"

  if (isToday(date)) {
    return `Today at ${timeFormat}`;
  }
  if (isTomorrow(date)) {
    return `Tomorrow at ${timeFormat}`;
  }
  if (isYesterday(date)) {
    return `Missed yesterday at ${timeFormat}`;
  }

  // Format past or future dates like "16 August 2:30 AM"
  return `${format(date, 'd MMMM')} ${timeFormat}`;
};