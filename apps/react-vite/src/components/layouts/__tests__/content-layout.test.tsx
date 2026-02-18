import { renderApp, screen } from '@/testing/test-utils';

import { ContentLayout } from '../content-layout';

test('should render breadcrumbs for nested routes', async () => {
  await renderApp(
    <ContentLayout title="Discussions">
      <div>content</div>
    </ContentLayout>,
    {
      url: '/app/discussions',
      path: '/app/discussions',
    },
  );

  const breadcrumbNav = screen.getByRole('navigation', {
    name: /breadcrumb/i,
  });
  expect(breadcrumbNav).toBeInTheDocument();

  // Should show "App" as a link
  expect(screen.getByText('App')).toBeInTheDocument();

  // Should show "Discussions" as the last breadcrumb (not a link)
  const lastCrumb = screen.getByText('Discussions', {
    selector: 'span',
  });
  expect(lastCrumb).toBeInTheDocument();
});

test('should use page title in last breadcrumb segment instead of URL param', async () => {
  await renderApp(
    <ContentLayout title="My Custom Title">
      <div>content</div>
    </ContentLayout>,
    {
      url: '/app/discussions/abc-123',
      path: '/app/discussions/:discussionId',
    },
  );

  const breadcrumbNav = screen.getByRole('navigation', {
    name: /breadcrumb/i,
  });
  expect(breadcrumbNav).toBeInTheDocument();

  // The last segment should use the page title, not the raw param
  expect(
    screen.getByText('My Custom Title', { selector: 'span' }),
  ).toBeInTheDocument();

  // Should NOT show the raw ID
  expect(screen.queryByText('abc-123')).not.toBeInTheDocument();
});

test('should not render breadcrumbs for single-segment routes', async () => {
  await renderApp(
    <ContentLayout title="Home">
      <div>content</div>
    </ContentLayout>,
    {
      url: '/app',
      path: '/app',
    },
  );

  const breadcrumbNav = screen.queryByRole('navigation', {
    name: /breadcrumb/i,
  });
  expect(breadcrumbNav).not.toBeInTheDocument();
});

test('should render page title heading', async () => {
  await renderApp(
    <ContentLayout title="Test Page">
      <div>child content</div>
    </ContentLayout>,
    {
      url: '/app/test',
      path: '/app/test',
    },
  );

  expect(
    screen.getByRole('heading', { name: 'Test Page' }),
  ).toBeInTheDocument();
  expect(screen.getByText('child content')).toBeInTheDocument();
});
