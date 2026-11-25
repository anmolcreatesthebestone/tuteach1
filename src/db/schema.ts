import { pgTable, text, integer, timestamp, boolean, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ----------------------------------------------------
// 1. Students Table
// ----------------------------------------------------
export const students = pgTable('students', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  targetGoals: text('target_goals'),
  role: text('role').notNull().default('student'),
  countryCode: text('country_code').notNull().default('IN'),
  dateOfBirth: text('date_of_birth'),
  ageAtRegistration: integer('age_at_registration'),
  isMinor: boolean('is_minor').notNull().default(false),
  applicableFramework: text('applicable_framework').notNull().default('INDIA_DPDP'),
  jurisdictionStatus: text('jurisdiction_status').notNull().default('ENABLED'),
  requiresParentalConsent: boolean('requires_parental_consent').notNull().default(false),
  parentalConsentStatus: text('parental_consent_status').notNull().default('NOT_REQUIRED'),
  complianceStatus: text('compliance_status').notNull().default('ACTIVE'),
  aiDisclosureAcceptedAt: timestamp('ai_disclosure_accepted_at', { withTimezone: true }),
  aiDisclosureVersion: text('ai_disclosure_version'),
  analyticsConsent: boolean('analytics_consent').notNull().default(false),
  functionalConsent: boolean('functional_consent').notNull().default(true),
  marketingConsent: boolean('marketing_consent').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

// ----------------------------------------------------
// 2. Student Password Credentials Table
// ----------------------------------------------------
export const studentPasswords = pgTable('student_passwords', {
  studentId: text('student_id')
    .primaryKey()
    .references(() => students.id, { onDelete: 'cascade' }),
  passwordHash: text('password_hash').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

// ----------------------------------------------------
// 3. Persistent Sessions Table
// ----------------------------------------------------
export const sessions = pgTable('sessions', {
  token: text('token').primaryKey(),
  studentId: text('student_id')
    .notNull()
    .references(() => students.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  lastActiveAt: timestamp('last_active_at', { withTimezone: true }).defaultNow().notNull(),
  userAgent: text('user_agent'),
  ipAddress: text('ip_address')
});

// ----------------------------------------------------
// 4. Verified Payments Ledger Table
// ----------------------------------------------------
export const payments = pgTable('payments', {
  id: text('id').primaryKey(),
  studentId: text('student_id')
    .notNull()
    .references(() => students.id, { onDelete: 'cascade' }),
  studentEmail: text('student_email').notNull(),
  courseId: text('course_id').notNull(),
  courseTitle: text('course_title').notNull(),
  orderId: text('order_id').notNull().unique(),
  paymentId: text('payment_id'),
  amount: integer('amount').notNull(),
  amountPaise: integer('amount_paise').notNull(),
  currency: text('currency').notNull().default('INR'),
  status: text('status').notNull(), // 'SUCCESS' | 'FAILED' | 'PENDING'
  paymentMethod: text('payment_method').notNull().default('RAZORPAY'),
  failureReason: text('failure_reason'),
  webhookVerified: boolean('webhook_verified').default(false).notNull(),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

// ----------------------------------------------------
// 5. Course Enrollments Table
// ----------------------------------------------------
export const courseEnrollments = pgTable(
  'course_enrollments',
  {
    id: text('id').primaryKey(), // `${studentId}_${courseId}`
    studentId: text('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    courseId: text('course_id').notNull(),
    courseTitle: text('course_title').notNull(),
    paymentId: text('payment_id'),
    orderId: text('order_id'),
    status: text('status').notNull().default('ACTIVE'),
    enrolledAt: timestamp('enrolled_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex('student_course_unique_idx').on(table.studentId, table.courseId)
  ]
);

// ----------------------------------------------------
// 6. Configurable Age & Jurisdiction Rules Table
// ----------------------------------------------------
export const ageJurisdictionRules = pgTable('age_jurisdiction_rules', {
  countryCode: text('country_code').primaryKey(),
  countryName: text('country_name').notNull(),
  regionGroup: text('region_group').notNull(), // 'INDIA' | 'US' | 'EU_EEA' | 'REST_OF_WORLD'
  consentAgeThreshold: integer('consent_age_threshold').notNull(),
  applicableFramework: text('applicable_framework').notNull(),
  enabled: boolean('enabled').notNull().default(false),
  requiresLegalReview: boolean('requires_legal_review').notNull().default(true),
  parentalConsentRequired: boolean('parental_consent_required').notNull().default(true),
  legalNotes: text('legal_notes'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

// ----------------------------------------------------
// 7. Verifiable Parental Consent Records Table
// ----------------------------------------------------
export const parentalConsents = pgTable('parental_consents', {
  id: text('id').primaryKey(),
  studentId: text('student_id')
    .notNull()
    .references(() => students.id, { onDelete: 'cascade' }),
  parentName: text('parent_name').notNull(),
  parentEmail: text('parent_email').notNull(),
  relationship: text('relationship').notNull(),
  verificationTokenHash: text('verification_token_hash'),
  tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }),
  tokenConsumedAt: timestamp('token_consumed_at', { withTimezone: true }),
  status: text('status').notNull().default('PENDING'), // 'PENDING' | 'VERIFIED' | 'REJECTED' | 'WITHDRAWN'
  verificationMethod: text('verification_method').notNull().default('TOKEN_DECLARATION'),
  policyVersion: text('policy_version').notNull(),
  noticeSummary: text('notice_summary').notNull(),
  signedName: text('signed_name'),
  parentAgeConfirmed: boolean('parent_age_confirmed').notNull().default(false),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  consentedAt: timestamp('consented_at', { withTimezone: true }),
  rejectedAt: timestamp('rejected_at', { withTimezone: true }),
  withdrawnAt: timestamp('withdrawn_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

// ----------------------------------------------------
// 8. Policy Versions Table
// ----------------------------------------------------
export const policyVersions = pgTable('policy_versions', {
  id: text('id').primaryKey(),
  policyKey: text('policy_key').notNull().unique(),
  title: text('title').notNull(),
  version: text('version').notNull(),
  effectiveDate: text('effective_date').notNull(),
  requiresFreshConsent: boolean('requires_fresh_consent').notNull().default(false),
  summary: text('summary').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

// ----------------------------------------------------
// 9. Policy Acceptances Audit Table
// ----------------------------------------------------
export const policyAcceptances = pgTable('policy_acceptances', {
  id: text('id').primaryKey(),
  studentId: text('student_id')
    .notNull()
    .references(() => students.id, { onDelete: 'cascade' }),
  policyKey: text('policy_key').notNull(),
  policyVersion: text('policy_version').notNull(),
  context: text('context').notNull(), // 'registration' | 'checkout' | 'ai_classroom' | 'reconsent' | 'cookie_banner'
  acceptedAt: timestamp('accepted_at', { withTimezone: true }).defaultNow().notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent')
});

// ----------------------------------------------------
// 10. Privacy & Data Subject Rights Requests Table
// ----------------------------------------------------
export const privacyRequests = pgTable('privacy_requests', {
  id: text('id').primaryKey(),
  studentId: text('student_id')
    .notNull()
    .references(() => students.id, { onDelete: 'cascade' }),
  requesterRole: text('requester_role').notNull().default('student'),
  requestType: text('request_type').notNull(), // 'ACCESS_EXPORT' | 'CORRECTION' | 'DELETION' | 'CONSENT_WITHDRAWAL'
  status: text('status').notNull().default('SUBMITTED'), // 'SUBMITTED' | 'IN_REVIEW' | 'COMPLETED' | 'REJECTED'
  detailsJson: text('details_json'),
  resolutionNotes: text('resolution_notes'),
  financialRecordsRetained: boolean('financial_records_retained').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true })
});

// ----------------------------------------------------
// 11. Grievances & Legal Inquiries Table
// ----------------------------------------------------
export const grievances = pgTable('grievances', {
  id: text('id').primaryKey(),
  referenceCode: text('reference_code').notNull().unique(),
  studentId: text('student_id').references(() => students.id, { onDelete: 'set null' }),
  reporterName: text('reporter_name').notNull(),
  contactEmail: text('contact_email').notNull(),
  category: text('category').notNull(),
  description: text('description').notNull(),
  attachmentName: text('attachment_name'),
  status: text('status').notNull().default('OPEN'), // 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'CLOSED'
  slaDueAt: timestamp('sla_due_at', { withTimezone: true }).notNull(),
  resolutionNotes: text('resolution_notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

// ----------------------------------------------------
// 12. Data Retention Schedules Table
// ----------------------------------------------------
export const dataRetentionSchedules = pgTable('data_retention_schedules', {
  id: text('id').primaryKey(),
  dataCategory: text('data_category').notNull(),
  retentionDays: integer('retention_days').notNull(),
  retentionLabel: text('retention_label').notNull(),
  legalBasis: text('legal_basis').notNull(),
  autoPurgeSupported: boolean('auto_purge_supported').notNull().default(true),
  lastReviewedAt: timestamp('last_reviewed_at', { withTimezone: true }).defaultNow().notNull(),
  notes: text('notes')
});

// ----------------------------------------------------
// 13. Third-Party Processors Inventory Table
// ----------------------------------------------------
export const thirdPartyProcessors = pgTable('third_party_processors', {
  id: text('id').primaryKey(),
  processorName: text('processor_name').notNull(),
  serviceCategory: text('service_category').notNull(),
  purpose: text('purpose').notNull(),
  dataShared: text('data_shared').notNull(),
  jurisdiction: text('jurisdiction').notNull(),
  status: text('status').notNull().default('CONFIGURED_NEEDS_LEGAL_REVIEW'),
  policyNote: text('policy_note')
});

// ----------------------------------------------------
// 14. Security Incidents Log Table
// ----------------------------------------------------
export const securityIncidents = pgTable('security_incidents', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  severity: text('severity').notNull(), // 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  category: text('category').notNull(),
  status: text('status').notNull().default('OPEN'),
  description: text('description').notNull(),
  affectedCount: integer('affected_count').notNull().default(0),
  detectedAt: timestamp('detected_at', { withTimezone: true }).defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true })
});

// ----------------------------------------------------
// 15. Compliance Audit Logs Table
// ----------------------------------------------------
export const complianceAuditLogs = pgTable('compliance_audit_logs', {
  id: text('id').primaryKey(),
  actorId: text('actor_id').notNull(),
  actorRole: text('actor_role').notNull(),
  action: text('action').notNull(),
  targetType: text('target_type').notNull(),
  targetId: text('target_id').notNull(),
  summary: text('summary').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

// ----------------------------------------------------
// 16. Legal Entity & Grievance Officer Placeholders Table
// ----------------------------------------------------
export const legalEntityConfig = pgTable('legal_entity_config', {
  id: text('id').primaryKey(),
  legalBusinessName: text('legal_business_name').notNull(),
  registeredAddress: text('registered_address').notNull(),
  privacyEmail: text('privacy_email').notNull(),
  grievanceOfficerName: text('grievance_officer_name').notNull(),
  grievanceOfficerContact: text('grievance_officer_contact').notNull(),
  grievanceEmail: text('grievance_email').notNull(),
  grievanceResponseSla: text('grievance_response_sla').notNull(),
  dpoOrPrivacyLead: text('dpo_or_privacy_lead').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

// ----------------------------------------------------
// 17. Educational Blog & SEO Content Table
// ----------------------------------------------------
export const blogPosts = pgTable('blog_posts', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  seoTitle: text('seo_title').notNull(),
  metaDescription: text('meta_description').notNull(),
  excerpt: text('excerpt').notNull(),
  contentMarkdown: text('content_markdown').notNull(),
  category: text('category').notNull(),
  authorName: text('author_name').notNull(),
  authorRole: text('author_role').notNull(),
  featuredImageUrl: text('featured_image_url').notNull(),
  featuredImageAlt: text('featured_image_alt').notNull(),
  readTimeMinutes: integer('read_time_minutes').notNull().default(6),
  primaryKeyword: text('primary_keyword').notNull(),
  relatedCourseId: text('related_course_id').notNull().default('course-davinci-resolve'),
  relatedCoursePath: text('related_course_path').notNull().default('/courses/davinci-resolve-for-beginners'),
  status: text('status').notNull().default('DRAFT'), // 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  publishedAt: text('published_at').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

// ----------------------------------------------------
// Relations Definitions
// ----------------------------------------------------
export const studentsRelations = relations(students, ({ one, many }) => ({
  password: one(studentPasswords, {
    fields: [students.id],
    references: [studentPasswords.studentId]
  }),
  sessions: many(sessions),
  payments: many(payments),
  enrollments: many(courseEnrollments),
  parentalConsents: many(parentalConsents),
  policyAcceptances: many(policyAcceptances),
  privacyRequests: many(privacyRequests)
}));

export const studentPasswordsRelations = relations(studentPasswords, ({ one }) => ({
  student: one(students, {
    fields: [studentPasswords.studentId],
    references: [students.id]
  })
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  student: one(students, {
    fields: [sessions.studentId],
    references: [students.id]
  })
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  student: one(students, {
    fields: [payments.studentId],
    references: [students.id]
  })
}));

export const courseEnrollmentsRelations = relations(courseEnrollments, ({ one }) => ({
  student: one(students, {
    fields: [courseEnrollments.studentId],
    references: [students.id]
  })
}));

export type Student = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type CourseEnrollment = typeof courseEnrollments.$inferSelect;
export type AgeJurisdictionRule = typeof ageJurisdictionRules.$inferSelect;
export type ParentalConsent = typeof parentalConsents.$inferSelect;
export type PolicyVersion = typeof policyVersions.$inferSelect;
export type PolicyAcceptance = typeof policyAcceptances.$inferSelect;
export type PrivacyRequest = typeof privacyRequests.$inferSelect;
export type GrievanceRecord = typeof grievances.$inferSelect;
export type DataRetentionSchedule = typeof dataRetentionSchedules.$inferSelect;
export type ThirdPartyProcessor = typeof thirdPartyProcessors.$inferSelect;
export type SecurityIncident = typeof securityIncidents.$inferSelect;
export type ComplianceAuditLog = typeof complianceAuditLogs.$inferSelect;
export type LegalEntityConfig = typeof legalEntityConfig.$inferSelect;
export type BlogPost = typeof blogPosts.$inferSelect;
export type NewBlogPost = typeof blogPosts.$inferInsert;

