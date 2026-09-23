import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from './firebase';
import { QuoteRequest, Project, PaymentReceipt, UserProfile, StaffMember, PortfolioProject } from '../types';
import { INITIAL_QUOTES, INITIAL_PROJECTS, INITIAL_PAYMENTS, INITIAL_STAFF, INITIAL_PORTFOLIO_PROJECTS } from './mockData';

const LOCAL_STORAGE_KEYS = {
  QUOTES: 'applet_studio_quotes_v2',
  PROJECTS: 'applet_studio_projects_v2',
  PAYMENTS: 'applet_studio_payments_v2',
  USERS: 'applet_studio_users_v2',
  STAFF: 'applet_studio_staff_v2',
  PORTFOLIO: 'applet_studio_portfolio_v2'
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
  }
  if (db) {
    try {
      await updateDoc(doc(db, 'users', uid), { role, updatedAt: new Date().toISOString() });
    } catch (e) {
      console.warn('Firestore update user role fallback:', e);
    }
  }
}

// -------------------------------------------------------------
// USER PROFILES
// -------------------------------------------------------------
export async function saveUserProfile(profile: UserProfile): Promise<void> {
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
        const data = snap.data() as UserProfile;
        users[uid] = data;
        setLocal(LOCAL_STORAGE_KEYS.USERS, users);
        return data;
      }
    } catch (e) {
      console.warn('Firestore user fetch fallback:', e);
    }
  }
  return null;
}

// -------------------------------------------------------------
// PORTFOLIO PROJECTS (معرض أعمالنا)
// -------------------------------------------------------------
export function subscribePortfolioProjects(callback: (projects: PortfolioProject[]) => void): () => void {
  const localPortfolio = getLocal<PortfolioProject[]>(LOCAL_STORAGE_KEYS.PORTFOLIO, INITIAL_PORTFOLIO_PROJECTS);
  callback(localPortfolio);

  if (!db) return () => {};

  try {
    const pRef = collection(db, 'portfolio_projects');
    const unsubscribe = onSnapshot(pRef, (snapshot) => {
      if (!snapshot.empty) {
        const firestorePortfolio: PortfolioProject[] = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        } as PortfolioProject));
        setLocal(LOCAL_STORAGE_KEYS.PORTFOLIO, firestorePortfolio);
        callback(firestorePortfolio);
      } else {
        callback(getLocal<PortfolioProject[]>(LOCAL_STORAGE_KEYS.PORTFOLIO, []));
      }
    }, (err) => {
      console.warn('Firestore portfolio listener fallback:', err);
    });
    return unsubscribe;
  } catch (e) {
    console.warn('Firestore portfolio error:', e);
    return () => {};
  }
}

export async function addPortfolioProject(item: Omit<PortfolioProject, 'id' | 'createdAt'>): Promise<PortfolioProject> {
  const current = getLocal<PortfolioProject[]>(LOCAL_STORAGE_KEYS.PORTFOLIO, []);
  const newId = `port_${Date.now()}`;
  const now = new Date().toISOString();

  const newProject: PortfolioProject = {
    ...item,
    id: newId,
    createdAt: now,
    updatedAt: now
  };

  const updated = [newProject, ...current];
  setLocal(LOCAL_STORAGE_KEYS.PORTFOLIO, updated);

  if (db) {
    try {
      await setDoc(doc(db, 'portfolio_projects', newId), newProject);
    } catch (e) {
      console.warn('Firestore portfolio create fallback:', e);
    }
  }

  return newProject;
}

export async function updatePortfolioProject(id: string, updates: Partial<PortfolioProject>): Promise<void> {
  const current = getLocal<PortfolioProject[]>(LOCAL_STORAGE_KEYS.PORTFOLIO, []);
  const index = current.findIndex(p => p.id === id);
  const now = new Date().toISOString();

  if (index !== -1) {
    current[index] = { ...current[index], ...updates, updatedAt: now };
    setLocal(LOCAL_STORAGE_KEYS.PORTFOLIO, current);
  }

  if (db) {
    try {
      await updateDoc(doc(db, 'portfolio_projects', id), { ...updates, updatedAt: now });
    } catch (e) {
      console.warn('Firestore portfolio update fallback:', e);
    }
  }
}

