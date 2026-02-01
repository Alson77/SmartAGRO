import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf, Eye, EyeOff, Loader2, User, Mail, Phone, MapPin, Tractor, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    location: '',
    phone: '',
    farmerType: '',
    farmSize: '',
    farmSizeValue: '',
    farmSizeUnit: 'Kattha',
    gender: '',
    dob: '',
    agree: false,
    profilePic: null as File | null
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [passwordMatch, setPasswordMatch] = useState<boolean | null>(null);
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  
  // Field-specific errors
  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    location: '',
    phone: '',
    farmerType: '',
    farmSize: '',
    gender: '',
    dob: ''
  });
  
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
    location: false,
    phone: false,
    farmerType: false,
    farmSize: false,
    gender: false,
    dob: false
  });

  const { register } = useAuth();
  const navigate = useNavigate();

  // Debounced email availability check
  useEffect(() => {
    if (formData.email && touched.email && validateEmail(formData.email)) {
      const timeoutId = setTimeout(() => {
        checkEmailAvailability(formData.email);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setEmailExists(null);
    }
  }, [formData.email, touched.email]);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone: string) => /^[9][0-9]{9}$/.test(phone);
  
  // Check email availability with debouncing
  const checkEmailAvailability = async (email: string) => {
    if (!validateEmail(email)) {
      setEmailExists(null);
      return;
    }
    
    setEmailChecking(true);
    try {
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      setEmailExists(data.exists);
      
      if (data.exists && touched.email) {
        setFieldErrors(prev => ({ ...prev, email: 'Email already registered' }));
      }
    } catch (error) {
      console.error('Error checking email:', error);
    } finally {
      setEmailChecking(false);
    }
  };
  
  // Validate individual field
  const validateField = (name: string, value: string) => {
    switch (name) {
      case 'name':
        return value.trim() ? '' : 'Name is required';
      case 'email':
        if (!value.trim()) return 'Email is required';
        return validateEmail(value) ? '' : 'Please enter a valid email address';
      case 'password':
        if (!value.trim()) return 'Password is required';
        return value.length >= 6 ? '' : 'Password must be at least 6 characters';
      case 'confirmPassword':
        if (!value.trim()) return 'Please confirm your password';
        return value === formData.password ? '' : 'Passwords do not match';
      case 'location':
        return value.trim() ? '' : 'Location is required';
      case 'phone':
        if (!value.trim()) return 'Phone number is required';
        return validatePhone(value) ? '' : 'Phone must be 10 digits starting with 9';
      case 'farmerType':
        return value ? '' : 'Farmer type is required';
      case 'farmSize':
        return value.trim() ? '' : 'Farm size is required';
      case 'gender':
        return value ? '' : 'Gender is required';
      case 'dob':
        return value ? '' : 'Date of birth is required';
      default:
        return '';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked });
    } else if (type === 'file') {
      setFormData({ ...formData, [name]: (e.target as HTMLInputElement).files?.[0] || null });
    } else {
      const newFormData = { ...formData, [name]: value };
      setFormData(newFormData);
      
      // Real-time validation for phone number, password, and email
      if ((name === 'phone' || name === 'password' || name === 'email') && touched[name as keyof typeof touched]) {
        const errorMsg = validateField(name, value);
        setFieldErrors(prev => ({ ...prev, [name]: errorMsg }));
      }
      
      // Real-time password matching validation
      if (name === 'password' || name === 'confirmPassword') {
        const pwd = name === 'password' ? value : formData.password;
        const confirmPwd = name === 'confirmPassword' ? value : formData.confirmPassword;
        
        if (confirmPwd.length > 0) {
          setPasswordMatch(pwd === confirmPwd);
          if (touched.confirmPassword) {
            setFieldErrors(prev => ({ 
              ...prev, 
              confirmPassword: pwd === confirmPwd ? '' : 'Passwords do not match' 
            }));
          }
        } else {
          setPasswordMatch(null);
        }
      }
    }
  };
  
  // Handle field blur - validate phone, password, email, and confirmPassword on blur
  const handleBlur = (name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    
    // Real-time validation for phone, password, email, and confirmPassword
    if (name === 'phone' || name === 'password' || name === 'email' || name === 'confirmPassword') {
      const value = formData[name as keyof typeof formData];
      const errorMsg = validateField(name, String(value));
      setFieldErrors(prev => ({ ...prev, [name]: errorMsg }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Mark all fields as touched
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
      location: true,
      phone: true,
      farmerType: true,
      farmSize: true,
      gender: true,
      dob: true
    });

    // Validate all fields
    const errors = {
      name: validateField('name', formData.name),
      email: validateField('email', formData.email),
      password: validateField('password', formData.password),
      confirmPassword: validateField('confirmPassword', formData.confirmPassword),
      location: validateField('location', formData.location),
      phone: validateField('phone', formData.phone),
      farmerType: validateField('farmerType', formData.farmerType),
      farmSize: validateField('farmSize', formData.farmSize),
      gender: validateField('gender', formData.gender),
      dob: validateField('dob', formData.dob)
    };
    
    setFieldErrors(errors);
    
    // Check if any errors exist
    const hasErrors = Object.values(errors).some(err => err !== '');
    if (hasErrors) {
      setError('Please fix all errors before submitting');
      return;
    }
    
    // Check if email already exists
    if (emailExists) {
      setError('Email already registered. Please use a different email.');
      return;
    }
    
    if (!formData.agree) {
      setError('You must agree to the terms and conditions');
      return;
    }

    setIsLoading(true);
    const success = await register({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      location: formData.location,
      phone: formData.phone,
      farmerType: formData.farmerType,
      farmSize: formData.farmSize,
      gender: formData.gender,
      dob: formData.dob,
      language: 'en',
      profilePic: formData.profilePic,
      termsAgreed: formData.agree
    });
    setIsLoading(false);

    if (success) {
      setShowSuccess(true);
      setTimeout(() => {
        navigate('/login', { state: { message: 'Registration successful! Please log in.' } });
      }, 2000);
    } else {
      setError('Email already exists. Please use a different email.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-green-500 to-green-600 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl mx-auto">
        <div className="bg-white/80 dark:bg-zinc-900/70 backdrop-blur-lg rounded-2xl shadow-2xl border border-green-200 dark:border-green-700 p-10">
          
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="bg-gradient-to-tr from-green-200 to-green-400 p-4 rounded-full shadow-lg mb-3">
              <Leaf className="h-10 w-10 text-green-700 dark:text-green-100" />
            </div>
            <h2 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">Create Your Account</h2>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-300 text-center">Join Krishi Sathi and empower your farming journey</p>
          </div>

          <form className="space-y-8" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-300 px-4 py-3 rounded-lg text-sm text-center animate-fade-in">
                {error}
              </div>
            )}

            {/* Personal Info Section */}
            <div>
              <h3 className="text-lg font-semibold text-green-700 dark:text-green-300 mb-4 flex items-center gap-2">
                <span>Personal Information</span>
                <span className="text-green-400">•</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      onBlur={() => handleBlur('name')}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 transition bg-white/80 dark:bg-zinc-800/80 ${
                        fieldErrors.name && touched.name
                          ? 'border-red-500 focus:ring-red-400 focus:border-red-400'
                          : 'border-green-200 dark:border-green-700 focus:ring-green-400 focus:border-green-400'
                      }`}
                      placeholder="Enter your full name"
                    />
                  </div>
                  {fieldErrors.name && touched.name && (
                    <p className="mt-1 text-xs text-red-600 animate-fade-in">{fieldErrors.name}</p>
                  )}
                </div>

                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={() => handleBlur('email')}
                      className={`w-full pl-10 pr-10 py-2 border rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 transition bg-white/80 dark:bg-zinc-800/80 ${
                        fieldErrors.email && touched.email
                          ? 'border-red-500 focus:ring-red-400 focus:border-red-400'
                          : emailExists === false && touched.email
                            ? 'border-green-500 focus:ring-green-400 focus:border-green-400'
                            : 'border-green-200 dark:border-green-700 focus:ring-green-400 focus:border-green-400'
                      }`}
                      placeholder="Enter your email"
                    />
                    {emailChecking && touched.email && (
                      <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 animate-spin" />
                    )}
                  </div>
                  {fieldErrors.email && touched.email && (
                    <p className="mt-1 text-xs text-red-600 animate-fade-in">{fieldErrors.email}</p>
                  )}
                </div>

                {/* Date of Birth Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      name="dobDay"
                      value={formData.dob ? formData.dob.split('-')[2] : ''}
                      onChange={e => {
                        const parts = formData.dob ? formData.dob.split('-') : ['', '', ''];
                        const newDob = `${parts[0] || '2000'}-${parts[1] || '01'}-${e.target.value}`;
                        setFormData({ ...formData, dob: newDob });
                        if (touched.dob) {
                          setFieldErrors({ ...fieldErrors, dob: validateField('dob', newDob) });
                        }
                      }}
                      onBlur={() => handleBlur('dob')}
                      className={`w-1/3 px-2 py-2 border rounded-lg focus:outline-none focus:ring-2 transition bg-white/80 dark:bg-zinc-800/80 ${
                        fieldErrors.dob && touched.dob
                          ? 'border-red-500 focus:ring-red-400 focus:border-red-400'
                          : 'border-green-200 dark:border-green-700 focus:ring-green-400 focus:border-green-400'
                      }`}
                    >
                      <option value="">Day</option>
                      {[...Array(31)].map((_, i) => (
                        <option key={i+1} value={String(i+1).padStart(2, '0')}>{i+1}</option>
                      ))}
                    </select>
                    <select
                      name="dobMonth"
                      value={formData.dob ? formData.dob.split('-')[1] : ''}
                      onChange={e => {
                        const parts = formData.dob ? formData.dob.split('-') : ['', '', ''];
                        const newDob = `${parts[0] || '2000'}-${e.target.value}-${parts[2] || '01'}`;
                        setFormData({ ...formData, dob: newDob });
                        if (touched.dob) {
                          setFieldErrors({ ...fieldErrors, dob: validateField('dob', newDob) });
                        }
                      }}
                      onBlur={() => handleBlur('dob')}
                      className={`w-1/3 px-2 py-2 border rounded-lg focus:outline-none focus:ring-2 transition bg-white/80 dark:bg-zinc-800/80 ${
                        fieldErrors.dob && touched.dob
                          ? 'border-red-500 focus:ring-red-400 focus:border-red-400'
                          : 'border-green-200 dark:border-green-700 focus:ring-green-400 focus:border-green-400'
                      }`}
                    >
                      <option value="">Month</option>
                      {['01','02','03','04','05','06','07','08','09','10','11','12'].map((m, i) => (
                        <option key={m} value={m}>{new Date(0, i).toLocaleString('default', { month: 'short' })}</option>
                      ))}
                    </select>
                    <select
                      name="dobYear"
                      value={formData.dob ? formData.dob.split('-')[0] : ''}
                      onChange={e => {
                        const parts = formData.dob ? formData.dob.split('-') : ['', '', ''];
                        const newDob = `${e.target.value}-${parts[1] || '01'}-${parts[2] || '01'}`;
                        setFormData({ ...formData, dob: newDob });
                        if (touched.dob) {
                          setFieldErrors({ ...fieldErrors, dob: validateField('dob', newDob) });
                        }
                      }}
                      onBlur={() => handleBlur('dob')}
                      className={`w-1/3 px-2 py-2 border rounded-lg focus:outline-none focus:ring-2 transition bg-white/80 dark:bg-zinc-800/80 ${
                        fieldErrors.dob && touched.dob
                          ? 'border-red-500 focus:ring-red-400 focus:border-red-400'
                          : 'border-green-200 dark:border-green-700 focus:ring-green-400 focus:border-green-400'
                      }`}
                    >
                      <option value="">Year</option>
                      {Array.from({length: 100}, (_, i) => 2025 - i).map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                  {fieldErrors.dob && touched.dob && (
                    <p className="mt-1 text-xs text-red-600 animate-fade-in">{fieldErrors.dob}</p>
                  )}
                </div>

                {/* Gender Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    onBlur={() => handleBlur('gender')}
                    className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 transition bg-white/80 dark:bg-zinc-800/80 ${
                      fieldErrors.gender && touched.gender
                        ? 'border-red-500 focus:ring-red-400 focus:border-red-400'
                        : 'border-green-200 dark:border-green-700 focus:ring-green-400 focus:border-green-400'
                    }`}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {fieldErrors.gender && touched.gender && (
                    <p className="mt-1 text-xs text-red-600 animate-fade-in">{fieldErrors.gender}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Account Security Section */}
            <div>
              <h3 className="text-lg font-semibold text-green-700 dark:text-green-300 mb-4 flex items-center gap-2">
                <span>Account Security</span>
                <span className="text-green-400">•</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Password Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      onBlur={() => handleBlur('password')}
                      className={`w-full pl-10 pr-10 py-2 border rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 transition bg-white/80 dark:bg-zinc-800/80 ${
                        fieldErrors.password && touched.password
                          ? 'border-red-500 focus:ring-red-400 focus:border-red-400'
                          : 'border-green-200 dark:border-green-700 focus:ring-green-400 focus:border-green-400'
                      }`}
                      placeholder="Enter password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? 
                        <EyeOff className="h-5 w-5 text-gray-400 dark:text-gray-300" /> : 
                        <Eye className="h-5 w-5 text-gray-400 dark:text-gray-300" />
                      }
                    </button>
                  </div>
                  {fieldErrors.password && touched.password && (
                    <p className="mt-1 text-xs text-red-600 animate-fade-in">{fieldErrors.password}</p>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      onBlur={() => handleBlur('confirmPassword')}
                      className={`w-full pl-10 pr-10 py-2 border rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 transition bg-white/80 dark:bg-zinc-800/80 ${
                        fieldErrors.confirmPassword && touched.confirmPassword
                          ? 'border-red-500 focus:ring-red-400 focus:border-red-400'
                          : passwordMatch !== null
                            ? passwordMatch
                              ? 'border-green-500 focus:ring-green-400 focus:border-green-400'
                              : 'border-red-500 focus:ring-red-400 focus:border-red-400'
                            : 'border-green-200 dark:border-green-700 focus:ring-green-400 focus:border-green-400'
                      }`}
                      placeholder="Confirm password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? 
                        <EyeOff className="h-5 w-5 text-gray-400 dark:text-gray-300" /> : 
                        <Eye className="h-5 w-5 text-gray-400 dark:text-gray-300" />
                      }
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && touched.confirmPassword ? (
                    <p className="mt-1 text-xs text-red-600 animate-fade-in">{fieldErrors.confirmPassword}</p>
                  ) : passwordMatch !== null && (
                    <p className={`text-xs mt-1 ${passwordMatch ? 'text-green-600' : 'text-red-600'}`}>
                      {passwordMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Farm Details Section */}
            <div>
              <h3 className="text-lg font-semibold text-green-700 dark:text-green-300 mb-4 flex items-center gap-2">
                <span>Farm Details</span>
                <span className="text-green-400">•</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Location Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      onBlur={() => handleBlur('location')}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 transition bg-white/80 dark:bg-zinc-800/80 ${
                        fieldErrors.location && touched.location
                          ? 'border-red-500 focus:ring-red-400 focus:border-red-400'
                          : 'border-green-200 dark:border-green-700 focus:ring-green-400 focus:border-green-400'
                      }`}
                      placeholder="Enter your location"
                    />
                  </div>
                  {fieldErrors.location && touched.location && (
                    <p className="mt-1 text-xs text-red-600 animate-fade-in">{fieldErrors.location}</p>
                  )}
                </div>

                {/* Phone Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      onBlur={() => handleBlur('phone')}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 transition bg-white/80 dark:bg-zinc-800/80 ${
                        fieldErrors.phone && touched.phone
                          ? 'border-red-500 focus:ring-red-400 focus:border-red-400'
                          : 'border-green-200 dark:border-green-700 focus:ring-green-400 focus:border-green-400'
                      }`}
                      placeholder="98XXXXXXXX"
                    />
                  </div>
                  {fieldErrors.phone && touched.phone && (
                    <p className="mt-1 text-xs text-red-600 animate-fade-in">{fieldErrors.phone}</p>
                  )}
                </div>

                {/* Farmer Type Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type of Farmer <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Tractor className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <select
                      name="farmerType"
                      value={formData.farmerType}
                      onChange={handleChange}
                      onBlur={() => handleBlur('farmerType')}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 transition bg-white/80 dark:bg-zinc-800/80 ${
                        fieldErrors.farmerType && touched.farmerType
                          ? 'border-red-500 focus:ring-red-400 focus:border-red-400'
                          : 'border-green-200 dark:border-green-700 focus:ring-green-400 focus:border-green-400'
                      }`}
                    >
                      <option value="">Select type</option>
                      <option value="crop">Crop</option>
                      <option value="livestock">Livestock</option>
                      <option value="both">Both</option>
                    </select>
                  </div>
                  {fieldErrors.farmerType && touched.farmerType && (
                    <p className="mt-1 text-xs text-red-600 animate-fade-in">{fieldErrors.farmerType}</p>
                  )}
                </div>

                {/* Farm Size Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Farm Size <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Tractor className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="number"
                      name="farmSizeValue"
                      value={formData.farmSizeValue}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData({ 
                          ...formData, 
                          farmSizeValue: value,
                          farmSize: value ? `${value} ${formData.farmSizeUnit}` : ''
                        });
                        if (touched.farmSize) {
                          const farmSizeStr = value ? `${value} ${formData.farmSizeUnit}` : '';
                          setFieldErrors({ ...fieldErrors, farmSize: validateField('farmSize', farmSizeStr) });
                        }
                      }}
                      onBlur={() => handleBlur('farmSize')}
                      className={`w-full pl-10 pr-32 py-2 border rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 transition bg-white/80 dark:bg-zinc-800/80 ${
                        fieldErrors.farmSize && touched.farmSize
                          ? 'border-red-500 focus:ring-red-400 focus:border-red-400'
                          : 'border-green-200 dark:border-green-700 focus:ring-green-400 focus:border-green-400'
                      }`}
                      placeholder="Enter size"
                      min="0"
                      step="0.01"
                    />
                    <select
                      name="farmSizeUnit"
                      value={formData.farmSizeUnit}
                      onChange={(e) => {
                        const unit = e.target.value;
                        setFormData({ 
                          ...formData, 
                          farmSizeUnit: unit,
                          farmSize: formData.farmSizeValue ? `${formData.farmSizeValue} ${unit}` : ''
                        });
                        if (touched.farmSize && formData.farmSizeValue) {
                          const farmSizeStr = `${formData.farmSizeValue} ${unit}`;
                          setFieldErrors({ ...fieldErrors, farmSize: validateField('farmSize', farmSizeStr) });
                        }
                      }}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 px-2 py-1 border border-green-200 dark:border-green-700 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-400 bg-white dark:bg-zinc-800"
                    >
                      <option value="Kattha">Kattha</option>
                      <option value="Acres">Acres</option>
                      <option value="Hectares">Hectares</option>
                    </select>
                  </div>
                  {fieldErrors.farmSize && touched.farmSize && (
                    <p className="mt-1 text-xs text-red-600 animate-fade-in">{fieldErrors.farmSize}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Pic Upload */}
            <div className="flex flex-col gap-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Profile Picture <span className="text-gray-400">(optional)</span>
              </label>
              <div className="flex items-center gap-4">
              {formData.profilePic ? (
                <img
                src={URL.createObjectURL(formData.profilePic)}
                alt="Profile Preview"
                className="h-16 w-16 rounded-full object-cover border-2 border-green-400 shadow-md bg-white dark:bg-zinc-800"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-zinc-800 flex items-center justify-center border-2 border-dashed border-green-300 dark:border-green-700 shadow-md">
                <Leaf className="h-8 w-8 text-green-400 dark:text-green-300" />
                </div>
              )}
              <label className="cursor-pointer">
                <span className="inline-block py-2 px-4 rounded-lg bg-green-50 dark:bg-zinc-800 text-green-700 dark:text-green-300 font-semibold text-sm border border-green-200 dark:border-green-700 shadow-sm hover:bg-green-100 dark:hover:bg-zinc-700 transition">
                {formData.profilePic ? 'Change' : 'Upload'}
                </span>
                <input
                type="file"
                name="profilePic"
                accept="image/*"
                onChange={handleChange}
                className="hidden"
                />
              </label>
              </div>
              {formData.profilePic && (
              <button
                type="button"
                onClick={() => setFormData({ ...formData, profilePic: null })}
                className="text-xs text-red-500 hover:underline mt-1 self-start"
              >
                Remove
              </button>
              )}
            </div>

            {/* Terms & Submit Section */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center">
                <input
                  id="agree"
                  name="agree"
                  type="checkbox"
                  checked={formData.agree}
                  onChange={handleChange}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="agree" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                  I agree to the{' '}
                  <button
                    type="button"
                    onClick={() => setShowTerms(true)}
                    className="text-green-600 underline"
                  >
                    terms and conditions
                  </button>
                </label>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-2xl shadow-lg text-base font-semibold text-white bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Create Account'}
              </button>
              <div className="text-center">
                <span className="text-gray-600 dark:text-gray-300">Already have an account? </span>
                <Link
                  to="/login"
                  className="font-medium text-green-700 hover:text-green-900 dark:text-green-300 dark:hover:text-green-100 transition-colors"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Success Popup */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-sm p-8 relative flex flex-col items-center">
            <div className="text-green-600 dark:text-green-300 text-4xl mb-2">✓</div>
            <h2 className="text-xl font-bold text-green-700 dark:text-green-300 mb-2">Registration Successful!</h2>
            <p className="text-gray-700 dark:text-gray-300 text-center mb-4">You will be redirected to the login page.</p>
          </div>
        </div>
      )}

      {/* Terms & Conditions Modal */}
      {showTerms && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-3xl p-8 relative">
            <button
              className="absolute top-4 right-4 text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 text-xl font-bold"
              onClick={() => setShowTerms(false)}
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold text-green-700 dark:text-green-300 mb-4">Terms & Conditions</h2>
            <div className="text-gray-700 dark:text-gray-300 text-sm max-h-96 overflow-y-auto space-y-4">
              <p><strong>1. Acceptance of Terms:</strong> By using Krishi Sathi, you agree to comply with and be bound by these terms and conditions.</p>
              <p><strong>2. User Accounts:</strong> You are responsible for maintaining the confidentiality of your account information and for all activities under your account.</p>
              <p><strong>3. Use of the Platform:</strong> Krishi Sathi is for personal and agricultural purposes only. You agree not to misuse or disrupt the platform.</p>
              <p><strong>4. Privacy:</strong> Your personal information will be handled according to our Privacy Policy. Sharing false or misleading information is prohibited.</p>
              <p><strong>5. Intellectual Property:</strong> All content, logos, and trademarks on Krishi Sathi are property of the platform and cannot be used without permission.</p>
              <p><strong>6. Limitation of Liability:</strong> Krishi Sathi is not responsible for any losses or damages resulting from the use of the platform.</p>
              <p><strong>7. Modifications:</strong> We may update these terms at any time. Continued use of the platform constitutes acceptance of the updated terms.</p>
            </div>
            <div className="mt-6 text-center">
              <button
                onClick={() => setShowTerms(false)}
                className="py-2 px-6 bg-green-500 dark:bg-green-700 text-white rounded-lg shadow-md hover:bg-green-600 dark:hover:bg-green-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;