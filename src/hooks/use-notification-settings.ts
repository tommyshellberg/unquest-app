import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  getNotificationSettings,
  type NotificationSettings,
  updateNotificationSettings,
} from '@/api/notification-settings';

export const useNotificationSettings = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['notification-settings'],
    queryFn: getNotificationSettings,
  });

  const updateMutation = useMutation({
    mutationFn: updateNotificationSettings,
    onSuccess: (newData) => {
      queryClient.setQueryData(['notification-settings'], newData);
    },
  });

  return {
    settings: data,
    isLoading,
    error,
    updateSettings: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
};
