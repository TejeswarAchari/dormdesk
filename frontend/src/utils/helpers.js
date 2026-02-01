/**
 * Formats a raw ISO date string into a readable format
 * @param {string} dateString
 * @returns {string} e.g. "Oct 25, 2025"
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Returns Tailwind classes for status badges
 * @param {string} status
 * @returns {string} Tailwind class string
 */
export const getStatusColor = (status) => {
  switch (status) {
    case 'resolved':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'in_progress':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    default: // 'open'
      return 'bg-orange-100 text-orange-700 border-orange-200';
  }
};

/**
 * Basic Email Validation Regex
 * @param {string} email
 * @returns {boolean}
 */
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};
