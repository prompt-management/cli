import { parseDate, formatCommitMessage } from '../src/utils';
import dayjs from 'dayjs';

describe('Utils', () => {
  describe('parseDate', () => {
    it('should parse standard date formats', () => {
      const date1 = parseDate('2024-01-15');
      expect(date1?.format('YYYY-MM-DD')).toBe('2024-01-15');

      const date2 = parseDate('2024-01-15 14:30');
      expect(date2?.format('YYYY-MM-DD HH:mm')).toBe('2024-01-15 14:30');
    });

    it('should parse relative dates', () => {
      const date = parseDate('7 days ago');
      const expected = dayjs().subtract(7, 'day');
      expect(date?.format('YYYY-MM-DD')).toBe(expected.format('YYYY-MM-DD'));
    });

    it('should parse special keywords', () => {
      const today = parseDate('today');
      expect(today?.format('YYYY-MM-DD')).toBe(dayjs().format('YYYY-MM-DD'));

      const yesterday = parseDate('yesterday');
      expect(yesterday?.format('YYYY-MM-DD')).toBe(dayjs().subtract(1, 'day').format('YYYY-MM-DD'));
    });

    it('should return null for invalid dates', () => {
      expect(parseDate('invalid-date')).toBeNull();
    });
  });

  describe('formatCommitMessage', () => {
    it('should replace {title} placeholder', () => {
      const template = 'Update prompt: {title}';
      const title = 'My Test Prompt';
      const result = formatCommitMessage(template, title);
      expect(result).toBe('Update prompt: My Test Prompt');
    });

    it('should handle templates without placeholder', () => {
      const template = 'Update prompts';
      const title = 'My Test Prompt';
      const result = formatCommitMessage(template, title);
      expect(result).toBe('Update prompts');
    });
  });
});