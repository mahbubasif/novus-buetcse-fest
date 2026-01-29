/**
 * Text Chunking Utility
 * Splits text into overlapping chunks for better RAG retrieval
 */

/**
 * Split text into chunks with overlap
 * @param {string} text - Text to split
 * @param {number} chunkSize - Target chunk size in characters (default: 1000)
 * @param {number} overlap - Overlap between chunks in characters (default: 100)
 * @returns {string[]} - Array of text chunks
 */
const splitIntoChunks = (text, chunkSize = 1000, overlap = 100) => {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const cleanedText = text.trim();

  // If text is shorter than chunk size, return as single chunk
  if (cleanedText.length <= chunkSize) {
    return [cleanedText];
  }

  const chunks = [];
  let startIndex = 0;

  while (startIndex < cleanedText.length) {
    let endIndex = startIndex + chunkSize;

    // Don't exceed text length
    if (endIndex >= cleanedText.length) {
      chunks.push(cleanedText.slice(startIndex).trim());
      break;
    }

    // Try to break at a sentence or paragraph boundary
    let breakPoint = endIndex;

    // Look for paragraph break first
    const paragraphBreak = cleanedText.lastIndexOf('\n\n', endIndex);
    if (paragraphBreak > startIndex + chunkSize / 2) {
      breakPoint = paragraphBreak;
    } else {
      // Look for sentence break (. ! ?)
      const sentenceBreak = cleanedText.lastIndexOf('. ', endIndex);
      if (sentenceBreak > startIndex + chunkSize / 2) {
        breakPoint = sentenceBreak + 1; // Include the period
      } else {
        // Look for any whitespace
        const spaceBreak = cleanedText.lastIndexOf(' ', endIndex);
        if (spaceBreak > startIndex + chunkSize / 2) {
          breakPoint = spaceBreak;
        }
      }
    }

    chunks.push(cleanedText.slice(startIndex, breakPoint).trim());

    // Move start index with overlap
    startIndex = breakPoint - overlap;

    // Ensure we're making progress
    if (startIndex <= chunks.length > 1 ? startIndex : 0) {
      startIndex = breakPoint;
    }
  }

  // Filter out empty chunks
  return chunks.filter(chunk => chunk.length > 0);
};

module.exports = {
  splitIntoChunks,
};
