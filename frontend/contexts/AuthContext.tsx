import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'farmer' | 'admin';
  location?: string;
  phone?: string;
  farmerType?: string;
  farmSize?: string;
  gender?: string;
  dob?: string;
  language?: string;
  profilePic?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role?: 'farmer' | 'admin') => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  updateProfile: (profileData: Partial<User> & { profilePic?: string | File }) => Promise<void>;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  location: string;
  phone: string;
  farmerType: string;
  farmSize: string;
  gender: string;
  dob: string;
  language?: string;
  profilePic?: File | null;
  termsAgreed?: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  // Update profile logic
  const updateProfile = async (profileData: Partial<User> & { profilePic?: string | File }) => {
    // Simulate profile picture upload and update user fields
    let profilePicUrl = user?.profilePic || '';
    if (profileData.profilePic && typeof profileData.profilePic !== 'string') {
      // Simulate upload and get URL (in real app, upload to server or storage)
      profilePicUrl = URL.createObjectURL(profileData.profilePic);
    } else if (typeof profileData.profilePic === 'string') {
      profilePicUrl = profileData.profilePic;
    }
    setUser((prev) => prev ? {
      ...prev,
      ...profileData,
      profilePic: profilePicUrl
    } : null);
  };
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
  const storedAdmin = sessionStorage.getItem('krishisathi_admin');
  const storedAdminToken = sessionStorage.getItem('krishisathi_admin_token');
  const storedUser = localStorage.getItem('krishisathi_user');
  const storedToken = localStorage.getItem('krishisathi_token');

    if (storedAdmin && storedAdminToken) {
      setUser({
        ...JSON.parse(storedAdmin),
        role: 'admin',
      });
    } else if (storedUser && storedToken) {
      setUser({
        ...JSON.parse(storedUser),
        role: 'farmer',
      });
    } else {
      setUser(null); // Clear user state if no valid session exists
    }

    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, role: 'farmer' | 'admin' = 'farmer'): Promise<boolean> => {
    setIsLoading(true);
    try {
      let url = '/api/auth/login';
      if (role === 'admin') url = '/api/admin/login';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        setIsLoading(false);
        return false;
      }
      const data = await res.json();
      if (role === 'admin' && data.token && data.admin) {
  sessionStorage.setItem('krishisathi_admin', JSON.stringify(data.admin));
  sessionStorage.setItem('krishisathi_admin_token', data.token);
        setUser({
          id: data.admin.id,
          name: data.admin.name,
          email: data.admin.email,
          role: 'admin',
          phone: data.admin.phone,
          profilePic: data.admin.avatar,
        });
      } else if (role === 'farmer' && data.token && data.farmer) {
  localStorage.setItem('krishisathi_user', JSON.stringify(data.farmer));
  localStorage.setItem('krishisathi_token', data.token);
        localStorage.setItem('token', data.token); // Also save as 'token' for compatibility
        localStorage.setItem('farmerId', data.farmer.id); // Save farmerId separately
        setUser({
          id: data.farmer.id,
          name: data.farmer.name,
          email: data.farmer.email,
          role: 'farmer',
          location: data.farmer.location,
          phone: data.farmer.phone,
          farmerType: data.farmer.farmerType,
          farmSize: data.farmer.farmSize,
          gender: data.farmer.gender,
          dob: data.farmer.dob,
        });
      }
      setIsLoading(false);
      return true;
    } catch (err) {
      setIsLoading(false);
      return false;
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', userData.name);
      formData.append('email', userData.email);
      formData.append('password', userData.password);
      formData.append('location', userData.location);
      formData.append('phone', userData.phone);
      formData.append('farmerType', userData.farmerType);
      formData.append('farmSize', userData.farmSize);
      formData.append('gender', userData.gender);
      formData.append('dob', userData.dob);
      if (userData.profilePic) {
        formData.append('profilePic', userData.profilePic);
      }
      formData.append('termsAgreed', String(userData.termsAgreed ?? false));
      // You can add language if needed
      if (userData.language) {
        formData.append('language', userData.language);
      }
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        body: formData
      });
      setIsLoading(false);
      if (res.ok) return true;
      return false;
    } catch (err) {
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
  localStorage.removeItem('krishisathi_user');
  localStorage.removeItem('krishisathi_token');
    localStorage.removeItem('token'); // Remove compatibility token
    localStorage.removeItem('farmerId'); // Remove farmerId
  sessionStorage.removeItem('krishisathi_admin');
  sessionStorage.removeItem('krishisathi_admin_token');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};