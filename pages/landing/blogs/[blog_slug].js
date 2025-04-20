import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router'; // dùng Pages Router
import Link from 'next/link';
import { Card } from 'primereact/card';
import { Divider } from 'primereact/divider';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import dynamic from 'next/dynamic';
import blogsService from '../../Services/blogsService';
import styles from './BlogDetail.module.css';
import PublicLayout from '../../../layout/PublicLayout';

const Button = dynamic(() => import('primereact/button').then(mod => mod.Button), { ssr: false });

const BlogDetailPage = () => {
  const [blog, setBlog] = useState(null);
  const [relatedBlogs, setRelatedBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);
  const toast = useRef(null);
  const router = useRouter();
  const { blog_slug: slug } = router.query;

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };

  useEffect(() => {
    if (!slug) return;

    const fetchBlogAndRelated = async () => {
      try {
        setLoading(true);
        const allBlogs = await blogsService.getAll();
        const blogDetail = allBlogs.find(b => b.blog_slug === slug);

        if (!blogDetail) {
          setError('Không tìm thấy bài viết');
          setLoading(false);
          return;
        }

        setBlog(blogDetail);

        try {
          await blogsService.update({
            blog_id: blogDetail.blog_id,
            views: (blogDetail.views || 0) + 1
          });
        } catch (err) {
          console.error('Error updating views:', err);
        }

        const publishedBlogs = allBlogs.filter(b => b.is_published && b.blog_slug !== slug);
        let related = [];

        if (blogDetail.tags) {
          const blogTags = blogDetail.tags.split(',').map(tag => tag.trim());
          related = publishedBlogs
            .filter(b => b.tags)
            .map(b => {
              const bTags = b.tags.split(',').map(tag => tag.trim());
              const matchCount = bTags.filter(tag => blogTags.includes(tag)).length;
              return { blog: b, matchCount };
            })
            .filter(item => item.matchCount > 0)
            .sort((a, b) => b.matchCount - a.matchCount)
            .map(item => item.blog)
            .slice(0, 4);
        }

        if (related.length < 4 && blogDetail.category) {
          const sameCategoryBlogs = publishedBlogs
            .filter(b => b.category === blogDetail.category && !related.some(r => r.blog_slug === b.blog_slug))
            .slice(0, 4 - related.length);
          related = [...related, ...sameCategoryBlogs];
        }

        if (related.length < 4) {
          const randomBlogs = publishedBlogs
            .filter(b => !related.some(r => r.blog_slug === b.blog_slug))
            .sort(() => 0.5 - Math.random())
            .slice(0, 4 - related.length);
          related = [...related, ...randomBlogs];
        }

        setRelatedBlogs(related);
      } catch (err) {
        console.error('Error fetching blog:', err);
        setError('Đã xảy ra lỗi khi tải dữ liệu');
        toast.current?.show({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tải thông tin bài viết' });
      } finally {
        setLoading(false);
      }
    };

    fetchBlogAndRelated();
  }, [slug]);

  if (error) {
    return (
      <div className="flex flex-column align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
        <Toast ref={toast} />
        <i className="pi pi-exclamation-circle text-5xl text-red-500 mb-3"></i>
        <h2>{error}</h2>
        <p className="text-center mb-5">Bài viết này không tồn tại hoặc đã bị xóa.</p>
        <Button label="Quay lại trang blog" icon="pi pi-arrow-left" onClick={() => router.push('/landing/blogs')} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-content-center align-items-center" style={{ height: '70vh' }}>
        <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="4" />
      </div>
    );
  }

  if (!blog) return null;

  return (
    <div className="container mx-auto px-4 py-6 mt-3">
      <Toast ref={toast} />

      <div className="mb-4" style={{ marginTop: '-20px' }}>
        <Link href="/landing/blogs" className={styles.breadcrumbLink}>
          <i className="pi pi-home mr-2"></i>Blog
        </Link>
        <span className="mx-2">{'>'}</span>
        <span className="text-gray-600">{blog.category}</span>
      </div>

      <div className="grid">
        <div className="col-12 lg:col-8">
          <div className={styles.blogDetail}>
            <h1 className={styles.blogTitle}>{blog.blog_title}</h1>

            <div className={styles.blogMeta}>
              <div className="flex align-items-center">
                <div className={styles.authorAvatar}>
                  <i className="pi pi-user"></i>
                </div>
                <div>
                  <div className={styles.authorName}>{blog.blog_author_name || 'Anonymous'}</div>
                  <div className={styles.publishDate}>
                    <i className="pi pi-calendar mr-2"></i>
                    {formatDate(blog.published_at)}
                    <span className="mx-2">•</span>
                    <i className="pi pi-eye mr-2"></i>
                    {blog.views || 0} lượt xem
                  </div>
                </div>
              </div>

              {blog.tags && (
                <div className={styles.tags}>
                  {blog.tags.split(',').map((tag, index) => (
                    <Link key={index} href={`/landing/blogs?tag=${encodeURIComponent(tag.trim())}`} className={styles.tag}>
                      {tag.trim()}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {blog.blog_thumbnail_url && (
              <div className={styles.featuredImage}>
                <img src={blog.blog_thumbnail_url} alt={blog.blog_title} className={styles.thumbnail} />
              </div>
            )}

            <div className={styles.description}>{blog.blog_description}</div>

            <div className={styles.content} dangerouslySetInnerHTML={{ __html: blog.blog_content }} />

            <div className={styles.shareContainer}>
              <p className="font-semibold">Chia sẻ bài viết:</p>
              <div className={styles.socialButtons}>
                <Button icon="pi pi-facebook" className="p-button-rounded p-button-outlined p-button-primary mr-2"
                  onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')}
                />
                <Button icon="pi pi-twitter" className="p-button-rounded p-button-outlined p-button-info mr-2"
                  onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(blog.blog_title)}`, '_blank')}
                />
                <Button icon="pi pi-envelope" className="p-button-rounded p-button-outlined p-button-secondary mr-2"
                  onClick={() => window.open(`mailto:?subject=${encodeURIComponent(blog.blog_title)}&body=${encodeURIComponent(window.location.href)}`, '_blank')}
                />
                <Button icon="pi pi-copy" className="p-button-rounded p-button-outlined p-button-help"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.current?.show({ severity: 'success', summary: 'Thành công', detail: 'Đã sao chép đường dẫn' });
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 lg:col-4">
          <div className="sticky" style={{ top: '20px' }}>
            {blog.blog_author_name && (
              <Card className="mb-4">
                <div className="flex align-items-center">
                  <div className={styles.authorAvatarLarge}>
                    <i className="pi pi-user"></i>
                  </div>
                  <div className="ml-3">
                    <h3 className="m-0 text-lg font-medium">{blog.blog_author_name}</h3>
                    <p className="mt-1 mb-0 text-gray-600">Tác giả</p>
                  </div>
                </div>
              </Card>
            )}

            <Card title="Bài viết liên quan" className="mb-4">
              {relatedBlogs.length > 0 ? (
                <div>
                  {relatedBlogs.map((relatedBlog, index) => (
                    <React.Fragment key={relatedBlog.blog_id}>
                      {index > 0 && <Divider />}
                      <Link href={`/landing/blogs/${relatedBlog.blog_slug}`} className={styles.relatedBlogLink}>
                        <div className="flex">
                          <div className={styles.relatedBlogImage}>
                            {relatedBlog.blog_thumbnail_url ? (
                              <img src={relatedBlog.blog_thumbnail_url} alt={relatedBlog.blog_title} />
                            ) : (
                              <div className={styles.noImage}>
                                <i className="pi pi-image"></i>
                              </div>
                            )}
                          </div>
                          <div className={styles.relatedBlogInfo}>
                            <h4 className={styles.relatedBlogTitle}>{relatedBlog.blog_title}</h4>
                            <div className={styles.relatedBlogMeta}>
                              <i className="pi pi-calendar mr-1"></i>
                              <span>{formatDate(relatedBlog.published_at)}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </React.Fragment>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">Không có bài viết liên quan.</p>
              )}
            </Card>
          </div>
        </div>
      </div>

      <div className="flex justify-content-center mt-6">
        <Button
          label="Quay lại danh sách bài viết"
          icon="pi pi-arrow-left"
          className="p-button-outlined"
          onClick={() => router.push('/landing/blogs')}
        />
      </div>
    </div>
  );
};

BlogDetailPage.getLayout = function getLayout(page) {
  return <PublicLayout>{page}</PublicLayout>;
};

export default BlogDetailPage;
