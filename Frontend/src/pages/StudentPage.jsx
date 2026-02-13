import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { examAPI, handleAPIError } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const StudentPage = () => {
  const { user, logout } = useAuth();
  const [isSearching, setIsSearching] = useState(false);
  const [examDetails, setExamDetails] = useState(null);
  const [joinedExams, setJoinedExams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ongoing');

  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  // Load student's joined exams
  useEffect(() => {
    const loadJoinedExams = async () => {
      try {
        const response = await examAPI.getExams();
        if (response.status === 'success') {
          setJoinedExams(response.data.exams || []);
        }
      } catch (error) {
        console.error('Failed to load exams:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadJoinedExams();
  }, []);

  // Search for exam by code
  const onSearchExam = async (data) => {
    try {
      setIsSearching(true);
      setExamDetails(null);

      const response = await examAPI.getExamByCode(data.examCode.toUpperCase());
      
      if (response.status === 'success') {
        setExamDetails(response.data);
        toast.success('Exam found!');
      }
    } catch (error) {
      const errorInfo = handleAPIError(error);
      toast.error(errorInfo.message);
      setExamDetails(null);
    } finally {
      setIsSearching(false);
    }
  };

  // Join exam
  const onJoinExam = async (examCode) => {
    try {
      const response = await examAPI.joinExam({ examCode });
      if (response.status === 'success') {
        toast.success('Successfully joined exam!');
        setExamDetails(null);
        reset();
        // Reload exams
        const examsResponse = await examAPI.getExams();
        if (examsResponse.status === 'success') {
          setJoinedExams(examsResponse.data.exams || []);
        }
      }
    } catch (error) {
      const errorInfo = handleAPIError(error);
      toast.error(errorInfo.message);
    }
  };

  const ongoingExams = joinedExams.filter(exam => !exam.scores?.length);
  const finishedExams = joinedExams.filter(exam => exam.scores?.length > 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="flex justify-between items-center px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">iTECHS Student Portal</h1>
            <p className="text-gray-600">Welcome back, {user?.firstName || user?.username}!</p>
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
            {/* Quick Stats */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-xl mb-6">
              <h3 className="text-lg font-semibold mb-2">My Progress</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{joinedExams.length}</div>
                  <div className="text-sm opacity-90">Total Exams</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{finishedExams.length}</div>
                  <div className="text-sm opacity-90">Completed</div>
                </div>
              </div>
            </div>

            {/* Exam Tabs */}
            <div className="mb-4">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('ongoing')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'ongoing'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Ongoing ({ongoingExams.length})
                </button>
                <button
                  onClick={() => setActiveTab('finished')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'finished'
                      ? 'bg-white text-green-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Finished ({finishedExams.length})
                </button>
              </div>
            </div>

            {/* Exam List */}
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading exams...</p>
                </div>
              ) : (
                <>
                  {activeTab === 'ongoing' && (
                    <>
                      {ongoingExams.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="text-4xl mb-2">📝</div>
                          <p className="text-gray-500">No ongoing exams</p>
                          <p className="text-sm text-gray-400">Enter an exam code to get started</p>
                        </div>
                      ) : (
                        ongoingExams.map((exam) => (
                          <div key={exam.id} className="bg-blue-50 border border-blue-200 rounded-lg p-4 hover:bg-blue-100 transition-colors cursor-pointer">
                            <h4 className="font-medium text-gray-900 mb-1">{exam.title}</h4>
                            <p className="text-sm text-gray-600 mb-2">Code: {exam.examCode}</p>
                            <div className="flex justify-between items-center text-xs text-gray-500">
                              <span>⏱️ {exam.timeLimit || 'No limit'}</span>
                              <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded">Start Exam</span>
                            </div>
                          </div>
                        ))
                      )}
                    </>
                  )}

                  {activeTab === 'finished' && (
                    <>
                      {finishedExams.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="text-4xl mb-2">🏆</div>
                          <p className="text-gray-500">No completed exams</p>
                          <p className="text-sm text-gray-400">Complete an exam to see results</p>
                        </div>
                      ) : (
                        finishedExams.map((exam) => (
                          <div key={exam.id} className="bg-green-50 border border-green-200 rounded-lg p-4 hover:bg-green-100 transition-colors cursor-pointer">
                            <h4 className="font-medium text-gray-900 mb-1">{exam.title}</h4>
                            <p className="text-sm text-gray-600 mb-2">Code: {exam.examCode}</p>
                            <div className="flex justify-between items-center text-xs text-gray-500">
                              <span>✅ Completed</span>
                              <span className="bg-green-200 text-green-800 px-2 py-1 rounded">View Results</span>
                            </div>
                          </div>
                        ))
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Join New Exam</h2>
              <p className="text-gray-600">Enter your exam code to get started</p>
            </div>

            {/* Exam Code Input */}
            <div className="card mb-8">
              <form onSubmit={handleSubmit(onSearchExam)} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Exam Code
                  </label>
                  <input
                    type="text"
                    placeholder="Enter 6-character exam code (e.g., ABC123)"
                    className="input-field text-center text-lg tracking-wider uppercase font-mono"
                    maxLength={6}
                    {...register('examCode', {
                      required: 'Exam code is required',
                      pattern: {
                        value: /^[A-Z0-9]{6}$/,
                        message: 'Exam code must be 6 alphanumeric characters',
                      },
                    })}
                  />
                  {errors.examCode && (
                    <p className="text-red-500 text-sm mt-1">{errors.examCode.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSearching}
                  className="w-full btn btn-primary py-3 text-lg"
                >
                  {isSearching ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Searching...
                    </div>
                  ) : (
                    'Find Exam'
                  )}
                </button>
              </form>
            </div>

            {/* Exam Details */}
            {examDetails && (
              <div className="card border-green-200 bg-green-50 animate-slide-up">
                <div className="flex items-start space-x-4">
                  <div className="bg-green-100 rounded-full p-3">
                    <span className="text-2xl">✅</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-green-800 mb-2">Exam Found!</h3>
                    <div className="space-y-2 text-sm text-gray-700">
                      <p><strong>Title:</strong> {examDetails.title}</p>
                      <p><strong>Code:</strong> {examDetails.examCode}</p>
                      {examDetails.description && (
                        <p><strong>Description:</strong> {examDetails.description}</p>
                      )}
                      {examDetails.timeLimit && (
                        <p><strong>Duration:</strong> {examDetails.timeLimit} minutes</p>
                      )}
                      {examDetails.totalMarks && (
                        <p><strong>Total Marks:</strong> {examDetails.totalMarks}</p>
                      )}
                    </div>
                    <button
                      onClick={() => onJoinExam(examDetails.examCode)}
                      className="mt-4 btn btn-success"
                    >
                      Join This Exam
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Demo Codes */}
            {joinedExams.length === 0 && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Demo Exam Codes</h3>
                <p className="text-gray-600 mb-4">Try these sample codes to explore the platform:</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { code: 'DEMO01', title: 'Basic Math' },
                    { code: 'DEMO02', title: 'Science Quiz' },
                    { code: 'DEMO03', title: 'Programming' },
                    { code: 'DEMO04', title: 'General Knowledge' },
                  ].map((demo) => (
                    <div key={demo.code} className="bg-gray-50 p-3 rounded-lg text-center hover:bg-gray-100 transition-colors cursor-pointer">
                      <div className="font-mono font-bold text-blue-600">{demo.code}</div>
                      <div className="text-xs text-gray-600">{demo.title}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentPage;