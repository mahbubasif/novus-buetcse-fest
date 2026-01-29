/**
 * Community Controller
 * Handles forum posts and comments for students
 */

const supabase = require('../lib/supabase');
const { getEmbedding } = require('../utils/openai');
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Fetch relevant context from RAG system for AI reply
 */
const fetchRAGContext = async (query, limit = 5) => {
  try {
    const queryEmbedding = await getEmbedding(query);

    const { data: results, error } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold: 0.3,
      match_count: limit,
    });

    if (error || !results || results.length === 0) {
      return { context: '', sources: [], hasContext: false };
    }

    // Get material details
    const materialIds = [...new Set(results.map((r) => r.material_id))];
    const { data: materials } = await supabase
      .from('materials')
      .select('id, title, category')
      .in('id', materialIds);

    const materialMap = {};
    materials?.forEach((m) => {
      materialMap[m.id] = m;
    });

    const contextChunks = results.map((result) => {
      const material = materialMap[result.material_id];
      return {
        text: result.chunk_text,
        source: material ? `${material.title} (${material.category})` : 'Unknown Source',
        similarity: result.similarity,
      };
    });

    const context = contextChunks.map((c) => `[Source: ${c.source}]\n${c.text}`).join('\n\n---\n\n');

    return {
      context,
      sources: contextChunks.map((c) => ({
        title: c.source,
        similarity: Math.round(c.similarity * 100),
      })),
      hasContext: true,
    };
  } catch (error) {
    console.error('RAG context fetch error:', error.message);
    return { context: '', sources: [], hasContext: false };
  }
};

/**
 * Get all students for mentions
 * GET /api/community/students
 */
