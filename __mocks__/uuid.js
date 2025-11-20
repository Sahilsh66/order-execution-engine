// __mocks__/uuid.js
module.exports = {
    v4: () => "test-uuid-" + Math.random().toString(36).substring(2, 10),
  };
  