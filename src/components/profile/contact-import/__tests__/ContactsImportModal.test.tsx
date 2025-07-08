import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import * as Contacts from 'expo-contacts';
import {
  ContactsImportModal,
  ContactsImportModalRef,
} from '../ContactsImportModal';

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock expo-contacts
jest.mock('expo-contacts', () => ({
  requestPermissionsAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
  getContactsAsync: jest.fn(),
  Fields: {
    Emails: 'emails',
    Name: 'name',
  },
}));

// Mock the modal component
jest.mock('@/components/ui', () => ({
  ...jest.requireActual('@/components/ui'),
  Modal: ({ children, title }: any) => (
    <div testID="modal">
      <div>{title}</div>
      {children}
    </div>
  ),
  useModal: () => ({
    ref: { current: null },
    present: jest.fn(),
    dismiss: jest.fn(),
  }),
}));

describe('ContactsImportModal', () => {
  const mockSendBulkInvites = jest.fn();
  const mockFriends = [
    { _id: '1', email: 'friend1@example.com' },
    { _id: '2', email: 'friend2@example.com' },
  ];
  const userEmail = 'user@example.com';

  beforeEach(() => {
    jest.clearAllMocks();
    (Contacts.getPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'undetermined',
    });
    mockSendBulkInvites.mockClear();
  });

  describe('Bulk Invite Scenarios', () => {
    const mockContacts = [
      {
        id: '1',
        name: 'John Doe',
        emails: [{ email: 'john@example.com', id: '1', label: 'work' }],
      },
      {
        id: '2',
        name: 'Jane Smith',
        emails: [{ email: 'jane@example.com', id: '2', label: 'personal' }],
      },
      {
        id: '3',
        name: 'Bob Wilson',
        emails: [{ email: 'bob@example.com', id: '3', label: 'work' }],
      },
    ];

    beforeEach(() => {
      (Contacts.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (Contacts.getContactsAsync as jest.Mock).mockResolvedValue({
        data: mockContacts,
      });
    });

    it('should handle multiple contacts, all successful', async () => {
      mockSendBulkInvites.mockResolvedValueOnce([
        { email: 'john@example.com', success: true },
        { email: 'jane@example.com', success: true },
        { email: 'bob@example.com', success: true },
      ]);

      const ref = React.createRef<ContactsImportModalRef>();
      const { getByText, getAllByTestId, getByTestId } = render(
        <ContactsImportModal
          ref={ref}
          sendBulkInvites={mockSendBulkInvites}
          friends={mockFriends}
          userEmail={userEmail}
        />
      );

      // Present modal and wait for contacts to load
      await waitFor(() => {
        ref.current?.present();
      });

      // Wait for contacts to be displayed
      await waitFor(() => {
        expect(getByText(/john doe/i)).toBeTruthy();
        expect(getByText(/jane smith/i)).toBeTruthy();
        expect(getByText(/bob wilson/i)).toBeTruthy();
      });

      // Select all contacts
      const contactItems = getAllByTestId(/contact-item-/);
      contactItems.forEach((item) => fireEvent.press(item));

      // Press invite button
      const inviteButton = getByText(/invite 3 contacts/i);
      fireEvent.press(inviteButton);

      // Wait for results
      await waitFor(() => {
        expect(getByText(/all invitations sent successfully!/i)).toBeTruthy();
        expect(getByText(/3 successful/i)).toBeTruthy();
        expect(getByText(/successfully invited/i)).toBeTruthy();
      });

      expect(mockSendBulkInvites).toHaveBeenCalled();
      const calledEmails = mockSendBulkInvites.mock.calls[0][0];
      expect(calledEmails.sort()).toEqual([
        'bob@example.com',
        'jane@example.com',
        'john@example.com',
      ]);
    });

    it('should handle multiple contacts, mixed success/failure', async () => {
      mockSendBulkInvites.mockResolvedValueOnce([
        { email: 'john@example.com', success: true },
        {
          email: 'jane@example.com',
          success: false,
          reason: 'Email already taken',
        },
        { email: 'bob@example.com', success: true },
      ]);

      const ref = React.createRef<ContactsImportModalRef>();
      const { getByText, getAllByTestId } = render(
        <ContactsImportModal
          ref={ref}
          sendBulkInvites={mockSendBulkInvites}
          friends={mockFriends}
          userEmail={userEmail}
        />
      );

      await waitFor(() => {
        ref.current?.present();
      });

      await waitFor(() => {
        expect(getByText(/john doe/i)).toBeTruthy();
      });

      // Select all contacts
      const contactItems = getAllByTestId(/contact-item-/);
      contactItems.forEach((item) => fireEvent.press(item));

      // Press invite button
      fireEvent.press(getByText(/invite 3 contacts/i));

      // Wait for results
      await waitFor(() => {
        expect(getByText(/invitations sent with some failures/i)).toBeTruthy();
        expect(getByText(/2 successful/i)).toBeTruthy();
        expect(getByText(/1 failed/i)).toBeTruthy();
        expect(getByText(/successfully invited/i)).toBeTruthy();
        expect(getByText(/failed to invite/i)).toBeTruthy();
        expect(getByText(/email already taken/i)).toBeTruthy();
      });
    });

    it('should handle multiple contacts, all unsuccessful', async () => {
      mockSendBulkInvites.mockResolvedValueOnce([
        {
          email: 'john@example.com',
          success: false,
          reason: 'Email already taken',
        },
        {
          email: 'jane@example.com',
          success: false,
          reason: 'Invalid email format',
        },
        { email: 'bob@example.com', success: false, reason: 'User blocked' },
      ]);

      const ref = React.createRef<ContactsImportModalRef>();
      const { getByText, getAllByTestId } = render(
        <ContactsImportModal
          ref={ref}
          sendBulkInvites={mockSendBulkInvites}
          friends={mockFriends}
          userEmail={userEmail}
        />
      );

      await waitFor(() => {
        ref.current?.present();
      });

      await waitFor(() => {
        expect(getByText(/john doe/i)).toBeTruthy();
      });

      // Select all contacts
      const contactItems = getAllByTestId(/contact-item-/);
      contactItems.forEach((item) => fireEvent.press(item));

      // Press invite button
      fireEvent.press(getByText(/invite 3 contacts/i));

      // Wait for results
      await waitFor(() => {
        expect(getByText(/failed to send invitations/i)).toBeTruthy();
        expect(getByText(/3 failed/i)).toBeTruthy();
        expect(getByText(/failed to invite/i)).toBeTruthy();
        expect(getByText(/email already taken/i)).toBeTruthy();
        expect(getByText(/invalid email format/i)).toBeTruthy();
        expect(getByText(/user blocked/i)).toBeTruthy();
      });
    });

    it('should handle single contact, successful', async () => {
      mockSendBulkInvites.mockResolvedValueOnce([
        { email: 'john@example.com', success: true },
      ]);

      const ref = React.createRef<ContactsImportModalRef>();
      const { getByText, getByTestId } = render(
        <ContactsImportModal
          ref={ref}
          sendBulkInvites={mockSendBulkInvites}
          friends={mockFriends}
          userEmail={userEmail}
        />
      );

      await waitFor(() => {
        ref.current?.present();
      });

      await waitFor(() => {
        expect(getByText(/john doe/i)).toBeTruthy();
      });

      // Select only first contact
      fireEvent.press(getByTestId('contact-item-1'));

      // Press invite button
      fireEvent.press(getByText(/invite 1 contact/i));

      // Wait for results
      await waitFor(() => {
        expect(getByText(/all invitations sent successfully!/i)).toBeTruthy();
        expect(getByText(/1 successful/i)).toBeTruthy();
        expect(getByText('john@example.com')).toBeTruthy();
      });

      expect(mockSendBulkInvites).toHaveBeenCalledWith(['john@example.com']);
    });

    it('should handle single contact, unsuccessful', async () => {
      mockSendBulkInvites.mockResolvedValueOnce([
        { email: 'john@example.com', success: false, reason: 'User not found' },
      ]);

      const ref = React.createRef<ContactsImportModalRef>();
      const { getByText, getByTestId } = render(
        <ContactsImportModal
          ref={ref}
          sendBulkInvites={mockSendBulkInvites}
          friends={mockFriends}
          userEmail={userEmail}
        />
      );

      await waitFor(() => {
        ref.current?.present();
      });

      await waitFor(() => {
        expect(getByText(/john doe/i)).toBeTruthy();
      });

      // Select only first contact
      fireEvent.press(getByTestId('contact-item-1'));

      // Press invite button
      fireEvent.press(getByText(/invite 1 contact/i));

      // Wait for results
      await waitFor(() => {
        expect(getByText(/failed to send invitations/i)).toBeTruthy();
        expect(getByText(/1 failed/i)).toBeTruthy();
        expect(getByText(/user not found/i)).toBeTruthy();
      });
    });
  });

  describe('Manual Email Entry', () => {
    it('should handle manual email entry - successful', async () => {
      mockSendBulkInvites.mockResolvedValueOnce([
        { email: 'manual@example.com', success: true },
      ]);

      const ref = React.createRef<ContactsImportModalRef>();
      const { getByText, getByPlaceholderText } = render(
        <ContactsImportModal
          ref={ref}
          sendBulkInvites={mockSendBulkInvites}
          friends={mockFriends}
          userEmail={userEmail}
        />
      );

      await waitFor(() => {
        ref.current?.present();
      });

      // Click manual add button
      fireEvent.press(getByText(/add manual contact/i));

      // Enter email
      const emailInput = getByPlaceholderText('friend@example.com');
      fireEvent.changeText(emailInput, 'manual@example.com');

      // Send invite
      fireEvent.press(getByText(/send invite/i));

      // Verify the mock was called
      await waitFor(() => {
        expect(mockSendBulkInvites).toHaveBeenCalledWith([
          'manual@example.com',
        ]);
      });

      // Wait for results
      await waitFor(
        () => {
          expect(getByText(/all invitations sent successfully!/i)).toBeTruthy();
          expect(getByText(/1 successful/i)).toBeTruthy();
        },
        { timeout: 3000 }
      );
    });

    it('should handle manual email entry - unsuccessful', async () => {
      mockSendBulkInvites.mockResolvedValueOnce([
        {
          email: 'invalid@example.com',
          success: false,
          reason: 'Invalid email domain',
        },
      ]);

      const ref = React.createRef<ContactsImportModalRef>();
      const { getByText, getByPlaceholderText } = render(
        <ContactsImportModal
          ref={ref}
          sendBulkInvites={mockSendBulkInvites}
          friends={mockFriends}
          userEmail={userEmail}
        />
      );

      await waitFor(() => {
        ref.current?.present();
      });

      // Click manual add button
      fireEvent.press(getByText(/add manual contact/i));

      // Enter email
      const emailInput = getByPlaceholderText('friend@example.com');
      fireEvent.changeText(emailInput, 'invalid@example.com');

      // Send invite
      fireEvent.press(getByText(/send invite/i));

      // Verify the mock was called
      await waitFor(() => {
        expect(mockSendBulkInvites).toHaveBeenCalledWith([
          'invalid@example.com',
        ]);
      });

      // Wait for results
      await waitFor(
        () => {
          expect(getByText(/failed to send invitations/i)).toBeTruthy();
          expect(getByText(/invalid email domain/i)).toBeTruthy();
        },
        { timeout: 3000 }
      );
    });
  });

  describe('Edge Cases', () => {
    it('should filter out already invited friends', async () => {
      const contactsWithFriends = [
        {
          id: '1',
          name: 'Friend One',
          emails: [{ email: 'friend1@example.com', id: '1', label: 'work' }],
        },
        {
          id: '2',
          name: 'New Contact',
          emails: [{ email: 'new@example.com', id: '2', label: 'personal' }],
        },
      ];

      (Contacts.getContactsAsync as jest.Mock).mockResolvedValue({
        data: contactsWithFriends,
      });
      (Contacts.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      const ref = React.createRef<ContactsImportModalRef>();
      const { getByText, queryByTestId } = render(
        <ContactsImportModal
          ref={ref}
          sendBulkInvites={mockSendBulkInvites}
          friends={mockFriends}
          userEmail={userEmail}
        />
      );

      await waitFor(() => {
        ref.current?.present();
      });

      // Click import contacts to trigger loading
      fireEvent.press(getByText(/import contacts/i));

      await waitFor(
        () => {
          expect(getByText(/friend one/i)).toBeTruthy();
          expect(getByText(/already invited/i)).toBeTruthy();
          expect(getByText(/new contact/i)).toBeTruthy();
        },
        { timeout: 3000 }
      );

      // Already invited contact should not be selectable
      const contactItem = queryByTestId('contact-item-1');
      expect(contactItem?.props.accessibilityState.disabled).toBe(true);
    });

    it('should handle empty contact list', async () => {
      (Contacts.getContactsAsync as jest.Mock).mockResolvedValue({ data: [] });
      (Contacts.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      const ref = React.createRef<ContactsImportModalRef>();
      const { getByText } = render(
        <ContactsImportModal
          ref={ref}
          sendBulkInvites={mockSendBulkInvites}
          friends={mockFriends}
          userEmail={userEmail}
        />
      );

      await waitFor(() => {
        ref.current?.present();
      });

      // Click import contacts button to trigger loading
      fireEvent.press(getByText(/import contacts/i));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'No Contacts Found',
          'No contacts with email addresses were found on your device.'
        );
      });
    });
  });
});
