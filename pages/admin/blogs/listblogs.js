import blogsService from '../../Services/blogsService';
import React, { useState, useEffect, useRef } from 'react';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { useRouter } from 'next/navigation';
import GenericTable from '../../components/AdminPage/GenericTable';
import ConfirmDeleteDialog from '../../components/AdminPage/ConfirmDeleteDialog';

const BlogsManagementPage = () => {
  const [blogs, setBlogs] = useState([]);
  const [selectedBlogs, setSelectedBlogs] = useState(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [deleteBlogDialog, setDeleteBlogDialog] = useState(false);
  const [deleteBlogsDialog, setDeleteBlogsDialog] = useState(false);
  const [currentBlog, setCurrentBlog] = useState({});
  
  const toast = useRef(null);
  const router = useRouter();

  const loadBlogs = async () => {
    try {
      const data = await blogsService.getAll();
      setBlogs(data);
    } catch (error) {
      console.error('Error fetching blogs:', error);
      toast.current.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể tải danh sách bài viết',
        life: 3000,
      });
    }
  };

  useEffect(() => {
    loadBlogs();
  }, []);

  // Hàm xử lý khi click vào tên blog
  const handleBlogTitleClick = (blogId) => {
    localStorage.setItem('blogId', blogId);
    
    toast.current.show({
      severity: 'info',
      summary: 'Thông báo',
      detail: `Đang chuyển đến bài viết có ID: ${blogId}`,
      life: 100
    });

    // Thêm một độ trễ nhỏ để cho phép thông báo hiển thị
    setTimeout(() => {
      router.push({
        pathname: `/admin/blogs/edit/${blogId}`,
        state: { blogId: blogId },
      });
    }, 100);
  };

  const refreshData = () => {
    loadBlogs();
    toast.current.show({
      severity: 'info',
      summary: 'Đã làm mới',
      detail: 'Dữ liệu đã được làm mới',
      life: 1000,
    });
  };

  const createNewBlog = () => {
    router.push('/admin/blogs/addblogs');
  };

  const confirmDeleteBlog = (rowData) => {
    setCurrentBlog(rowData);
    setDeleteBlogDialog(true);
  };

  const confirmDeleteSelected = () => {
    setDeleteBlogsDialog(true);
  };

  const deleteBlog = () => {
    blogsService.delete(currentBlog.blog_id)
      .then(() => {
        loadBlogs();
        toast.current.show({
          severity: 'success',
          summary: 'Thành công',
          detail: 'Xóa bài viết thành công',
          life: 3000,
        });
      })
      .catch(error => {
        console.error('Error deleting blog:', error);
        toast.current.show({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Xóa bài viết thất bại',
          life: 3000,
        });
      });
    setDeleteBlogDialog(false);
    setCurrentBlog({});
  };

  const deleteSelectedBlogs = () => {
    if (selectedBlogs && selectedBlogs.length > 0) {
      const promises = selectedBlogs.map(blog => {
        return blogsService.delete(blog.blog_id);
      });
      
      Promise.all(promises)
        .then(() => {
          loadBlogs();
          toast.current.show({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Xóa các bài viết đã chọn thành công',
            life: 3500,
          });
        })
        .catch(error => {
          console.error('Error deleting blogs:', error);
          toast.current.show({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Xóa bài viết thất bại',
            life: 3500,
          });
        });
        
      setDeleteBlogsDialog(false);
      setSelectedBlogs(null);
    }
  };

  // Format date to display in a user-friendly format
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Function to truncate text for display
  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  // Định nghĩa các cột và template tùy chỉnh
  const columns = [
    { 
      field: 'blog_thumbnail_url', 
      header: 'Ảnh', 
      style: { width: '100px' },
      body: (data) => data.blog_thumbnail_url ? 
        <img src={data.blog_thumbnail_url} alt="Thumbnail" style={{ width: '100%', maxHeight: '60px', objectFit: 'cover' }} /> :
        <div className="text-gray-400 text-sm">Không có ảnh</div>
    },
    { 
      field: 'blog_title', 
      header: 'Tiêu đề', 
      style: { minWidth: '200px' },
      body: (rowData) => (
        <div 
          onClick={() => handleBlogTitleClick(rowData.blog_id)} 
          className="cursor-pointer text-blue-600 hover:text-blue-800 hover:underline"
        >
          {rowData.blog_title}
        </div>
      )
    },
    { 
      field: 'blog_description', 
      header: 'Mô tả', 
      style: { minWidth: '250px' },
      body: (rowData) => <div>{truncateText(rowData.blog_description, 120)}</div>
    },
    { 
      field: 'category', 
      header: 'Danh mục', 
      style: { width: '150px' },
      body: (rowData) => {
        const categoryMap = {
          'cong-nghe': 'Công nghệ',
          'phan-mem': 'Phần mềm',
          'thiet-bi': 'Thiết bị',
          'tin-tuc': 'Tin tức',
          'danh-gia': 'Đánh giá'
        };
        return <div>{categoryMap[rowData.category] || rowData.category}</div>;
      }
    },
    { 
      field: 'blog_author_name', 
      header: 'Tác giả', 
      style: { width: '150px' } 
    },
    { 
      field: 'published_at', 
      header: 'Ngày đăng', 
      style: { width: '180px' },
      body: (rowData) => <div>{formatDate(rowData.published_at)}</div>
    },
    { 
      field: 'is_published', 
      header: 'Trạng thái', 
      style: { width: '120px' },
      body: (rowData) => (
        <span className={`px-2 py-1 rounded text-white ${rowData.is_published ? 'bg-green-500' : 'bg-gray-500'}`}>
          {rowData.is_published ? 'Đã đăng' : 'Bản nháp'}
        </span>
      )
    },
    { 
      field: 'views', 
      header: 'Lượt xem', 
      style: { width: '120px' },
    },
  ];

  return (
    <div>
      <Toast ref={toast} />
      
      <GenericTable
        data={blogs}
        selectedItems={selectedBlogs}
        setSelectedItems={setSelectedBlogs}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        columns={columns}
        onEdit={(rowData) => handleBlogTitleClick(rowData.blog_id)}
        onDelete={confirmDeleteBlog}
        onDeleteSelected={confirmDeleteSelected}
        openNew={createNewBlog}
        dataKey="blog_id"
        title="Quản lý Bài viết"
        onRefresh={refreshData}
      />
      
      <ConfirmDeleteDialog
        visible={deleteBlogDialog}
        onHide={() => setDeleteBlogDialog(false)}
        onConfirm={deleteBlog}
        item={currentBlog}
        idField="blog_id"
        nameField="blog_title"
        title="Xác nhận xóa bài viết"
        message="Bạn có chắc chắn muốn xóa bài viết này? Bạn không thể hoàn tác hành động này."
      />
      
      <ConfirmDeleteDialog
        visible={deleteBlogsDialog}
        onHide={() => setDeleteBlogsDialog(false)}
        onConfirm={deleteSelectedBlogs}
        multiple={true}
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa ${selectedBlogs ? selectedBlogs.length : 0} bài viết đã chọn? Bạn không thể hoàn tác hành động này.`}
      />
    </div>
  );
};

export default BlogsManagementPage;