import React, { useState, useRef, useEffect } from 'react';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Editor } from 'primereact/editor';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Card } from 'primereact/card';
import { Dropdown } from 'primereact/dropdown';
import { Chips } from 'primereact/chips';
import { FileUpload } from 'primereact/fileupload';
import { InputSwitch } from 'primereact/inputswitch';
import { Dialog } from 'primereact/dialog';

import blogsService from '../../Services/blogsService';
import tagsService from '../../Services/TagsService';
import cloudinaryUpload from '../../Services/uploadService'; // Import the cloudinary upload service

const CreateBlogPage = () => {
  const [blog, setBlog] = useState({
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

  const [tags, setTags] = useState([]);
  const [existingTags, setExistingTags] = useState([]);
  const [showAddTagDialog, setShowAddTagDialog] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [loading, setLoading] = useState(false); // Add loading state for upload operations

  const toast = useRef(null);
  const fileUploadRef = useRef(null);

  // Danh mục blog
  const categoryOptions = [
    { label: 'Công nghệ', value: 'cong-nghe' },
    { label: 'Phần mềm', value: 'phan-mem' },
    { label: 'Thiết bị', value: 'thiet-bi' },
    { label: 'Tin tức', value: 'tin-tuc' },
    { label: 'Đánh giá', value: 'danh-gia' }
  ];

  // Tải danh sách tags hiện có khi component mount
  useEffect(() => {
    const fetchExistingTags = async () => {
      try {
        const fetchedTags = await tagsService.getAll();
        setExistingTags(fetchedTags.map(tag => tag.tag_name));
      } catch (error) {
        console.error('Error fetching existing tags:', error);
      }
    };

    fetchExistingTags();
  }, []);

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

  // Improved thumbnail upload using cloudinary
  const handleThumbnailUpload = async (event) => {
    try {
      setLoading(true); // Set loading state
      
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
      setLoading(false); // Reset loading state
      // Clear the fileUpload component
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


  // Xử lý submit blog
  const handleSubmit = async () => {
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
      setLoading(true); // Set loading state for submission
      
      // Validate thumbnail
      if (!blog.blog_thumbnail_url) {
        toast.current.show({
          severity: 'warn', 
          summary: 'Cảnh báo', 
          detail: 'Bạn chưa thêm ảnh thumbnail. Bạn có muốn tiếp tục?'
        });
        // User can still continue without thumbnail
      }
      
      // Prepare the blog data with tags as a comma-separated string
      const blogData = {
        ...blog,
        tags: tags.join(',') // Store tags directly in the blogs table
      };
      
      console.log('Submitting blog data:', blogData);
      
      // Tạo blog mới
      const blogResponse = await blogsService.insert(blogData);
      
      console.log('Blog created successfully:', blogResponse);
      
      // Show success message
      toast.current.show({
        severity: 'success', 
        summary: 'Thành công', 
        detail: 'Đã tạo blog thành công'
      });

      // Reset form
      setBlog({
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

      // Reset tags
      setTags([]);

      // Reset file upload
      if (fileUploadRef.current) {
        fileUploadRef.current.clear();
      }

    } catch (error) {
      console.error('Blog creation error:', error);
      
      // More detailed error message based on the error type
      let errorMessage = 'Không thể tạo blog. Vui lòng thử lại.';
      
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
      setLoading(false); // Reset loading state
    }
  };

  return (
    <div className="grid justify-content-center">
      <Toast ref={toast} />
      <div className="col-12 md:col-10 lg:col-8">
        <Card 
          title="Tạo Blog Mới" 
          className="shadow-2"
          style={{ 
            borderTop: '4px solid #FF6B6B', 
            backgroundColor: 'white' 
          }}
        >
          <div className="grid p-fluid">
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

            {/* Thumbnail - Improved with Cloudinary upload */}
            <div className="col-12">
              <label className="font-bold">Ảnh thumbnail</label>
              <FileUpload 
                ref={fileUploadRef}
                mode="basic" 
                name="thumbnail" 
                url="/api/upload" // This is a placeholder, actual upload happens in handleThumbnailUpload
                accept="image/*" 
                maxFileSize={5000000} // 5MB limit
                onSelect={handleThumbnailUpload}
                auto={false} // Disable auto upload
                customUpload={true} // Use custom upload handler
                uploadHandler={handleThumbnailUpload}
                chooseLabel="Chọn ảnh" 
                className="mt-2"
                disabled={loading} // Disable during upload
              />
              {loading && <small className="block mt-2">Đang tải ảnh lên...</small>}
              {blog.blog_thumbnail_url && (
                <div className="mt-2">
                  <img 
                    src={blog.blog_thumbnail_url} 
                    alt="Thumbnail" 
                    className="mt-2 border-round"
                    style={{ maxHeight: '200px', objectFit: 'cover' }}
                  />
                </div>
              )}
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

            {/* Nội dung */}
            <div className="col-12">
              <label className="font-bold">Nội dung</label>
              <Editor 
                value={blog.blog_content}
                onTextChange={(e) => setBlog(prev => ({...prev, blog_content: e.htmlValue || ''}))}
                style={{ height: '320px' }}
                placeholder="Nhập nội dung blog"
              />
            </div>

            {/* Thông tin bổ sung */}
            <div className="col-12 md:col-6">
              <label htmlFor="blog_author_name" className="font-bold">Tác giả</label>
              <InputText 
                id="blog_author_name"
                value={blog.blog_author_name}
                onChange={(e) => setBlog(prev => ({...prev, blog_author_name: e.target.value}))}
                placeholder="Nhập tên tác giả"
                className="mt-0"
              />
            </div>

            <div className="col-12 md:col-6">
              <label htmlFor="category" className="font-bold mb-0">Danh mục</label>
              <Dropdown 
                id="category"
                value={blog.category}
                options={categoryOptions}
                onChange={(e) => setBlog(prev => ({...prev, category: e.value}))}
                placeholder="Chọn danh mục"
                className="mt-1"
                style={{height:'43px'}}
              />
            </div>

            {/* Tags */}
            <div className="col-12">
              <Chips 
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.value)}
                onAdd={(e) => handleAddTag(e.value)}
                placeholder="Nhập tags và nhấn Enter"
                className="mt-2"
                suggestions={existingTags}
                optionLabel="tag_name"
              />
            </div>

            {/* Trạng thái xuất bản */}
            <div className="col-12">
              <div className="flex align-items-center">
                <InputSwitch 
                  checked={blog.is_published}
                  onChange={(e) => setBlog(prev => ({...prev, is_published: e.value}))}
                />
                <label className="ml-2">Xuất bản ngay</label>
              </div>
            </div>

            {/* Nút submit */}
            <div className="col-12">
              <Button 
                label="Tạo Blog" 
                icon="pi pi-save"
                onClick={handleSubmit}
                className="mt-3"
                style={{ 
                  backgroundColor: '#2ECC71', 
                  borderColor: '#2ECC71' 
                }}
                loading={loading} // Show loading state on button
                disabled={loading} // Disable button during loading
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CreateBlogPage;