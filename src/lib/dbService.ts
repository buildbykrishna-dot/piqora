import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { 
  Quiz, 
  Question, 
  QuestionSet, 
  Lesson, 
  QuizSession, 
  Participant, 
  AnswerSubmission,
  OptionLetter 
} from '../types';

// Pre-seeded college sample quizzes for immediate classroom readiness
export const SAMPLE_QUIZZES: Omit<Quiz, 'teacherId'>[] = [
  {
    id: 'sample-ds-algo-1',
    title: 'Data Structures: Stacks, Queues & Binary Trees',
    description: 'Mid-term revision quiz covering FIFO/LIFO architectures, tree traversals, and amortized complexity.',
    subject: 'Computer Science',
    courseLabel: 'CS201',
    coverColor: '#6D28D9',
    tags: ['Algorithms', 'Revision', 'Mid-Term'],
    isPublished: true,
    isPublic: true,
    questionsCount: 4,
    questions: [
      {
        id: 'q1',
        text: 'Which abstract data type operates on a First-In, First-Out (FIFO) principle?',
        options: ['Stack', 'Queue', 'Binary Heap', 'Priority Queue'],
        correctAnswer: 'B',
        explanation: 'A Queue enforces FIFO: elements are enqueued at the rear and dequeued from the front.',
        timeLimit: 20,
        points: 1000,
        order: 1
      },
      {
        id: 'q2',
        text: 'What is the average time complexity for searching a balanced Binary Search Tree (AVL / Red-Black)?',
        options: ['O(1)', 'O(n)', 'O(log n)', 'O(n log n)'],
        correctAnswer: 'C',
        explanation: 'Balanced BSTs maintain height proportional to log2(n), giving O(log n) lookups.',
        timeLimit: 20,
        points: 1000,
        order: 2
      },
      {
        id: 'q3',
        text: 'Which tree traversal visits vertices in Left-Root-Right order, producing sorted output for BSTs?',
        options: ['Pre-order', 'In-order', 'Post-order', 'Level-order'],
        correctAnswer: 'B',
        explanation: 'In-order traversal visits the left subtree, then current node, then right subtree.',
        timeLimit: 25,
        points: 1000,
        order: 3
      },
      {
        id: 'q4',
        text: 'What is the minimum number of queues required to implement a functional LIFO Stack?',
        options: ['1 queue', '2 queues', '3 queues', 'Not possible with queues'],
        correctAnswer: 'B',
        explanation: 'Two queues can simulate a stack by transferring elements on push or pop operations.',
        timeLimit: 30,
        points: 1000,
        order: 4
      }
    ],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'sample-db-sql-2',
    title: 'Database Systems: Normalization & SQL Queries',
    description: 'Revision quiz on Functional Dependencies, BCNF, 3NF, and JOIN optimizations.',
    subject: 'Database Engineering',
    courseLabel: 'CS340',
    coverColor: '#2563EB',
    tags: ['Databases', 'SQL', 'BCNF'],
    isPublished: true,
    isPublic: true,
    questionsCount: 3,
    questions: [
      {
        id: 'db-q1',
        text: 'A relation is in 2NF if it is in 1NF and contains no:',
        options: ['Transitive dependencies', 'Partial dependencies on candidate keys', 'Multi-valued dependencies', 'Foreign key constraints'],
        correctAnswer: 'B',
        explanation: 'Second Normal Form (2NF) eliminates partial dependencies of non-prime attributes on candidate keys.',
        timeLimit: 25,
        points: 1000,
        order: 1
      },
      {
        id: 'db-q2',
        text: 'Which SQL keyword combines rows from two tables while keeping records from the left table even without matches?',
        options: ['INNER JOIN', 'LEFT OUTER JOIN', 'CROSS JOIN', 'NATURAL JOIN'],
        correctAnswer: 'B',
        explanation: 'LEFT OUTER JOIN returns all rows from the left table and matched rows from the right table.',
        timeLimit: 20,
        points: 1000,
        order: 2
      },
      {
        id: 'db-q3',
        text: 'In relational database ACID properties, what does the "I" stand for?',
        options: ['Integrity', 'Indexing', 'Isolation', 'Inheritance'],
        correctAnswer: 'C',
        explanation: 'ACID stands for Atomicity, Consistency, Isolation, and Durability.',
        timeLimit: 15,
        points: 1000,
        order: 3
      }
    ],
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  }
];

