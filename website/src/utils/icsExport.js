export function downloadICS(event) {
  const startDate = new Date(event.date || Date.now());
  if (Number.isNaN(startDate.getTime())) {
    console.error('Invalid event date for ICS export.');
    return;
  }

  // Default to 1 hour duration
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

  const formatDate = (date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//NexaSphere//Events//EN',
    'BEGIN:VEVENT',
    `DTSTART:${formatDate(startDate)}`,
    `DTEND:${formatDate(endDate)}`,
    `SUMMARY:${event.name || 'NexaSphere Event'}`,
    `DESCRIPTION:${(event.description || event.overview || '').replace(/\n/g, '\\n')}`,
    `LOCATION:${event.location || 'GL Bajaj Group of Institutions, Mathura'}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${(event.name || 'event').replace(/\s+/g, '_')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

const formatDateForUrl = (date) => {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

export function generateGoogleCalendarUrl(event) {
  const startDate = new Date(event.date || Date.now());
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

  const title = encodeURIComponent(event.name || 'NexaSphere Event');
  const details = encodeURIComponent(event.description || event.overview || '');
  const location = encodeURIComponent(event.location || 'GL Bajaj Group of Institutions, Mathura');
  const dates = `${formatDateForUrl(startDate)}/${formatDateForUrl(endDate)}`;

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
}

export function generateOutlookCalendarUrl(event) {
  const startDate = new Date(event.date || Date.now());
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

  const title = encodeURIComponent(event.name || 'NexaSphere Event');
  const details = encodeURIComponent(event.description || event.overview || '');
  const location = encodeURIComponent(event.location || 'GL Bajaj Group of Institutions, Mathura');

  return `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&startdt=${startDate.toISOString()}&enddt=${endDate.toISOString()}&subject=${title}&body=${details}&location=${location}`;
}
