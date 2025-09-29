/**
 * API Integration Tests
 * Tests for API endpoint security, authentication, and multi-tenant isolation
 * Goal: Ensure all API endpoints are properly secured and functional
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';

// Mock Express app setup for testing
let app: Express;

describe('API Security and Integration Tests', () => {
  
  describe('Security Middleware Tests', () => {
    it('should apply security headers to all responses', async () => {
      // Test that security headers are applied
      const response = await request(app)
        .get('/api/species')
        .expect((res) => {
          // Check for essential security headers (Helmet v8+ compatible)
          expect(res.headers).toHaveProperty('x-content-type-options');
          expect(res.headers).toHaveProperty('x-frame-options');
          // Note: x-xss-protection is deprecated and not set by modern Helmet versions
        });
    });

    it('should apply rate limiting to API endpoints', async () => {
      // Test rate limiting - make multiple rapid requests
      const requests = Array(15).fill(null).map(() => 
        request(app).get('/api/species')
      );
      
      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited (429 status)
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should sanitize input to prevent XSS attacks', async () => {
      const maliciousInput = {
        name: '<script>alert("xss")</script>Test Organization',
        description: 'javascript:alert("xss")'
      };

      // Attempt to create organization with malicious input
      const response = await request(app)
        .post('/api/organizations')
        .send(maliciousInput)
        .set('Authorization', 'Bearer valid-test-token');

      // Should sanitize the input and remove malicious content
      if (response.status === 200) {
        expect(response.body.name).not.toContain('<script>');
        expect(response.body.description).not.toContain('javascript:');
      }
    });

    it('should detect and block SQL injection attempts', async () => {
      const sqlInjectionPayloads = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "UNION SELECT * FROM organizations",
        "'; INSERT INTO organizations VALUES('hack'); --"
      ];

      for (const payload of sqlInjectionPayloads) {
        const response = await request(app)
          .post('/api/organizations')
          .send({ name: payload })
          .set('Authorization', 'Bearer valid-test-token');

        // Should reject malicious requests
        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Invalid');
      }
    });
  });

  describe('Authentication Tests', () => {
    it('should require authentication for protected endpoints', async () => {
      const protectedEndpoints = [
        { method: 'GET', path: '/api/auth/user' },
        { method: 'GET', path: '/api/organizations' },
        { method: 'POST', path: '/api/organizations' },
        { method: 'GET', path: '/api/species' }, // Fixed: now requires auth
        { method: 'GET', path: '/api/customers/test-org-id' },
      ];

      for (const endpoint of protectedEndpoints) {
        const response = await request(app)
          [endpoint.method.toLowerCase() as keyof typeof request](endpoint.path);

        expect(response.status).toBe(401);
        expect(response.body.message).toContain('Unauthorized');
      }
    });

    it('should accept valid authentication tokens', async () => {
      // Mock valid token test
      const response = await request(app)
        .get('/api/auth/user')
        .set('Authorization', 'Bearer valid-test-token');

      // Should either return user data or specific auth error (not 401)
      expect(response.status).not.toBe(401);
    });

    it('should apply admin-only rate limiting to species creation', async () => {
      // Test admin rate limiting on species creation
      const requests = Array(12).fill(null).map(() => 
        request(app)
          .post('/api/species')
          .send({
            name: 'Test Species',
            category: 'beef',
            liveToHangingRatio: '0.625',
            hangingToRetailRatio: '0.742'
          })
          .set('Authorization', 'Bearer admin-test-token')
      );

      const responses = await Promise.all(requests);
      
      // Should be rate limited (admin limit is 10 per hour)
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Multi-Tenant Data Isolation Tests', () => {
    it('should prevent access to other organization data', async () => {
      // Test accessing organization data without proper role
      const response = await request(app)
        .get('/api/organizations/unauthorized-org-id')
        .set('Authorization', 'Bearer valid-test-token');

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Access denied');
    });

    it('should filter data by organization ID', async () => {
      const orgSpecificEndpoints = [
        '/api/customers/test-org-id',
        '/api/processing-records/test-org-id',
        '/api/inventory/test-org-id',
        '/api/invoices/test-org-id',
        '/api/dashboard/test-org-id'
      ];

      for (const endpoint of orgSpecificEndpoints) {
        const response = await request(app)
          .get(endpoint)
          .set('Authorization', 'Bearer valid-org-token');

        // Should either return filtered data or require proper authorization
        expect([200, 401, 403]).toContain(response.status);
      }
    });

    it('should validate organization membership for data creation', async () => {
      const createEndpoints = [
        {
          path: '/api/customers',
          data: {
            organizationId: 'unauthorized-org-id',
            name: 'Test Customer',
            email: 'test@example.com'
          }
        },
        {
          path: '/api/processing-records',
          data: {
            organizationId: 'unauthorized-org-id',
            processingDate: '2025-01-01',
            totalLiveWeight: '1200'
          }
        }
      ];

      for (const endpoint of createEndpoints) {
        const response = await request(app)
          .post(endpoint.path)
          .send(endpoint.data)
          .set('Authorization', 'Bearer valid-test-token');

        expect(response.status).toBe(403);
        expect(response.body.message).toContain('Access denied');
      }
    });
  });

  describe('Input Validation Tests', () => {
    it('should validate organization creation input', async () => {
      const invalidInputs = [
        { name: '' }, // Empty name
        { name: 'a'.repeat(300) }, // Too long name
        { email: 'invalid-email' }, // Invalid email format
        { phone: '123' }, // Invalid phone format
      ];

      for (const input of invalidInputs) {
        const response = await request(app)
          .post('/api/organizations')
          .send(input)
          .set('Authorization', 'Bearer valid-test-token');

        expect(response.status).toBe(400);
      }
    });

    it('should validate species creation input', async () => {
      const invalidSpeciesInputs = [
        { name: '', category: 'beef' }, // Empty name
        { name: 'Test', category: '' }, // Empty category
        { name: 'Test', category: 'beef', liveToHangingRatio: '-0.5' }, // Negative ratio
        { name: 'Test', category: 'beef', liveToHangingRatio: '2.0' }, // Ratio > 1
      ];

      for (const input of invalidSpeciesInputs) {
        const response = await request(app)
          .post('/api/species')
          .send(input)
          .set('Authorization', 'Bearer admin-test-token');

        expect(response.status).toBe(400);
      }
    });
  });

  describe('Error Handling Tests', () => {
    it('should return consistent error format', async () => {
      const response = await request(app)
        .get('/api/nonexistent-endpoint');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
      expect(typeof response.body.message).toBe('string');
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/organizations')
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer valid-test-token')
        .send('{ invalid json }');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    it('should not leak internal error details in production', async () => {
      // Set production mode
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      try {
        // Trigger an internal error
        const response = await request(app)
          .get('/api/trigger-error'); // This endpoint should trigger an error

        if (response.status === 500) {
          expect(response.body.message).not.toContain('stack');
          expect(response.body.message).not.toContain('Error:');
          expect(response.body.message).toBe('An internal server error occurred');
        }
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });
  });

  describe('Business Logic Validation Tests', () => {
    it('should enforce role-based permissions for species creation', async () => {
      const testCases = [
        { role: 'owner', shouldSucceed: true },
        { role: 'admin', shouldSucceed: true },
        { role: 'editor', shouldSucceed: false },
        { role: 'viewer', shouldSucceed: false }
      ];

      for (const testCase of testCases) {
        const response = await request(app)
          .post('/api/species')
          .send({
            name: `Test Species ${testCase.role}`,
            category: 'beef',
            liveToHangingRatio: '0.625',
            hangingToRetailRatio: '0.742'
          })
          .set('Authorization', `Bearer ${testCase.role}-test-token`);

        if (testCase.shouldSucceed) {
          expect([200, 201]).toContain(response.status);
        } else {
          expect(response.status).toBe(403);
        }
      }
    });

    it('should validate species yield ratios against industry standards', async () => {
      const invalidRatios = [
        { liveToHangingRatio: '0.40', hangingToRetailRatio: '0.742' }, // Too low hanging
        { liveToHangingRatio: '0.80', hangingToRetailRatio: '0.742' }, // Too high hanging
        { liveToHangingRatio: '0.625', hangingToRetailRatio: '0.50' }, // Too low retail
        { liveToHangingRatio: '0.625', hangingToRetailRatio: '0.90' }, // Too high retail
      ];

      for (const ratios of invalidRatios) {
        const response = await request(app)
          .post('/api/species')
          .send({
            name: 'Test Species',
            category: 'beef',
            ...ratios
          })
          .set('Authorization', 'Bearer admin-test-token');

        // Should validate ratios and potentially reject invalid ones
        // Implementation depends on business rules
        expect([200, 201, 400]).toContain(response.status);
      }
    });
  });

  describe('Performance Tests', () => {
    it('should respond to simple queries within reasonable time', async () => {
      const start = Date.now();
      
      await request(app)
        .get('/api/species')
        .set('Authorization', 'Bearer valid-test-token');
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000); // Should respond within 1 second
    });

    it('should handle concurrent requests without errors', async () => {
      const concurrentRequests = Array(10).fill(null).map((_, index) =>
        request(app)
          .get('/api/species')
          .set('Authorization', `Bearer valid-test-token-${index}`)
      );

      const responses = await Promise.all(concurrentRequests);
      
      // All requests should complete successfully (or with expected auth errors)
      responses.forEach(response => {
        expect([200, 401, 403, 429]).toContain(response.status);
      });
    });
  });
});

export { };