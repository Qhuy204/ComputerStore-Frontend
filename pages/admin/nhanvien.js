import nhanvienService from '../Services/nhanvienService';
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
import md5 from 'md5';

const Index = () => {
  const [nhanviens, setNhanviens] = useState([]);
  const [nhanvien, setNhanvien] = useState({});
  const [originalEmail, setOriginalEmail] = useState('');
  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedNhanviens, setSelectedNhanviens] = useState(null);
  const [nhanvienDialog, setNhanvienDialog] = useState(false);
  const [deleteNhanvienDialog, setDeleteNhanvienDialog] = useState(false);
  const [deleteNhanviensDialog, setDeleteNhanviensDialog] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [usernameExists, setUsernameExists] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  
  const toast = useRef(null);
  const refreshTimerRef = useRef(null);
  const usernameCheckTimeoutRef = useRef(null);

  const fetchNhanviens = useCallback(async (showToast = false) => {
    try {
      const data = await nhanvienService.getAllnhanviens();
      
      // Format dates before displaying
      const formattedData = data.map(item => {
        if (item.registration_date) {
          // Format registration_date to DD/MM/YYYY
          const date = new Date(item.registration_date);
          const formattedDate = date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
          return { ...item, registration_date: formattedDate };
        }
        return item;
      });
      
      setNhanviens(formattedData);
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
      toast.current.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể tải danh sách nhân viên',
        life: 3000,
      });
    }
  }, []);

  useEffect(() => {
    fetchNhanviens();
    
    refreshTimerRef.current = setInterval(() => {
      fetchNhanviens();
    }, 60000);
    
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
      if (usernameCheckTimeoutRef.current) {
        clearTimeout(usernameCheckTimeoutRef.current);
      }
    };
  }, [fetchNhanviens]);

  const refreshData = useCallback(() => {
    fetchNhanviens(true);
  }, [fetchNhanviens]);

  const emptyNhanvien = {
    username: '',
    email: '',
    password: '',
    full_name: '',
    phone_number: '',
    is_admin: true, // Nhân viên luôn có quyền admin
    email_verified: false,
    gender: 'male',
    birthday: null
  };

  const openNew = () => {
    setNhanvien(emptyNhanvien);
    setOriginalEmail('');
    setSubmitted(false);
    setUsernameExists(false);
    setNhanvienDialog(true);
  };

  const hideDialog = () => {
    setSubmitted(false);
    setNhanvienDialog(false);
  };

  // Hàm kiểm tra username đã tồn tại hay chưa
  const checkUsername = (username) => {
    // Nếu đang ở chế độ edit và username không thay đổi, không cần kiểm tra
    if (nhanvien.user_id) { // or nhanvien.user_id
      return;
    }
    
    if (!username || username.trim() === '') {
      setUsernameExists(false);
      return;
    }
    
    setIsCheckingUsername(true);
    
    // Use the service to check username
    nhanvienService.checkUsername(username) 
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

  const saveNhanvien = async () => {
    setSubmitted(true);

    if (!nhanvien.username || !nhanvien.email || (!nhanvien.user_id && !nhanvien.password)) {
      toast.current.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Vui lòng điền đầy đủ thông tin bắt buộc',
        life: 3000,
      });
      return;
    }

    // Kiểm tra username tồn tại trước khi lưu
    if (!nhanvien.user_id && usernameExists) {
      toast.current.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Tên đăng nhập đã tồn tại, vui lòng chọn tên đăng nhập khác',
        life: 3000,
      });
      return;
    }

    try {
      // Tạo đối tượng NhanvienDataNew để lưu vào database
      const nhanvienDataNew = {
        username: nhanvien.username,
        email: nhanvien.email,
        full_name: nhanvien.full_name || '',
        phone_number: nhanvien.phone_number || '',
        gender: nhanvien.gender || 'male',
        is_admin: true, // Nhân viên luôn có quyền admin
        email_verified: nhanvien.email_verified || false
      };
      
      // Xử lý ngày sinh
      if (nhanvien.birthday) {
        // Nếu ngày sinh là đối tượng Date, chuyển về định dạng chuỗi ISO cho API
        if (nhanvien.birthday instanceof Date) {
          nhanvienDataNew.birthday = nhanvien.birthday.toISOString().split('T')[0]; // Format: YYYY-MM-DD
        } else {
          nhanvienDataNew.birthday = nhanvien.birthday;
        }
      }
      
      // Xử lý mật khẩu
      if (nhanvien.password && nhanvien.password.trim() !== '') {
        nhanvienDataNew.password = md5(nhanvien.password);
      } else if (!nhanvien.user_id) {
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
      if (nhanvien.user_id) {
        nhanvienDataNew.user_id = nhanvien.user_id;
        
        // Cập nhật nhân viên
        await nhanvienService.updatenhanvien(nhanvienDataNew);
        toast.current.show({
          severity: 'success',
          summary: 'Thành công',
          detail: 'Cập nhật nhân viên thành công',
          life: 3000,
        });
      } else {
        // Thêm mới nhân viên
        await nhanvienService.addnhanvien(nhanvienDataNew);
        toast.current.show({
          severity: 'success',
          summary: 'Thành công',
          detail: 'Tạo nhân viên mới thành công',
          life: 3000,
        });
      }

      fetchNhanviens();
      setNhanvienDialog(false);
      setNhanvien(emptyNhanvien);
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
    setNhanvien(prev => ({ ...prev, [name]: val }));
    
    // Reset email_verified nếu email thay đổi
    if (name === 'email' && originalEmail && val !== originalEmail) {
      setNhanvien(prev => ({ ...prev, email_verified: false }));
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
    setNhanvien(prev => ({ ...prev, [name]: value }));
  };

  const confirmDeleteNhanvien = (nhanvienData) => {
    setNhanvien(nhanvienData);
    setDeleteNhanvienDialog(true);
  };

  const deleteNhanvien = async () => {
    try {
      await nhanvienService.deletenhanvien(nhanvien.user_id);
      setSelectedNhanviens(null);
      return true;
    } catch (error) {
      console.error('Lỗi xóa:', error);
      throw error;
    }
  };
  
  const confirmDeleteSelected = () => {
    setDeleteNhanviensDialog(true);
  };

  const deleteSelectedNhanviens = async () => {
    try {
      const deletePromises = selectedNhanviens.map(nhanvien => 
        nhanvienService.deletenhanvien(nhanvien.user_id)
      );
      
      await Promise.all(deletePromises);
      setSelectedNhanviens(null);
      return true;
    } catch (error) {
      throw error;
    }
  };

  const editNhanvien = (nhanvienData) => {
    const nhanvienToEdit = { ...nhanvienData };
    
    // Lưu email gốc để kiểm tra thay đổi
    setOriginalEmail(nhanvienToEdit.email || '');
    
    // Xử lý ngày sinh
    if (nhanvienToEdit.birthday) {
      // Chuyển ngày sinh từ chuỗi sang đối tượng Date nếu cần
      if (typeof nhanvienToEdit.birthday === 'string') {
        nhanvienToEdit.birthday = new Date(nhanvienToEdit.birthday);
      }
    }
    
    // Đảm bảo có giới tính
    if (!nhanvienToEdit.gender) {
      nhanvienToEdit.gender = 'male';
    }
    
    // Xóa password khi edit
    delete nhanvienToEdit.password;
    
    setNhanvien(nhanvienToEdit);
    setUsernameExists(false); // Reset trạng thái kiểm tra username
    setNhanvienDialog(true);
  };

  // Kiểm tra xem email có bị thay đổi không
  const isEmailChanged = nhanvien.email !== originalEmail && originalEmail !== '';

  // Columns cho bảng
  const columns = [
    { field: 'user_id', header: 'Mã nhân viên', style: { minWidth: '6rem', maxWidth:'10rem' } },
    { field: 'username', header: 'Tên đăng nhập', style: { minWidth: '8rem', maxWidth:'12rem' } },
    { field: 'full_name', header: 'Họ tên', style: { minWidth: '10rem', maxWidth:'15rem' } },
    { field: 'email', header: 'Email', style: { minWidth: '10rem', maxWidth:'15rem' } },
    { field: 'phone_number', header: 'Số điện thoại', style: { minWidth: '8rem', maxWidth:'12rem' } },
    { field: 'registration_date', header: 'Ngày vào làm', style: { minWidth: '8rem', maxWidth:'12rem' } }
  ];

  // Footer dialog với nút Lưu bị vô hiệu hóa khi username đã tồn tại
  const nhanvienDialogFooter = (
    <React.Fragment>
      <Button label="Hủy" icon="pi pi-times" className="p-button-text" onClick={hideDialog} />
      <Button 
        label="Lưu" 
        icon="pi pi-check" 
        onClick={saveNhanvien} 
        disabled={!nhanvien.user_id && usernameExists} // Vô hiệu hóa khi thêm mới và username đã tồn tại
      />
    </React.Fragment>
  );

  return (
    <div>
      <Toast ref={toast} />
      
      <GenericTable
        data={nhanviens}
        selectedItems={selectedNhanviens}
        setSelectedItems={setSelectedNhanviens}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        columns={columns}
        onEdit={editNhanvien}
        onDelete={confirmDeleteNhanvien}
        onDeleteSelected={confirmDeleteSelected}
        openNew={openNew}
        dataKey="user_id"
        title="Quản lý danh sách Nhân Viên"
        onRefresh={refreshData}
      />
      
      {/* Custom dialog form với layout giống user/index.js */}
      <Dialog
        visible={nhanvienDialog}
        style={{ width: '800px' }}
        header={nhanvien.user_id ? "Chỉnh sửa nhân viên" : "Thêm nhân viên mới"}
        modal
        className="p-fluid"
        footer={nhanvienDialogFooter}
        onHide={hideDialog}
      >
        <div className="grid">
          <div className="col-12 md:col-6">
            <Panel header="Thông tin chung">
              <div className="field">
                <label htmlFor="full_name">Họ và tên</label>
                <InputText
                  id="full_name"
                  value={nhanvien.full_name || ''}
                  onChange={(e) => onInputChange(e, 'full_name')}
                  autoFocus
                  placeholder="Nhập họ và tên"
                  className={submitted && !nhanvien.full_name ? 'p-invalid' : ''}
                />
              </div>
              
              <div className="grid">
                <div className="col-12 md:col-6">
                  <div className="field">
                    <label htmlFor="phone_number">Số điện thoại</label>
                    <InputText
                      id="phone_number"
                      value={nhanvien.phone_number || ''}
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
                      value={nhanvien.email || ''}
                      onChange={(e) => onInputChange(e, 'email')}
                      className={submitted && !nhanvien.email ? 'p-invalid' : ''}
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
                      value={nhanvien.birthday}
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
                          value="male"
                          onChange={(e) => onValueChange(e.value, 'gender')}
                          checked={nhanvien.gender === 'male'}
                        />
                        <label htmlFor="gender1">Nam</label>
                      </div>
                      <div className="field-radiobutton col-6">
                        <RadioButton
                          inputId="gender2"
                          name="gender"
                          value="female"
                          onChange={(e) => onValueChange(e.value, 'gender')}
                          checked={nhanvien.gender === 'female'}
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
                  value={nhanvien.username || ''}
                  onChange={(e) => onInputChange(e, 'username')}
                  className={(submitted && !nhanvien.username) || usernameExists ? 'p-invalid' : ''}
                  placeholder="Nhập tên đăng nhập"
                  disabled={!!nhanvien.user_id}  // Disable khi đang ở chế độ edit
                />
                {nhanvien.user_id && (
                  <small className="text-muted">Tên đăng nhập không thể thay đổi sau khi tạo</small>
                )}
                {isCheckingUsername && (
                  <small className="text-blue-500">Đang kiểm tra tên đăng nhập...</small>
                )}
                {usernameExists && !nhanvien.user_id && (
                  <small className="p-error">Tên đăng nhập đã tồn tại, vui lòng chọn tên khác</small>
                )}
              </div>
              
              <div className="field">
                <label htmlFor="password">
                  {nhanvien.user_id ? "Mật khẩu (để trống nếu không thay đổi)" : "Mật khẩu"}
                </label>
                <Password
                  id="password"
                  value={nhanvien.password || ''}
                  onChange={(e) => onInputChange(e, 'password')}
                  className={submitted && !nhanvien.user_id && !nhanvien.password ? 'p-invalid' : ''}
                  feedback={false}
                  toggleMask
                  placeholder={nhanvien.user_id ? "Nhập mật khẩu mới" : "Nhập mật khẩu"}
                />
                {submitted && !nhanvien.user_id && !nhanvien.password && (
                  <small className="p-error">Mật khẩu là bắt buộc khi tạo nhân viên mới.</small>
                )}
                {nhanvien.user_id && (
                  <small className="text-muted">Để trống nếu không muốn thay đổi mật khẩu</small>
                )}
              </div>
              
              <div className="field-checkbox mt-4">
                <Checkbox
                  inputId="is_admin"
                  checked={true}
                  disabled={true}
                />
                <label htmlFor="is_admin" className="text-muted">
                  Người dùng có quyền admin 
                </label>
              </div>

              <div className="field-checkbox">
                <Checkbox
                  inputId="email_verified"
                  checked={nhanvien.email_verified || false}
                  onChange={(e) => onValueChange(e.checked, 'email_verified')}
                  disabled={!!nhanvien.user_id && !isEmailChanged}  // Chỉ disable khi edit và email không thay đổi
                />
                <label 
                  htmlFor="email_verified" 
                  className={nhanvien.user_id && !isEmailChanged ? 'text-muted' : ''}
                >
                  Email đã được xác thực
                </label>
              </div>
              {!!nhanvien.user_id && !isEmailChanged && (
                <small className="text-muted block mt-1">
                  Trạng thái xác thực email chỉ có thể thay đổi khi email được cập nhật
                </small>
              )}
            </Panel>
          </div>
        </div>
      </Dialog>
      
      <ConfirmDeleteDialog
        visible={deleteNhanvienDialog}
        onHide={() => setDeleteNhanvienDialog(false)}
        onConfirm={deleteNhanvien}
        onSuccess={refreshData}
        item={nhanvien}
        idField="user_id"
        itemName={nhanvien.username || nhanvien.full_name}
      />
      
      <ConfirmDeleteDialog
        visible={deleteNhanviensDialog}
        onHide={() => setDeleteNhanviensDialog(false)}
        onConfirm={deleteSelectedNhanviens}
        onSuccess={refreshData}
        multiple={true}
        title="Xác nhận xóa"
      />
    </div>
  );
};

export default Index;