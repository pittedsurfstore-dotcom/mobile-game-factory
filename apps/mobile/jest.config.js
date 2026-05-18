module.exports = {
  displayName: '@mgf/mobile',
  preset: 'jest-expo',
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/src/**/*.test.ts?(x)'],
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?@?react-native|@react-native-community|@react-navigation|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-clone-referenced-element|@react-native-async-storage|posthog-react-native|react-native-google-mobile-ads|react-native-purchases)',
  ],
};
