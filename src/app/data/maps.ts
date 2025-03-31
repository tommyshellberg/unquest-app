// Define the mapping between quests and maps
import { INITIAL_POIS } from '@/app/data/pois';
import { type POI } from '@/store/poi-store';

import { AVAILABLE_QUESTS } from './quests';

// Define proper types
export type MapId = 'map-1'; // Add more map IDs as needed
export type MapImages = Record<MapId, number>; // number because require() returns a number
export type MapName = string;

// Map images with proper typing
export const MAP_IMAGES: MapImages = {
  'map-1': require('../../../assets/images/map-1.jpg'),
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
