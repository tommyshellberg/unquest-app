import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  CheckCircle,
  ChevronRight,
  Info,
  Lock,
  PlusCircle,
  UserPlus,
  Users,
} from 'lucide-react-native';
import { usePostHog } from 'posthog-react-native';
import React, { useRef } from 'react';
import { ActivityIndicator } from 'react-native';

import {
  ContactsImportModal,
  type ContactsImportModalRef,
} from '@/components/profile/contact-import';
import {
  Card,
  FocusAwareStatusBar,
  SafeAreaView,
  ScreenContainer,
  ScreenHeader,
  Text,
  TouchableOpacity,
  View,
} from '@/components/ui';
import { PremiumPaywall } from '@/components/paywall';
import { useAuth } from '@/lib';
import { useFriendManagement } from '@/lib/hooks/use-friend-management';
import { usePremiumAccess } from '@/lib/hooks/use-premium-access';
import { getUserFriends } from '@/lib/services/user';
import { useUserStore } from '@/store/user-store';
import { useLazyWebSocket } from '@/components/providers/lazy-websocket-provider';

interface MenuOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
  color: string;
}

const menuOptions: MenuOption[] = [
  {
    id: 'create',
    title: 'Create Quest',
    description: 'Start a new cooperative quest and invite friends',
    icon: <PlusCircle size={32} color="#FFFFFF" />,
    route: '/create-cooperative-quest',
    color: 'bg-primary-400',
  },
  {
    id: 'join',
    title: 'Join Quest',
    description: 'View and respond to quest invitations from friends',
    icon: <Users size={32} color="#FFFFFF" />,
    route: '/join-cooperative-quest',
    color: 'bg-secondary-400',
  },
  {
    id: 'friends',
    title: 'Add Friends',
    description: 'Connect with friends to quest together',
    icon: <UserPlus size={32} color="#FFFFFF" />,
    route: '', // We'll handle this with modal instead
    color: 'bg-muted-300',
  },
];

