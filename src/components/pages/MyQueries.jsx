import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import BrandLoader from '../BrandLoader';
import { Mail, Trash2, MessageSquare, AlertCircle, MessageCircle } from 'lucide-react';
import {
  fetchUserQueries,
  deleteQuery,
  selectQueries,
  selectQueriesLoading,
  selectQueriesError
} from '../../features/queries/queriesSlice';

const MyQueries = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const queries = useSelector(selectQueries);
  const loading = useSelector(selectQueriesLoading);
  const error = useSelector(selectQueriesError);
  const token = useSelector(state => state.auth.token);
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);

  useEffect(() => {
    if (!token || !isAuthenticated) {
      navigate('/login');
      return;
    }
    dispatch(fetchUserQueries());
  }, [dispatch, token, isAuthenticated, navigate]);

  const handleDelete = (queryId) => {
    if (window.confirm('Are you sure you want to delete this query?')) {
      dispatch(deleteQuery(queryId));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <BrandLoader text="Loading queries..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-12 px-3 sm:px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
          <MessageSquare className="text-indigo-600 w-6 h-6 sm:w-8 sm:h-8" size={32} />
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">My Queries</h1>
          <span className="bg-indigo-100 text-indigo-700 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-bold">
            {queries.length} Queries
          </span>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
            <AlertCircle className="text-red-600" size={20} />
            <span className="text-red-700 font-semibold">{error}</span>
          </div>
        )}

        {queries.length === 0 ? (
          <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-12 text-center shadow-sm border border-gray-100">
            <div className="bg-indigo-50 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <MessageCircle className="text-indigo-600 w-6 h-6 sm:w-8 sm:h-8" size={32} />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">No queries yet</h2>
            <p className="text-gray-500 mb-6 sm:mb-8 text-sm sm:text-base">You haven't sent any queries. Contact us if you have any questions!</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {queries.map((query) => (
              <div key={query._id} className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 flex-shrink-0">
                      <Mail size={24} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{query.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          query.status === 'resolved' ? 'bg-green-100 text-green-700' :
                          (!query.status || query.status === 'pending') ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {query.status || 'Pending'}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{query.email}</p>
                      <p className="text-gray-700 mb-3">{query.message}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>📱 {query.phone}</span>
                        <span>📅 {new Date(query.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(query._id)}
                    className="flex-shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition"
                    title="Delete query"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
                
                {query.response && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm font-bold text-gray-700 mb-2">Response from Support:</p>
                    <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{query.response}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyQueries;
