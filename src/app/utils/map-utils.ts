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
  if (!questId) return FOG_MASKS['01']; // Default to first mask

  // Extract quest number, ignoring side-quest letters (a, b, etc.)
  const questNumberMatch = questId.match(/quest-(\d+)[a-z]?/);
  const questNum = questNumberMatch ? questNumberMatch[1] : '1';
  const questKey = questNum.padStart(2, '0');

  // Return the corresponding mask or default to first one
  return FOG_MASKS[questKey] || FOG_MASKS['01'];
}
