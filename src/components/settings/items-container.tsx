import React from 'react';

import { Text, View } from '@/components/ui';
import type { TxKeyPath } from '@/lib';

type Props = {
  children: React.ReactNode;
  title?: TxKeyPath;
};

export const ItemsContainer = ({ children, title }: Props) => {
  return (
    <>
      {title && <Text className="pb-2 pt-4 text-lg" tx={title} />}
      {
        <View className=" rounded-md border border-neutral-200 dark:border-neutral-200">
          {children}
        </View>
      }
    </>
  );
};
