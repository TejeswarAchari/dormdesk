import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Filter } from 'lucide-react';
import { toast } from 'react-hot-toast';
import DashboardLayout from '../components/layout/DashboardLayout';
import api from '../services/api';
import useDebounce from '../hooks/useDebounce';
import Shimmer from '../components/ui/Shimmer';

const CaretakerDashboard = () => {
  // 1. State Management
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Filters
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Debounce the search term (Wait 500ms after typing stops)
  const debouncedSearch = useDebounce(searchTerm, 500);

  // 2. Fetch Logic
  const fetchComplaints = async () => {
    try {
      setLoading(true);
      // Build Query String
      const params = new URLSearchParams({
        page,
        limit: 10,
        ...(statusFilter && { status: statusFilter }),
        ...(categoryFilter && { category: categoryFilter }),
        ...(debouncedSearch && { search: debouncedSearch }),
      });

      const { data } = await api.get(`/complaints?${params}`);
      setComplaints(data.complaints);
      setTotalPages(data.pages);
      setLoading(false);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch data');
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (isRefreshing) return; // Prevent spamming
    
    setIsRefreshing(true);
    await fetchComplaints();
    
    // Throttle: Keep button disabled for 2 seconds after fetch
    setTimeout(() => {
      setIsRefreshing(false);
    }, 2000);
  };

  // 3. Effects
  // Re-fetch when any filter or page changes
  useEffect(() => {
    fetchComplaints();
  }, [page, statusFilter, categoryFilter, debouncedSearch]);

  // Reset page to 1 when filters change (so we don't get stuck on empty Page 5)
  useEffect(() => {
    setPage(1);
  }, [statusFilter, categoryFilter, debouncedSearch]);

  // 4. Update Status Logic
  const handleStatusChange = async (id, newStatus) => {
    // Optimistic UI Update (Update screen before server responds for speed)
    const oldComplaints = [...complaints];
    const updatedList = complaints.map(c => 
      c._id === id ? { ...c, status: newStatus } : c
    );
    setComplaints(updatedList);

    try {
      await api.patch(`/complaints/${id}/status`, { status: newStatus });
      toast.success('Status updated');
    } catch (error) {
      // Revert if failed
      setComplaints(oldComplaints);
      toast.error('Failed to update status');
    }
  };

  // Helper for Badge Colors
  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-700';
      case 'in_progress': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-orange-100 text-orange-700';
    }
  };

  return (
    <DashboardLayout title="Admin Dashboard">
      {/* --- Filter Bar --- */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-primary-100 mb-6 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by Room (e.g. A-101)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap gap-3">
          
          {/* Status Filter */}
          <div className="relative">
             <Filter className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
             <select 
               value={statusFilter}
               onChange={(e) => setStatusFilter(e.target.value)}
               className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 bg-white appearance-none"
             >
               <option value="">All Status</option>
               <option value="open">Open</option>
               <option value="in_progress">In Progress</option>
               <option value="resolved">Resolved</option>
             </select>
          </div>

          {/* Category Filter */}
          <select 
             value={categoryFilter}
             onChange={(e) => setCategoryFilter(e.target.value)}
             className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 bg-white"
           >
             <option value="">All Categories</option>
             <option value="water">Water</option>
             <option value="electricity">Electricity</option>
             <option value="internet">Internet</option>
             <option value="cleaning">Cleaning</option>
          </select>

          {/* Refresh Button */}
        <button 
         onClick={handleRefresh}
         disabled={isRefreshing || loading} // Disable while throttling
         className={`p-2 rounded-lg transition-colors ${
           isRefreshing ? 'bg-gray-100 text-gray-400' : 'text-gray-500 hover:bg-gray-100'
         }`}
         title="Refresh Data"
       >
         <RefreshCw className={`w-5 h-5 ${isRefreshing || loading ? 'animate-spin' : ''}`} />
       </button>
        </div>
      </div>

      {/* --- Data Table --- */}
      <div className="bg-white rounded-xl shadow-sm border border-primary-100 overflow-hidden">
        {loading && complaints.length === 0 ? (
           <div className="p-12 text-center text-gray-500"><Shimmer /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-primary-50 border-b border-primary-100">
                <tr>
                  <th className="px-6 py-4 font-semibold text-dark-800">Room</th>
                  <th className="px-6 py-4 font-semibold text-dark-800">Student</th>
                  <th className="px-6 py-4 font-semibold text-dark-800">Issue</th>
                  <th className="px-6 py-4 font-semibold text-dark-800">Date</th>
                  <th className="px-6 py-4 font-semibold text-dark-800">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {complaints.length > 0 ? (
                  complaints.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-dark-900">{item.roomNumber}</td>
                      <td className="px-6 py-4 text-gray-600">{item.student?.name || 'Unknown'}</td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <span className="block font-medium text-gray-900 capitalize">{item.category}</span>
                          <span className="text-gray-500 truncate block">{item.description}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                         {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        {/* Status Dropdown Logic */}
                        <select
                          value={item.status}
                          onChange={(e) => handleStatusChange(item._id, e.target.value)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold border-none focus:ring-2 focus:ring-primary-500 cursor-pointer ${getStatusColor(item.status)}`}
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      No complaints found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
           <span className="text-sm text-gray-600">Page {page} of {totalPages || 1}</span>
           <div className="flex gap-2">
             <button
               disabled={page === 1}
               onClick={() => setPage(p => Math.max(1, p - 1))}
               className="px-3 py-1 border rounded hover:bg-white disabled:opacity-50"
             >
               Previous
             </button>
             <button
               disabled={page >= totalPages}
               onClick={() => setPage(p => p + 1)}
               className="px-3 py-1 border rounded hover:bg-white disabled:opacity-50"
             >
               Next
             </button>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CaretakerDashboard;