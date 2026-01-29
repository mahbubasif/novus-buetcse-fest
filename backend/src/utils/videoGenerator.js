/**
 * Video Generation Utility
 * Combines audio narration with static visuals to create educational videos
 */

const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const fs = require('fs');
const path = require('path');

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

/**
 * Generate video from audio with colored background
 * @param {string} audioPath - Path to the audio file
 * @param {string} outputPath - Path to save the video
 * @param {string} color - Background color (hex or color name)
 * @returns {Promise<string>} - Path to the generated video
 */
const generateVideoFromAudio = (audioPath, outputPath, color = '#667eea') => {
  return new Promise((resolve, reject) => {
    console.log('🎬 Creating video from audio with colored background...');

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    ffmpeg()
      .input(`color=c=${color}:s=1280x720:r=30`) // Create colored background using FFmpeg's color source
      .inputFormat('lavfi')
      .input(audioPath)
      .outputOptions([
        '-c:v libx264',           // Video codec
        '-tune stillimage',       // Optimize for static image
        '-c:a aac',               // Audio codec
        '-b:a 192k',              // Audio bitrate
        '-pix_fmt yuv420p',       // Pixel format for compatibility
        '-shortest',              // End video when audio ends
        '-movflags +faststart',   // Enable fast start for web playback
      ])
      .output(outputPath)
      .on('start', (commandLine) => {
        console.log('FFmpeg command:', commandLine);
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          console.log(`Processing: ${Math.round(progress.percent)}% done`);
        }
      })
      .on('end', () => {
        const stats = fs.statSync(outputPath);
        console.log(`✅ Video generated: ${outputPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error('❌ FFmpeg error:', err.message);
        reject(new Error(`Failed to generate video: ${err.message}`));
      })
      .run();
  });
};

/**
 * Create educational video summary from text content
 * @param {string} content - Text content to convert
 * @param {string} topic - Topic/title
 * @param {string} type - Material type (Theory or Lab)
 * @param {string} generateAudioFn - Function to generate audio from text
 * @returns {Promise<object>} - Video generation result with file path and metadata
 */
const createVideoSummary = async (content, topic, type, generateAudioFn) => {
  const tempDir = path.join(__dirname, '../../temp');
  const timestamp = Date.now();

  const audioPath = path.join(tempDir, `audio_${timestamp}.mp3`);
  const videoPath = path.join(tempDir, `video_${timestamp}.mp4`);

  try {
    console.log('\n🎥 Starting video summary generation...');
    console.log(`Topic: ${topic}`);
    console.log(`Type: ${type}`);

    // Step 1: Generate audio from text
    console.log('\n📝 Step 1: Generating audio narration...');
    await generateAudioFn(content, audioPath);

    // Step 2: Choose color based on type
    const backgroundColor = type === 'Theory' ? '#667eea' : '#764ba2'; // Purple gradient colors

    // Step 3: Combine audio with colored background into video
    console.log('\n🎬 Step 2: Creating video with audio and colored background...');
    await generateVideoFromAudio(audioPath, videoPath, backgroundColor);

    // Get video file stats
    const stats = fs.statSync(videoPath);

    console.log('\n✅ Video summary generation complete!');

    return {
      success: true,
      videoPath: videoPath,
      size: stats.size,
      sizeFormatted: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
      duration: null, // Could be calculated if needed
      metadata: {
        topic,
        type,
        timestamp,
        audioPath,
      },
    };

  } catch (error) {
    // Clean up temporary files on error
    [audioPath, videoPath].forEach(file => {
      if (fs.existsSync(file)) {
        try {
          fs.unlinkSync(file);
        } catch (e) {
          console.warn(`Failed to clean up ${file}:`, e.message);
        }
      }
    });

    throw error;
  }
};

/**
 * Clean up old temporary files
 * @param {number} maxAgeMs - Maximum age in milliseconds (default: 1 hour)
 */
const cleanupTempFiles = (maxAgeMs = 60 * 60 * 1000) => {
  const tempDir = path.join(__dirname, '../../temp');

  if (!fs.existsSync(tempDir)) {
    return;
  }

  const now = Date.now();
  const files = fs.readdirSync(tempDir);

  let cleanedCount = 0;
  files.forEach(file => {
    const filePath = path.join(tempDir, file);
    const stats = fs.statSync(filePath);
    const age = now - stats.mtimeMs;

    if (age > maxAgeMs) {
      try {
        fs.unlinkSync(filePath);
        cleanedCount++;
      } catch (err) {
        console.warn(`Failed to delete ${file}:`, err.message);
      }
    }
  });

  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned up ${cleanedCount} temporary files`);
  }
};

module.exports = {
  generateVideoFromAudio,
  createVideoSummary,
  cleanupTempFiles,
};
