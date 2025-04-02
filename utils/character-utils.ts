import CHARACTERS from '@/app/data/characters';

export function getCharacterAvatar(characterType?: string) {
  if (!characterType) {
    return require('@/../assets/images/characters/character-placeholder.jpg');
  }

  const character = CHARACTERS.find((c) => c.id === characterType);

  return (
    character?.profileImage ||
    character?.image ||
    require('@/../assets/images/characters/character-placeholder.jpg')
  );
}
