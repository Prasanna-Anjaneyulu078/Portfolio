// src/utils/fileHelpers.js

/**
 * Converts a File object from an input into a Base64 string
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Formats PDF string into valid Data URI or HTTP URL
 */
export const getPdfUrl = (base64String) => {
  if (!base64String) return null;
  if (base64String.startsWith('data:') || base64String.startsWith('http://') || base64String.startsWith('https://')) {
    return base64String;
  }
  return `data:application/pdf;base64,${base64String}`;
};

/**
 * Legacy viewPdf helper
 */
export const viewPdf = (base64String) => {
  const pdfUrl = getPdfUrl(base64String);
  if (!pdfUrl) return;
  const newWindow = window.open();
  newWindow.document.write(
    `<iframe src="${pdfUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
  );
  newWindow.document.title = "Resume Viewer";
};