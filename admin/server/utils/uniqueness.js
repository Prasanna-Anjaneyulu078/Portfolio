const crypto = require('crypto');

/**
 * Normalizes text for duplicate checking:
 * - Trims leading and trailing whitespace
 * - Collapses consecutive spaces to a single space
 * - Converts to lowercase
 * Example: "  NxtTrendz   E-commerce Application  " -> "nxttrendz e-commerce application"
 */
const normalizeText = (text) => {
  if (typeof text !== 'string') return '';
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
};

/**
 * Normalizes URLs for duplicate checking:
 * - Trims whitespace
 * - Strips trailing slashes
 * - Normalizes protocol & domain to lowercase
 * Example: "https://github.com/user/repo/" -> "https://github.com/user/repo"
 */
const normalizeUrl = (urlStr) => {
  if (typeof urlStr !== 'string' || !urlStr.trim()) return '';
  let cleaned = urlStr.trim();
  // Remove trailing slashes
  while (cleaned.endsWith('/')) {
    cleaned = cleaned.slice(0, -1);
  }
  // Standardize lowercase for http/https prefix and domain
  try {
    const parsed = new URL(cleaned.startsWith('http') ? cleaned : `https://${cleaned}`);
    return `${parsed.protocol}//${parsed.host.toLowerCase()}${parsed.pathname}${parsed.search}`;
  } catch (e) {
    return cleaned.toLowerCase();
  }
};

/**
 * Computes a SHA-256 cryptographic hash of a binary file, Base64 Data URL, or raw string.
 * Allows detecting identical file uploads regardless of filename.
 */
const calculateSHA256 = (data) => {
  if (!data) return null;

  try {
    let buffer;
    if (Buffer.isBuffer(data)) {
      buffer = data;
    } else if (typeof data === 'string') {
      if (data.startsWith('data:')) {
        // Strip Data URI header (e.g. data:image/png;base64, or data:application/pdf;base64,)
        const base64Data = data.split(',')[1] || '';
        buffer = Buffer.from(base64Data, 'base64');
      } else if (/^[A-Za-z0-9+/=]+$/.test(data.trim()) && data.length % 4 === 0 && data.length > 100) {
        // Raw base64 string
        buffer = Buffer.from(data.trim(), 'base64');
      } else {
        // UTF-8 string
        buffer = Buffer.from(data, 'utf-8');
      }
    } else {
      return null;
    }

    if (!buffer || buffer.length === 0) return null;
    return crypto.createHash('sha256').update(buffer).digest('hex');
  } catch (err) {
    console.error("SHA256 calculation error:", err.message);
    return null;
  }
};

/**
 * Checks for project duplicates across normalized title, repository URL, demo URL, and image SHA-256 hash.
 * Excludes the current project ID when updating.
 */
const checkProjectUniqueness = async (projectModel, { title, codeUrl, demoUrl, imageUrl }, currentId = null) => {
  const normalizedTitle = normalizeText(title);
  const normalizedCodeUrl = normalizeUrl(codeUrl);
  const normalizedDemoUrl = normalizeUrl(demoUrl);
  const imageHash = calculateSHA256(imageUrl);

  const queryConditions = [];

  if (normalizedTitle) {
    queryConditions.push({ normalizedTitle });
  }
  if (normalizedCodeUrl) {
    queryConditions.push({ normalizedCodeUrl });
  }
  if (normalizedDemoUrl) {
    queryConditions.push({ normalizedDemoUrl });
  }
  if (imageHash) {
    queryConditions.push({ imageHash });
  }

  if (queryConditions.length === 0) {
    return { isDuplicate: false };
  }

  const filter = { $or: queryConditions };
  if (currentId) {
    filter._id = { $ne: currentId };
  }

  const existing = await projectModel.findOne(filter);
  if (existing) {
    if (normalizedTitle && existing.normalizedTitle === normalizedTitle) {
      return {
        isDuplicate: true,
        message: "Project already exists. Please use a unique project title.",
        field: "title"
      };
    }
    if (normalizedCodeUrl && existing.normalizedCodeUrl === normalizedCodeUrl) {
      return {
        isDuplicate: true,
        message: "A project with this repository code URL already exists.",
        field: "codeUrl"
      };
    }
    if (normalizedDemoUrl && existing.normalizedDemoUrl === normalizedDemoUrl) {
      return {
        isDuplicate: true,
        message: "A project with this live demo URL already exists.",
        field: "demoUrl"
      };
    }
    if (imageHash && existing.imageHash === imageHash) {
      return {
        isDuplicate: true,
        message: "This project image has already been uploaded for another project.",
        field: "imageUrl"
      };
    }
    return {
      isDuplicate: true,
      message: "Project already exists. Please use a unique project.",
      field: "general"
    };
  }

  return {
    isDuplicate: false,
    normalizedTitle,
    normalizedCodeUrl,
    normalizedDemoUrl,
    imageHash
  };
};

