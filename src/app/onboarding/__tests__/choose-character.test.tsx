import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import ChooseCharacterScreen from "../choose-character";
import { updateUserCharacter } from "@/services/user";
import { useRouter } from "expo-router";

// Mock updateUserCharacter so we can simulate both success and failure.
jest.mock("@/services/user", () => ({
  updateUserCharacter: jest.fn(),
}));

// Create a mock for useRouter so we can verify navigation.
const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Provide a mock for useNavigation to avoid missing navigation object errors.
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    setOptions: jest.fn(),
  }),
}));

// Create a fake implementation for the character store.
// We now call the selector on our fake state so that useCharacterStore(selector)
// returns the value the component expects.
const mockCreateCharacter = jest.fn();
jest.mock("@/store/character-store", () => ({
  useCharacterStore: jest.fn((selector) =>
    selector({ createCharacter: mockCreateCharacter })
  ),
}));

// Optionally, mock the character constants to a minimal array.
jest.mock("@/constants/characters", () => ({
  CHARACTERS: [
    {
      id: "knight",
      type: "knight",
      title: "Knight",
      image: "knight.png",
      description: "A brave knight",
    },
    {
      id: "wizard",
      type: "wizard",
      title: "Wizard",
      image: "wizard.png",
      description: "A wise wizard",
    },
  ],
}));

describe("ChooseCharacterScreen", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockPush.mockClear();
    mockCreateCharacter.mockClear();
    (updateUserCharacter as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should send a patch request with the correct data and navigate on a successful update", async () => {
    (updateUserCharacter as jest.Mock).mockResolvedValue({ success: true });

    const { getByPlaceholderText, getByText } = render(
      <ChooseCharacterScreen />
    );

    // Simulate typing in the name input.
    const input = getByPlaceholderText("Enter character name");
    fireEvent.changeText(input, "Arthur");

    // Flush debounce by advancing timers.
    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    // Tap the Continue button.
    const continueButton = getByText("Continue");
    fireEvent.press(continueButton);

    await waitFor(() => {
      // Ensure updateUserCharacter was called with the expected character object.
      expect(updateUserCharacter).toHaveBeenCalledWith({
        level: 1,
        currentXP: 0,
        xpToNextLevel: 100,
        type: "knight",
        name: "Arthur",
      });
      // Verify the navigation call.
      expect(mockPush).toHaveBeenCalledWith("/onboarding/screen-time-goal");
      // Verify the local store was updated.
      expect(mockCreateCharacter).toHaveBeenCalledWith("knight", "Arthur");
    });
  });

  it("should gracefully handle a failed API request and still navigate", async () => {
    (updateUserCharacter as jest.Mock).mockRejectedValue(
      new Error("API error")
    );

    const { getByPlaceholderText, getByText } = render(
      <ChooseCharacterScreen />
    );

    const input = getByPlaceholderText("Enter character name");
    fireEvent.changeText(input, "Merlin");

    // Flush debounce.
    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    const continueButton = getByText("Continue");
    fireEvent.press(continueButton);

    await waitFor(() => {
      expect(updateUserCharacter).toHaveBeenCalledWith({
        level: 1,
        currentXP: 0,
        xpToNextLevel: 100,
        type: "knight", // The default selected character, per the mock, is the first one.
        name: "Merlin",
      });
      // Even on API error, we navigate to the next screen.
      expect(mockPush).toHaveBeenCalledWith("/onboarding/screen-time-goal");
      expect(mockCreateCharacter).toHaveBeenCalledWith("knight", "Merlin");
    });
  });
});
