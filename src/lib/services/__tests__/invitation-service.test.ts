import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import {
  createInvitation,
  getInvitationStatus,
  acceptInvitation,
  declineInvitation,
  getActiveInvitations,
} from '../invitation-service';

// Mock dependencies
jest.mock('@/lib/storage');
jest.mock('@/api');
jest.mock('@/api/common/provisional-client');

// Import after mocking
import { apiClient } from '@/api';
import { provisionalApiClient } from '@/api/common/provisional-client';
import { getItem } from '@/lib/storage';

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;
const mockedProvisionalApiClient = provisionalApiClient as jest.Mocked<
  typeof provisionalApiClient
>;
const mockedGetItem = getItem as jest.MockedFunction<typeof getItem>;

describe('Invitation Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default to using authenticated client
    mockedGetItem.mockReturnValue('auth-token');
  });

  describe('createInvitation', () => {
    it('should create an invitation successfully', async () => {
      const mockInvitation = {
        id: 'inv-123',
        questRunId: 'run-456',
        inviter: { id: 'user-1', name: 'John', email: 'john@example.com' },
        invitees: ['user-2', 'user-3'],
        status: 'pending' as const,
        responses: [],
        createdAt: Date.now(),
        expiresAt: Date.now() + 300000,
      };

      mockedApiClient.post.mockResolvedValueOnce({ data: mockInvitation });

      const result = await createInvitation({
        questRunId: 'run-456',
        inviteeIds: ['user-2', 'user-3'],
      });

      expect(result).toEqual(mockInvitation);
      expect(mockedApiClient.post).toHaveBeenCalledWith('/invitations', {
        questRunId: 'run-456',
        inviteeIds: ['user-2', 'user-3'],
      });
    });

    it('should handle errors when creating invitation', async () => {
      mockedApiClient.post.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        createInvitation({
          questRunId: 'run-456',
          inviteeIds: ['user-2'],
        })
      ).rejects.toThrow('Network error');
    });

    it('should use provisional client when provisional token exists', async () => {
      mockedGetItem.mockReturnValue('provisional-token');
      
      const mockInvitation = {
        id: 'inv-123',
        questRunId: 'run-456',
        inviter: { id: 'user-1', name: 'John', email: 'john@example.com' },
        invitees: ['user-2', 'user-3'],
        status: 'pending' as const,
        responses: [],
        createdAt: Date.now(),
        expiresAt: Date.now() + 300000,
      };

      mockedProvisionalApiClient.post.mockResolvedValueOnce({
        data: mockInvitation,
      });

      const result = await createInvitation({
        questRunId: 'run-456',
        inviteeIds: ['user-2', 'user-3'],
      });

      expect(result).toEqual(mockInvitation);
      expect(mockedProvisionalApiClient.post).toHaveBeenCalledWith(
        '/invitations',
        {
          questRunId: 'run-456',
          inviteeIds: ['user-2', 'user-3'],
        }
      );
    });
  });

  describe('getInvitationStatus', () => {
    it('should get invitation status successfully', async () => {
      const mockStatus = {
        invitation: {
          id: 'inv-123',
          questRunId: 'run-456',
          inviter: { id: 'user-1', name: 'John', email: 'john@example.com' },
          invitees: ['user-2'],
          status: 'partial' as const,
          responses: [
            { userId: 'user-2', action: 'accepted' as const, respondedAt: Date.now() },
          ],
          createdAt: Date.now(),
          expiresAt: Date.now() + 300000,
        },
        acceptedUsers: ['user-2'],
        declinedUsers: [],
        pendingUsers: [],
      };

      mockedApiClient.get.mockResolvedValueOnce({ data: mockStatus });

      const result = await getInvitationStatus('inv-123');

      expect(result).toEqual(mockStatus);
      expect(mockedApiClient.get).toHaveBeenCalledWith(
        '/invitations/inv-123/status'
      );
    });
  });

  describe('acceptInvitation', () => {
    it('should accept invitation successfully', async () => {
      const mockAcceptedInvitation = {
        id: 'inv-123',
        questRunId: 'run-456',
        inviter: { id: 'user-1', name: 'John', email: 'john@example.com' },
        invitees: ['user-2'],
        status: 'partial' as const,
        responses: [
          { userId: 'user-2', action: 'accepted' as const, respondedAt: Date.now() },
        ],
        createdAt: Date.now(),
        expiresAt: Date.now() + 300000,
      };

      mockedApiClient.patch.mockResolvedValueOnce({
        data: mockAcceptedInvitation,
      });

      const result = await acceptInvitation('inv-123');

      expect(result).toEqual(mockAcceptedInvitation);
      expect(mockedApiClient.patch).toHaveBeenCalledWith(
        '/invitations/inv-123',
        { action: 'accept' }
      );
    });
  });

  describe('declineInvitation', () => {
    it('should decline invitation successfully', async () => {
      const mockDeclinedInvitation = {
        id: 'inv-123',
        questRunId: 'run-456',
        inviter: { id: 'user-1', name: 'John', email: 'john@example.com' },
        invitees: ['user-2'],
        status: 'partial' as const,
        responses: [
          { userId: 'user-2', action: 'declined' as const, respondedAt: Date.now() },
        ],
        createdAt: Date.now(),
        expiresAt: Date.now() + 300000,
      };

      mockedApiClient.patch.mockResolvedValueOnce({
        data: mockDeclinedInvitation,
      });

      const result = await declineInvitation('inv-123');

      expect(result).toEqual(mockDeclinedInvitation);
      expect(mockedApiClient.patch).toHaveBeenCalledWith(
        '/invitations/inv-123',
        { action: 'decline' }
      );
    });
  });

  describe('getActiveInvitations', () => {
    it('should get active invitations successfully', async () => {
      const mockInvitations = [
        {
          id: 'inv-123',
          questRunId: 'run-456',
          inviter: { id: 'user-1', name: 'John', email: 'john@example.com' },
          invitees: ['user-2'],
          status: 'pending' as const,
          responses: [],
          createdAt: Date.now(),
          expiresAt: Date.now() + 300000,
        },
        {
          id: 'inv-789',
          questRunId: 'run-012',
          inviter: { id: 'user-3', name: 'Jane', email: 'jane@example.com' },
          invitees: ['user-4'],
          status: 'pending' as const,
          responses: [],
          createdAt: Date.now(),
          expiresAt: Date.now() + 300000,
        },
      ];

      mockedApiClient.get.mockResolvedValueOnce({ data: mockInvitations });

      const result = await getActiveInvitations();

      expect(result).toEqual(mockInvitations);
      expect(mockedApiClient.get).toHaveBeenCalledWith('/invitations/active');
    });
  });

  describe('getPendingInvitations', () => {
    it('should get pending invitations successfully', async () => {
      const mockInvitations = [
        {
          id: 'inv-123',
          questRunId: 'run-456',
          inviter: { id: 'user-1', name: 'John', email: 'john@example.com' },
          invitees: ['user-2'],
          status: 'pending' as const,
          responses: [],
          createdAt: Date.now(),
          expiresAt: Date.now() + 300000,
        },
      ];

      mockedApiClient.get.mockResolvedValueOnce({ 
        data: { invitations: mockInvitations } 
      });

      // Import getPendingInvitations
      const { getPendingInvitations } = await import('../invitation-service');

      const result = await getPendingInvitations();

      expect(result).toEqual(mockInvitations);
      expect(mockedApiClient.get).toHaveBeenCalledWith('/invitations/pending');
    });
  });

  describe('utility functions', () => {
    it('should check if invitation is expired', async () => {
      const { isInvitationExpired } = await import('../invitation-service');
      
      const expiredInvitation = {
        id: 'inv-123',
        questRunId: 'run-456',
        inviter: { id: 'user-1', name: 'John', email: 'john@example.com' },
        invitees: ['user-2'],
        status: 'pending' as const,
        responses: [],
        createdAt: Date.now() - 600000,
        expiresAt: Date.now() - 300000, // expired
      };

      const activeInvitation = {
        ...expiredInvitation,
        expiresAt: Date.now() + 300000, // not expired
      };

      expect(isInvitationExpired(expiredInvitation)).toBe(true);
      expect(isInvitationExpired(activeInvitation)).toBe(false);
    });

    it('should calculate time remaining for invitation', async () => {
      const { getInvitationTimeRemaining } = await import('../invitation-service');
      
      const invitation = {
        id: 'inv-123',
        questRunId: 'run-456',
        inviter: { id: 'user-1', name: 'John', email: 'john@example.com' },
        invitees: ['user-2'],
        status: 'pending' as const,
        responses: [],
        createdAt: Date.now(),
        expiresAt: Date.now() + 60000, // 60 seconds from now
      };

      const remaining = getInvitationTimeRemaining(invitation);
      expect(remaining).toBeGreaterThanOrEqual(59);
      expect(remaining).toBeLessThanOrEqual(60);
    });
  });
});