/**
 * Checks for certificate duplicates across file hash, normalized title + issuer, and verification URL.
 */
const checkCertificateUniqueness = async (certificationModel, { title, issuer, imageUrl, verificationUrl }, currentId = null) => {
  const normalizedTitle = normalizeText(title);
  const normalizedIssuer = normalizeText(issuer);
  const normalizedVerificationUrl = normalizeUrl(verificationUrl);
  const fileHash = calculateSHA256(imageUrl);

  const queryConditions = [];

  if (fileHash) {
    queryConditions.push({ fileHash });
  }
  if (normalizedTitle && normalizedIssuer) {
    queryConditions.push({ normalizedTitle, normalizedIssuer });
  }
  if (normalizedVerificationUrl) {
    queryConditions.push({ normalizedVerificationUrl });
  }

  if (queryConditions.length === 0) {
    return { isDuplicate: false };
  }

  const filter = { $or: queryConditions };
  if (currentId) {
    filter._id = { $ne: currentId };
  }

  const existing = await certificationModel.findOne(filter);
  if (existing) {
    if (fileHash && existing.fileHash === fileHash) {
      return {
        isDuplicate: true,
        message: "This certificate file has already been uploaded.",
        field: "imageUrl"
      };
    }
    if (normalizedVerificationUrl && existing.normalizedVerificationUrl === normalizedVerificationUrl) {
      return {
        isDuplicate: true,
        message: "A certificate with this verification URL already exists.",
        field: "verificationUrl"
      };
    }
    if (normalizedTitle && normalizedIssuer && existing.normalizedTitle === normalizedTitle && existing.normalizedIssuer === normalizedIssuer) {
      return {
        isDuplicate: true,
        message: "A certificate with this title and issuer already exists.",
        field: "title"
      };
    }
    return {
      isDuplicate: true,
      message: "This certificate has already been uploaded.",
      field: "general"
    };
  }

  return {
    isDuplicate: false,
    normalizedTitle,
    normalizedIssuer,
    normalizedVerificationUrl,
    fileHash
  };
};

/**
 * Checks for resume duplicates using cryptographic SHA-256 file content hash.
 */
const checkResumeUniqueness = async (resumeModel, resumePayload, currentId = null) => {
  const fileHash = calculateSHA256(resumePayload);
  if (!fileHash) return { isDuplicate: false };

  const filter = { fileHash };
  if (currentId) {
    filter._id = { $ne: currentId };
  }

  const existing = await resumeModel.findOne(filter);
  if (existing) {
    return {
      isDuplicate: true,
      message: "This resume file has already been uploaded.",
      fileHash
    };
  }

  return {
    isDuplicate: false,
    fileHash
  };
};

module.exports = {
  normalizeText,
  normalizeUrl,
  calculateSHA256,
  checkProjectUniqueness,
  checkCertificateUniqueness,
  checkResumeUniqueness
};
