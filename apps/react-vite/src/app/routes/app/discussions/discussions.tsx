import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { LoaderFunctionArgs } from 'react-router';

import { ContentLayout } from '@/components/layouts';
import { Spinner } from '@/components/ui/spinner';
import { getInfiniteCommentsQueryOptions } from '@/features/comments/api/get-comments';
import {
  getDiscussionsQueryOptions,
  useDiscussions,
} from '@/features/discussions/api/get-discussions';
import { CreateDiscussion } from '@/features/discussions/components/create-discussion';
import { DiscussionsList } from '@/features/discussions/components/discussions-list';
import { useTeams } from '@/features/teams/api/get-teams';
import { useUser } from '@/lib/auth';

export const clientLoader =
  (queryClient: QueryClient) =>
  async ({ request }: LoaderFunctionArgs) => {
    const url = new URL(request.url);

    const page = Number(url.searchParams.get('page') || 1);
    const search = url.searchParams.get('search') || undefined;
    const filter = url.searchParams.get('filter') || undefined;

    const query = getDiscussionsQueryOptions({ page, search, filter });

    return (
      queryClient.getQueryData(query.queryKey) ??
      (await queryClient.fetchQuery(query))
    );
  };

const DiscussionsSummary = () => {
  const user = useUser();
  const discussionsQuery = useDiscussions({ page: 1 });
  const teamsQuery = useTeams();

  const totalDiscussions = discussionsQuery.data?.meta?.total;
  const userTeam = teamsQuery.data?.data?.find(
    (t) => t.id === user.data?.teamId,
  );

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold uppercase text-gray-500">
          Total Discussions
        </h3>
        {discussionsQuery.isLoading ? (
          <div className="mt-2 flex justify-center">
            <Spinner size="sm" />
          </div>
        ) : (
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {totalDiscussions ?? 0}
          </p>
        )}
      </div>
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold uppercase text-gray-500">
          Your Team
        </h3>
        {teamsQuery.isLoading ? (
          <div className="mt-2 flex justify-center">
            <Spinner size="sm" />
          </div>
        ) : (
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {userTeam?.name ?? 'No team'}
          </p>
        )}
      </div>
    </div>
  );
};

const DiscussionsRoute = () => {
  const queryClient = useQueryClient();
  return (
    <ContentLayout title="Discussions">
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div>
          <div className="flex justify-end">
            <CreateDiscussion />
          </div>
          <div className="mt-4">
            <DiscussionsList
              onDiscussionPrefetch={(id) => {
                queryClient.prefetchInfiniteQuery(
                  getInfiniteCommentsQueryOptions(id),
                );
              }}
            />
          </div>
        </div>
        <aside>
          <DiscussionsSummary />
        </aside>
      </div>
    </ContentLayout>
  );
};

export default DiscussionsRoute;