export const SAMPLE_LESSONS: Omit<Lesson, 'teacherId'>[] = [
  {
    id: 'lesson-os-deadlocks',
    title: 'Operating Systems: Deadlock Prevention & Coffman Conditions',
    description: 'Summary revision sheet on Mutual Exclusion, Hold & Wait, No Preemption, and Circular Wait.',
    subject: 'Operating Systems',
    content: `## The Four Coffman Conditions

A deadlock state can arise if and only if the following four conditions hold simultaneously in a system:

1. **Mutual Exclusion**: At least one resource must be held in a non-shareable mode (only one process can use it at a time).
2. **Hold and Wait**: A process must currently hold at least one resource and be waiting to acquire additional resources held by other processes.
3. **No Preemption**: Resources cannot be preempted; a resource can be released only voluntarily by the process holding it after finishing its task.
4. **Circular Wait**: A closed chain of processes exists such that each process holds at least one resource needed by the next process in the chain.

### Handling Strategies
- **Deadlock Prevention**: Invalidate at least one of the four Coffman conditions.
- **Deadlock Avoidance**: Use banker's algorithm to ensure the system remains in a safe state.
- **Deadlock Detection & Recovery**: Allow deadlock to happen, detect cycles via resource allocation graphs (RAG), and preempt processes.`,
    externalLinks: [
      { title: 'OS Concepts (Silberschatz) Chapter 8 Notes', url: 'https://codex.cs.yale.edu/avi/os-book/' },
      { title: 'MIT 6.004 Deadlocks Lecture', url: 'https://6004.mit.edu/' }
    ],
    isPublished: true,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString()
  }
];

export const SAMPLE_QUESTION_SETS: Omit<QuestionSet, 'teacherId'>[] = [
  {
    id: 'qset-core-algorithms',
    title: 'Core Algorithm Complexity & Big-O Question Pool',
    description: 'Reusable question set for computer science exams and rapid pop-quizzes.',
    subject: 'Computer Science',
    questionCount: 4,
    questions: [
      {
        id: 'q-pool-1',
        text: 'What is the worst-case time complexity of QuickSort when the pivot is the smallest element repeatedly?',
        options: ['O(log n)', 'O(n)', 'O(n log n)', 'O(n²)'],
        correctAnswer: 'D',
        explanation: 'QuickSort degrades to O(n²) when the partition is maximally unbalanced at each step.',
        timeLimit: 20,
        points: 1000,
        order: 1
      },
      {
        id: 'q-pool-2',
        text: 'Which sorting algorithm guarantees O(n log n) worst-case time complexity and is stable?',
        options: ['Merge Sort', 'Heap Sort', 'Selection Sort', 'Bubble Sort'],
        correctAnswer: 'A',
        explanation: 'Merge Sort is O(n log n) in all cases and preserves relative order of duplicate keys (stable).',
        timeLimit: 20,
        points: 1000,
        order: 2
      }
    ],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 5).toISOString()
  }
];

// --- QUIZ OPERATIONS ---

