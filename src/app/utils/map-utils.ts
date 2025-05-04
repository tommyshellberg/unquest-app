import type { MapId, MapName } from '@/app/data/maps';
import { MAP_NAMES, QUEST_MAP_MAPPING } from '@/app/data/maps';
import { FOG_MASKS } from '@/app/data/maps';

export function getMapForQuest(questId: string): MapId {
  for (const [mapId, quests] of Object.entries(QUEST_MAP_MAPPING)) {
    if (quests.some((quest) => quest.id === questId)) {
      return mapId as MapId;
    }
  }
  // Default to 'map-1' if no matching map found
  return 'map-1';
}

export function getMapNameForQuest(questId: string): MapName {
  const mapId = getMapForQuest(questId);
  return MAP_NAMES[mapId];
}

export function getFogMaskForQuest(questId: string | undefined): number {
  console.log('questId', questId);
  if (!questId) return FOG_MASKS['01']; // Default to first mask

  // Extract quest number, ignoring side-quest letters (a, b, etc.)
  const questNumberMatch = questId.match(/quest-(\d+)[a-z]?/);
  console.log('questNumberMatch', questNumberMatch);

  if (!questNumberMatch) return FOG_MASKS['01']; // Default if no match

  // Get the quest number and convert to a number
  const questNumStr = questNumberMatch[1];
  const questNum = parseInt(questNumStr, 10);
  console.log('questNum', questNum);
  const fogNum = Math.max(1, questNum);
  console.log('fogNum', fogNum);
  // Convert back to padded string format
  const questKey = fogNum.toString().padStart(2, '0');
  console.log('questKey', questKey);
  // Return the corresponding mask or default to first one
  return FOG_MASKS[questKey] || FOG_MASKS['01'];
}
