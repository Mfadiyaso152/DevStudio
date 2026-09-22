import { BankAccountInfo, Project, QuoteRequest, PaymentReceipt } from '../types';

export const BANK_ACCOUNTS: BankAccountInfo[] = [
  {
    bankName: 'مصرف الراجحي',
    accountName: 'DevStudio - استوديو البرمجة المستقلة',
    accountNumber: '482000010006080012345',
    iban: 'SA8280000482000010006080',
    swiftCode: 'RJBKSA22XXX'
  }
];

export const PORTFOLIO_PROJECTS = [
  {
    id: '1',
    title: 'تطبيق "مدى" لإدارة المشاريع اللوجستية',
    category: 'تطبيق جوال (iOS & Android)',
    description: 'تطبيق هاتف عالي الأداء مع تتبع زمني مباشر للجغرافي وتعيين المهام والإشعارات اللحظية.',
    tags: ['Flutter', 'Firebase', 'Google Maps API', 'Node.js'],
    image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=80',
    clientType: 'شركة لوجستيات بالمملكة',
    deliveryDays: 45,
    rating: 4.9
  },
  {
    id: '2',
    title: 'منصة "سوق بلص" للتجارة الإلكترونية',
    category: 'موقع إلكتروني وتطبيق متكامل',
    description: 'متجر سحابي متطور يدعم بوابة الدفع السريع والتحويل البنكي والتكامل مع شركات الشحن.',
    tags: ['React', 'TypeScript', 'Tailwind CSS', 'Payment Gateway'],
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
    clientType: 'مؤسسة تجارية',
    deliveryDays: 30,
    rating: 5.0
  },
  {
    id: '3',
    title: 'نظام "أداء" للتحليل والذكاء الاصطناعي',
    category: 'نظام مخصص ولوحة تحكم',
    description: 'لوحة تحكم إدارية ذكية لتحليل المبيعات وتوليد التقارير التلقائية مع محرك تنبؤات.',
    tags: ['Next.js', 'Python API', 'PostgreSQL', 'Chart.js'],
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
    clientType: 'مؤسسة استشارية',
    deliveryDays: 60,
    rating: 4.8
  }
];

export const INITIAL_QUOTES: QuoteRequest[] = [];

export const INITIAL_PROJECTS: Project[] = [];

export const MOCK_PROJECTS = INITIAL_PROJECTS;

export const INITIAL_PAYMENTS: PaymentReceipt[] = [];
