import { fireEvent, render } from '@testing-library/react-native';
import blockPuzzle from '@mgf/block-puzzle';
import { setAnalytics } from '@mgf/analytics';
import { setIAP } from '@mgf/monetization';

// Match the noop shape used by other tests so the component never sees a real
// vendor SDK during render. Same injection-seam pattern as SettingsScreen.
const noopAnalytics = { identify: () => {}, track: () => {}, screen: () => {} };
const noopIAP = {
  productIds: () => [] as const,
  async getProducts() {
    return [];
  },
  async purchase() {
    return { purchased: false };
  },
  async restore() {},
  isEntitled: () => false,
};

const BlockPuzzleScreen = blockPuzzle.Screen;

describe('Block Puzzle screen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    setAnalytics(noopAnalytics);
    setIAP(noopIAP);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the HUD with an initial score and best', () => {
    const { getByText } = render(<BlockPuzzleScreen />);
    expect(getByText(/Score 0/)).toBeTruthy();
    expect(getByText(/Best 0/)).toBeTruthy();
  });

  it('renders all four control buttons with the expected glyphs', () => {
    const { getByText } = render(<BlockPuzzleScreen />);
    // ◀ ⟳ ▼ ▶ — left / rotate / drop / right
    expect(getByText('◀')).toBeTruthy();
    expect(getByText('⟳')).toBeTruthy();
    expect(getByText('▼')).toBeTruthy();
    expect(getByText('▶')).toBeTruthy();
  });

  it('does not throw when each control button is pressed', () => {
    const { getByText } = render(<BlockPuzzleScreen />);
    expect(() => {
      fireEvent.press(getByText('◀'));
      fireEvent.press(getByText('⟳'));
      fireEvent.press(getByText('▶'));
      fireEvent.press(getByText('▼'));
    }).not.toThrow();
  });

  it('does not show the game-over overlay on initial mount', () => {
    const { queryByText } = render(<BlockPuzzleScreen />);
    expect(queryByText('Game Over')).toBeNull();
    expect(queryByText(/Watch ad to clear bottom/)).toBeNull();
  });
});
