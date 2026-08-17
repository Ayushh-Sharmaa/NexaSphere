export const formatWithTimezone = (dateStr) => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    // Check if user has a preferred timezone in localStorage
    const savedTz = localStorage.getItem('preferredTimezone');
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    };
    if (savedTz) {
      options.timeZone = savedTz;
    }

    return new Intl.DateTimeFormat('en-US', options).format(date);
  } catch (e) {
    return dateStr;
  }
};
