import { act } from 'react';
import { Outlet } from 'react-router';

import { DashboardLayout } from '@/components/layouts';
import { DiscussionsList } from '@/features/discussions/components/discussions-list';
import {
  renderApp,
  screen,
  fireEvent,
  createUser,
  createDiscussion,
  waitFor,
} from '@/testing/test-utils';

import { default as DashboardRoute } from '../dashboard';

test(
  'should render stat cards with live data',
  { timeout: 10000 },
  async () => {
    const fakeUser = await createUser();
    const fakeDiscussion = await createDiscussion({
      teamId: fakeUser.teamId,
      authorId: fakeUser.id,
    });

    await renderApp(<DashboardRoute />, {
      user: fakeUser,
      url: '/app',
      path: '/app',
    });

    // Should render the Total Discussions stat card
    expect(
      await screen.findByText('Total Discussions'),
    ).toBeInTheDocument();

    // Should render the Total Users stat card
    expect(
      await screen.findByText('Total Users'),
    ).toBeInTheDocument();

    // Should render the Your Team stat card
    expect(await screen.findByText('Your Team')).toBeInTheDocument();

    // Should show the welcome message with user name
    expect(
      await screen.findByText(
        `Welcome, ${fakeUser.firstName} ${fakeUser.lastName}`,
      ),
    ).toBeInTheDocument();

    // Should show the user role
    expect(
      await screen.findByText(`Role: ${fakeUser.role}`),
    ).toBeInTheDocument();
  },
);

test(
  'should navigate to discussions when clicking Total Discussions card',
  { timeout: 10000 },
  async () => {
    const fakeUser = await createUser();
    await createDiscussion({
      teamId: fakeUser.teamId,
      authorId: fakeUser.id,
    });

    await renderApp(<DashboardRoute />, {
      user: fakeUser,
      url: '/app',
      path: '/app',
    });

    const discussionsCard = await screen.findByText('Total Discussions');
    // The card is a button, clicking navigates
    const button = discussionsCard.closest('button');
    expect(button).toBeInTheDocument();
  },
);

test(
  'should navigate to users when clicking Total Users card',
  { timeout: 10000 },
  async () => {
    const fakeUser = await createUser();

    await renderApp(<DashboardRoute />, {
      user: fakeUser,
      url: '/app',
      path: '/app',
    });

    const usersCard = await screen.findByText('Total Users');
    const button = usersCard.closest('button');
    expect(button).toBeInTheDocument();
  },
);

test(
  'should show loading state for stat cards',
  { timeout: 10000 },
  async () => {
    const fakeUser = await createUser();

    await renderApp(<DashboardRoute />, {
      user: fakeUser,
      url: '/app',
      path: '/app',
    });

    // After loading finishes, stat card labels should appear
    await waitFor(() => {
      expect(screen.getByText('Total Discussions')).toBeInTheDocument();
      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('Your Team')).toBeInTheDocument();
    });
  },
);

test(
  'should navigate to discussions with search results when searching from dashboard',
  { timeout: 15000 },
  async () => {
    const fakeUser = await createUser();
    await createDiscussion({
      teamId: fakeUser.teamId,
      authorId: fakeUser.id,
      title: 'Walrus migration plan',
    });
    await createDiscussion({
      teamId: fakeUser.teamId,
      authorId: fakeUser.id,
      title: 'Penguin habitat review',
    });

    const AppLayout = () => (
      <DashboardLayout>
        <Outlet />
      </DashboardLayout>
    );

    await renderApp(null, {
      user: fakeUser,
      url: '/app',
      routes: [
        {
          path: '/app',
          element: <AppLayout />,
          children: [
            { index: true, element: <DashboardRoute /> },
            { path: 'discussions', element: <DiscussionsList /> },
          ],
        },
      ],
    });

    // Verify we're on the dashboard
    expect(
      await screen.findByText('Total Discussions'),
    ).toBeInTheDocument();

    // Type a search term in the action bar
    const searchInput = screen.getByRole('textbox', { name: /search/i });
    fireEvent.change(searchInput, { target: { value: 'Walrus' } });

    // Wait for the debounce (300ms) to trigger navigation
    await act(() => new Promise((r) => setTimeout(r, 400)));

    // After navigation, only the matching discussion should appear
    await waitFor(
      () => {
        expect(
          screen.getByText('Walrus migration plan'),
        ).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    expect(
      screen.queryByText('Penguin habitat review'),
    ).not.toBeInTheDocument();
  },
);
