import { sql, relations } from "drizzle-orm";
import {
  pgTable,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  real,
  jsonb,
  pgEnum,
  uuid,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const roleEnum = pgEnum("role", [
  "SuperAdmin",
  "Admin",
  "Analyst",
  "Moderator",
  "DeptOfficer",
  "Citizen"
]);

export const submissionStatusEnum = pgEnum("submission_status", [
  "new",
  "moderated",
  "routed",
  "in_progress",
  "resolved",
  "declined"
]);

export const channelEnum = pgEnum("channel", [
  "mobile",
  "web",
  "whatsapp",
  "social"
]);

export const caseStateEnum = pgEnum("case_state", [
  "open",
  "investigating",
  "awaiting_info",
  "resolved"
]);

export const priorityEnum = pgEnum("priority", [
  "low",
  "medium",
  "high"
]);

export const jurisdictionEnum = pgEnum("jurisdiction", [
  "national",
  "provincial",
  "municipal"
]);

export const provinceEnum = pgEnum("province", [
  "eastern_cape",
  "free_state",
  "gauteng",
  "kwazulu_natal",
  "limpopo",
  "mpumalanga",
  "northern_cape",
  "north_west",
  "western_cape"
]);

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  passwordHash: text("password_hash").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  language: varchar("language", { length: 10 }).default("en"),
  province: provinceEnum("province"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  emailIdx: index("users_email_idx").on(table.email),
}));

// Roles table
export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: roleEnum("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User roles junction table
export const userRoles = pgTable("user_roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  roleId: uuid("role_id").notNull().references(() => roles.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Permissions table
export const permissions = pgTable("permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  description: text("description"),
});

// Role permissions junction table
export const rolePermissions = pgTable("role_permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  roleId: uuid("role_id").notNull().references(() => roles.id),
  permissionId: uuid("permission_id").notNull().references(() => permissions.id),
});

// Departments table
export const departments = pgTable("departments", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  jurisdiction: jurisdictionEnum("jurisdiction").notNull(),
  province: provinceEnum("province"),
  email: varchar("email", { length: 255 }),
  slaHours: integer("sla_hours").default(72).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Topic tags table
export const topicTags = pgTable("topic_tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  parentId: uuid("parent_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});



// Submissions table
export const submissions = pgTable("submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  channel: channelEnum("channel").notNull(),
  text: text("text").notNull(),
  mediaUrls: jsonb("media_urls"),
  languageDetected: varchar("language_detected", { length: 10 }),
  province: provinceEnum("province"),
  sentiment: real("sentiment"),
  toxicity: boolean("toxicity").default(false),
  status: submissionStatusEnum("status").default("new").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  statusIdx: index("submissions_status_idx").on(table.status),
  createdAtIdx: index("submissions_created_at_idx").on(table.createdAt),
}));

// Submission tags junction table
export const submissionTags = pgTable("submission_tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  submissionId: uuid("submission_id").notNull().references(() => submissions.id),
  tagId: uuid("tag_id").notNull().references(() => topicTags.id),
  confidence: real("confidence").default(1.0),
});

// Cases table
export const cases = pgTable("cases", {
  id: uuid("id").primaryKey().defaultRandom(),
  submissionId: uuid("submission_id").notNull().references(() => submissions.id),
  departmentId: uuid("department_id").notNull().references(() => departments.id),
  assigneeId: uuid("assignee_id").references(() => users.id),
  priority: priorityEnum("priority").default("medium").notNull(),
  state: caseStateEnum("state").default("open").notNull(),
  dueAt: timestamp("due_at"),
  resolutionNote: text("resolution_note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  stateIdx: index("cases_state_idx").on(table.state),
  dueAtIdx: index("cases_due_at_idx").on(table.dueAt),
}));

