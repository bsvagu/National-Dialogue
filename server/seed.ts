import { db } from './db';
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
  notifications
} from '@shared/schema';
import { hashPassword } from './auth';

export async function seedDatabase() {
  console.log('Starting database seeding...');

  try {
    // Create roles
    const roleData = [
      { name: 'SuperAdmin', description: 'Full system access and user management' },
      { name: 'Admin', description: 'Administrative access to most features' },
      { name: 'Analyst', description: 'Read-only access to analytics and reports' },
      { name: 'Moderator', description: 'Review and moderate submissions' },
      { name: 'DeptOfficer', description: 'Manage assigned cases and department data' },
      { name: 'Citizen', description: 'Basic user access for submissions and polls' }
    ];

    const createdRoles = await db.insert(roles).values(roleData).returning();
    console.log(`Created ${createdRoles.length} roles`);

    // Create permissions
    const permissionData = [
      { key: 'manage_users', description: 'Create, update, and delete users' },
      { key: 'manage_roles', description: 'Assign and remove user roles' },
      { key: 'manage_departments', description: 'CRUD operations on departments' },
      { key: 'manage_taxonomy', description: 'Manage topic tags and categories' },
      { key: 'review_submissions', description: 'Review and moderate submissions' },
      { key: 'manage_cases', description: 'Create and manage cases' },
      { key: 'view_analytics', description: 'Access analytics and reports' },
      { key: 'export_data', description: 'Export system data' },
      { key: 'manage_polls', description: 'Create and manage polls' },
      { key: 'manage_settings', description: 'System configuration' },
      { key: 'view_audit_logs', description: 'Access audit trail' }
    ];

    const createdPermissions = await db.insert(permissions).values(permissionData).returning();
    console.log(`Created ${createdPermissions.length} permissions`);

    // Create departments with South African context
    const departmentData = [
      { name: 'Health', jurisdiction: 'national', slaHours: 72, email: 'health@gov.za' },
      { name: 'Transport', jurisdiction: 'provincial', slaHours: 120, email: 'transport@gov.za' },
      { name: 'Education', jurisdiction: 'provincial', slaHours: 96, email: 'education@gov.za' },
      { name: 'Safety & Security', jurisdiction: 'national', slaHours: 120, email: 'safety@gov.za' },
      { name: 'Housing & Land', jurisdiction: 'provincial', slaHours: 144, email: 'housing@gov.za' },
      { name: 'Energy', jurisdiction: 'national', slaHours: 168, email: 'energy@gov.za' },
      { name: 'Environment', jurisdiction: 'national', slaHours: 168, email: 'environment@gov.za' },
      { name: 'Governance & Service Delivery', jurisdiction: 'municipal', slaHours: 120, email: 'governance@gov.za' },
      { name: 'Social Development', jurisdiction: 'provincial', slaHours: 120, email: 'social@gov.za' },
      { name: 'Economy & Jobs', jurisdiction: 'national', slaHours: 96, email: 'economy@gov.za' },
      { name: 'Youth & Skills', jurisdiction: 'national', slaHours: 96, email: 'youth@gov.za' },
      { name: 'Digital & Innovation', jurisdiction: 'national', slaHours: 96, email: 'digital@gov.za' }
    ];

    const createdDepartments = await db.insert(departments).values(departmentData as any).returning();
    console.log(`Created ${createdDepartments.length} departments`);

    // Create topic tags
    const topicTagData = [
      // Top level categories
      { name: 'Infrastructure' },
      { name: 'Healthcare' },
      { name: 'Education' },
      { name: 'Safety' },
      { name: 'Housing' },
      { name: 'Economy' },
      { name: 'Environment' },
      { name: 'Transport' },
      { name: 'Social Services' },
      { name: 'Governance' }
    ];

    const createdTopicTags = await db.insert(topicTags).values(topicTagData).returning();
    console.log(`Created ${createdTopicTags.length} topic tags`);

    // Create users with proper SA context
    const userData = [
      {
        name: 'Thandi Dlamini',
        email: 'thandi@admin.local',
        passwordHash: await hashPassword('admin123'),
        province: 'gauteng',
        isActive: true
      },
      {
        name: 'Johan Botha',
        email: 'johan@admin.local',
        passwordHash: await hashPassword('admin123'),
        province: 'western_cape',
        isActive: true
      },
      {
        name: 'Naledi Mokoena',
        email: 'naledi@analytics.local',
        passwordHash: await hashPassword('analyst123'),
        province: 'gauteng',
        isActive: true
      },
      {
        name: 'Sipho Ncube',
        email: 'sipho@moderation.local',
        passwordHash: await hashPassword('mod123'),
        province: 'kwazulu_natal',
        isActive: true
      },
      {
        name: 'Zanele Khumalo',
        email: 'zanele.health@kzn.local',
        passwordHash: await hashPassword('dept123'),
        province: 'kwazulu_natal',
        isActive: true
      },
      {
        name: 'Pieter van Wyk',
        email: 'pieter.transport@gp.local',
        passwordHash: await hashPassword('dept123'),
        province: 'gauteng',
        isActive: true
      },
      {
        name: 'Asha Naidoo',
        email: 'asha@citizen.local',
        passwordHash: await hashPassword('citizen123'),
        province: 'kwazulu_natal',
        isActive: true
      }
    ];

    const createdUsers = await db.insert(users).values(userData as any).returning();
    console.log(`Created ${createdUsers.length} users`);

    // Assign roles to users
    const roleAssignments = [
      { userId: createdUsers[0].id, roleId: createdRoles.find(r => r.name === 'SuperAdmin')!.id },
      { userId: createdUsers[1].id, roleId: createdRoles.find(r => r.name === 'Admin')!.id },
      { userId: createdUsers[2].id, roleId: createdRoles.find(r => r.name === 'Analyst')!.id },
      { userId: createdUsers[3].id, roleId: createdRoles.find(r => r.name === 'Moderator')!.id },
      { userId: createdUsers[4].id, roleId: createdRoles.find(r => r.name === 'DeptOfficer')!.id },
      { userId: createdUsers[5].id, roleId: createdRoles.find(r => r.name === 'DeptOfficer')!.id },
      { userId: createdUsers[6].id, roleId: createdRoles.find(r => r.name === 'Citizen')!.id }
    ];

    await db.insert(userRoles).values(roleAssignments);
    console.log(`Assigned roles to ${roleAssignments.length} users`);

    // Create sample submissions
    const submissionData = [
      {
        userId: createdUsers[6].id,
        channel: 'mobile',
        text: 'The potholes on Johannesburg Road are causing serious damage to vehicles. We need immediate attention to fix this road.',
        province: 'gauteng',
        sentiment: -0.3,
        status: 'new'
      },
      {
        userId: createdUsers[6].id,
        channel: 'whatsapp',
        text: 'Our local clinic in Soweto needs more staff. Waiting times are too long and people are suffering.',
        province: 'gauteng',
        sentiment: -0.5,
        status: 'moderated'
      },
      {
        userId: createdUsers[6].id,
        channel: 'mobile',
        text: 'Thank you for the new library in our community. The children are very happy.',
        province: 'western_cape',
        sentiment: 0.8,
        status: 'resolved'
      },
      {
        channel: 'web',
        text: 'Water supply has been interrupted in Khayelitsha for 3 days now. When will this be fixed?',
        province: 'western_cape',
        sentiment: -0.4,
        status: 'routed'
      },
      {
        channel: 'mobile',
        text: 'The new taxi rank has improved transport in our area significantly.',
        province: 'kwazulu_natal',
        sentiment: 0.6,
        status: 'resolved'
      }
    ];

    const createdSubmissions = await db.insert(submissions).values(submissionData as any).returning();
    console.log(`Created ${createdSubmissions.length} submissions`);

    // Create sample cases
    const caseData = [
      {
        submissionId: createdSubmissions[0].id,
        departmentId: createdDepartments.find(d => d.name === 'Transport')!.id,
        assigneeId: createdUsers[5].id,
        priority: 'high',
        state: 'open',
        dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days from now
      },
      {
        submissionId: createdSubmissions[1].id,
        departmentId: createdDepartments.find(d => d.name === 'Health')!.id,
        assigneeId: createdUsers[4].id,
        priority: 'medium',
        state: 'investigating',
        dueAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // Overdue by 1 day
      }
    ];

    const createdCases = await db.insert(cases).values(caseData as any).returning();
    console.log(`Created ${createdCases.length} cases`);

    // Create sample polls
    const pollData = [
      {
        question: 'What is the most important service delivery issue in your community?',
        options: JSON.stringify([
          'Water and Sanitation',
          'Electricity',
          'Healthcare',
          'Education',
          'Transport',
          'Housing'
        ]),
        startAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      },
      {
        question: 'How would you rate the government response to community issues?',
        options: JSON.stringify([
          'Excellent',
          'Good',
          'Average',
          'Poor',
          'Very Poor'
        ]),
        startAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        endAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      }
    ];

    const createdPolls = await db.insert(polls).values(pollData).returning();
    console.log(`Created ${createdPolls.length} polls`);

    // Create sample notifications
    const notificationData = [
      {
        userId: createdUsers[0].id,
        type: 'case_overdue',
        title: 'Case Overdue',
        body: 'Case #CS-2024-001 is overdue and requires attention'
      },
      {
        userId: createdUsers[3].id,
        type: 'submission_review',
        title: 'New Submissions for Review',
        body: 'You have 5 new submissions awaiting moderation'
      },
      {
        userId: createdUsers[4].id,
        type: 'case_assigned',
        title: 'New Case Assigned',
        body: 'Case #CS-2024-002 has been assigned to you'
      }
    ];

    await db.insert(notifications).values(notificationData);
    console.log(`Created ${notificationData.length} notifications`);

    console.log('Database seeding completed successfully!');
    console.log('\nDemo login credentials:');
    console.log('SuperAdmin: thandi@admin.local / admin123');
    console.log('Admin: johan@admin.local / admin123');
    console.log('Analyst: naledi@analytics.local / analyst123');
    console.log('Moderator: sipho@moderation.local / mod123');
    console.log('DeptOfficer: zanele.health@kzn.local / dept123');
    console.log('Citizen: asha@citizen.local / citizen123');

  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

// Run seeding if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
