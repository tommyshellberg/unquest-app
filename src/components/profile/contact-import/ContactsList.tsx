import type * as Contacts from 'expo-contacts';
import React, { useMemo } from 'react';
import { SectionList, type SectionListData, View } from 'react-native';

import { Button, Text } from '@/components/ui';

import { ContactItem } from './ContactItem';
import { ContactSearchBar } from './ContactSearchBar';

interface ContactsListProps {
  contacts: (Contacts.Contact & { isFriend?: boolean })[];
  selectedContacts: { [email: string]: { name: string; selected: boolean } };
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onContactSelect: (contact: Contacts.Contact) => void;
  onInvite: () => void;
  onManualAdd: () => void;
  selectedCount: number;
}

interface ContactSection {
  title: string;
  data: (Contacts.Contact & { isFriend?: boolean })[];
}

export const ContactsList: React.FC<ContactsListProps> = ({
  contacts,
  selectedContacts,
  searchQuery,
  onSearchChange,
  onContactSelect,
  onInvite,
  onManualAdd,
  selectedCount,
}) => {
  const filteredAndGroupedContacts = useMemo(() => {
    // Filter contacts based on search query
    const filtered = contacts.filter((contact) => {
      const name = contact.name?.toLowerCase() || '';
      const query = searchQuery.toLowerCase();
      return name.includes(query);
    });

    // Sort contacts alphabetically
    const sorted = filtered.sort((a, b) => {
      const nameA = a.name || '';
      const nameB = b.name || '';
      return nameA.localeCompare(nameB);
    });

    // Group by first letter
    const grouped: {
      [key: string]: (Contacts.Contact & { isFriend?: boolean })[];
    } = {};

    sorted.forEach((contact) => {
      const firstLetter = (contact.name || '#')[0].toUpperCase();
      const key = /[A-Z]/.test(firstLetter) ? firstLetter : '#';

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(contact);
    });

    // Convert to sections array
    const sections: ContactSection[] = Object.keys(grouped)
      .sort()
      .map((letter) => ({
        title: letter,
        data: grouped[letter],
      }));

    return sections;
  }, [contacts, searchQuery]);

  const isContactSelected = (contact: Contacts.Contact) => {
    if (!contact.emails || contact.emails.length === 0) return false;
    const email = contact.emails[0].email!;
    return selectedContacts[email]?.selected || false;
  };

  const renderSectionHeader = ({
    section,
  }: {
    section: SectionListData<
      Contacts.Contact & { isFriend?: boolean },
      ContactSection
    >;
  }) => (
    <View className="border-b border-neutral-300 bg-background px-4 py-2">
      <Text className="text-sm font-semibold text-neutral-200">
        {section.title}
      </Text>
    </View>
  );

  const renderItem = ({
    item,
  }: {
    item: Contacts.Contact & { isFriend?: boolean };
  }) => (
    <ContactItem
      contact={item}
      isSelected={isContactSelected(item)}
      isFriend={item.isFriend || false}
      onPress={() => !item.isFriend && onContactSelect(item)}
    />
  );

  const keyExtractor = (item: Contacts.Contact) => item.id || '';

  return (
    <View className="flex-1">
      <ContactSearchBar value={searchQuery} onChangeText={onSearchChange} />

      <SectionList
        sections={filteredAndGroupedContacts}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={keyExtractor}
        ItemSeparatorComponent={() => <View className="h-px bg-neutral-200" />}
        contentContainerStyle={{ paddingBottom: 100 }}
        stickySectionHeadersEnabled
        className="bg-background"
      />

      <View className="absolute inset-x-0 bottom-0 border-t border-neutral-200 bg-background p-4">
        <Button
          label={
            selectedCount > 0
              ? `INVITE ${selectedCount} CONTACT${selectedCount > 1 ? 'S' : ''}`
              : 'SELECT CONTACTS'
          }
          onPress={onInvite}
          disabled={selectedCount === 0}
          className="mb-2 w-full"
        />
        <Button
          label="ADD MANUAL CONTACT"
          onPress={onManualAdd}
          variant="ghost"
          className="w-full"
        />
      </View>
    </View>
  );
};
