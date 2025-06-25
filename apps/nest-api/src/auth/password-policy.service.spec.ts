import { Test, TestingModule } from '@nestjs/testing';
import { PasswordPolicyService } from './password-policy.service';

// Mock zxcvbn module
jest.mock('zxcvbn', () => jest.fn());

describe('PasswordPolicyService', () => {
  let service: PasswordPolicyService;
  let mockZxcvbn: jest.Mock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PasswordPolicyService],
    }).compile();

    service = module.get<PasswordPolicyService>(PasswordPolicyService);

    // Get the mock function
    mockZxcvbn = require('zxcvbn') as jest.Mock;

    // Reset mock before each test
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validatePassword', () => {
    it('should consider password valid with score >= 3', () => {
      // Setup mock for this test
      mockZxcvbn.mockReturnValue({
        score: 3,
        guesses: 1000000,
        guesses_log10: 6,
        crack_times_seconds: { online_throttling_100_per_hour: 36000 },
        crack_times_display: { online_throttling_100_per_hour: '10 hours' },
        feedback: { warning: '', suggestions: [] },
        sequence: [],
      } as any);

      const result = service.validatePassword(
        'StrongP@ss123',
        'test@example.com',
        'Test User',
      );
      expect(result.isValid).toBe(true);
    });

    it('should consider password invalid with score < 3', () => {
      // Setup mock for this test
      mockZxcvbn.mockReturnValue({
        score: 2,
        guesses: 1000,
        guesses_log10: 3,
        crack_times_seconds: { online_throttling_100_per_hour: 36 },
        crack_times_display: { online_throttling_100_per_hour: '36 seconds' },
        feedback: { warning: '', suggestions: ['Add more complexity'] },
        sequence: [],
      } as any);

      const result = service.validatePassword(
        'simple123',
        'test@example.com',
        'Test User',
      );
      expect(result.isValid).toBe(false);
    });
  });

  describe('specific password validations', () => {
    it('should check minimum length', () => {
      expect(service.hasMinimumLength('12345678')).toBe(true);
      expect(service.hasMinimumLength('1234567')).toBe(false);
    });

    it('should check for uppercase characters', () => {
      expect(service.hasUppercase('abcDef')).toBe(true);
      expect(service.hasUppercase('abcdef')).toBe(false);
    });

    it('should check for lowercase characters', () => {
      expect(service.hasLowercase('ABcDEF')).toBe(true);
      expect(service.hasLowercase('ABCDEF')).toBe(false);
    });

    it('should check for numbers', () => {
      expect(service.hasNumbers('abc123')).toBe(true);
      expect(service.hasNumbers('abcdef')).toBe(false);
    });

    it('should check for special characters', () => {
      expect(service.hasSpecialCharacters('abc@123')).toBe(true);
      expect(service.hasSpecialCharacters('abc123')).toBe(false);
    });
  });
});
