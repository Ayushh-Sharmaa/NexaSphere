import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import GamificationDashboard from '../components/gamification/GamificationDashboard';
import { gamificationService } from '../services/gamification/gamificationService';

// Mock matchMedia for safety
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe('GamificationDashboard Component', () => {
  beforeEach(() => {
    localStorage.clear();
    gamificationService.userData = gamificationService.loadUserData();
    vi.stubEnv('VITE_USE_DEMO_LEADERBOARD', 'true');
  });

  afterEach(() => {
    localStorage.clear();
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it('renders dashboard with user level, title, and XP stats', () => {
    render(<GamificationDashboard />);

    expect(screen.getByText('Gamification Hub')).toBeInTheDocument();
    expect(screen.getByText(/Level 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Newcomer/i)).toBeInTheDocument();
    expect(screen.getByText(/0 \/ 500 XP/i)).toBeInTheDocument();
  });

  it('allows switching between tabs', async () => {
    render(<GamificationDashboard />);

    // Default tab is Overview
    expect(screen.getByText('Recent Achievements')).toBeInTheDocument();

    // Switch to Badges
    const badgesTab = screen.getByRole('button', { name: 'Badges' });
    fireEvent.click(badgesTab);
    expect(
      screen.getByText('No badges yet. Complete achievements to earn badges!')
    ).toBeInTheDocument();

    // Switch to Leaderboard
    const leaderboardTab = screen.getByRole('button', { name: 'Leaderboard' });
    fireEvent.click(leaderboardTab);
    expect(await screen.findByText('Alex Johnson')).toBeInTheDocument();
    expect(await screen.findByText('Sarah Chen')).toBeInTheDocument();

    // Switch to Earn XP (Actions)
    const actionsTab = screen.getByRole('button', { name: 'Earn XP' });
    fireEvent.click(actionsTab);
    expect(screen.getByText('Attend an Event')).toBeInTheDocument();
    expect(screen.getByText('Post a Comment')).toBeInTheDocument();
  });

  it('displays a toast notification when an action awards XP', async () => {
    render(<GamificationDashboard />);

    // Switch to Earn XP tab
    const actionsTab = screen.getByRole('button', { name: 'Earn XP' });
    fireEvent.click(actionsTab);

    // Click "Post a Comment" (Comment action awards 5 XP)
    const commentBtn = screen.getByRole('button', { name: /Post a Comment/i });

    // Wrap state updates in act
    act(() => {
      fireEvent.click(commentBtn);
    });

    // Achievement 'first_comment' should unlock (+25 XP) in the same call
    // XP is now 5 (action) + 25 (achievement) = 30 XP
    expect(screen.getByText(/30 \/ 500 XP/i)).toBeInTheDocument();

    // Toast for achievement should be present
    expect(screen.getByText(/Achievement Unlocked: Voice Your Thoughts!/i)).toBeInTheDocument();
  });

  it('allows manual dismissal of toasts', () => {
    render(<GamificationDashboard />);

    // Switch to Earn XP
    fireEvent.click(screen.getByRole('button', { name: 'Earn XP' }));

    // Click comment to trigger achievement and toast
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /Post a Comment/i }));
    });

    const toast = screen.getByText(/Achievement Unlocked: Voice Your Thoughts!/i);
    expect(toast).toBeInTheDocument();

    // Click close button
    const closeBtn = screen.getByRole('button', { name: '×' });
    act(() => {
      fireEvent.click(closeBtn);
    });

    expect(
      screen.queryByText(/Achievement Unlocked: Voice Your Thoughts!/i)
    ).not.toBeInTheDocument();
  });

  it('auto-dismisses toasts after timer expires', () => {
    vi.useFakeTimers();
    render(<GamificationDashboard />);

    // Switch to Earn XP
    fireEvent.click(screen.getByRole('button', { name: 'Earn XP' }));

    // Click comment
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /Post a Comment/i }));
    });

    expect(screen.getByText(/Achievement Unlocked: Voice Your Thoughts!/i)).toBeInTheDocument();

    // Fast-forward 4 seconds
    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(
      screen.queryByText(/Achievement Unlocked: Voice Your Thoughts!/i)
    ).not.toBeInTheDocument();
  });
});
