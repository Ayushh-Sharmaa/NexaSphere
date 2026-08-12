import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { useRef } from 'react';
import useClickOutside from '../hooks/useClickOutside';

function OutsideHarness({ onOutside, enabled, ignore, events }) {
  const triggerRef = useRef(null);
  const panelRef = useClickOutside(onOutside, {
    enabled,
    ignore: ignore ? [triggerRef] : [],
    events,
  });

  return (
    <div>
      <button ref={triggerRef}>trigger</button>
      <div ref={panelRef} data-testid="panel">
        panel
      </div>
      <button>outside</button>
    </div>
  );
}

describe('useClickOutside', () => {
  afterEach(cleanup);

  it('invokes the handler when clicking outside the watched element', () => {
    const onOutside = vi.fn();
    render(<OutsideHarness onOutside={onOutside} />);

    fireEvent.mouseDown(screen.getByText('outside'));
    expect(onOutside).toHaveBeenCalledTimes(1);
  });

  it('does not invoke the handler when clicking inside the watched element', () => {
    const onOutside = vi.fn();
    render(<OutsideHarness onOutside={onOutside} />);

    fireEvent.mouseDown(screen.getByTestId('panel'));
    expect(onOutside).not.toHaveBeenCalled();
  });

  it('does not invoke the handler when clicking an ignored ref node', () => {
    const onOutside = vi.fn();
    render(<OutsideHarness onOutside={onOutside} ignore />);

    fireEvent.mouseDown(screen.getByText('trigger'));
    expect(onOutside).not.toHaveBeenCalled();
  });

  it('fires for touchstart events', () => {
    const onOutside = vi.fn();
    render(<OutsideHarness onOutside={onOutside} />);

    fireEvent.touchStart(screen.getByText('outside'));
    expect(onOutside).toHaveBeenCalledTimes(1);
  });

  it('passes the native event to the handler', () => {
    const onOutside = vi.fn();
    render(<OutsideHarness onOutside={onOutside} />);

    const target = screen.getByText('outside');
    fireEvent.mouseDown(target);
    expect(onOutside).toHaveBeenCalledWith(expect.any(Event));
  });

  it('respects custom event types', () => {
    const onOutside = vi.fn();
    render(<OutsideHarness onOutside={onOutside} events={['click']} />);

    fireEvent.mouseDown(screen.getByText('outside'));
    expect(onOutside).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('outside'));
    expect(onOutside).toHaveBeenCalledTimes(1);
  });

  it('does nothing when disabled', () => {
    const onOutside = vi.fn();
    render(<OutsideHarness onOutside={onOutside} enabled={false} />);

    fireEvent.mouseDown(screen.getByText('outside'));
    expect(onOutside).not.toHaveBeenCalled();
  });

  it('stays silent when the handler is not a function', () => {
    render(<OutsideHarness onOutside={undefined} />);
    expect(() => fireEvent.mouseDown(screen.getByText('outside'))).not.toThrow();
  });
});
