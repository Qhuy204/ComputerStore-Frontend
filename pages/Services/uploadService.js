// uploadService.js
import axios from 'axios';

const cloudinaryUpload = async (file) => {
    try {
        const formData = new FormData();
        formData.append('file', file);

        console.log('File to upload:', file);

        const response = await axios.post('http://localhost:5000/uploads/cloudinary-upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        
        console.log('Upload response:', response.data);
        
        return response.data;
    } catch (error) {
        console.error('Full upload error:', error);
        console.error('Error response:', error.response ? error.response.data : 'No response data');
        
        throw error;
    }
};

export default cloudinaryUpload;