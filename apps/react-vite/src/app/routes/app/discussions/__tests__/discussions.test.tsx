import type { Mock } from 'vitest';

import { createDiscussion } from '@/testing/data-generators';
import { DiscussionsList } from '@/features/discussions/components/discussions-list';
import {
  renderApp,
  screen,
  userEvent,
  createUser as createPersistedUser,
  createDiscussion as createPersistedDiscussion,
  waitFor,
  within,
} from '@/testing/test-utils';
import { formatDate } from '@/utils/format';

import { default as DiscussionsRoute } from '../discussions';

beforeAll(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  (console.error as Mock).mockRestore();
});

test(
  'should create, render and delete discussions',
  { timeout: 10000 },
  async () => {
    await renderApp(<DiscussionsRoute />);

    const newDiscussion = createDiscussion();

    expect(await screen.findByText(/no entries/i)).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: /create discussion/i }),
    );

    const drawer = await screen.findByRole('dialog', {
      name: /create discussion/i,
    });

    const titleField = within(drawer).getByText(/title/i);
    const bodyField = within(drawer).getByText(/body/i);

    await userEvent.type(titleField, newDiscussion.title);
    await userEvent.type(bodyField, newDiscussion.body);

    const submitButton = within(drawer).getByRole('button', {
      name: /submit/i,
    });

    await userEvent.click(submitButton);

    await waitFor(() => expect(drawer).not.toBeInTheDocument());

    const row = await screen.findByRole(
      'row',
      {
        name: `${newDiscussion.title} ${formatDate(newDiscussion.createdAt)} View Delete Discussion`,
      },
      { timeout: 5000 },
    );

    expect(
      within(row).getByRole('cell', {
        name: newDiscussion.title,
      }),
    ).toBeInTheDocument();

    await userEvent.click(
      within(row).getByRole('button', {
        name: /delete discussion/i,
      }),
    );

    const confirmationDialog = await screen.findByRole('dialog', {
      name: /delete discussion/i,
    });

    const confirmationDeleteButton = within(confirmationDialog).getByRole(
      'button',
      {
        name: /delete discussion/i,
      },
    );

    await userEvent.click(confirmationDeleteButton);

    await screen.findByText(/discussion deleted/i);

    expect(
      within(row).queryByRole('cell', {
        name: newDiscussion.title,
      }),
    ).not.toBeInTheDocument();
  },
);

test(
  'should filter discussions by search param via backend',
  { timeout: 10000 },
  async () => {
    const fakeUser = await createPersistedUser();
    await createPersistedDiscussion({
      teamId: fakeUser.teamId,
      authorId: fakeUser.id,
      title: 'Alpha topic',
    });
    await createPersistedDiscussion({
      teamId: fakeUser.teamId,
      authorId: fakeUser.id,
      title: 'Beta subject',
    });

    // The search param is passed to the backend via the API
    await renderApp(<DiscussionsList />, {
      user: fakeUser,
      url: '/?search=Alpha',
      path: '/',
    });

    // Backend returns only matching discussions
    await waitFor(() => {
      expect(screen.getByText('Alpha topic')).toBeInTheDocument();
    });

    // Non-matching discussion is excluded by the backend, not by client-side filtering
    expect(screen.queryByText('Beta subject')).not.toBeInTheDocument();
  },
);

test(
  'should show all discussions when no search param',
  { timeout: 10000 },
  async () => {
    const fakeUser = await createPersistedUser();
    await createPersistedDiscussion({
      teamId: fakeUser.teamId,
      authorId: fakeUser.id,
      title: 'First discussion',
    });
    await createPersistedDiscussion({
      teamId: fakeUser.teamId,
      authorId: fakeUser.id,
      title: 'Second discussion',
    });

    await renderApp(<DiscussionsList />, {
      user: fakeUser,
      url: '/',
      path: '/',
    });

    await waitFor(() => {
      expect(screen.getByText('First discussion')).toBeInTheDocument();
      expect(screen.getByText('Second discussion')).toBeInTheDocument();
    });
  },
);

test(
  'should filter to show only user discussions with my filter via backend',
  { timeout: 10000 },
  async () => {
    const fakeUser = await createPersistedUser();
    const otherUser = await createPersistedUser({ teamId: fakeUser.teamId });

    await createPersistedDiscussion({
      teamId: fakeUser.teamId,
      authorId: fakeUser.id,
      title: 'My own discussion',
    });
    await createPersistedDiscussion({
      teamId: fakeUser.teamId,
      authorId: otherUser.id,
      title: 'Other user discussion',
    });

    // The filter=my param is sent to the backend
    await renderApp(<DiscussionsList />, {
      user: fakeUser,
      url: '/?filter=my',
      path: '/',
    });

    await waitFor(() => {
      expect(screen.getByText('My own discussion')).toBeInTheDocument();
    });

    // Backend excludes discussions by other authors
    expect(
      screen.queryByText('Other user discussion'),
    ).not.toBeInTheDocument();
  },
);

test(
  'should render two-column layout on discussions page',
  { timeout: 10000 },
  async () => {
    const fakeUser = await createPersistedUser();

    await renderApp(<DiscussionsRoute />, {
      user: fakeUser,
      url: '/app/discussions',
      path: '/app/discussions',
    });

    // Should render the summary sidebar with Total Discussions and Your Team
    expect(
      await screen.findByText('Total Discussions'),
    ).toBeInTheDocument();
    expect(await screen.findByText('Your Team')).toBeInTheDocument();
  },
);
