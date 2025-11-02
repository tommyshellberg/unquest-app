import { type ImageSourcePropType } from 'react-native';

export type Character = {
  id: string;
  type: string;
  title: string;
  description: string;
  image: ImageSourcePropType;
  profileImage: ImageSourcePropType;
};

const CHARACTERS: Character[] = [
  {
    id: 'alchemist',
    type: 'Alchemist',
    title: 'Master of Transformation',
    description:
      'Transforms idle time into powerful elixirs and mystical concoctions.',
    image: require('@/../assets/images/characters/alchemist-full.jpg'),
    profileImage: require('@/../assets/images/characters/alchemist-profile.jpg'),
  },
  {
    id: 'bard',
    type: 'Bard',
    title: 'Voice of Inspiration',
    description: 'Creates harmony from silence and inspiration from solitude.',
    image: require('@/../assets/images/characters/bard-full.jpg'),
    profileImage: require('@/../assets/images/characters/bard-profile.jpg'),
  },
  {
    id: 'druid',
    type: 'Druid',
    title: 'Guardian of Nature',
    description: 'Grows stronger through harmony with the natural world.',
    image: require('@/../assets/images/characters/druid-full.jpg'),
    profileImage: require('@/../assets/images/characters/druid-profile.jpg'),
  },
  {
    id: 'knight',
    type: 'Knight',
    title: 'Paragon of Discipline',
    description: 'Builds strength and honor through dedication and restraint.',
    image: require('@/../assets/images/characters/knight-full.jpg'),
    profileImage: require('@/../assets/images/characters/knight-profile.jpg'),
  },
  {
    id: 'scout',
    type: 'Scout',
    title: 'The Lone Explorer',
    description:
      'Resourceful and self-reliant, you thrive in the spaces between civilization and wilderness.',
    image: require('@/../assets/images/characters/scout-full.jpg'),
    profileImage: require('@/../assets/images/characters/scout-profile.jpg'),
  },
  {
    id: 'wizard',
    type: 'Wizard',
    title: 'Wielder of Magic',
    description:
      'Channels the power of focus into devastating magical abilities.',
    image: require('@/../assets/images/characters/wizard-full.jpg'),
    profileImage: require('@/../assets/images/characters/wizard-profile.jpg'),
  },
];

export default CHARACTERS;
