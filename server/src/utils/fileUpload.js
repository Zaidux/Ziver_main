const busboy = require('busboy');
const { uploadToS3 } = require('./fileUpload');

class UploadHandler {
  /**
   * Parse multipart form data with better error handling
   */
  static parseFormData(req, res) {
    return new Promise((resolve, reject) => {
      console.log('🔄 Starting form data parsing...');
      
      const bb = busboy({
        headers: req.headers,
        limits: {
          fileSize: 5 * 1024 * 1024, // 5MB
          files: 5 // max 5 files
        }
      });

      const fields = {};
      const files = [];

      bb.on('field', (name, value) => {
        console.log(`📝 Field: ${name} = ${value}`);
        fields[name] = value;
      });

      bb.on('file', (name, file, info) => {
        const { filename, encoding, mimeType } = info;
        console.log(`📎 File: ${name} - ${filename} (${mimeType})`);

        const chunks = [];
        file.on('data', (chunk) => {
          chunks.push(chunk);
        });

        file.on('end', () => {
          if (chunks.length === 0) {
            console.warn('⚠️ Empty file received:', filename);
            return;
          }

          const buffer = Buffer.concat(chunks);
          
          // Validate file type
          const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
          if (!allowedTypes.includes(mimeType)) {
            console.error('❌ Invalid file type:', mimeType);
            return;
          }

          // Validate file size
          if (buffer.length > 5 * 1024 * 1024) {
            console.error('❌ File too large:', filename, buffer.length);
            return;
          }

          files.push({
            fieldname: name,
            originalname: filename,
            encoding,
            mimetype: mimeType,
            buffer: buffer,
            size: buffer.length
          });
        });

        file.on('error', (error) => {
          console.error('❌ File stream error:', error);
        });
      });

      bb.on('close', () => {
        console.log('✅ Form parsing completed');
        console.log('📊 Results:', {
          fields: Object.keys(fields),
          files: files.length
        });
        
        req.body = fields;
        req.files = files;
        resolve({ fields, files });
      });

      bb.on('error', (error) => {
        console.error('❌ Busboy parsing error:', error);
        reject(new Error(`Form parsing failed: ${error.message}`));
      });

      // Handle request errors
      req.on('error', (error) => {
        console.error('❌ Request error during parsing:', error);
        reject(new Error(`Request error: ${error.message}`));
      });

      // Start parsing
      req.pipe(bb);
    });
  }

  /**
   * Validate feedback data
   */
  static validateFeedbackData(data) {
    const errors = [];
    
    if (!data.title || data.title.trim().length === 0) {
      errors.push('Title is required');
    } else if (data.title.trim().length > 100) {
      errors.push('Title must be less than 100 characters');
    }

    if (!data.message || data.message.trim().length === 0) {
      errors.push('Message is required');
    } else if (data.message.trim().length > 1000) {
      errors.push('Message must be less than 1000 characters');
    }

    const validTypes = ['suggestion', 'bug', 'complaint', 'feature'];
    if (data.type && !validTypes.includes(data.type)) {
      errors.push('Invalid feedback type');
    }

    const validPriorities = ['low', 'medium', 'high'];
    if (data.priority && !validPriorities.includes(data.priority)) {
      errors.push('Invalid priority level');
    }

    return errors;
  }
}

module.exports = UploadHandler;