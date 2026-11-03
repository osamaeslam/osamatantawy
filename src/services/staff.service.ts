export interface StaffUser {
  id: string;
  fullName: string;
  username: string;
  password: string;
  role: 'admin' | 'sales_rep' | 'delivery_rep';
  phone?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  notes?: string;
}

const STORAGE_KEY = 'tantawy_staff_users';

export const INITIAL_STAFF_USERS: StaffUser[] = [
  {
    id: 'staff-admin-1',
    fullName: 'المدير العام - طنطاوي جروب',
    username: 'saja',
    password: 'osama442',
    role: 'admin',
    phone: '15218',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    notes: 'حساب المدير العام الرئيسي'
  },
  {
    id: 'staff-admin-2',
    fullName: 'مسؤول النظام (Admin)',
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    phone: '15218',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    notes: 'حساب مدير النظام البديل'
  },
  {
    id: 'staff-emp-1',
    fullName: 'ك/ كريم حسني (موظف مبيعات وخدمة عملاء)',
    username: 'sales1',
    password: '123456',
    role: 'sales_rep',
    phone: '01012345678',
    isActive: true,
    createdAt: '2026-02-01T00:00:00.000Z',
    notes: 'مسؤول متابعة فواتير واتساب وتسعير الأجهزة للعملاء'
  },
  {
    id: 'staff-emp-2',
    fullName: 'ك/ محمد طارق (مسؤول فواتير وشحن)',
    username: 'shipping1',
    password: '123456',
    role: 'delivery_rep',
    phone: '01123456789',
    isActive: true,
    createdAt: '2026-02-15T00:00:00.000Z',
    notes: 'مسؤول تأكيد العناوين ومواعيد خروج الشحنات'
  }
];

export const staffService = {
  getAll(): StaffUser[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading staff users:', e);
    }
    // Initialize defaults
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_STAFF_USERS));
    } catch (e) {}
    return INITIAL_STAFF_USERS;
  },

  save(user: Omit<StaffUser, 'id' | 'createdAt'> & { id?: string }): StaffUser {
    const users = this.getAll();
    const existingIndex = user.id ? users.findIndex((u) => u.id === user.id) : -1;

    let savedUser: StaffUser;

    if (existingIndex > -1) {
      savedUser = {
        ...users[existingIndex],
        ...user,
        id: users[existingIndex].id,
      };
      users[existingIndex] = savedUser;
    } else {
      savedUser = {
        ...user,
        id: `staff-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        createdAt: new Date().toISOString(),
      };
      users.push(savedUser);
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    } catch (e) {
      console.error('Error saving staff user:', e);
    }

    return savedUser;
  },

  toggleActive(id: string): boolean {
    const users = this.getAll();
    const u = users.find((x) => x.id === id);
    if (!u) return false;
    u.isActive = !u.isActive;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    } catch (e) {}
    return u.isActive;
  },

  delete(id: string): boolean {
    const users = this.getAll().filter((x) => x.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    } catch (e) {}
    return true;
  },

  login(username: string, password: string): StaffUser | null {
    const users = this.getAll();
    const u = users.find(
      (x) =>
        x.username.trim().toLowerCase() === username.trim().toLowerCase() &&
        x.password === password
    );

    if (!u) return null;
    if (!u.isActive) {
      throw new Error('تم تعطيل هذا الحساب من قِبل إدارة طنطاوي جروب. برجاء مراجعة المدير العام.');
    }

    u.lastLogin = new Date().toISOString();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
      localStorage.setItem('tantawy_current_staff', JSON.stringify(u));
    } catch (e) {}

    return u;
  },

  getCurrentUser(): StaffUser | null {
    try {
      const saved = localStorage.getItem('tantawy_current_staff');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  },

  logout(): void {
    try {
      localStorage.removeItem('tantawy_current_staff');
    } catch (e) {}
  }
};
