// // middleware/axiosConfig.js
// import axios from 'axios';

// const configureAxios = () => {
//     axios.interceptors.request.use(
//         config => {
//             const token = localStorage.getItem('authToken') || 
//                          sessionStorage.getItem('authToken');
//             if (token) {
//                 config.headers['Authorization'] = `Bearer ${token}`;
//             }
//             return config;
//         },
//         error => Promise.reject(error)
//     );

//     axios.interceptors.response.use(
//         response => response,
//         error => {
//             if (error.response?.status === 401) {
//                 // Xử lý token hết hạn
//                 localStorage.removeItem('authToken');
//                 sessionStorage.removeItem('authToken');
//                 window.location.href = '/login';
//             }
//             return Promise.reject(error);
//         }
//     );
// };

// export default configureAxios;