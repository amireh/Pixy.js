module.exports = {
  tests: {
    options: {
      keepalive: false,
      port: 8003
    }
  },

  docs: {
    options: {
      keepalive: true,
      port: 8001,
      base: "doc"
    }
  },

  browser_tests: {
    options: {
      keepalive: true,
      port: 8002
    }
  }
};