const getStudents = async (req, res) => {
  try {
    const { data: students, error } = await supabase
      .from('students')
      .select('id, username, full_name')
      .order('username', { ascending: true });

    if (error) {
      console.error('Error fetching students:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch students',
      });
    }

    res.json({
      success: true,
      data: students || [],
    });
  } catch (error) {
    console.error('Error in getStudents:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Get all forum posts
 * GET /api/community/posts
 */
const getPosts = async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const { data: posts, error } = await supabase
      .from('forum_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) {
      console.error('Error fetching posts:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch posts',
      });
    }

    // Get comment counts for each post
    const postsWithCounts = await Promise.all(
      (posts || []).map(async (post) => {
        const { count } = await supabase
          .from('forum_comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);
        return { ...post, comment_count: count || 0 };
      })
    );

    res.json({
      success: true,
      data: postsWithCounts,
    });
  } catch (error) {
    console.error('Error in getPosts:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Get a single post with comments
 * GET /api/community/posts/:id
 */
const getPostWithComments = async (req, res) => {
  try {
    const { id } = req.params;

    // Get post
    const { data: post, error: postError } = await supabase
      .from('forum_posts')
      .select('*')
      .eq('id', id)
      .single();

    if (postError || !post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    // Get comments
    const { data: comments, error: commentsError } = await supabase
      .from('forum_comments')
      .select('*')
      .eq('post_id', id)
      .order('created_at', { ascending: true });

    if (commentsError) {
      console.error('Error fetching comments:', commentsError);
    }

    res.json({
      success: true,
      data: {
        ...post,
        comments: comments || [],
      },
    });
  } catch (error) {
    console.error('Error in getPostWithComments:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Create a new post
 * POST /api/community/posts
 */
const createPost = async (req, res) => {
  try {
    const { title, content, userId, username, fullName, taggedStudent } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Title is required',
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Content is required',
      });
    }

    if (!userId || !username) {
      return res.status(400).json({
        success: false,
        error: 'User information is required',
      });
    }

    const { data: newPost, error } = await supabase
      .from('forum_posts')
      .insert({
        title: title.trim(),
        content: content.trim(),
        user_id: userId,
        username: username,
        full_name: fullName || username,
        tagged_student: taggedStudent || null,
        ai_reply_generated: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating post:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create post',
      });
    }

    res.status(201).json({
      success: true,
      data: { ...newPost, comment_count: 0 },
    });
  } catch (error) {
    console.error('Error in createPost:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Add a comment to a post
 * POST /api/community/posts/:id/comments
 */
const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, userId, username, fullName, mentions = [] } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Comment content is required',
      });
    }

    if (!userId || !username) {
      return res.status(400).json({
        success: false,
        error: 'User information is required',
      });
    }

    // Check if post exists
    const { data: post, error: postError } = await supabase
      .from('forum_posts')
      .select('id')
      .eq('id', id)
      .single();

    if (postError || !post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    const { data: newComment, error } = await supabase
      .from('forum_comments')
      .insert({
        post_id: parseInt(id),
        content: content.trim(),
        user_id: userId,
        username: username,
        full_name: fullName || username,
        mentions: mentions,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding comment:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to add comment',
      });
    }

    res.status(201).json({
      success: true,
      data: newComment,
    });
  } catch (error) {
    console.error('Error in addComment:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Delete a post (only by owner or admin)
 * DELETE /api/community/posts/:id
 */
const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, isAdmin } = req.body;

    // Check ownership
    const { data: post, error: fetchError } = await supabase
      .from('forum_posts')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    if (post.user_id !== userId && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this post',
      });
    }

    // Delete comments first
    await supabase.from('forum_comments').delete().eq('post_id', id);

    // Delete post
    const { error: deleteError } = await supabase
      .from('forum_posts')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting post:', deleteError);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete post',
      });
    }

    res.json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error) {
    console.error('Error in deletePost:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Delete a comment (only by owner or admin)
 * DELETE /api/community/comments/:id
 */
const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, isAdmin } = req.body;

    const { data: comment, error: fetchError } = await supabase
      .from('forum_comments')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found',
      });
    }

    if (comment.user_id !== userId && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this comment',
      });
    }

    const { error: deleteError } = await supabase
      .from('forum_comments')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting comment:', deleteError);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete comment',
      });
    }

    res.json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    console.error('Error in deleteComment:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Generate AI reply for a post when tagged student hasn't responded
 * POST /api/community/posts/:id/ai-reply
 */
const generateAIReply = async (req, res) => {
  try {
    const { id } = req.params;

    // Get the post
    const { data: post, error: postError } = await supabase
      .from('forum_posts')
      .select('*')
      .eq('id', id)
      .single();

    if (postError || !post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    // Check if AI reply already generated
    if (post.ai_reply_generated) {
      return res.status(400).json({
        success: false,
        error: 'AI reply already generated for this post',
      });
    }

    // Check if tagged student has commented
    if (post.tagged_student) {
      const { data: taggedComment } = await supabase
        .from('forum_comments')
        .select('id')
        .eq('post_id', id)
        .eq('username', post.tagged_student.username)
        .single();

      if (taggedComment) {
        return res.status(400).json({
          success: false,
          error: 'Tagged student has already commented',
        });
      }
    }

    // Fetch RAG context based on post title and content
    const query = `${post.title}\n${post.content}`;
    const { context, sources, hasContext } = await fetchRAGContext(query);

    // Build AI prompt
    const systemPrompt = `You are a helpful AI teaching assistant on a student forum. A student has posted a question and tagged another student for help, but that student hasn't responded yet. 

Your job is to provide a helpful, educational response based on the course materials provided.

IMPORTANT RULES:
1. Be helpful, accurate, and educational
2. If course materials are provided, use them and cite sources
3. Keep responses clear and concise
4. Use markdown formatting
5. Be encouraging and supportive
6. If you don't have relevant materials, provide general guidance but mention that the student should verify with course materials`;

    let userPrompt = `**Post Title:** ${post.title}\n\n**Question:**\n${post.content}`;

    if (hasContext) {
      userPrompt += `\n\n**Relevant Course Materials:**\n${context}`;
    }

    userPrompt += `\n\nPlease provide a helpful response to this student's question.`;

    // Generate AI response
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response. Please try again.';

    // Add AI comment to post
    const { data: aiComment, error: commentError } = await supabase
      .from('forum_comments')
      .insert({
        post_id: parseInt(id),
        content: aiResponse,
        user_id: 0,
        username: 'AI_Assistant',
        full_name: 'AI Teaching Assistant',
        mentions: [],
        is_ai_generated: true,
        ai_sources: sources,
      })
      .select()
      .single();

    if (commentError) {
      console.error('Error adding AI comment:', commentError);
      return res.status(500).json({
        success: false,
        error: 'Failed to add AI reply',
      });
    }

    // Mark post as having AI reply
    await supabase
      .from('forum_posts')
      .update({ ai_reply_generated: true })
      .eq('id', id);

    res.status(201).json({
      success: true,
      data: aiComment,
      sources: sources,
    });
  } catch (error) {
    console.error('Error in generateAIReply:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

module.exports = {
  getStudents,
  getPosts,
  getPostWithComments,
  createPost,
  addComment,
  deletePost,
  deleteComment,
  generateAIReply,
};
