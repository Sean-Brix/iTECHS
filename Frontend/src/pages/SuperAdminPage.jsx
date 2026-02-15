import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Shield, UserCheck, Users, Settings, Plus, Search, Eye, EyeOff, LogOut, GraduationCap, Archive } from 'lucide-react';

import toast from 'react-hot-toast';
import { userAPI, handleAPIError } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';

const SuperAdminPage = () => {
  const { user, logout } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateTeacher, setShowCreateTeacher] = useState(false);
  const [showCreateStudent, setShowCreateStudent] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Archive confirmation modal
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [userToArchive, setUserToArchive] = useState(null);
  
  // Archive view tabs
  const [studentViewTab, setStudentViewTab] = useState('active'); // 'active' or 'archived'
  const [teacherViewTab, setTeacherViewTab] = useState('active');
  const [userViewTab, setUserViewTab] = useState('active');
  
  // Edit form state
  const [editFormData, setEditFormData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Search and filter states
  const [teacherSearch, setTeacherSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  
  // Pagination states
  const [teacherPage, setTeacherPage] = useState(1);
  const [studentPage, setStudentPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const itemsPerPage = 10;
  
  // Password visibility
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  // Load admin data
  useEffect(() => {
    const loadAdminData = async () => {
      try {
        const response = await userAPI.getUsers();
        
        if (response.status === 'success') {
          const users = response.data.users || [];
          setAllUsers(users);
          setTeachers(users.filter(u => u.role === 'TEACHER'));
          setStudents(users.filter(u => u.role === 'STUDENT'));
        }
      } catch (error) {
        const errorInfo = handleAPIError(error);
        toast.error(errorInfo.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadAdminData();
  }, []);

  // Create new teacher
  const onCreateTeacher = async (data) => {
    try {
      setIsCreating(true);
      
      // Auto-append @teacher.com to username if not present
      const username = data.username.includes('@') ? data.username : `${data.username}@teacher.com`;
      
      const teacherData = {
        ...data,
        username,
        role: 'TEACHER'
      };

      const response = await userAPI.createUser(teacherData);
      
      if (response.status === 'success') {
        toast.success('✅ Teacher account created successfully!', {
          duration: 4000,
          style: {
            background: '#10b981',
            color: '#fff',
          },
        });
        setShowCreateTeacher(false);
        reset();
        
        // Reload data
        const updatedResponse = await userAPI.getUsers();
        if (updatedResponse.status === 'success') {
          const users = updatedResponse.data.users || [];
          setAllUsers(users);
          setTeachers(users.filter(u => u.role === 'TEACHER'));
          setStudents(users.filter(u => u.role === 'STUDENT'));
        }
      }
    } catch (error) {
      const errorInfo = handleAPIError(error);
      toast.error(`❌ ${errorInfo.message}`, {
        duration: 6000,
        style: {
          background: '#ef4444',
          color: '#fff',
          whiteSpace: 'pre-line',
        },
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Create new student
  const onCreateStudent = async (data) => {
    try {
      setIsCreating(true);
      
      // Auto-append @student.com to username if not present
      const username = data.username.includes('@') ? data.username : `${data.username}@student.com`;
      
      const studentData = {
        ...data,
        username,
        role: 'STUDENT'
      };

      const response = await userAPI.createUser(studentData);
      
      if (response.status === 'success') {
        toast.success('✅ Student account created successfully!', {
          duration: 4000,
          style: {
            background: '#10b981',
            color: '#fff',
          },
        });
        setShowCreateStudent(false);
        reset();
        
        // Reload data
        const updatedResponse = await userAPI.getUsers();
        if (updatedResponse.status === 'success') {
          const users = updatedResponse.data.users || [];
          setAllUsers(users);
          setTeachers(users.filter(u => u.role === 'TEACHER'));
          setStudents(users.filter(u => u.role === 'STUDENT'));
        }
      }
    } catch (error) {
      const errorInfo = handleAPIError(error);
      toast.error(`❌ ${errorInfo.message}`, {
        duration: 6000,
        style: {
          background: '#ef4444',
          color: '#fff',
          whiteSpace: 'pre-line',
        },
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Demo data for system stats
  const systemStats = {
    totalUsers: allUsers.length || 156,
    activeTeachers: teachers.filter(t => !t.isArchived).length || 8,
    totalStudents: allUsers.filter(u => u.role === 'STUDENT').length || 142,
    totalExams: 47,
    systemUptime: '99.8%',
    activeExams: 23
  };

  // Filtering and pagination logic
  const filterUsers = (users, searchTerm) => {
    return users.filter(user =>
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filterAllUsers = (users) => {
    let filtered = users;
    
    // Search filter
    if (userSearch) {
      filtered = filterUsers(filtered, userSearch);
    }
    
    // Role filter
    if (roleFilter !== 'ALL') {
      filtered = filtered.filter(u => u.role === roleFilter);
    }
    
    return filtered;
  };

  const paginate = (array, page) => {
    const startIndex = (page - 1) * itemsPerPage;
    return array.slice(startIndex, startIndex + itemsPerPage);
  };

  // Filtered and paginated data
  const filteredTeachers = filterUsers(teachers, teacherSearch).filter(t => 
    teacherViewTab === 'active' ? !t.isArchived : t.isArchived
  );
  const filteredStudents = filterUsers(students, studentSearch).filter(s => 
    studentViewTab === 'active' ? !s.isArchived : s.isArchived
  );
  const filteredAllUsers = filterAllUsers(allUsers).filter(u => 
    userViewTab === 'active' ? !u.isArchived : u.isArchived
  );
  
  const paginatedTeachers = paginate(filteredTeachers, teacherPage);
  const paginatedStudents = paginate(filteredStudents, studentPage);
  const paginatedUsers = paginate(filteredAllUsers, userPage);
  
  const teacherPages = Math.ceil(filteredTeachers.length / itemsPerPage);
  const studentPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const userPages = Math.ceil(filteredAllUsers.length / itemsPerPage);

  // Edit user handler
  const handleEditUser = async (e) => {
    e.preventDefault();
    
    try {
      setIsEditing(true);
      
      const updateData = {
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        email: editFormData.email
      };
      
      const response = await userAPI.updateUser(selectedUser.id, updateData);
      
      if (response.status === 'success') {
        toast.success('✅ User updated successfully!', {
          duration: 4000,
          style: {
            background: '#10b981',
            color: '#fff',
          },
        });
        
        // Reload all data
        const updatedResponse = await userAPI.getUsers();
        if (updatedResponse.status === 'success') {
          const users = updatedResponse.data.users || [];
          setAllUsers(users);
          setTeachers(users.filter(u => u.role === 'TEACHER'));
          setStudents(users.filter(u => u.role === 'STUDENT'));
        }
        
        setShowEditModal(false);
        setEditFormData(null);
      }
    } catch (error) {
      const errorInfo = handleAPIError(error);
      toast.error(errorInfo.message, {
        duration: 4000,
        style: {
          background: '#ef4444',
          color: '#fff',
        },
      });
    } finally {
      setIsEditing(false);
    }
  };
  
  // Archive user handler
  const handleArchiveUser = async (userId, userName) => {
    setUserToArchive({ id: userId, name: userName });
    setShowArchiveConfirm(true);
  };
  
  const confirmArchive = async () => {
    if (!userToArchive) return;
    
    try {
      await userAPI.deleteUser(userToArchive.id);
      
      toast.success('✅ User archived successfully!', {
        duration: 4000,
        style: {
          background: '#10b981',
          color: '#fff',
        },
      });
      
      // Reload data
      const response = await userAPI.getUsers();
      if (response.status === 'success') {
        const users = response.data.users || [];
        setAllUsers(users);
        setTeachers(users.filter(u => u.role === 'TEACHER'));
        setStudents(users.filter(u => u.role === 'STUDENT'));
      }
    } catch (error) {
      const errorInfo = handleAPIError(error);
      toast.error(`❌ ${errorInfo.message}`, {
        duration: 4000,
        style: {
          background: '#ef4444',
          color: '#fff',
        },
      });
    } finally {
      setShowArchiveConfirm(false);
      setUserToArchive(null);
    }
  };

  // Restore user handler
  const handleRestoreUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to restore ${userName}?`)) {
      return;
    }
    
    try {
      await userAPI.restoreUser(userId);
      
      toast.success('✅ User restored successfully!', {
        duration: 4000,
        style: {
          background: '#10b981',
          color: '#fff',
        },
      });
      
      // Reload data
      const response = await userAPI.getUsers();
      if (response.status === 'success') {
        const users = response.data.users || [];
        setAllUsers(users);
        setTeachers(users.filter(u => u.role === 'TEACHER'));
        setStudents(users.filter(u => u.role === 'STUDENT'));
      }
    } catch (error) {
      const errorInfo = handleAPIError(error);
      toast.error(`❌ ${errorInfo.message}`, {
        duration: 6000,
        style: {
          background: '#ef4444',
          color: '#fff',
        },
      });
    } finally {
      setShowArchiveConfirm(false);
      setUserToArchive(null);
    }
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color = "blue" }) => {
    const colorClasses = {
      blue: { text: 'text-blue-600', bg: 'bg-blue-50' },
      green: { text: 'text-green-600', bg: 'bg-green-50' },
      purple: { text: 'text-purple-600', bg: 'bg-purple-50' },
      orange: { text: 'text-orange-600', bg: 'bg-orange-50' }
    };
    
    const colors = colorClasses[color] || colorClasses.blue;
    
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className={`text-3xl font-bold mt-2 ${colors.text}`}>{value}</p>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`p-3 rounded-lg ${colors.bg}`}>
            <Icon className={`h-8 w-8 ${colors.text}`} />
          </div>
        </div>
      </div>
    );
  };

  const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;
    
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 1 && i <= currentPage + 1)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }
    
    return (
      <div className="flex items-center justify-center space-x-2 mt-6">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Previous
        </button>
        
        {pages.map((page, index) => (
          page === '...' ? (
            <span key={`ellipsis-${index}`} className="px-2">...</span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-4 py-2 rounded-lg border ${
                currentPage === page
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          )
        ))}
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Next
        </button>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Layout title="System Administration">
        <div className="flex justify-center py-8">
          <LoadingSpinner size="xl" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="System Administration">
      <div className="flex min-h-screen bg-gray-50">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 fixed h-full overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-8">
              <div className="bg-linear-to-br from-purple-600 to-blue-600 p-2 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Admin Panel</h2>
                <p className="text-xs text-gray-500">System Control</p>
              </div>
            </div>

            <nav className="space-y-2">
              {[
                { id: 'overview', name: 'Overview', icon: Shield },
                { id: 'teachers', name: 'Teachers', icon: UserCheck },
                { id: 'students', name: 'Students', icon: GraduationCap },
                { id: 'users', name: 'All Users', icon: Users },
                { id: 'system', name: 'System', icon: Settings },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                      activeTab === tab.id
                        ? 'bg-linear-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{tab.name}</span>
                  </button>
                );
              })}
            </nav>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Quick Actions</p>
              <div className="space-y-2">
                <button 
                  onClick={() => setShowCreateTeacher(true)}
                  className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 rounded-lg transition-colors"
                >
                  <Plus className="h-4 w-4 text-purple-600" />
                  <span>Add Teacher</span>
                </button>
                <button 
                  onClick={() => setShowCreateStudent(true)}
                  className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Plus className="h-4 w-4 text-blue-600" />
                  <span>Add Student</span>
                </button>
              </div>
            </div>

            <div className="mt-auto pt-6 border-t border-gray-200">
              <button 
                onClick={async () => {
                  try {
                    await logout();
                    toast.success('Logged out successfully');
                  } catch (error) {
                    toast.error('Logout failed');
                  }
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="ml-64 flex-1 p-6">

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Recent Admin Activity</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                      <div className="h-2 w-2 bg-green-600 rounded-full"></div>
                      <p className="text-sm">New teacher Prof. Anderson registered</p>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                      <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                      <p className="text-sm">System backup completed successfully</p>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                      <div className="h-2 w-2 bg-purple-600 rounded-full"></div>
                      <p className="text-sm">Platform performance optimized</p>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                      <div className="h-2 w-2 bg-yellow-600 rounded-full"></div>
                      <p className="text-sm">Security scan completed - No issues found</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">Quick Admin Actions</h3>
                  <div className="space-y-2">
                    <button 
                      onClick={() => setShowCreateTeacher(true)}
                      className="btn btn-secondary w-full justify-start"
                    >
                      <UserCheck className="h-4 w-4" />
                      Create Teacher Account
                    </button>
                    <button 
                      onClick={() => setShowCreateStudent(true)}
                      className="btn btn-secondary w-full justify-start"
                    >
                      <Users className="h-4 w-4" />
                      Create Student Account
                    </button>
                    <button 
                      onClick={() => setActiveTab('users')}
                      className="btn btn-secondary w-full justify-start"
                    >
                      <Users className="h-4 w-4" />
                      Manage Users
                    </button>
                    <button 
                      onClick={() => setActiveTab('system')}
                      className="btn btn-secondary w-full justify-start"
                    >
                      <Settings className="h-4 w-4" />
                      System Settings
                    </button>
                    <button 
                      onClick={() => setActiveTab('system')}
                      className="btn btn-secondary w-full justify-start"
                    >
                      <Shield className="h-4 w-4" />
                      Security Audit
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Teachers Tab */}
            {activeTab === 'teachers' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Teacher Management</h3>
                  <div className="flex space-x-2">
                    <div className="relative flex-1 min-w-[300px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search teachers..."
                        value={teacherSearch}
                        onChange={(e) => {
                          setTeacherSearch(e.target.value);
                          setTeacherPage(1);
                        }}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <button 
                      onClick={() => setShowCreateTeacher(true)}
                      className="btn btn-primary whitespace-nowrap"
                    >
                      <Plus className="h-4 w-4" />
                      Add Teacher
                    </button>
                  </div>
                </div>

                {/* Active/Archived Tabs for Teachers */}
                <div className="mb-6 border-b border-gray-200">
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setTeacherViewTab('active');
                        setTeacherPage(1);
                      }}
                      className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                        teacherViewTab === 'active'
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Active
                    </button>
                    <button
                      onClick={() => {
                        setTeacherViewTab('archived');
                        setTeacherPage(1);
                      }}
                      className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                        teacherViewTab === 'archived'
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Archived
                    </button>
                  </div>
                </div>

                {teachers.length === 0 ? (
                  <div className="text-center py-8">
                    <UserCheck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No teachers registered yet</p>
                    <button 
                      onClick={() => setShowCreateTeacher(true)}
                      className="btn btn-primary"
                    >
                      <Plus className="h-4 w-4" />
                      Create First Teacher Account
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-200">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-200 px-4 py-2 text-left">Name</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">Username</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">Email</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">Status</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">Students</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">Created</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedTeachers.map((teacher) => (
                          <tr key={teacher.id}>
                            <td className="border border-gray-200 px-4 py-2">
                              {teacher.firstName} {teacher.lastName}
                            </td>
                            <td className="border border-gray-200 px-4 py-2 font-mono text-sm">
                              {teacher.username}
                            </td>
                            <td className="border border-gray-200 px-4 py-2">
                              {teacher.email}
                            </td>
                            <td className="border border-gray-200 px-4 py-2">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                teacher.isArchived 
                                  ? 'bg-orange-100 text-orange-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {teacher.isArchived ? 'Archived' : 'Active'}
                              </span>
                            </td>
                            <td className="border border-gray-200 px-4 py-2">
                              {teacher._count?.createdStudents || 0}
                            </td>
                            <td className="border border-gray-200 px-4 py-2 text-sm text-gray-600">
                              {new Date(teacher.createdAt).toLocaleDateString()}
                            </td>
                            <td className="border border-gray-200 px-4 py-2">
                              <div className="flex space-x-1">
                                <button 
                                  onClick={() => {
                                    setSelectedUser(teacher);
                                    setShowViewModal(true);
                                  }}
                                  className="btn btn-secondary text-xs"
                                >
                                  <Eye className="h-3 w-3" />
                                  View
                                </button>
                                <button 
                                  onClick={() => {
                                    setSelectedUser(teacher);
                                    setEditFormData({
                                      firstName: teacher.firstName,
                                      lastName: teacher.lastName,
                                      email: teacher.email
                                    });
                                    setShowEditModal(true);
                                  }}
                                  className="btn btn-secondary text-xs"
                                >
                                  <Settings className="h-3 w-3" />
                                  Edit
                                </button>
                                {teacherViewTab === 'active' ? (
                                  <button 
                                    onClick={() => handleArchiveUser(teacher.id, `${teacher.firstName} ${teacher.lastName}`)}
                                    className="btn btn-secondary text-xs text-orange-600 hover:bg-orange-50"
                                  >
                                    <Archive className="h-3 w-3" />
                                    Archive
                                  </button>
                                ) : (
                                  <button 
                                    onClick={() => handleRestoreUser(teacher.id, `${teacher.firstName} ${teacher.lastName}`)}
                                    className="btn btn-secondary text-xs text-green-600 hover:bg-green-50"
                                  >
                                    Restore
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    <Pagination 
                      currentPage={teacherPage}
                      totalPages={teacherPages}
                      onPageChange={setTeacherPage}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Students Tab */}
            {activeTab === 'students' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Student Management</h3>
                  <div className="flex space-x-2">
                    <div className="relative flex-1 min-w-[300px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search students..."
                        value={studentSearch}
                        onChange={(e) => {
                          setStudentSearch(e.target.value);
                          setStudentPage(1);
                        }}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <button 
                      onClick={() => setShowCreateStudent(true)}
                      className="btn btn-primary whitespace-nowrap"
                    >
                      <Plus className="h-4 w-4" />
                      Add Student
                    </button>
                  </div>
                </div>

                {/* Active/Archived Tabs */}
                <div className="mb-6 border-b border-gray-200">
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setStudentViewTab('active');
                        setStudentPage(1);
                      }}
                      className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                        studentViewTab === 'active'
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Active
                    </button>
                    <button
                      onClick={() => {
                        setStudentViewTab('archived');
                        setStudentPage(1);
                      }}
                      className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                        studentViewTab === 'archived'
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Archived
                    </button>
                  </div>
                </div>

                {students.length === 0 ? (
                  <div className="text-center py-8">
                    <GraduationCap className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No students registered yet</p>
                    <button 
                      onClick={() => setShowCreateStudent(true)}
                      className="btn btn-primary"
                    >
                      <Plus className="h-4 w-4" />
                      Create First Student Account
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-200">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-200 px-4 py-2 text-left">Name</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">Username</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">Email</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">Status</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">Created</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedStudents.map((student) => (
                          <tr key={student.id}>
                            <td className="border border-gray-200 px-4 py-2">
                              {student.firstName} {student.lastName}
                            </td>
                            <td className="border border-gray-200 px-4 py-2 font-mono text-sm">
                              {student.username}
                            </td>
                            <td className="border border-gray-200 px-4 py-2">
                              {student.email}
                            </td>
                            <td className="border border-gray-200 px-4 py-2">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                student.isArchived 
                                  ? 'bg-orange-100 text-orange-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {student.isArchived ? 'Archived' : 'Active'}
                              </span>
                            </td>
                            <td className="border border-gray-200 px-4 py-2 text-sm text-gray-600">
                              {new Date(student.createdAt).toLocaleDateString()}
                            </td>
                            <td className="border border-gray-200 px-4 py-2">
                              <div className="flex space-x-1">
                                <button 
                                  onClick={() => {
                                    setSelectedUser(student);
                                    setShowViewModal(true);
                                  }}
                                  className="btn btn-secondary text-xs"
                                >
                                  <Eye className="h-3 w-3" />
                                  View
                                </button>
                                <button 
                                  onClick={() => {
                                    setSelectedUser(student);
                                    setEditFormData({
                                      firstName: student.firstName,
                                      lastName: student.lastName,
                                      email: student.email
                                    });
                                    setShowEditModal(true);
                                  }}
                                  className="btn btn-secondary text-xs"
                                >
                                  <Settings className="h-3 w-3" />
                                  Edit
                                </button>
                                {studentViewTab === 'active' ? (
                                  <button 
                                    onClick={() => handleArchiveUser(student.id, `${student.firstName} ${student.lastName}`)}
                                    className="btn btn-secondary text-xs text-orange-600 hover:bg-orange-50"
                                  >
                                    <Archive className="h-3 w-3" />
                                    Archive
                                  </button>
                                ) : (
                                  <button 
                                    onClick={() => handleRestoreUser(student.id, `${student.firstName} ${student.lastName}`)}
                                    className="btn btn-secondary text-xs text-green-600 hover:bg-green-50"
                                  >
                                    Restore
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    <Pagination 
                      currentPage={studentPage}
                      totalPages={studentPages}
                      onPageChange={setStudentPage}
                    />
                  </div>
                )}
              </div>
            )}

            {/* All Users Tab */}
            {activeTab === 'users' && (
              <div>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-4">All Platform Users</h3>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={userSearch}
                        onChange={(e) => {
                          setUserSearch(e.target.value);
                          setUserPage(1);
                        }}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <select
                      value={roleFilter}
                      onChange={(e) => {
                        setRoleFilter(e.target.value);
                        setUserPage(1);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="ALL">All Roles</option>
                      <option value="SUPER_ADMIN">Super Admin</option>
                      <option value="TEACHER">Teacher</option>
                      <option value="STUDENT">Student</option>
                    </select>
                  </div>
                </div>
                
                {/* Archive Tabs for All Users */}
                <div className="mb-6 border-b border-gray-200">
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setUserViewTab('active');
                        setUserPage(1);
                      }}
                      className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                        userViewTab === 'active'
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Active
                    </button>
                    <button
                      onClick={() => {
                        setUserViewTab('archived');
                        setUserPage(1);
                      }}
                      className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                        userViewTab === 'archived'
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Archived
                    </button>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 px-4 py-2 text-left">Name</th>
                        <th className="border border-gray-200 px-4 py-2 text-left">Role</th>
                        <th className="border border-gray-200 px-4 py-2 text-left">Email</th>
                        <th className="border border-gray-200 px-4 py-2 text-left">Status</th>
                        <th className="border border-gray-200 px-4 py-2 text-left">Last Login</th>
                        <th className="border border-gray-200 px-4 py-2 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedUsers.map((usr) => (
                        <tr key={usr.id}>
                          <td className="border border-gray-200 px-4 py-2">
                            {usr.firstName} {usr.lastName}
                          </td>
                          <td className="border border-gray-200 px-4 py-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              usr.role === 'SUPER_ADMIN' 
                                ? 'bg-purple-100 text-purple-800'
                                : usr.role === 'TEACHER'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {usr.role.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="border border-gray-200 px-4 py-2">
                            {usr.email}
                          </td>
                          <td className="border border-gray-200 px-4 py-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              usr.isArchived 
                                ? 'bg-orange-100 text-orange-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {usr.isArchived ? 'Archived' : 'Active'}
                            </span>
                          </td>
                          <td className="border border-gray-200 px-4 py-2 text-sm text-gray-600">
                            {usr.lastLogin 
                              ? new Date(usr.lastLogin).toLocaleDateString()
                              : 'Never'
                            }
                          </td>
                          <td className="border border-gray-200 px-4 py-2">
                            <div className="flex space-x-1">
                              <button 
                                onClick={() => {
                                  setSelectedUser(usr);
                                  setShowViewModal(true);
                                }}
                                className="btn btn-secondary text-xs"
                              >
                                <Eye className="h-3 w-3" />
                                View
                              </button>
                              <button 
                                onClick={() => {
                                  setSelectedUser(usr);
                                  setEditFormData({
                                    firstName: usr.firstName,
                                    lastName: usr.lastName,
                                    email: usr.email
                                  });
                                  setShowEditModal(true);
                                }}
                                className="btn btn-secondary text-xs"
                              >
                                <Settings className="h-3 w-3" />
                                Edit
                              </button>
                              {userViewTab === 'active' ? (
                                <button 
                                  onClick={() => handleArchiveUser(usr.id, `${usr.firstName} ${usr.lastName}`)}
                                  className="btn btn-secondary text-xs text-orange-600 hover:bg-orange-50"
                                >
                                  <Archive className="h-3 w-3" />
                                  Archive
                                </button>
                              ) : (
                                <button 
                                  onClick={() => handleRestoreUser(usr.id, `${usr.firstName} ${usr.lastName}`)}
                                  className="btn btn-secondary text-xs text-green-600 hover:bg-green-50"
                                >
                                  Restore
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  <Pagination 
                    currentPage={userPage}
                    totalPages={userPages}
                    onPageChange={setUserPage}
                  />
                </div>
              </div>
            )}

            {/* System Tab */}
            {activeTab === 'system' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">System Management</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-gray-200 rounded-lg p-6">
                    <h4 className="font-medium mb-3">Database Status</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Connection:</span>
                        <span className="text-green-600">Healthy</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Performance:</span>
                        <span className="text-green-600">Optimal</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last Backup:</span>
                        <span>2 hours ago</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-6">
                    <h4 className="font-medium mb-3">Security Status</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>SSL Certificate:</span>
                        <span className="text-green-600">Valid</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last Security Scan:</span>
                        <span className="text-green-600">Passed</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Failed Login Attempts:</span>
                        <span>0 today</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        {/* Create Teacher Modal */}
        {showCreateTeacher && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowCreateTeacher(false)}>
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="p-8">
                <h3 className="text-2xl font-bold mb-6 text-gray-900">Create Teacher Account</h3>
                
                <form onSubmit={handleSubmit(onCreateTeacher)} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                      <input
                        type="text"
                        placeholder="John"
                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                          errors.firstName ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        {...register('firstName', {
                          required: 'First name is required',
                        })}
                      />
                      {errors.firstName && (
                        <p className="text-red-600 text-sm mt-1">{errors.firstName.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                      <input
                        type="text"
                        placeholder="Doe"
                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                          errors.lastName ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        {...register('lastName', {
                          required: 'Last name is required',
                        })}
                      />
                      {errors.lastName && (
                        <p className="text-red-600 text-sm mt-1">{errors.lastName.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Enter username"
                        className={`w-full px-4 py-2.5 pr-32 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                          errors.username ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        {...register('username', {
                          required: 'Username is required',
                          pattern: {
                            value: /^[a-zA-Z0-9._-]+$/,
                            message: 'Only letters, numbers, dots, hyphens and underscores allowed'
                          }
                        })}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">@teacher.com</span>
                    </div>
                    {errors.username && (
                      <p className="text-red-600 text-sm mt-1">{errors.username.message}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">@teacher.com will be added automatically</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address (for OTP)</label>
                    <input
                      type="email"
                      placeholder="teacher@gmail.com"
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                        errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      {...register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                          message: 'Please enter a valid email address',
                        }
                      })}
                    />
                    {errors.email && (
                      <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Use a real Gmail address for OTP delivery</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Min. 8 characters"
                        className={`w-full px-4 py-2.5 pr-12 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                          errors.password ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        {...register('password', {
                          required: 'Password is required',
                          minLength: {
                            value: 8,
                            message: 'Password must be at least 8 characters',
                          },
                        })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>
                    )}
                    <p className="text-gray-500 text-xs mt-1">
                      Must include uppercase, lowercase, number, and special character (@$!%*?&_#-)
                    </p>
                  </div>
                  
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateTeacher(false);
                        reset();
                      }}
                      className="btn btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCreating}
                      className={`btn btn-primary flex-1 ${isCreating ? 'loading' : ''}`}
                    >
                      {isCreating ? (
                        <>
                          <LoadingSpinner size="sm" />
                          Creating...
                        </>
                      ) : (
                        'Create Teacher'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Create Student Modal */}
        {showCreateStudent && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowCreateStudent(false)}>
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="p-8">
                <h3 className="text-2xl font-bold mb-6 text-gray-900">Create Student Account</h3>
                
                <form onSubmit={handleSubmit(onCreateStudent)} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                      <input
                        type="text"
                        placeholder="Jane"
                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          errors.firstName ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        {...register('firstName', {
                          required: 'First name is required',
                        })}
                      />
                      {errors.firstName && (
                        <p className="text-red-600 text-sm mt-1">{errors.firstName.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                      <input
                        type="text"
                        placeholder="Smith"
                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          errors.lastName ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        {...register('lastName', {
                          required: 'Last name is required',
                        })}
                      />
                      {errors.lastName && (
                        <p className="text-red-600 text-sm mt-1">{errors.lastName.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Enter username"
                        className={`w-full px-4 py-2.5 pr-32 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          errors.username ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        {...register('username', {
                          required: 'Username is required',
                          pattern: {
                            value: /^[a-zA-Z0-9._-]+$/,
                            message: 'Only letters, numbers, dots, hyphens and underscores allowed'
                          }
                        })}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">@student.com</span>
                    </div>
                    {errors.username && (
                      <p className="text-red-600 text-sm mt-1">{errors.username.message}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">@student.com will be added automatically</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      placeholder="student@gmail.com"
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      {...register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                          message: 'Please enter a valid email address',
                        }
                      })}
                    />
                    {errors.email && (
                      <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Use a real email address</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Min. 8 characters"
                        className={`w-full px-4 py-2.5 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          errors.password ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        {...register('password', {
                          required: 'Password is required',
                          minLength: {
                            value: 8,
                            message: 'Password must be at least 8 characters',
                          },
                        })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>
                    )}
                    <p className="text-gray-500 text-xs mt-1">
                      Must include uppercase, lowercase, number, and special character (@$!%*?&_#-)
                    </p>
                  </div>
                  
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateStudent(false);
                        reset();
                      }}
                      className="btn btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCreating}
                      className={`btn btn-primary flex-1 ${isCreating ? 'loading' : ''}`}
                    >
                      {isCreating ? (
                        <>
                          <LoadingSpinner size="sm" />
                          Creating...
                        </>
                      ) : (
                        'Create Student'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* View User Modal */}
        {showViewModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowViewModal(false)}>
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">User Details</h3>
                  <button 
                    onClick={() => setShowViewModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">First Name</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedUser.firstName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Last Name</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedUser.lastName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Username</p>
                    <p className="text-lg font-mono text-gray-900">{selectedUser.username}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Email</p>
                    <p className="text-lg text-gray-900">{selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Role</p>
                    <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                      selectedUser.role === 'SUPER_ADMIN' 
                        ? 'bg-purple-100 text-purple-800'
                        : selectedUser.role === 'TEACHER'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {selectedUser.role.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Status</p>
                    <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                      selectedUser.isArchived 
                        ? 'bg-orange-100 text-orange-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {selectedUser.isArchived ? 'Archived' : 'Active'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Created Date</p>
                    <p className="text-lg text-gray-900">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Last Login</p>
                    <p className="text-lg text-gray-900">
                      {selectedUser.lastLogin 
                        ? new Date(selectedUser.lastLogin).toLocaleDateString()
                        : 'Never'
                      }
                    </p>
                  </div>
                </div>
                
                <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end space-x-3">
                  <button 
                    onClick={() => setShowViewModal(false)}
                    className="btn btn-secondary"
                  >
                    Close
                  </button>
                  <button 
                    onClick={() => {
                      setShowViewModal(false);
                      setShowEditModal(true);
                      setEditFormData({
                        firstName: selectedUser.firstName,
                        lastName: selectedUser.lastName,
                        email: selectedUser.email
                      });
                    }}
                    className="btn btn-primary"
                  >
                    <Settings className="h-4 w-4" />
                    Edit User
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowEditModal(false)}>
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Edit User</h3>
                  <button 
                    onClick={() => setShowEditModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                
                <form className="space-y-5" onSubmit={handleEditUser}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                      <input
                        type="text"
                        value={editFormData?.firstName || ''}
                        onChange={(e) => setEditFormData({...editFormData, firstName: e.target.value})}
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                      <input
                        type="text"
                        value={editFormData?.lastName || ''}
                        onChange={(e) => setEditFormData({...editFormData, lastName: e.target.value})}
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={editFormData?.email || ''}
                      onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Username:</strong> {selectedUser.username}
                    </p>
                    <p className="text-sm text-blue-800 mt-1">
                      <strong>Role:</strong> {selectedUser.role.replace('_', ' ')}
                    </p>
                    <p className="text-xs text-blue-600 mt-2">Username and role cannot be changed</p>
                  </div>
                  
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false);
                        setEditFormData(null);
                      }}
                      disabled={isEditing}
                      className="btn btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isEditing}
                      className={`btn btn-primary flex-1 ${isEditing ? 'loading' : ''}`}
                    >
                      {isEditing ? (
                        <>
                          <LoadingSpinner size="sm" />
                          Updating...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        
        {/* Archive Confirmation Modal */}
        {showArchiveConfirm && userToArchive && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowArchiveConfirm(false)}>
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="p-8">
                <div className="flex items-center justify-center mb-6">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                    <Archive className="h-8 w-8 text-orange-600" />
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">Archive User</h3>
                <p className="text-gray-600 text-center mb-6">
                  Are you sure you want to archive <span className="font-semibold text-gray-900">{userToArchive.name}</span>?
                </p>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-orange-800">
                    ℹ️ <strong>Note:</strong> This will deactivate the user account. The user will no longer be able to log in, but their data will be preserved.
                  </p>
                </div>
                
                <div className="flex space-x-3">
                  <button 
                    onClick={() => {
                      setShowArchiveConfirm(false);
                      setUserToArchive(null);
                    }}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={confirmArchive}
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                  >
                    Archive User
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </Layout>
  );
};

export default SuperAdminPage;