export async function getTeacherQuizzes(teacherId: string): Promise<Quiz[]> {
  try {
    const q = query(collection(db, 'quizzes'), where('teacherId', '==', teacherId));
    const snap = await getDocs(q);
    const results: Quiz[] = [];
    snap.forEach((d) => results.push(d.data() as Quiz));

    if (results.length === 0) {
      // Seed initial sample quizzes for this teacher
      for (const sample of SAMPLE_QUIZZES) {
        const fullQuiz: Quiz = { ...sample, teacherId };
        await setDoc(doc(db, 'quizzes', fullQuiz.id), fullQuiz);
        results.push(fullQuiz);
      }
    }
    return results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch (err) {
    console.warn('Fallback loading quizzes:', err);
    // Return sample quizzes if permission issue or offline
    return SAMPLE_QUIZZES.map(s => ({ ...s, teacherId }));
  }
}

export async function getQuizById(quizId: string): Promise<Quiz | null> {
  try {
    const snap = await getDoc(doc(db, 'quizzes', quizId));
    if (snap.exists()) {
      return snap.data() as Quiz;
    }
    // Check sample fallback
    const sample = SAMPLE_QUIZZES.find(s => s.id === quizId);
    if (sample) return { ...sample, teacherId: 'demo_teacher' };
    return null;
  } catch (err) {
    console.warn('Error fetching quiz by ID:', err);
    const sample = SAMPLE_QUIZZES.find(s => s.id === quizId);
    return sample ? { ...sample, teacherId: 'demo_teacher' } : null;
  }
}

export async function saveQuiz(quiz: Quiz): Promise<void> {
  try {
    await setDoc(doc(db, 'quizzes', quiz.id), quiz);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `quizzes/${quiz.id}`);
  }
}

export async function deleteQuiz(quizId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'quizzes', quizId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `quizzes/${quizId}`);
  }
}

// --- QUESTION SETS ---

export async function getTeacherQuestionSets(teacherId: string): Promise<QuestionSet[]> {
  try {
    const q = query(collection(db, 'questionSets'), where('teacherId', '==', teacherId));
    const snap = await getDocs(q);
    const results: QuestionSet[] = [];
    snap.forEach((d) => results.push(d.data() as QuestionSet));
    if (results.length === 0) {
      for (const sample of SAMPLE_QUESTION_SETS) {
        const full = { ...sample, teacherId };
        await setDoc(doc(db, 'questionSets', full.id), full);
        results.push(full);
      }
    }
    return results;
  } catch (err) {
    console.warn('Fallback loading question sets:', err);
    return SAMPLE_QUESTION_SETS.map(s => ({ ...s, teacherId }));
  }
}

export async function saveQuestionSet(qSet: QuestionSet): Promise<void> {
  try {
    await setDoc(doc(db, 'questionSets', qSet.id), qSet);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `questionSets/${qSet.id}`);
  }
}

export async function deleteQuestionSet(setId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'questionSets', setId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `questionSets/${setId}`);
  }
}

// --- LESSONS ---

export async function getTeacherLessons(teacherId: string): Promise<Lesson[]> {
  try {
    const q = query(collection(db, 'lessons'), where('teacherId', '==', teacherId));
    const snap = await getDocs(q);
    const results: Lesson[] = [];
    snap.forEach((d) => results.push(d.data() as Lesson));
    if (results.length === 0) {
      for (const sample of SAMPLE_LESSONS) {
        const full = { ...sample, teacherId };
        await setDoc(doc(db, 'lessons', full.id), full);
        results.push(full);
      }
    }
    return results;
  } catch (err) {
    console.warn('Fallback loading lessons:', err);
    return SAMPLE_LESSONS.map(s => ({ ...s, teacherId }));
  }
}

export async function saveLesson(lesson: Lesson): Promise<void> {
  try {
    await setDoc(doc(db, 'lessons', lesson.id), lesson);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `lessons/${lesson.id}`);
  }
}

export async function deleteLesson(lessonId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'lessons', lessonId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `lessons/${lessonId}`);
  }
}

// --- LIVE SESSIONS & REALTIME HOOKS ---

