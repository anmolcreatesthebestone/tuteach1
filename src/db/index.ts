import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { PGlite } from '@electric-sql/pglite';
import { drizzle as drizzlePgLite } from 'drizzle-orm/pglite';
import { drizzle as drizzleNodePg } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq, and, gt } from 'drizzle-orm';
import * as schema from './schema.ts';

// ----------------------------------------------------
// Database Engine Initialization
// Supports both Cloud SQL (pg.Pool) and Embedded Persistent PostgreSQL (PGlite)
// ----------------------------------------------------
let dbInstance: any = null;
let pgliteInstance: PGlite | null = null;
let pgPoolInstance: Pool | null = null;
let initDbPromise: Promise<any> | null = null;

const DATA_DIR = path.resolve(process.cwd(), 'data', 'postgres');

export async function getDb() {
  if (dbInstance) {
    return dbInstance;
  }
  if (initDbPromise) {
    return initDbPromise;
  }

  initDbPromise = (async () => {
    const sqlHost = process.env.SQL_HOST;
    const dbUrl = process.env.DATABASE_URL;

    if (sqlHost || dbUrl) {
      // Cloud SQL or External PostgreSQL via connection pool
      try {
        if (sqlHost) {
          pgPoolInstance = new Pool({
            host: process.env.SQL_HOST,
            user: process.env.SQL_USER || process.env.SQL_ADMIN_USER,
            password: process.env.SQL_PASSWORD || process.env.SQL_ADMIN_PASSWORD,
            database: process.env.SQL_DB_NAME || 'tuteach',
            max: 10,
            connectionTimeoutMillis: 15000,
          });
        } else {
          pgPoolInstance = new Pool({
            connectionString: dbUrl,
            max: 10,
            connectionTimeoutMillis: 15000,
          });
        }

        pgPoolInstance.on('error', (err) => {
          console.error('[DB] Unexpected error on idle Postgres pool client:', err);
        });

        dbInstance = drizzleNodePg(pgPoolInstance, { schema });
        console.log('[DB] Connected to PostgreSQL host via connection pool.');
        await ensureTablesExist(dbInstance);
        return dbInstance;
      } catch (err) {
        console.warn('[DB] Failed connecting to external Postgres, falling back to embedded persistent Postgres:', err);
      }
    }

    // Embedded Persistent PostgreSQL Engine (PGlite)
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } else {
      // Check cluster completeness - if directory exists but lacks global/pg_control, clean it up for fresh initdb
      const pgControl = path.join(DATA_DIR, 'global', 'pg_control');
      if (!fs.existsSync(pgControl)) {
        console.warn('[DB] Incomplete postgres cluster detected (missing global/pg_control). Resetting data directory for clean initdb.');
        try {
          fs.rmSync(DATA_DIR, { recursive: true, force: true });
          fs.mkdirSync(DATA_DIR, { recursive: true });
        } catch (rmErr) {
          console.error('[DB] Failed resetting corrupted cluster dir:', rmErr);
        }
      }
    }

    // Remove stale postmaster lock if leftover from previous process exit
    const pidFile = path.join(DATA_DIR, 'postmaster.pid');
    if (fs.existsSync(pidFile)) {
      try {
        fs.unlinkSync(pidFile);
      } catch {
        // ignore
      }
    }

    try {
      pgliteInstance = new PGlite(DATA_DIR);
      await pgliteInstance.waitReady;
    } catch (initErr) {
      console.warn('[DB] Persistent PGlite initialization encountered error, resetting data directory for clean start:', initErr);
      try {
        fs.rmSync(DATA_DIR, { recursive: true, force: true });
        fs.mkdirSync(DATA_DIR, { recursive: true });
        pgliteInstance = new PGlite(DATA_DIR);
        await pgliteInstance.waitReady;
      } catch (retryErr) {
        console.warn('[DB] File-backed PGlite recovery failed, using safe memory instance:', retryErr);
        pgliteInstance = new PGlite();
        await pgliteInstance.waitReady;
      }
    }

    dbInstance = drizzlePgLite(pgliteInstance, { schema });
    console.log(`[DB] Embedded persistent PostgreSQL engine initialized`);

    await ensureTablesExist(dbInstance);
    return dbInstance;
  })();

  try {
    return await initDbPromise;
  } catch (err) {
    initDbPromise = null; // allow retry on failure
    throw err;
  }
}

