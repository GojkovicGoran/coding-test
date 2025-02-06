const config = {
  presets: [
    ['@babel/preset-env', {
      targets: {
        node: 'current'
      },
      modules: false
    }]
  ]
};

export default config;