export function generatePin(): string {
  // Generate friendly 6-digit classroom PIN
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function createLiveSession(quizInput: Quiz, teacherId: string): Promise<QuizSession> {
  const sessionId = 'session_' + Math.random().toString(36).substring(2, 10);
  const pin = generatePin();

  // Load the latest saved quiz directly from Firestore to ensure hosting uses fresh saved data
  let activeQuiz = quizInput;
  try {
    const snap = await getDoc(doc(db, 'quizzes', quizInput.id));
    if (snap.exists()) {
      activeQuiz = snap.data() as Quiz;
    }
  } catch (err) {
    console.warn('Could not fetch fresh quiz from Firestore in createLiveSession, using supplied quiz snapshot:', err);
  }

  // Preserve the saved question order, timer and points for each question
  const rawQuestions = activeQuiz.questions || [];
  const sortedQuestions = [...rawQuestions].sort((a, b) => (a.order || 0) - (b.order || 0));
  const questionsSnapshot: Question[] = sortedQuestions.map((q, idx) => ({
    ...q,
    order: q.order || idx + 1,
    timeLimit: typeof q.timeLimit === 'number' && q.timeLimit > 0 ? q.timeLimit : 20,
    points: typeof q.points === 'number' ? q.points : 1000
  }));

  const newSession: QuizSession = {
    id: sessionId,
    pin,
    quizId: activeQuiz.id,
    quizTitle: activeQuiz.title,
    teacherId,
    status: 'waiting',
    currentQuestionIndex: 0,
    questionStartedAt: 0,
    totalQuestions: questionsSnapshot.length,
    participantCount: 0,
    questionsSnapshot,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'quizSessions', sessionId), newSession);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `quizSessions/${sessionId}`);
  }

  return newSession;
}

export async function getSessionByPin(pin: string): Promise<QuizSession | null> {
  try {
    const q = query(collection(db, 'quizSessions'), where('pin', '==', pin.trim()));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const activeSession = snap.docs[0].data() as QuizSession;
      return activeSession;
    }
    return null;
  } catch (err) {
    console.error('Error finding session by PIN:', err);
    return null;
  }
}

export async function getSessionById(sessionId: string): Promise<QuizSession | null> {
  try {
    const snap = await getDoc(doc(db, 'quizSessions', sessionId));
    if (snap.exists()) {
      return snap.data() as QuizSession;
    }
    return null;
  } catch (err) {
    console.error('Error finding session by ID:', err);
    return null;
  }
}

export function subscribeToSession(sessionId: string, onUpdate: (session: QuizSession) => void) {
  const sessionRef = doc(db, 'quizSessions', sessionId);
  return onSnapshot(sessionRef, (snap) => {
    if (snap.exists()) {
      onUpdate(snap.data() as QuizSession);
    }
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, `quizSessions/${sessionId}`);
  });
}

export function subscribeToParticipants(sessionId: string, onUpdate: (participants: Participant[]) => void) {
  const pRef = collection(db, 'quizSessions', sessionId, 'participants');
  return onSnapshot(pRef, (snap) => {
    const participants: Participant[] = [];
    snap.forEach((d) => participants.push(d.data() as Participant));
    // Sort by score descending
    participants.sort((a, b) => b.score - a.score);
    onUpdate(participants);
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, `quizSessions/${sessionId}/participants`);
  });
}

export function subscribeToAnswers(sessionId: string, onUpdate: (answers: AnswerSubmission[]) => void) {
  const ansRef = collection(db, 'quizSessions', sessionId, 'answers');
  return onSnapshot(ansRef, (snap) => {
    const answers: AnswerSubmission[] = [];
    snap.forEach((d) => answers.push(d.data() as AnswerSubmission));
    onUpdate(answers);
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, `quizSessions/${sessionId}/answers`);
  });
}

export async function joinSessionAsStudent(sessionId: string, displayName: string): Promise<Participant> {
  const participantId = 'p_' + Math.random().toString(36).substring(2, 9);
  const participant: Participant = {
    id: participantId,
    sessionId,
    displayName: displayName.trim(),
    score: 0,
    streak: 0,
    correctCount: 0,
    answeredCount: 0,
    joinedAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, 'quizSessions', sessionId, 'participants', participantId), participant);
    // increment participant count on session doc
    const sessionDoc = await getDoc(doc(db, 'quizSessions', sessionId));
    if (sessionDoc.exists()) {
      const curCount = sessionDoc.data().participantCount || 0;
      await updateDoc(doc(db, 'quizSessions', sessionId), {
        participantCount: curCount + 1,
        updatedAt: new Date().toISOString()
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `quizSessions/${sessionId}/participants/${participantId}`);
  }

  return participant;
}

