import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authenticateToken, generateTokens, verifyPassword, requirePermission, hashPassword, type AuthenticatedRequest } from "./auth";
import { auditLogger, errorHandler, rateLimiter } from "./middleware";
import { loginSchema, insertUserSchema, insertSubmissionSchema, insertCaseSchema, insertDepartmentSchema, insertPollSchema, otpRequestSchema, otpVerifySchema } from "@shared/schema";
import { OtpService } from "./services/otp-service";
import { seedDatabase } from "./seed";

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply rate limiting
  app.use('/api', rateLimiter());
  
  // Auth endpoints
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user || !await verifyPassword(password, user.passwordHash)) {
        return res.status(401).json({
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          error: { code: 'ACCOUNT_DISABLED', message: 'Account is disabled' }
        });
      }

      const tokens = generateTokens(user);
      res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          roles: user.userRoles.map(ur => ur.role.name)
        },
        ...tokens
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid login data' }
      });
    }
  });

  app.get('/api/auth/me', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      // Use the user ID from JWT token
      const userId = (req.user as any).id;
      const user = await storage.getUserByEmail((req.user as any).email);
      if (!user) {
        return res.status(404).json({
          error: { code: 'USER_NOT_FOUND', message: 'User not found' }
        });
      }

      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        province: user.province,
        roles: user.userRoles.map(ur => ur.role.name)
      });
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get user info' }
      });
    }
  });

  // Users & Roles endpoints
  app.get('/api/users', authenticateToken, requirePermission('manage_users'), async (req, res) => {
    try {
      const { role, active, search } = req.query;
      const users = await storage.getUsers({
        role: role as string,
        active: active === 'true' ? true : active === 'false' ? false : undefined,
        search: search as string
      });
      
      res.json(users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        province: user.province,
        isActive: user.isActive,
        createdAt: user.createdAt,
        roles: user.userRoles.map(ur => ur.role.name)
      })));
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get users' }
      });
    }
  });

  app.post('/api/users', authenticateToken, requirePermission('manage_users'), auditLogger('CREATE', 'user'), async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      userData.passwordHash = await hashPassword(userData.passwordHash);
      
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      console.error('Create user error:', error);
      res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid user data' }
      });
    }
  });

  app.get('/api/users/:id', authenticateToken, requirePermission('manage_users'), async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({
          error: { code: 'USER_NOT_FOUND', message: 'User not found' }
        });
      }
      res.json(user);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get user' }
      });
    }
  });

  app.patch('/api/users/:id', authenticateToken, requirePermission('manage_users'), auditLogger('UPDATE', 'user'), async (req, res) => {
    try {
      const updates = req.body;
      if (updates.passwordHash) {
        updates.passwordHash = await hashPassword(updates.passwordHash);
      }
      
      const user = await storage.updateUser(req.params.id, updates);
      res.json(user);
    } catch (error) {
      console.error('Update user error:', error);
      res.status(400).json({
        error: { code: 'UPDATE_FAILED', message: 'Failed to update user' }
      });
    }
  });

  app.delete('/api/users/:id', authenticateToken, requirePermission('manage_users'), auditLogger('DELETE', 'user'), async (req, res) => {
    try {
      await storage.deleteUser(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({
        error: { code: 'DELETE_FAILED', message: 'Failed to delete user' }
      });
    }
  });

  app.get('/api/roles', authenticateToken, requirePermission('manage_users'), async (req, res) => {
    try {
      const roles = await storage.getRoles();
      res.json(roles);
    } catch (error) {
      console.error('Get roles error:', error);
      res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get roles' }
      });
    }
  });

  // Departments endpoints
  app.get('/api/departments', authenticateToken, async (req, res) => {
    try {
      const departments = await storage.getDepartments();
      res.json(departments);
    } catch (error) {
      console.error('Get departments error:', error);
      res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get departments' }
      });
    }
  });

  app.post('/api/departments', authenticateToken, requirePermission('manage_departments'), auditLogger('CREATE', 'department'), async (req, res) => {
    try {
      const deptData = insertDepartmentSchema.parse(req.body);
      const department = await storage.createDepartment(deptData);
      res.status(201).json(department);
    } catch (error) {
      console.error('Create department error:', error);
      res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid department data' }
      });
    }
  });

  app.get('/api/departments/:id', authenticateToken, async (req, res) => {
    try {
      const department = await storage.getDepartment(req.params.id);
      if (!department) {
        return res.status(404).json({
          error: { code: 'DEPARTMENT_NOT_FOUND', message: 'Department not found' }
        });
      }
      res.json(department);
    } catch (error) {
      console.error('Get department error:', error);
      res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get department' }
      });
    }
  });

  app.patch('/api/departments/:id', authenticateToken, requirePermission('manage_departments'), auditLogger('UPDATE', 'department'), async (req, res) => {
    try {
      const department = await storage.updateDepartment(req.params.id, req.body);
      res.json(department);
    } catch (error) {
      console.error('Update department error:', error);
      res.status(400).json({
        error: { code: 'UPDATE_FAILED', message: 'Failed to update department' }
      });
    }
  });

  // Topic Tags endpoints
  app.get('/api/topics', authenticateToken, async (req, res) => {
    try {
      const topics = await storage.getTopicTags();
      res.json(topics);
    } catch (error) {
      console.error('Get topics error:', error);
      res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get topics' }
      });
    }
  });

  app.post('/api/topics', authenticateToken, requirePermission('manage_taxonomy'), auditLogger('CREATE', 'topic'), async (req, res) => {
    try {
      const { name, parentId } = req.body;
      const topic = await storage.createTopicTag({ name, parentId });
      res.status(201).json(topic);
    } catch (error) {
      console.error('Create topic error:', error);
      res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid topic data' }
      });
    }
  });

  // Submissions endpoints
  app.get('/api/submissions', authenticateToken, requirePermission('review_submissions'), async (req, res) => {
    try {
      const { status, province, channel, search, limit = '20', offset = '0' } = req.query;
      const result = await storage.getSubmissions({
        status: status as string,
        province: province as string,
        channel: channel as string,
        search: search as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });
      
      res.json(result);
    } catch (error) {
      console.error('Get submissions error:', error);
      res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get submissions' }
      });
    }
  });

  app.post('/api/submissions', async (req, res) => {
    try {
      const submissionData = insertSubmissionSchema.parse(req.body);
      const submission = await storage.createSubmission(submissionData);
      res.status(201).json(submission);
    } catch (error) {
      console.error('Create submission error:', error);
      res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid submission data' }
      });
    }
  });

  app.get('/api/submissions/:id', authenticateToken, requirePermission('review_submissions'), async (req, res) => {
    try {
      const submission = await storage.getSubmission(req.params.id);
      if (!submission) {
        return res.status(404).json({
          error: { code: 'SUBMISSION_NOT_FOUND', message: 'Submission not found' }
        });
      }
      res.json(submission);
    } catch (error) {
      console.error('Get submission error:', error);
      res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get submission' }
      });
    }
  });

  app.patch('/api/submissions/:id', authenticateToken, requirePermission('review_submissions'), auditLogger('UPDATE', 'submission'), async (req, res) => {
    try {
      const submission = await storage.updateSubmission(req.params.id, req.body);
      res.json(submission);
    } catch (error) {
      console.error('Update submission error:', error);
      res.status(400).json({
        error: { code: 'UPDATE_FAILED', message: 'Failed to update submission' }
      });
    }
  });

  // Cases endpoints
  app.get('/api/cases', authenticateToken, requirePermission('manage_cases'), async (req, res) => {
    try {
      const { state, department, assignee, priority, limit = '20', offset = '0' } = req.query;
      const result = await storage.getCases({
        state: state as string,
        department: department as string,
        assignee: assignee as string,
        priority: priority as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });
      
      res.json(result);
    } catch (error) {
      console.error('Get cases error:', error);
      res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get cases' }
      });
    }
  });

  app.post('/api/cases', authenticateToken, requirePermission('manage_cases'), auditLogger('CREATE', 'case'), async (req, res) => {
    try {
      const caseData = insertCaseSchema.parse(req.body);
      const newCase = await storage.createCase(caseData);
      res.status(201).json(newCase);
    } catch (error) {
      console.error('Create case error:', error);
      res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid case data' }
      });
    }
  });

  app.get('/api/cases/:id', authenticateToken, requirePermission('manage_cases'), async (req, res) => {
    try {
      const caseData = await storage.getCase(req.params.id);
      if (!caseData) {
        return res.status(404).json({
          error: { code: 'CASE_NOT_FOUND', message: 'Case not found' }
        });
      }
      res.json(caseData);
    } catch (error) {
      console.error('Get case error:', error);
      res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get case' }
      });
    }
  });

  app.patch('/api/cases/:id', authenticateToken, requirePermission('manage_cases'), auditLogger('UPDATE', 'case'), async (req, res) => {
    try {
      const caseData = await storage.updateCase(req.params.id, req.body);
      res.json(caseData);
    } catch (error) {
      console.error('Update case error:', error);
      res.status(400).json({
        error: { code: 'UPDATE_FAILED', message: 'Failed to update case' }
      });
    }
  });

  // Polls endpoints
  app.get('/api/polls', authenticateToken, async (req, res) => {
    try {
      const { active } = req.query;
      const polls = await storage.getPolls(active === 'true');
      res.json(polls);
    } catch (error) {
      console.error('Get polls error:', error);
      res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get polls' }
      });
    }
  });

  app.post('/api/polls', authenticateToken, requirePermission('manage_polls'), auditLogger('CREATE', 'poll'), async (req, res) => {
    try {
      const pollData = insertPollSchema.parse(req.body);
      const poll = await storage.createPoll(pollData);
      res.status(201).json(poll);
    } catch (error) {
      console.error('Create poll error:', error);
      res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid poll data' }
      });
    }
  });

  app.get('/api/polls/:id', authenticateToken, async (req, res) => {
    try {
      const poll = await storage.getPoll(req.params.id);
      if (!poll) {
        return res.status(404).json({
          error: { code: 'POLL_NOT_FOUND', message: 'Poll not found' }
        });
      }
      res.json(poll);
    } catch (error) {
      console.error('Get poll error:', error);
      res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get poll' }
      });
    }
  });

  app.patch('/api/polls/:id', authenticateToken, requirePermission('manage_polls'), auditLogger('UPDATE', 'poll'), async (req, res) => {
    try {
      const poll = await storage.updatePoll(req.params.id, req.body);
      res.json(poll);
    } catch (error) {
      console.error('Update poll error:', error);
      res.status(400).json({
        error: { code: 'UPDATE_FAILED', message: 'Failed to update poll' }
      });
    }
  });

  // Analytics endpoints
  app.get('/api/analytics/summary', authenticateToken, requirePermission('view_analytics'), async (req, res) => {
    try {
      const { range = '7d' } = req.query;
      const days = range === '30d' ? 30 : range === '90d' ? 90 : 7;

      const [submissionStats, caseStats, sentimentStats, provinceStats] = await Promise.all([
        storage.getSubmissionStats(days),
        storage.getCaseStats(),
        storage.getSentimentStats(),
        storage.getProvinceStats()
      ]);

      res.json({
        submissions: submissionStats,
        cases: caseStats,
        sentiment: sentimentStats,
        provinces: provinceStats
      });
    } catch (error) {
      console.error('Get analytics summary error:', error);
      res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get analytics' }
      });
    }
  });

  // Notifications endpoints
  app.get('/api/notifications', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { unread } = req.query;
      const notifications = await storage.getUserNotifications(
        req.user!.id, 
        unread === 'true'
      );
      res.json(notifications);
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get notifications' }
      });
    }
  });

  app.patch('/api/notifications/:id', authenticateToken, async (req, res) => {
    try {
      await storage.markNotificationRead(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Mark notification read error:', error);
      res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: 'Failed to update notification' }
      });
    }
  });

  // Admin utilities
  app.post('/api/admin/seeds/reset', authenticateToken, requirePermission('manage_settings'), async (req, res) => {
    try {
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({
          error: { code: 'NOT_ALLOWED', message: 'Seeding not allowed in production' }
        });
      }

      await seedDatabase();
      res.json({ message: 'Database seeded successfully' });
    } catch (error) {
      console.error('Seed database error:', error);
      res.status(500).json({
        error: { code: 'SEED_FAILED', message: 'Failed to seed database' }
      });
    }
  });

  app.get('/api/healthz', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  // OTP endpoints
  app.post('/api/otp/request', async (req, res) => {
    try {
      const request = otpRequestSchema.parse(req.body);
      const result = await OtpService.requestOtp(request);
      
      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          data: result.data
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error: any) {
      console.error('OTP request error:', error);
      res.status(400).json({
        success: false,
        error: 'Invalid OTP request data'
      });
    }
  });

  app.post('/api/otp/verify', async (req, res) => {
    try {
      const request = otpVerifySchema.parse(req.body);
      const result = await OtpService.verifyOtp(request);
      
      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          data: result.data
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      res.status(400).json({
        success: false,
        error: 'Invalid OTP verification data'
      });
    }
  });

  // OTP statistics endpoint (protected)
  app.get('/api/otp/stats', authenticateToken, requirePermission('view_analytics'), async (req, res) => {
    try {
      const stats = await OtpService.getOtpStats();
      res.status(200).json(stats);
    } catch (error: any) {
      console.error('OTP stats error:', error);
      res.status(500).json({
        error: 'Failed to fetch OTP statistics'
      });
    }
  });

  // Error handler
  app.use('/api/*', errorHandler);

  const httpServer = createServer(app);
  return httpServer;
}
