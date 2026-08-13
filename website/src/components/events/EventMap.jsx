import React, { useState } from 'react';
import { MapPin, Navigation, Search, Map as MapIcon, Filter } from 'lucide-react';
import './EventMap.css';

const MOCK_EVENTS = [
  {
    id: 1,
    title: 'Tech Conference 2026',
    location: 'Tech Hub Center',
    coords: { lat: 40.7128, lng: -74.006 },
    distance: 2.3,
  },
  {
    id: 2,
    title: 'Developer Meetup',
    location: 'Downtown Cafe',
    coords: { lat: 40.7282, lng: -73.9942 },
    distance: 0.8,
  },
  {
    id: 3,
    title: 'AI Hackathon',
    location: 'Innovation Lab',
    coords: { lat: 40.758, lng: -73.9855 },
    distance: 4.1,
  },
];

const EventMap = () => {
  const [radius, setRadius] = useState('5');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);

  const filteredEvents = MOCK_EVENTS.filter(
    (ev) =>
      ev.distance <= parseFloat(radius) &&
      (ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.location.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="event-map-container">
      <div className="map-sidebar">
        <h3>
          <MapIcon size={20} /> Event Map
        </h3>

        <div className="map-controls">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search venues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-box">
            <Filter size={16} />
            <select value={radius} onChange={(e) => setRadius(e.target.value)}>
              <option value="1">Within 1km</option>
              <option value="5">Within 5km</option>
              <option value="10">Within 10km</option>
            </select>
          </div>
        </div>

        <div className="event-list">
          {filteredEvents.length === 0 ? (
            <p className="no-events">No events found in this area.</p>
          ) : (
            filteredEvents.map((ev) => (
              <div
                key={ev.id}
                className={`event-list-item ${selectedEvent?.id === ev.id ? 'active' : ''}`}
                onClick={() => setSelectedEvent(ev)}
              >
                <h4>{ev.title}</h4>
                <p>
                  <MapPin size={12} /> {ev.location} ({ev.distance}km away)
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="map-view">
        {/* Placeholder for Google Maps integration */}
        <div className="mock-map">
          <div className="mock-map-bg"></div>

          {filteredEvents.map((ev) => (
            <div
              key={ev.id}
              className={`map-pin ${selectedEvent?.id === ev.id ? 'selected' : ''}`}
              style={{
                top: `${50 + (ev.coords.lat - 40.73) * 1000}%`,
                left: `${50 + (ev.coords.lng + 73.99) * 1000}%`,
              }}
              onClick={() => setSelectedEvent(ev)}
            >
              <MapPin size={24} color={selectedEvent?.id === ev.id ? '#3b82f6' : '#ef4444'} />
            </div>
          ))}

          {selectedEvent && (
            <div className="map-popup">
              <h4>{selectedEvent.title}</h4>
              <p>{selectedEvent.location}</p>
              <a
                href={`https://maps.google.com/?q=${selectedEvent.coords.lat},${selectedEvent.coords.lng}`}
                target="_blank"
                rel="noreferrer"
                className="directions-link"
              >
                <Navigation size={14} /> Get Directions
              </a>
              <button className="close-popup" onClick={() => setSelectedEvent(null)}>
                ×
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventMap;
