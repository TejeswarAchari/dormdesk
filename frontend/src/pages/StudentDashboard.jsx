import React, { useState, useEffect } from "react";
import { Plus, Clock, Search, Filter, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "react-hot-toast";
import DashboardLayout from "../components/layout/DashboardLayout";
import PageTransition from "../components/layout/PageTransition";
import api from "../services/api";
import ComplaintModal from "../components/ui/ComplaintModal";
import Shimmer from "../components/ui/Shimmer";
import useDebounce from "../hooks/useDebounce";
import { formatDate, getStatusColor } from "../utils/helpers";
import { VALID_CATEGORIES, VALID_STATUSES, CATEGORY_LABELS, STATUS_LABELS } from "../utils/constants";

const StudentDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filters State
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      
      // Build Query Params including filters
      const params = new URLSearchParams({
        page,
        limit: 5, // Keep 5 for student view as per your previous preference
        ...(statusFilter && { status: statusFilter }),
        ...(categoryFilter && { category: categoryFilter }),
        ...(debouncedSearch && { search: debouncedSearch }),
      });

      const { data } = await api.get(`/complaints?${params}`);
      setComplaints(data.complaints);
      setTotalPages(data.pages);
      setLoading(false);
    } catch (error) {
      toast.error("Failed to load complaints");
      setLoading(false);
    }
  };

  // Re-fetch when any dependency changes
  useEffect(() => {
    fetchComplaints();
  }, [page, statusFilter, categoryFilter, debouncedSearch]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, categoryFilter, debouncedSearch]);

  return (
    <PageTransition>
      <DashboardLayout title="My Complaints">
        {/* Header Action Area */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-6">
          <div className="w-full sm:w-auto">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-dark-900">Welcome Back! 👋</h1>
            <p className="text-sm sm:text-base text-dark-800 mt-1">Here is the history of your raised issues.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 sm:px-5 py-2.5 rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Raise Complaint</span>
          </button>
        </div>

      {/* --- FILTER & SEARCH BAR (New Addition) --- */}
      <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-primary-100 mb-6 flex flex-col lg:flex-row gap-3 sm:gap-4 justify-between items-stretch lg:items-center">
        
        {/* Search */}
        <div className="relative w-full lg:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search descriptions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-9 sm:pl-10 pr-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-2 sm:gap-3">
          {/* Status Filter */}
          <div className="relative flex-1 md:flex-none">
             <Filter className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
             <select 
               value={statusFilter}
               onChange={(e) => setStatusFilter(e.target.value)}
               className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 bg-white appearance-none"
             >
               <option value="">All Status</option>
               {VALID_STATUSES.map(status => (
                 <option key={status} value={status}>{STATUS_LABELS[status]}</option>
               ))}
             </select>
          </div>

          {/* Category Filter */}
          <select 
             value={categoryFilter}
             onChange={(e) => setCategoryFilter(e.target.value)}
             className="flex-1 md:flex-none px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 bg-white"
           >
             <option value="">All Categories</option>
             {VALID_CATEGORIES.map(cat => (
               <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
             ))}
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-primary-100 overflow-hidden">
        {loading ? (
          <div className="p-6 sm:p-8 text-center text-gray-500"><Shimmer /></div>
        ) : complaints.length === 0 ? (
          <div className="p-8 sm:p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-primary-400" />
            </div>
            <h3 className="text-lg font-medium text-dark-900">No complaints found</h3>
            <p className="text-gray-500 mt-1">Try adjusting your filters or raise a new issue.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm min-w-[640px]">
              <thead className="bg-primary-50 border-b border-primary-100">
                <tr>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 font-semibold text-dark-800">Date</th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 font-semibold text-dark-800">Category</th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 font-semibold text-dark-800 w-1/2">Description</th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 font-semibold text-dark-800">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {complaints.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-gray-600 whitespace-nowrap text-xs sm:text-sm">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                      <span className="capitalize font-medium text-dark-900 text-xs sm:text-sm">{item.category}</span>
                    </td>
                    <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-gray-600 text-xs sm:text-sm">
                      <div className="line-clamp-2 lg:line-clamp-1">{item.description}</div>
                    </td>
                    <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(item.status)} capitalize whitespace-nowrap`}>
                        {item.status.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {complaints.length > 0 && (
          <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
            <span className="text-xs sm:text-sm text-gray-600">Page {page} of {totalPages}</span>
            <div className="flex gap-1 sm:gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 sm:p-2 border rounded hover:bg-white disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 sm:p-2 border rounded hover:bg-white disabled:opacity-50 transition-colors"
              >
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

        <ComplaintModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => { fetchComplaints(); setPage(1); }}
        />
      </DashboardLayout>
    </PageTransition>
  );
};

export default StudentDashboard;