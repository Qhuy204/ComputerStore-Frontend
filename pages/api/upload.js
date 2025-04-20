import formidable from "formidable";
import fs from "fs";
import path from "path";

// Vô hiệu hóa bodyParser mặc định của Next.js để sử dụng formidable
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Thiết lập thư mục lưu file (đảm bảo thư mục này đã tồn tại hoặc tạo mới)
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const form = new formidable.IncomingForm({
    uploadDir,
    keepExtensions: true, // Giữ lại phần mở rộng của file
  });

  form.parse(req, (err, fields, files) => {
    if (err) {
      console.error("Error parsing the files: ", err);
      return res.status(500).json({ error: "Lỗi khi tải lên file" });
    }
    // Sau khi upload thành công, bạn có thể trả về thông tin file hoặc xử lý thêm.
    res.status(200).json({ fields, files });
  });
}
