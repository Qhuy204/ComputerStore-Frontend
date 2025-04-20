import React, { useState, useRef, useEffect } from 'react';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Card } from 'primereact/card';
import { Dropdown } from 'primereact/dropdown';
import { Chips } from 'primereact/chips';
import { FileUpload } from 'primereact/fileupload';
import { InputSwitch } from 'primereact/inputswitch';
import { Dialog } from 'primereact/dialog';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Import Quill CSS
import "react-quill/dist/quill.snow.css";
// Dynamic import for ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

import blogsService from '../../../Services/blogsService';
import tagsService from '../../../Services/TagsService';
import cloudinaryUpload from '../../../Services/uploadService';

const EditBlogPage = () => {
  // Hàm định dạng datetime
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      
      // Kiểm tra xem đối tượng date có hợp lệ không
      if (isNaN(date.getTime())) {
        return 'Ngày không hợp lệ';
      }
      
      // Định dạng ngày tháng theo chuẩn Việt Nam (dd/MM/yyyy HH:mm)
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Lỗi định dạng ngày';
    }
  };

  const [blog, setBlog] = useState({
    blog_id: '',
    blog_title: '',
    blog_slug: '',
    blog_thumbnail_url: '',
    blog_description: '',
    blog_content: '',
    blog_author_name: '',
    category: '',
    tags: '',
    is_published: true,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [tags, setTags] = useState([]);
  const [existingTags, setExistingTags] = useState([]);
  const [showAddTagDialog, setShowAddTagDialog] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [blogId, setBlogId] = useState('');

  const toast = useRef(null);
  const fileUploadRef = useRef(null);
  const params = useParams();
  const router = useRouter();

  // Lấy blogId từ URL path - đặt trong useEffect để tránh infinite loop
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pathParts = window.location.pathname.split('/');
      const idFromPath = pathParts[pathParts.length - 1];
      setBlogId(idFromPath);
      console.log('Blog ID từ URL:', idFromPath);
    }
  }, []);

  // Danh mục blog
  const categoryOptions = [
    { label: 'Công nghệ', value: 'cong-nghe' },
    { label: 'Phần mềm', value: 'phan-mem' },
    { label: 'Thiết bị', value: 'thiet-bi' },
    { label: 'Tin tức', value: 'tin-tuc' },
    { label: 'Đánh giá', value: 'danh-gia' }
  ];

  // Fetch blog data and tags when component mounts or blogId changes
  useEffect(() => {
    const fetchData = async () => {
      // Chỉ fetch khi có blogId và chưa fetch trước đó
      if (!blogId) return;
      
      try {
        setIsLoading(true);

        // Fetch existing tags
        const fetchedTags = await tagsService.getAll();
        setExistingTags(fetchedTags.map(tag => tag.tag_name));
        console.log('blog_id:', blogId);
        
        // Fetch blog data
        console.log('Fetching blog data for ID:', blogId);
        const blogDataResponse = await blogsService.getById(blogId);
        console.log('Received blog data:', blogDataResponse);
        
        // Xử lý trường hợp dữ liệu trả về là mảng
        let blogData;
        if (Array.isArray(blogDataResponse) && blogDataResponse.length > 0) {
          blogData = blogDataResponse[0]; // Lấy phần tử đầu tiên của mảng
          console.log('Using first blog from array:', blogData);
        } else {
          blogData = blogDataResponse; // Sử dụng trực tiếp nếu không phải mảng
        }
        
        if (blogData) {
          // Parse tags if they exist
          if (blogData.tags) {
            const tagArray = blogData.tags.split(',').filter(tag => tag.trim() !== '');
            setTags(tagArray);
          }
          
          // Update the blog state with fetched data
          setBlog({
            blog_id: blogData.blog_id,
            blog_title: blogData.blog_title || '',
            blog_slug: blogData.blog_slug || '',
            blog_thumbnail_url: blogData.blog_thumbnail_url || '',
            blog_description: blogData.blog_description || '',
            blog_content: blogData.blog_content || '',
            blog_author_name: blogData.blog_author_name || '',
            category: blogData.category || '',
            is_published: blogData.is_published === true || blogData.is_published === 1 || blogData.is_published === 'true' || blogData.is_published === '1',
            published_at: blogData.published_at,
            updated_at: blogData.updated_at,
            views: blogData.views
          });
          
          setDataLoaded(true);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.current.show({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể tải dữ liệu blog',
          life: 3000
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [blogId]);

  // Debug log to check if blog state is being populated
  useEffect(() => {
    if (dataLoaded) {
      console.log('Blog state after data load:', blog);
    }
  }, [dataLoaded, blog]);

  // Chuyển đổi tiêu đề sang slug
  const convertToSlug = (text) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đ]/g, 'd')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  // Xử lý thay đổi tiêu đề
  const handleTitleChange = (e) => {
    const title = e.target.value;
    setBlog(prev => ({
      ...prev,
      blog_title: title,
      blog_slug: convertToSlug(title)
    }));
  };

  // Thumbnail upload using cloudinary
  const handleThumbnailUpload = async (event) => {
    try {
      setLoading(true);
      
      const file = event.files[0];
      if (file) {
        // Use cloudinary upload service
        const response = await cloudinaryUpload(file);
        
        // Update blog with the secure URL from cloudinary
        if (response && response.secure_url) {
          setBlog(prev => ({
            ...prev,
            blog_thumbnail_url: response.secure_url
          }));
          
          toast.current.show({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Đã tải ảnh lên thành công'
          });
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.current.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể tải ảnh lên. Vui lòng thử lại.'
      });
    } finally {
      setLoading(false);
      if (fileUploadRef.current) {
        fileUploadRef.current.clear();
      }
    }
  };

  // Xử lý thêm tags mới
  const handleAddTag = async (newTag) => {
    try {
      // Nếu tag chưa tồn tại, thêm vào danh sách tags
      if (!existingTags.includes(newTag)) {
        await tagsService.insert({ tag_name: newTag });
        setExistingTags(prev => [...prev, newTag]);
      }
      setTags(prev => [...prev, newTag]);
    } catch (error) {
      toast.current.show({
        severity: 'error', 
        summary: 'Lỗi', 
        detail: 'Không thể thêm tag mới'
      });
    }
  };

  // Xử lý submit cập nhật blog
  const handleUpdate = async () => {
    // Validate
    if (!blog.blog_title.trim()) {
      toast.current.show({
        severity: 'error', 
        summary: 'Lỗi', 
        detail: 'Vui lòng nhập tiêu đề blog'
      });
      return;
    }

    try {
      setLoading(true);
      
      // Validate thumbnail
      if (!blog.blog_thumbnail_url) {
        toast.current.show({
          severity: 'warn', 
          summary: 'Cảnh báo', 
          detail: 'Bạn chưa thêm ảnh thumbnail. Bạn có muốn tiếp tục?'
        });
      }
      
      // Đảm bảo blog_id được đặt đúng từ URL
      if (!blog.blog_id) {
        blog.blog_id = blogId;
      }
      
      // Chỉ lấy các trường cần thiết để cập nhật
      const blogDataToUpdate = {
        blog_id: blog.blog_id,
        blog_title: blog.blog_title,
        blog_slug: blog.blog_slug,
        blog_thumbnail_url: blog.blog_thumbnail_url,
        blog_description: blog.blog_description,
        blog_content: blog.blog_content,
        blog_author_name: blog.blog_author_name,
        category: blog.category,
        tags: tags.join(','),
        is_published: Boolean(blog.is_published)
      };
      
      console.log('Updating blog data:', JSON.stringify(blogDataToUpdate));
      console.log('Using blog_id for update:', blogDataToUpdate.blog_id);
      
      // Cập nhật blog
      await blogsService.update(blogDataToUpdate);
      
      toast.current.show({
        severity: 'success', 
        summary: 'Thành công', 
        detail: 'Đã cập nhật blog thành công'
      });

    } catch (error) {
      console.error('Blog update error:', error);
      
      let errorMessage = 'Không thể cập nhật blog. Vui lòng thử lại.';
      
      if (error.response && error.response.data) {
        errorMessage = `Lỗi: ${error.response.data.message || error.response.statusText}`;
      } else if (error.message) {
        errorMessage = `Lỗi: ${error.message}`;
      }
      
      toast.current.show({
        severity: 'error', 
        summary: 'Lỗi', 
        detail: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle navigation back to blog listing
  const handleCancel = () => {
    router.push('/admin/blogs/listblogs');
  };

  // Configuration for Quill editor
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean']
    ],
  };

  const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'color', 'background',
    'align',
    'link', 'image'
  ];

  if (isLoading) {
    return (
      <div className="flex justify-content-center align-items-center" style={{ height: '70vh' }}>
        <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="4" fill="var(--surface-ground)" animationDuration=".5s" />
        <span className="ml-3 font-medium">Đang tải...</span>
      </div>
    );
  }

  return (
    <div className="grid justify-content-center">
      <Toast ref={toast} />
      <div className="col-12 md:col-10 lg:col-8">
        <Card 
          className="shadow-2"
          style={{ 
            backgroundColor: 'white' 
          }}
          header={
            <div className="flex justify-content-between align-items-center p-3 bg-blue-50">
              <h2 className="m-0 text-xl font-semibold">Chỉnh sửa Blog</h2>
              <div>
                <Button 
                  label="Quay lại" 
                  icon="pi pi-arrow-left" 
                  className="p-button-outlined p-button-secondary mr-2" 
                  onClick={handleCancel}
                />
                <Button 
                  label="Lưu thay đổi" 
                  icon="pi pi-save" 
                  className="p-button-primary" 
                  onClick={handleUpdate}
                  loading={loading}
                />
              </div>
            </div>
          }
        >
          <div className="grid p-fluid">
            {/* Debug Info */}
            {process.env.NODE_ENV !== 'production' && (
              <div className="col-12 text-xs text-gray-500 mb-2">
                Blog ID: {blog.blog_id || 'N/A'}
              </div>
            )}

            {/* Tiêu đề */}
            <div className="col-12">
              <label htmlFor="blog_title" className="font-bold">Tiêu đề</label>
              <InputText 
                id="blog_title"
                value={blog.blog_title}
                onChange={handleTitleChange}
                placeholder="Nhập tiêu đề blog"
                className="mt-2"
              />
            </div>

            {/* Slug */}
            <div className="col-12">
              <label htmlFor="blog_slug" className="font-bold">Đường dẫn</label>
              <InputText 
                id="blog_slug"
                value={blog.blog_slug}
                onChange={(e) => setBlog(prev => ({...prev, blog_slug: e.target.value}))}
                placeholder="Đường dẫn tự động"
                className="mt-2"
              />
            </div>

            {/* Thumbnail */}
            <div className="col-12">
              <label className="font-bold">Ảnh thumbnail</label>
              <div className="flex flex-column">
                {blog.blog_thumbnail_url && (
                  <div className="mb-3">
                    <img 
                      src={blog.blog_thumbnail_url} 
                      alt="Thumbnail" 
                      className="mt-2 border-round"
                      style={{ maxHeight: '200px', objectFit: 'cover' }}
                    />
                  </div>
                )}
                <FileUpload 
                  ref={fileUploadRef}
                  mode="basic" 
                  name="thumbnail" 
                  url="/api/upload"
                  accept="image/*" 
                  maxFileSize={5000000}
                  onSelect={handleThumbnailUpload}
                  auto={false}
                  customUpload={true}
                  uploadHandler={handleThumbnailUpload}
                  chooseLabel="Đổi ảnh" 
                  className="mt-2"
                  disabled={loading}
                />
                {loading && <small className="block mt-2">Đang tải ảnh lên...</small>}
              </div>
            </div>

            {/* Mô tả ngắn */}
            <div className="col-12">
              <label htmlFor="blog_description" className="font-bold">Mô tả ngắn</label>
              <InputTextarea 
                id="blog_description"
                value={blog.blog_description}
                onChange={(e) => setBlog(prev => ({...prev, blog_description: e.target.value}))}
                rows={3}
                placeholder="Nhập mô tả ngắn cho blog"
                className="mt-2"
              />
            </div>

            {/* Nội dung - Using ReactQuill instead of PrimeReact Editor */}
            <div className="col-12">
              <label className="font-bold mb-2 block">Nội dung</label>
              {!isLoading && (
                <div style={{ height: '500px', marginBottom: '50px' }}>
                  <ReactQuill
                    theme="snow"
                    value={blog.blog_content}
                    onChange={(content) => setBlog(prev => ({ ...prev, blog_content: content }))}
                    modules={quillModules}
                    formats={quillFormats}
                    style={{ height: '450px' }}
                    placeholder="Nhập nội dung blog"
                  />
                </div>
              )}
            </div>

            {/* Thông tin bổ sung */}
            <div className="col-12 md:col-6">
              <label htmlFor="blog_author_name" className="font-bold">Tác giả</label>
              <InputText 
                id="blog_author_name"
                value={blog.blog_author_name}
                onChange={(e) => setBlog(prev => ({...prev, blog_author_name: e.target.value}))}
                placeholder="Nhập tên tác giả"
                className="mt-1"
                style={{height:'44px', marginTop:'-2px'}}
              />
            </div>

            <div className="col-12 md:col-6">
              <label htmlFor="category" className="font-bold">Danh mục</label>
              <Dropdown 
                id="category"
                value={blog.category}
                options={categoryOptions}
                onChange={(e) => setBlog(prev => ({...prev, category: e.value}))}
                placeholder="Chọn danh mục"
                className="mt-2"
                style={{height:'45px'}}
              />
            </div>

            {/* Tags */}
            <div className="col-12">
              <div className="flex align-items-center gap-2">
                <label htmlFor="tags" className="font-bold flex-grow-1">Thẻ tags</label>
              </div>
              <Chips 
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.value)}
                onAdd={(e) => handleAddTag(e.value)}
                placeholder="Nhập tags và nhấn Enter"
                className="mt-2"
                suggestions={existingTags}
              />
            </div>

            {/* Trạng thái xuất bản */}
            <div className="col-12">
              <div className="flex align-items-center">
                <InputSwitch 
                  checked={blog.is_published}
                  onChange={(e) => setBlog(prev => ({...prev, is_published: e.value}))}
                />
                <label className="ml-2">
                  {blog.is_published ? 'Đã xuất bản' : 'Bản nháp'}
                </label>
              </div>
            </div>

            {/* Meta info */}
            {blog.published_at && (
              <div className="col-12">
                <div className="p-3 bg-gray-100 mt-3 text-sm rounded-lg shadow-sm">
                  <div className="flex align-items-center mb-2">
                    <i className="pi pi-calendar mr-2 text-blue-500"></i>
                    <span className="font-semibold mr-2">Ngày tạo:</span> 
                    <span>{formatDateTime(blog.published_at)}</span>
                  </div>
                  
                  {blog.updated_at && (
                    <div className="flex align-items-center mb-2">
                      <i className="pi pi-sync mr-2 text-green-500"></i>
                      <span className="font-semibold mr-2">Cập nhật lần cuối:</span> 
                      <span>{formatDateTime(blog.updated_at)}</span>
                    </div>
                  )}
                  
                  {blog.views !== undefined && (
                    <div className="flex align-items-center">
                      <i className="pi pi-eye mr-2 text-purple-500"></i>
                      <span className="font-semibold mr-2">Lượt xem:</span> 
                      <span>{blog.views !== null ? blog.views.toLocaleString('vi-VN') : '0'}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Nút điều hướng */}
            <div className="w-full max-w-4xl mx-auto px-4 mt-4">
              <div className="flex justify-between items-center" style={{justifyContent:'space-between'}}>
                <Button 
                  label="Quay lại" 
                  icon="pi pi-arrow-left"
                  className="p-button-outlined p-button-secondary"
                  onClick={handleCancel}
                  style={{width:'25%'}}
                />
                
                <Button 
                  label="Lưu thay đổi" 
                  icon="pi pi-save"
                  onClick={handleUpdate}
                  className="p-button-primary"
                  loading={loading}
                  disabled={loading}
                  style={{width:'25%'}}
                />
              </div>
            </div>

          </div>
        </Card>
      </div>

    </div>
  );
};

export default EditBlogPage;