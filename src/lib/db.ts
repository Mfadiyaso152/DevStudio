import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  onSnapshot,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from './firebase';
import { QuoteRequest, Project, PaymentReceipt, UserProfile } from '../types';
import { INITIAL_QUOTES, INITIAL_PROJECTS, INITIAL_PAYMENTS } from './mockData';

const LOCAL_STORAGE_KEYS = {
  QUOTES: 'applet_studio_quotes_v1',
  PROJECTS: 'applet_studio_projects_v1',
  PAYMENTS: 'applet_studio_payments_v1',
  USERS: 'applet_studio_users_v1'
};

// Helper for local storage initialized fallback
function getLocal<T>(key: string, initial: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return initial;
  }
}

function setLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('LocalStorage write error:', e);
  }
}

// Helper for async timeouts to prevent hanging Firestore calls
const withTimeout = <T>(promise: Promise<T>, ms: number = 3000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Firestore operation timeout')), ms))
  ]);
};

// Ensure mock state exists locally first
getLocal(LOCAL_STORAGE_KEYS.QUOTES, INITIAL_QUOTES);
getLocal(LOCAL_STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
getLocal(LOCAL_STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);

// Helper to convert Arabic digits (٠١٢٣٤٥٦٧٨٩) to English digits (0123456789)
export function convertArabicToEnglishDigits(str: string): string {
  if (!str) return '';
  return str.replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
}

export function getClientCodeForUser(uid: string): string {
  const users = getLocal<Record<string, UserProfile>>(LOCAL_STORAGE_KEYS.USERS, {});
  const userList = Object.values(users);
  if (users[uid]?.clientCode) return users[uid].clientCode!;
  const userIndex = userList.findIndex(u => u.uid === uid);
  const codeNum = userIndex !== -1 ? userIndex + 1 : userList.length + 1;
  return `DS-${codeNum}`;
}

export function getOrderCodeForQuote(quoteId: string): string {
  const currentQuotes = getLocal<QuoteRequest[]>(LOCAL_STORAGE_KEYS.QUOTES, []);
  const quoteIndex = currentQuotes.findIndex(q => q.id === quoteId);
  if (quoteIndex !== -1 && currentQuotes[quoteIndex].orderCode) {
    return currentQuotes[quoteIndex].orderCode!;
  }
  const codeNum = quoteIndex !== -1 ? currentQuotes.length - quoteIndex : currentQuotes.length + 1;
  return `OD-${codeNum}`;
}

export function getAllUserProfiles(): UserProfile[] {
  const users = getLocal<Record<string, UserProfile>>(LOCAL_STORAGE_KEYS.USERS, {});
  return Object.values(users).map((u, idx) => ({
    ...u,
    clientCode: u.clientCode || `DS-${idx + 1}`
  }));
}

export async function updateUserRole(uid: string, role: 'client' | 'staff' | 'admin'): Promise<void> {
  const users = getLocal<Record<string, UserProfile>>(LOCAL_STORAGE_KEYS.USERS, {});
  if (users[uid]) {
    users[uid].role = role;
    users[uid].updatedAt = new Date().toISOString();
    setLocal(LOCAL_STORAGE_KEYS.USERS, users);
    if (db) {
      try {
        await updateDoc(doc(db, 'users', uid), { role, updatedAt: users[uid].updatedAt });
      } catch (e) {
        console.warn('Firestore update user role fallback:', e);
      }
    }
  }
}

// -------------------------------------------------------------
// USER PROFILES
// -------------------------------------------------------------
export async function saveUserProfile(profile: UserProfile): Promise<void> {
  // Always update local memory first
  const users = getLocal<Record<string, UserProfile>>(LOCAL_STORAGE_KEYS.USERS, {});
  const userList = Object.values(users);
  const assignedCode = profile.clientCode || `DS-${userList.length + 1}`;
  const cleanPhone = convertArabicToEnglishDigits(profile.phone);

  const updatedProfile: UserProfile = {
    ...profile,
    phone: cleanPhone,
    clientCode: assignedCode
  };

  users[profile.uid] = updatedProfile;
  setLocal(LOCAL_STORAGE_KEYS.USERS, users);

  if (db) {
    try {
      const ref = doc(db, 'users', profile.uid);
      await withTimeout(setDoc(ref, updatedProfile, { merge: true }), 3000);
    } catch (e) {
      console.warn('Firestore user write fallback:', e);
    }
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const users = getLocal<Record<string, UserProfile>>(LOCAL_STORAGE_KEYS.USERS, {});
  if (users[uid]) return users[uid];

  if (db) {
    try {
      const ref = doc(db, 'users', uid);
      const snap = await withTimeout(getDoc(ref), 3000);
      if (snap && snap.exists && snap.exists()) {
        return snap.data() as UserProfile;
      }
    } catch (e) {
      console.warn('Firestore user fetch fallback:', e);
    }
  }
  return null;
}

// -------------------------------------------------------------
// QUOTE REQUESTS
// -------------------------------------------------------------
export function subscribeQuotes(callback: (quotes: QuoteRequest[]) => void): () => void {
  // Fire immediately with local storage
  const localQuotes = getLocal<QuoteRequest[]>(LOCAL_STORAGE_KEYS.QUOTES, INITIAL_QUOTES);
  callback(localQuotes);

  if (!db) return () => {};

  try {
    const qRef = collection(db, 'quotes');
    const unsubscribe = onSnapshot(qRef, (snapshot) => {
      if (!snapshot.empty) {
        const firestoreQuotes: QuoteRequest[] = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        } as QuoteRequest));
        
        // Merge with local quotes
        setLocal(LOCAL_STORAGE_KEYS.QUOTES, firestoreQuotes);
        callback(firestoreQuotes);
      }
    }, (err) => {
      console.warn('Firestore quotes listener fallback:', err);
    });
    return unsubscribe;
  } catch (e) {
    console.warn('Firestore subscribe quotes error:', e);
    return () => {};
  }
}

