export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
  user_id: string;
  created_at: string;
}

export interface AppBox {
  id: string;
  name: string;
  logo: string;
  url: string;
  createdBy: string;
  createdAt: string;
  category_id?: string;
  category?: Category;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<any>;
  logout: () => void;
  isAuthenticated: boolean;
}
