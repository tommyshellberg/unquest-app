import { apiClient } from '@/api';
import { provisionalApiClient } from '@/api/common/provisional-client';
import { getItem } from '@/lib/storage';
import { type CustomQuestTemplate } from '@/store/types';
import { type StoryQuestTemplate } from '@/store/types';
// Adjust import path as needed

export type QuestRunStatus = 'pending' | 'active' | 'failed' | 'success';

export interface QuestRunResponse {
  id: string;
  status: QuestRunStatus;
  participants: string[] | { userId: string; ready: boolean; status: string }[];
  quest: {
    title: string;
    durationMinutes: number;
    mode: string;
    category: string;
    reward: {
      xp: number;
    };
    options: any[];
  };
  invitationId?: string;
  actualStartTime?: number;
  scheduledEndTime?: number;
}

const generateQuestRunBodyCustom = (questTemplate: CustomQuestTemplate) => {
  // @TODO: For now, leave out the questTemplateId as the server doesn't have the template documents added yet.
  // return questTemplate with the id removed
  const { inviteeIds, ...rest } = questTemplate;

  // Build the request body
  const body: any = { quest: rest };

  // Add inviteeIds if this is a cooperative quest
  if (inviteeIds && inviteeIds.length > 0) {
    body.inviteeIds = inviteeIds;
  }

  return body;
};

const generateQuestRunBodyStory = (questTemplate: StoryQuestTemplate) => {
  const { id } = questTemplate;
  return { quest: { questTemplateId: id } };
};

export async function createQuestRun(
  questTemplate: CustomQuestTemplate | StoryQuestTemplate
): Promise<QuestRunResponse> {
  const body =
    questTemplate.mode === 'story'
      ? generateQuestRunBodyStory(questTemplate)
      : generateQuestRunBodyCustom(questTemplate);

  try {
    // Check if we're using a provisional user
    const hasProvisionalToken = !!getItem('provisionalAccessToken');

    // Use the appropriate client
    const client = hasProvisionalToken ? provisionalApiClient : apiClient;

    const response = await client.post<QuestRunResponse>('/quest-runs/', body);
    return response.data;
  } catch (error) {
    console.error('Failed to create quest run:', error);
    throw error;
  }
}

export async function updateQuestRunStatus(
  runId: string,
  status: QuestRunStatus,
  liveActivityId?: string | null,
  ready?: boolean
): Promise<QuestRunResponse> {
  try {
    console.log('Updating quest run status:', runId, status, liveActivityId);
    const payload: {
      status: QuestRunStatus;
      liveActivityId?: string;
      ready?: boolean;
    } = {
      status,
    };

    if (liveActivityId) {
      payload.liveActivityId = liveActivityId;
    }

    // For cooperative quests, include ready state when activating
    if (ready !== undefined && status === 'active') {
      payload.ready = ready;
    }

    // Check if we're using a provisional user
    const hasProvisionalToken = !!getItem('provisionalAccessToken');

    // Use the appropriate client
    const client = hasProvisionalToken ? provisionalApiClient : apiClient;

    const response = await client.patch<QuestRunResponse>(
      `/quest-runs/${runId}/status`,
      payload
    );
    return response.data;
  } catch (error) {
    console.error(`Failed to update quest run ${runId} to ${status}:`, error);
    throw error;
  }
}

export async function getQuestRunStatus(
  runId: string
): Promise<QuestRunResponse> {
  try {
    // Check if we're using a provisional user
    const hasProvisionalToken = !!getItem('provisionalAccessToken');

    // Use the appropriate client
    const client = hasProvisionalToken ? provisionalApiClient : apiClient;

    const response = await client.get<QuestRunResponse>(`/quest-runs/${runId}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to get quest run ${runId}:`, error);
    throw error;
  }
}
