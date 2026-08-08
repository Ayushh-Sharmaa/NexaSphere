import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

/**
 * EventCalendarView
 * Renders events in a monthly FullCalendar grid.
 * Clicking a date-bearing event fires onEventClick.
 */
export default function EventCalendarView({ events = [], onEventClick }) {
  const parseDate = (ev) => {
    const raw = ev.dateText ?? ev.date ?? '';
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
  };

  const calEvents = events
    .map((ev) => {
      const date = parseDate(ev);
      if (!date) return null;
      return {
        id: String(ev.id),
        title: ev.title || ev.name || 'Event',
        date,
        backgroundColor:
          ev.status === 'upcoming' ? 'rgba(0,212,255,0.75)' : 'rgba(123,111,255,0.55)',
        borderColor: 'transparent',
        textColor: '#fff',
        extendedProps: { raw: ev },
      };
    })
    .filter(Boolean);

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        padding: '20px',
        overflow: 'hidden',
      }}
    >
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={calEvents}
        eventClick={(info) => {
          const raw = info.event.extendedProps?.raw;
          if (raw?.hasDetailPage && onEventClick) onEventClick(raw);
        }}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth',
        }}
        height="auto"
      />
    </div>
  );
}
