const busboy = require('busboy');

class UploadHandler {
  /**
   * Parse multipart form data with better error handling
   */
  static parseFormData(req, res) {
    return new Promise((resolve, reject) => {
      console.log('🔄 ===== UPLOAD HANDLER STARTED =====');
      console.log('📨 Request headers:', {
        'content-type': req.headers['content-type'],
        'content-length': req.headers['content-length'],
        'authorization': req.headers.authorization ? 'Present' : 'Missing'
      });

      try {
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
          console.log(`📝 Field received: ${name} = ${value}`);
          fields[name] = value;
        });

        bb.on('file', (name, file, info) => {
          const { filename, encoding, mimeType } = info;
          console.log(`📎 File started: ${name} - ${filename} (${mimeType})`);

          const chunks = [];
          file.on('data', (chunk) => {
            chunks.push(chunk);
          });

          file.on('end', () => {
            console.log(`✅ File completed: ${filename} (${chunks.length} chunks, ${Buffer.concat(chunks).length} bytes)`);
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
          console.log('📊 Final results:', {
            fields: Object.keys(fields),
            files: files.length,
            fieldValues: fields
          });
          
          req.body = fields;
          req.files = files;
          resolve({ fields, files });
        });

        bb.on('error', (error) => {
          console.error('❌ Busboy parsing error:', error);
          console.error('❌ Busboy error stack:', error.stack);
          reject(new Error(`Form parsing failed: ${error.message}`));
        });

        // Handle request errors
        req.on('error', (error) => {
          console.error('❌ Request error during parsing:', error);
          reject(new Error(`Request error: ${error.message}`));
        });

        // Start parsing
        console.log('🔄 Piping request to Busboy...');
        req.pipe(bb);
        
      } catch (setupError) {
        console.error('❌ Busboy setup error:', setupError);
        console.error('❌ Setup error stack:', setupError.stack);
        reject(setupError);
      }
    });
  }

  /**
   * Validate feedback data
   */
  static validateFeedbackData(data) {
    console.log('🔍 Validating feedback data:', data);
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

    console.log('📋 Validation result:', errors.length > 0 ? `Errors: ${errors.join(', ')}` : 'No errors');
    return errors;
  }
}

module.exports = UploadHandler;