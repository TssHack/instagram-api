import express from "express";
import axios from "axios";
import crypto from "crypto";

const app = express();
app.use(express.json());

const PORT = 3000;

/**
 * رمزگذاری URL با AES-128-ECB (مشابه openssl_encrypt)
 */
function encryptUrlForApi(urlToEncrypt) {
  const key = Buffer.from("qwertyuioplkjhgf", "utf8");
  const cipher = crypto.createCipheriv("aes-128-ecb", key, null);
  cipher.setAutoPadding(true);

  let encrypted = cipher.update(urlToEncrypt, "utf8", "hex");
  encrypted += cipher.final("hex");

  return encrypted;
}

/**
 * ارسال پاسخ JSON با متادیتای نویسنده
 */
function sendJsonResponse(res, data, statusCode = 200) {
  res.status(statusCode).json({
    ...data,
    developer: {
      name: "Ehsan Fazli",
      username: "@abj0o",
    },
  });
}

/**
 * Route اصلی
 */
app.get("/api", async (req, res) => {
  const instagramUrl = req.query.url?.trim();

  if (!instagramUrl) {
    return sendJsonResponse(res, {
      error: true,
      message: 'پارامتر "url" یافت نشد یا خالی است.',
    }, 400);
  }

  if (!/^https?:\/\/(www\.)?instagram\.com/.test(instagramUrl)) {
    return sendJsonResponse(res, {
      error: true,
      message: "آدرس URL نامعتبر یا مربوط به اینستاگرام نیست.",
    }, 400);
  }

  let hashedUrl;
  try {
    hashedUrl = encryptUrlForApi(instagramUrl);
  } catch (err) {
    console.error("OpenSSL encryption error:", err);
    return sendJsonResponse(res, {
      error: true,
      message: "خطا در پردازش URL (Encryption).",
    }, 500);
  }

  const apiUrl = "https://api.videodropper.app/allinone";
  const headers = {
    "authority": "api.videodropper.app",
    "accept": "*/*",
    "accept-language": "fa-IR,fa;q=0.9,en-GB;q=0.8,en;q=0.7,en-US;q=0.6",
    "origin": "https://reelsave.app/",
    "referer": "https://reelsave.app/",
    "sec-ch-ua": '"Chromium";v="137", "Not/A)Brand";v="24"',
    "sec-ch-ua-mobile": "?1",
    "sec-ch-ua-platform": '"Android"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "cross-site",
    "user-agent":
      "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36",
    "url": hashedUrl,
  };

  try {
    const response = await axios.get(apiUrl, { headers });
    const data = response.data;

    // افزودن اطلاعات نویسنده
    if (typeof data === "object") {
      data.developer = {
        name: "Ehsan Fazli",
        username: "@abj0o",
      };
    }

    res.status(response.status).json(data);
  } catch (error) {
    console.error("Axios error:", error.message);
    return sendJsonResponse(res, {
      error: true,
      message: "خطا در برقراری ارتباط با سرور خارجی (Axios).",
      axios_error: error.message,
    }, 502);
  }
});

/**
 * شروع سرور
 */
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