// ----------------------------------------------------
// Automatic Table Creation / Migration
// ----------------------------------------------------
async function ensureTablesExist(db: any) {
  const ddl = `
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      target_goals TEXT,
      role TEXT NOT NULL DEFAULT 'student',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS student_passwords (
      student_id TEXT PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
      password_hash TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      user_agent TEXT,
      ip_address TEXT
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      student_email TEXT NOT NULL,
      course_id TEXT NOT NULL,
      course_title TEXT NOT NULL,
      order_id TEXT NOT NULL UNIQUE,
      payment_id TEXT,
      amount INTEGER NOT NULL,
      amount_paise INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'INR',
      status TEXT NOT NULL,
      payment_method TEXT NOT NULL DEFAULT 'RAZORPAY',
      failure_reason TEXT,
      webhook_verified BOOLEAN NOT NULL DEFAULT FALSE,
      verified_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS course_enrollments (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      course_id TEXT NOT NULL,
      course_title TEXT NOT NULL,
      payment_id TEXT,
      order_id TEXT,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE UNIQUE INDEX IF NOT EXISTS student_course_unique_idx ON course_enrollments (student_id, course_id);

    -- Non-destructive column additions for existing students rows
    ALTER TABLE students ADD COLUMN IF NOT EXISTS country_code TEXT NOT NULL DEFAULT 'IN';
    ALTER TABLE students ADD COLUMN IF NOT EXISTS date_of_birth TEXT;
    ALTER TABLE students ADD COLUMN IF NOT EXISTS age_at_registration INTEGER;
    ALTER TABLE students ADD COLUMN IF NOT EXISTS is_minor BOOLEAN NOT NULL DEFAULT FALSE;
    ALTER TABLE students ADD COLUMN IF NOT EXISTS applicable_framework TEXT NOT NULL DEFAULT 'INDIA_DPDP';
    ALTER TABLE students ADD COLUMN IF NOT EXISTS jurisdiction_status TEXT NOT NULL DEFAULT 'ENABLED';
    ALTER TABLE students ADD COLUMN IF NOT EXISTS requires_parental_consent BOOLEAN NOT NULL DEFAULT FALSE;
    ALTER TABLE students ADD COLUMN IF NOT EXISTS parental_consent_status TEXT NOT NULL DEFAULT 'NOT_REQUIRED';
    ALTER TABLE students ADD COLUMN IF NOT EXISTS compliance_status TEXT NOT NULL DEFAULT 'ACTIVE';
    ALTER TABLE students ADD COLUMN IF NOT EXISTS ai_disclosure_accepted_at TIMESTAMPTZ;
    ALTER TABLE students ADD COLUMN IF NOT EXISTS ai_disclosure_version TEXT;
    ALTER TABLE students ADD COLUMN IF NOT EXISTS analytics_consent BOOLEAN NOT NULL DEFAULT FALSE;
    ALTER TABLE students ADD COLUMN IF NOT EXISTS functional_consent BOOLEAN NOT NULL DEFAULT TRUE;
    ALTER TABLE students ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN NOT NULL DEFAULT FALSE;

    CREATE TABLE IF NOT EXISTS age_jurisdiction_rules (
      country_code TEXT PRIMARY KEY,
      country_name TEXT NOT NULL,
      region_group TEXT NOT NULL,
      consent_age_threshold INTEGER NOT NULL,
      applicable_framework TEXT NOT NULL,
      enabled BOOLEAN NOT NULL DEFAULT FALSE,
      requires_legal_review BOOLEAN NOT NULL DEFAULT TRUE,
      parental_consent_required BOOLEAN NOT NULL DEFAULT TRUE,
      legal_notes TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS parental_consents (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      parent_name TEXT NOT NULL,
      parent_email TEXT NOT NULL,
      relationship TEXT NOT NULL,
      verification_token_hash TEXT,
      token_expires_at TIMESTAMPTZ,
      token_consumed_at TIMESTAMPTZ,
      status TEXT NOT NULL DEFAULT 'PENDING',
      verification_method TEXT NOT NULL DEFAULT 'TOKEN_DECLARATION',
      policy_version TEXT NOT NULL,
      notice_summary TEXT NOT NULL,
      signed_name TEXT,
      parent_age_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
      ip_address TEXT,
      user_agent TEXT,
      consented_at TIMESTAMPTZ,
      rejected_at TIMESTAMPTZ,
      withdrawn_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS policy_versions (
      id TEXT PRIMARY KEY,
      policy_key TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      version TEXT NOT NULL,
      effective_date TEXT NOT NULL,
      requires_fresh_consent BOOLEAN NOT NULL DEFAULT FALSE,
      summary TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS policy_acceptances (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      policy_key TEXT NOT NULL,
      policy_version TEXT NOT NULL,
      context TEXT NOT NULL,
      accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      ip_address TEXT,
      user_agent TEXT
    );

    CREATE TABLE IF NOT EXISTS privacy_requests (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      requester_role TEXT NOT NULL DEFAULT 'student',
      request_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'SUBMITTED',
      details_json TEXT,
      resolution_notes TEXT,
      financial_records_retained BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      resolved_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS grievances (
      id TEXT PRIMARY KEY,
      reference_code TEXT NOT NULL UNIQUE,
      student_id TEXT REFERENCES students(id) ON DELETE SET NULL,
      reporter_name TEXT NOT NULL,
      contact_email TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      attachment_name TEXT,
      status TEXT NOT NULL DEFAULT 'OPEN',
      sla_due_at TIMESTAMPTZ NOT NULL,
      resolution_notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS data_retention_schedules (
      id TEXT PRIMARY KEY,
      data_category TEXT NOT NULL,
      retention_days INTEGER NOT NULL,
      retention_label TEXT NOT NULL,
      legal_basis TEXT NOT NULL,
      auto_purge_supported BOOLEAN NOT NULL DEFAULT TRUE,
      last_reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS third_party_processors (
      id TEXT PRIMARY KEY,
      processor_name TEXT NOT NULL,
      service_category TEXT NOT NULL,
      purpose TEXT NOT NULL,
      data_shared TEXT NOT NULL,
      jurisdiction TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'CONFIGURED_NEEDS_LEGAL_REVIEW',
      policy_note TEXT
    );

    CREATE TABLE IF NOT EXISTS security_incidents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      severity TEXT NOT NULL,
      category TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'OPEN',
      description TEXT NOT NULL,
      affected_count INTEGER NOT NULL DEFAULT 0,
      detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      resolved_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS compliance_audit_logs (
      id TEXT PRIMARY KEY,
      actor_id TEXT NOT NULL,
      actor_role TEXT NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      summary TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS legal_entity_config (
      id TEXT PRIMARY KEY,
      legal_business_name TEXT NOT NULL,
      registered_address TEXT NOT NULL,
      privacy_email TEXT NOT NULL,
      grievance_officer_name TEXT NOT NULL,
      grievance_officer_contact TEXT NOT NULL,
      grievance_email TEXT NOT NULL,
      grievance_response_sla TEXT NOT NULL,
      dpo_or_privacy_lead TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS blog_posts (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      seo_title TEXT NOT NULL,
      meta_description TEXT NOT NULL,
      excerpt TEXT NOT NULL,
      content_markdown TEXT NOT NULL,
      category TEXT NOT NULL,
      author_name TEXT NOT NULL,
      author_role TEXT NOT NULL,
      featured_image_url TEXT NOT NULL,
      featured_image_alt TEXT NOT NULL,
      read_time_minutes INTEGER NOT NULL DEFAULT 6,
      primary_keyword TEXT NOT NULL,
      related_course_id TEXT NOT NULL DEFAULT 'course-davinci-resolve',
      related_course_path TEXT NOT NULL DEFAULT '/courses/davinci-resolve-for-beginners',
      status TEXT NOT NULL DEFAULT 'DRAFT',
      published_at TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  if (pgliteInstance) {
    await pgliteInstance.exec(ddl);
  } else if (pgPoolInstance) {
    await pgPoolInstance.query(ddl);
  }
}

// ----------------------------------------------------
// Password Security (bcryptjs)
// ----------------------------------------------------
export async function hashPassword(plainText: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainText, salt);
}

export async function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

// ----------------------------------------------------
// Student Management Repository
// ----------------------------------------------------
export async function createStudentWithPassword(
  name: string,
  email: string,
  plainPassword: string,
  targetGoals: string = 'Master Video Editing with DaVinci Resolve',
  complianceFields?: Partial<schema.NewStudent>,
  userAgent?: string,
  ipAddress?: string
): Promise<{ student: schema.Student; token: string }> {
  const db = await getDb();
  const normEmail = email.trim().toLowerCase();

  // Check if student exists
  const existing = await getStudentByEmail(normEmail);
  if (existing) {
    throw new Error('An account with this email already exists. Please log in.');
  }

  const studentId = `usr_${crypto.randomBytes(8).toString('hex')}`;
  const passwordHash = await hashPassword(plainPassword);

  const newStudent: schema.NewStudent = {
    id: studentId,
    email: normEmail,
    name: name.trim(),
    targetGoals,
    role: 'student',
    countryCode: complianceFields?.countryCode || 'IN',
    dateOfBirth: complianceFields?.dateOfBirth ?? null,
    ageAtRegistration: complianceFields?.ageAtRegistration ?? null,
    isMinor: complianceFields?.isMinor ?? false,
    applicableFramework: complianceFields?.applicableFramework || 'INDIA_DPDP',
    jurisdictionStatus: complianceFields?.jurisdictionStatus || 'ENABLED',
    requiresParentalConsent: complianceFields?.requiresParentalConsent ?? false,
    parentalConsentStatus: complianceFields?.parentalConsentStatus || 'NOT_REQUIRED',
    complianceStatus: complianceFields?.complianceStatus || 'ACTIVE',
    aiDisclosureAcceptedAt: complianceFields?.aiDisclosureAcceptedAt ?? null,
    aiDisclosureVersion: complianceFields?.aiDisclosureVersion ?? null,
    analyticsConsent: complianceFields?.analyticsConsent ?? false,
    functionalConsent: complianceFields?.functionalConsent ?? true,
    marketingConsent: complianceFields?.marketingConsent ?? false,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await db.insert(schema.students).values(newStudent);
  await db.insert(schema.studentPasswords).values({
    studentId,
    passwordHash,
    updatedAt: new Date()
  });

  const session = await createSession(studentId, userAgent, ipAddress);
  return { student: newStudent as schema.Student, token: session.token };
}

export async function getStudentByEmail(email: string): Promise<schema.Student | null> {
  const db = await getDb();
  const normEmail = email.trim().toLowerCase();
  const rows = await db.select().from(schema.students).where(eq(schema.students.email, normEmail)).limit(1);
  return rows[0] || null;
}

export async function getStudentById(id: string): Promise<schema.Student | null> {
  const db = await getDb();
  const rows = await db.select().from(schema.students).where(eq(schema.students.id, id)).limit(1);
  return rows[0] || null;
}

export async function authenticateStudent(
  email: string,
  plainPassword: string,
  userAgent?: string,
  ipAddress?: string
): Promise<{ student: schema.Student; token: string } | null> {
  const student = await getStudentByEmail(email);
  if (!student || student.complianceStatus === 'DELETED_ANONYMIZED') {
    return null;
  }

  const db = await getDb();
  const pwdRows = await db
    .select()
    .from(schema.studentPasswords)
    .where(eq(schema.studentPasswords.studentId, student.id))
    .limit(1);

  if (!pwdRows[0]) {
    return null;
  }

  const isValid = await verifyPassword(plainPassword, pwdRows[0].passwordHash);
  if (!isValid) {
    return null;
  }

  const session = await createSession(student.id, userAgent, ipAddress);
  return { student, token: session.token };
}

// ----------------------------------------------------
// Session Management Repository
// 7-day TTL with revocation and rotation
// ----------------------------------------------------
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function createSession(
  studentId: string,
  userAgent?: string,
  ipAddress?: string
): Promise<schema.Session> {
  const db = await getDb();
  const token = `tut_sess_${crypto.randomBytes(24).toString('hex')}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);

  const sessionData = {
    token,
    studentId,
    expiresAt,
    createdAt: now,
    lastActiveAt: now,
    userAgent: userAgent || null,
    ipAddress: ipAddress || null
  };

  await db.insert(schema.sessions).values(sessionData);
  return sessionData;
}

