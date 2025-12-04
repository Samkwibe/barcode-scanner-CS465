/**
 * Format a Date object into a human-readable string
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string (e.g., "Dec 4, 2025 at 3:45 PM")
 */
export function formatDateTime(date) {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  try {
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };

    return new Intl.DateTimeFormat('en-US', options).format(date);
  } catch (error) {
    // Fallback to simple formatting if Intl.DateTimeFormat fails
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }
}

/**
 * Format a Date object into a short date string
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string (e.g., "Dec 4, 2025")
 */
export function formatDate(date) {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  try {
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };

    return new Intl.DateTimeFormat('en-US', options).format(date);
  } catch (error) {
    return date.toLocaleDateString('en-US');
  }
}

/**
 * Format a Date object into a time string
 * @param {Date} date - The date to format
 * @returns {string} Formatted time string (e.g., "3:45 PM")
 */
export function formatTime(date) {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return 'Invalid Time';
  }

  try {
    const options = {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };

    return new Intl.DateTimeFormat('en-US', options).format(date);
  } catch (error) {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  }
}

/**
 * Format a timestamp (milliseconds) into a human-readable string
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} Formatted date string
 */
export function formatTimestamp(timestamp) {
  if (!timestamp || typeof timestamp !== 'number') {
    return 'Invalid Timestamp';
  }

  return formatDateTime(new Date(timestamp));
}

/**
 * Get a relative time string (e.g., "2 hours ago", "in 3 days")
 * @param {Date|number} date - Date object or timestamp
 * @returns {string} Relative time string
 */
export function getRelativeTime(date) {
  const timestamp = date instanceof Date ? date.getTime() : date;
  
  if (!timestamp || typeof timestamp !== 'number') {
    return 'Invalid Date';
  }

  const now = Date.now();
  const diff = timestamp - now;
  const absDiff = Math.abs(diff);
  
  const seconds = Math.floor(absDiff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  const isPast = diff < 0;
  const suffix = isPast ? 'ago' : 'from now';
  const prefix = isPast ? '' : 'in ';

  if (years > 0) {
    return `${prefix}${years} year${years === 1 ? '' : 's'}${isPast ? ' ' + suffix : ''}`;
  }
  if (months > 0) {
    return `${prefix}${months} month${months === 1 ? '' : 's'}${isPast ? ' ' + suffix : ''}`;
  }
  if (days > 0) {
    return `${prefix}${days} day${days === 1 ? '' : 's'}${isPast ? ' ' + suffix : ''}`;
  }
  if (hours > 0) {
    return `${prefix}${hours} hour${hours === 1 ? '' : 's'}${isPast ? ' ' + suffix : ''}`;
  }
  if (minutes > 0) {
    return `${prefix}${minutes} minute${minutes === 1 ? '' : 's'}${isPast ? ' ' + suffix : ''}`;
  }
  
  return 'just now';
}

// Export as dateTimeFormatter for backward compatibility
export const dateTimeFormatter = formatDateTime;
