import { modules } from '../modules';

describe('Modules Data', () => {
  test('should have 6 modules', () => {
    expect(modules).toHaveLength(6);
  });

  test('all modules should have required properties', () => {
    modules.forEach(module => {
      expect(module).toHaveProperty('id');
      expect(module).toHaveProperty('title');
      expect(module).toHaveProperty('description');
      expect(module).toHaveProperty('icon');
      expect(module).toHaveProperty('estimatedTime');
      expect(module).toHaveProperty('difficulty');
      expect(module).toHaveProperty('content');
    });
  });
});