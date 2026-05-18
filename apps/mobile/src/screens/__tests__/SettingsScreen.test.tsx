import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { setAnalytics } from '@mgf/analytics';
import { type IAP, type Product, setIAP } from '@mgf/monetization';
import { NOADS_PRODUCT_ID, SettingsScreen } from '../SettingsScreen';

function makeIAP(overrides: Partial<IAP> = {}): IAP {
  return {
    productIds: () => [],
    async getProducts() {
      return [];
    },
    async purchase() {
      return { purchased: false };
    },
    async restore() {},
    isEntitled: () => false,
    ...overrides,
  };
}

const noopAnalytics = {
  identify: () => {},
  track: () => {},
  screen: () => {},
};

const NO_ADS_PRODUCT: Product = {
  id: NOADS_PRODUCT_ID,
  priceString: '$2.99',
  title: 'Remove ads',
};

describe('SettingsScreen', () => {
  beforeEach(() => {
    setAnalytics(noopAnalytics);
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders both Remove ads and Restore sections', () => {
    setIAP(makeIAP());
    const { getAllByText, getByText } = render(<SettingsScreen />);
    // "Remove ads" appears both as section heading and as the button label, so use getAllByText
    expect(getAllByText('Remove ads').length).toBeGreaterThan(0);
    expect(getByText('Restore')).toBeTruthy();
    expect(getByText('Restore purchases')).toBeTruthy();
  });

  it('shows the entitled confirmation when no_ads is owned', () => {
    setIAP(makeIAP({ isEntitled: (id) => id === 'no_ads' }));
    const { getByText, queryByText } = render(<SettingsScreen />);
    expect(getByText(/Ads removed/i)).toBeTruthy();
    // Buy button is not rendered when entitled
    expect(queryByText(/^Remove ads —/)).toBeNull();
  });

  it('shows the real price string when getProducts returns the no-ads SKU', async () => {
    setIAP(makeIAP({ getProducts: async () => [NO_ADS_PRODUCT] }));
    const { findByText } = render(<SettingsScreen />);
    expect(await findByText(`Remove ads — ${NO_ADS_PRODUCT.priceString}`)).toBeTruthy();
  });

  it('shows the not-configured message when getProducts is empty', async () => {
    setIAP(makeIAP({ getProducts: async () => [] }));
    const { findByText } = render(<SettingsScreen />);
    expect(await findByText(/not configured in this build/i)).toBeTruthy();
  });

  it('calls iap.purchase(NOADS_PRODUCT_ID) when the buy button is pressed', async () => {
    const purchase = jest.fn(async () => ({ purchased: true }));
    setIAP(makeIAP({ getProducts: async () => [NO_ADS_PRODUCT], purchase }));
    const { findByText } = render(<SettingsScreen />);
    const buyBtn = await findByText(`Remove ads — ${NO_ADS_PRODUCT.priceString}`);
    await act(async () => {
      fireEvent.press(buyBtn);
    });
    await waitFor(() => expect(purchase).toHaveBeenCalledWith(NOADS_PRODUCT_ID));
  });

  it('alerts on a cancelled purchase', async () => {
    setIAP(
      makeIAP({ getProducts: async () => [NO_ADS_PRODUCT], purchase: async () => ({ purchased: false }) }),
    );
    const { findByText } = render(<SettingsScreen />);
    const buyBtn = await findByText(`Remove ads — ${NO_ADS_PRODUCT.priceString}`);
    await act(async () => {
      fireEvent.press(buyBtn);
    });
    await waitFor(() => expect(Alert.alert).toHaveBeenCalled());
  });

  it('calls iap.restore when the restore button is pressed and reports the result', async () => {
    const restore = jest.fn(async () => {});
    setIAP(makeIAP({ restore }));
    const { getByText } = render(<SettingsScreen />);
    await act(async () => {
      fireEvent.press(getByText('Restore purchases'));
    });
    await waitFor(() => expect(restore).toHaveBeenCalled());
    await waitFor(() => expect(Alert.alert).toHaveBeenCalled());
  });
});