export async function getSessionAndStudent(token: string): Promise<{
  session: schema.Session;
  student: schema.Student;
} | null> {
  if (!token) return null;
  const db = await getDb();
  const now = new Date();

  const sessionRows = await db
    .select()
    .from(schema.sessions)
    .where(and(eq(schema.sessions.token, token), gt(schema.sessions.expiresAt, now)))
    .limit(1);

  const session = sessionRows[0];
  if (!session) {
    return null;
  }

  // Update lastActiveAt and slide expiration if active
  await db
    .update(schema.sessions)
    .set({
      lastActiveAt: now,
      expiresAt: new Date(now.getTime() + SESSION_TTL_MS)
    })
    .where(eq(schema.sessions.token, token));

  const student = await getStudentById(session.studentId);
  if (!student) {
    return null;
  }

  return { session, student };
}

export async function revokeSession(token: string): Promise<boolean> {
  if (!token) return false;
  const db = await getDb();
  await db.delete(schema.sessions).where(eq(schema.sessions.token, token));
  return true;
}

// ----------------------------------------------------
// Payment Ledger Repository
// ----------------------------------------------------
export async function recordPayment(paymentData: {
  id: string;
  studentId: string;
  studentEmail: string;
  courseId: string;
  courseTitle: string;
  orderId: string;
  paymentId?: string;
  amount: number;
  amountPaise: number;
  currency?: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  paymentMethod?: string;
  failureReason?: string;
  webhookVerified?: boolean;
  verifiedAt?: Date;
}): Promise<schema.Payment> {
  const db = await getDb();
  const now = new Date();

  const record = {
    id: paymentData.id,
    studentId: paymentData.studentId,
    studentEmail: paymentData.studentEmail.toLowerCase(),
    courseId: paymentData.courseId,
    courseTitle: paymentData.courseTitle,
    orderId: paymentData.orderId,
    paymentId: paymentData.paymentId || null,
    amount: paymentData.amount,
    amountPaise: paymentData.amountPaise,
    currency: paymentData.currency || 'INR',
    status: paymentData.status,
    paymentMethod: paymentData.paymentMethod || 'RAZORPAY',
    failureReason: paymentData.failureReason || null,
    webhookVerified: paymentData.webhookVerified || false,
    verifiedAt: paymentData.verifiedAt || (paymentData.status === 'SUCCESS' ? now : null),
    createdAt: now
  };

  // Upsert on orderId or id
  const existing = await getPaymentByOrderId(paymentData.orderId);
  if (existing) {
    await db
      .update(schema.payments)
      .set({
        paymentId: record.paymentId || existing.paymentId,
        status: record.status,
        failureReason: record.failureReason,
        webhookVerified: record.webhookVerified || existing.webhookVerified,
        verifiedAt: record.verifiedAt || existing.verifiedAt
      })
      .where(eq(schema.payments.orderId, paymentData.orderId));
    return (await getPaymentByOrderId(paymentData.orderId))!;
  }

  await db.insert(schema.payments).values(record);
  return record as schema.Payment;
}

