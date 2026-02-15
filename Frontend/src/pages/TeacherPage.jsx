import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { examAPI, userAPI, handleAPIError } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const TeacherPage = () => {
  const { user, logout } = useAuth();
  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [archivedStudents, setArchivedStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [studentViewTab, setStudentViewTab] = useState('active'); // 'active' or 'archived'

  // Load teacher data
  useEffect(() => {
    loadTeacherData();
  }, [studentViewTab]);

  const loadTeacherData = async () => {
    try {
      setIsLoading(true);
      console.log('Loading teacher data, studentViewTab:', studentViewTab);
      const examsResponse = await examAPI.getExams();
      
      if (examsResponse.status === 'success') {
        setExams(examsResponse.data.exams || []);
      }

      // Load students based on the active view tab
      if (studentViewTab === 'active') {
        console.log('Fetching active students...');
        const studentsResponse = await userAPI.getMyStudents({ isArchived: 'false' });
        if (studentsResponse.status === 'success') {
          setStudents(studentsResponse.data.students || []);
          console.log('Active students loaded:', studentsResponse.data.students?.length);
        }
      } else {
        console.log('Fetching archived students...');
        const archivedResponse = await userAPI.getMyStudents({ isArchived: 'true' });
        if (archivedResponse.status === 'success') {
          setArchivedStudents(archivedResponse.data.students || []);
          console.log('Archived students loaded:', archivedResponse.data.students?.length);
        }
      }
    } catch (error) {
      const errorInfo = handleAPIError(error);
      toast.error(errorInfo.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Archive a student
  const handleArchiveStudent = async (studentId, studentName) => {
    if (!window.confirm(`Are you sure you want to archive ${studentName}?`)) {
      return;
    }

    try {
      const response = await userAPI.deleteUser(studentId, 'Archived by teacher');
      if (response.status === 'success') {
        toast.success('Student archived successfully');
        loadTeacherData();
      }
    } catch (error) {
      const errorInfo = handleAPIError(error);
      toast.error(errorInfo.message);
    }
  };

  // Restore an archived student
  const handleRestoreStudent = async (studentId, studentName) => {
    if (!window.confirm(`Are you sure you want to restore ${studentName}?`)) {
      return;
    }

    try {
      const response = await userAPI.restoreUser(studentId);
      if (response.status === 'success') {
        toast.success('Student restored successfully');
        loadTeacherData();
      }
    } catch (error) {
      const errorInfo = handleAPIError(error);
      toast.error(errorInfo.message);
    }
  };

  // Demo data for demonstration
  const demoExams = [
    {
      id: 'demo1',
      title: 'Mathematics Assessment',
      examCode: 'MATH01',
      totalMarks: 100,
      questionCount: 20,
      studentCount: 15,
      averageScore: 78.5,
      isActive: true
    },
    {
      id: 'demo2',
      title: 'Science Quiz',
      examCode: 'SCI002',
      totalMarks: 50,
      questionCount: 10,
      studentCount: 12,
      averageScore: 82.3,
      isActive: true
    },
    {
      id: 'demo3',
      title: 'Programming Logic Test',
      examCode: 'PROG03',
      totalMarks: 150,
      questionCount: 25,
      studentCount: 8,
      averageScore: 71.8,
      isActive: false
    }
  ];

  const demoScores = [
    {
      id: 1,
      student: { firstName: 'John', lastName: 'Doe', username: 'john@student.com' },
      exam: 'Mathematics Assessment',
      score: 85,
      totalMarks: 100,
      percentage: 85.0,
      completedAt: '2024-02-10T10:30:00Z'
    },
    {
      id: 2,
      student: { firstName: 'Jane', lastName: 'Smith', username: 'jane@student.com' },
      exam: 'Science Quiz',
      score: 42,
      totalMarks: 50,
      percentage: 84.0,
      completedAt: '2024-02-09T14:15:00Z'
    },
    {
      id: 3,
      student: { firstName: 'Mike', lastName: 'Johnson', username: 'mike@student.com' },
      exam: 'Mathematics Assessment',
      score: 78,
      totalMarks: 100,
      percentage: 78.0,
      completedAt: '2024-02-08T16:45:00Z'
    },
    {
      id: 4,
      student: { firstName: 'Sarah', lastName: 'Wilson', username: 'sarah@student.com' },
      exam: 'Programming Logic Test',
      score: 108,
      totalMarks: 150,
      percentage: 72.0,
      completedAt: '2024-02-07T11:20:00Z'
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="flex justify-between items-center px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">iTECHS Teacher Portal</h1>
            <p className="text-gray-600">Welcome back, Professor {user?.firstName || user?.username}!</p>
          </div>
          <button 
            onClick={logout}
            className="btn btn-secondary"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <div className="w-80 bg-white shadow-lg overflow-y-auto">
          <div className="p-6">
            {/* Navigation Tabs */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Navigation</h3>
              <div className="space-y-1">
                {[
                  { id: 'overview', name: 'Overview', icon: '📊' },
                  { id: 'exams', name: 'My Exams', icon: '📝' },
                  { id: 'students', name: 'Students', icon: '👥' },
                  { id: 'scores', name: 'Score Records', icon: '📈' },
                  { id: 'analytics', name: 'Analytics', icon: '📉' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    <span className="font-medium">{tab.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full btn btn-primary text-sm py-2">
                  ✏️ Create New Exam
                </button>
                <button className="w-full btn btn-secondary text-sm py-2">
                  👤 Add Student
                </button>
                <button className="w-full btn btn-secondary text-sm py-2">
                  📊 View Reports
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8 overflow-y-auto">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Overview</h2>
                <p className="text-gray-600">Manage your classes, create assessments, and track student progress.</p>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="card">
                  <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {[
                      { text: "John Doe completed Mathematics Assessment (85%)", color: "blue" },
                      { text: "New student Jane Smith enrolled in your class", color: "green" },
                      { text: "Science Quiz reached 12 submissions", color: "purple" },
                      { text: "Programming Logic Test deadline approaching", color: "orange" }
                    ].map((activity, index) => (
                      <div key={index} className={`flex items-center space-x-3 p-3 bg-${activity.color}-50 rounded-lg`}>
                        <div className={`h-2 w-2 bg-${activity.color}-600 rounded-full`}></div>
                        <p className="text-sm">{activity.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <h3 className="text-lg font-semibold mb-4">Performance Insights</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Mathematics Assessment</span>
                      <span className="text-sm text-green-600 font-semibold">+5% from last month</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Science Quiz</span>
                      <span className="text-sm text-green-600 font-semibold">+12% from last month</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Programming Logic</span>
                      <span className="text-sm text-red-600 font-semibold">-2% from last month</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Exams Tab */}
          {activeTab === 'exams' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">My Exams</h2>
                  <p className="text-gray-600">Manage your assessments and track student participation</p>
                </div>
                <button className="btn btn-primary">
                  ✏️ Create New Exam
                </button>
              </div>

              <div className="grid gap-6">
                {demoExams.map((exam) => (
                  <div key={exam.id} className="card hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="text-xl font-semibold text-gray-900">{exam.title}</h3>
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                            exam.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {exam.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <div className="text-sm text-blue-600 font-medium">Exam Code</div>
                            <div className="text-lg font-bold text-blue-900">{exam.examCode}</div>
                          </div>
                          <div className="bg-purple-50 p-3 rounded-lg">
                            <div className="text-sm text-purple-600 font-medium">Questions</div>
                            <div className="text-lg font-bold text-purple-900">{exam.questionCount}</div>
                          </div>
                          <div className="bg-green-50 p-3 rounded-lg">
                            <div className="text-sm text-green-600 font-medium">Students</div>
                            <div className="text-lg font-bold text-green-900">{exam.studentCount}</div>
                          </div>
                          <div className="bg-orange-50 p-3 rounded-lg">
                            <div className="text-sm text-orange-600 font-medium">Avg Score</div>
                            <div className="text-lg font-bold text-orange-900">{exam.averageScore}%</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="ml-6 space-y-2">
                        <button className="btn btn-primary w-full">👀 View Details</button>
                        <button className="btn btn-secondary w-full">⚙️ Edit Exam</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Students Tab */}
          {activeTab === 'students' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">My Students</h2>
                  <p className="text-gray-600">Manage your enrolled students and track their progress</p>
                </div>
                <button className="btn btn-primary">
                  👤 Add New Student
                </button>
              </div>

              {/* Active/Archived Tabs - ARCHIVE FEATURE */}
              <div className="bg-white border-2 border-blue-500 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 mb-3 font-semibold">📂 View Students by Status:</p>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => {
                      console.log('Switching to Active tab');
                      setStudentViewTab('active');
                    }}
                    className={`flex-1 py-3 px-6 rounded-md text-base font-bold transition-colors ${
                      studentViewTab === 'active'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    ✅ Active Students ({students.length})
                  </button>
                  <button
                    onClick={() => {
                      console.log('Switching to Archived tab');
                      setStudentViewTab('archived');
                    }}
                    className={`flex-1 py-3 px-6 rounded-md text-base font-bold transition-colors ${
                      studentViewTab === 'archived'
                        ? 'bg-orange-600 text-white shadow-lg'
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    📦 Archived Students ({archivedStudents.length})
                  </button>
                </div>
              </div>

              {/* Students List */}
              {isLoading ? (
                <div className="card text-center py-12">
                  <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading students...</p>
                </div>
              ) : studentViewTab === 'active' ? (
                students.length === 0 ? (
                  <div className="card text-center py-12">
                    <div className="text-6xl mb-4">👥</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Students</h3>
                    <p className="text-gray-600 mb-6">Start building your class by adding students</p>
                    <button className="btn btn-primary">
                      👤 Add Your First Student
                    </button>
                  </div>
                ) : (
                  <div className="card">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {students.map((student) => (
                            <tr key={student.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="bg-blue-100 rounded-full w-10 h-10 flex items-center justify-center">
                                    <span className="text-blue-600 font-semibold">
                                      {student.firstName?.[0]}{student.lastName?.[0]}
                                    </span>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {student.firstName} {student.lastName}
                                    </div>
                                    <div className="text-sm text-gray-500">{student.username}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                  Active
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(student.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap space-x-2">
                                <button className="btn btn-secondary text-sm">
                                  👀 View
                                </button>
                                <button 
                                  onClick={() => handleArchiveStudent(student.id, `${student.firstName} ${student.lastName}`)}
                                  className="btn bg-orange-500 hover:bg-orange-600 text-white text-sm"
                                >
                                  📦 Archive
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              ) : (
                archivedStudents.length === 0 ? (
                  <div className="card text-center py-12">
                    <div className="text-6xl mb-4">📦</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Archived Students</h3>
                    <p className="text-gray-600">Archived students will appear here</p>
                  </div>
                ) : (
                  <div className="card">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Archived On</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {archivedStudents.map((student) => (
                            <tr key={student.id} className="bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="bg-gray-300 rounded-full w-10 h-10 flex items-center justify-center">
                                    <span className="text-gray-600 font-semibold">
                                      {student.firstName?.[0]}{student.lastName?.[0]}
                                    </span>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-700">
                                      {student.firstName} {student.lastName}
                                    </div>
                                    <div className="text-sm text-gray-500">{student.username}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                                  Archived
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(student.updatedAt).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap space-x-2">
                                <button 
                                  onClick={() => handleRestoreStudent(student.id, `${student.firstName} ${student.lastName}`)}
                                  className="btn bg-green-500 hover:bg-green-600 text-white text-sm"
                                >
                                  ↩️ Restore
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          {/* Scores Tab */}
          {activeTab === 'scores' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Score Records</h2>
                <p className="text-gray-600">Track student performance across all assessments</p>
              </div>

              <div className="card">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {demoScores.map((score) => (
                        <tr key={score.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="bg-purple-100 rounded-full w-8 h-8 flex items-center justify-center">
                                <span className="text-purple-600 font-semibold text-sm">
                                  {score.student.firstName[0]}{score.student.lastName[0]}
                                </span>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {score.student.firstName} {score.student.lastName}
                                </div>
                                <div className="text-sm text-gray-500">{score.student.username}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {score.exam}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {score.score}/{score.totalMarks}
                            </div>
                            <div className={`text-sm font-semibold ${
                              score.percentage >= 80 
                                ? 'text-green-600' 
                                : score.percentage >= 60 
                                ? 'text-yellow-600' 
                                : 'text-red-600'
                            }`}>
                              {score.percentage.toFixed(1)}%
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              score.percentage >= 80 
                                ? 'bg-green-100 text-green-800' 
                                : score.percentage >= 60 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {score.percentage >= 80 ? 'A' : score.percentage >= 60 ? 'B' : 'C'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(score.completedAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Analytics & Insights</h2>
                <p className="text-gray-600">Detailed performance analytics and trends</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                  <h3 className="text-lg font-semibold mb-4">Class Performance Trends</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Overall Class Average</span>
                      <span className="text-2xl font-bold text-blue-600">78.9%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '78.9%' }}></div>
                    </div>
                    <div className="text-sm text-gray-600">Based on all completed assessments</div>
                  </div>
                </div>

                <div className="card">
                  <h3 className="text-lg font-semibold mb-4">Recent Exam Performance</h3>
                  <div className="space-y-3">
                    {demoExams.map((exam) => (
                      <div key={exam.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">{exam.title}</div>
                          <div className="text-sm text-gray-600">{exam.studentCount} students</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">{exam.averageScore}%</div>
                          <div className="text-xs text-gray-500">average</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Student Engagement</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600">92%</div>
                    <div className="text-sm text-green-700">Exam Completion Rate</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">7.5</div>
                    <div className="text-sm text-blue-700">Average Time (minutes)</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-3xl font-bold text-purple-600">15</div>
                    <div className="text-sm text-purple-700">Active Students</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherPage;