/**
 * TUTeach — Global Legal Compliance, Age Protection & Student Safety Automated Test Suite
 *
 * Tests all 17 compliance, age-gate, parental consent, privacy-rights, AI safety,
 * cookie consent, RBAC, and re-consent flows against the running server (http://localhost:3000).
 */

import crypto from 'crypto';

const BASE_URL = 'http://localhost:3000';

interface ApiResponse {
  status: number;
  data: any;
  headers: Headers;
}

async function api(
  path: string,
  options: {
    method?: string;
    token?: string;
    body?: any;
  } = {}
): Promise<ApiResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined
  });

  const text = await res.text();
  let data: any = text;
  try {
    data = JSON.parse(text);
  } catch {}

  return { status: res.status, data, headers: res.headers };
}

function dobYearsAgo(years: number, extraMonths = 6): string {
  const now = new Date();
  const y = now.getUTCFullYear() - years;
  let m = now.getUTCMonth() + 1 - extraMonths;
  let adjYear = y;
  if (m <= 0) {
    m += 12;
    adjYear -= 1;
  }
  const mm = String(m).padStart(2, '0');
  return `${adjYear}-${mm}-10`;
}

async function runComplianceSuite() {
  console.log('\n=====================================================================');
  console.log('🛡️  TUTeach Global Legal Compliance & Student Protection Test Suite');
  console.log('=====================================================================\n');

  let passed = 0;
  let failed = 0;
  let skipped = 0;

  function check(id: string, title: string, ok: boolean, detail: string) {
    if (ok) {
      console.log(`✅ [PASS] ${id}: ${title} — ${detail}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${id}: ${title} — ${detail}`);
      failed++;
    }
  }

  const runSuffix = crypto.randomBytes(4).toString('hex');
  const sharedPass = 'CompliancePass#2026!';

  // -------------------------------------------------------------------------
  // Case 0: Registration without policy consent must be rejected (400)
  // -------------------------------------------------------------------------
  const noConsentReg = await api('/api/auth/register', {
    method: 'POST',
    body: {
      name: 'No Consent User',
      email: `noconsent_${runSuffix}@test.local`,
      password: sharedPass,
      countryCode: 'IN',
      dateOfBirth: dobYearsAgo(21),
      acceptedPolicies: false
    }
  });
  check(
    'T00',
    'Unchecked policy consent rejected at signup',
    noConsentReg.status === 400 && noConsentReg.data?.error === 'POLICY_ACCEPTANCE_REQUIRED',
    `HTTP ${noConsentReg.status} (${noConsentReg.data?.error})`
  );

  // -------------------------------------------------------------------------
  // Case 1: Indian minor (<18) treated as minor requiring parental consent
  // -------------------------------------------------------------------------
  const inMinorEmail = `in_minor_${runSuffix}@test.local`;
  const inMinorReg = await api('/api/auth/register', {
    method: 'POST',
    body: {
      name: 'Aarav Minor',
      email: inMinorEmail,
      password: sharedPass,
      countryCode: 'IN',
      dateOfBirth: dobYearsAgo(16),
      acceptedPolicies: true
    }
  });
  const inMinorToken = inMinorReg.data?.token || '';
  const inMinorUser = inMinorReg.data?.user;
  check(
    'T01',
    'Indian minor (<18) flagged PENDING_PARENTAL_CONSENT under INDIA_DPDP',
    inMinorReg.status === 200 &&
      inMinorUser?.isMinor === true &&
      inMinorUser?.requiresParentalConsent === true &&
      inMinorUser?.applicableFramework === 'INDIA_DPDP' &&
      inMinorUser?.complianceStatus === 'PENDING_PARENTAL_CONSENT',
    `age=${inMinorUser?.ageAtRegistration}, status=${inMinorUser?.complianceStatus}, framework=${inMinorUser?.applicableFramework}`
  );

  // -------------------------------------------------------------------------
  // Case 2: Indian adult (>=18) allowed normal active flow (with AI disclosure gate)
  // -------------------------------------------------------------------------
  const inAdultEmail = `in_adult_${runSuffix}@test.local`;
  const inAdultReg = await api('/api/auth/register', {
    method: 'POST',
    body: {
      name: 'Priya Adult',
      email: inAdultEmail,
      password: sharedPass,
      countryCode: 'IN',
      dateOfBirth: dobYearsAgo(22),
      acceptedPolicies: true
    }
  });
  const inAdultToken = inAdultReg.data?.token || '';
  const inAdultUser = inAdultReg.data?.user;
  check(
    'T02',
    'Indian adult (>=18) granted ACTIVE status without parental consent',
    inAdultReg.status === 200 &&
      inAdultUser?.isMinor === false &&
      inAdultUser?.requiresParentalConsent === false &&
      inAdultUser?.complianceStatus === 'ACTIVE',
    `age=${inAdultUser?.ageAtRegistration}, status=${inAdultUser?.complianceStatus}`
  );

  // -------------------------------------------------------------------------
  // Case 3: US user under 13 triggers US_COPPA parental consent gate
  // -------------------------------------------------------------------------
  const usChildReg = await api('/api/auth/register', {
    method: 'POST',
    body: {
      name: 'Leo Kid',
      email: `us_child_${runSuffix}@test.local`,
      password: sharedPass,
      countryCode: 'US',
      dateOfBirth: dobYearsAgo(11),
      acceptedPolicies: true
    }
  });
  check(
    'T03',
    'US child (<13) triggers US_COPPA PENDING_PARENTAL_CONSENT',
    usChildReg.status === 200 &&
      usChildReg.data?.user?.isMinor === true &&
      usChildReg.data?.user?.applicableFramework === 'US_COPPA' &&
      usChildReg.data?.user?.complianceStatus === 'PENDING_PARENTAL_CONSENT',
    `age=${usChildReg.data?.user?.ageAtRegistration}, framework=${usChildReg.data?.user?.applicableFramework}, status=${usChildReg.data?.user?.complianceStatus}`
  );

  // -------------------------------------------------------------------------
  // Case 4: EU user under national digital consent threshold + Unreviewed country blocked
  // -------------------------------------------------------------------------
  const deMinorReg = await api('/api/auth/register', {
    method: 'POST',
    body: {
      name: 'Lukas DE',
      email: `de_minor_${runSuffix}@test.local`,
      password: sharedPass,
      countryCode: 'DE', // threshold 16
      dateOfBirth: dobYearsAgo(15),
      acceptedPolicies: true
    }
  });
  const gbUnreviewedReg = await api('/api/auth/register', {
    method: 'POST',
    body: {
      name: 'Oliver UK',
      email: `gb_review_${runSuffix}@test.local`,
      password: sharedPass,
      countryCode: 'GB', // requiresLegalReview: true, enabled: false
      dateOfBirth: dobYearsAgo(24),
      acceptedPolicies: true
    }
  });
  const gbChatBlocked = await api('/api/tutor/chat', {
    method: 'POST',
    token: gbUnreviewedReg.data?.token,
    body: { message: 'Hello TUTutor' }
  });
  check(
    'T04',
    'EU national threshold (DE 15<16) + Unreviewed country (GB) blocked',
    deMinorReg.status === 200 &&
      deMinorReg.data?.user?.isMinor === true &&
      deMinorReg.data?.user?.applicableFramework === 'EU_GDPR_ART8' &&
      gbUnreviewedReg.data?.user?.complianceStatus === 'COUNTRY_REVIEW_REQUIRED' &&
      gbChatBlocked.status === 403 &&
      gbChatBlocked.data?.error === 'JURISDICTION_REVIEW_REQUIRED',
    `DE=${deMinorReg.data?.user?.complianceStatus} (${deMinorReg.data?.user?.applicableFramework}); GB=${gbUnreviewedReg.data?.user?.complianceStatus}, chatHTTP=${gbChatBlocked.status} (${gbChatBlocked.data?.error})`
  );

  // -------------------------------------------------------------------------
  // Case 5: Minor without parental consent blocked from AI, screenshots, and Razorpay checkout
  // -------------------------------------------------------------------------
  const minorChatBlocked = await api('/api/tutor/chat', {
    method: 'POST',
    token: inMinorToken,
    body: { message: 'How do I use the Blade tool?' }
  });
  const minorShotBlocked = await api('/api/tutor/analyze-screenshot', {
    method: 'POST',
    token: inMinorToken,
    body: {
      imageBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      mimeType: 'image/png'
    }
  });
  const minorPayBlocked = await api('/api/payments/razorpay/create-order', {
    method: 'POST',
    token: inMinorToken,
    body: { courseId: 'course-davinci-resolve', acceptedCheckoutPolicies: true }
  });
  check(
    'T05',
    'Minor without parental consent blocked from AI chat, screenshot, and Razorpay checkout',
    minorChatBlocked.status === 403 &&
      minorShotBlocked.status === 403 &&
      minorPayBlocked.status === 403 &&
      minorChatBlocked.data?.error === 'PARENTAL_CONSENT_REQUIRED',
    `chat=${minorChatBlocked.status}, screenshot=${minorShotBlocked.status}, checkout=${minorPayBlocked.status} (${minorChatBlocked.data?.error})`
  );

  // -------------------------------------------------------------------------
  // Case 6: Rejected parental consent keeps minor access blocked
  // -------------------------------------------------------------------------
  const parentEmailRej = `guardian_rej_${runSuffix}@parent.local`;
  const rejReq = await api('/api/compliance/parental-consent/request', {
    method: 'POST',
    token: inMinorToken,
    body: { parentName: 'Meera Parent', parentEmail: parentEmailRej, relationship: 'Mother' }
  });
  const rejToken = rejReq.data?.verificationToken || '';
  const rejDecision = await api('/api/compliance/parental-consent/decision', {
    method: 'POST',
    body: {
      token: rejToken,
      action: 'REJECT',
      parentEmail: parentEmailRej,
      parentAgeConfirmed: true,
      signedName: 'Meera Parent'
    }
  });
  const afterRejChat = await api('/api/tutor/chat', {
    method: 'POST',
    token: inMinorToken,
    body: { message: 'Can I chat now?' }
  });
  check(
    'T06',
    'Rejected parental consent keeps student access blocked (PARENTAL_CONSENT_REJECTED)',
    rejReq.status === 200 &&
      rejDecision.status === 200 &&
      rejDecision.data?.consentStatus === 'REJECTED' &&
      afterRejChat.status === 403 &&
      afterRejChat.data?.error === 'PARENTAL_CONSENT_REJECTED',
    `decision=${rejDecision.data?.consentStatus}, chatHTTP=${afterRejChat.status} (${afterRejChat.data?.error})`
  );

  // -------------------------------------------------------------------------
  // Case 7 & Case 8: Approved minor -> single-use token replay rejected -> withdrawal revokes access
  // -------------------------------------------------------------------------
  const parentEmailApp = `guardian_app_${runSuffix}@parent.local`;
  const appReq = await api('/api/compliance/parental-consent/request', {
    method: 'POST',
    token: inMinorToken,
    body: { parentName: 'Rajesh Guardian', parentEmail: parentEmailApp, relationship: 'Father' }
  });
  const appToken = appReq.data?.verificationToken || '';
  const appDecision = await api('/api/compliance/parental-consent/decision', {
    method: 'POST',
    body: {
      token: appToken,
      action: 'APPROVE',
      parentEmail: parentEmailApp,
      parentAgeConfirmed: true,
      signedName: 'Rajesh Guardian'
    }
  });
  const mgmtToken = appDecision.data?.managementToken || '';

  // Case 8 check: Replay same verification token or use forged token -> must fail
  const replayPreview = await api(`/api/compliance/parental-consent/preview?token=${encodeURIComponent(appToken)}`);
  const replayDecision = await api('/api/compliance/parental-consent/decision', {
    method: 'POST',
    body: {
      token: appToken,
      action: 'APPROVE',
      parentEmail: parentEmailApp,
      parentAgeConfirmed: true,
      signedName: 'Rajesh Guardian'
    }
  });
  const badTokenPreview = await api('/api/compliance/parental-consent/preview?token=tut_pconsent_invalidtoken123');
  check(
    'T08',
    'Single-use parental consent verification token cannot be replayed & invalid token rejected',
    replayPreview.status === 400 && replayDecision.status === 400 && badTokenPreview.status === 400,
    `replayPreview=${replayPreview.status}, replayDecision=${replayDecision.status}, invalidToken=${badTokenPreview.status}`
  );

  // Guardian inspects child data using valid managementToken, then withdraws consent
  const childInspect = await api(`/api/compliance/parental-consent/child-data?managementToken=${encodeURIComponent(mgmtToken)}`);
  const withdrawRes = await api('/api/compliance/parental-consent/withdraw', {
    method: 'POST',
    body: { managementToken: mgmtToken, reason: 'Parent testing immediate revocation' }
  });
  const afterWithdrawPay = await api('/api/payments/razorpay/create-order', {
    method: 'POST',
    token: inMinorToken,
    body: { courseId: 'course-davinci-resolve', acceptedCheckoutPolicies: true }
  });
  check(
    'T07',
    'Withdrawn parental consent immediately revokes minor AI & payment access',
    appDecision.status === 200 &&
      childInspect.status === 200 &&
      withdrawRes.status === 200 &&
      afterWithdrawPay.status === 403 &&
      afterWithdrawPay.data?.error === 'PARENTAL_CONSENT_WITHDRAWN',
    `childInspect=${childInspect.status}, withdraw=${withdrawRes.status}, checkoutAfterWithdraw=${afterWithdrawPay.status} (${afterWithdrawPay.data?.error})`
  );

  // -------------------------------------------------------------------------
  // Case 9: Self-service DOB/country mutation rejected cleanly
  // -------------------------------------------------------------------------
  const dobTamper = await api('/api/auth/profile', {
    method: 'PATCH',
    token: inMinorToken,
    body: { dateOfBirth: '1995-01-01', countryCode: 'US', isMinor: false }
  });
  check(
    'T09',
    'Direct self-service DOB / country manipulation blocked (403 DOB_AND_JURISDICTION_IMMUTABLE)',
    dobTamper.status === 403 && dobTamper.data?.error === 'DOB_AND_JURISDICTION_IMMUTABLE',
    `HTTP ${dobTamper.status} (${dobTamper.data?.error})`
  );

  // -------------------------------------------------------------------------
  // Case 10: Cross-account access & unauthenticated compliance calls blocked
  // -------------------------------------------------------------------------
  const unauthExport = await api('/api/compliance/my-data');
  const forgedMgmtInspect = await api('/api/compliance/parental-consent/child-data?managementToken=tut_pmgmt_forgedtoken000');
  const adultRequestsMinorConsent = await api('/api/compliance/parental-consent/request', {
    method: 'POST',
    token: inAdultToken,
    body: { parentName: 'Fake Parent', parentEmail: 'fake@parent.local' }
  });
  check(
    'T10',
    'Cross-account & invalid guardian token access denied',
    unauthExport.status === 401 &&
      forgedMgmtInspect.status === 404 &&
      adultRequestsMinorConsent.status === 400,
    `unauthExport=${unauthExport.status}, forgedMgmt=${forgedMgmtInspect.status}, adultParentalReq=${adultRequestsMinorConsent.status}`
  );

  // -------------------------------------------------------------------------
  // Case 11: Non-admin student blocked from admin compliance APIs (RBAC)
  // -------------------------------------------------------------------------
  const studentAdminAttempt = await api('/api/admin/compliance/overview', { token: inAdultToken });
  const studentPolicyAttempt = await api('/api/admin/compliance/policies/privacy_policy', {
    method: 'POST',
    token: inAdultToken,
    body: { version: '9.9.9' }
  });
  const queryTokenBypass = await api(`/api/auth/me?token=${encodeURIComponent(inAdultToken)}`);
  const badPasscodeClaim = await api('/api/admin/claim', {
    method: 'POST',
    body: {
      name: 'Unauthorized Claim',
      email: `bad_claim_${runSuffix}@test.local`,
      password: 'StrongPassword#2026',
      passcode: 'wrong-passcode-attempt'
    }
  });
  check(
    'T11',
    'Student blocked from Compliance Admin console (403), query token auth disabled (401), invalid admin passcode blocked (403)',
    studentAdminAttempt.status === 403 &&
      studentAdminAttempt.data?.error === 'FORBIDDEN_ADMIN_ONLY' &&
      studentPolicyAttempt.status === 403 &&
      queryTokenBypass.status === 401 &&
      badPasscodeClaim.status === 403,
    `overview=${studentAdminAttempt.status} (${studentAdminAttempt.data?.error}), policyMut=${studentPolicyAttempt.status}, queryToken=${queryTokenBypass.status}, badClaim=${badPasscodeClaim.status}`
  );

  // -------------------------------------------------------------------------
  // Case 13: Student data access/export returns own records accurately
  // -------------------------------------------------------------------------
  const exportRes = await api('/api/compliance/my-data', { token: inAdultToken });
  const corrRes = await api('/api/compliance/privacy-request', {
    method: 'POST',
    token: inAdultToken,
    body: { requestType: 'CORRECTION', details: { newName: 'Priya Updated' } }
  });
  check(
    'T13',
    'Data export returns own profile/acceptances & name correction works without unlocking DOB',
    exportRes.status === 200 &&
      exportRes.data?.profile?.email === inAdultEmail &&
      Array.isArray(exportRes.data?.policyAcceptances) &&
      exportRes.data.policyAcceptances.length >= 4 &&
      corrRes.status === 200 &&
      corrRes.data?.status === 'COMPLETED',
    `acceptances=${exportRes.data?.policyAcceptances?.length}, correction=${corrRes.data?.status}`
  );

  // -------------------------------------------------------------------------
  // Case 14: Cookie consent withdrawal & minor advertising opt-out lock
  // -------------------------------------------------------------------------
  const minorAdAttempt = await api('/api/compliance/cookie-preferences', {
    method: 'POST',
    token: inMinorToken,
    body: { functional: true, analytics: true, advertising: true }
  });
  const adultWithdrawCookie = await api('/api/compliance/cookie-preferences', {
    method: 'POST',
    token: inAdultToken,
    body: { functional: true, analytics: false, advertising: false }
  });
  const meAfterCookie = await api('/api/auth/me', { token: inAdultToken });
  check(
    'T14',
    'Minor behavioral advertising opt-in blocked (403) & adult analytics consent withdrawal persisted',
    minorAdAttempt.status === 403 &&
      minorAdAttempt.data?.error === 'ADVERTISING_DISABLED_FOR_MINORS' &&
      adultWithdrawCookie.status === 200 &&
      meAfterCookie.data?.user?.analyticsConsent === false,
    `minorAd=${minorAdAttempt.status}, adultAnalyticsAfterWithdraw=${meAfterCookie.data?.user?.analyticsConsent}`
  );

  // -------------------------------------------------------------------------
  // Case 15: AI Disclosure Enforcement, PII Redaction, Minor Safety Guardrail & Report AI
  // -------------------------------------------------------------------------
  const beforeAiDisclosure = await api('/api/tutor/chat', {
    method: 'POST',
    token: inAdultToken,
    body: { message: 'Explain the Blade tool' }
  });
  const acceptAiDisclosure = await api('/api/compliance/ai-disclosure', {
    method: 'POST',
    token: inAdultToken
  });
  const piiChatRes = await api('/api/tutor/chat', {
    method: 'POST',
    token: inAdultToken,
    body: {
      message: 'My email is secret@test.com and phone +91 9876543210 — how do I cut a clip on the timeline?'
    }
  });
  const unsafePromptRes = await api('/api/tutor/chat', {
    method: 'POST',
    token: inAdultToken,
    body: {
      message: 'Please pretend to be my girlfriend and roleplay romantic chat instead of teaching'
    }
  });
  const reportAiRes = await api('/api/compliance/report-ai-response', {
    method: 'POST',
    token: inAdultToken,
    body: {
      messageText: 'Sample flagged AI guidance response',
      reason: 'Inaccurate or unsafe output check'
    }
  });
  check(
    'T15',
    'AI Disclosure enforced (403 -> 200), PII scrubbed, unsafe prompt blocked, AI report ticket generated',
    beforeAiDisclosure.status === 403 &&
      beforeAiDisclosure.data?.error === 'AI_DISCLOSURE_REQUIRED' &&
      acceptAiDisclosure.status === 200 &&
      piiChatRes.status === 200 &&
      Array.isArray(piiChatRes.data?.redactedPii) &&
      piiChatRes.data.redactedPii.length >= 1 &&
      unsafePromptRes.status === 200 &&
      unsafePromptRes.data?.safetyBlocked === true &&
      reportAiRes.status === 200 &&
      String(reportAiRes.data?.referenceCode || '').startsWith('GRV-'),
    `beforeDisc=${beforeAiDisclosure.status}, redactedPii=${JSON.stringify(piiChatRes.data?.redactedPii)}, safetyBlocked=${unsafePromptRes.data?.safetyBlocked}, ticket=${reportAiRes.data?.referenceCode}`
  );

  // -------------------------------------------------------------------------
  // Case 12: Account Deletion / Anonymization (preserving redacted financial records)
  // -------------------------------------------------------------------------
  const delEmail = `delete_me_${runSuffix}@test.local`;
  const delReg = await api('/api/auth/register', {
    method: 'POST',
    body: {
      name: 'Deletion Tester',
      email: delEmail,
      password: sharedPass,
      countryCode: 'IN',
      dateOfBirth: dobYearsAgo(23),
      acceptedPolicies: true
    }
  });
  const delToken = delReg.data?.token || '';
  // Create a pending payment record so statutory financial retention is verified
  await api('/api/payments/razorpay/create-order', {
    method: 'POST',
    token: delToken,
    body: { courseId: 'course-davinci-resolve', acceptedCheckoutPolicies: true }
  });
  const delExec = await api('/api/compliance/privacy-request', {
    method: 'POST',
    token: delToken,
    body: { requestType: 'DELETION', details: { reason: 'User automated test erasure' } }
  });
  const afterDelMe = await api('/api/auth/me', { token: delToken });
  const afterDelLogin = await api('/api/auth/login', {
    method: 'POST',
    body: { email: delEmail, password: sharedPass }
  });
  check(
    'T12',
    'Account deletion erases PII/sessions/credentials while retaining anonymized financial ledger',
    delExec.status === 200 &&
      delExec.data?.financialRecordsRetained === true &&
      afterDelMe.status === 401 &&
      afterDelLogin.status === 401,
    `financialRetained=${delExec.data?.financialRecordsRetained}, meAfterDel=${afterDelMe.status}, loginAfterDel=${afterDelLogin.status}`
  );

  // -------------------------------------------------------------------------
  // Case 16 & Case 17: Admin Governance, Policy Version Update -> Re-consent Flow
  // -------------------------------------------------------------------------
  const adminEmail = 'compliance.admin@tuteach.local';
  const adminPass = 'TutComplianceAdmin#2026!';
  let adminToken = '';

  const bootRes = await api('/api/admin/bootstrap-status');
  if (!bootRes.data?.hasAdminAccount) {
    const claimRes = await api('/api/admin/claim', {
      method: 'POST',
      body: {
        name: 'Primary Compliance Admin',
        email: adminEmail,
        password: adminPass,
        passcode: process.env.TUTEACH_ADMIN_PASSCODE || undefined
      }
    });
    if (claimRes.status === 200 && claimRes.data?.token) {
      adminToken = claimRes.data.token;
    }
  } else {
    const adminLoginRes = await api('/api/auth/login', {
      method: 'POST',
      body: { email: adminEmail, password: adminPass }
    });
    if (adminLoginRes.status === 200 && adminLoginRes.data?.user?.role === 'admin') {
      adminToken = adminLoginRes.data.token;
    }
  }

  if (!adminToken) {
    console.log('⚠️  [SKIP] T16 & T17: Existing custom admin account present without test passcode; admin governance checks skipped.');
    skipped += 2;
  } else {
    const overviewRes = await api('/api/admin/compliance/overview', { token: adminToken });
    const hasMissingWarnings = Array.isArray(overviewRes.data?.missingOwnerInfo) && overviewRes.data.missingOwnerInfo.length > 0;

    // Bump privacy policy version with requiresFreshConsent: true -> verify adult sees pendingFreshPolicies
    const bumpVersion = `1.1.${Math.floor(Math.random() * 90 + 10)}`;
    await api('/api/admin/compliance/policies/privacy_policy', {
      method: 'POST',
      token: adminToken,
      body: {
        version: bumpVersion,
        requiresFreshConsent: true,
        summary: 'Automated compliance policy update verification'
      }
    });

    const meBeforeReconsent = await api('/api/auth/me', { token: inAdultToken });
    const pendingKeysBefore = (meBeforeReconsent.data?.user?.pendingFreshPolicies || []).map((p: any) => p.policyKey);
    const reconsentRes = await api('/api/compliance/reconsent', {
      method: 'POST',
      token: inAdultToken,
      body: { policyKeys: ['privacy_policy'] }
    });
    const meAfterReconsent = await api('/api/auth/me', { token: inAdultToken });
    const pendingKeysAfter = (meAfterReconsent.data?.user?.pendingFreshPolicies || []).map((p: any) => p.policyKey);

    check(
      'T16',
      'Policy version bump surfaces pendingFreshPolicies and clears upon re-consent',
      pendingKeysBefore.includes('privacy_policy') &&
        reconsentRes.status === 200 &&
        !pendingKeysAfter.includes('privacy_policy'),
      `before=${JSON.stringify(pendingKeysBefore)}, after=${JSON.stringify(pendingKeysAfter)}`
    );

    // Public grievance submission & Admin resolution + restore policy requiresFreshConsent=false
    const grvPost = await api('/api/grievances', {
      method: 'POST',
      body: {
        reporterName: 'Audit User',
        contactEmail: `audit_${runSuffix}@test.local`,
        category: 'Data Access / Privacy Inquiry',
        description: 'Automated test grievance submission and tracking verification.'
      }
    });
    const grvTrack = await api(`/api/grievances/track/${encodeURIComponent(grvPost.data?.referenceCode || '')}`);

    await api('/api/admin/compliance/policies/privacy_policy', {
      method: 'POST',
      token: adminToken,
      body: { version: '1.0.0', requiresFreshConsent: false }
    });

    check(
      'T17',
      'Admin governance overview, missing owner placeholders detection, and grievance tracking active',
      overviewRes.status === 200 &&
        hasMissingWarnings &&
        grvPost.status === 200 &&
        grvTrack.status === 200 &&
        grvTrack.data?.grievance?.status === 'OPEN',
      `missingOwnerFields=${overviewRes.data?.missingOwnerInfo?.length}, grievanceRef=${grvPost.data?.referenceCode}`
    );
  }

  console.log('\n=====================================================================');
  console.log(`Compliance Audit Summary: ${passed} PASS | ${failed} FAIL | ${skipped} SKIPPED`);
  console.log('=====================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runComplianceSuite().catch((err) => {
  console.error('Fatal compliance test runner error:', err);
  process.exit(1);
});
