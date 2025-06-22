import * as Contacts from 'expo-contacts';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import { ActivityIndicator, Alert, AppState, View } from 'react-native';

import { Modal, Text, useModal } from '@/components/ui';
import { background } from '@/components/ui/colors';

import { ContactsList } from './ContactsList';
import { EmptyContactsView } from './EmptyContactsView';
import { InviteResultsSummary } from './InviteResultsSummary';
import { ManualEmailView } from './ManualEmailView';
import { PermissionDeniedView } from './PermissionDeniedView';

type ViewState =
  | 'empty'
  | 'permissions-denied'
  | 'loading'
  | 'contacts'
  | 'sending'
  | 'results'
  | 'manual';

interface SelectedContacts {
  [email: string]: { name: string; selected: boolean };
}

interface InviteResults {
  successful: { name: string; email: string }[];
  failed: { name: string; email: string; reason: string }[];
}

interface BulkInviteResult {
  email: string;
  success: boolean;
  reason?: string;
}

interface ContactsImportModalProps {
  sendBulkInvites: (emails: string[]) => Promise<BulkInviteResult[]>;
  friends: any[];
  userEmail: string;
}

export interface ContactsImportModalRef {
  present: () => void;
  dismiss: () => void;
}

export const ContactsImportModal = forwardRef<
  ContactsImportModalRef,
  ContactsImportModalProps
