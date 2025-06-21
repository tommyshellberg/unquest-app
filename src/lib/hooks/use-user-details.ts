import { useQuery, useQueryClient } from '@tanstack/react-query';

import { getUserDetails } from '@/lib/services/user';

export const USER_DETAILS_QUERY_KEY = ['user', 'details'] as const;

export function useUserDetails() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: USER_DETAILS_QUERY_KEY,
    queryFn: getUserDetails,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const invalidate = () => {
    return queryClient.invalidateQueries({ queryKey: USER_DETAILS_QUERY_KEY });
  };

  const refetch = () => {
    return query.refetch();
  };

  return {
    ...query,
    invalidate,
    refetch,
    user: query.data,
  };
}