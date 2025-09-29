/**
 * Security Middleware for MeatMath Pro
 * Implements comprehensive security measures including rate limiting, helmet, and input sanitization
 * Goal: Address P0/P1 security issues identified by QA analysis
 */

import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';

// Rate limiting configuration
export const createRateLimiter = (windowMs: number, max: number, message?: string) => {
  return rateLimit({
    windowMs,
    max,
    message: message || 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// General API rate limiter
export const apiRateLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  1000, // limit each IP to 1000 requests per windowMs
  'Too many API requests, please try again later.'
);

// Strict rate limiter for auth endpoints
export const authRateLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes  
  20, // limit each IP to 20 requests per windowMs
  'Too many authentication attempts, please try again later.'
);

// Very strict rate limiter for species creation (admin-only operations)
export const adminRateLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  10, // limit each IP to 10 requests per windowMs
  'Too many admin operations, please try again later.'
);

// Security headers configuration
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.stripe.com"],
      frameSrc: ["https://js.stripe.com"],
    },
  },
  crossOriginEmbedderPolicy: false, // Required for some integrations
});

// Input sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Recursively sanitize all string inputs
    const sanitizeObject = (obj: any): any => {
      if (typeof obj === 'string') {
        // Basic XSS prevention - remove script tags and javascript: protocols
        return obj
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '') // Remove event handlers
          .trim();
      } else if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      } else if (obj && typeof obj === 'object') {
        const sanitized: any = {};
        for (const [key, value] of Object.entries(obj)) {
          sanitized[key] = sanitizeObject(value);
        }
        return sanitized;
      }
      return obj;
    };

    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }
    
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query);
    }

    next();
  } catch (error) {
    console.error('Input sanitization error:', error);
    res.status(400).json({ message: 'Invalid request format' });
  }
};

// SQL injection prevention middleware - focused on actual threats, not false positives
export const sqlInjectionProtection = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Only detect actual multi-statement SQL injection attempts, not legitimate quotes
    const sqlInjectionPatterns = [
      /(;\s*(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\s)/i, // Stacked queries
      /(UNION\s+ALL\s+SELECT|UNION\s+SELECT)/i, // Union-based injection
      /(OR\s+1\s*=\s*1|AND\s+1\s*=\s*1)(\s+--|#)/i, // Boolean-based with comments
      /(INFORMATION_SCHEMA\.TABLES|SYS\.TABLES)/i, // Schema enumeration
    ];

    const checkForSQLInjection = (value: any): boolean => {
      if (typeof value === 'string') {
        // Only flag clear SQL injection patterns, not normal punctuation
        return sqlInjectionPatterns.some(pattern => pattern.test(value));
      }
      return false;
    };

    const scanObject = (obj: any): boolean => {
      if (Array.isArray(obj)) {
        return obj.some(scanObject);
      } else if (obj && typeof obj === 'object') {
        return Object.values(obj).some(scanObject);
      }
      return checkForSQLInjection(obj);
    };

    // Check request body for actual SQL injection attempts (not false positives)
    if (req.body && scanObject(req.body)) {
      console.warn('Potential SQL injection attempt detected', {
        ip: req.ip,
        path: req.path,
        userAgent: req.get('User-Agent')
      });
      return res.status(400).json({ message: 'Invalid request content' });
    }

    // Check query parameters for SQL injection attempts
    if (req.query && scanObject(req.query)) {
      console.warn('Potential SQL injection attempt detected in query', {
        ip: req.ip,
        path: req.path,
        userAgent: req.get('User-Agent')
      });
      return res.status(400).json({ message: 'Invalid query parameters' });
    }

    next();
  } catch (error) {
    console.error('SQL injection protection error:', error);
    res.status(500).json({ message: 'Security check failed' });
  }
};

// Organization access validation middleware
export const validateOrganizationAccess = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.claims?.sub;
    const orgId = req.params.orgId || req.body.organizationId;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!orgId) {
      return res.status(400).json({ message: 'Organization ID required' });
    }

    // This check should be implemented in storage layer
    // For now, we'll pass through and let individual routes handle it
    // TODO: Implement centralized organization access validation
    
    next();
  } catch (error) {
    console.error('Organization access validation error:', error);
    res.status(500).json({ message: 'Access validation failed' });
  }
};

// Global error handler
export const globalErrorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Global error handler:', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Don't leak internal error details in production
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({ 
      message: 'An internal server error occurred',
      requestId: req.headers['x-request-id'] || 'unknown'
    });
  } else {
    res.status(500).json({
      message: error.message || 'An internal server error occurred',
      stack: error.stack,
      path: req.path
    });
  }
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });

  next();
};

export default {
  apiRateLimiter,
  authRateLimiter,
  adminRateLimiter,
  securityHeaders,
  sanitizeInput,
  sqlInjectionProtection,
  validateOrganizationAccess,
  globalErrorHandler,
  requestLogger
};