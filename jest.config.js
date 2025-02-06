const config = {
  transform: {
    '^.+\\.js$': ['babel-jest', { configFile: './babel.config.js' }]
  },
  testEnvironment: 'node',
  moduleFileExtensions: ['js'],
  verbose: true,
  extensionsToTreatAsEsm: ['.js'],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  }
};

export default config;
