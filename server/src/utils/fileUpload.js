const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const fileUpload = {
  /**
   * Simple file upload to local storage
   * @param {Object} file - Multer file object
   * @returns {Object} Upload result with key and URL
   */
  uploadToS3: async (file) => {
    try {
      // Generate unique filename
      const fileExtension = path.extname(file.originalname);
      const fileName = `${uuidv4()}${fileExtension}`;
      const filePath = path.join(uploadsDir, fileName);

      // Write file to disk
      await fs.promises.writeFile(filePath, file.buffer);

      // For production, you might want to use a CDN or cloud storage
      // For now, we'll return a path that can be served statically
      return {
        key: fileName,
        url: `/uploads/${fileName}`,
        filename: file.originalname,
        size: file.size,
        mimetype: file.mimetype
      };
    } catch (error) {
      console.error('File upload error:', error);
      throw new Error('Failed to upload file');
    }
  },

  /**
   * Delete file from local storage
   * @param {string} key - File key (filename)
   */
  deleteFromS3: async (key) => {
    try {
      const filePath = path.join(uploadsDir, key);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (error) {
      console.error('File deletion error:', error);
      // Don't throw error for deletion failures
    }
  },

  /**
   * Serve uploaded files statically
   * This should be added to your Express app
   */
  serveUploads: (app) => {
    app.use('/uploads', (req, res, next) => {
      // Basic security - only allow specific file types
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      const fileExtension = path.extname(req.path).toLowerCase();
      
      if (!allowedExtensions.includes(fileExtension)) {
        return res.status(403).json({ error: 'File type not allowed' });
      }
      next();
    }, express.static(uploadsDir));
  }
};

module.exports = fileUpload;