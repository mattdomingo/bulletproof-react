import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';
import { Discussion, Meta } from '@/types/api';

export const getDiscussions = ({
  page = 1,
  search,
  filter,
}: {
  page?: number;
  search?: string;
  filter?: string;
} = {}): Promise<{
  data: Discussion[];
  meta: Meta;
}> => {
  return api.get(`/discussions`, {
    params: {
      page,
      ...(search ? { search } : {}),
      ...(filter && filter !== 'all' ? { filter } : {}),
    },
  });
};

export const getDiscussionsQueryOptions = ({
  page,
  search,
  filter,
}: { page?: number; search?: string; filter?: string } = {}) => {
  return queryOptions({
    queryKey: ['discussions', { page, search, filter }],
    queryFn: () => getDiscussions({ page, search, filter }),
  });
};

type UseDiscussionsOptions = {
  page?: number;
  search?: string;
  filter?: string;
  queryConfig?: QueryConfig<typeof getDiscussionsQueryOptions>;
};

export const useDiscussions = ({
  queryConfig,
  page,
  search,
  filter,
}: UseDiscussionsOptions) => {
  return useQuery({
    ...getDiscussionsQueryOptions({ page, search, filter }),
    ...queryConfig,
  });
};
