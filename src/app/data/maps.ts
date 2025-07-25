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
  'map-1': require('../../../assets/images/map/vaedros/vaedros-map.jpg'),
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

// Pre-rendered map images with fog already applied
export type PreRenderedMapImages = Record<string, number>;

export const PRE_RENDERED_MAPS: PreRenderedMapImages = {
  '01': require('../../../assets/images/map/vaedros/map-1.jpg'),
  '02': require('../../../assets/images/map/vaedros/map-2.jpg'),
  '03': require('../../../assets/images/map/vaedros/map-3.jpg'),
  '04': require('../../../assets/images/map/vaedros/map-4.jpg'),
  '05': require('../../../assets/images/map/vaedros/map-5.jpg'),
  '06': require('../../../assets/images/map/vaedros/map-6.jpg'),
  '07': require('../../../assets/images/map/vaedros/map-7.jpg'),
  '08': require('../../../assets/images/map/vaedros/map-8.jpg'),
  '09': require('../../../assets/images/map/vaedros/map-9.jpg'),
  '10': require('../../../assets/images/map/vaedros/map-10.jpg'),
  '11': require('../../../assets/images/map/vaedros/map-11.jpg'),
  '12': require('../../../assets/images/map/vaedros/map-12.jpg'),
  '13': require('../../../assets/images/map/vaedros/map-13.jpg'),
  '14': require('../../../assets/images/map/vaedros/map-14.jpg'),
  '15': require('../../../assets/images/map/vaedros/map-15.jpg'),
  '16': require('../../../assets/images/map/vaedros/map-16.jpg'),
  '17': require('../../../assets/images/map/vaedros/map-17.jpg'),
  '18': require('../../../assets/images/map/vaedros/map-18.jpg'),
  '19': require('../../../assets/images/map/vaedros/map-19.jpg'),
  '20': require('../../../assets/images/map/vaedros/map-20.jpg'),
  '21': require('../../../assets/images/map/vaedros/map-21.jpg'),
  '22': require('../../../assets/images/map/vaedros/map-22.jpg'),
  '23': require('../../../assets/images/map/vaedros/map-23.jpg'),
  '24': require('../../../assets/images/map/vaedros/map-24.jpg'),
  '25': require('../../../assets/images/map/vaedros/map-25.jpg'),
  '26': require('../../../assets/images/map/vaedros/map-26.jpg'),
  '27': require('../../../assets/images/map/vaedros/map-27.jpg'),
  '28': require('../../../assets/images/map/vaedros/map-28.jpg'),
  '29': require('../../../assets/images/map/vaedros/map-29.jpg'),
  '30': require('../../../assets/images/map/vaedros/map-30.jpg'),
  '31': require('../../../assets/images/map/vaedros/vaedros-map.jpg'),
};
