import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useFriendManagement } from '../use-friend-management';
import * as userService from '@/lib/services/user';

// Mock the user service
jest.mock('@/lib/services/user');

describe('useFriendManagement - Bulk Invites', () => {
  let queryClient: QueryClient;
  const mockUserEmail = 'user@example.com';
  const mockContactsModalRef = { current: { present: jest.fn(), dismiss: jest.fn() } };

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();

    // Mock default responses
    (userService.getUserFriends as jest.Mock).mockResolvedValue({ friends: [] });
    (userService.getUserInvitations as jest.Mock).mockResolvedValue({ results: [] });
  });

  describe('sendBulkInvites', () => {
    it('should handle all successful invites', async () => {
      const mockResponse = {
        message: 'Successfully sent 3 invitations',
        totalSuccessful: 3,
        totalFailed: 0,
        successfulEmails: ['john@example.com', 'jane@example.com', 'bob@example.com'],
        failedEmails: [],
      };

      (userService.sendBulkFriendInvites as jest.Mock).mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(
        () => useFriendManagement(mockUserEmail, mockContactsModalRef),
        { wrapper }
      );

      const emails = ['john@example.com', 'jane@example.com', 'bob@example.com'];
      
      let bulkResults: any;
      await act(async () => {
        bulkResults = await result.current.sendBulkInvites(emails);
      });

      expect(bulkResults).toEqual([
        { email: 'john@example.com', success: true },
        { email: 'jane@example.com', success: true },
        { email: 'bob@example.com', success: true },
      ]);

      expect(userService.sendBulkFriendInvites).toHaveBeenCalledWith(emails);
    });

    it('should handle mixed success/failure results', async () => {
      const mockResponse = {
        message: 'Successfully sent 2 invitations',
        totalSuccessful: 2,
        totalFailed: 2,
        successfulEmails: ['john@example.com', 'jane@example.com'],
        failedEmails: [
          { email: 'bob@example.com', reason: 'Email already taken' },
          { email: 'alice@example.com', reason: 'Invalid email format' },
        ],
      };

      (userService.sendBulkFriendInvites as jest.Mock).mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(
        () => useFriendManagement(mockUserEmail, mockContactsModalRef),
        { wrapper }
      );

      const emails = ['john@example.com', 'jane@example.com', 'bob@example.com', 'alice@example.com'];
      
      let bulkResults: any;
      await act(async () => {
        bulkResults = await result.current.sendBulkInvites(emails);
      });

      expect(bulkResults).toEqual([
        { email: 'john@example.com', success: true },
        { email: 'jane@example.com', success: true },
        { email: 'bob@example.com', success: false, reason: 'Email already taken' },
        { email: 'alice@example.com', success: false, reason: 'Invalid email format' },
      ]);
    });

    it('should handle all failed invites', async () => {
      const mockResponse = {
        message: 'Successfully sent 0 invitations',
        totalSuccessful: 0,
        totalFailed: 3,
        successfulEmails: [],
        failedEmails: [
          { email: 'john@example.com', reason: 'User blocked' },
          { email: 'jane@example.com', reason: 'Email already taken' },
          { email: 'bob@example.com', reason: 'Server error' },
        ],
      };

      (userService.sendBulkFriendInvites as jest.Mock).mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(
        () => useFriendManagement(mockUserEmail, mockContactsModalRef),
        { wrapper }
      );

      const emails = ['john@example.com', 'jane@example.com', 'bob@example.com'];
      
      let bulkResults: any;
      await act(async () => {
        bulkResults = await result.current.sendBulkInvites(emails);
      });

      expect(bulkResults).toEqual([
        { email: 'john@example.com', success: false, reason: 'User blocked' },
        { email: 'jane@example.com', success: false, reason: 'Email already taken' },
        { email: 'bob@example.com', success: false, reason: 'Server error' },
      ]);
    });

    it('should handle single successful invite', async () => {
      const mockResponse = {
        message: 'Successfully sent 1 invitation',
        totalSuccessful: 1,
        totalFailed: 0,
        successfulEmails: ['john@example.com'],
        failedEmails: [],
      };

      (userService.sendBulkFriendInvites as jest.Mock).mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(
        () => useFriendManagement(mockUserEmail, mockContactsModalRef),
        { wrapper }
      );

      const emails = ['john@example.com'];
      
      let bulkResults: any;
      await act(async () => {
        bulkResults = await result.current.sendBulkInvites(emails);
      });

      expect(bulkResults).toEqual([
        { email: 'john@example.com', success: true },
      ]);
    });

    it('should handle single failed invite', async () => {
      const mockResponse = {
        message: 'Successfully sent 0 invitations',
        totalSuccessful: 0,
        totalFailed: 1,
        successfulEmails: [],
        failedEmails: [
          { email: 'john@example.com', reason: 'User not found' },
        ],
      };

      (userService.sendBulkFriendInvites as jest.Mock).mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(
        () => useFriendManagement(mockUserEmail, mockContactsModalRef),
        { wrapper }
      );

      const emails = ['john@example.com'];
      
      let bulkResults: any;
      await act(async () => {
        bulkResults = await result.current.sendBulkInvites(emails);
      });

      expect(bulkResults).toEqual([
        { email: 'john@example.com', success: false, reason: 'User not found' },
      ]);
    });

    it('should filter out user\'s own email', async () => {
      const { result } = renderHook(
        () => useFriendManagement(mockUserEmail, mockContactsModalRef),
        { wrapper }
      );

      const emails = [mockUserEmail];
      
      let bulkResults: any;
      await act(async () => {
        bulkResults = await result.current.sendBulkInvites(emails);
      });

      expect(bulkResults).toEqual([
        { email: mockUserEmail, success: false, reason: 'Cannot invite yourself' },
      ]);

      expect(userService.sendBulkFriendInvites).not.toHaveBeenCalled();
    });

    it('should handle network errors gracefully', async () => {
      (userService.sendBulkFriendInvites as jest.Mock).mockRejectedValueOnce({
        response: { data: { message: 'Network error' } },
      });

      const { result } = renderHook(
        () => useFriendManagement(mockUserEmail, mockContactsModalRef),
        { wrapper }
      );

      const emails = ['john@example.com', 'jane@example.com'];
      
      let bulkResults: any;
      await act(async () => {
        bulkResults = await result.current.sendBulkInvites(emails);
      });

      expect(bulkResults).toEqual([
        { email: 'john@example.com', success: false, reason: 'Network error' },
        { email: 'jane@example.com', success: false, reason: 'Network error' },
      ]);
    });

    it('should invalidate invitations query after successful bulk invite', async () => {
      const mockResponse = {
        message: 'Successfully sent 1 invitation',
        totalSuccessful: 1,
        totalFailed: 0,
        successfulEmails: ['john@example.com'],
        failedEmails: [],
      };

      (userService.sendBulkFriendInvites as jest.Mock).mockResolvedValueOnce(mockResponse);

      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(
        () => useFriendManagement(mockUserEmail, mockContactsModalRef),
        { wrapper }
      );

      await act(async () => {
        await result.current.sendBulkInvites(['john@example.com']);
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['invitations'] });
    });

    it('should handle duplicate emails in the input', async () => {
      const mockResponse = {
        message: 'Successfully sent 1 invitation',
        totalSuccessful: 1,
        totalFailed: 0,
        successfulEmails: ['john@example.com'],
        failedEmails: [],
      };

      (userService.sendBulkFriendInvites as jest.Mock).mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(
        () => useFriendManagement(mockUserEmail, mockContactsModalRef),
        { wrapper }
      );

      const emails = ['john@example.com', 'john@example.com', 'john@example.com'];
      
      await act(async () => {
        await result.current.sendBulkInvites(emails);
      });

      // The server handles deduplication, so we just pass all emails
      expect(userService.sendBulkFriendInvites).toHaveBeenCalledWith(emails);
    });

    it('should handle various error reasons correctly', async () => {
      const mockResponse = {
        message: 'Successfully sent 0 invitations',
        totalSuccessful: 0,
        totalFailed: 5,
        successfulEmails: [],
        failedEmails: [
          { email: 'test1@example.com', reason: 'Email already taken' },
          { email: 'test2@example.com', reason: 'Invalid email format' },
          { email: 'test3@example.com', reason: 'User blocked' },
          { email: 'test4@example.com', reason: 'Server error' },
          { email: 'test5@example.com', reason: 'Unknown error' },
        ],
      };

      (userService.sendBulkFriendInvites as jest.Mock).mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(
        () => useFriendManagement(mockUserEmail, mockContactsModalRef),
        { wrapper }
      );

      const emails = ['test1@example.com', 'test2@example.com', 'test3@example.com', 'test4@example.com', 'test5@example.com'];
      
      let bulkResults: any;
      await act(async () => {
        bulkResults = await result.current.sendBulkInvites(emails);
      });

      expect(bulkResults[0].reason).toBe('Email already taken');
      expect(bulkResults[1].reason).toBe('Invalid email format');
      expect(bulkResults[2].reason).toBe('User blocked');
      expect(bulkResults[3].reason).toBe('Server error');
      expect(bulkResults[4].reason).toBe('Unknown error');
    });
  });
});