export async function createQuoteRequest(quote: Omit<QuoteRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<QuoteRequest> {
  const newId = 'quote-' + Date.now();
  const now = new Date().toISOString();
  const currentQuotes = getLocal<QuoteRequest[]>(LOCAL_STORAGE_KEYS.QUOTES, INITIAL_QUOTES);
  const orderCode = `OD-${currentQuotes.length + 1}`;
  const cleanPhone = convertArabicToEnglishDigits(quote.userPhone);
  
  const fullQuote: QuoteRequest = {
    ...quote,
    id: newId,
    orderCode,
    userPhone: cleanPhone,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };

  const updated = [fullQuote, ...currentQuotes];
  setLocal(LOCAL_STORAGE_KEYS.QUOTES, updated);

  if (db) {
    try {
      await setDoc(doc(db, 'quotes', newId), fullQuote);
    } catch (e) {
      console.warn('Firestore quote create fallback:', e);
    }
  }

  return fullQuote;
}

export async function updateQuoteStatus(
  quoteId: string, 
  status: 'accepted' | 'rejected', 
  staffNotes?: string, 
  agreedPrice?: number,
  contactMethod?: 'whatsapp' | 'email' | 'phone'
): Promise<void> {
  const currentQuotes = getLocal<QuoteRequest[]>(LOCAL_STORAGE_KEYS.QUOTES, INITIAL_QUOTES);
  const quoteIndex = currentQuotes.findIndex(q => q.id === quoteId);
  const now = new Date().toISOString();

  let targetQuote: QuoteRequest | null = null;

  if (quoteIndex !== -1) {
    currentQuotes[quoteIndex] = {
      ...currentQuotes[quoteIndex],
      status,
      staffNotes: staffNotes || currentQuotes[quoteIndex].staffNotes,
      agreedPrice: agreedPrice !== undefined ? agreedPrice : currentQuotes[quoteIndex].agreedPrice,
      contactMethod: contactMethod || currentQuotes[quoteIndex].contactMethod,
      updatedAt: now
    };
    targetQuote = currentQuotes[quoteIndex];
    setLocal(LOCAL_STORAGE_KEYS.QUOTES, currentQuotes);
  }

  if (db) {
    try {
      await updateDoc(doc(db, 'quotes', quoteId), {
        status,
        staffNotes,
        agreedPrice,
        contactMethod,
        updatedAt: now
      });
    } catch (e) {
      console.warn('Firestore quote update fallback:', e);
    }
  }

  // If quote is accepted and agreedPrice is set, automatically spawn or update a Project record!
  if (status === 'accepted' && targetQuote && (agreedPrice || targetQuote.agreedPrice)) {
    await ensureProjectForQuote(targetQuote, agreedPrice || targetQuote.agreedPrice || 0);
  }
}

// -------------------------------------------------------------
// PROJECTS & PROGRESS
// -------------------------------------------------------------
export function subscribeProjects(callback: (projects: Project[]) => void): () => void {
  const localProjects = getLocal<Project[]>(LOCAL_STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
  callback(localProjects);

  if (!db) return () => {};

  try {
    const pRef = collection(db, 'projects');
    const unsubscribe = onSnapshot(pRef, (snapshot) => {
      if (!snapshot.empty) {
        const firestoreProjects: Project[] = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        } as Project));
        setLocal(LOCAL_STORAGE_KEYS.PROJECTS, firestoreProjects);
        callback(firestoreProjects);
      }
    }, (err) => {
      console.warn('Firestore projects listener fallback:', err);
    });
    return unsubscribe;
  } catch (e) {
    console.warn('Firestore subscribe projects error:', e);
    return () => {};
  }
}

