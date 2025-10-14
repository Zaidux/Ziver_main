const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const express = require('express');
const AWS = require('aws-sdk');

const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory:', uploadsDir);
}

// Configure AWS SDK (only if credentials exist)
let s3 = null;
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_REGION && process.env.AWS_BUCKET_NAME) {
  s3 = new AWS.S3({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  });
  console.log('☁️ AWS S3 initialized');
}

const fileUpload = {
  /**
   * Uploads file to either local storage (Render) or S3 (AWS)
   */
  uploadToS3: async (file) => {
    try {
      if (!file || !file.originalname) throw new Error('Invalid file upload data');

      const fileExtension = path.extname(file.originalname);
      const fileName = `${uuidv4()}${fileExtension}`;

      // === AWS MODE ===
      if (s3 && process.env.NODE_ENV === 'production') {
        const params = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: `uploads/${fileName}`,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: 'public-read',
        };

        const result = await s3.upload(params).promise();

        console.log(`📤 Uploaded to AWS S3: ${file.originalname} → ${result.Location}`);

        return {
          key: result.Key,
          url: result.Location,
          filename: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
          storage: 's3'
        };
      }

      // === LOCAL MODE (Render / Testing) ===
      const filePath = path.join(uploadsDir, fileName);
      await fs.promises.writeFile(filePath, file.buffer);

      const baseUrl = process.env.BASE_URL || 'https://ziver-api.onrender.com';
      const fileUrl = `${baseUrl}/uploads/${fileName}`;

      console.log(`📤 Uploaded locally: ${file.originalname} → ${fileUrl}`);

      return {
        key: fileName,
        url: fileUrl,
        filename: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        storage: 'local'
      };
    } catch (error) {
      console.error('❌ File upload error:', error);
      throw new Error('Failed to upload file');
    }
  },

  /**
   * Deletes file from either local disk or AWS S3
   */
  deleteFromS3: async (key) => {
    try {
      if (s3 && process.env.NODE_ENV === 'production') {
        await s3.deleteObject({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: key,
        }).promise();
        console.log(`🗑️ Deleted from AWS S3: ${key}`);
      } else {
        const filePath = path.join(uploadsDir, key);
        if (fs.existsSync(filePath)) {
          await fs.promises.unlink(filePath);
          console.log(`🗑️ Deleted local file: ${key}`);
        }
      }
    } catch (error) {
      console.error('⚠️ File deletion error:', error.message);
    }
  },

  /**
   * Serve uploaded files securely (for local testing)
   */
  serveUploads: (app) => {
    app.use(
      '/uploads',
      (req, res, next) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf'];
        const ext = path.extname(req.path).toLowerCase();

        if (!allowed.includes(ext)) {
          console.warn(`🚫 Blocked disallowed file type: ${req.path}`);
          return res.status(403).json({ error: 'File type not allowed' });
        }

        next();
      },
      express.static(uploadsDir, {
        setHeaders: (res) => {
          res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        },
      })
    );

    console.log('✅ Static upload serving enabled at /uploads');
  },
};

module.exports = fileUpload;