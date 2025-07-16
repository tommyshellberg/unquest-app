import type { PaginateQuery } from '../types';
import {
  DEFAULT_LIMIT,
  getNextPageParam,
  getPreviousPageParam,
  getQueryKey,
  getUrlParameters,
  normalizePages,
} from './utils';

describe('API Utils', () => {
  describe('DEFAULT_LIMIT', () => {
    it('should have the correct default limit value', () => {
      expect(DEFAULT_LIMIT).toBe(10);
    });
  });

  describe('getQueryKey', () => {
    it('should return query key with just the key when no params provided', () => {
      const result = getQueryKey('test-key');
      expect(result).toEqual(['test-key']);
    });

    it('should return query key with params when provided', () => {
      const params = { id: 123, name: 'test' };
      const result = getQueryKey('test-key', params);
      expect(result).toEqual(['test-key', params]);
    });

    it('should handle empty params object', () => {
      const result = getQueryKey('test-key', {});
      expect(result).toEqual(['test-key', {}]);
    });

    it('should handle null params', () => {
      const result = getQueryKey('test-key', null);
      expect(result).toEqual(['test-key']);
    });

    it('should handle undefined params', () => {
      const result = getQueryKey('test-key', undefined);
      expect(result).toEqual(['test-key']);
    });

    it('should handle complex params object', () => {
      const params = {
        page: 1,
        limit: 20,
        filter: { active: true },
        sort: ['name', 'date'],
      };
      const result = getQueryKey('complex-key', params);
      expect(result).toEqual(['complex-key', params]);
    });

    it('should handle different key types', () => {
      expect(getQueryKey('users')).toEqual(['users']);
      expect(getQueryKey('nested/path/to/resource')).toEqual([
        'nested/path/to/resource',
      ]);
    });
  });

  describe('normalizePages', () => {
    it('should flatten pages with results into a single array', () => {
      const pages: PaginateQuery<{ id: number; name: string }>[] = [
        {
          results: [
            { id: 1, name: 'Item 1' },
            { id: 2, name: 'Item 2' },
          ],
          count: 2,
          next: null,
          previous: null,
        },
        {
          results: [
            { id: 3, name: 'Item 3' },
            { id: 4, name: 'Item 4' },
          ],
          count: 2,
          next: null,
          previous: null,
        },
      ];

      const result = normalizePages(pages);
      expect(result).toEqual([
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' },
        { id: 4, name: 'Item 4' },
      ]);
    });

    it('should handle empty pages array', () => {
      const result = normalizePages([]);
      expect(result).toEqual([]);
    });

    it('should handle undefined pages', () => {
      const result = normalizePages(undefined);
      expect(result).toEqual([]);
    });

    it('should handle pages with empty results', () => {
      const pages: PaginateQuery<any>[] = [
        {
          results: [],
          count: 0,
          next: null,
          previous: null,
        },
      ];

      const result = normalizePages(pages);
      expect(result).toEqual([]);
    });

    it('should handle pages with mixed empty and non-empty results', () => {
      const pages: PaginateQuery<{ id: number }>[] = [
        {
          results: [{ id: 1 }],
          count: 1,
          next: null,
          previous: null,
        },
        {
          results: [],
          count: 0,
          next: null,
          previous: null,
        },
        {
          results: [{ id: 2 }, { id: 3 }],
          count: 2,
          next: null,
          previous: null,
        },
      ];

      const result = normalizePages(pages);
      expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
    });

    it('should handle pages with different result types', () => {
      const pages: PaginateQuery<number>[] = [
        {
          results: [1, 2, 3],
          count: 3,
          next: null,
          previous: null,
        },
        {
          results: [4, 5],
          count: 2,
          next: null,
          previous: null,
        },
      ];

      const result = normalizePages(pages);
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    it('should handle large number of pages', () => {
      const pages: PaginateQuery<number>[] = Array.from(
        { length: 100 },
        (_, i) => ({
          results: [i],
          count: 1,
          next: null,
          previous: null,
        })
      );

      const result = normalizePages(pages);
      expect(result).toEqual(Array.from({ length: 100 }, (_, i) => i));
    });
  });

  describe('getUrlParameters', () => {
    it('should parse URL parameters correctly', () => {
      const url = 'https://example.com/api?page=1&limit=10&search=test';
      const result = getUrlParameters(url);
      expect(result).toEqual({
        page: '1',
        limit: '10',
        search: 'test',
      });
    });

    it('should handle URL with no parameters', () => {
      const url = 'https://example.com/api';
      const result = getUrlParameters(url);
      expect(result).toEqual({});
    });

    it('should handle null URL', () => {
      const result = getUrlParameters(null);
      expect(result).toBeNull();
    });

    it('should handle empty string URL', () => {
      const result = getUrlParameters('');
      expect(result).toEqual({});
    });

    it('should handle URL with only question mark', () => {
      const url = 'https://example.com/api?';
      const result = getUrlParameters(url);
      expect(result).toEqual({});
    });

    it('should handle URL with empty parameter values', () => {
      const url = 'https://example.com/api?page=&limit=10&search=';
      const result = getUrlParameters(url);
      expect(result).toEqual({
        page: '',
        limit: '10',
        search: '',
      });
    });

    it('should handle URL with special characters in parameters', () => {
      const url =
        'https://example.com/api?search=hello%20world&filter=id%3D123';
      const result = getUrlParameters(url);
      expect(result).toEqual({
        search: 'hello%20world',
        filter: 'id%3D123',
      });
    });

    it('should handle URL with duplicate parameter names (last one wins)', () => {
      const url = 'https://example.com/api?page=1&page=2&page=3';
      const result = getUrlParameters(url);
      expect(result).toEqual({
        page: '3',
      });
    });

    it('should handle URL with ampersand in parameter value', () => {
      const url = 'https://example.com/api?param1=value1&param2=value2';
      const result = getUrlParameters(url);
      expect(result).toEqual({
        param1: 'value1',
        param2: 'value2',
      });
    });

    it('should handle URL with only fragments', () => {
      const url = 'https://example.com/api#section1';
      const result = getUrlParameters(url);
      expect(result).toEqual({});
    });

    it('should handle URL with both parameters and fragments', () => {
      const url = 'https://example.com/api?page=1&limit=10#section1';
      const result = getUrlParameters(url);
      expect(result).toEqual({
        page: '1',
        limit: '10',
      });
    });

    it('should handle complex URL with multiple query parameters', () => {
      const url =
        'https://api.example.com/v1/users?offset=20&limit=10&sort=name&order=asc&filter=active&include=profile';
      const result = getUrlParameters(url);
      expect(result).toEqual({
        offset: '20',
        limit: '10',
        sort: 'name',
        order: 'asc',
        filter: 'active',
        include: 'profile',
      });
    });

    it('should handle URL with equal sign in parameter value', () => {
      const url = 'https://example.com/api?equation=x%3D2%2By';
      const result = getUrlParameters(url);
      expect(result).toEqual({
        equation: 'x%3D2%2By',
      });
    });

    it('should handle relative URLs', () => {
      const url = '/api/users?page=1&limit=10';
      const result = getUrlParameters(url);
      expect(result).toEqual({
        page: '1',
        limit: '10',
      });
    });

    it('should handle URLs with port numbers', () => {
      const url = 'http://localhost:3000/api?page=1';
      const result = getUrlParameters(url);
      expect(result).toEqual({
        page: '1',
      });
    });
  });

  describe('getPreviousPageParam', () => {
    it('should return offset from previous URL', () => {
      const page: PaginateQuery<any> = {
        results: [],
        count: 0,
        next: null,
        previous: 'https://api.example.com/items?offset=10&limit=10',
      };

      const result = getPreviousPageParam(page);
      expect(result).toBe('10');
    });

    it('should return null when previous URL is null', () => {
      const page: PaginateQuery<any> = {
        results: [],
        count: 0,
        next: null,
        previous: null,
      };

      const result = getPreviousPageParam(page);
      expect(result).toBeNull();
    });

    it('should return null when previous URL has no offset parameter', () => {
      const page: PaginateQuery<any> = {
        results: [],
        count: 0,
        next: null,
        previous: 'https://api.example.com/items?limit=10',
      };

      const result = getPreviousPageParam(page);
      expect(result).toBeNull();
    });

    it('should handle previous URL with multiple parameters', () => {
      const page: PaginateQuery<any> = {
        results: [],
        count: 0,
        next: null,
        previous: 'https://api.example.com/items?offset=20&limit=10&sort=name',
      };

      const result = getPreviousPageParam(page);
      expect(result).toBe('20');
    });

    it('should handle previous URL with offset=0', () => {
      const page: PaginateQuery<any> = {
        results: [],
        count: 0,
        next: null,
        previous: 'https://api.example.com/items?offset=0&limit=10',
      };

      const result = getPreviousPageParam(page);
      expect(result).toBe('0');
    });

    it('should handle malformed previous URL', () => {
      const page: PaginateQuery<any> = {
        results: [],
        count: 0,
        next: null,
        previous: 'not-a-valid-url',
      };

      const result = getPreviousPageParam(page);
      expect(result).toBeNull();
    });
  });

  describe('getNextPageParam', () => {
    it('should return offset from next URL', () => {
      const page: PaginateQuery<any> = {
        results: [],
        count: 0,
        next: 'https://api.example.com/items?offset=20&limit=10',
        previous: null,
      };

      const result = getNextPageParam(page);
      expect(result).toBe('20');
    });

    it('should return null when next URL is null', () => {
      const page: PaginateQuery<any> = {
        results: [],
        count: 0,
        next: null,
        previous: null,
      };

      const result = getNextPageParam(page);
      expect(result).toBeNull();
    });

    it('should return null when next URL has no offset parameter', () => {
      const page: PaginateQuery<any> = {
        results: [],
        count: 0,
        next: 'https://api.example.com/items?limit=10',
        previous: null,
      };

      const result = getNextPageParam(page);
      expect(result).toBeNull();
    });

    it('should handle next URL with multiple parameters', () => {
      const page: PaginateQuery<any> = {
        results: [],
        count: 0,
        next: 'https://api.example.com/items?offset=30&limit=10&sort=name',
        previous: null,
      };

      const result = getNextPageParam(page);
      expect(result).toBe('30');
    });

    it('should handle next URL with offset=0', () => {
      const page: PaginateQuery<any> = {
        results: [],
        count: 0,
        next: 'https://api.example.com/items?offset=0&limit=10',
        previous: null,
      };

      const result = getNextPageParam(page);
      expect(result).toBe('0');
    });

    it('should handle malformed next URL', () => {
      const page: PaginateQuery<any> = {
        results: [],
        count: 0,
        next: 'not-a-valid-url',
        previous: null,
      };

      const result = getNextPageParam(page);
      expect(result).toBeNull();
    });

    it('should handle next URL with large offset values', () => {
      const page: PaginateQuery<any> = {
        results: [],
        count: 0,
        next: 'https://api.example.com/items?offset=1000000&limit=10',
        previous: null,
      };

      const result = getNextPageParam(page);
      expect(result).toBe('1000000');
    });

    it('should handle next URL with string offset values', () => {
      const page: PaginateQuery<any> = {
        results: [],
        count: 0,
        next: 'https://api.example.com/items?offset=abc&limit=10',
        previous: null,
      };

      const result = getNextPageParam(page);
      expect(result).toBe('abc');
    });
  });

  describe('Edge Cases and Integration', () => {
    it('should handle pagination flow correctly', () => {
      // Simulate a typical pagination flow
      const firstPage: PaginateQuery<{ id: number }> = {
        results: [{ id: 1 }, { id: 2 }],
        count: 100,
        next: 'https://api.example.com/items?offset=10&limit=10',
        previous: null,
      };

      const secondPage: PaginateQuery<{ id: number }> = {
        results: [{ id: 3 }, { id: 4 }],
        count: 100,
        next: 'https://api.example.com/items?offset=20&limit=10',
        previous: 'https://api.example.com/items?offset=0&limit=10',
      };

      // Test next page param
      expect(getNextPageParam(firstPage)).toBe('10');
      expect(getNextPageParam(secondPage)).toBe('20');

      // Test previous page param
      expect(getPreviousPageParam(firstPage)).toBeNull();
      expect(getPreviousPageParam(secondPage)).toBe('0');

      // Test normalizing pages
      const normalizedData = normalizePages([firstPage, secondPage]);
      expect(normalizedData).toEqual([
        { id: 1 },
        { id: 2 },
        { id: 3 },
        { id: 4 },
      ]);
    });

    it('should handle query key generation for paginated queries', () => {
      const baseKey = 'users';
      const paginationParams = { offset: 10, limit: 10 };

      const queryKey = getQueryKey(baseKey, paginationParams);
      expect(queryKey).toEqual(['users', { offset: 10, limit: 10 }]);
    });

    it('should handle URL parameter extraction from complex pagination URLs', () => {
      const complexUrl =
        'https://api.example.com/v1/users?offset=50&limit=25&sort=created_at&order=desc&filter=active&search=john';
      const params = getUrlParameters(complexUrl);

      expect(params).toEqual({
        offset: '50',
        limit: '25',
        sort: 'created_at',
        order: 'desc',
        filter: 'active',
        search: 'john',
      });
    });
  });
});
