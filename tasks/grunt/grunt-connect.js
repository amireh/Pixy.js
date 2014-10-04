module.exports = {
  tests: {
    options: {
      keepalive: false,
      hostname: '*',
      port: 10113
    }
  },

  docs: {
    options: {
      keepalive: true,
      port: 10114,
      base: "doc"
    }
  },

  browser_tests: {
    options: {
      keepalive: true,
      port: 10115
    }
  }
};
