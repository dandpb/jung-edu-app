export const OpenAI = jest.fn().mockImplementation(() => ({
  chat: {
    completions: {
      create: jest.fn()
    }
  },
  models: {
    list: jest.fn()
  }
}));