import React from 'react';
import Image from 'next/image';

const Footer = () => {
  return (
    <>
      <div className="showroom-container">
        <h2>HỆ THỐNG SHOWROOM GEARVN <div id="heading"></div></h2>
        <div className="showroom-list">
          <div className="showroom-item">
            <div className="showroom-title"><span className="showroom-number">1</span> <span>★ Showroom Tân Bình</span></div>
            <p className="address">
              <Image src="/Image/Icon/location.png" width={20} height={20} alt="location" />
              28 - 30 Trần Triệu Luật, P.6, Quận Tân Bình, TP.HCM
            </p>
            <p>
              <Image src="/Image/Icon/Phone.png" width={20} height={20} alt="phone" /> 
              Mua hàng: 0899 000 001 (08:30 - 21:00)
            </p>
            <p>
              <Image src="/Image/Icon/Phone.png" width={20} height={20} alt="phone" /> 
              Bảo hành: 0919 267 015 (8:30 - 17:30)
            </p>
            <p>
              <Image src="/Image/Icon/Clock.png" width={20} height={20} alt="clock" /> 
              Thứ 2 - Chủ nhật, 08:30 - 21:00
            </p>
          </div>
          <div className="showroom-item">
            <div className="showroom-title"><span className="showroom-number">2</span> <span>★ Showroom Thủ Đức</span></div>
            <p className="address">
              <Image src="/Image/Icon/location.png" width={20} height={20} alt="location" />
              180 Lê Văn Việt, P. Tăng Nhơn Phú B, Thủ Đức, TP.HCM
            </p>
            <p>
              <Image src="/Image/Icon/Phone.png" width={20} height={20} alt="phone" /> 
              Mua hàng: 0899 000 003 (09:00 - 20:00)
            </p>
            <p>
              <Image src="/Image/Icon/Phone.png" width={20} height={20} alt="phone" /> 
              Bảo hành: 0919 267 015 (8:30 - 17:30)
            </p>
            <p>
              <Image src="/Image/Icon/Clock.png" width={20} height={20} alt="clock" /> 
              Thứ 2 - Chủ nhật, 09:00 - 20:00
            </p>
          </div>
          <div className="showroom-item">
            <div className="showroom-title"><span className="showroom-number">3</span> <span>★ Showroom Bình Thạnh</span></div>
            <p className="address">
              <Image src="/Image/Icon/location.png" width={20} height={20} alt="location" />
              474 Điện Biên Phủ, P. 17, Q. Bình Thạnh, TP.HCM
            </p>
            <p>
              <Image src="/Image/Icon/Phone.png" width={20} height={20} alt="phone" /> 
              Mua hàng: 0899 000 004 (08:30 - 21:00)
            </p>
            <p>
              <Image src="/Image/Icon/Phone.png" width={20} height={20} alt="phone" /> 
              Bảo hành: 0919 267 015 (8:30 - 17:30)
            </p>
            <p>
              <Image src="/Image/Icon/Clock.png" width={20} height={20} alt="clock" /> 
              Thứ 2 - Chủ nhật, 08:30 - 21:00
            </p>
          </div>
          <div className="showroom-item">
            <div className="showroom-title"><span className="showroom-number">4 </span><span>★ Showroom Quang Trung</span></div>
            <p className="address">
              <Image src="/Image/Icon/location.png" width={20} height={20} alt="location" />
              1270 Quang Trung, P.14, Q.Gò Vấp, TP.HCM
            </p>
            <p>
              <Image src="/Image/Icon/Phone.png" width={20} height={20} alt="phone" /> 
              Mua hàng: 0899 000 002 (09:00 - 21:00)
            </p>
            <p>
              <Image src="/Image/Icon/Phone.png" width={20} height={20} alt="phone" /> 
              Bảo hành: 0919 267 015 (8:30 - 17:30)
            </p>
            <p>
              <Image src="/Image/Icon/Clock.png" width={20} height={20} alt="clock" /> 
              Thứ 2 - Thứ 7: 09:00 - 21:00; CN: 09:00 - 18:00
            </p>
          </div>
        </div>
      </div>

      {/* Phần footer */}
      <footer>
        <div id="footer-heading">
          <div className="footer-container">
            <div className="footer-section">
              <Image src="/Image/Index/icon_policy_page_1.png" width={50} height={50} alt="Chính sách giao hàng" />
              <div className="policy-content">
                <h5>CHÍNH SÁCH GIAO HÀNG</h5>
                <p>Nhanh hàng và thanh toán tại nhà</p>
              </div>
            </div>
            <div className="footer-section">
              <Image src="/Image/Index/icon_policy_page_2.png" width={50} height={50} alt="Đổi trả dễ dàng" />
              <div className="policy-content">
                <h5>ĐỔI TRẢ DỄ DÀNG</h5>
                <p>1 đổi 1 trong 7 ngày</p>
              </div>
            </div>
            <div className="footer-section">
              <Image src="/Image/Index/icon_policy_page_3.png" width={50} height={50} alt="Giá rẻ nhất" />
              <div className="policy-content">
                <h5>GIÁ LUÔN LUÔN RẺ NHẤT</h5>
                <p>Giá cả hợp lý, nhiều ưu đãi tốt</p>
              </div>
            </div>
            <div className="footer-section">
              <Image src="/Image/Index/icon_policy_page_4.png" width={50} height={50} alt="Hỗ trợ nhiệt tình" />
              <div className="policy-content">
                <h5>HỖ TRỢ NHIỆT TÌNH</h5>
                <p>Tư vấn, giải đáp mọi thắc mắc</p>
              </div>
            </div>
          </div>
        </div>
        <div className="footer-info">
          <div id="footer-content">
            <div className="footer-column">
              <h4>GIỚI THIỆU THNS</h4>
              <ul>
                <li><a href="#">Về chúng tôi</a></li>
                <li><a href="#">Tuyển dụng</a></li>
                <li>
                  <Image src="/Image/Index/banner_1_footer_medium.png" width={200} height={100} alt="Banner footer" />
                </li>
              </ul>
            </div>
            <div className="footer-column">
              <h4>CHÍNH SÁCH CHUNG</h4>
              <ul>
                <li><a href="#">Chính sách trả góp</a></li>
                <li><a href="#">Chính sách bảo mật</a></li>
                <li><a href="#">Chính sách giải quyết khiếu nại</a></li>
                <li><a href="#">Chính sách bảo vệ thông tin cá nhân</a></li>
                <li><a href="#">Chính sách bảo hành</a></li>
                <li><a href="#">Chính sách đổi - trả hàng</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <h4>THÔNG TIN KHUYẾN MÃI</h4>
              <ul>
                <li><a href="#">Tổng hợp khuyến mãi</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <h4>HỖ TRỢ KHÁCH HÀNG</h4>
              <ul>
                <li><a href="#">Tổng hợp Hotline CSKH, phản ánh</a></li>
                <li><a href="#">Lắp đặt phòng net</a></li>
                <li><a href="#">Thiết bị Mining</a></li>
                <li><a href="#">Tra cứu bảo hành</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;