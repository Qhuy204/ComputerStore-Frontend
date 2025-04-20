import { useRouter } from 'next/router';
import nhanvienService from '../Services/nhanvienService';

const LogoutButton = () => {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await nhanvienService.logout();
            
            // Chuyển hướng về trang đăng nhập
            router.push('/login');
        } catch (error) {
            console.error('Lỗi khi đăng xuất:', error);
            // Xử lý lỗi nếu cần
        }
    };

    return (
        <Button 
            label="Đăng Xuất" 
            onClick={handleLogout} 
            className="p-button-danger"
        />
    );
};

export default LogoutButton;