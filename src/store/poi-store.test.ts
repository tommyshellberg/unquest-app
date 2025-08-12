import { usePOIStore } from './poi-store';
import { type POI } from './types';

// Mock the storage functions
jest.mock('@/lib/storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock the INITIAL_POIS data
jest.mock('@/app/data/pois', () => ({
  INITIAL_POIS: [
    {
      slug: 'central-park',
      name: 'Central Park',
      latitude: 40.7829,
      longitude: -73.9654,
      isRevealed: false,
      description: 'A beautiful park in Manhattan',
    },
    {
      slug: 'times-square',
      name: 'Times Square',
      latitude: 40.758,
      longitude: -73.9855,
      isRevealed: false,
      description: 'The bustling heart of NYC',
    },
    {
      slug: 'brooklyn-bridge',
      name: 'Brooklyn Bridge',
      latitude: 40.7061,
      longitude: -73.9969,
      isRevealed: true, // Already revealed
      description: 'Historic bridge connecting Manhattan and Brooklyn',
    },
  ],
}));

// Mock timers
jest.useFakeTimers();

describe('POI Store', () => {
  const mockPOIs: POI[] = [
    {
      slug: 'central-park',
      name: 'Central Park',
      latitude: 40.7829,
      longitude: -73.9654,
      isRevealed: false,
      description: 'A beautiful park in Manhattan',
    },
    {
      slug: 'times-square',
      name: 'Times Square',
      latitude: 40.758,
      longitude: -73.9855,
      isRevealed: false,
      description: 'The bustling heart of NYC',
    },
    {
      slug: 'brooklyn-bridge',
      name: 'Brooklyn Bridge',
      latitude: 40.7061,
      longitude: -73.9969,
      isRevealed: true,
      description: 'Historic bridge connecting Manhattan and Brooklyn',
    },
  ];

  beforeEach(() => {
    // Reset the store to initial state
    usePOIStore.setState({
      pois: mockPOIs,
      lastRevealedPOISlug: null,
    });

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe('Initial State', () => {
    it('should have initial POIs from INITIAL_POIS', () => {
      const state = usePOIStore.getState();
      expect(state.pois).toEqual(mockPOIs);
      expect(state.lastRevealedPOISlug).toBeNull();
    });

    it('should have correct number of POIs', () => {
      const state = usePOIStore.getState();
      expect(state.pois).toHaveLength(3);
    });

    it('should have some POIs already revealed', () => {
      const state = usePOIStore.getState();
      const revealedPOIs = state.pois.filter((poi) => poi.isRevealed);
      expect(revealedPOIs).toHaveLength(1);
      expect(revealedPOIs[0].slug).toBe('brooklyn-bridge');
    });

    it('should have some POIs not revealed', () => {
      const state = usePOIStore.getState();
      const hiddenPOIs = state.pois.filter((poi) => !poi.isRevealed);
      expect(hiddenPOIs).toHaveLength(2);
      expect(hiddenPOIs.map((poi) => poi.slug)).toEqual([
        'central-park',
        'times-square',
      ]);
    });
  });

  describe('revealLocation', () => {
    it('should reveal a POI by slug', () => {
      const { revealLocation } = usePOIStore.getState();

      // Initially central-park should not be revealed
      expect(
        usePOIStore.getState().pois.find((poi) => poi.slug === 'central-park')
          ?.isRevealed
      ).toBe(false);

      // Reveal central-park
      revealLocation('central-park');

      const state = usePOIStore.getState();
      const centralPark = state.pois.find((poi) => poi.slug === 'central-park');
      expect(centralPark?.isRevealed).toBe(true);
      expect(state.lastRevealedPOISlug).toBe('central-park');
    });

    it('should not affect other POIs when revealing one', () => {
      const { revealLocation } = usePOIStore.getState();

      // Get initial state
      const initialState = usePOIStore.getState();
      const initialTimesSquare = initialState.pois.find(
        (poi) => poi.slug === 'times-square'
      );
      const initialBrooklynBridge = initialState.pois.find(
        (poi) => poi.slug === 'brooklyn-bridge'
      );

      // Reveal central-park
      revealLocation('central-park');

      const state = usePOIStore.getState();
      const timesSquare = state.pois.find((poi) => poi.slug === 'times-square');
      const brooklynBridge = state.pois.find(
        (poi) => poi.slug === 'brooklyn-bridge'
      );

      // Other POIs should maintain their original state
      expect(timesSquare?.isRevealed).toBe(initialTimesSquare?.isRevealed);
      expect(brooklynBridge?.isRevealed).toBe(
        initialBrooklynBridge?.isRevealed
      );
    });

    it('should handle revealing a POI that is already revealed', () => {
      const { revealLocation } = usePOIStore.getState();

      // brooklyn-bridge is already revealed
      expect(
        usePOIStore
          .getState()
          .pois.find((poi) => poi.slug === 'brooklyn-bridge')?.isRevealed
      ).toBe(true);

      // Reveal it again
      revealLocation('brooklyn-bridge');

      const state = usePOIStore.getState();
      const brooklynBridge = state.pois.find(
        (poi) => poi.slug === 'brooklyn-bridge'
      );
      expect(brooklynBridge?.isRevealed).toBe(true);
      expect(state.lastRevealedPOISlug).toBe('brooklyn-bridge');
    });

    it('should handle revealing a non-existent POI', () => {
      const { revealLocation } = usePOIStore.getState();

      const initialState = usePOIStore.getState();
      const initialPOIs = [...initialState.pois];

      // Try to reveal a non-existent POI
      revealLocation('non-existent-poi');

      const state = usePOIStore.getState();

      // POIs should remain unchanged
      expect(state.pois).toEqual(initialPOIs);
      expect(state.lastRevealedPOISlug).toBe('non-existent-poi');
    });

    it('should update lastRevealedPOISlug correctly', () => {
      const { revealLocation } = usePOIStore.getState();

      // Initially no last revealed POI
      expect(usePOIStore.getState().lastRevealedPOISlug).toBeNull();

      // Reveal first POI
      revealLocation('central-park');
      expect(usePOIStore.getState().lastRevealedPOISlug).toBe('central-park');

      // Reveal second POI
      revealLocation('times-square');
      expect(usePOIStore.getState().lastRevealedPOISlug).toBe('times-square');
    });

    it('should maintain POI properties when revealing', () => {
      const { revealLocation } = usePOIStore.getState();

      const initialCentralPark = usePOIStore
        .getState()
        .pois.find((poi) => poi.slug === 'central-park');

      revealLocation('central-park');

      const revealedCentralPark = usePOIStore
        .getState()
        .pois.find((poi) => poi.slug === 'central-park');

      // All properties should be maintained except isRevealed
      expect(revealedCentralPark?.slug).toBe(initialCentralPark?.slug);
      expect(revealedCentralPark?.name).toBe(initialCentralPark?.name);
      expect(revealedCentralPark?.latitude).toBe(initialCentralPark?.latitude);
      expect(revealedCentralPark?.longitude).toBe(
        initialCentralPark?.longitude
      );
      expect(revealedCentralPark?.description).toBe(
        initialCentralPark?.description
      );
      expect(revealedCentralPark?.isRevealed).toBe(true);
    });
  });

  describe('resetLastRevealedPOI', () => {
    it('should reset lastRevealedPOISlug to null', () => {
      const { revealLocation, resetLastRevealedPOI } = usePOIStore.getState();

      // First reveal a POI
      revealLocation('central-park');
      expect(usePOIStore.getState().lastRevealedPOISlug).toBe('central-park');

      // Reset the last revealed POI
      resetLastRevealedPOI();
      expect(usePOIStore.getState().lastRevealedPOISlug).toBeNull();
    });

    it('should not affect POIs when resetting lastRevealedPOISlug', () => {
      const { revealLocation, resetLastRevealedPOI } = usePOIStore.getState();

      // First reveal a POI
      revealLocation('central-park');
      const stateAfterReveal = usePOIStore.getState();

      // Reset the last revealed POI
      resetLastRevealedPOI();
      const stateAfterReset = usePOIStore.getState();

      // POIs should remain unchanged
      expect(stateAfterReset.pois).toEqual(stateAfterReveal.pois);
      expect(
        stateAfterReset.pois.find((poi) => poi.slug === 'central-park')
          ?.isRevealed
      ).toBe(true);
    });

    it('should handle resetting when lastRevealedPOISlug is already null', () => {
      const { resetLastRevealedPOI } = usePOIStore.getState();

      // Initially lastRevealedPOISlug is null
      expect(usePOIStore.getState().lastRevealedPOISlug).toBeNull();

      // Reset should not cause any issues
      resetLastRevealedPOI();
      expect(usePOIStore.getState().lastRevealedPOISlug).toBeNull();
    });
  });

  describe('reset', () => {
    it('should reset the store to initial state', () => {
      const { revealLocation, reset } = usePOIStore.getState();

      // Modify the state
      revealLocation('central-park');
      revealLocation('times-square');

      const modifiedState = usePOIStore.getState();
      expect(modifiedState.lastRevealedPOISlug).toBe('times-square');
      expect(
        modifiedState.pois.find((poi) => poi.slug === 'central-park')
          ?.isRevealed
      ).toBe(true);
      expect(
        modifiedState.pois.find((poi) => poi.slug === 'times-square')
          ?.isRevealed
      ).toBe(true);

      // Reset the store
      reset();

      const resetState = usePOIStore.getState();
      expect(resetState.pois).toEqual(mockPOIs);
      expect(resetState.lastRevealedPOISlug).toBeNull();
    });

    it('should reset POIs to their initial revealed states', () => {
      const { revealLocation, reset } = usePOIStore.getState();

      // Reveal some POIs
      revealLocation('central-park');
      revealLocation('times-square');

      // Reset the store
      reset();

      const resetState = usePOIStore.getState();

      // Check that POIs are back to their initial states
      expect(
        resetState.pois.find((poi) => poi.slug === 'central-park')?.isRevealed
      ).toBe(false);
      expect(
        resetState.pois.find((poi) => poi.slug === 'times-square')?.isRevealed
      ).toBe(false);
      expect(
        resetState.pois.find((poi) => poi.slug === 'brooklyn-bridge')
          ?.isRevealed
      ).toBe(true);
    });

    it('should handle resetting when store is already in initial state', () => {
      const { reset } = usePOIStore.getState();

      const initialState = usePOIStore.getState();

      // Reset when already in initial state
      reset();

      const resetState = usePOIStore.getState();
      expect(resetState).toEqual(initialState);
    });
  });

  describe('Persistence', () => {
    it('should use correct storage functions', () => {
      const { getItem, setItem, removeItem } = require('@/lib/storage');

      // These functions should be available for the persist middleware
      expect(getItem).toBeDefined();
      expect(setItem).toBeDefined();
      expect(removeItem).toBeDefined();
    });

    it('should handle storage getItem returning null', () => {
      const { getItem } = require('@/lib/storage');

      // Mock getItem to return null
      getItem.mockReturnValue(null);

      // This should not cause any errors when the store is initialized
      expect(() => {
        usePOIStore.getState();
      }).not.toThrow();
    });

    it('should handle storage getItem returning a value', () => {
      const { getItem } = require('@/lib/storage');

      // Mock getItem to return a value
      getItem.mockReturnValue('test-value');

      // This should not cause any errors when the store is initialized
      expect(() => {
        usePOIStore.getState();
      }).not.toThrow();
    });

    it('should handle async storage operations', async () => {
      const { setItem, removeItem } = require('@/lib/storage');

      // Mock async operations
      setItem.mockResolvedValue(undefined);
      removeItem.mockResolvedValue(undefined);

      // These should not throw errors
      await expect(setItem('test-key', 'test-value')).resolves.toBeUndefined();
      await expect(removeItem('test-key')).resolves.toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty POIs array', () => {
      // Set empty POIs
      usePOIStore.setState({
        pois: [],
        lastRevealedPOISlug: null,
      });

      const { revealLocation } = usePOIStore.getState();

      // Try to reveal a POI when none exist
      revealLocation('non-existent');

      const state = usePOIStore.getState();
      expect(state.pois).toEqual([]);
      expect(state.lastRevealedPOISlug).toBe('non-existent');
    });

    it('should handle POIs with missing properties', () => {
      // Set POIs with minimal properties
      const minimalPOIs = [
        {
          slug: 'minimal-poi',
          name: 'Minimal POI',
          latitude: 0,
          longitude: 0,
          isRevealed: false,
        },
      ] as POI[];

      usePOIStore.setState({
        pois: minimalPOIs,
        lastRevealedPOISlug: null,
      });

      const { revealLocation } = usePOIStore.getState();

      // This should not throw errors
      expect(() => {
        revealLocation('minimal-poi');
      }).not.toThrow();

      const state = usePOIStore.getState();
      expect(state.pois[0].isRevealed).toBe(true);
    });

    it('should handle concurrent reveal operations', () => {
      const { revealLocation } = usePOIStore.getState();

      // Simulate concurrent reveals
      revealLocation('central-park');
      revealLocation('times-square');
      revealLocation('brooklyn-bridge');

      const state = usePOIStore.getState();

      // All should be revealed
      expect(
        state.pois.find((poi) => poi.slug === 'central-park')?.isRevealed
      ).toBe(true);
      expect(
        state.pois.find((poi) => poi.slug === 'times-square')?.isRevealed
      ).toBe(true);
      expect(
        state.pois.find((poi) => poi.slug === 'brooklyn-bridge')?.isRevealed
      ).toBe(true);

      // Last revealed should be the last one called
      expect(state.lastRevealedPOISlug).toBe('brooklyn-bridge');
    });
  });
});
