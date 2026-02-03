// Mock chrome API for tests
global.chrome = {
  storage: {
    local: {
      get: jest.fn((keys, callback) => {
        if (callback) callback({});
        return Promise.resolve({});
      }),
      set: jest.fn((items, callback) => {
        if (callback) callback();
        return Promise.resolve();
      })
    }
  },
  runtime: {
    sendMessage: jest.fn(),
    lastError: null
  }
};

// Mock window.location
delete window.location;
window.location = {
  href: 'https://test.service-now.com/incident_list.do',
  hostname: 'test.service-now.com'
};
