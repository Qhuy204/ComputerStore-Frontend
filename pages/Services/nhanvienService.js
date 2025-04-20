import axios from 'axios';

const API_URL = 'http://localhost:5000/users';
const GET_NV_API_URL = 'http://localhost:5000/users/list/admin'
// const LOGIN_API_URL = 'http://localhost:5000/users/auth/login'; 
var token = '';

const nhanvienService = {

  login: async (username, password) => {
    try {
        const response = await axios.post(`${API_URL}/login`, { username, password });
        return response.data;  
    } catch (error) {
        console.error('Error logging in:', error.response.data);
        throw error.response.data;
    }
  },

  logout: async () => {
    try {
        const response = await axios.post(`${API_URL}/logout`);
        
        // Xóa token khỏi localStorage/sessionStorage
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('authToken');
        localStorage.removeItem('userData');

        return response.data;
    } catch (error) {
        console.error('Lỗi đăng xuất:', error);
        throw error;
    }
  },

  getAllnhanviens: async () => {
    try {
      const url = GET_NV_API_URL;
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
  },

  getnhanvienById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching record by ID:', error);
      throw error;
    }
  },

  addnhanvien: async (nhanvienData) => {
    try {
      // Log dữ liệu trước khi gửi
      console.log('Adding admin data:', JSON.stringify(nhanvienData));
      const response = await axios.post(API_URL, nhanvienData);
      return response.data;
    } catch (error) {
      console.error('Error adding record:', error);
      throw error;
    }
  },

  updatenhanvien: async (nhanvienData) => {
    try {
      // Sử dụng admin_id để xác định record cần cập nhật
      const adminId = nhanvienData.user_id;
      
      // Log dữ liệu trước khi gửi
      console.log('Updating admin data:', JSON.stringify(nhanvienData));
      
      const response = await axios.put(`${API_URL}/${adminId}`, nhanvienData);
      return response.data;
    } catch (error) {
      console.error('Error updating record:', error);
      throw error;
    }
  },

  deletenhanvien: async (adminId) => {
    try {
      console.log('Deleting admin with ID:', adminId);
      const response = await axios.delete(`${API_URL}/${adminId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting record:', error);
      throw error;
    }
  },

  register: async (userData) => {
    try {
      // Thêm thông tin mặc định cho người dùng đăng ký
      const registerData = {
        ...userData,
        is_admin: false,  // Mặc định không phải admin
        email_verified: false,
        registration_date: new Date(),
        last_login: new Date()
      };
  
      const response = await axios.post(`${API_URL}/register`, registerData);
      return response.data;
    } catch (error) {
      console.error('Error registering:', error.response?.data);
      throw error.response?.data;
    }
  },

  checkUsername: function(username) {
    // We can reuse the same endpoint from usersService since they share the same Users table
    return axios.get(`${API_URL}/check-username/${encodeURIComponent(username)}`)
      .then(response => {
        if (response.data.success) {
          return response.data.exists;
        }
        throw new Error('Failed to check username');
      });
  },
};

export default nhanvienService;