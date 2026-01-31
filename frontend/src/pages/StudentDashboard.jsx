import React, { useState, useEffect } from "react";
import { Plus, Clock, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "react-hot-toast";
import DashboardLayout from "../components/layout/DashboardLayout";
import api from "../services/api";
import ComplaintModal from "../components/ui/ComplaintModal";
import Shimmer from "../components/ui/Shimmer";
const StudentDashboard = () => {
  // State
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false); // We will use this next

  // Fetch Data
  const fetchComplaints = async () => {
    try {
      setLoading(true);
      // Query Params: page number & limit (10 per page)
      const { data } = await api.get(`/complaints?page=${page}&limit=5`);
      setComplaints(data.complaints);
      setTotalPages(data.pages);
      setLoading(false);
    } catch (error) {
      toast.error("Failed to load complaints");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [page]); // Re-fetch when page changes

  // Helper for Status Badge Color
  const getStatusColor = (status) => {
    switch (status) {
      case "resolved":
        return "bg-green-100 text-green-700 border-green-200";
      case "in_progress":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default:
        return "bg-orange-100 text-orange-700 border-orange-200";
    }
  };

  return (
    <DashboardLayout title="My Complaints">
      {/* Header Action Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Welcome Back! 👋</h1>
          <p className="text-dark-800">
            Here is the history of your raised issues.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-5 py-2.5 rounded-lg shadow-sm transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Raise Complaint</span>
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-primary-100 overflow-hidden">
        {loading ? (
          // Simple Loading Skeleton
          <div className="p-8 text-center text-gray-500">
            <Shimmer />
          </div>
        ) : complaints.length === 0 ? (
          // Empty State
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-primary-400" />
            </div>
            <h3 className="text-lg font-medium text-dark-900">
              No complaints found
            </h3>
            <p className="text-gray-500 mt-1">
              You haven't raised any issues yet.
            </p>
          </div>
        ) : (
          // Data Table
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-primary-50 border-b border-primary-100">
                <tr>
                  <th className="px-6 py-4 font-semibold text-dark-800">
                    Date
                  </th>
                  <th className="px-6 py-4 font-semibold text-dark-800">
                    Category
                  </th>
                  <th className="px-6 py-4 font-semibold text-dark-800 w-1/2">
                    Description
                  </th>
                  <th className="px-6 py-4 font-semibold text-dark-800">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {complaints.map((item) => (
                  <tr
                    key={item._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="capitalize font-medium text-dark-900">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 truncate max-w-xs">
                      {item.description}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(item.status)} capitalize`}
                      >
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
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-2 border rounded hover:bg-white disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-2 border rounded hover:bg-white disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <ComplaintModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchComplaints(); // Refresh the list
          setPage(1); // Reset to first page
        }}
      />
    </DashboardLayout>
  );
};

export default StudentDashboard;
