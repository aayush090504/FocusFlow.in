import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test, { after, before, beforeEach } from 'node:test';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  arrayUnion,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

const PROJECT_ID = 'focus-flow-rules-test';
let testEnv: RulesTestEnvironment;

before(async () => {
  const rules = fs.readFileSync(path.resolve(process.cwd(), 'firestore.rules'), 'utf8');
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules,
      host: process.env.FIRESTORE_EMULATOR_HOST?.split(':')[0] || '127.0.0.1',
      port: Number(process.env.FIRESTORE_EMULATOR_HOST?.split(':')[1] || 8080),
    },
  });
});

after(async () => {
  if (testEnv) {
    await testEnv.cleanup();
  }
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

test('1. New user profile creation: valid owner signup payload succeeds; invalid/cross-user/shadow creates fail', async () => {
  const aliceDb = testEnv.authenticatedContext('alice_123', { email: 'alice@example.com' }).firestore();
  const bobDb = testEnv.authenticatedContext('bob_456', { email: 'bob@example.com' }).firestore();
  const unauthDb = testEnv.unauthenticatedContext().firestore();
  const now = new Date().toISOString();

  const initialProfile = {
    id: 'alice_123',
    email: 'alice@example.com',
    displayName: 'Alice',
    photoURL: '',
    avatar: 'avatar-1',
    theme: 'light',
    dailyGoalMinutes: 120,
    streakCount: 1,
    pomodoroSettings: {
      focusDurationMinutes: 25,
      shortBreakDurationMinutes: 5,
      longBreakDurationMinutes: 15,
      longBreakInterval: 4,
      autoStartBreaks: false,
      autoStartPomodoros: false,
    },
    notificationSettings: {
      timerSound: true,
      breakSound: true,
      dailyReminder: true,
      reminderTime: '18:00',
      streakAlerts: true,
    },
    lastActiveDate: '2026-11-23',
    hasCompletedOnboarding: false,
    hasSeededDefaultSubjects: false,
    gamification: {
      totalXp: 0,
      level: 1,
      unlockedBadges: {},
      notifiedBadgeIds: [],
      awardedSessionIds: [],
      awardedTaskIds: [],
      awardedGoalIds: [],
      awardedStreakMilestones: [],
      notifiedStreakMilestones: [],
      dailyBonusAwardedDates: [],
      streakBonusAwardedDates: [],
      longestStreak: 1,
    },
    createdAt: now,
    updatedAt: now,
  };

  // Unauthenticated or cross-user creation must fail
  await assertFails(setDoc(doc(unauthDb, 'users', 'alice_123'), initialProfile));
  await assertFails(setDoc(doc(bobDb, 'users', 'alice_123'), initialProfile));

  // Mismatched document id vs userId must fail
  await assertFails(
    setDoc(doc(aliceDb, 'users', 'alice_123'), { ...initialProfile, id: 'bob_456' })
  );

  // Missing required fields (email) must fail
  await assertFails(
    setDoc(doc(aliceDb, 'users', 'alice_123'), { id: 'alice_123', displayName: 'No Email' })
  );

  // Disallowed / shadow fields on create must fail
  await assertFails(
    setDoc(doc(aliceDb, 'users', 'alice_123'), { ...initialProfile, isAdmin: true })
  );

  // Valid new user profile creation must succeed
  await assertSucceeds(setDoc(doc(aliceDb, 'users', 'alice_123'), initialProfile));
  await assertSucceeds(getDoc(doc(aliceDb, 'users', 'alice_123')));
});

test('2. User authorization boundaries & immutability: owner-only get/update/delete, no list, immutable id/createdAt', async () => {
  const aliceDb = testEnv.authenticatedContext('alice_123', { email: 'alice@example.com' }).firestore();
  const bobDb = testEnv.authenticatedContext('bob_456', { email: 'bob@example.com' }).firestore();
  const unauthDb = testEnv.unauthenticatedContext().firestore();
  const now = new Date().toISOString();

  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'users', 'alice_123'), {
      id: 'alice_123',
      email: 'alice@example.com',
      createdAt: now,
      updatedAt: now,
    });
  });

  // Unauthorized read / list / write / delete must fail
  await assertFails(getDoc(doc(unauthDb, 'users', 'alice_123')));
  await assertFails(getDoc(doc(bobDb, 'users', 'alice_123')));
  await assertFails(getDocs(collection(aliceDb, 'users')));
  await assertFails(updateDoc(doc(unauthDb, 'users', 'alice_123'), { streakCount: 5 }));
  await assertFails(updateDoc(doc(bobDb, 'users', 'alice_123'), { streakCount: 99 }));
  await assertFails(deleteDoc(doc(unauthDb, 'users', 'alice_123')));
  await assertFails(deleteDoc(doc(bobDb, 'users', 'alice_123')));

  // Tampering with existing id or createdAt or adding unknown keys must fail
  await assertFails(updateDoc(doc(aliceDb, 'users', 'alice_123'), { id: 'bob_456' }));
  await assertFails(updateDoc(doc(aliceDb, 'users', 'alice_123'), { createdAt: '2020-01-01T00:00:00.000Z' }));
  await assertFails(updateDoc(doc(aliceDb, 'users', 'alice_123'), { role: 'admin' }));

  // Authorized owner update and delete must succeed
  await assertSucceeds(
    updateDoc(doc(aliceDb, 'users', 'alice_123'), {
      displayName: 'Alice Updated',
      updatedAt: new Date().toISOString(),
    })
  );
  await assertSucceeds(deleteDoc(doc(aliceDb, 'users', 'alice_123')));
});

