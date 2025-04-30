import { apiClient } from '@/api';
import { type CustomQuestTemplate } from '@/store/types';
import { type StoryQuestTemplate } from '@/store/types';
// Adjust import path as needed

export type QuestRunStatus = 'pending' | 'active' | 'failed' | 'success';

export interface QuestRunResponse {
  id: string;
  status: QuestRunStatus;
  participants: string[];
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
}

const generateQuestRunBodyCustom = (questTemplate: CustomQuestTemplate) => {
  // @TODO: For now, leave out the questTemplateId as the server doesn't have the template documents added yet.
  // return questTemplate with the id removed
  const { id, ...rest } = questTemplate;
  // @TODO: Add any additional users to the participants array, but it's not required for solo quests.
  return { quest: rest };
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
  console.log('Quest run body:', body);
  try {
    const response = await apiClient.post<QuestRunResponse>(
      '/quest-runs/',
      body
    );
    console.log('Quest run created:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to create quest run:', error);
    throw error;
  }
}

export async function updateQuestRunStatus(
  runId: string,
  status: QuestRunStatus,
  liveActivityId?: string | null
): Promise<QuestRunResponse> {
  try {
    console.log('Updating quest run status:', runId, status, liveActivityId);
    const payload: { status: QuestRunStatus; liveActivityId?: string } = {
      status,
    };

    if (liveActivityId) {
      payload.liveActivityId = liveActivityId;
    }

    const response = await apiClient.patch<QuestRunResponse>(
      `/quest-runs/${runId}/status`,
      payload
    );
    console.log('Quest run status updated:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Failed to update quest run ${runId} to ${status}:`, error);
    throw error;
  }
}
