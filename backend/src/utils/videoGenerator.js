/**
 * Video Generation Utility
 * Creates simple, short educational videos using FFmpeg
 */

const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const fs = require('fs');
const path = require('path');
const { generateTextGemini } = require('./gemini');

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

// Font path for Linux environments to prevent FFmpeg hanging
const FONT_PATH = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';


/**
 * Create a video with gradient background and topic text
 * @param {string} topic - Topic text to display
 * @param {string} type - Material type (Theory or Lab)
 * @param {string} outputPath - Path to save the video
 * @param {number} duration - Video duration in seconds (default: 8)
 * @returns {Promise<string>} - Path to the generated video
 */
const createSimpleVideo = (topic, type, outputPath, duration = 5) => {
  return new Promise((resolve, reject) => {
    console.log(`🎬 Creating ${duration}s video for: ${topic}`);

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Choose colors based on type
    // Theory: Blue gradient, Lab: Green gradient  
    const color1 = type === 'Theory' ? '#1e3a8a' : '#065f46';
    const color2 = type === 'Theory' ? '#3b82f6' : '#10b981';

    // Clean topic for display (truncate if too long)
    // Longer truncation allowed as we might use Gemini summary
    const displayTopic = topic.length > 100 ? topic.substring(0, 97) + '...' : topic;
    const typeLabel = type === 'Theory' ? '📚 Theory' : '💻 Lab';

    // Set a timeout to reject if FFmpeg hangs - slightly longer just in case
    const timeout = setTimeout(() => {
      reject(new Error('Video generation timed out'));
    }, 45000); // 45 second timeout

    // Create video with gradient background using complex filtergraph
    // Using simple solid color as gradient can be complex
    const bgColor = type === 'Theory' ? '#3b82f6' : '#10b981';

    // Verify font exists, otherwise let FFmpeg try default (which might hang, but we try)
    const fontFile = fs.existsSync(FONT_PATH) ? FONT_PATH : null;
    const fontOption = fontFile ? `fontfile='${fontFile}':` : '';

    ffmpeg()
      .input(`color=c=${bgColor.replace('#', '0x')}:s=1280x720:r=30:d=${duration}`)
      .inputFormat('lavfi')
      .complexFilter([
        // Add text overlay with topic
        {
          filter: 'drawtext',
          options: {
            text: displayTopic.replace(/'/g, "\\'").replace(/:/g, "\\:"),
            fontsize: 48,
            fontcolor: 'white',
            x: '(w-text_w)/2',
            y: '(h-text_h)/2',
            shadowcolor: 'black',
            shadowx: 2,
            shadowy: 2,
            fontfile: fontFile || undefined
          }
        },
        // Add type label at top
        {
          filter: 'drawtext',
          options: {
            text: typeLabel.replace(/'/g, "\\'"),
            fontsize: 32,
            fontcolor: 'white@0.8',
            x: '(w-text_w)/2',
            y: 50,
            fontfile: fontFile || undefined
          }
        },
        // Add "NOVUS" branding at bottom
        {
          filter: 'drawtext',
          options: {
            text: 'NOVUS - AI Learning Platform',
            fontsize: 24,
            fontcolor: 'white@0.6',
            x: '(w-text_w)/2',
            y: 'h-60',
            fontfile: fontFile || undefined
          }
        }
      ])
      .outputOptions([
        '-c:v libx264',
        '-preset ultrafast',
        '-crf 23',
        '-pix_fmt yuv420p',
        `-t ${duration}`,
      ])
      .output(outputPath)
      .on('end', () => {
        clearTimeout(timeout);
        const stats = fs.statSync(outputPath);
        console.log(`✅ Video created: ${(stats.size / 1024).toFixed(1)} KB`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        clearTimeout(timeout);
        console.error('❌ FFmpeg error:', err.message);
        // Fallback to simple video without text if drawtext fails
        createFallbackVideo(type, outputPath, duration)
          .then(resolve)
          .catch(reject);
      })
      .run();
  });
};

/**
 * Fallback simple video without text (if font not available)
 */
const createFallbackVideo = (type, outputPath, duration = 8) => {
  return new Promise((resolve, reject) => {
    console.log('🎬 Creating fallback video without text...');

    const bgColor = type === 'Theory' ? 'blue' : 'green';

    ffmpeg()
      .input(`color=c=${bgColor}:s=1280x720:r=30:d=${duration}`)
      .inputFormat('lavfi')
      .outputOptions([
        '-c:v libx264',
        '-preset ultrafast',
        '-crf 23',
        '-pix_fmt yuv420p',
        `-t ${duration}`,
      ])
      .output(outputPath)
      .on('end', () => {
        const stats = fs.statSync(outputPath);
        console.log(`✅ Fallback video created: ${(stats.size / 1024).toFixed(1)} KB`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error('❌ Fallback FFmpeg error:', err.message);
        reject(new Error(`Video generation failed: ${err.message}`));
      })
      .run();
  });
};

/**
 * Create quick video summary
 * @param {string} content - Content (not used, kept for compatibility)
 * @param {string} topic - Topic/title to display
 * @param {string} type - Material type (Theory or Lab)
 * @param {Array} keyPoints - Key points (not used, kept for compatibility)
 * @returns {Promise<object>} - Video generation result
 */
const createQuickVideoSummary = async (content, topic, type, keyPoints) => {
  const tempDir = path.join(__dirname, '../../temp');
  const timestamp = Date.now();
  const videoPath = path.join(tempDir, `video_${timestamp}.mp4`);

  // Ensure temp directory exists
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  try {
    console.log('\n🎥 Creating quick video summary...');
    console.log(`Topic: ${topic}`);
    console.log(`Type: ${type}`);

    // EXPLICIT USE OF GEMINI: Generate a short snappy summary for the video text
    let videoText = topic; // Fallback
    try {
      console.log('✨ Using Gemini to generate video tagline...');
      const tagline = await generateTextGemini(
        `Create a very short, catchy, educational tagline (under 10 words) for a video about "${topic}". Just the tagline, no quotes.`
      );
      videoText = tagline.trim();
      console.log(`✨ Gemini Tagline: ${videoText}`);
    } catch (err) {
      console.warn('⚠️ Gemini generation failed, using topic name:', err.message);
    }

    // Create 5-second video with Gemini-generated text
    await createSimpleVideo(videoText, type, videoPath, 5);

    const stats = fs.statSync(videoPath);

    return {
      success: true,
      videoPath: videoPath,
      size: stats.size,
      sizeFormatted: `${(stats.size / 1024).toFixed(1)} KB`,
      duration: 5,
      metadata: { topic, type, timestamp, geminiTagline: videoText },
    };

  } catch (error) {
    if (fs.existsSync(videoPath)) {
      try { fs.unlinkSync(videoPath); } catch (e) { }
    }
    throw error;
  }
};

/**
 * Clean up old temporary files
 */
const cleanupTempFiles = (maxAgeMs = 60 * 60 * 1000) => {
  const tempDir = path.join(__dirname, '../../temp');
  if (!fs.existsSync(tempDir)) return;

  const now = Date.now();
  try {
    const files = fs.readdirSync(tempDir);
    files.forEach(file => {
      const filePath = path.join(tempDir, file);
      try {
        const stats = fs.statSync(filePath);
        if (now - stats.mtimeMs > maxAgeMs) {
          fs.unlinkSync(filePath);
        }
      } catch (e) { }
    });
  } catch (e) { }
};

module.exports = {
  createSimpleVideo,
  createQuickVideoSummary,
  cleanupTempFiles,
};
