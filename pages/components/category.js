import Link from 'next/link';
import React from 'react';
import Image from 'next/image';

const Sidebar = () => {
  return (
    <div className="sidebar">
      <ul className="menu-list">
        <li>
          <Link href="/new-components" className="sidebar-item">
            <Image src="/Image/Icon/cpu.png" alt="New Parts" width={24} height={24} />
            <span>Linh Kiện Mới</span>
          </Link>
        </li>
        <li>
          <Link href="/storage" className="sidebar-item">
            <Image src="/Image/Icon/ssd.png" alt="Storage" width={24} height={24} />
            <span>SSD - HDD - USB</span>
          </Link>
        </li>
        <li>
          <Link href="/landing/laptop" className="sidebar-item">
            <Image src="/Image/Icon/laptop.png" alt="Laptop" width={24} height={24} />
            <span>Laptop</span>
          </Link>
        </li>
        <li>
          <Link href="/pc" className="sidebar-item">
            <Image src="/Image/Icon/laptop.png" alt="PC" width={24} height={24} />
            <span>PC</span>
          </Link>
        </li>
        <li>
          <Link href="/monitors" className="sidebar-item">
            <Image src="/Image/Icon/manhinh.png" alt="Monitor" width={24} height={24} />
            <span>Màn Hình Máy Tính</span>
          </Link>
        </li>
        <li>
          <Link href="/accessories" className="sidebar-item">
            <Image src="/Image/Icon/daysac.png" alt="Accessories" width={24} height={24} />
            <span>Phụ Kiện & Phần Mềm</span>
          </Link>
        </li>
        <li>
          <Link href="/gaming-furniture" className="sidebar-item">
            <Image src="/Image/Icon/ghe.png" alt="Gaming Furniture" width={24} height={24} />
            <span>Bàn, Ghế Gaming</span>
          </Link>
        </li>
        <li>
          <Link href="/peripherals" className="sidebar-item">
            <Image src="/Image/Icon/phimchuot.png" alt="Peripherals" width={24} height={24} />
            <span>Phím, Chuột, Tai Nghe</span>
          </Link>
        </li>
        <li>
          <Link href="/networking" className="sidebar-item">
            <Image src="/Image/Icon/wifi.png" alt="Networking" width={24} height={24} />
            <span>Thiết Bị Mạng</span>
          </Link>
        </li>
        <li>
          <Link href="/audio" className="sidebar-item">
            <Image src="/Image/Icon/loa.png" alt="Audio" width={24} height={24} />
            <span>Thiết bị âm thanh</span>
          </Link>
        </li>
        <li>
          <Link href="/cameras" className="sidebar-item">
            <Image src="/Image/Icon/mayin.png" alt="Camera" width={24} height={24} />
            <span>Camera, Webcam, Máy in</span>
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;