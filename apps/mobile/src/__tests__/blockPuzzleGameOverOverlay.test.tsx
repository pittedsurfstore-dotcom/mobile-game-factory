import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { GameOverOverlay, continueButtonLabel } from '@mgf/block-puzzle';

const baseProps = {
  score: 0,
  usedContinue: false,
  waitingForAd: false,
  entitled: false,
  onContinue: () => {},
  onReset: () => {},
};

describe('continueButtonLabel', () => {
  it('shows "Loading ad…" while an ad is loading', () => {
    expect(continueButtonLabel(true, false)).toBe('Loading ad…');
    // even if entitled, the loading state wins (no ad is actually playing but UI is busy)
    expect(continueButtonLabel(true, true)).toBe('Loading ad…');
  });

  it('shows the ad-free wording when entitled', () => {
    expect(continueButtonLabel(false, true)).toMatch(/^Continue \(clear bottom \d+ rows\)$/);
  });

  it('shows the "watch ad" wording when not entitled', () => {
    expect(continueButtonLabel(false, false)).toMatch(/^Watch ad to clear bottom \d+ rows$/);
  });
});

describe('GameOverOverlay', () => {
  it('renders the Game Over text and the score', () => {
    const { getByText } = render(<GameOverOverlay {...baseProps} score={420} />);
    expect(getByText('Game Over')).toBeTruthy();
    expect(getByText('Score 420')).toBeTruthy();
  });

  it('shows the watch-ad button by default and the play-again button', () => {
    const { getByText } = render(<GameOverOverlay {...baseProps} />);
    expect(getByText(continueButtonLabel(false, false))).toBeTruthy();
    expect(getByText('Play again')).toBeTruthy();
  });

  it('swaps the button label when the user owns the no_ads entitlement', () => {
    const { getByText, queryByText } = render(<GameOverOverlay {...baseProps} entitled />);
    expect(getByText(continueButtonLabel(false, true))).toBeTruthy();
    expect(queryByText(continueButtonLabel(false, false))).toBeNull();
  });

  it('shows the loading label while an ad is in flight', () => {
    const { getByText } = render(<GameOverOverlay {...baseProps} waitingForAd />);
    expect(getByText('Loading ad…')).toBeTruthy();
  });

  it('hides the continue button after the player has used their one continue', () => {
    const { queryByText } = render(<GameOverOverlay {...baseProps} usedContinue />);
    expect(queryByText(continueButtonLabel(false, false))).toBeNull();
    expect(queryByText(continueButtonLabel(false, true))).toBeNull();
    expect(queryByText('Loading ad…')).toBeNull();
  });

  it('invokes onContinue when the continue button is pressed', () => {
    const onContinue = jest.fn();
    const { getByText } = render(<GameOverOverlay {...baseProps} onContinue={onContinue} />);
    fireEvent.press(getByText(continueButtonLabel(false, false)));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('invokes onReset when Play again is pressed', () => {
    const onReset = jest.fn();
    const { getByText } = render(<GameOverOverlay {...baseProps} onReset={onReset} />);
    fireEvent.press(getByText('Play again'));
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