test('3. Legacy user profiles (missing fields, merge updates) & partial/missing gamification maps + Phase 1.1 dotted writes', async () => {
  const aliceDb = testEnv.authenticatedContext('alice_123', { email: 'alice@example.com' }).firestore();

  // Case A: Legacy user profile missing createdAt, gamification, settings, plus legacy unknown field
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'users', 'alice_123'), {
      id: 'alice_123',
      email: 'alice@example.com',
      streakCount: 0,
      hasCompletedOnboarding: true,
      legacyFieldFromV1: 'kept',
    });
  });

  // Sync merge update initializing missing createdAt & settings while preserving legacyFieldFromV1 succeeds
  await assertSucceeds(
    setDoc(
      doc(aliceDb, 'users', 'alice_123'),
      {
        id: 'alice_123',
        email: 'alice@example.com',
        hasSeededDefaultSubjects: true,
        soundSettings: {
          masterEnabled: true,
          volume: 75,
          ambientType: 'rain',
          ambientVolume: 50,
          localMusicVolume: 80,
          localMusicLoop: true,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    )
  );

  // Dotted-path creating gamification map on a legacy doc without gamification succeeds
  await assertSucceeds(
    updateDoc(doc(aliceDb, 'users', 'alice_123'), {
      'gamification.longestStreak': 3,
      updatedAt: new Date().toISOString(),
    })
  );

  // All Phase 1.1 dotted-path gamification mutations succeed
  await assertSucceeds(
    updateDoc(doc(aliceDb, 'users', 'alice_123'), {
      'gamification.totalXp': increment(25),
      'gamification.level': 2,
      'gamification.awardedSessionIds': arrayUnion('ses_1'),
      'gamification.awardedTaskIds': arrayUnion('task_1'),
      'gamification.awardedGoalIds': arrayUnion('goal_1'),
      'gamification.dailyBonusAwardedDates': arrayUnion('2026-11-23'),
      'gamification.awardedStreakMilestones': arrayUnion(1, 3),
      'gamification.notifiedStreakMilestones': arrayUnion(1, 3),
      'gamification.notifiedBadgeIds': arrayUnion('first_session'),
      'gamification.unlockedBadges.first_session': new Date().toISOString(),
      'gamification.lastMilestoneCheck': new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  );

  // Invalid gamification bounds must fail
  await assertFails(updateDoc(doc(aliceDb, 'users', 'alice_123'), { 'gamification.totalXp': -10 }));
  await assertFails(updateDoc(doc(aliceDb, 'users', 'alice_123'), { 'gamification.level': 0 }));
  await assertFails(updateDoc(doc(aliceDb, 'users', 'alice_123'), { 'gamification.longestStreak': -1 }));

  // Case B: Legacy user doc with a partial gamification map (e.g. totalXp + legacy streakBonusAwardedDates only)
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'users', 'partial_gam_user'), {
      id: 'partial_gam_user',
      email: 'partial@example.com',
      gamification: {
        totalXp: 150,
        streakBonusAwardedDates: ['2025-12-01'],
      },
    });
  });

  const partialDb = testEnv.authenticatedContext('partial_gam_user').firestore();
  await assertSucceeds(
    updateDoc(doc(partialDb, 'users', 'partial_gam_user'), {
      'gamification.awardedGoalIds': arrayUnion('goal_99'),
      'gamification.longestStreak': 5,
      updatedAt: new Date().toISOString(),
    })
  );
});