export async function ensureProjectForQuote(quote: QuoteRequest, price: number): Promise<Project> {
  const projects = getLocal<Project[]>(LOCAL_STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
  const existingIndex = projects.findIndex(p => p.quoteId === quote.id);

  const now = new Date().toISOString();

  if (existingIndex !== -1) {
    projects[existingIndex].agreedPrice = price;
    projects[existingIndex].updatedAt = now;
    setLocal(LOCAL_STORAGE_KEYS.PROJECTS, projects);
    if (db) {
      try {
        await updateDoc(doc(db, 'projects', projects[existingIndex].id), {
          agreedPrice: price,
          updatedAt: now
        });
      } catch (e) {
        console.warn('Firestore project update fallback:', e);
      }
    }
    return projects[existingIndex];
  }

  const newProjId = 'proj-' + Date.now();
  const newProject: Project = {
    id: newProjId,
    quoteId: quote.id,
    userId: quote.userId,
    userName: quote.userName,
    userPhone: quote.userPhone,
    title: quote.title,
    serviceType: quote.serviceType,
    agreedPrice: price,
    paidAmount: 0,
    paymentStatus: 'unpaid',
    progressPercentage: 25,
    currentStepIndex: 0,
    steps: [
      {
        id: 's1',
        title: 'التحليل وتصميم الواجهات (UI/UX)',
        description: 'تحليل المتطلبات ورسم الشاشات التفاعلية وتأكيد تصميم الواجهة.',
        status: 'in_progress'
      },
      {
        id: 's2',
        title: 'تطوير البرمجيات وقواعد البيانات',
        description: 'كتابة الأكواد، إنشاء قواعد البيانات، وربط الخدمات والواجهات البرمجية.',
        status: 'pending'
      },
      {
        id: 's3',
        title: 'الاختبار الشامل والتأكد من الجودة (QA)',
        description: 'اختبار الأداء والتوافق على مختلف الأجهزة والمعالجة النهائية.',
        status: 'pending'
      },
      {
        id: 's4',
        title: 'تسليم المشروع والاعتماد النهائي',
        description: 'قبول سياسة الضمان لمدة 12 شهر وتسليم كود المصدر والرابط.',
        status: 'pending'
      }
    ],
    warrantyAgreed: false,
    deliverables: {
      repositoryUrl: 'https://github.com/developer-studio/project-' + newProjId,
      appDownloadUrl: 'https://builds.dev-studio.sa/app-release.apk',
      webDomainUrl: 'https://app-preview.dev-studio.sa',
      documentationUrl: 'https://docs.dev-studio.sa/guide',
      notes: 'تم جهوزية تسليم المشروع بعد تأكيد الضمان وقبول الشروط.'
    },
    createdAt: now,
    updatedAt: now
  };

  const updatedProjects = [newProject, ...projects];
  setLocal(LOCAL_STORAGE_KEYS.PROJECTS, updatedProjects);

  if (db) {
    try {
      await setDoc(doc(db, 'projects', newProjId), newProject);
    } catch (e) {
      console.warn('Firestore project set fallback:', e);
    }
  }

  return newProject;
}

export async function updateProjectProgress(
  projectId: string, 
  progressPercentage: number, 
  currentStepIndex: number,
  deliverables?: Partial<Project['deliverables']>
): Promise<void> {
  const projects = getLocal<Project[]>(LOCAL_STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
  const pIndex = projects.findIndex(p => p.id === projectId);
  const now = new Date().toISOString();

  if (pIndex !== -1) {
    const p = projects[pIndex];
    p.progressPercentage = progressPercentage;
    p.currentStepIndex = currentStepIndex;

    // Update steps statuses based on step index
    p.steps = p.steps.map((step, idx) => {
      if (idx < currentStepIndex) return { ...step, status: 'completed', completedAt: step.completedAt || now };
      if (idx === currentStepIndex) return { ...step, status: progressPercentage === 100 ? 'completed' : 'in_progress' };
      return { ...step, status: 'pending' };
    });

    if (deliverables) {
      p.deliverables = { ...p.deliverables, ...deliverables };
    }

    p.updatedAt = now;
    setLocal(LOCAL_STORAGE_KEYS.PROJECTS, projects);
  }

  if (db) {
    try {
      await updateDoc(doc(db, 'projects', projectId), {
        progressPercentage,
        currentStepIndex,
        deliverables,
        updatedAt: now
      });
    } catch (e) {
      console.warn('Firestore update project progress error:', e);
    }
  }
}

export async function signProjectWarranty(projectId: string): Promise<void> {
  const projects = getLocal<Project[]>(LOCAL_STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
  const pIndex = projects.findIndex(p => p.id === projectId);
  const now = new Date().toISOString();

  if (pIndex !== -1) {
    projects[pIndex].warrantyAgreed = true;
    projects[pIndex].warrantyAgreedAt = now;
    setLocal(LOCAL_STORAGE_KEYS.PROJECTS, projects);
  }

  if (db) {
    try {
      await updateDoc(doc(db, 'projects', projectId), {
        warrantyAgreed: true,
        warrantyAgreedAt: now,
        updatedAt: now
      });
    } catch (e) {
      console.warn('Firestore warranty sign error:', e);
    }
  }
}

// -------------------------------------------------------------
// PAYMENTS & BANK TRANSFERS
// -------------------------------------------------------------
export function subscribePayments(callback: (payments: PaymentReceipt[]) => void): () => void {
  const localPayments = getLocal<PaymentReceipt[]>(LOCAL_STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
  callback(localPayments);

  if (!db) return () => {};

  try {
    const pRef = collection(db, 'payments');
    const unsubscribe = onSnapshot(pRef, (snapshot) => {
      if (!snapshot.empty) {
        const firestorePayments: PaymentReceipt[] = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        } as PaymentReceipt));
        setLocal(LOCAL_STORAGE_KEYS.PAYMENTS, firestorePayments);
        callback(firestorePayments);
      }
    }, (err) => {
      console.warn('Firestore payments listener error:', err);
    });
    return unsubscribe;
  } catch (e) {
    console.warn('Firestore payments subscribe error:', e);
    return () => {};
  }
}

export async function submitPaymentReceipt(receipt: Omit<PaymentReceipt, 'id' | 'status' | 'createdAt'>): Promise<PaymentReceipt> {
  const newId = 'pay-' + Date.now();
  const now = new Date().toISOString();

  const newReceipt: PaymentReceipt = {
    ...receipt,
    id: newId,
    status: 'pending',
    createdAt: now
  };

  const currentPayments = getLocal<PaymentReceipt[]>(LOCAL_STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
  const updated = [newReceipt, ...currentPayments];
  setLocal(LOCAL_STORAGE_KEYS.PAYMENTS, updated);

  // Update project payment status to 'receipt_submitted'
  const projects = getLocal<Project[]>(LOCAL_STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
  const projIdx = projects.findIndex(p => p.id === receipt.projectId);
  if (projIdx !== -1) {
    projects[projIdx].paymentStatus = 'receipt_submitted';
    setLocal(LOCAL_STORAGE_KEYS.PROJECTS, projects);
  }

  if (db) {
    try {
      await setDoc(doc(db, 'payments', newId), newReceipt);
      if (projIdx !== -1) {
        await updateDoc(doc(db, 'projects', receipt.projectId), {
          paymentStatus: 'receipt_submitted'
        });
      }
    } catch (e) {
      console.warn('Firestore payment submit error:', e);
    }
  }

  return newReceipt;
}

export async function approveOrRejectPayment(paymentId: string, status: 'approved' | 'rejected', supervisorNotes?: string): Promise<void> {
  const payments = getLocal<PaymentReceipt[]>(LOCAL_STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
  const pIndex = payments.findIndex(p => p.id === paymentId);

  if (pIndex !== -1) {
    payments[pIndex].status = status;
    payments[pIndex].supervisorNotes = supervisorNotes || payments[pIndex].supervisorNotes;
    setLocal(LOCAL_STORAGE_KEYS.PAYMENTS, payments);

    // If approved, update project paidAmount & paymentStatus!
    if (status === 'approved') {
      const projects = getLocal<Project[]>(LOCAL_STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
      const projIdx = projects.findIndex(p => p.id === payments[pIndex].projectId);
      if (projIdx !== -1) {
        projects[projIdx].paidAmount = payments[pIndex].amount;
        projects[projIdx].paymentStatus = 'paid';
        setLocal(LOCAL_STORAGE_KEYS.PROJECTS, projects);
      }
    }
  }

  if (db) {
    try {
      await updateDoc(doc(db, 'payments', paymentId), {
        status,
        supervisorNotes
      });
      if (status === 'approved' && pIndex !== -1) {
        await updateDoc(doc(db, 'projects', payments[pIndex].projectId), {
          paymentStatus: 'paid'
        });
      }
    } catch (e) {
      console.warn('Firestore payment status update error:', e);
    }
  }
}

// Export aliases for page routes
export const submitQuoteRequest = createQuoteRequest;
export const acceptProjectWarranty = signProjectWarranty;