// Polls table
export const polls = pgTable("polls", {
  id: uuid("id").primaryKey().defaultRandom(),
  question: text("question").notNull(),
  options: jsonb("options").notNull(),
  startAt: timestamp("start_at").notNull(),
  endAt: timestamp("end_at").notNull(),
  targetProvince: provinceEnum("target_province"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Votes table
export const votes = pgTable("votes", {
  id: uuid("id").primaryKey().defaultRandom(),
  pollId: uuid("poll_id").notNull().references(() => polls.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  option: varchar("option", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  type: varchar("type", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body"),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Audit log table
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: uuid("actor_id").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  entity: varchar("entity", { length: 100 }).notNull(),
  entityId: uuid("entity_id"),
  before: jsonb("before"),
  after: jsonb("after"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  createdAtIdx: index("audit_logs_created_at_idx").on(table.createdAt),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  userRoles: many(userRoles),
  submissions: many(submissions),
  assignedCases: many(cases),
  votes: many(votes),
  notifications: many(notifications),
  auditLogs: many(auditLogs),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  userRoles: many(userRoles),
  rolePermissions: many(rolePermissions),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));

export const departmentsRelations = relations(departments, ({ many }) => ({
  cases: many(cases),
}));

export const topicTagsRelations = relations(topicTags, ({ one, many }) => ({
  parent: one(topicTags, {
    fields: [topicTags.parentId],
    references: [topicTags.id],
  }),
  children: many(topicTags),
  submissionTags: many(submissionTags),
}));

export const submissionsRelations = relations(submissions, ({ one, many }) => ({
  user: one(users, {
    fields: [submissions.userId],
    references: [users.id],
  }),
  cases: many(cases),
  submissionTags: many(submissionTags),
}));

export const submissionTagsRelations = relations(submissionTags, ({ one }) => ({
  submission: one(submissions, {
    fields: [submissionTags.submissionId],
    references: [submissions.id],
  }),
  tag: one(topicTags, {
    fields: [submissionTags.tagId],
    references: [topicTags.id],
  }),
}));

export const casesRelations = relations(cases, ({ one }) => ({
  submission: one(submissions, {
    fields: [cases.submissionId],
    references: [submissions.id],
  }),
  department: one(departments, {
    fields: [cases.departmentId],
    references: [departments.id],
  }),
  assignee: one(users, {
    fields: [cases.assigneeId],
    references: [users.id],
  }),
}));

export const pollsRelations = relations(polls, ({ many }) => ({
  votes: many(votes),
}));

export const votesRelations = relations(votes, ({ one }) => ({
  poll: one(polls, {
    fields: [votes.pollId],
    references: [polls.id],
  }),
  user: one(users, {
    fields: [votes.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  actor: one(users, {
    fields: [auditLogs.actorId],
    references: [users.id],
  }),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectUserSchema = createSelectSchema(users);

export const insertSubmissionSchema = createInsertSchema(submissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectSubmissionSchema = createSelectSchema(submissions);

export const insertCaseSchema = createInsertSchema(cases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectCaseSchema = createSelectSchema(cases);

export const insertDepartmentSchema = createInsertSchema(departments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectDepartmentSchema = createSelectSchema(departments);

export const insertPollSchema = createInsertSchema(polls).omit({
  id: true,
  createdAt: true,
});

export const selectPollSchema = createSelectSchema(polls);

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type UserWithRoles = User & {
  userRoles: Array<{
    role: typeof roles.$inferSelect;
  }>;
};

export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type Submission = typeof submissions.$inferSelect;

export type InsertCase = z.infer<typeof insertCaseSchema>;
export type Case = typeof cases.$inferSelect;

export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Department = typeof departments.$inferSelect;

export type InsertPoll = z.infer<typeof insertPollSchema>;
export type Poll = typeof polls.$inferSelect;

export type LoginRequest = z.infer<typeof loginSchema>;

export type Role = typeof roles.$inferSelect;
export type Permission = typeof permissions.$inferSelect;
export type TopicTag = typeof topicTags.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