export async function getPaymentByOrderId(orderId: string): Promise<schema.Payment | null> {
  const db = await getDb();
  const rows = await db.select().from(schema.payments).where(eq(schema.payments.orderId, orderId)).limit(1);
  return rows[0] || null;
}

export async function getPaymentByPaymentId(paymentId: string): Promise<schema.Payment | null> {
  const db = await getDb();
  const rows = await db.select().from(schema.payments).where(eq(schema.payments.paymentId, paymentId)).limit(1);
  return rows[0] || null;
}

export async function getPaymentByIdentifier(identifier: string): Promise<schema.Payment | null> {
  const byPay = await getPaymentByPaymentId(identifier);
  if (byPay) return byPay;
  const byOrder = await getPaymentByOrderId(identifier);
  if (byOrder) return byOrder;
  const db = await getDb();
  const byId = await db.select().from(schema.payments).where(eq(schema.payments.id, identifier)).limit(1);
  return byId[0] || null;
}

// ----------------------------------------------------
// Course Entitlements Repository
// ----------------------------------------------------
export async function grantCourseEnrollment(
  studentId: string,
  courseId: string,
  courseTitle: string,
  orderId?: string,
  paymentId?: string
): Promise<schema.CourseEnrollment> {
  const db = await getDb();
  const enrollmentId = `${studentId}_${courseId}`;
  const now = new Date();

  const enrollment = {
    id: enrollmentId,
    studentId,
    courseId,
    courseTitle,
    orderId: orderId || null,
    paymentId: paymentId || null,
    status: 'ACTIVE',
    enrolledAt: now
  };

  const existing = await hasCourseEntitlement(studentId, courseId);
  if (existing) {
    // Return existing record idempotently
    const rows = await db
      .select()
      .from(schema.courseEnrollments)
      .where(and(eq(schema.courseEnrollments.studentId, studentId), eq(schema.courseEnrollments.courseId, courseId)))
      .limit(1);
    return rows[0];
  }

  await db.insert(schema.courseEnrollments).values(enrollment);
  return enrollment as schema.CourseEnrollment;
}

export async function getStudentEntitlements(studentId: string): Promise<string[]> {
  const db = await getDb();
  const rows = await db
    .select({ courseId: schema.courseEnrollments.courseId })
    .from(schema.courseEnrollments)
    .where(and(eq(schema.courseEnrollments.studentId, studentId), eq(schema.courseEnrollments.status, 'ACTIVE')));
  return rows.map((r: { courseId: string }) => r.courseId);
}

export async function hasCourseEntitlement(studentId: string, courseId: string): Promise<boolean> {
  const db = await getDb();
  const rows = await db
    .select({ id: schema.courseEnrollments.id })
    .from(schema.courseEnrollments)
    .where(
      and(
        eq(schema.courseEnrollments.studentId, studentId),
        eq(schema.courseEnrollments.courseId, courseId),
        eq(schema.courseEnrollments.status, 'ACTIVE')
      )
    )
    .limit(1);
  return rows.length > 0;
}
