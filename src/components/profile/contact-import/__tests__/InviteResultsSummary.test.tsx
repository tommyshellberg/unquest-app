import React from 'react';
import { render } from '@testing-library/react-native';
import { InviteResultsSummary } from '../InviteResultsSummary';

describe('InviteResultsSummary', () => {
  const mockOnDone = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Display States', () => {
    it('should display all successful invites correctly', () => {
      const results = {
        successful: [
          { name: 'John Doe', email: 'john@example.com' },
          { name: 'Jane Smith', email: 'jane@example.com' },
          { name: 'Bob Wilson', email: 'bob@example.com' },
        ],
        failed: [],
      };

      const { getByText, queryByText } = render(
        <InviteResultsSummary results={results} onDone={mockOnDone} />
      );

      // Header message
      expect(getByText('All invitations sent successfully!')).toBeTruthy();
      expect(getByText('3 Successful')).toBeTruthy();

      // Section header
      expect(getByText('SUCCESSFULLY INVITED')).toBeTruthy();

      // Individual contacts
      expect(getByText('John Doe')).toBeTruthy();
      expect(getByText('john@example.com')).toBeTruthy();
      expect(getByText('Jane Smith')).toBeTruthy();
      expect(getByText('jane@example.com')).toBeTruthy();
      expect(getByText('Bob Wilson')).toBeTruthy();
      expect(getByText('bob@example.com')).toBeTruthy();

      // No failed section
      expect(queryByText('FAILED TO INVITE')).toBeNull();
    });

    it('should display mixed success/failure results correctly', () => {
      const results = {
        successful: [
          { name: 'John Doe', email: 'john@example.com' },
          { name: 'Jane Smith', email: 'jane@example.com' },
        ],
        failed: [
          {
            name: 'Bob Wilson',
            email: 'bob@example.com',
            reason: 'Email already taken',
          },
          {
            name: 'Alice Brown',
            email: 'alice@example.com',
            reason: 'User blocked',
          },
        ],
      };

      const { getByText } = render(
        <InviteResultsSummary results={results} onDone={mockOnDone} />
      );

      // Header message
      expect(getByText('Invitations sent with some failures')).toBeTruthy();
      expect(getByText('2 Successful')).toBeTruthy();
      expect(getByText('2 Failed')).toBeTruthy();

      // Success section
      expect(getByText('SUCCESSFULLY INVITED')).toBeTruthy();
      expect(getByText('John Doe')).toBeTruthy();
      expect(getByText('john@example.com')).toBeTruthy();

      // Failed section
      expect(getByText('FAILED TO INVITE')).toBeTruthy();
      expect(getByText('Bob Wilson')).toBeTruthy();
      expect(getByText('bob@example.com')).toBeTruthy();
      expect(getByText('Email already taken')).toBeTruthy();
      expect(getByText('Alice Brown')).toBeTruthy();
      expect(getByText('User blocked')).toBeTruthy();
    });

    it('should display all failed invites correctly', () => {
      const results = {
        successful: [],
        failed: [
          {
            name: 'John Doe',
            email: 'john@example.com',
            reason: 'Invalid email format',
          },
          {
            name: 'Jane Smith',
            email: 'jane@example.com',
            reason: 'Server error',
          },
        ],
      };

      const { getByText, queryByText } = render(
        <InviteResultsSummary results={results} onDone={mockOnDone} />
      );

      // Header message
      expect(getByText('Failed to send invitations')).toBeTruthy();
      expect(getByText('2 Failed')).toBeTruthy();

      // No success section
      expect(queryByText('SUCCESSFULLY INVITED')).toBeNull();
      expect(queryByText('Successful')).toBeNull();

      // Failed section
      expect(getByText('FAILED TO INVITE')).toBeTruthy();
      expect(getByText('John Doe')).toBeTruthy();
      expect(getByText('Invalid email format')).toBeTruthy();
      expect(getByText('Jane Smith')).toBeTruthy();
      expect(getByText('Server error')).toBeTruthy();
    });

    it('should display single successful invite correctly', () => {
      const results = {
        successful: [{ name: 'John Doe', email: 'john@example.com' }],
        failed: [],
      };

      const { getByText } = render(
        <InviteResultsSummary results={results} onDone={mockOnDone} />
      );

      expect(getByText('All invitations sent successfully!')).toBeTruthy();
      expect(getByText('1 Successful')).toBeTruthy();
      expect(getByText('John Doe')).toBeTruthy();
      expect(getByText('john@example.com')).toBeTruthy();
    });

    it('should display single failed invite correctly', () => {
      const results = {
        successful: [],
        failed: [
          {
            name: 'John Doe',
            email: 'john@example.com',
            reason: 'User not found',
          },
        ],
      };

      const { getByText } = render(
        <InviteResultsSummary results={results} onDone={mockOnDone} />
      );

      expect(getByText('Failed to send invitations')).toBeTruthy();
      expect(getByText('1 Failed')).toBeTruthy();
      expect(getByText('John Doe')).toBeTruthy();
      expect(getByText('john@example.com')).toBeTruthy();
      expect(getByText('User not found')).toBeTruthy();
    });
  });

  describe('Email Display', () => {
    it('should display email addresses for all contacts', () => {
      const results = {
        successful: [
          { name: 'Contact One', email: 'contact1@example.com' },
          { name: 'Contact Two', email: 'contact2@example.com' },
        ],
        failed: [
          {
            name: 'Contact Three',
            email: 'contact3@example.com',
            reason: 'Invalid',
          },
        ],
      };

      const { getByText } = render(
        <InviteResultsSummary results={results} onDone={mockOnDone} />
      );

      // All emails should be visible
      expect(getByText('contact1@example.com')).toBeTruthy();
      expect(getByText('contact2@example.com')).toBeTruthy();
      expect(getByText('contact3@example.com')).toBeTruthy();
    });

    it('should handle contacts with email as name', () => {
      const results = {
        successful: [{ name: 'user@example.com', email: 'user@example.com' }],
        failed: [],
      };

      const { getAllByText } = render(
        <InviteResultsSummary results={results} onDone={mockOnDone} />
      );

      // Email should appear as both name and email
      const emailElements = getAllByText('user@example.com');
      expect(emailElements).toHaveLength(2);
    });
  });

  describe('Error Reasons', () => {
    it('should display various error reasons clearly', () => {
      const results = {
        successful: [],
        failed: [
          {
            name: 'User 1',
            email: 'user1@example.com',
            reason: 'Email already taken',
          },
          {
            name: 'User 2',
            email: 'user2@example.com',
            reason: 'Invalid email format',
          },
          {
            name: 'User 3',
            email: 'user3@example.com',
            reason: 'User blocked',
          },
          {
            name: 'User 4',
            email: 'user4@example.com',
            reason: 'Server error',
          },
          {
            name: 'User 5',
            email: 'user5@example.com',
            reason: 'Unknown error',
          },
        ],
      };

      const { getByText } = render(
        <InviteResultsSummary results={results} onDone={mockOnDone} />
      );

      // All error reasons should be visible
      expect(getByText('Email already taken')).toBeTruthy();
      expect(getByText('Invalid email format')).toBeTruthy();
      expect(getByText('User blocked')).toBeTruthy();
      expect(getByText('Server error')).toBeTruthy();
      expect(getByText('Unknown error')).toBeTruthy();
    });
  });

  describe('Visual Indicators', () => {
    it('should show correct icons for success and failure', () => {
      const results = {
        successful: [{ name: 'Success', email: 'success@example.com' }],
        failed: [
          { name: 'Failed', email: 'failed@example.com', reason: 'Error' },
        ],
      };

      const { getAllByTestId } = render(
        <InviteResultsSummary results={results} onDone={mockOnDone} />
      );

      // CheckCircle for success, AlertCircle for failure
      // These would be tested by checking the component tree or visual snapshots
      // For now, we're testing that the component renders without errors
    });
  });
});
