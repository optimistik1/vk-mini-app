export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/src/__tests__/__mocks__/fileMock.ts',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@vkontakte/icons$': '<rootDir>/src/__tests__/__mocks__/vkIconsMock.ts',
    '^@vkontakte/icons/dist/(.*)$': '<rootDir>/src/__tests__/__mocks__/vkIconsMock.ts',
    '^../utils/analytics$': '<rootDir>/src/__tests__/__mocks__/analytics.ts',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(\\@vkontakte/icons|\\@vkontakte/icons-sprite)/)',
  ],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/eruda.ts',
    '!src/vite-env.d.ts',
    '!src/App.tsx',
    '!src/AppConfig.tsx',
    '!src/routes.ts',
    '!src/utils/transformVKBridgeAdaptivity.ts',
    '!src/panels/**/*.tsx',
    '!src/api/**/*.ts',
    '!src/hooks/useSound.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 20,
      functions: 30,
      lines: 25,
      statements: 25,
    },
  },
  testMatch: [
    '<rootDir>/src/__tests__/**/*.test.{ts,tsx}',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};