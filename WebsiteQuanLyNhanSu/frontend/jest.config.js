/**
 * @type {import('jest').Config}
 */
export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.test.js',
    '<rootDir>/src/**/*.test.js',
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/../tests/**/*.test.js'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^../../../frontend/(.*)$': '<rootDir>/$1',
    '^../../../backend/(.*)$': '<rootDir>/../backend/$1',
    '^../utils/notifications.js$': '<rootDir>/src/__mocks__/notifications.js'
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },
  transform: {
    '^.+\\.(js|jsx|mjs)$': 'babel-jest'
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(bson|mongoose|mongodb|bcryptjs|axios|socket\\.io)/)'
  ],
  moduleFileExtensions: ['js', 'jsx', 'mjs', 'json'],
  testPathIgnorePatterns: ['/node_modules/']
};
