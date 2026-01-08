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
 * Opens a Base64 PDF string in a new browser tab
 */
export const viewPdf = (base64String) => {
  if (!base64String) return;
  
  // Create a temporary window/tab
  const newWindow = window.open();
  
  // If the string already contains the data:application/pdf prefix
  if (base64String.startsWith('data:application/pdf')) {
    newWindow.document.write(
      `<iframe src="${base64String}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
    );
  } else {
    // If it's just raw base64, we wrap it
    const pdfUrl = `data:application/pdf;base64,${base64String}`;
    newWindow.document.write(
      `<iframe src="${pdfUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
    );
  }
  
  newWindow.document.title = "Resume Viewer";
};