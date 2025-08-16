import { 
  users, 
  roles, 
  userRoles, 
  permissions,
  rolePermissions,
  departments,
  topicTags,
  submissions,
  submissionTags,
  cases,
  polls,
  votes,
  notifications,
  auditLogs,
  otpVerifications,
  type User,
  type UserWithRoles,
  type InsertUser,
  type Submission,
  type InsertSubmission,
  type Case,
  type InsertCase,
  type Department,
  type InsertDepartment,
  type Poll,
  type InsertPoll,
  type TopicTag,
  type Role,
  type Permission,
  type Notification,
  type AuditLog,
  type OtpVerification,
  type InsertOtpVerification,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, asc, count, sql, gte, lte, like, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<UserWithRoles | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  getUsers(filters?: { role?: string; active?: boolean; search?: string }): Promise<UserWithRoles[]>;

  // Role operations
  getRoles(): Promise<Role[]>;
  getUserRoles(userId: string): Promise<Role[]>;
  assignRole(userId: string, roleId: string): Promise<void>;
  removeRole(userId: string, roleId: string): Promise<void>;

  // Department operations
  getDepartments(): Promise<Department[]>;
  getDepartment(id: string): Promise<Department | undefined>;
  createDepartment(dept: InsertDepartment): Promise<Department>;
  updateDepartment(id: string, updates: Partial<InsertDepartment>): Promise<Department>;

  // Submission operations
  getSubmissions(filters?: {
    status?: string;
    province?: string;
    channel?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ submissions: Submission[]; total: number }>;
  getSubmission(id: string): Promise<Submission | undefined>;
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  updateSubmission(id: string, updates: Partial<InsertSubmission>): Promise<Submission>;

  // Case operations
  getCases(filters?: {
    state?: string;
    department?: string;
    assignee?: string;
    priority?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ cases: Case[]; total: number }>;
  getCase(id: string): Promise<Case | undefined>;
  createCase(caseData: InsertCase): Promise<Case>;
  updateCase(id: string, updates: Partial<InsertCase>): Promise<Case>;

  // Poll operations
  getPolls(active?: boolean): Promise<Poll[]>;
  getPoll(id: string): Promise<Poll | undefined>;
  createPoll(poll: InsertPoll): Promise<Poll>;
  updatePoll(id: string, updates: Partial<InsertPoll>): Promise<Poll>;

  // Topic tag operations
  getTopicTags(): Promise<TopicTag[]>;
  createTopicTag(tag: { name: string; parentId?: string }): Promise<TopicTag>;

  // Analytics operations
  getSubmissionStats(days?: number): Promise<any>;
  getCaseStats(): Promise<any>;
  getSentimentStats(): Promise<any>;
  getProvinceStats(): Promise<any>;

  // Notification operations
  getUserNotifications(userId: string, unreadOnly?: boolean): Promise<Notification[]>;
  createNotification(notification: { userId: string; type: string; title: string; body?: string }): Promise<Notification>;
  markNotificationRead(id: string): Promise<void>;

  // OTP operations
  createOtpVerification(otp: InsertOtpVerification): Promise<OtpVerification>;
  getOtpVerification(identifier: string, type: string): Promise<OtpVerification | undefined>;
  markOtpAsUsed(id: string): Promise<void>;
  incrementOtpAttempts(id: string): Promise<void>;
  deleteOtpVerification(identifier: string, type: string): Promise<void>;
  cleanupExpiredOtps(): Promise<void>;
  getRecentOtpRequests(identifier: string, type: string, since: Date): Promise<OtpVerification[]>;
  getOtpStats(): Promise<{
    totalSent: number;
    totalVerified: number;
    successRate: number;
    recentRequests: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<UserWithRoles | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .leftJoin(userRoles, eq(users.id, userRoles.userId))
      .leftJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(users.email, email));

    if (!user) return undefined;

    // Get all roles for this user
    const userRolesData = await db
      .select({
        role: roles
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, user.users.id));

    return {
      ...user.users,
      userRoles: userRolesData
    };
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db
      .insert(users)
      .values(user)
      .returning();
    return newUser;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getUsers(filters?: { role?: string; active?: boolean; search?: string }): Promise<UserWithRoles[]> {
    const conditions = [];
    
    if (filters?.active !== undefined) {
      conditions.push(eq(users.isActive, filters.active));
    }

    if (filters?.search) {
      conditions.push(
        or(
          like(users.name, `%${filters.search}%`),
          like(users.email, `%${filters.search}%`)
        )
      );
    }

    const query = db
      .select({
        user: users,
        role: roles
      })
      .from(users)
      .leftJoin(userRoles, eq(users.id, userRoles.userId))
      .leftJoin(roles, eq(userRoles.roleId, roles.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const results = await query;
    
    // Group by user
    const userMap = new Map<string, UserWithRoles>();
    
    for (const result of results) {
      if (!userMap.has(result.user.id)) {
        userMap.set(result.user.id, {
          ...result.user,
          userRoles: []
        });
      }
      
      if (result.role) {
        userMap.get(result.user.id)!.userRoles.push({ role: result.role });
      }
    }

    return Array.from(userMap.values());
  }

  async getRoles(): Promise<Role[]> {
    return await db.select().from(roles);
  }

  async getUserRoles(userId: string): Promise<Role[]> {
    const result = await db
      .select({ role: roles })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId));
    
    return result.map(r => r.role);
  }

  async assignRole(userId: string, roleId: string): Promise<void> {
    await db.insert(userRoles).values({ userId, roleId });
  }

  async removeRole(userId: string, roleId: string): Promise<void> {
    await db
      .delete(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)));
  }

  async getDepartments(): Promise<Department[]> {
    return await db.select().from(departments).orderBy(departments.name);
  }

  async getDepartment(id: string): Promise<Department | undefined> {
    const [dept] = await db.select().from(departments).where(eq(departments.id, id));
    return dept || undefined;
  }

  async createDepartment(dept: InsertDepartment): Promise<Department> {
    const [newDept] = await db
      .insert(departments)
      .values(dept)
      .returning();
    return newDept;
  }

  async updateDepartment(id: string, updates: Partial<InsertDepartment>): Promise<Department> {
    const [updatedDept] = await db
      .update(departments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(departments.id, id))
      .returning();
    return updatedDept;
  }

  async getSubmissions(filters?: {
    status?: string;
    province?: string;
    channel?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ submissions: Submission[]; total: number }> {
    let query = db.select().from(submissions);
    let countQuery = db.select({ count: count() }).from(submissions);

    const conditions = [];
    
    if (filters?.status) {
      conditions.push(eq(submissions.status, filters.status as any));
    }
    
    if (filters?.province) {
      conditions.push(eq(submissions.province, filters.province as any));
    }
    
    if (filters?.channel) {
      conditions.push(eq(submissions.channel, filters.channel as any));
    }
    
    if (filters?.search) {
      conditions.push(like(submissions.text, `%${filters.search}%`));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
      countQuery = countQuery.where(and(...conditions));
    }

    query = query.orderBy(desc(submissions.createdAt));
    
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    if (filters?.offset) {
      query = query.offset(filters.offset);
    }

    const [submissionsResult, totalResult] = await Promise.all([
      query,
      countQuery
    ]);

    return {
      submissions: submissionsResult,
      total: totalResult[0].count
    };
  }

  async getSubmission(id: string): Promise<Submission | undefined> {
    const [submission] = await db.select().from(submissions).where(eq(submissions.id, id));
    return submission || undefined;
  }

  async createSubmission(submission: InsertSubmission): Promise<Submission> {
    const [newSubmission] = await db
      .insert(submissions)
      .values(submission)
      .returning();
    return newSubmission;
  }

  async updateSubmission(id: string, updates: Partial<InsertSubmission>): Promise<Submission> {
    const [updatedSubmission] = await db
      .update(submissions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(submissions.id, id))
      .returning();
    return updatedSubmission;
  }

  async getCases(filters?: {
    state?: string;
    department?: string;
    assignee?: string;
    priority?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ cases: Case[]; total: number }> {
    let query = db.select().from(cases);
    let countQuery = db.select({ count: count() }).from(cases);

    const conditions = [];
    
    if (filters?.state) {
      conditions.push(eq(cases.state, filters.state as any));
    }
    
    if (filters?.department) {
      conditions.push(eq(cases.departmentId, filters.department));
    }
    
    if (filters?.assignee) {
      conditions.push(eq(cases.assigneeId, filters.assignee));
    }
    
    if (filters?.priority) {
      conditions.push(eq(cases.priority, filters.priority as any));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
      countQuery = countQuery.where(and(...conditions));
    }

    query = query.orderBy(desc(cases.createdAt));
    
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    if (filters?.offset) {
      query = query.offset(filters.offset);
    }

    const [casesResult, totalResult] = await Promise.all([
      query,
      countQuery
    ]);

    return {
      cases: casesResult,
      total: totalResult[0].count
    };
  }

  async getCase(id: string): Promise<Case | undefined> {
    const [caseData] = await db.select().from(cases).where(eq(cases.id, id));
    return caseData || undefined;
  }

  async createCase(caseData: InsertCase): Promise<Case> {
    const [newCase] = await db
      .insert(cases)
      .values(caseData)
      .returning();
    return newCase;
  }

  async updateCase(id: string, updates: Partial<InsertCase>): Promise<Case> {
    const [updatedCase] = await db
      .update(cases)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(cases.id, id))
      .returning();
    return updatedCase;
  }

  async getPolls(active?: boolean): Promise<Poll[]> {
    let query = db.select().from(polls);
    
    if (active) {
      const now = new Date();
      query = query.where(and(
        lte(polls.startAt, now),
        gte(polls.endAt, now)
      ));
    }
    
    return await query.orderBy(desc(polls.createdAt));
  }

  async getPoll(id: string): Promise<Poll | undefined> {
    const [poll] = await db.select().from(polls).where(eq(polls.id, id));
    return poll || undefined;
  }

  async createPoll(poll: InsertPoll): Promise<Poll> {
    const [newPoll] = await db
      .insert(polls)
      .values(poll)
      .returning();
    return newPoll;
  }

  async updatePoll(id: string, updates: Partial<InsertPoll>): Promise<Poll> {
    const [updatedPoll] = await db
      .update(polls)
      .set(updates)
      .where(eq(polls.id, id))
      .returning();
    return updatedPoll;
  }

  async getTopicTags(): Promise<TopicTag[]> {
    return await db.select().from(topicTags).orderBy(topicTags.name);
  }

  async createTopicTag(tag: { name: string; parentId?: string }): Promise<TopicTag> {
    const [newTag] = await db
      .insert(topicTags)
      .values(tag)
      .returning();
    return newTag;
  }

  async getSubmissionStats(days: number = 7): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [totalSubmissions] = await db
      .select({ count: count() })
      .from(submissions);

    const [recentSubmissions] = await db
      .select({ count: count() })
      .from(submissions)
      .where(gte(submissions.createdAt, startDate));

    return {
      total: totalSubmissions.count,
      recent: recentSubmissions.count,
      growth: totalSubmissions.count > 0 ? (recentSubmissions.count / totalSubmissions.count) * 100 : 0
    };
  }

  async getCaseStats(): Promise<any> {
    const [totalCases] = await db
      .select({ count: count() })
      .from(cases);

    const [activeCases] = await db
      .select({ count: count() })
      .from(cases)
      .where(eq(cases.state, 'open'));

    const overdueCases = await db
      .select({ count: count() })
      .from(cases)
      .where(and(
        eq(cases.state, 'open'),
        sql`${cases.dueAt} < NOW()`
      ));

    return {
      total: totalCases.count,
      active: activeCases.count,
      overdue: overdueCases[0].count
    };
  }

  async getSentimentStats(): Promise<any> {
    const result = await db
      .select({
        avgSentiment: sql<number>`AVG(${submissions.sentiment})`,
        positiveCount: sql<number>`COUNT(CASE WHEN ${submissions.sentiment} > 0.1 THEN 1 END)`,
        neutralCount: sql<number>`COUNT(CASE WHEN ${submissions.sentiment} BETWEEN -0.1 AND 0.1 THEN 1 END)`,
        negativeCount: sql<number>`COUNT(CASE WHEN ${submissions.sentiment} < -0.1 THEN 1 END)`
      })
      .from(submissions)
      .where(sql`${submissions.sentiment} IS NOT NULL`);

    return result[0];
  }

  async getProvinceStats(): Promise<any> {
    return await db
      .select({
        province: submissions.province,
        count: count()
      })
      .from(submissions)
      .where(sql`${submissions.province} IS NOT NULL`)
      .groupBy(submissions.province)
      .orderBy(desc(count()));
  }

  async getUserNotifications(userId: string, unreadOnly?: boolean): Promise<Notification[]> {
    let query = db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId));

    if (unreadOnly) {
      query = query.where(eq(notifications.read, false));
    }

    return await query.orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: { userId: string; type: string; title: string; body?: string }): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async markNotificationRead(id: string): Promise<void> {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id));
  }

  // OTP operations
  async createOtpVerification(otp: InsertOtpVerification): Promise<OtpVerification> {
    const [newOtp] = await db
      .insert(otpVerifications)
      .values(otp)
      .returning();
    return newOtp;
  }

  async getOtpVerification(identifier: string, type: string): Promise<OtpVerification | undefined> {
    const [otp] = await db
      .select()
      .from(otpVerifications)
      .where(
        and(
          eq(otpVerifications.identifier, identifier),
          eq(otpVerifications.type, type),
          eq(otpVerifications.isUsed, false)
        )
      )
      .orderBy(desc(otpVerifications.createdAt));
    return otp || undefined;
  }

  async markOtpAsUsed(id: string): Promise<void> {
    await db
      .update(otpVerifications)
      .set({ isUsed: true })
      .where(eq(otpVerifications.id, id));
  }

  async incrementOtpAttempts(id: string): Promise<void> {
    await db
      .update(otpVerifications)
      .set({ attempts: sql`${otpVerifications.attempts} + 1` })
      .where(eq(otpVerifications.id, id));
  }

  async deleteOtpVerification(identifier: string, type: string): Promise<void> {
    await db
      .delete(otpVerifications)
      .where(
        and(
          eq(otpVerifications.identifier, identifier),
          eq(otpVerifications.type, type)
        )
      );
  }

  async cleanupExpiredOtps(): Promise<void> {
    const now = new Date();
    await db
      .delete(otpVerifications)
      .where(lte(otpVerifications.expiresAt, now));
  }

  async getRecentOtpRequests(identifier: string, type: string, since: Date): Promise<OtpVerification[]> {
    return await db
      .select()
      .from(otpVerifications)
      .where(
        and(
          eq(otpVerifications.identifier, identifier),
          eq(otpVerifications.type, type),
          gte(otpVerifications.createdAt, since)
        )
      )
      .orderBy(desc(otpVerifications.createdAt));
  }

  async getOtpStats(): Promise<{
    totalSent: number;
    totalVerified: number;
    successRate: number;
    recentRequests: number;
  }> {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [totalSent] = await db
      .select({ count: count() })
      .from(otpVerifications);

    const [totalVerified] = await db
      .select({ count: count() })
      .from(otpVerifications)
      .where(eq(otpVerifications.isUsed, true));

    const [recentRequests] = await db
      .select({ count: count() })
      .from(otpVerifications)
      .where(gte(otpVerifications.createdAt, last24Hours));

    const successRate = totalSent.count > 0 
      ? Math.round((totalVerified.count / totalSent.count) * 100) 
      : 0;

    return {
      totalSent: totalSent.count,
      totalVerified: totalVerified.count,
      successRate,
      recentRequests: recentRequests.count
    };
  }
}

export const storage = new DatabaseStorage();