test('4. Feedback collection: authenticated create/owner read & list; unauthenticated & cross-user modify/delete/status tampering denied', async () => {
  const aliceDb = testEnv.authenticatedContext('alice_123').firestore();
  const bobDb = testEnv.authenticatedContext('bob_456').firestore();
  const unauthDb = testEnv.unauthenticatedContext().firestore();

  const fbId = 'fb_1700000000_abcdef';
  const fbNoEmailId = 'fb_1700000001_noemail';

  // Unauthenticated create / read / list / update / delete must all fail
  await assertFails(
    setDoc(doc(unauthDb, 'feedback', fbId), {
      id: fbId,
      type: 'bug_report',
      message: 'Unauthorized flood attempt',
      status: 'new',
    })
  );
  await assertFails(getDocs(collection(unauthDb, 'feedback')));

  // Spoofed userId, tampered status, invalid type, or too-short message must fail
  await assertFails(
    setDoc(doc(aliceDb, 'feedback', fbId), {
      id: fbId,
      type: 'bug_report',
      message: 'Valid length bug report message',
      status: 'resolved',
      userId: 'alice_123',
    })
  );
  await assertFails(
    setDoc(doc(aliceDb, 'feedback', fbId), {
      id: fbId,
      type: 'bug_report',
      message: 'Valid length bug report message',
      status: 'new',
      userId: 'bob_456',
    })
  );
  await assertFails(
    setDoc(doc(aliceDb, 'feedback', fbId), {
      id: fbId,
      type: 'bug_report',
      message: 'tiny',
      status: 'new',
      userId: 'alice_123',
    })
  );

  // Authenticated creates (with and without optional email) must succeed
  await assertSucceeds(
    setDoc(doc(aliceDb, 'feedback', fbId), {
      id: fbId,
      type: 'feature_suggestion',
      message: 'Please add offline timer support!',
      status: 'new',
      userId: 'alice_123',
      email: 'alice@example.com',
      createdAt: new Date().toISOString(),
    })
  );
  await assertSucceeds(
    setDoc(doc(aliceDb, 'feedback', fbNoEmailId), {
      id: fbNoEmailId,
      type: 'general_feedback',
      message: 'Love the clean study timer layout!',
      status: 'new',
      userId: 'alice_123',
    })
  );

  // Owner get & owner-scoped list succeed; unfiltered list and cross-user/unauth reads fail
  await assertSucceeds(getDoc(doc(aliceDb, 'feedback', fbId)));
  await assertSucceeds(
    getDocs(query(collection(aliceDb, 'feedback'), where('userId', '==', 'alice_123')))
  );
  await assertFails(getDocs(collection(aliceDb, 'feedback')));
  await assertFails(getDoc(doc(bobDb, 'feedback', fbId)));
  await assertFails(
    getDocs(query(collection(bobDb, 'feedback'), where('userId', '==', 'alice_123')))
  );
  await assertFails(getDoc(doc(unauthDb, 'feedback', fbId)));

  // Immutable once submitted: status changes, message edits, and deletes fail for owner & others
  await assertFails(updateDoc(doc(aliceDb, 'feedback', fbId), { status: 'resolved' }));
  await assertFails(updateDoc(doc(bobDb, 'feedback', fbId), { status: 'closed', message: 'Hijacked' }));
  await assertFails(updateDoc(doc(unauthDb, 'feedback', fbId), { status: 'spam' }));
  await assertFails(deleteDoc(doc(aliceDb, 'feedback', fbId)));
  await assertFails(deleteDoc(doc(bobDb, 'feedback', fbId)));
});

