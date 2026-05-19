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

/**
 * Renders the screen and flushes the initial async getProducts() microtask
 * before returning, so the surrounding test never witnesses the post-mount
 * setState and React stops warning about updates outside act(...).
 */
async function renderSettings() {
  const result = render(<SettingsScreen />);
  // flush the initial useEffect's async getProducts() microtask so React stops
  // warning about updates outside act(...)
  await act(async () => {});
  return result;
}

describe('SettingsScreen', () => {
  beforeEach(() => {
    setAnalytics(noopAnalytics);
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders both Remove ads and Restore sections', async () => {
    setIAP(makeIAP());
    const { getAllByText, getByText } = await renderSettings();
    expect(getAllByText('Remove ads').length).toBeGreaterThan(0);
    expect(getByText('Restore')).toBeTruthy();
    expect(getByText('Restore purchases')).toBeTruthy();
  });

  it('shows the entitled confirmation when no_ads is owned', async () => {
    setIAP(makeIAP({ isEntitled: (id) => id === 'no_ads' }));
    const { getByText, queryByText } = await renderSettings();
    expect(getByText(/Ads removed/i)).toBeTruthy();
    expect(queryByText(/^Remove ads —/)).toBeNull();
  });

  it('shows the real price string when getProducts returns the no-ads SKU', async () => {
    setIAP(makeIAP({ getProducts: async () => [NO_ADS_PRODUCT] }));
    const { getByText } = await renderSettings();
    expect(getByText(`Remove ads — ${NO_ADS_PRODUCT.priceString}`)).toBeTruthy();
  });

  it('shows the not-configured message when getProducts is empty', async () => {
    setIAP(makeIAP({ getProducts: async () => [] }));
    const { getByText } = await renderSettings();
    expect(getByText(/not configured in this build/i)).toBeTruthy();
  });

  it('calls iap.purchase(NOADS_PRODUCT_ID) when the buy button is pressed', async () => {
    const purchase = jest.fn(async () => ({ purchased: true }));
    setIAP(makeIAP({ getProducts: async () => [NO_ADS_PRODUCT], purchase }));
    const { getByText } = await renderSettings();
    const buyBtn = getByText(`Remove ads — ${NO_ADS_PRODUCT.priceString}`);
    await act(async () => {
      fireEvent.press(buyBtn);
    });
    await waitFor(() => expect(purchase).toHaveBeenCalledWith(NOADS_PRODUCT_ID));
  });

  it('alerts on a cancelled purchase', async () => {
    setIAP(
      makeIAP({ getProducts: async () => [NO_ADS_PRODUCT], purchase: async () => ({ purchased: false }) }),
    );
    const { getByText } = await renderSettings();
    const buyBtn = getByText(`Remove ads — ${NO_ADS_PRODUCT.priceString}`);
    await act(async () => {
      fireEvent.press(buyBtn);
    });
    await waitFor(() => expect(Alert.alert).toHaveBeenCalled());
  });

  it('calls iap.restore when the restore button is pressed and reports the result', async () => {
    const restore = jest.fn(async () => {});
    setIAP(makeIAP({ restore }));
    const { getByText } = await renderSettings();
    await act(async () => {
      fireEvent.press(getByText('Restore purchases'));
    });
    await waitFor(() => expect(restore).toHaveBeenCalled());
    await waitFor(() => expect(Alert.alert).toHaveBeenCalled());
  });
});