export default function CooperativeQuestMenu() {
  const router = useRouter();
  const posthog = usePostHog();
  const contactsModalRef = useRef<ContactsImportModalRef>(null);
  const currentUser = useAuth((state) => state.user);
  const userEmail = currentUser?.email || '';
  const user = useUserStore((state) => state.user);
  const { connect: connectWebSocket } = useLazyWebSocket();
  const [showPaywallModal, setShowPaywallModal] = React.useState(false);

  // Connect WebSocket when entering cooperative quest flow
  React.useEffect(() => {
    connectWebSocket();
  }, [connectWebSocket]);

  // Check if user has friends
  const { data: friendsData, isLoading } = useQuery({
    queryKey: ['friends'],
    queryFn: () => getUserFriends(1),
  });

  const hasFriends = friendsData?.friends && friendsData.friends.length > 0;

  // Premium access check
  const {
    hasPremiumAccess,
    isLoading: isPremiumLoading,
    showPaywall,
    handlePaywallClose,
    handlePaywallSuccess,
  } = usePremiumAccess();

  // Friend management hook for bulk invites
  const { sendBulkInvites } = useFriendManagement(userEmail, contactsModalRef);

  const handleOptionPress = (option: MenuOption) => {
    if (option.id === 'friends') {
      contactsModalRef.current?.present();
    } else if (option.route) {
      if (option.id === 'create') {
        posthog.capture('cooperative_quest_create_clicked');
      } else if (option.id === 'join') {
        posthog.capture('cooperative_quest_join_clicked');
      }
      router.push(option.route as any);
    }
  };

  // Add debug logging
  React.useEffect(() => {
    console.log('[CooperativeQuestMenu] Premium status:', {
      hasPremiumAccess,
      isPremiumLoading,
      showPaywallModal,
    });
  }, [hasPremiumAccess, isPremiumLoading, showPaywallModal]);

  // Show loading state while checking friends or premium status
  if (isLoading || isPremiumLoading) {
    return (
      <SafeAreaView className="flex-1 bg-neutral-100">
        <FocusAwareStatusBar />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
          <Text className="mt-4 text-neutral-600">Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Check if user has premium access
  if (!hasPremiumAccess) {
    return (
      <SafeAreaView className="flex-1 bg-neutral-100">
        <FocusAwareStatusBar />

        <ScreenContainer className="px-4">
          {/* Header */}
          <ScreenHeader
            title="Cooperative Quests"
            subtitle="Team up with friends to complete quests together!"
            showBackButton
          />

          {/* Premium Feature Message */}
          <View className="flex-1 items-center justify-center px-4">
            <View className="mb-6 rounded-full bg-primary-100 p-6">
              <Lock size={64} color="#77c5bf" />
            </View>

            <Text className="mb-4 text-center text-2xl font-bold">
              Join the unQuest Circle
            </Text>

            <Text className="mb-6 text-center text-neutral-600">
              Cooperative quests are a premium feature available exclusively to
              unQuest Circle members.
            </Text>

            <Card className="bg-primary-50 p-6">
              <Text className="mb-4 text-center text-lg font-semibold">
                What's included:
              </Text>
              <View className="gap-3">
                <View className="flex-row items-start">
                  <CheckCircle
                    size={20}
                    color="#77c5bf"
                    style={{ marginTop: 2 }}
                  />
                  <Text className="ml-2 flex-1 text-neutral-700">
                    Create and join unlimited cooperative quests
                  </Text>
                </View>
                <View className="flex-row items-start">
                  <CheckCircle
                    size={20}
                    color="#77c5bf"
                    style={{ marginTop: 2 }}
                  />
                  <Text className="ml-2 flex-1 text-neutral-700">
                    Quest with multiple friends simultaneously
                  </Text>
                </View>
                <View className="flex-row items-start">
                  <CheckCircle
                    size={20}
                    color="#77c5bf"
                    style={{ marginTop: 2 }}
                  />
                  <Text className="ml-2 flex-1 text-neutral-700">
                    Access to exclusive quest types and rewards
                  </Text>
                </View>
              </View>
            </Card>

            <TouchableOpacity
              onPress={() => setShowPaywallModal(true)}
              className="mt-6 rounded-lg bg-primary-500 px-6 py-3"
            >
              <Text className="text-center text-lg font-semibold text-white">
                View Subscription Options
              </Text>
            </TouchableOpacity>
          </View>
        </ScreenContainer>

        {/* Premium Paywall Modal */}
        <PremiumPaywall
          isVisible={showPaywallModal}
          onClose={() => setShowPaywallModal(false)}
          onSuccess={() => {
            setShowPaywallModal(false);
            handlePaywallSuccess();
          }}
          featureName="Cooperative Quests"
        />
      </SafeAreaView>
    );
  }

  // If user has no friends, show only the Add Friends option
  if (!hasFriends) {
    return (
      <SafeAreaView className="flex-1 bg-neutral-100">
        <FocusAwareStatusBar />

        <ScreenContainer className="px-4">
          {/* Header */}
          <View className="mb-6 mt-2">
            <TouchableOpacity
              onPress={() => router.back()}
              className="mb-4 flex-row items-center"
            >
              <ArrowLeft size={24} color="#333" />
              <Text className="ml-2 text-lg">Back</Text>
            </TouchableOpacity>

            <Text className="mb-2 text-3xl font-bold">Cooperative Quests</Text>
            <Text className="text-neutral-600">
              Team up with friends to complete quests together!
            </Text>
          </View>

          {/* No Friends Message */}
          <View className="mb-6 items-center py-8">
            <Users size={64} color="#999" />
            <Text className="mt-4 text-center text-lg font-semibold">
              Add Friends to Get Started
            </Text>
            <Text className="mt-2 px-8 text-center text-neutral-600">
              Cooperative quests require friends to play with. Add some friends
              first to start creating and joining quests together!
            </Text>
          </View>

          {/* Add Friends Card */}
          <TouchableOpacity
            onPress={() => contactsModalRef.current?.present()}
            activeOpacity={0.8}
          >
            <Card className="bg-muted-300 p-6 shadow-md">
              <View className="flex-row items-center">
                <View className="mr-4 rounded-full bg-white/20 p-3">
                  <UserPlus size={32} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="mb-1 text-xl font-bold text-white">
                    Add Friends
                  </Text>
                  <Text className="text-sm text-white/80">
                    Connect with friends to quest together
                  </Text>
                </View>
                <ChevronRight size={24} color="white" />
              </View>
            </Card>
          </TouchableOpacity>

          {/* Info Section */}
          <View className="mt-auto">
            <Card className="mb-4 bg-neutral-200 p-4">
              <View className="flex-row items-start">
                <Info size={20} color="#666" style={{ marginTop: 2 }} />
                <View className="ml-3 flex-1">
                  <Text className="mb-1 font-semibold">How it works</Text>
                  <Text className="text-sm text-neutral-600">
                    In cooperative quests, all participants must keep their
                    phones locked for the entire duration.{'\n'}
                    If anyone unlocks early, everyone fails together!
                  </Text>
                </View>
              </View>
            </Card>
          </View>
        </ScreenContainer>

        {/* Contacts Import Modal */}
        <ContactsImportModal
          ref={contactsModalRef}
          sendBulkInvites={sendBulkInvites}
          friends={friendsData?.friends || []}
          userEmail={userEmail}
        />
      </SafeAreaView>
    );
  }

  // If user has friends, show all options
  return (
    <SafeAreaView className="flex-1 bg-neutral-100">
      <FocusAwareStatusBar />

      <View className="flex-1 px-4">
        {/* Header */}
        <View className="mb-6 mt-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mb-4 flex-row items-center"
          >
            <ArrowLeft size={24} color="#333" />
            <Text className="ml-2 text-lg">Back</Text>
          </TouchableOpacity>

          <Text className="mb-2 text-3xl font-bold">Cooperative Quests</Text>
          <Text className="text-neutral-600">
            Team up with friends to complete quests together. Everyone must keep
            their phones locked to succeed!
          </Text>
        </View>

        {/* Menu Options */}
        <View className="flex-1 gap-4">
          {menuOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              onPress={() => handleOptionPress(option)}
              activeOpacity={0.8}
            >
              <Card className={`p-6 ${option.color} shadow-md`}>
                <View className="flex-row items-center">
                  <View className="mr-4 rounded-full bg-white/20 p-3">
                    {option.icon}
                  </View>
                  <View className="flex-1">
                    <Text className="mb-1 text-xl font-bold text-white">
                      {option.title}
                    </Text>
                    <Text className="text-sm text-white/80">
                      {option.description}
                    </Text>
                  </View>
                  <ChevronRight size={24} color="white" />
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Section */}
        <Card className="mb-4 bg-neutral-200 p-4">
          <View className="flex-row items-start">
            <Info size={20} color="#666" style={{ marginTop: 2 }} />
            <View className="ml-3 flex-1">
              <Text className="mb-1 font-semibold">How it works</Text>
              <Text className="text-sm text-neutral-600">
                In cooperative quests, all participants must keep their phones
                locked for the entire duration.{'\n'}
                If anyone unlocks early, everyone fails together!
              </Text>
            </View>
          </View>
        </Card>
      </View>

      {/* Contacts Import Modal */}
      <ContactsImportModal
        ref={contactsModalRef}
        sendBulkInvites={sendBulkInvites}
        friends={friendsData?.friends || []}
        userEmail={userEmail}
      />
    </SafeAreaView>
  );
}
