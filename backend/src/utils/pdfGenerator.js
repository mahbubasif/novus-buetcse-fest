/**
 * PDF Generator Utility
 * Converts markdown content with images and diagrams to PDF
 */

const { marked } = require('marked');
const htmlPdf = require('html-pdf-node');

/**
 * Convert markdown to styled HTML
 * @param {string} markdown - Markdown content
 * @param {string} title - Document title
 * @param {string} type - Material type (Theory/Lab)
 * @returns {string} HTML string
 */
const markdownToHTML = (markdown, title, type) => {
  // Convert markdown to HTML
  const htmlContent = marked.parse(markdown);

  // Create full HTML document with styling
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 30px;
      background: white;
    }

    /* Header Styling */
    .document-header {
      border-bottom: 3px solid ${type === 'Theory' ? '#3b82f6' : '#10b981'};
      padding-bottom: 20px;
      margin-bottom: 30px;
    }

    .document-type {
      display: inline-block;
      background: ${type === 'Theory' ? '#3b82f6' : '#10b981'};
      color: white;
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 10px;
    }

    .document-title {
      font-size: 32px;
      font-weight: 700;
      color: #1f2937;
      margin: 10px 0;
    }

    .generated-date {
      color: #6b7280;
      font-size: 13px;
      margin-top: 8px;
    }

    /* Typography */
    h1 {
      font-size: 28px;
      font-weight: 700;
      color: #1f2937;
      margin: 30px 0 16px 0;
      padding-bottom: 8px;
      border-bottom: 2px solid #e5e7eb;
    }

    h2 {
      font-size: 22px;
      font-weight: 600;
      color: #374151;
      margin: 25px 0 12px 0;
    }

    h3 {
      font-size: 18px;
      font-weight: 600;
      color: #4b5563;
      margin: 20px 0 10px 0;
    }

    p {
      margin: 12px 0;
      color: #374151;
      text-align: justify;
    }

    /* Lists */
    ul, ol {
      margin: 12px 0;
      padding-left: 30px;
    }

    li {
      margin: 6px 0;
      color: #374151;
    }

    /* Code Blocks */
    pre {
      background: #1f2937;
      color: #f3f4f6;
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 16px 0;
      border-left: 4px solid ${type === 'Theory' ? '#3b82f6' : '#10b981'};
    }

    code {
      font-family: 'Courier New', Courier, monospace;
      font-size: 13px;
      line-height: 1.5;
    }

    p code, li code {
      background: #f3f4f6;
      color: #ef4444;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 12px;
    }

    /* Blockquotes */
    blockquote {
      border-left: 4px solid ${type === 'Theory' ? '#3b82f6' : '#10b981'};
      background: #f9fafb;
      padding: 12px 20px;
      margin: 16px 0;
      color: #4b5563;
      font-style: italic;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
    }

    th, td {
      border: 1px solid #e5e7eb;
      padding: 10px;
      text-align: left;
    }

    th {
      background: #f3f4f6;
      font-weight: 600;
      color: #1f2937;
    }

    /* Images */
    img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 20px auto;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    /* Links */
    a {
      color: ${type === 'Theory' ? '#3b82f6' : '#10b981'};
      text-decoration: none;
      font-weight: 500;
    }

    a:hover {
      text-decoration: underline;
    }

    /* Horizontal Rules */
    hr {
      border: none;
      border-top: 2px solid #e5e7eb;
      margin: 30px 0;
    }

    /* Footer */
    .document-footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
    }

    /* Print-specific */
    @media print {
      body {
        padding: 20px;
      }
      
      .document-header {
        page-break-after: avoid;
      }

      h1, h2, h3 {
        page-break-after: avoid;
      }

      pre {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="document-header">
    <div class="document-type">${type} Material</div>
    <h1 class="document-title">${title}</h1>
    <div class="generated-date">Generated on ${new Date().toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}</div>
  </div>

  <div class="content">
    ${htmlContent}
  </div>

  <div class="document-footer">
    <p>Generated by AI Learning Platform | ${new Date().getFullYear()}</p>
  </div>
</body>
</html>
  `;
};

/**
 * Generate PDF from markdown content
 * @param {string} markdown - Markdown content
 * @param {string} title - Document title
 * @param {string} type - Material type (Theory/Lab)
 * @returns {Promise<Buffer>} PDF buffer
 */
const generatePDF = async (markdown, title, type = 'Theory') => {
  try {
    console.log(`📄 Generating PDF for: ${title}`);

    // Convert markdown to HTML
    const html = markdownToHTML(markdown, title, type);

    // PDF options
    const options = {
      format: 'A4',
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
      printBackground: true,
      preferCSSPageSize: true,
    };

    // Generate PDF
    const file = { content: html };
    const pdfBuffer = await htmlPdf.generatePdf(file, options);

    console.log(`✅ PDF generated successfully (${pdfBuffer.length} bytes)`);
    return pdfBuffer;

  } catch (error) {
    console.error('❌ PDF generation error:', error);
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
};

module.exports = {
  generatePDF,
  markdownToHTML,
};
