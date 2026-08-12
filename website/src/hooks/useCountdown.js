import { useEffect, useMemo, useState, useCallback } from 'react';

const DEFAULT_SOON_THRESHOLD = 60 * 60 * 1000;

export function parseDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getEventCountdownStatus({
  startDate,
  endDate,
  soonThreshold = DEFAULT_SOON_THRESHOLD,
  now = Date.now(),
}) {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  const startTime = start?.getTime();
  const endTime = end?.getTime();
  const isCompleted = endTime && now > endTime;
  const isLive = startTime && now >= startTime && (!endTime || now <= endTime);
  const isStartingSoon = startTime && startTime > now && startTime - now <= soonThreshold;

  if (isCompleted) return 'completed';
  if (isLive) return 'live';
  if (isStartingSoon) return 'starting-soon';
  return 'upcoming';
}

export default function useCountdown({
  startDate,
  endDate,
  soonThreshold = DEFAULT_SOON_THRESHOLD,
}) {
  const start = useMemo(() => parseDate(startDate), [startDate]);
  const end = useMemo(() => parseDate(endDate), [endDate]);

  const computeCountdown = useCallback(() => {
    const now = Date.now();
    const startTime = start?.getTime();
    const endTime = end?.getTime();

    let status;
    let remaining;

    const isCompleted = endTime && now > endTime;
    const isLive = startTime && now >= startTime && (!endTime || now <= endTime);
    const isStartingSoon = startTime && startTime > now && startTime - now <= soonThreshold;

    if (isCompleted) {
      status = 'completed';
      remaining = 0;
    } else if (isLive) {
      status = 'live';
      remaining = endTime ? Math.max(endTime - now, 0) : 0;
    } else if (isStartingSoon) {
      status = 'starting-soon';
      remaining = Math.max(startTime - now, 0);
    } else {
      status = 'upcoming';
      remaining = startTime ? Math.max(startTime - now, 0) : 0;
    }

    const days = Math.floor(remaining / 86_400_000);
    const hours = Math.floor((remaining % 86_400_000) / 3_600_000);
    const minutes = Math.floor((remaining % 3_600_000) / 60_000);
    const seconds = Math.floor((remaining % 60_000) / 1000);

    return {
      status,
      remaining,
      days,
      hours,
      minutes,
      seconds,
      start,
      end,
    };
  }, [start, end, soonThreshold]);

  const [countdown, setCountdown] = useState(computeCountdown);

  useEffect(() => {
    setCountdown(computeCountdown());

    const interval = window.setInterval(() => {
      setCountdown(computeCountdown());
    }, 1000);

    return () => window.clearInterval(interval);
  }, [computeCountdown]);

  return countdown;
}
