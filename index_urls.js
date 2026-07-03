const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

let KEY_FILE = path.join(__dirname, 'service_account.json');
if (!fs.existsSync(KEY_FILE)) {
  KEY_FILE = path.join(__dirname, 'google-service-account.json');
}
const URLS_FILE = path.join(__dirname, 'product_urls.txt');

async function run() {
  if (!fs.existsSync(KEY_FILE)) {
    console.error("LỖI: Không tìm thấy file key JSON (service_account.json hoặc google-service-account.json) trong thư mục dự án!");
    process.exit(1);
  }

  if (!fs.existsSync(URLS_FILE)) {
    console.error("LỖI: Không tìm thấy file product_urls.txt!");
    process.exit(1);
  }

  const urls = fs.readFileSync(URLS_FILE, 'utf8')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('http'));

  if (urls.length === 0) {
    console.log("Không có URL hợp lệ nào trong file product_urls.txt.");
    process.exit(0);
  }

  console.log(`Đã đọc ${urls.length} URLs từ file. Chuẩn bị gửi yêu cầu tới Google Indexing API...`);

  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: ['https://www.googleapis.com/auth/indexing'],
  });

  const authClient = await auth.getClient();
  console.log("Đăng nhập thành công với Google Service Account.");

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.log(`[${i + 1}/${urls.length}] Đang bắn URL: ${url}`);

    try {
      const response = await google.indexing({
        version: 'v3',
        auth: authClient
      }).urlNotifications.publish({
        requestBody: {
          url: url,
          type: 'URL_UPDATED'
        }
      });
      console.log(`   THÀNH CÔNG:`, response.data.urlNotificationMetadata?.latestUpdate?.url || "Done");
    } catch (error) {
      console.error(`   THẤT BẠI:`, error.message);
      if (error.response && error.response.data) {
        console.error(`   Chi tiết lỗi:`, JSON.stringify(error.response.data.error));
      }
    }

    await new Promise(resolve => setTimeout(resolve, 150));
  }

  console.log("--- HOÀN THÀNH ---");
}

run().catch(err => {
  console.error("Lỗi nghiêm trọng:", err);
});