test('5. Subjects, tasks, focusSessions, and goals: full CRUD permissions, list isolation, and legacy statuses', async () => {
  const aliceDb = testEnv.authenticatedContext('alice_123').firestore();
  const bobDb = testEnv.authenticatedContext('bob_456').firestore();
  const unauthDb = testEnv.unauthenticatedContext().firestore();
  const now = new Date().toISOString();

  // --- SUBJECTS ---
  const subjRef = doc(aliceDb, 'users', 'alice_123', 'subjects', 'subj_1');
  await assertSucceeds(
    setDoc(subjRef, {
      id: 'subj_1',
      userId: 'alice_123',
      name: 'Physics',
      color: '#10b981',
      createdAt: now,
      updatedAt: now,
    })
  );
  await assertFails(
    setDoc(doc(bobDb, 'users', 'alice_123', 'subjects', 'subj_2'), {
      id: 'subj_2',
      userId: 'alice_123',
      name: 'Spoofed Subject',
      color: '#000000',
    })
  );
  await assertSucceeds(getDoc(subjRef));
  await assertSucceeds(getDocs(collection(aliceDb, 'users', 'alice_123', 'subjects')));
  await assertFails(getDoc(doc(bobDb, 'users', 'alice_123', 'subjects', 'subj_1')));
  await assertFails(getDocs(collection(bobDb, 'users', 'alice_123', 'subjects')));
  await assertFails(getDocs(collection(unauthDb, 'users', 'alice_123', 'subjects')));
  await assertFails(updateDoc(subjRef, { createdAt: 'tampered' }));
  await assertFails(updateDoc(subjRef, { userId: 'bob_456' }));
  await assertFails(updateDoc(doc(bobDb, 'users', 'alice_123', 'subjects', 'subj_1'), { name: 'Hacked' }));
  await assertSucceeds(updateDoc(subjRef, { name: 'Physics II', updatedAt: now }));

  // --- TASKS (including legacy 'todo' and current 'pending'/'in_progress'/'completed') ---
  const legacyTaskRef = doc(aliceDb, 'users', 'alice_123', 'tasks', 'task_legacy');
  const pendingTaskRef = doc(aliceDb, 'users', 'alice_123', 'tasks', 'task_pending');
  await assertSucceeds(
    setDoc(legacyTaskRef, {
      id: 'task_legacy',
      userId: 'alice_123',
      title: 'Legacy homework',
      status: 'todo',
      priority: 'high',
      createdAt: now,
      updatedAt: now,
    })
  );
  await assertSucceeds(
    setDoc(pendingTaskRef, {
      id: 'task_pending',
      userId: 'alice_123',
      title: 'Modern task',
      status: 'pending',
      priority: 'medium',
      createdAt: now,
      updatedAt: now,
    })
  );
  await assertFails(
    setDoc(doc(aliceDb, 'users', 'alice_123', 'tasks', 'task_bad'), {
      id: 'task_bad',
      userId: 'alice_123',
      title: 'Invalid status task',
      status: 'invalid_status',
      priority: 'low',
    })
  );
  await assertFails(
    setDoc(doc(bobDb, 'users', 'alice_123', 'tasks', 'task_2'), {
      id: 'task_2',
      userId: 'alice_123',
      title: 'Injected task',
      status: 'pending',
      priority: 'low',
    })
  );
  await assertSucceeds(getDocs(collection(aliceDb, 'users', 'alice_123', 'tasks')));
  await assertFails(getDocs(collection(bobDb, 'users', 'alice_123', 'tasks')));
  await assertSucceeds(updateDoc(pendingTaskRef, { status: 'in_progress', updatedAt: now }));
  await assertSucceeds(updateDoc(legacyTaskRef, { status: 'completed', completedAt: now, updatedAt: now }));

  // --- FOCUS SESSIONS ---
  const sesRef = doc(aliceDb, 'users', 'alice_123', 'focusSessions', 'ses_1');
  await assertSucceeds(
    setDoc(sesRef, {
      id: 'ses_1',
      userId: 'alice_123',
      durationMinutes: 25,
      mode: 'pomodoro',
      completedAt: now,
      createdAt: now,
    })
  );
  await assertFails(
    setDoc(doc(aliceDb, 'users', 'alice_123', 'focusSessions', 'ses_bad'), {
      id: 'ses_bad',
      userId: 'alice_123',
      durationMinutes: -5,
      mode: 'pomodoro',
    })
  );
  await assertSucceeds(getDoc(sesRef));
  await assertSucceeds(getDocs(collection(aliceDb, 'users', 'alice_123', 'focusSessions')));
  await assertFails(getDocs(collection(bobDb, 'users', 'alice_123', 'focusSessions')));
  await assertSucceeds(updateDoc(sesRef, { notes: 'Reviewed chapter 3' }));
  await assertFails(deleteDoc(doc(bobDb, 'users', 'alice_123', 'focusSessions', 'ses_1')));

  // --- GOALS (including legacy 'active' and current 'in_progress'/'completed'/'archived') ---
  const legacyGoalRef = doc(aliceDb, 'users', 'alice_123', 'goals', 'goal_legacy');
  const activeGoalRef = doc(aliceDb, 'users', 'alice_123', 'goals', 'goal_current');
  await assertSucceeds(
    setDoc(legacyGoalRef, {
      id: 'goal_legacy',
      userId: 'alice_123',
      title: 'Read 10 chapters',
      targetValue: 10,
      currentValue: 2,
      unit: 'chapters',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    })
  );
  await assertSucceeds(
    setDoc(activeGoalRef, {
      id: 'goal_current',
      userId: 'alice_123',
      title: 'Solve 50 problems',
      targetValue: 50,
      currentValue: 0,
      unit: 'problems',
      status: 'in_progress',
      createdAt: now,
      updatedAt: now,
    })
  );
  await assertFails(
    setDoc(doc(aliceDb, 'users', 'alice_123', 'goals', 'goal_bad'), {
      id: 'goal_bad',
      userId: 'alice_123',
      title: 'Oversized target',
      targetValue: 99999999,
      unit: 'hours',
      status: 'in_progress',
    })
  );
  await assertFails(updateDoc(legacyGoalRef, { currentValue: -5 }));
  await assertSucceeds(getDocs(collection(aliceDb, 'users', 'alice_123', 'goals')));
  await assertFails(getDocs(collection(bobDb, 'users', 'alice_123', 'goals')));
  await assertSucceeds(updateDoc(legacyGoalRef, { currentValue: 10, status: 'completed', completedAt: now, updatedAt: now }));
  await assertSucceeds(updateDoc(activeGoalRef, { status: 'archived', updatedAt: now }));

  // --- DELETE ISOLATION & OWNER CLEANUP ---
  await assertFails(deleteDoc(doc(bobDb, 'users', 'alice_123', 'subjects', 'subj_1')));
  await assertFails(deleteDoc(doc(bobDb, 'users', 'alice_123', 'tasks', 'task_legacy')));
  await assertFails(deleteDoc(doc(bobDb, 'users', 'alice_123', 'goals', 'goal_legacy')));
  await assertFails(deleteDoc(doc(unauthDb, 'users', 'alice_123', 'goals', 'goal_legacy')));

  await assertSucceeds(deleteDoc(subjRef));
  await assertSucceeds(deleteDoc(legacyTaskRef));
  await assertSucceeds(deleteDoc(pendingTaskRef));
  await assertSucceeds(deleteDoc(sesRef));
  await assertSucceeds(deleteDoc(legacyGoalRef));
  await assertSucceeds(deleteDoc(activeGoalRef));
  assert.ok(true);
});

