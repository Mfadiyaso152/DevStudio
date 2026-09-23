import { BankAccountInfo, Project, QuoteRequest, PaymentReceipt, StaffMember, PortfolioProject } from '../types';

export const BANK_ACCOUNTS: BankAccountInfo[] = [
  {
    bankName: 'مصرف الراجحي',
    accountName: 'DevStudio - استوديو البرمجة المستقلة',
    accountNumber: '482000010006080012345',
    iban: 'SA8280000482000010006080',
    swiftCode: 'RJBKSA22XXX'
  }
];

export const INITIAL_PORTFOLIO_PROJECTS: PortfolioProject[] = [];

export const PORTFOLIO_PROJECTS: PortfolioProject[] = [];

export const INITIAL_QUOTES: QuoteRequest[] = [];

export const INITIAL_PROJECTS: Project[] = [];

export const MOCK_PROJECTS: Project[] = [];

export const INITIAL_PAYMENTS: PaymentReceipt[] = [];

export const INITIAL_STAFF: StaffMember[] = [];
