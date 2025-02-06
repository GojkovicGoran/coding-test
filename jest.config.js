const config = {
  transform: {
    '^.+\\.js$': ['babel-jest']
  },
  testEnvironment: 'node',
  moduleFileExtensions: ['js'],
  verbose: true,
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(module-that-needs-to-be-transformed)/)'
  ],
  testTimeout: 10000
};

export default config;
