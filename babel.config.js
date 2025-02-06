const config = {
  presets: [
    ['@babel/preset-env', {
      targets: {
        node: 'current'
      },
      modules: 'auto'
    }]
  ]
};

export default config;