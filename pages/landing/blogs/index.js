import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { InputText } from 'primereact/inputtext';
import { Paginator } from 'primereact/paginator';
import { Skeleton } from 'primereact/skeleton';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import blogsService from '../../Services/blogsService';
import tagsService from '../../Services/TagsService';
import styles from './BlogList.module.css';
import PublicLayout from '../../../layout/PublicLayout';

// Giải pháp tốt nhất là sử dụng dynamic import với { ssr: false } cho component Button
const Button = dynamic(() => import('primereact/button').then(mod => mod.Button), {
  ssr: false
});

const BlogListPage = () => {
  const [blogs, setBlogs] = useState([]);
  const [filteredBlogs, setFilteredBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allTags, setAllTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);
  const [featuredBlogs, setFeaturedBlogs] = useState([]);
  const [mounted, setMounted] = useState(false);

  // Theo dõi khi component được mount hoàn toàn ở client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Định dạng thời gian
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };

  // Cắt ngắn mô tả
  const truncateText = (text, maxLength = 150) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  // Lấy dữ liệu blogs và tags khi component được tải
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Lấy danh sách tất cả các blogs
        const blogsData = await blogsService.getAll();
        
        // Lọc chỉ lấy các blogs đã được xuất bản
        const publishedBlogs = blogsData.filter(blog => blog.is_published);
        setBlogs(publishedBlogs);
        setFilteredBlogs(publishedBlogs);
        
        // Lấy 3 bài viết có lượt xem cao nhất làm featured
        const featured = [...publishedBlogs]
          .sort((a, b) => (b.views || 0) - (a.views || 0))
          .slice(0, 3);
        setFeaturedBlogs(featured);
        
        // Lấy danh sách tất cả các tags
        const tagsData = await tagsService.getAll();
        setAllTags(tagsData.map(tag => tag.tag_name));
        
        // Tạo danh sách các danh mục duy nhất từ blogs
        const uniqueCategories = [...new Set(publishedBlogs.map(blog => blog.category))].filter(Boolean);
        const categoryOptions = uniqueCategories.map(category => {
          // Mapping từ giá trị slug sang label hiển thị
          const categoryMapping = {
            'cong-nghe': 'Công nghệ',
            'phan-mem': 'Phần mềm',
            'thiet-bi': 'Thiết bị',
            'tin-tuc': 'Tin tức',
            'danh-gia': 'Đánh giá'
          };
          
          return {
            label: categoryMapping[category] || category,
            value: category
          };
        });
        
        setCategories([{ label: 'Tất cả danh mục', value: null }, ...categoryOptions]);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Lọc blogs dựa trên tags, danh mục và tìm kiếm
  useEffect(() => {
    let result = [...blogs];
    
    // Lọc theo tags được chọn
    if (selectedTags.length > 0) {
      result = result.filter(blog => {
        if (!blog.tags) return false;
        const blogTags = blog.tags.split(',').map(tag => tag.trim());
        return selectedTags.some(tag => blogTags.includes(tag));
      });
    }
    
    // Lọc theo danh mục
    if (selectedCategory) {
      result = result.filter(blog => blog.category === selectedCategory);
    }
    
    // Lọc theo từ khóa tìm kiếm
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(blog => 
        (blog.blog_title && blog.blog_title.toLowerCase().includes(query)) || 
        (blog.blog_description && blog.blog_description.toLowerCase().includes(query)) ||
        (blog.blog_author_name && blog.blog_author_name.toLowerCase().includes(query))
      );
    }
    
    setFilteredBlogs(result);
    setFirst(0); // Reset paginator khi thay đổi bộ lọc
  }, [blogs, selectedTags, selectedCategory, searchQuery]);

  // Hàm xử lý thay đổi trang
  const onPageChange = (event) => {
    setFirst(event.first);
    setRows(event.rows);
    
    // Cuộn lên đầu trang khi chuyển trang
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Render blogs đang hiển thị phân trang
  const currentBlogs = filteredBlogs.slice(first, first + rows);

  // Render phần banner quảng cáo
  const renderBanner = () => (
    <div className={styles.banner}>
      <div className={styles.bannerContent}>
        <h2>THU CŨ ĐỔI MỚI</h2>
        <h1>NÂNG CẤP PC</h1>
        <p>Giảm đến 1.000.000đ</p>
  
        {mounted ? (
          <Link href="/landing/blogs/gearvn-chinh-sach-bang-gia-thu-san-pham-da-qua-su-dung" passHref legacyBehavior>
            <a>
              <Button label="Xem ngay" className="p-button-primary" />
            </a>
          </Link>
        ) : (
          <div className="p-button p-component p-button-primary">
            <span className="p-button-label">Xem ngay</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={styles.blogListContainer}>
      {/* Banner */}
      {renderBanner()}
      
      <div className={styles.contentContainer}>
        {/* Bài viết nổi bật */}
        {featuredBlogs.length > 0 && !loading && (
          <section className={styles.featuredSection}>
            <h2 className={styles.sectionTitle}>Bài viết nổi bật</h2>
            <div className={styles.featuredGrid}>
              {featuredBlogs.map((blog, index) => (
                <Link href={`/landing/blogs/${blog.blog_slug}`} key={blog.blog_id} className={index === 0 ? styles.featuredMainCard : styles.featuredCard}>
                  <div className={styles.featuredCardInner}>
                    <div className={styles.featuredImageContainer}>
                      {blog.blog_thumbnail_url ? (
                        <img 
                          src={blog.blog_thumbnail_url} 
                          alt={blog.blog_title} 
                          className={styles.featuredImage}
                        />
                      ) : (
                        <div className={styles.featuredPlaceholder}>
                          <i className="pi pi-image"></i>
                        </div>
                      )}
                    </div>
                    <div className={styles.featuredOverlay}>
                      <div className={styles.featuredCategory}>{blog.category}</div>
                      <h3 className={styles.featuredTitle} style={{color:'#FFF'}}>{blog.blog_title}</h3>
                      {index === 0 && (
                        <p className={styles.featuredDescription} >{truncateText(blog.blog_description, 200)}</p>
                      )}
                      <div className={styles.featuredMeta}>
                        <span><i className="pi pi-user mr-1"></i>{blog.blog_author_name || 'Anonymous'}</span>
                        <span><i className="pi pi-calendar mr-1"></i>{formatDate(blog.published_at)}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className={styles.mainContent}>
          <div className={styles.filterSection}>
            <h2 className={styles.sectionTitle}>Danh sách bài viết</h2>
            
            {/* Bộ lọc và tìm kiếm */}
            <div className={styles.filterContainer}>
              <div className={styles.searchBox}>
                <span className="p-input-icon-left w-full">
                  <i className="pi pi-search" />
                  <InputText 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                    placeholder="Tìm kiếm bài viết" 
                    className="w-full"
                  />
                </span>
              </div>
              <div className={styles.filterDropdown}>
                <Dropdown
                  value={selectedCategory}
                  options={categories}
                  onChange={(e) => setSelectedCategory(e.value)}
                  placeholder="Chọn danh mục"
                  className="w-full"
                />
              </div>
              <div className={styles.filterDropdown}>
                <MultiSelect
                  value={selectedTags}
                  options={allTags}
                  onChange={(e) => setSelectedTags(e.value)}
                  placeholder="Lọc theo tags"
                  filter
                  showClear
                  className="w-full"
                />
              </div>
            </div>
            
            {loading ? (
              // Hiển thị skeleton khi đang tải
              <div className={styles.blogGrid}>
                {[...Array(6)].map((_, index) => (
                  <div key={index} className={styles.skeletonCard}>
                    <Skeleton height="200px" className="mb-2" />
                    <Skeleton width="70%" height="2rem" className="mb-2" />
                    <Skeleton width="40%" height="1.5rem" className="mb-2" />
                    <Skeleton height="4rem" />
                  </div>
                ))}
              </div>
            ) : filteredBlogs.length > 0 ? (
              <>
                {/* Hiển thị kết quả */}
                <p className={styles.resultCount}>{filteredBlogs.length} bài viết được tìm thấy</p>
                
                {/* Danh sách blogs */}
                <div className={styles.blogGrid}>
                  {currentBlogs.map((blog) => (
                    <Link href={`/landing/blogs/${blog.blog_slug}`} key={blog.blog_id} className={styles.blogLink}>
                      <Card className={styles.blogCard}>
                        <div className={styles.cardContent}>
                          {blog.blog_thumbnail_url ? (
                            <div className={styles.thumbnailContainer}>
                              <img 
                                src={blog.blog_thumbnail_url} 
                                alt={blog.blog_title} 
                                className={styles.thumbnail}
                              />
                            </div>
                          ) : (
                            <div className={styles.placeholderThumbnail}>
                              <i className="pi pi-image"></i>
                            </div>
                          )}
                          <div className={styles.blogInfo}>
                            <div className={styles.blogCategory}>
                              {blog.category === 'cong-nghe' && 'Công nghệ'}
                              {blog.category === 'phan-mem' && 'Phần mềm'}
                              {blog.category === 'thiet-bi' && 'Thiết bị'}
                              {blog.category === 'tin-tuc' && 'Tin tức'}
                              {blog.category === 'danh-gia' && 'Đánh giá'}
                              {!['cong-nghe', 'phan-mem', 'thiet-bi', 'tin-tuc', 'danh-gia'].includes(blog.category) && blog.category}
                            </div>
                            <h3 className={styles.blogTitle}>{blog.blog_title}</h3>
                            <p className={styles.blogDescription}>{truncateText(blog.blog_description, 120)}</p>
                            <div className={styles.blogMeta}>
                              <span><i className="pi pi-user mr-1"></i>{blog.blog_author_name || 'Anonymous'}</span>
                              <span><i className="pi pi-calendar mr-1"></i>{formatDate(blog.published_at)}</span>
                              <span><i className="pi pi-eye mr-1"></i>{blog.views || 0} lượt xem</span>
                            </div>
                            {blog.tags && (
                              <div className={styles.tagContainer}>
                                {blog.tags.split(',').slice(0, 3).map((tag, index) => (
                                  <span key={index} className={styles.tag}>{tag.trim()}</span>
                                ))}
                                {blog.tags.split(',').length > 3 && (
                                  <span className={styles.tagMore}>+{blog.tags.split(',').length - 3}</span>
                                )}
                              </div>
                            )}
                            <div className={styles.readMore}>
                              <span>Đọc tiếp</span>
                              <i className="pi pi-arrow-right ml-2"></i>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
                
                {/* Phân trang */}
                <Paginator 
                  first={first} 
                  rows={rows} 
                  totalRecords={filteredBlogs.length} 
                  onPageChange={onPageChange}
                  className={styles.paginator}
                  template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
                />
              </>
            ) : (
              <div className={styles.emptyResults}>
                <i className="pi pi-search"></i>
                <h3>Không tìm thấy kết quả</h3>
                <p>Không có bài viết nào phù hợp với tiêu chí tìm kiếm của bạn.</p>
                {mounted ? (
                  <Button 
                    label="Xóa bộ lọc"
                    icon="pi pi-filter-slash"
                    className="p-button-outlined"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory(null);
                      setSelectedTags([]);
                    }}
                  />
                ) : (
                  <button 
                    className="p-button p-component p-button-outlined"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory(null);
                      setSelectedTags([]);
                    }}
                  >
                    <span className="p-button-icon p-button-icon-left pi pi-filter-slash"></span>
                    <span className="p-button-label">Xóa bộ lọc</span>
                  </button>
                )}
              </div>
            )}
          </div>
          
          <div className={styles.sidebarSection}>
            {/* Popular tags */}
            <div className={styles.sidebarCard}>
              <h3 className={styles.sidebarTitle}>Tags phổ biến</h3>
              <div className={styles.popularTags}>
                {allTags.slice(0, 10).map((tag, index) => (
                  <div 
                    key={index} 
                    className={styles.popularTag}
                    onClick={() => {
                      if (selectedTags.includes(tag)) {
                        setSelectedTags(selectedTags.filter(t => t !== tag));
                      } else {
                        setSelectedTags([...selectedTags, tag]);
                      }
                    }}
                  >
                    <span>{tag}</span>
                    <span className={styles.tagCount}>{blogs.filter(blog => blog.tags && blog.tags.includes(tag)).length}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Bài viết phổ biến */}
            <div className={styles.sidebarCard}>
              <h3 className={styles.sidebarTitle}>Bài viết phổ biến</h3>
              <div className={styles.popularPosts}>
                {blogs
                  .sort((a, b) => (b.views || 0) - (a.views || 0))
                  .slice(0, 10)
                  .map((blog, index) => (
                    <Link href={`/landing/blogs/${blog.blog_slug}`} key={blog.blog_id} className={styles.popularPost}>
                      <div className={styles.popularPostNumber}>{index + 1}</div>
                      <div className={styles.popularPostInfo}>
                        <h4 className={styles.popularPostTitle}>{blog.blog_title}</h4>
                        <div className={styles.popularPostMeta}>
                          <span><i className="pi pi-eye mr-1"></i>{blog.views || 0} lượt xem</span>
                        </div>
                      </div>
                    </Link>
                  ))}
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
};

BlogListPage.getLayout = function getLayout(page) {
    return <PublicLayout>{page}</PublicLayout>
  }
export default BlogListPage;