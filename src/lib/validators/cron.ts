import { z } from 'zod';
import { parse as parseCron } from 'cron-parser';

export const cronValidator = z.string().refine(
  (value) => {
    try {
      // Attempt to parse the cron expression
      parseCron(value);
      return true;
    } catch (error) {
      return false;
    }
  },
  {
    message: 'Invalid cron expression. Please use a valid cron format (e.g., "0 * * * *" for every hour).',
  }
);

export function getNextRunDate(cronExpression: string): Date {
  try {
    const interval = parseCron(cronExpression);
    return interval.next().toDate();
  } catch (error) {
    throw new Error('Invalid cron expression');
  }
}

export function validateCronExpression(cronExpression: string): boolean {
  try {
    parseCron(cronExpression);
    return true;
  } catch (error) {
    return false;
  }
}

export function getNextNRunDates(cronExpression: string, n: number): Date[] {
  try {
    const interval = parseCron(cronExpression);
    const dates: Date[] = [];
    
    for (let i = 0; i < n; i++) {
      dates.push(interval.next().toDate());
    }
    
    return dates;
  } catch (error) {
    throw new Error('Invalid cron expression');
  }
}

export function describeCronExpression(cronExpression: string): string {
  const parts = cronExpression.split(' ');
  if (parts.length !== 5) {
    throw new Error('Invalid cron expression');
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  let description = 'Runs';

  // Minutes
  if (minute === '*') {
    description += ' every minute';
  } else if (minute.includes('/')) {
    const [, step] = minute.split('/');
    description += ` every ${step} minutes`;
  } else {
    description += ` at minute ${minute}`;
  }

  // Hours
  if (hour !== '*') {
    if (hour.includes('/')) {
      const [, step] = hour.split('/');
      description += ` every ${step} hours`;
    } else {
      description += ` of hour ${hour}`;
    }
  }

  // Days
  if (dayOfMonth !== '*') {
    description += ` on day ${dayOfMonth} of the month`;
  }

  // Months
  if (month !== '*') {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    if (month.includes('/')) {
      const [, step] = month.split('/');
      description += ` every ${step} months`;
    } else {
      const monthNumbers = month.split(',').map(m => parseInt(m) - 1);
      const monthList = monthNumbers.map(m => monthNames[m]).join(', ');
      description += ` in ${monthList}`;
    }
  }

  // Days of week
  if (dayOfWeek !== '*') {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    if (dayOfWeek.includes('/')) {
      const [, step] = dayOfWeek.split('/');
      description += ` every ${step} days of the week`;
    } else {
      const dayNumbers = dayOfWeek.split(',').map(d => parseInt(d));
      const dayList = dayNumbers.map(d => dayNames[d]).join(', ');
      description += ` on ${dayList}`;
    }
  }

  return description;
} 