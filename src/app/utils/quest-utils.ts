export const calculateRewardFromDuration = (duration: number) => {
  return duration * 3;
};

export const getQuestDuration = (questNumber: number): number => {
  if (questNumber < 1 || questNumber > 60) return 0;

  if (questNumber >= 1 && questNumber <= 5) {
    return Math.round(2 + questNumber); // 3–7 minutes
  }

  if (questNumber >= 6 && questNumber <= 56) {
    const start = 8; // duration at quest 6
    const end = 90; // duration at quest 56
    const steps = 51; // 56 - 6 + 1
    const slope = (end - start) / (steps - 1); // = 82 / 50 = 1.64
    return Math.round(start + (questNumber - 6) * slope);
  }

  if (questNumber >= 57 && questNumber <= 59) {
    return 90; // plateau before final boss
  }

  if (questNumber === 60) {
    return 120; // final quest
  }

  return 0;
};