export async function deletePortfolioProject(id: string): Promise<void> {
  const current = getLocal<PortfolioProject[]>(LOCAL_STORAGE_KEYS.PORTFOLIO, []);
  const filtered = current.filter(p => p.id !== id);
  setLocal(LOCAL_STORAGE_KEYS.PORTFOLIO, filtered);

  if (db) {
    try {
      await deleteDoc(doc(db, 'portfolio_projects', id));
    } catch (e) {
      console.warn('Firestore portfolio delete fallback:', e);
    }
  }
}

// -------------------------------------------------------------
// QUOTE REQUESTS (طلبات البرمجة)
// -------------------------------------------------------------
export function subscribeQuotes(callback: (quotes: QuoteRequest[]) => void): () => void {
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
        setLocal(LOCAL_STORAGE_KEYS.QUOTES, firestoreQuotes);
        callback(firestoreQuotes);
      } else {
        callback(getLocal<QuoteRequest[]>(LOCAL_STORAGE_KEYS.QUOTES, []));
      }
    }, (err) => {
      console.warn('Firestore quotes listener fallback:', err);
    });
    return unsubscribe;
  } catch (e) {
    console.warn('Firestore quotes error:', e);
    return () => {};
  }
}

export async function createQuoteRequest(quote: Omit<QuoteRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<QuoteRequest> {
  const currentQuotes = getLocal<QuoteRequest[]>(LOCAL_STORAGE_KEYS.QUOTES, INITIAL_QUOTES);
  const newId = 'quote-' + Date.now();
  const now = new Date().toISOString();
  const cleanPhone = convertArabicToEnglishDigits(quote.userPhone);
  const orderCode = `OD-${currentQuotes.length + 1}`;

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
  status: 'pending' | 'accepted' | 'rejected' | 'in_progress' | 'completed', 
  staffNotes?: string, 
  agreedPrice?: number,
  contactMethod?: 'whatsapp' | 'email' | 'phone',
  assignedStaffId?: string,
  assignedStaffName?: string,
  rejectionReason?: string
): Promise<void> {
  const currentQuotes = getLocal<QuoteRequest[]>(LOCAL_STORAGE_KEYS.QUOTES, INITIAL_QUOTES);
  const quoteIndex = currentQuotes.findIndex(q => q.id === quoteId);
  const now = new Date().toISOString();

  let targetQuote: QuoteRequest | null = null;

  if (quoteIndex !== -1) {
    currentQuotes[quoteIndex] = {
      ...currentQuotes[quoteIndex],
      status: (status as any),
      staffNotes: staffNotes !== undefined ? staffNotes : currentQuotes[quoteIndex].staffNotes,
      agreedPrice: agreedPrice !== undefined ? agreedPrice : currentQuotes[quoteIndex].agreedPrice,
      contactMethod: contactMethod || currentQuotes[quoteIndex].contactMethod,
      assignedStaffId: assignedStaffId !== undefined ? assignedStaffId : currentQuotes[quoteIndex].assignedStaffId,
      assignedStaffName: assignedStaffName !== undefined ? assignedStaffName : currentQuotes[quoteIndex].assignedStaffName,
      rejectionReason: rejectionReason !== undefined ? rejectionReason : currentQuotes[quoteIndex].rejectionReason,
      updatedAt: now
    };
    targetQuote = currentQuotes[quoteIndex];
    setLocal(LOCAL_STORAGE_KEYS.QUOTES, currentQuotes);
  }

  if (db) {
    try {
      const updateData: any = {
        status,
        updatedAt: now
      };
      if (staffNotes !== undefined) updateData.staffNotes = staffNotes;
      if (agreedPrice !== undefined) updateData.agreedPrice = agreedPrice;
      if (contactMethod !== undefined) updateData.contactMethod = contactMethod;
      if (assignedStaffId !== undefined) updateData.assignedStaffId = assignedStaffId;
      if (assignedStaffName !== undefined) updateData.assignedStaffName = assignedStaffName;
      if (rejectionReason !== undefined) updateData.rejectionReason = rejectionReason;

      await updateDoc(doc(db, 'quotes', quoteId), updateData);
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
// STAFF & TEAM MANAGEMENT (فريق العمل)
// -------------------------------------------------------------
export function subscribeStaff(callback: (staff: StaffMember[]) => void): () => void {
  const localStaff = getLocal<StaffMember[]>(LOCAL_STORAGE_KEYS.STAFF, INITIAL_STAFF);
  callback(localStaff);

  if (!db) return () => {};

  try {
    const sRef = collection(db, 'staff');
    const unsubscribe = onSnapshot(sRef, (snapshot) => {
      if (!snapshot.empty) {
        const firestoreStaff: StaffMember[] = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        } as StaffMember));
        setLocal(LOCAL_STORAGE_KEYS.STAFF, firestoreStaff);
        callback(firestoreStaff);
      } else {
        callback(getLocal<StaffMember[]>(LOCAL_STORAGE_KEYS.STAFF, []));
      }
    }, (err) => {
      console.warn('Firestore staff listener fallback:', err);
    });
    return unsubscribe;
  } catch (e) {
    console.warn('Firestore subscribe staff error:', e);
    return () => {};
  }
}

export async function addStaffMember(staff: Omit<StaffMember, 'id' | 'createdAt'>): Promise<StaffMember> {
  const currentStaff = getLocal<StaffMember[]>(LOCAL_STORAGE_KEYS.STAFF, INITIAL_STAFF);
  const newId = `stf_${Date.now()}`;
  const newStaffMember: StaffMember = {
    ...staff,
    id: newId,
    createdAt: new Date().toISOString()
  };

  const updatedStaff = [newStaffMember, ...currentStaff];
  setLocal(LOCAL_STORAGE_KEYS.STAFF, updatedStaff);

  // If assigned to a registered user, grant staff role
  if (staff.userId) {
    await updateUserRole(staff.userId, 'staff');
  }

  if (db) {
    try {
      await setDoc(doc(db, 'staff', newId), newStaffMember);
    } catch (e) {
      console.warn('Firestore add staff fallback:', e);
    }
  }

  return newStaffMember;
}

export async function deleteStaffMember(id: string): Promise<void> {
  const currentStaff = getLocal<StaffMember[]>(LOCAL_STORAGE_KEYS.STAFF, INITIAL_STAFF);
  const target = currentStaff.find(s => s.id === id);
  const filtered = currentStaff.filter(s => s.id !== id);
  setLocal(LOCAL_STORAGE_KEYS.STAFF, filtered);

  if (target?.userId) {
    await updateUserRole(target.userId, 'client');
  }

  if (db) {
    try {
      await deleteDoc(doc(db, 'staff', id));
    } catch (e) {
      console.warn('Firestore delete staff fallback:', e);
    }
  }
}

// -------------------------------------------------------------
// PROJECTS & PROGRESS (المشاريع وإنجازها)
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
      } else {
        callback(getLocal<Project[]>(LOCAL_STORAGE_KEYS.PROJECTS, []));
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
        description: 'تحليل المتطلبات وتصميم الواجهات التفاعلية وتأكيد الشاشات.',
        status: 'in_progress'
      },
      {
        id: 's2',
        title: 'تطوير البرمجيات وقواعد البيانات',
        description: 'بناء الأكواد وربط الخدمات وقواعد البيانات.',
        status: 'pending'
      },
      {
        id: 's3',
        title: 'الاختبار الشامل والتأكد من الجودة (QA)',
        description: 'اختبار الأداء والتوافق على مختلف الأجهزة.',
        status: 'pending'
      },
      {
        id: 's4',
        title: 'تسليم المشروع والاعتماد النهائي',
        description: 'قبول سياسة الضمان وتسليم الكود والرابط النهائي.',
        status: 'pending'
      }
    ],
    warrantyAgreed: false,
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
// PAYMENTS & INVOICES (المدفوعات والدفعات)
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
      } else {
        callback(getLocal<PaymentReceipt[]>(LOCAL_STORAGE_KEYS.PAYMENTS, []));
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

/**
 * Admin creates a payment due / invoice for a client
 */
export async function createPaymentInvoice(invoice: {
  projectId: string;
  projectTitle: string;
  userId: string;
  userName: string;
  userEmail?: string;
  amount: number;
  note?: string;
}): Promise<PaymentReceipt> {
  const newId = 'pay-' + Date.now();
  const now = new Date().toISOString();

  const newPayment: PaymentReceipt = {
    id: newId,
    projectId: invoice.projectId,
    projectTitle: invoice.projectTitle,
    userId: invoice.userId,
    userName: invoice.userName,
    userEmail: invoice.userEmail || '',
    amount: invoice.amount,
    bankName: 'مصرف الراجحي',
    senderName: '',
    referenceNumber: '',
    transferDate: now.split('T')[0],
    receiptNote: invoice.note || 'دفعة مستحقة للمشروع البرمجي',
    status: 'due',
    createdAt: now,
    updatedAt: now
  };

  const currentPayments = getLocal<PaymentReceipt[]>(LOCAL_STORAGE_KEYS.PAYMENTS, []);
  const updated = [newPayment, ...currentPayments];
  setLocal(LOCAL_STORAGE_KEYS.PAYMENTS, updated);

  if (db) {
    try {
      await setDoc(doc(db, 'payments', newId), newPayment);
    } catch (e) {
      console.warn('Firestore payment invoice create error:', e);
    }
  }

  return newPayment;
}

/**
 * Client attaches transfer receipt and submits for review
 */
export async function submitPaymentReceipt(
  paymentId: string, 
  receiptData: {
    senderName: string;
    referenceNumber: string;
    transferDate: string;
    bankName?: string;
    receiptImage?: string;
    receiptNote?: string;
  }
): Promise<void> {
  const currentPayments = getLocal<PaymentReceipt[]>(LOCAL_STORAGE_KEYS.PAYMENTS, []);
  const pIndex = currentPayments.findIndex(p => p.id === paymentId);
  const now = new Date().toISOString();

  if (pIndex !== -1) {
    currentPayments[pIndex] = {
      ...currentPayments[pIndex],
      ...receiptData,
      bankName: receiptData.bankName || currentPayments[pIndex].bankName || 'مصرف الراجحي',
      status: 'pending',
      updatedAt: now
    };
    setLocal(LOCAL_STORAGE_KEYS.PAYMENTS, currentPayments);
  }

  if (db) {
    try {
      await updateDoc(doc(db, 'payments', paymentId), {
        ...receiptData,
        status: 'pending',
        updatedAt: now
      });
    } catch (e) {
      console.warn('Firestore payment receipt submit error:', e);
    }
  }
}

/**
 * Admin approves (✓) or rejects (✕) the payment receipt
 */
export async function approveOrRejectPayment(
  paymentId: string, 
  status: 'approved' | 'rejected', 
  supervisorNotes?: string
): Promise<void> {
  const payments = getLocal<PaymentReceipt[]>(LOCAL_STORAGE_KEYS.PAYMENTS, []);
  const pIndex = payments.findIndex(p => p.id === paymentId);
  const now = new Date().toISOString();

  if (pIndex !== -1) {
    payments[pIndex].status = status;
    payments[pIndex].supervisorNotes = supervisorNotes || payments[pIndex].supervisorNotes;
    payments[pIndex].updatedAt = now;
    setLocal(LOCAL_STORAGE_KEYS.PAYMENTS, payments);

    if (status === 'approved') {
      const projects = getLocal<Project[]>(LOCAL_STORAGE_KEYS.PROJECTS, []);
      const projIdx = projects.findIndex(p => p.id === payments[pIndex].projectId);
      if (projIdx !== -1) {
        projects[projIdx].paidAmount = (projects[projIdx].paidAmount || 0) + payments[pIndex].amount;
        projects[projIdx].paymentStatus = 'paid';
        projects[projIdx].updatedAt = now;
        setLocal(LOCAL_STORAGE_KEYS.PROJECTS, projects);
      }
    }
  }

  if (db) {
    try {
      await updateDoc(doc(db, 'payments', paymentId), {
        status,
        supervisorNotes,
        updatedAt: now
      });
      if (status === 'approved' && pIndex !== -1) {
        await updateDoc(doc(db, 'projects', payments[pIndex].projectId), {
          paymentStatus: 'paid',
          updatedAt: now
        });
      }
    } catch (e) {
      console.warn('Firestore payment status update error:', e);
    }
  }
}

// Aliases
export const submitQuoteRequest = createQuoteRequest;
export const acceptProjectWarranty = signProjectWarranty;