test('6. Full 4-map user profile (pomodoroSettings, notificationSettings, soundSettings, gamification) stays well below expression limits', async () => {
  const fullDb = testEnv.authenticatedContext('full_user_1', { email: 'full@example.com' }).firestore();
  const now = new Date().toISOString();

  const fullProfile = {
    id: 'full_user_1',
    email: 'full@example.com',
    displayName: 'Full Profile User',
    photoURL: 'https://example.com/avatar.png',
    avatar: 'avatar-3',
    theme: 'ocean',
    dailyGoalMinutes: 180,
    streakCount: 7,
    pomodoroSettings: {
      focusDurationMinutes: 50,
      shortBreakDurationMinutes: 10,
      longBreakDurationMinutes: 20,
      longBreakInterval: 3,
      autoStartBreaks: true,
      autoStartPomodoros: false,
    },
    notificationSettings: {
      timerSound: true,
      breakSound: true,
      dailyReminder: true,
      reminderTime: '19:30',
      streakAlerts: true,
    },
    soundSettings: {
      masterEnabled: true,
      volume: 80,
      sessionStartSound: true,
      breakStartSound: true,
      completionSound: true,
      ambientType: 'rain',
      ambientVolume: 55,
      ambientAutoPlayOnFocus: true,
      localMusicVolume: 70,
      localMusicLoop: true,
      localMusicAutoPlayOnFocus: false,
    },
    gamification: {
      totalXp: 1250,
      level: 5,
      longestStreak: 14,
      unlockedBadges: {
        first_session: now,
        streak_7: now,
      },
      notifiedBadgeIds: ['first_session', 'streak_7'],
      awardedSessionIds: ['ses_1', 'ses_2'],
      awardedTaskIds: ['task_1'],
      awardedGoalIds: ['goal_1'],
      awardedStreakMilestones: [1, 3, 7],
      notifiedStreakMilestones: [1, 3, 7],
      dailyBonusAwardedDates: ['2026-11-22', '2026-11-23'],
      streakBonusAwardedDates: ['2026-11-23'],
      lastMilestoneCheck: now,
    },
    hasCompletedOnboarding: true,
    hasSeededDefaultSubjects: true,
    onboardingCompletedAt: now,
    lastActiveDate: '2026-11-23',
    createdAt: now,
    updatedAt: now,
  };

  // Shadow field on full 4-map create must fail fast
  await assertFails(
    setDoc(doc(fullDb, 'users', 'full_user_1'), { ...fullProfile, isAdmin: true })
  );

  // Creating full 4-map profile must succeed and persist in Firestore
  const fullUserRef = doc(fullDb, 'users', 'full_user_1');
  await assertSucceeds(setDoc(fullUserRef, fullProfile));
  const createdSnap = await assertSucceeds(getDoc(fullUserRef));
  assert.equal(createdSnap.exists(), true);
  assert.equal(createdSnap.data()?.gamification?.totalXp, 1250);
  assert.equal(createdSnap.data()?.soundSettings?.volume, 80);

  // Legitimate Phase 1.1 dotted-path gamification update on full 4-map profile must succeed and persist
  await assertSucceeds(
    updateDoc(fullUserRef, {
      'gamification.totalXp': increment(50),
      'gamification.level': 6,
      'gamification.longestStreak': 15,
      'gamification.awardedSessionIds': arrayUnion('ses_3'),
      'gamification.unlockedBadges.sessions_10': now,
      'gamification.notifiedBadgeIds': arrayUnion('sessions_10'),
      'gamification.lastMilestoneCheck': now,
      updatedAt: now,
    })
  );
  const afterGamSnap = await assertSucceeds(getDoc(fullUserRef));
  assert.equal(afterGamSnap.data()?.gamification?.totalXp, 1300);
  assert.equal(afterGamSnap.data()?.gamification?.level, 6);
  assert.deepEqual(afterGamSnap.data()?.gamification?.awardedSessionIds, ['ses_1', 'ses_2', 'ses_3']);

  // Legitimate soundSettings & displayName updates on full 4-map profile must succeed and persist
  await assertSucceeds(
    updateDoc(fullUserRef, {
      'soundSettings.ambientType': 'forest',
      'soundSettings.volume': 65,
      displayName: 'Full Profile Updated',
      updatedAt: now,
    })
  );
  const afterSoundSnap = await assertSucceeds(getDoc(fullUserRef));
  assert.equal(afterSoundSnap.data()?.soundSettings?.ambientType, 'forest');
  assert.equal(afterSoundSnap.data()?.soundSettings?.volume, 65);
  assert.equal(afterSoundSnap.data()?.displayName, 'Full Profile Updated');

  // Negative validation checks on full 4-map profile must still fail for intended schema/security reasons
  await assertFails(updateDoc(fullUserRef, { 'gamification.totalXp': -1 }));
  await assertFails(updateDoc(fullUserRef, { 'soundSettings.volume': 101 }));
  await assertFails(updateDoc(fullUserRef, { 'soundSettings.volume': null }));
  await assertFails(updateDoc(fullUserRef, { 'soundSettings.masterEnabled': 'yes' }));
  await assertFails(updateDoc(fullUserRef, { theme: 'invalid_theme' }));
  await assertFails(updateDoc(fullUserRef, { dailyGoalMinutes: 1441 }));
  await assertFails(updateDoc(fullUserRef, { role: 'admin' }));
});

