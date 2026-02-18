import { render, screen, act } from '@testing-library/react';

import { Notification } from '../notification';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

test('should auto-dismiss notification after 4 seconds', () => {
  const onDismiss = vi.fn();
  const notification = {
    id: 'test-1',
    type: 'success' as const,
    title: 'Test Notification',
    message: 'This will auto-dismiss',
  };

  render(
    <Notification notification={notification} onDismiss={onDismiss} />,
  );

  expect(screen.getByText('Test Notification')).toBeInTheDocument();
  expect(onDismiss).not.toHaveBeenCalled();

  // Advance time by 4 seconds
  act(() => {
    vi.advanceTimersByTime(4000);
  });

  expect(onDismiss).toHaveBeenCalledWith('test-1');
  expect(onDismiss).toHaveBeenCalledTimes(1);
});

test('should not auto-dismiss before 4 seconds', () => {
  const onDismiss = vi.fn();
  const notification = {
    id: 'test-2',
    type: 'info' as const,
    title: 'Pending Notification',
  };

  render(
    <Notification notification={notification} onDismiss={onDismiss} />,
  );

  // Advance only 3 seconds
  act(() => {
    vi.advanceTimersByTime(3000);
  });

  expect(onDismiss).not.toHaveBeenCalled();
});

test('should render notification content', () => {
  const onDismiss = vi.fn();
  const notification = {
    id: 'test-3',
    type: 'error' as const,
    title: 'Error Title',
    message: 'Error message details',
  };

  render(
    <Notification notification={notification} onDismiss={onDismiss} />,
  );

  expect(screen.getByText('Error Title')).toBeInTheDocument();
  expect(screen.getByText('Error message details')).toBeInTheDocument();
  expect(
    screen.getByRole('alert', { name: 'Error Title' }),
  ).toBeInTheDocument();
});
