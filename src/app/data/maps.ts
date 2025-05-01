// Define the mapping between quests and maps
import { INITIAL_POIS } from '@/app/data/pois';
import { type POI } from '@/store/types';

import { AVAILABLE_QUESTS } from './quests';

// Define proper types
export type MapId = 'map-1'; // Add more map IDs as needed
export type MapImages = Record<MapId, number>; // number because require() returns a number
export type MapName = string;

// Map images with proper typing
export const MAP_IMAGES: MapImages = {
  'map-1': require('../../../assets/images/vaedros-map.png'),
};

export const MAP_NAMES: Record<MapId, MapName> = {
  'map-1': 'Vaedros Kingdom',
};

// POIs for each map
export const QUEST_MAP_MAPPING: Record<MapId, any[]> = {
  'map-1': AVAILABLE_QUESTS.slice(0, 5),
};

export const MAP_POIS: Record<MapId, POI[]> = {
  'map-1': INITIAL_POIS.slice(0, 5),
};

// Fog mask images for map reveal progression
export type FogMaskImages = Record<string, number>;

export const FOG_MASKS: FogMaskImages = {
  '01': require('../../../assets/images/fog-01.png'),
  '02': require('../../../assets/images/fog-02.png'),
  '03': require('../../../assets/images/fog-03.png'),
  '04': require('../../../assets/images/fog-04.png'),
  '05': require('../../../assets/images/fog-05.png'),
  '06': require('../../../assets/images/fog-06.png'),
  '07': require('../../../assets/images/fog-07.png'),
  '08': require('../../../assets/images/fog-08.png'),
  '09': require('../../../assets/images/fog-09.png'),
  '10': require('../../../assets/images/fog-10.png'),
};