test('7. Null rejections on required/non-nullable fields: explicit null updates on user profile, subjects, tasks, focus sessions, and goals fail', async () => {
  const aliceDb = testEnv.authenticatedContext('alice_123', { email: 'alice@example.com' }).firestore();
  const now = new Date().toISOString();

  // Create valid user profile
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'users', 'alice_123'), {
      id: 'alice_123',
      email: 'alice@example.com',
      displayName: 'Alice',
      dailyGoalMinutes: 120,
      streakCount: 1,
      createdAt: now,
      updatedAt: now,
    });
  });

  const userRef = doc(aliceDb, 'users', 'alice_123');

  // Required fields cannot be set to null
  await assertFails(updateDoc(userRef, { email: null, updatedAt: now }));
  await assertFails(updateDoc(userRef, { dailyGoalMinutes: null, updatedAt: now }));
  await assertFails(updateDoc(userRef, { streakCount: null, updatedAt: now }));

  // Subject null rejections on required fields
  const subjRef = doc(aliceDb, 'users', 'alice_123', 'subjects', 'subj_null_test');
  await assertSucceeds(
    setDoc(subjRef, {
      id: 'subj_null_test',
      userId: 'alice_123',
      name: 'Math',
      color: '#3b82f6',
      createdAt: now,
      updatedAt: now,
    })
  );
  await assertFails(updateDoc(subjRef, { name: null, updatedAt: now }));
  await assertFails(updateDoc(subjRef, { color: null, updatedAt: now }));

  // Task null rejections on required fields
  const taskRef = doc(aliceDb, 'users', 'alice_123', 'tasks', 'task_null_test');
  await assertSucceeds(
    setDoc(taskRef, {
      id: 'task_null_test',
      userId: 'alice_123',
      title: 'Calculus homework',
      status: 'pending',
      priority: 'high',
      createdAt: now,
      updatedAt: now,
    })
  );
  await assertFails(updateDoc(taskRef, { title: null, updatedAt: now }));
  await assertFails(updateDoc(taskRef, { status: null, updatedAt: now }));
  await assertFails(updateDoc(taskRef, { priority: null, updatedAt: now }));

  // FocusSession null rejections on required fields
  const sesRef = doc(aliceDb, 'users', 'alice_123', 'focusSessions', 'ses_null_test');
  await assertSucceeds(
    setDoc(sesRef, {
      id: 'ses_null_test',
      userId: 'alice_123',
      durationMinutes: 25,
      mode: 'pomodoro',
      createdAt: now,
    })
  );
  await assertFails(updateDoc(sesRef, { durationMinutes: null }));
  await assertFails(updateDoc(sesRef, { mode: null }));

  // Goal null rejections on required fields
  const goalRef = doc(aliceDb, 'users', 'alice_123', 'goals', 'goal_null_test');
  await assertSucceeds(
    setDoc(goalRef, {
      id: 'goal_null_test',
      userId: 'alice_123',
      title: 'Complete calculus book',
      targetValue: 12,
      unit: 'chapters',
      status: 'in_progress',
      createdAt: now,
      updatedAt: now,
    })
  );
  await assertFails(updateDoc(goalRef, { title: null, updatedAt: now }));
  await assertFails(updateDoc(goalRef, { targetValue: null, updatedAt: now }));
  await assertFails(updateDoc(goalRef, { unit: null, updatedAt: now }));
  await assertFails(updateDoc(goalRef, { status: null, updatedAt: now }));
});