>(({ sendBulkInvites, friends, userEmail }, ref) => {
  const modal = useModal();
  const [viewState, setViewState] = useState<ViewState>('empty');
  const [contacts, setContacts] = useState<Contacts.Contact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<SelectedContacts>(
    {}
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [inviteResults, setInviteResults] = useState<InviteResults | null>(
    null
  );
  const [manualEmail, setManualEmail] = useState('');

  // Expose methods to parent
  useImperativeHandle(
    ref,
    () => ({
      present: () => {
        modal.present();
        checkPermissionsAndLoadContacts();
      },
      dismiss: () => {
        modal.dismiss();
        // Reset state when modal closes
        setViewState('empty');
        setContacts([]);
        setSelectedContacts({});
        setSearchQuery('');
        setInviteResults(null);
        setManualEmail('');
      },
    }),
    [modal]
  );

  // Handle app state changes to re-check permissions after user returns from settings
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active' && viewState === 'permissions-denied') {
        checkPermissionsAndLoadContacts();
      }
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange
    );
    return () => subscription.remove();
  }, [viewState]);

  const checkPermissionsAndLoadContacts = async () => {
    try {
      const { status } = await Contacts.getPermissionsAsync();
      console.log('Initial permission status:', status);

      if (status === 'granted') {
        setViewState('loading');
        await loadContacts();
      } else if (status === 'undetermined') {
        // Don't automatically request permissions on modal open
        // Let the user click the button first
        setViewState('empty');
      } else {
        setViewState('permissions-denied');
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
      setViewState('empty');
    }
  };

  const requestPermissionAndLoad = async () => {
    try {
      setViewState('loading');
      const { status } = await Contacts.requestPermissionsAsync();
      console.log('Permission status after request:', status);

      if (status === 'granted') {
        await loadContacts();
      } else {
        setViewState('permissions-denied');
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert('Error', 'Failed to request contacts permission');
      setViewState('empty');
    }
  };

  const loadContacts = async () => {
    try {
      console.log('Loading contacts...');
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Emails, Contacts.Fields.Name],
      });

      console.log('Total contacts loaded:', data.length);

      // Filter contacts with email addresses
      const contactsWithEmail = data.filter(
        (contact) => contact.emails && contact.emails.length > 0
      );

      console.log('Contacts with email:', contactsWithEmail.length);

      if (contactsWithEmail.length > 0) {
        // Cross-reference with existing friends
        const friendEmails = friends.map((f) => f.email.toLowerCase());

        const processedContacts = contactsWithEmail.map((contact) => ({
          ...contact,
          isFriend:
            contact.emails?.some((email) =>
              friendEmails.includes(email.email?.toLowerCase() || '')
            ) || false,
        }));

        setContacts(processedContacts);
        setViewState('contacts');
        console.log('View state set to contacts');
      } else {
        console.log('No contacts with email addresses found');
        Alert.alert(
          'No Contacts Found',
          'No contacts with email addresses were found on your device.'
        );
        setViewState('empty');
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
      Alert.alert('Error', 'Failed to load contacts');
      setViewState('empty');
    }
  };

  const handleContactSelect = (contact: Contacts.Contact) => {
    if (contact.emails && contact.emails[0]) {
      const email = contact.emails[0].email!;
      const name = contact.name || email;

      setSelectedContacts((prev) => ({
        ...prev,
        [email]: {
          name,
          selected: !prev[email]?.selected,
        },
      }));
    }
  };

  const getSelectedCount = () => {
    return Object.values(selectedContacts).filter((c) => c.selected).length;
  };

  const handleSendInvites = async () => {
    const selectedEmails = Object.entries(selectedContacts)
      .filter(([_, value]) => value.selected)
      .map(([email, value]) => ({ email, name: value.name }));

    if (selectedEmails.length === 0) return;

    setViewState('sending');

    try {
      const results = await sendBulkInvites(selectedEmails.map((c) => c.email));

      // Process results
      const successful: InviteResults['successful'] = [];
      const failed: InviteResults['failed'] = [];

      selectedEmails.forEach((contact, index) => {
        const result = results[index];
        if (result.success) {
          successful.push(contact);
        } else {
          failed.push({
            ...contact,
            reason: result.reason || 'Unknown error',
          });
        }
      });

      setInviteResults({ successful, failed });
      setViewState('results');
    } catch (error) {
      console.error('Error sending invites:', error);
      Alert.alert('Error', 'Failed to send invites');
      setViewState('contacts');
    }
  };

  const handleManualInvite = async () => {
    if (!manualEmail.trim()) return;

    setViewState('sending');

    try {
      const results = await sendBulkInvites([manualEmail]);
      const result = results[0];

      if (result.success) {
        setInviteResults({
          successful: [{ email: manualEmail, name: manualEmail }],
          failed: [],
        });
      } else {
        setInviteResults({
          successful: [],
          failed: [
            {
              email: manualEmail,
              name: manualEmail,
              reason: result.reason || 'Unknown error',
            },
          ],
        });
      }

      setViewState('results');
    } catch (error) {
      console.error('Error sending invite:', error);
      Alert.alert('Error', 'Failed to send invite');
      setViewState('manual');
    }
  };

  const handleDone = () => {
    modal.dismiss();
    // Reset state when modal closes
    setViewState('empty');
    setContacts([]);
    setSelectedContacts({});
    setSearchQuery('');
    setInviteResults(null);
    setManualEmail('');
  };

  const renderContent = () => {
    switch (viewState) {
      case 'empty':
        return (
          <EmptyContactsView
            onImportContacts={requestPermissionAndLoad}
            onManualAdd={() => setViewState('manual')}
          />
        );

      case 'permissions-denied':
        return (
          <PermissionDeniedView
            onEnablePermissions={requestPermissionAndLoad}
            onManualAdd={() => setViewState('manual')}
          />
        );

      case 'contacts':
        return (
          <ContactsList
            contacts={contacts}
            selectedContacts={selectedContacts}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onContactSelect={handleContactSelect}
            onInvite={handleSendInvites}
            selectedCount={getSelectedCount()}
          />
        );

      case 'results':
        return inviteResults ? (
          <InviteResultsSummary results={inviteResults} onDone={handleDone} />
        ) : null;

      case 'manual':
        return (
          <ManualEmailView
            email={manualEmail}
            onEmailChange={setManualEmail}
            onSubmit={handleManualInvite}
            onBack={() => setViewState('empty')}
            isSubmitting={viewState === 'sending'}
          />
        );

      case 'loading':
        return (
          <View className="flex-1 items-center justify-center p-6">
            <ActivityIndicator size="large" color="#2E948D" />
            <Text className="mt-4 text-lg text-neutral-500">
              Loading contacts...
            </Text>
          </View>
        );

      case 'sending':
        return (
          <View className="flex-1 items-center justify-center p-6">
            <ActivityIndicator size="large" color="#2E948D" />
            <Text className="mt-4 text-lg text-neutral-500">
              Sending invitations...
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      ref={modal.ref}
      title={viewState === 'results' ? 'Invites Sent!' : 'Invite Friends'}
      snapPoints={['90%']}
      backgroundStyle={{ backgroundColor: background }}
      handleIndicatorStyle={{ backgroundColor: '#9E8E7F' }}
    >
      <View className="flex-1 rounded-t-2xl bg-background">
        {renderContent()}
      </View>
    </Modal>
  );
});
