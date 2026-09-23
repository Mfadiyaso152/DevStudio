export type EntityType = 'individual' | 'company';
export type AccountType = EntityType;

export type UserRole = 'client' | 'staff' | 'admin';

export interface UserProfile {
  uid: string;
  clientCode?: string; // DS-1, DS-2, etc.
  email: string;
  fullName: string;
  phone: string;
  dob: string;
  entityType: EntityType;
  accountType?: AccountType;
  companyName?: string;
  vatNumber?: string;
  role: UserRole;
  createdAt: string;
  updatedAt?: string;
}

export type ServiceType = 'app' | 'website' | 'system';
export type ProjectType = ServiceType;

export type QuoteStatus = 
  | 'pending'          // بانتظار مراجعة الإدارة
  | 'accepted'         // تم القبول - بانتظار التواصل وتحديد السعر
  | 'rejected'         // تم الرفض
  | 'agreed'           // تم الاتفاق على السعر - بانتظار الدفع
  | 'in_progress'      // جارٍ العمل وتحديث الإنجاز
  | 'warranty_pending' // اكتمل العمل - بانتظار الموافقة على سياسة الضمان
  | 'completed';       // تم الموافقة والتسليم النهائي

export interface StaffMember {
  id: string;
  userId?: string; // Links to registered UserProfile uid
  fullName: string;
  email: string;
  phone: string;
  role: 'developer' | 'designer' | 'project_manager' | 'qa' | 'support' | 'admin';
  roleLabel: string;
  department: string;
  status: 'active' | 'inactive';
  assignedProjectsCount: number;
  avatarUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface QuoteRequest {
  id: string;
  orderCode?: string; // OD-1, OD-2, etc.
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  userEntityType: EntityType;
  accountType?: AccountType;
  companyName?: string;
  serviceType: ServiceType;
  serviceTypeLabel: string;
  platforms: string[];
  title: string;
  details: string;
  expectedBudget: string;
  expectedTimeframe: string;
  status: 'pending' | 'accepted' | 'rejected' | 'in_progress' | 'completed';
  rejectionReason?: string;
  staffNotes?: string;
  agreedPrice?: number;
  assignedStaffId?: string;
  assignedStaffName?: string;
  contactMethod?: 'whatsapp' | 'email' | 'phone';
  createdAt: string;
  updatedAt: string;
}

export interface ProjectStep {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'in_progress' | 'pending';
  completedAt?: string;
}

export interface Deliverables {
  repositoryUrl?: string;
  appDownloadUrl?: string;
  webDomainUrl?: string;
  documentationUrl?: string;
  notes?: string;
}

export interface Project {
  id: string;
  quoteId: string;
  userId: string;
  userName: string;
  userPhone: string;
  title: string;
  serviceType: ServiceType;
  agreedPrice: number;
  paidAmount: number;
  paymentStatus: 'unpaid' | 'receipt_submitted' | 'paid';
  progressPercentage: number;
  currentStepIndex: number;
  steps: ProjectStep[];
  warrantyAgreed: boolean;
  warrantyAgreedAt?: string;
  deliverables?: Deliverables;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentReceipt {
  id: string;
  projectId: string;
  projectTitle: string;
  userId: string;
  userName: string;
  userEmail?: string;
  amount: number;
  bankName: string;
  senderName: string;
  referenceNumber: string;
  transferDate: string;
  receiptNote?: string;
  receiptImage?: string; // base64 or URL
  status: 'pending' | 'approved' | 'rejected' | 'due'; // 'due' = admin added payment, client needs to pay; 'pending' = receipt submitted
  supervisorNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PortfolioProject {
  id: string;
  title: string;
  linkUrl: string;
  imageUrl: string;
  description?: string;
  category?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface BankAccountInfo {
  bankName: string;
  accountName: string;
  accountNumber: string;
  iban: string;
  swiftCode: string;
  logoUrl?: string;
}
