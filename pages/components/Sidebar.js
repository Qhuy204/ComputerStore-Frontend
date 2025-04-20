import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import categoriesService from '../Services/categoriesService';

const Sidebar = ({ position, className, style }) => {
  const [categories, setCategories] = useState([]);
  
  // Pre-defined menu items with URL-friendly category names
  const menuItems = [
    { id: 'laptop-link', label: 'Laptop', categoryName: 'laptop' },
    { id: 'pc-link', label: 'Máy tính bàn', categoryName: 'may-tinh-ban' },
    { id: 'manhinh-link', label: 'Màn hình', categoryName: 'man-hinh' },
    { id: 'banphim-chuot-link', label: 'Bàn phím, Chuột', categoryName: 'ban-phim-chuot' },
    { id: 'card-do-hoa-link', label: 'Card đồ họa', categoryName: 'card-do-hoa' },
    { id: 'main-cpu-link', label: 'Main, CPU', categoryName: 'main-cpu' },
    { id: 'o-cung-link', label: 'Ổ cứng', categoryName: 'o-cung' },
    { id: 'loa-tai-nghe-link', label: 'Loa, tai nghe', categoryName: 'loa-tai-nghe' },
    { id: 'phu-kien-link', label: 'Phụ kiện', categoryName: 'phu-kien' },
    { id: 'ram-link', label: 'RAM', categoryName: 'ram' },
  ];
  
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const allCategories = await categoriesService.getAll();
        setCategories(allCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    
    fetchCategories();
  }, []);
  
  // Mặc định các style nếu không có position được cung cấp
  const defaultStyles = {
    position: 'relative',
    ...style
  };
  
  // Xác định style dựa trên position prop
  const positionStyles = position ? {
    position: 'absolute',
    ...position,
    ...style
  } : defaultStyles;
  
  return (
    <div 
      id="sidebar" 
      className={className}
      style={positionStyles}
    >
      {menuItems.map(menuItem => (
        <Link 
          key={menuItem.id}
          href={`/landing/collections/${menuItem.categoryName}`}
          id={menuItem.id}
          className="sidebar-menu-item"
        >
          <img 
            src={`/Image/Icon/${menuItem.categoryName}.png`} 
            alt={menuItem.label} 
          />
          <span>{menuItem.label}</span>
        </Link>
      ))}
    </div>
  );
};

// Thiết lập giá trị mặc định cho props
Sidebar.defaultProps = {
  className: '',
  style: {},
  position: null
};

export default Sidebar;