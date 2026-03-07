import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL + '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// REQUEST INTERCEPTOR
// chạy trước request, tự động đính kèm token vào header
api.interceptors.request.use(config => {
    // Lấy token từ localStorage
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// RESPONSE INTERCEPTOR
// Chạy sau mỗi response
// Nếu server trả về 401 (token hết hạn) → tự động logout
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if(error.response?.status === 401) {
            // xóa token cũ
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // chuyển hướng về trang login
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;