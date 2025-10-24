import { STRINGS } from './constants';
import { getQuestSubtitle } from './utils';

describe('getQuestSubtitle', () => {
  it('returns custom quest subtitle for custom mode', () => {
    const subtitle = getQuestSubtitle('custom');

    expect(subtitle).toBe(STRINGS.CUSTOM_QUEST_SUBTITLE);
  });

  it('returns story quest subtitle for story mode', () => {
    const subtitle = getQuestSubtitle('story');

    expect(subtitle).toBe(STRINGS.STORY_QUEST_SUBTITLE);
  });

  it('returns story quest subtitle when mode is undefined', () => {
    const subtitle = getQuestSubtitle(undefined);

    expect(subtitle).toBe(STRINGS.STORY_QUEST_SUBTITLE);
  });
});