export async function submitStudentAnswer(
  sessionId: string,
  participantId: string,
  questionIndex: number,
  selectedOption: OptionLetter,
  session: QuizSession
): Promise<{ isCorrect: boolean; pointsAwarded: number }> {
  const currentQ = session.questionsSnapshot[questionIndex];
  if (!currentQ) return { isCorrect: false, pointsAwarded: 0 };

  const isCorrect = currentQ.correctAnswer === selectedOption;
  const timeLimitSeconds = typeof currentQ.timeLimit === 'number' && currentQ.timeLimit > 0 ? currentQ.timeLimit : 20;
  const timeLimitMs = timeLimitSeconds * 1000;
  const responseTimeMs = Math.max(100, Date.now() - (session.questionStartedAt || Date.now()));
  
  // Authoritative Kahoot-style scoring algorithm:
  // Base points * (1 - (responseTime / 2 * timeLimit))
  let pointsAwarded = 0;
  if (isCorrect) {
    const maxPoints = typeof currentQ.points === 'number' ? currentQ.points : 1000;
    const speedFactor = Math.max(0.5, 1 - (responseTimeMs / (2 * timeLimitMs)));
    pointsAwarded = Math.round(maxPoints * speedFactor);
  }

  const answerId = `ans_${participantId}_q${questionIndex}`;
  const answerDoc: AnswerSubmission = {
    id: answerId,
    sessionId,
    participantId,
    questionIndex,
    selectedOption,
    isCorrect,
    pointsAwarded,
    responseTimeMs,
    submittedAt: new Date().toISOString()
  };

  try {
    // Write answer
    await setDoc(doc(db, 'quizSessions', sessionId, 'answers', answerId), answerDoc);

    // Update participant score and streak
    const pRef = doc(db, 'quizSessions', sessionId, 'participants', participantId);
    const pSnap = await getDoc(pRef);
    if (pSnap.exists()) {
      const pData = pSnap.data() as Participant;
      const newScore = pData.score + pointsAwarded;
      const newStreak = isCorrect ? pData.streak + 1 : 0;
      const newCorrect = isCorrect ? pData.correctCount + 1 : pData.correctCount;
      const newAnswered = pData.answeredCount + 1;

      await updateDoc(pRef, {
        score: newScore,
        streak: newStreak,
        correctCount: newCorrect,
        answeredCount: newAnswered,
        lastAnswer: selectedOption
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `quizSessions/${sessionId}/answers/${answerId}`);
  }

  return { isCorrect, pointsAwarded };
}

export async function advanceSessionState(
  sessionId: string, 
  newStatus: QuizSession['status'], 
  newIndex?: number
): Promise<void> {
  try {
    const updatePayload: Partial<QuizSession> = {
      status: newStatus,
      updatedAt: new Date().toISOString()
    };

    if (newStatus === 'question') {
      updatePayload.questionStartedAt = Date.now();
      if (typeof newIndex === 'number') {
        updatePayload.currentQuestionIndex = newIndex;
      }
    } else if (typeof newIndex === 'number') {
      updatePayload.currentQuestionIndex = newIndex;
    }

    await updateDoc(doc(db, 'quizSessions', sessionId), updatePayload);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `quizSessions/${sessionId}`);
  }
}

export async function getTeacherSessions(teacherId: string): Promise<QuizSession[]> {
  try {
    const q = query(collection(db, 'quizSessions'), where('teacherId', '==', teacherId));
    const snap = await getDocs(q);
    const results: QuizSession[] = [];
    snap.forEach((d) => results.push(d.data() as QuizSession));
    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.warn('Error fetching teacher sessions:', err);
    return [];
  }
}
