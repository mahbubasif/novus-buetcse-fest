import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send,
  Users,
  AtSign,
  Plus,
  MessageCircle,
  ArrowLeft,
  Trash2,
  Clock,
  User,
  Bot,
  Sparkles,
  UserPlus,
  X,
  ChevronDown,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';
import {
  getForumPosts,
  getPostWithComments,
  createForumPost,
  addPostComment,
  deleteForumPost,
  deleteForumComment,
  getStudentsForMention,
  generateAIReply,
} from '../services/api';
import { cn } from '../lib/utils';

export function Community() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  
  // New post form
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [taggedStudent, setTaggedStudent] = useState(null);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [tagFilter, setTagFilter] = useState('');
  const [posting, setPosting] = useState(false);
  
  // AI Reply
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiCountdown, setAiCountdown] = useState(null);
  const countdownTimerRef = useRef(null);
  
  // Comment form
  const [newComment, setNewComment] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const commentInputRef = useRef(null);

  // Fetch posts
  const fetchPosts = useCallback(async () => {
    try {
      const response = await getForumPosts();
      if (response.success) {
        setPosts(response.data);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch students for mentions
  const fetchStudents = useCallback(async () => {
    try {
      const response = await getStudentsForMention();
      if (response.success) {
        setStudents(response.data);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  }, []);

  // Fetch single post with comments
  const fetchPostDetails = useCallback(async (postId) => {
    try {
      const response = await getPostWithComments(postId);
      if (response.success) {
        setSelectedPost(response.data);
      }
    } catch (error) {
      console.error('Error fetching post:', error);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
    fetchStudents();
  }, [fetchPosts, fetchStudents]);

  // Auto AI reply countdown timer
  useEffect(() => {
    // Clear any existing timer
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setAiCountdown(null);

    // Check if we should start countdown
    if (!selectedPost) return;
    if (!selectedPost.tagged_student) return;
    if (selectedPost.ai_reply_generated) return;
    if (generatingAI) return;

    // Check if tagged student has commented
    const hasTaggedStudentCommented = selectedPost.comments?.some(
      (c) => c.user_id === selectedPost.tagged_student.id || 
             c.username === selectedPost.tagged_student.username
    );
    if (hasTaggedStudentCommented) return;

    // Start 20 second countdown
    setAiCountdown(20);
    countdownTimerRef.current = setInterval(() => {
      setAiCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, [selectedPost, generatingAI]);

  // Trigger AI reply when countdown reaches 0
  useEffect(() => {
    if (aiCountdown === 0 && !generatingAI && selectedPost && !selectedPost.ai_reply_generated) {
      handleGenerateAIReply();
    }
  }, [aiCountdown]);

  // Filter students for mention dropdown
  const filteredStudents = students.filter(
    (s) =>
      s.id !== user?.id &&
      (s.username.toLowerCase().includes(mentionFilter.toLowerCase()) ||
        (s.full_name && s.full_name.toLowerCase().includes(mentionFilter.toLowerCase())))
  );

  // Filter students for tag dropdown
  const filteredTagStudents = students.filter(
    (s) =>
      s.id !== user?.id &&
      (s.username.toLowerCase().includes(tagFilter.toLowerCase()) ||
        (s.full_name && s.full_name.toLowerCase().includes(tagFilter.toLowerCase())))
  );

  // Handle comment input change
  const handleCommentChange = (e) => {
    const value = e.target.value;
    const position = e.target.selectionStart;
    setNewComment(value);
    setCursorPosition(position);

    const textBeforeCursor = value.substring(0, position);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      setMentionFilter(mentionMatch[1]);
      setShowMentions(true);
      setMentionIndex(0);
    } else {
      setShowMentions(false);
      setMentionFilter('');
    }
  };

  // Handle keyboard in comment
  const handleCommentKeyDown = (e) => {
    if (showMentions && filteredStudents.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex((prev) => (prev + 1) % filteredStudents.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex((prev) => (prev - 1 + filteredStudents.length) % filteredStudents.length);
      } else if (e.key === 'Enter' && showMentions) {
        e.preventDefault();
        insertMention(filteredStudents[mentionIndex]);
      } else if (e.key === 'Escape') {
        setShowMentions(false);
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
  };

  // Insert mention
  const insertMention = (student) => {
    const textBeforeCursor = newComment.substring(0, cursorPosition);
    const textAfterCursor = newComment.substring(cursorPosition);
    const mentionStart = textBeforeCursor.lastIndexOf('@');
    const newText =
      textBeforeCursor.substring(0, mentionStart) +
      `@${student.username} ` +
      textAfterCursor;

    setNewComment(newText);
    setShowMentions(false);
    setMentionFilter('');
    commentInputRef.current?.focus();
  };

  // Extract mentions from text
  const extractMentions = (text) => {
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      const mentionedStudent = students.find(
        (s) => s.username.toLowerCase() === match[1].toLowerCase()
      );
      if (mentionedStudent) {
        mentions.push({
          username: mentionedStudent.username,
          id: mentionedStudent.id,
        });
      }
    }
    return mentions;
  };

  // Create new post
  const handleCreatePost = async () => {
    if (!newPostTitle.trim() || !newPostContent.trim() || posting) return;

    setPosting(true);
    try {
      const response = await createForumPost({
        title: newPostTitle,
        content: newPostContent,
        userId: user.id,
        username: user.username,
        fullName: user.fullName,
        taggedStudent: taggedStudent ? {
          id: taggedStudent.id,
          username: taggedStudent.username,
          fullName: taggedStudent.full_name || taggedStudent.username,
        } : null,
      });

      if (response.success) {
        setPosts((prev) => [response.data, ...prev]);
        setNewPostTitle('');
        setNewPostContent('');
        setTaggedStudent(null);
        setShowNewPost(false);
      }
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setPosting(false);
    }
  };

  // Handle AI reply generation
  const handleGenerateAIReply = async () => {
    if (!selectedPost || generatingAI) return;

    setGeneratingAI(true);
    try {
      const response = await generateAIReply(selectedPost.id);
      if (response.success) {
        // Refresh post to show AI comment
        await fetchPostDetails(selectedPost.id);
        // Also refresh posts list
        fetchPosts();
      }
    } catch (error) {
      console.error('Error generating AI reply:', error);
      alert('Failed to generate AI reply. Please try again.');
    } finally {
      setGeneratingAI(false);
    }
  };

  // Check if tagged student has commented
  const taggedStudentHasCommented = () => {
    if (!selectedPost?.tagged_student?.id || !selectedPost?.comments) return true;
    return selectedPost.comments.some(
      (c) => c.user_id === selectedPost.tagged_student.id
    );
  };

  // Add comment
  const handleAddComment = async () => {
    if (!newComment.trim() || commenting || !selectedPost) return;

    setCommenting(true);
    try {
      const mentions = extractMentions(newComment);
      const response = await addPostComment(selectedPost.id, {
        content: newComment,
        userId: user.id,
        username: user.username,
        fullName: user.fullName,
        mentions,
      });

      if (response.success) {
        setSelectedPost((prev) => ({
          ...prev,
          comments: [...(prev.comments || []), response.data],
        }));
        // Update comment count in posts list
        setPosts((prev) =>
          prev.map((p) =>
            p.id === selectedPost.id
              ? { ...p, comment_count: (p.comment_count || 0) + 1 }
              : p
          )
        );
        setNewComment('');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setCommenting(false);
    }
  };

  // Delete post
  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this post and all its comments?')) return;

    try {
      const response = await deleteForumPost(postId, {
        userId: user.id,
        isAdmin: user.role === 'admin',
      });

      if (response.success) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        if (selectedPost?.id === postId) {
          setSelectedPost(null);
        }
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;

    try {
      const response = await deleteForumComment(commentId, {
        userId: user.id,
        isAdmin: user.role === 'admin',
      });

      if (response.success) {
        setSelectedPost((prev) => ({
          ...prev,
          comments: prev.comments.filter((c) => c.id !== commentId),
        }));
        // Update comment count
        setPosts((prev) =>
          prev.map((p) =>
            p.id === selectedPost.id
              ? { ...p, comment_count: Math.max(0, (p.comment_count || 1) - 1) }
              : p
          )
        );
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  // Render text with highlighted mentions
  const renderTextWithMentions = (text) => {
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        const username = part.substring(1);
        const isCurrentUser = username.toLowerCase() === user?.username?.toLowerCase();
        return (
          <span
            key={index}
            className={cn(
              'px-1 py-0.5 rounded font-medium',
              isCurrentUser ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
            )}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {selectedPost && (
            <button
              onClick={() => setSelectedPost(null)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
          )}
          <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Community Forum</h1>
            <p className="text-sm text-gray-500">
              {selectedPost ? 'Discussion' : 'Ask questions and help fellow students'}
            </p>
          </div>
        </div>
        {!selectedPost && (
          <Button
            onClick={() => setShowNewPost(true)}
            variant="gradient"
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            New Post
          </Button>
        )}
      </div>

      {/* New Post Modal */}
      {showNewPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Create New Post</h2>
            <Input
              label="Title"
              value={newPostTitle}
              onChange={(e) => setNewPostTitle(e.target.value)}
              placeholder="What's your question or topic?"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Content
              </label>
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="Describe your problem or topic in detail..."
                rows={5}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
            
            {/* Tag Student Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <UserPlus className="w-4 h-4 inline mr-1" />
                Request answer from student (optional)
              </label>
              <div className="relative">
                {taggedStudent ? (
                  <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
                    <User className="w-4 h-4 text-blue-600" />
                    <span className="text-blue-700 font-medium">
                      @{taggedStudent.username}
                    </span>
                    <span className="text-gray-500 text-sm">
                      {taggedStudent.full_name && `(${taggedStudent.full_name})`}
                    </span>
                    <button
                      onClick={() => setTaggedStudent(null)}
                      className="ml-auto p-1 hover:bg-blue-100 rounded-full transition-colors"
                    >
                      <X className="w-4 h-4 text-blue-600" />
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowTagDropdown(!showTagDropdown)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors text-left"
                    >
                      <span className="text-gray-500">Select a student to answer...</span>
                      <ChevronDown className={cn(
                        "w-4 h-4 text-gray-400 transition-transform",
                        showTagDropdown && "rotate-180"
                      )} />
                    </button>
                    {showTagDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                        <div className="p-2 border-b border-gray-100">
                          <input
                            type="text"
                            value={tagFilter}
                            onChange={(e) => setTagFilter(e.target.value)}
                            placeholder="Search students..."
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          />
                        </div>
                        {filteredTagStudents.length === 0 ? (
                          <div className="p-3 text-sm text-gray-500 text-center">
                            No students found
                          </div>
                        ) : (
                          filteredTagStudents.map((student) => (
                            <button
                              key={student.id}
                              onClick={() => {
                                setTaggedStudent(student);
                                setShowTagDropdown(false);
                                setTagFilter('');
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors text-left"
                            >
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-medium">
                                  {student.username[0].toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  @{student.username}
                                </p>
                                {student.full_name && (
                                  <p className="text-xs text-gray-500">
                                    {student.full_name}
                                  </p>
                                )}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                If the tagged student doesn't reply, you can request an AI-powered answer
              </p>
            </div>
            
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowNewPost(false);
                  setNewPostTitle('');
                  setNewPostContent('');
                  setTaggedStudent(null);
                  setShowTagDropdown(false);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="gradient"
                onClick={handleCreatePost}
                loading={posting}
                disabled={!newPostTitle.trim() || !newPostContent.trim()}
              >
                Post
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-[calc(100%-5rem)] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : selectedPost ? (
          /* Post Detail View */
          <div className="h-full flex flex-col">
            {/* Post Content */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    {selectedPost.title}
                  </h2>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span className="font-medium text-gray-700">
                        {selectedPost.full_name || selectedPost.username}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatTime(selectedPost.created_at)}
                    </div>
                    {selectedPost.tagged_student && (
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 rounded-full">
                        <UserPlus className="w-3 h-3 text-purple-600" />
                        <span className="text-purple-700 text-xs font-medium">
                          Awaiting @{selectedPost.tagged_student.username}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {selectedPost.content}
                  </p>
                  
                  {/* AI Reply Banner - Show when tagged student hasn't replied */}
                  {selectedPost.tagged_student && !taggedStudentHasCommented() && !selectedPost.ai_reply_generated && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-100 rounded-lg relative">
                            <Bot className="w-5 h-5 text-purple-600" />
                            {aiCountdown !== null && aiCountdown > 0 && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-[10px] text-white font-bold">{aiCountdown}</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              @{selectedPost.tagged_student.username} hasn't replied yet
                            </p>
                            <p className="text-sm text-gray-500">
                              {generatingAI 
                                ? 'Generating AI response...' 
                                : aiCountdown !== null && aiCountdown > 0
                                  ? `AI will auto-respond in ${aiCountdown} seconds`
                                  : 'Get an AI-powered answer based on course materials'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {aiCountdown !== null && aiCountdown > 0 && !generatingAI && (
                            <div className="relative w-10 h-10">
                              <svg className="w-10 h-10 transform -rotate-90">
                                <circle
                                  cx="20"
                                  cy="20"
                                  r="16"
                                  fill="none"
                                  stroke="#e9d5ff"
                                  strokeWidth="3"
                                />
                                <circle
                                  cx="20"
                                  cy="20"
                                  r="16"
                                  fill="none"
                                  stroke="#9333ea"
                                  strokeWidth="3"
                                  strokeDasharray={`${(aiCountdown / 20) * 100.53} 100.53`}
                                  strokeLinecap="round"
                                />
                              </svg>
                              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-purple-600">
                                {aiCountdown}
                              </span>
                            </div>
                          )}
                          <Button
                            onClick={handleGenerateAIReply}
                            loading={generatingAI}
                            disabled={generatingAI}
                            className="gap-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                          >
                            <Sparkles className="w-4 h-4" />
                            {generatingAI ? 'Generating...' : 'Get AI Help Now'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Show message if AI reply was already generated */}
                  {selectedPost.ai_reply_generated && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-purple-600">
                      <Bot className="w-4 h-4" />
                      <span>AI has provided an answer below</span>
                    </div>
                  )}
                </div>
                {(selectedPost.user_id === user?.id || selectedPost.username === user?.username || user?.role === 'admin') && (
                  <button
                    onClick={() => handleDeletePost(selectedPost.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete post"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                )}
              </div>
            </div>

            {/* Comments Section */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                {selectedPost.comments?.length || 0} Comments
              </h3>

              {selectedPost.comments?.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No comments yet. Be the first to reply!
                </p>
              ) : (
                selectedPost.comments?.map((comment) => {
                  const isOwn = comment.user_id === user?.id || comment.username === user?.username;
                  const isAI = comment.is_ai_generated;
                  return (
                    <div
                      key={comment.id}
                      className={cn(
                        'rounded-xl p-4 group',
                        isAI
                          ? 'bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100'
                          : 'bg-gray-50'
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              'w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium',
                              isAI
                                ? 'bg-gradient-to-br from-purple-500 to-blue-500'
                                : isOwn
                                  ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                                  : 'bg-gradient-to-br from-gray-400 to-gray-500'
                            )}
                          >
                            {isAI ? <Bot className="w-4 h-4" /> : (comment.full_name || comment.username || '?')[0].toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900">
                            {isAI ? 'AI Assistant' : isOwn ? 'You' : comment.full_name || comment.username}
                          </span>
                          {isAI && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              RAG-powered
                            </span>
                          )}
                          <span className="text-xs text-gray-400">
                            {formatTime(comment.created_at)}
                          </span>
                        </div>
                        {!isAI && (isOwn || user?.role === 'admin') && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all"
                            title="Delete comment"
                          >
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </button>
                        )}
                      </div>
                      <p className={cn(
                        'pl-10 whitespace-pre-wrap',
                        isAI ? 'text-gray-700' : 'text-gray-700'
                      )}>
                        {renderTextWithMentions(comment.content)}
                      </p>
                      {isAI && comment.ai_sources && comment.ai_sources.length > 0 && (
                        <div className="mt-3 pl-10 pt-3 border-t border-purple-100">
                          <p className="text-xs text-purple-600 font-medium mb-1">Sources:</p>
                          <div className="flex flex-wrap gap-2">
                            {comment.ai_sources.map((source, idx) => (
                              <span key={idx} className="text-xs px-2 py-1 bg-white rounded border border-purple-100 text-gray-600">
                                {source}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Comment Input */}
            <div className="border-t border-gray-200 p-4 relative">
              {showMentions && filteredStudents.length > 0 && (
                <div className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-xl border border-gray-200 shadow-lg max-h-48 overflow-y-auto">
                  <div className="p-2 border-b border-gray-100 flex items-center gap-2 text-sm text-gray-500">
                    <AtSign className="w-4 h-4" />
                    <span>Mention a student</span>
                  </div>
                  {filteredStudents.map((student, index) => (
                    <button
                      key={student.id}
                      onClick={() => insertMention(student)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors',
                        index === mentionIndex && 'bg-blue-50'
                      )}
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white text-sm font-medium">
                        {(student.full_name || student.username)[0].toUpperCase()}
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">
                          {student.full_name || student.username}
                        </p>
                        <p className="text-xs text-gray-500">@{student.username}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3">
                <input
                  ref={commentInputRef}
                  type="text"
                  value={newComment}
                  onChange={handleCommentChange}
                  onKeyDown={handleCommentKeyDown}
                  placeholder="Write a comment... Use @ to mention"
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || commenting}
                  variant="gradient"
                  loading={commenting}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Posts List View */
          <div className="h-full overflow-y-auto">
            {posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <MessageCircle className="w-12 h-12 mb-3 text-gray-300" />
                <p className="font-medium">No posts yet</p>
                <p className="text-sm">Be the first to start a discussion!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {posts.map((post) => {
                  const isOwn = post.user_id === user?.id || post.username === user?.username;
                  return (
                    <div
                      key={post.id}
                      className="p-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                      onClick={() => fetchPostDetails(post.id)}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center text-white font-medium flex-shrink-0',
                            isOwn
                              ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                              : 'bg-gradient-to-br from-gray-400 to-gray-500'
                          )}
                        >
                          {(post.full_name || post.username || '?')[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {post.title}
                            </h3>
                            {post.tagged_student && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 rounded-full text-xs text-purple-700 font-medium">
                                <UserPlus className="w-3 h-3" />
                                @{post.tagged_student.username}
                              </span>
                            )}
                            {post.ai_reply_generated && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 rounded-full text-xs text-blue-700 font-medium">
                                <Bot className="w-3 h-3" />
                                AI answered
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                            {post.content}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                            <span className="font-medium text-gray-600">
                              {post.full_name || post.username}
                            </span>
                            <span>{formatTime(post.created_at)}</span>
                            <span className="flex items-center gap-1">
                              <MessageCircle className="w-3 h-3" />
                              {post.comment_count || 0} comments
                            </span>
                          </div>
                        </div>
                        {(isOwn || user?.role === 'admin') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePost(post.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete post"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Community;
