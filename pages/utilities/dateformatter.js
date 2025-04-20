/**
 * Format date utilities for application
 */

/**
 * Format date to YYYY-MM-DD string
 * @param {Date|string} date - Date object or ISO string date
 * @returns {string} Formatted date string in YYYY-MM-DD format
 */
export const formatDateToYYYYMMDD = (date) => {
    if (!date) return null;
    
    const d = date instanceof Date ? date : new Date(date);
    
    // Check if date is valid
    if (isNaN(d.getTime())) return null;
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  };
  
  /**
   * Parse date string from MySQL format to Date object
   * @param {string} dateString - Date string from MySQL
   * @returns {Object} Object with day, month, year
   */
  export const parseDateToComponents = (dateString) => {
    if (!dateString) return { day: null, month: null, year: null };
    
    const d = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(d.getTime())) return { day: null, month: null, year: null };
    
    return {
      day: d.getDate(),
      month: d.getMonth() + 1,
      year: d.getFullYear()
    };
  };
  
  /**
   * Format date for display in UI
   * @param {Date|string} date - Date object or ISO string date
   * @returns {string} Formatted date string for display
   */
  export const formatDateForDisplay = (date) => {
    if (!date) return '';
    
    const d = date instanceof Date ? date : new Date(date);
    
    // Check if date is valid
    if (isNaN(d.getTime())) return '';
    
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return d.toLocaleDateString('vi-VN', options);
  };