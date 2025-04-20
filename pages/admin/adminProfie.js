import React, { useState, useEffect } from 'react';
import { TabView, TabPanel } from 'primereact/tabview';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Chip } from 'primereact/chip';
import { Dialog } from 'primereact/dialog';
import { Password } from 'primereact/password';
import { Toast } from 'primereact/toast';
import { Calendar } from 'primereact/calendar';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import usersService from '../Services/usersService';

// Utility function to format date
const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${year}/${month}/${day}`;
};

const AdminProfilePage = () => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [showPasswordDialog, setShowPasswordDialog] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [profileData, setProfileData] = useState({
        userId: 0,
        username: '',
        email: '',
        fullName: '',
        phoneNumber: '',
        birthday: null,
        emailVerified: 0,
        gender: '',
        lastLogin: '',
        registrationDate: '',
        isAdmin: 0
    });
    const [loading, setLoading] = useState(false);
    const toastRef = React.useRef(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedUserData = JSON.parse(localStorage.getItem('userData') || '{}');
            if (storedUserData) {
                setProfileData({
                    userId: storedUserData.user_id || 0,
                    username: storedUserData.username || '',
                    email: storedUserData.email || '',
                    fullName: storedUserData.full_name || '',
                    phoneNumber: storedUserData.phone_number || '',
                    birthday: storedUserData.birthday ? new Date(storedUserData.birthday) : null,
                    emailVerified: storedUserData.email_verified || 0,
                    gender: storedUserData.gender || '',
                    lastLogin: storedUserData.last_login || '',
                    registrationDate: storedUserData.registration_date || '',
                    isAdmin: storedUserData.is_admin || 0
                });
            }
        }
    }, []);

    const genderOptions = [
        { name: 'Nam', code: 'male' },
        { name: 'Nữ', code: 'female' },
        { name: 'Khác', code: 'other' }
    ];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleDropdownChange = (e, field) => {
        setProfileData(prevData => ({
            ...prevData,
            [field]: e.value.code
        }));
    };

    const handleUpdateProfile = async () => {
        setLoading(true);
        try {
            // Prepare the update payload
            const updatePayload = {
                user_id: profileData.userId,
                full_name: profileData.fullName,
                email: profileData.email,
                phone_number: profileData.phoneNumber,
                birthday: profileData.birthday ? formatDate(profileData.birthday) : null,
                gender: profileData.gender
            };

            // Call the update service
            const response = await usersService.update(updatePayload);

            // Update local storage
            const existingUserData = JSON.parse(localStorage.getItem('userData') || '{}');
            const updatedUserData = {
                ...existingUserData,
                ...updatePayload
            };
            localStorage.setItem('userData', JSON.stringify(updatedUserData));

            // Show success toast
            toastRef.current.show({
                severity: 'success', 
                summary: 'Cập nhật thành công', 
                detail: 'Thông tin tài khoản đã được cập nhật'
            });
        } catch (error) {
            // Show error toast
            toastRef.current.show({
                severity: 'error', 
                summary: 'Lỗi', 
                detail: error.message || 'Không thể cập nhật thông tin'
            });
        } finally {
            setLoading(false);
        }
    };

    const openPasswordDialog = () => {
        setShowPasswordDialog(true);
        setPasswordError('');
    };

    const closePasswordDialog = () => {
        setShowPasswordDialog(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setPasswordError('');
    };

    const handlePasswordChange = async () => {
        // Reset password error
        setPasswordError('');

        // Validate new password match
        if (newPassword !== confirmNewPassword) {
            toastRef.current.show({
                severity: 'error', 
                summary: 'Lỗi', 
                detail: 'Mật khẩu mới không khớp'
            });
            return;
        }

        try {
            // If login successful, proceed with password change
            await usersService.update({
                password: newPassword,
                user_id: profileData.userId,
            });

            // Show success toast
            toastRef.current.show({
                severity: 'success', 
                summary: 'Thành công', 
                detail: 'Đã thay đổi mật khẩu'
            });

            // Close dialog
            closePasswordDialog();
        } catch (error) {
            // Set password error if current password is incorrect
            if (error.message.includes('Sai mật khẩu')) {
                setPasswordError('Mật khẩu hiện tại không đúng');
            } else {
                // Show other errors
                toastRef.current.show({
                    severity: 'error', 
                    summary: 'Lỗi', 
                    detail: error.message || 'Không thể thay đổi mật khẩu'
                });
            }
        }
    };

    return (
        <div className="admin-profile-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
            <Toast ref={toastRef} />
            <h2 style={{ margin: '30px 0', color: '#555' }}>Tài khoản của tôi</h2>
            <hr style={{ margin: '20px 0', backgroundColor: '#f0f0f0', height: '1px', border: 'none' }} />

            <TabView activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}>
                <TabPanel header="Thông tin tài khoản">
                    <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
                        <div style={{ width: '250px' }}>
                            <h3 style={{ color: '#555', fontSize: '1.1em', marginBottom: '15px' }}>Chi tiết</h3>
                        </div>
                        <Card style={{ flex: 1, padding: '20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                <div>
                                    <label htmlFor="fullName" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Họ và tên</label>
                                    <InputText
                                        id="fullName"
                                        name="fullName"
                                        value={profileData.fullName}
                                        onChange={handleInputChange}
                                        style={{ width: '100%' }}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="username" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Tên đăng nhập</label>
                                    <InputText
                                        id="username"
                                        name="username"
                                        value={profileData.username}
                                        onChange={handleInputChange}
                                        style={{ width: '100%' }}
                                        disabled
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                <div>
                                    <label htmlFor="email" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Email</label>
                                    <InputText
                                        id="email"
                                        name="email"
                                        value={profileData.email}
                                        onChange={handleInputChange}
                                        style={{ width: '100%' }}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="phoneNumber" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Số điện thoại</label>
                                    <InputText
                                        id="phoneNumber"
                                        name="phoneNumber"
                                        value={profileData.phoneNumber}
                                        onChange={handleInputChange}
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                <div>
                                    <label htmlFor="birthday" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Ngày sinh</label>
                                    <Calendar
                                        id="birthday"
                                        value={profileData.birthday}
                                        onChange={(e) => setProfileData(prev => ({
                                            ...prev,
                                            birthday: e.value
                                        }))}
                                        dateFormat="yy/mm/dd"
                                        showIcon
                                        style={{ width: '100%' }}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="gender" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Giới tính</label>
                                    <Dropdown
                                        id="gender"
                                        value={genderOptions.find(g => g.code === profileData.gender)}
                                        options={genderOptions}
                                        onChange={(e) => handleDropdownChange(e, 'gender')}
                                        optionLabel="name"
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginTop: '20px' }}>
                                <Button 
                                    label="Cập nhật" 
                                    className="p-button-primary" 
                                    onClick={handleUpdateProfile}
                                    disabled={loading}
                                    loading={loading}
                                />
                            </div>
                        </Card>
                    </div>
                </TabPanel>

                <TabPanel header="Bảo mật">
                    <div style={{ marginTop: '20px' }}>
                        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
                            <div style={{ width: '250px' }}>
                                <h3 style={{ color: '#555', fontSize: '1.1em', marginBottom: '15px' }}>Đổi mật khẩu</h3>
                            </div>
                            <Card style={{ flex: 1, padding: '20px' }}>
                                <Button label="Đổi mật khẩu" className="p-button-outlined" onClick={openPasswordDialog}/>
                            </Card>
                        </div>

                        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
                            <div style={{ width: '250px' }}>
                                <h3 style={{ color: '#555', fontSize: '1.1em', marginBottom: '15px' }}>Quyền</h3>
                            </div>
                            <Card style={{ flex: 1, padding: '20px' }}>
                                <Chip 
                                    label={profileData.isAdmin ? "Quản trị toàn hệ thống" : "Người dùng"} 
                                    style={{ 
                                        backgroundColor: profileData.isAdmin ? '#e3f2fd' : '#f0f0f0', 
                                        color: profileData.isAdmin ? '#2196f3' : '#666' 
                                    }} 
                                />
                            </Card>
                        </div>
                    </div>
                </TabPanel>
            </TabView>
            {/* Change Password Dialog */}
            <Dialog
                header="Thay đổi mật khẩu của bạn"
                visible={showPasswordDialog}
                onHide={closePasswordDialog}
                style={{ width: '30vw' }}
                modal
            >
                <div>
                    <div style={{ marginBottom: '10px' }}>
                        <label htmlFor="currentPassword" style={{ fontWeight: '500' }}>Nhập mật khẩu hiện tại của bạn</label>
                        <Password
                            id="currentPassword"
                            name="currentPassword"
                            value={currentPassword}
                            onChange={(e) => {
                                setCurrentPassword(e.target.value);
                                setPasswordError('');
                            }}
                            toggleMask
                            placeholder="Mật khẩu hiện tại"
                            style={{ width: '100%' }}
                        />
                        {passwordError && (
                            <div style={{ 
                                color: 'red', 
                                marginTop: '5px', 
                                fontSize: '0.8em' 
                            }}>
                                {passwordError}
                            </div>
                        )}
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                        <label htmlFor="newPassword" style={{ fontWeight: '500' }}>Nhập mật khẩu mới của bạn</label>
                        <Password
                            id="newPassword"
                            name="newPassword"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            toggleMask
                            placeholder="Mật khẩu mới"
                            style={{ width: '100%' }}
                        />
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                        <label htmlFor="confirmNewPassword" style={{ fontWeight: '500' }}>Xác nhận mật khẩu mới</label>
                        <Password
                            id="confirmNewPassword"
                            name="confirmNewPassword"
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            toggleMask
                            placeholder="Xác nhận mật khẩu mới"
                            style={{ width: '100%' }}
                        />
                    </div>
                    <div style={{ marginTop: '20px' }}>
                        <Button 
                            label="Cập nhật" 
                            className="p-button-primary" 
                            onClick={handlePasswordChange} 
                        />
                        <Button 
                            label="Hủy" 
                            className="p-button-secondary" 
                            onClick={closePasswordDialog} 
                            style={{ marginLeft: '10px' }} 
                        />
                    </div>
                </div>
            </Dialog>
        </div>
    );
};

export default AdminProfilePage;