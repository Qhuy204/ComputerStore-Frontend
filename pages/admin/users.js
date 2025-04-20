import usersService from '../Services/usersService';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Toast } from 'primereact/toast';
import GenericTable from '../components/AdminPage/GenericTable';
import ConfirmDeleteDialog from '../components/AdminPage/ConfirmDeleteDialog';
import { Calendar } from 'primereact/calendar';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Panel } from 'primereact/panel';
import { RadioButton } from 'primereact/radiobutton';
import { Checkbox } from 'primereact/checkbox';
import { useRouter } from 'next/navigation';

const Index = () => {
  const [users, setUsers] = useState([]);
  const [user, setUser] = useState({});
  const [originalEmail, setOriginalEmail] = useState('');
  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedUsers, setSelectedUsers] = useState(null);
  const [userDialog, setUserDialog] = useState(false);
  const [deleteUserDialog, setDeleteUserDialog] = useState(false);
  const [deleteUsersDialog, setDeleteUsersDialog] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [usernameExists, setUsernameExists] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  
  const toast = useRef(null);
  const refreshTimerRef = useRef(null);
  const usernameCheckTimeoutRef = useRef(null);
  const router = useRouter();

  // Validate if userId is a valid integer
  const isValidUserId = (userId) => {
    // Check if userId is null or undefined
    if (userId === null || userId === undefined) return false;
    
    // Convert to string if it's not already
    const userIdStr = String(userId);
    // Convert to number
    const numericId = Number.parseInt(userIdStr, 10);
    
    // Check if it's a valid integer (not NaN and equal to original string)
    return !isNaN(numericId) && String(numericId) === userIdStr;
  };

  // Hàm xử lý khi click vào tên người dùng
  const handleUserNameClick = (userId) => {
    // Validate that userId is an integer before proceeding
    if (!isValidUserId(userId)) {
      toast.current.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: `ID người dùng ${userId} không hợp lệ.`,
        life: 3000
      });
      return;
    }
    
    localStorage.setItem('userId', userId);
    // Hiển thị user_id đã chọn trước khi chuyển hướng
    toast.current.show({
      severity: 'info',
      summary: 'Thông báo',
      detail: `Đang chuyển đến thông tin người dùng có ID: ${userId}`,
      life: 100
    });

    // Thêm một độ trễ nhỏ để cho phép thông báo hiển thị
    setTimeout(() => {
      router.push(`/admin/users/${userId}`);
    }, 1000);
  };

  const fetchUsers = useCallback(async (showToast = false) => {
    try {
      const data = await usersService.getAll();
      
      // Filter out users with invalid IDs
      const validUsers = data.filter(user => isValidUserId(user.user_id));
      
      if (validUsers.length < data.length) {
        console.warn(`Filtered out ${data.length - validUsers.length} users with invalid IDs`);
      }
      
      // Format dates before displaying
      const formattedData = validUsers.map(item => {
        if (item.last_order_date) {
          // Format last_order_date to DD/MM/YYYY
          const date = new Date(item.last_order_date);
          const formattedDate = date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
          return { ...item, last_order_date: formattedDate };
        }
        return item;
      });
      
      setUsers(formattedData);
      setLastUpdate(new Date());
      
      if (showToast) {
        toast.current.show({
          severity: 'info',
          summary: 'Đã làm mới',
          detail: 'Dữ liệu đã được cập nhật',
          life: 1000,
        });
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.current.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể tải danh sách người dùng',
        life: 3000,
      });
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    
    refreshTimerRef.current = setInterval(() => {
      fetchUsers();
    }, 60000);
    
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
      if (usernameCheckTimeoutRef.current) {
        clearTimeout(usernameCheckTimeoutRef.current);
      }
    };
  }, [fetchUsers]);

  const refreshData = useCallback(() => {
    fetchUsers(true);
  }, [fetchUsers]);

  const emptyUser = {
    username: '',
    email: '',
    password: '',
    full_name: '',
    phone_number: '',
    is_admin: false,
    email_verified: false,
    gender: 'nam',
    birthday: null
  };

  const openNew = () => {
    setUser(emptyUser);
    setOriginalEmail('');
    setSubmitted(false);
    setUsernameExists(false);
    setUserDialog(true);
  };

  const hideDialog = () => {
    setSubmitted(false);
    setUserDialog(false);
  };

  // Hàm kiểm tra username đã tồn tại hay chưa
  const checkUsername = (username) => {
    // Nếu đang ở chế độ edit và username không thay đổi, không cần kiểm tra
    if (user.user_id) {
      return;
    }
    
    if (!username || username.trim() === '') {
      setUsernameExists(false);
      return;
    }
    
    setIsCheckingUsername(true);
    
    usersService.checkUsername(username) 
      .then(exists => {
        setUsernameExists(exists);
        setIsCheckingUsername(false);
      })
      .catch(error => {
        console.error('Error checking username:', error);
        setIsCheckingUsername(false);
        // Show an error toast if needed
        toast.current.show({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể kiểm tra tên đăng nhập',
          life: 3000,
        });
      });
  };

  const saveUser = async () => {
    setSubmitted(true);

    if (!user.username || !user.email || (!user.user_id && !user.password)) {
      toast.current.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Vui lòng điền đầy đủ thông tin bắt buộc',
        life: 3000,
      });
      return;
    }

    // Kiểm tra username tồn tại trước khi lưu
    if (!user.user_id && usernameExists) {
      toast.current.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Tên đăng nhập đã tồn tại, vui lòng chọn tên đăng nhập khác',
        life: 3000,
      });
      return;
    }

    try {
      // Tạo đối tượng UserDataNew để lưu vào database
      const userDataNew = {
        username: user.username,
        email: user.email,
        full_name: user.full_name || '',
        phone_number: user.phone_number || '',
        gender: user.gender || 'nam',
        is_admin: user.is_admin || false,
        email_verified: user.email_verified || false,
        birthday: user.birthday || null,
      };
      
      // Xử lý ngày sinh
      if (user.birthday) {
        // Nếu ngày sinh là đối tượng Date, chuyển về định dạng chuỗi ISO cho API
        if (user.birthday instanceof Date) {
          userDataNew.birthday = user.birthday.toISOString().split('T')[0]; // Format: YYYY-MM-DD
        } else {
          userDataNew.birthday = user.birthday;
        }
      }
      
      // Xử lý mật khẩu
      if (user.password && user.password.trim() !== '') {
        userDataNew.password = user.password;
      } else if (!user.user_id) {
        // Nếu là tạo mới mà không có password
        toast.current.show({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Mật khẩu là trường bắt buộc',
          life: 3000,
        });
        return;
      }
      
      // Thêm ID nếu đang cập nhật
      if (user.user_id) {
        userDataNew.user_id = user.user_id;
        
        // Cập nhật người dùng
        await usersService.update(userDataNew);
        toast.current.show({
          severity: 'success',
          summary: 'Thành công',
          detail: 'Cập nhật người dùng thành công',
          life: 3000,
        });
      } else {
        // Thêm mới người dùng
        await usersService.insert(userDataNew);
        toast.current.show({
          severity: 'success',
          summary: 'Thành công',
          detail: 'Tạo người dùng mới thành công',
          life: 3000,
        });
      }

      fetchUsers();
      setUserDialog(false);
      setUser(emptyUser);
    } catch (error) {
      toast.current.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể thực hiện thao tác',
        life: 3000,
      });
    }
  };

  const onInputChange = (e, name) => {
    const val = (e.target && e.target.value) || '';
    setUser(prev => ({ ...prev, [name]: val }));
    
    // Reset email_verified nếu email thay đổi
    if (name === 'email' && originalEmail && val !== originalEmail) {
      setUser(prev => ({ ...prev, email_verified: false }));
    }
    
    // Kiểm tra username sau khi người dùng nhập
    if (name === 'username') {
      // Sử dụng debounce để không gọi quá nhiều lần
      if (usernameCheckTimeoutRef.current) {
        clearTimeout(usernameCheckTimeoutRef.current);
      }
      
      usernameCheckTimeoutRef.current = setTimeout(() => {
        checkUsername(val);
      }, 500); // Đợi 500ms sau khi người dùng ngừng gõ
    }
  };

  const onValueChange = (value, name) => {
    setUser(prev => ({ ...prev, [name]: value }));
  };

  const confirmDeleteUser = (userData) => {
    // Validate that we're not trying to delete a user with an invalid ID
    if (!isValidUserId(userData.user_id)) {
      toast.current.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'ID người dùng không hợp lệ, không thể xóa.',
        life: 3000
      });
      return;
    }
    
    setUser(userData);
    setDeleteUserDialog(true);
  };

  const deleteUser = async () => {
    try {
      // Double-check that user.user_id is a valid integer
      if (!isValidUserId(user.user_id)) {
        throw new Error('ID người dùng không hợp lệ');
      }
      
      await usersService.delete(user.user_id);
      setSelectedUsers(null);
      return true;
    } catch (error) {
      console.error('Lỗi xóa:', error);
      throw error;
    }
  };
  
  const confirmDeleteSelected = () => {
    // Check if any selected user has an invalid ID
    const hasInvalidId = selectedUsers.some(user => !isValidUserId(user.user_id));
    
    if (hasInvalidId) {
      toast.current.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Một hoặc nhiều người dùng có ID không hợp lệ, không thể xóa.',
        life: 3000
      });
      return;
    }
    
    setDeleteUsersDialog(true);
  };

  const deleteSelectedUsers = async () => {
    try {
      // Filter out any users with invalid IDs
      const validSelectedUsers = selectedUsers.filter(user => isValidUserId(user.user_id));
      
      const deletePromises = validSelectedUsers.map(user => 
        usersService.delete(user.user_id)
      );
      
      await Promise.all(deletePromises);
      setSelectedUsers(null);
      return true;
    } catch (error) {
      throw error;
    }
  };

  const editUser = (userData) => {
    // Validate that user_id is an integer before editing
    if (!isValidUserId(userData.user_id)) {
      toast.current.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'ID người dùng không hợp lệ, không thể chỉnh sửa.',
        life: 3000
      });
      return;
    }
    
    const userToEdit = { ...userData };
    
    // Lưu email gốc để kiểm tra thay đổi
    setOriginalEmail(userToEdit.email || '');
    
    // Xử lý ngày sinh
    if (userToEdit.birthday) {
      // Chuyển ngày sinh từ chuỗi sang đối tượng Date nếu cần
      if (typeof userToEdit.birthday === 'string') {
        userToEdit.birthday = new Date(userToEdit.birthday);
      }
    }
    
    // Đảm bảo có giới tính
    if (!userToEdit.gender) {
      userToEdit.gender = 'nam';
    }
    
    // Xóa password khi edit
    delete userToEdit.password;
    
    setUser(userToEdit);
    setUsernameExists(false); // Reset trạng thái kiểm tra username
    setUserDialog(true);
  };

  // Kiểm tra xem email có bị thay đổi không
  const isEmailChanged = user.email !== originalEmail && originalEmail !== '';

  // Columns cho bảng với template tùy chỉnh cho cột họ tên
  const columns = [
    { 
      field: 'full_name', 
      header: 'Họ tên', 
      style: { minWidth: '6rem', maxWidth:'10rem' },
      body: (rowData) => (
        <div 
          onClick={() => handleUserNameClick(rowData.user_id)} 
          className="cursor-pointer text-blue-600 hover:text-blue-800 hover:underline"
        >
          {rowData.full_name}
        </div>
      )
    },
    { field: 'phone_number', header: 'Số điện thoại', style: { minWidth: '1rem', maxWidth:'10rem' } },
    { field: 'address', header: 'Địa chỉ', style: { minWidth: '12rem', maxWidth: '12rem' } },
    { field: 'order_count', header: 'SL đơn hàng', style: { minWidth: '6rem', maxWidth:'6rem' } },
    { field: 'last_order_date', header: 'Ngày mua hàng gần nhất', style: { minWidth: '1rem', maxWidth:'15rem' } },
    { field: 'pending_payment', header: 'Chưa trả', style: { minWidth: '8rem' } },
    { field: 'total_spend', header: 'Tổng chi', style: { minWidth: '8rem' } },
  ];

  // Footer dialog với nút Lưu bị vô hiệu hóa khi username đã tồn tại
  const userDialogFooter = (
    <React.Fragment>
      <Button label="Hủy" icon="pi pi-times" className="p-button-text" onClick={hideDialog} />
      <Button 
        label="Lưu" 
        icon="pi pi-check" 
        onClick={saveUser} 
        disabled={!user.user_id && usernameExists} // Vô hiệu hóa khi thêm mới và username đã tồn tại
      />
    </React.Fragment>
  );

  return (
    <div>
      <Toast ref={toast} />
      
      <GenericTable
        data={users}
        selectedItems={selectedUsers}
        setSelectedItems={setSelectedUsers}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        columns={columns}
        onEdit={editUser}
        onDelete={confirmDeleteUser}
        onDeleteSelected={confirmDeleteSelected}
        openNew={openNew}
        dataKey="user_id"
        title="Danh sách khách hàng"
        onRefresh={refreshData}
      />
      
      <Dialog
        visible={userDialog}
        style={{ width: '800px' }}
        header={user.user_id ? "Chỉnh sửa người dùng" : "Thêm người dùng mới"}
        modal
        className="p-fluid"
        footer={userDialogFooter}
        onHide={hideDialog}
      >
        <div className="grid">
          <div className="col-12 md:col-6">
            <Panel header="Thông tin chung">
              <div className="field">
                <label htmlFor="full_name">Họ và tên</label>
                <InputText
                  id="full_name"
                  value={user.full_name || ''}
                  onChange={(e) => onInputChange(e, 'full_name')}
                  autoFocus
                  placeholder="Nhập họ và tên"
                  className={submitted && !user.full_name ? 'p-invalid' : ''}
                />
              </div>
              
              <div className="grid">
                <div className="col-12 md:col-6">
                  <div className="field">
                    <label htmlFor="phone_number">Số điện thoại</label>
                    <InputText
                      id="phone_number"
                      value={user.phone_number || ''}
                      onChange={(e) => onInputChange(e, 'phone_number')}
                      placeholder="Nhập số điện thoại"
                    />
                  </div>
                </div>
                
                <div className="col-12 md:col-6">
                  <div className="field">
                    <label htmlFor="email">Nhập email</label>
                    <InputText
                      id="email"
                      value={user.email || ''}
                      onChange={(e) => onInputChange(e, 'email')}
                      className={submitted && !user.email ? 'p-invalid' : ''}
                      placeholder="Nhập email"
                    />
                    {isEmailChanged && (
                      <small className="text-orange-500">
                        Email đã thay đổi. Trạng thái xác thực email sẽ được đặt lại.
                      </small>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid">
                <div className="col-12 md:col-6">
                  <div className="field">
                    <label htmlFor="birthday">Ngày sinh</label>
                    <Calendar
                      id="birthday"
                      value={user.birthday}
                      onChange={(e) => onValueChange(e.value, 'birthday')}
                      dateFormat="dd/mm/yy"
                      showIcon
                      placeholder="DD/MM/YYYY"
                    />
                  </div>
                </div>
                
                <div className="col-12 md:col-6">
                  <div className="field">
                    <label className="mb-3">Giới tính</label>
                    <div className="formgrid grid">
                      <div className="field-radiobutton col-6">
                        <RadioButton
                          inputId="gender1"
                          name="gender"
                          value="nam"
                          onChange={(e) => onValueChange(e.value, 'gender')}
                          checked={user.gender === 'nam'}
                        />
                        <label htmlFor="gender1">Nam</label>
                      </div>
                      <div className="field-radiobutton col-6">
                        <RadioButton
                          inputId="gender2"
                          name="gender"
                          value="nữ"
                          onChange={(e) => onValueChange(e.value, 'gender')}
                          checked={user.gender === 'nữ'}
                        />
                        <label htmlFor="gender2">Nữ</label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Panel>
          </div>
          
          <div className="col-12 md:col-6">
            <Panel header="Thông tin đăng nhập">
              <div className="field">
                <label htmlFor="username">Tên đăng nhập</label>
                <InputText
                  id="username"
                  value={user.username || ''}
                  onChange={(e) => onInputChange(e, 'username')}
                  className={(submitted && !user.username) || usernameExists ? 'p-invalid' : ''}
                  placeholder="Nhập tên đăng nhập"
                  disabled={!!user.user_id}  // Disable khi đang ở chế độ edit
                />
                {user.user_id && (
                  <small className="text-muted">Tên đăng nhập không thể thay đổi sau khi tạo</small>
                )}
                {isCheckingUsername && (
                  <small className="text-blue-500">Đang kiểm tra tên đăng nhập...</small>
                )}
                {usernameExists && !user.user_id && (
                  <small className="p-error">Tên đăng nhập đã tồn tại, vui lòng chọn tên khác</small>
                )}
              </div>
              
              <div className="field">
                <label htmlFor="password">
                  {user.user_id ? "Mật khẩu (để trống nếu không thay đổi)" : "Mật khẩu"}
                </label>
                <Password
                  id="password"
                  value={user.password || ''}
                  onChange={(e) => onInputChange(e, 'password')}
                  className={submitted && !user.user_id && !user.password ? 'p-invalid' : ''}
                  feedback={false}
                  toggleMask
                  placeholder={user.user_id ? "Nhập mật khẩu mới" : "Nhập mật khẩu"}
                />
                {submitted && !user.user_id && !user.password && (
                  <small className="p-error">Mật khẩu là bắt buộc khi tạo người dùng mới.</small>
                )}
                {user.user_id && (
                  <small className="text-muted">Để trống nếu không muốn thay đổi mật khẩu</small>
                )}
              </div>
              
              <div className="field-checkbox mt-4">
                <Checkbox
                  inputId="is_admin"
                  checked={user.is_admin || false}
                  onChange={(e) => onValueChange(e.checked, 'is_admin')}
                  disabled={!!user.user_id}  // Chỉ disable khi đang ở chế độ edit (có user_id)
                />
                <label 
                  htmlFor="is_admin" 
                  className={user.user_id ? "text-muted" : ""}
                >
                  Người dùng có quyền admin
                </label>
              </div>

              <div className="field-checkbox">
                <Checkbox
                  inputId="email_verified"
                  checked={user.email_verified || false}
                  onChange={(e) => onValueChange(e.checked, 'email_verified')}
                  disabled={!!user.user_id && !isEmailChanged}  // Chỉ disable khi edit và email không thay đổi
                />
                <label 
                  htmlFor="email_verified" 
                  className={user.user_id && !isEmailChanged ? 'text-muted' : ''}
                >
                  Email đã được xác thực
                </label>
              </div>
              {!!user.user_id && !isEmailChanged && (
                <small className="text-muted block mt-1">
                  Trạng thái xác thực email chỉ có thể thay đổi khi email được cập nhật
                </small>
              )}
            </Panel>
          </div>
        </div>
      </Dialog>
      
      <ConfirmDeleteDialog
        visible={deleteUserDialog}
        onHide={() => setDeleteUserDialog(false)}
        onConfirm={deleteUser}
        onSuccess={refreshData}
        item={user}
        idField="user_id"
        itemName={user.username || user.full_name}
      />
      
      <ConfirmDeleteDialog
        visible={deleteUsersDialog}
        onHide={() => setDeleteUsersDialog(false)}
        onConfirm={deleteSelectedUsers}
        onSuccess={refreshData}
        multiple={true}
        title="Xác nhận xóa"
      />
    </div>
  );
};

export default Index;