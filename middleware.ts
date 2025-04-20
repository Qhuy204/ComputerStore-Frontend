import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

async function verifyToken(token: string) {
  try {
    const secretKey = new TextEncoder().encode(process.env.JWT_SECRET || 'Aogk235@b$fts');
    const { payload } = await jwtVerify(token, secretKey);
    
    // Log chi tiết payload để kiểm tra
    console.log('Decoded Payload:', {
      is_admin: payload.is_admin,
      type: typeof payload.is_admin
    });

    return { 
      success: true, 
      payload: payload as { 
        user_id: number, 
        username: string, 
        is_admin: number 
      } 
    };
  } catch (error) {
    console.error('Detailed Token Verification Error:', error);
    return { success: false, payload: null };
  }
}

export async function middleware(request: NextRequest) {
  // Kiểm tra nếu đường dẫn là trang profile
  if (request.nextUrl.pathname === '/landing/userprofile') {
    // Kiểm tra trạng thái đăng nhập qua cookie
    const authToken = request.cookies.get('authToken')?.value;
    
    // Nếu chưa đăng nhập, chuyển hướng đến trang chủ
    if (!authToken) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    // Xác thực token
    const { success, payload } = await verifyToken(authToken);
    
    // Nếu token không hợp lệ, cũng chuyển hướng đến trang chủ
    if (!success || !payload) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
  
  // Kiểm tra nếu đường dẫn bắt đầu bằng /admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Kiểm tra trạng thái đăng nhập qua cookie
    const authToken = request.cookies.get('authToken')?.value;
    
    // Nếu chưa đăng nhập, chuyển hướng đến trang login
    if (!authToken) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    
    // Xác thực token và kiểm tra quyền admin
    const { success, payload } = await verifyToken(authToken);
    
    // Kiểm tra chính xác is_admin
    if (!success || !payload || payload.is_admin !== 1) {
      // Nếu không phải admin, chuyển hướng đến trang access denied
      return NextResponse.redirect(new URL('/auth/access', request.url));
    }
  }
  
  // Đối với trang login
  if (request.nextUrl.pathname === '/auth/login') {
    const authToken = request.cookies.get('authToken')?.value;
    
    if (authToken) {
      // Kiểm tra quyền trong token
      const { success, payload } = await verifyToken(authToken);
      
      if (success && payload) {
        if (payload.is_admin === 1) {
          // Nếu là admin, chuyển hướng đến trang admin
          return NextResponse.redirect(new URL('/admin', request.url));
        } else {
          // Nếu là người dùng thường, chuyển hướng đến trang chủ
          return NextResponse.redirect(new URL('/', request.url));
        }
      }
    }
  }

  return NextResponse.next();
}

// Cập nhật matcher để thêm đường dẫn profile
export const config = {
  matcher: ['/admin/:path*', '/auth/login', '/auth/access', '/landing/userprofile'],
}