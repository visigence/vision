import { sql } from '../config/database.js';
import { createAuditLog } from '../utils/auditLogger.js';
import { ALLOWED_MESSAGE_UPDATE_FIELDS } from '../middleware/validation.js';
import logger from '../utils/logger.js';

/**
 * Generate URL-friendly slug from title
 * @param {string} title - The title to convert to slug
 * @returns {string} - URL-friendly slug
 */
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
};

/**
 * Build safe WHERE clause for database queries
 * @param {object} filters - Filter parameters
 * @returns {object} - WHERE clause and parameters
 */
const buildSafeWhereClause = (filters) => {
  const whereConditions = ['1=1'];
  const params = [];
  
  const {
    search,
    category,
    status,
    author,
    userRole,
    userId
  } = filters;

  if (search) {
    whereConditions.push(`(m.title ILIKE $${params.length + 1} OR m.content ILIKE $${params.length + 1})`);
    params.push(`%${search}%`);
  }
  
  if (category) {
    whereConditions.push(`c.slug = $${params.length + 1}`);
    params.push(category);
  }
  
  if (status) {
    whereConditions.push(`m.status = $${params.length + 1}`);
    params.push(status);
  } else {
    // Default to active messages for non-admin users
    if (userRole !== 'admin' && userRole !== 'moderator') {
      whereConditions.push(`m.status = 'active'`);
    }
  }
  
  if (author) {
    whereConditions.push(`u.username = $${params.length + 1}`);
    params.push(author);
  }

  return {
    whereClause: `WHERE ${whereConditions.join(' AND ')}`,
    params
  };
};

/**
 * Get all messages with filtering and pagination
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const getMessages = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100); // Cap at 100
    const offset = (page - 1) * limit;
    
    // Whitelist sort fields for security
    const allowedSortFields = ['created_at', 'updated_at', 'title', 'view_count', 'like_count', 'published_at'];
    const sort = allowedSortFields.includes(req.query.sort) ? req.query.sort : 'created_at';
    const order = req.query.order === 'asc' ? 'asc' : 'desc';
    
    const filters = {
      search: req.query.search || '',
      category: req.query.category || '',
      status: req.query.status || '',
      author: req.query.author || '',
      userRole: req.user?.role,
      userId: req.user?.id
    };
    
    const { whereClause, params } = buildSafeWhereClause(filters);
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM messages m
      LEFT JOIN categories c ON m.category_id = c.id
      LEFT JOIN users u ON m.author_id = u.id
      ${whereClause}
    `;
    
    const [{ total }] = await sql.unsafe(countQuery, ...params);
    
    // Get messages with related data using safe parameterized query
    const messagesQuery = `
      SELECT 
        m.id, m.title, m.content, m.excerpt, m.slug, m.status, m.is_featured, m.is_pinned,
        m.view_count, m.like_count, m.comment_count, m.published_at, m.created_at, m.updated_at,
        c.id as category_id, c.name as category_name, c.slug as category_slug, c.color as category_color,
        u.id as author_id, u.username as author_username, u.first_name as author_first_name, 
        u.last_name as author_last_name, u.avatar_url as author_avatar_url,
        ARRAY_AGG(
          CASE WHEN t.id IS NOT NULL THEN 
            json_build_object('id', t.id, 'name', t.name, 'slug', t.slug, 'color', t.color)
          END
        ) FILTER (WHERE t.id IS NOT NULL) as tags
      FROM messages m
      LEFT JOIN categories c ON m.category_id = c.id
      LEFT JOIN users u ON m.author_id = u.id
      LEFT JOIN message_tags mt ON m.id = mt.message_id
      LEFT JOIN tags t ON mt.tag_id = t.id
      ${whereClause}
      GROUP BY m.id, c.id, u.id
      ORDER BY m.${sort} ${order}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    
    const messages = await sql.unsafe(messagesQuery, ...params, limit, offset);
    
    logger.info(`Retrieved ${messages.length} messages for user ${req.user?.id || 'anonymous'}`);
    
    res.json({
      success: true,
      data: {
        messages: messages.map(message => ({
          id: message.id,
          title: message.title,
          content: message.content,
          excerpt: message.excerpt,
          slug: message.slug,
          status: message.status,
          isFeatured: message.is_featured,
          isPinned: message.is_pinned,
          viewCount: message.view_count,
          likeCount: message.like_count,
          commentCount: message.comment_count,
          publishedAt: message.published_at,
          createdAt: message.created_at,
          updatedAt: message.updated_at,
          category: message.category_id ? {
            id: message.category_id,
            name: message.category_name,
            slug: message.category_slug,
            color: message.category_color
          } : null,
          author: {
            id: message.author_id,
            username: message.author_username,
            firstName: message.author_first_name,
            lastName: message.author_last_name,
            avatarUrl: message.author_avatar_url
          },
          tags: message.tags || []
        })),
        pagination: {
          page,
          limit,
          total: parseInt(total),
          pages: Math.ceil(total / limit)
        }
      }
    });
    
  } catch (error) {
    logger.error('Get messages error:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      query: req.query
    });
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get message by ID or slug
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const getMessageBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Validate slug parameter
    if (!slug || typeof slug !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid slug parameter'
      });
    }
    
    // Check if it's a UUID (ID) or slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
    const whereClause = isUUID ? 'm.id = $1' : 'm.slug = $1';
    
    const messageQuery = `
      SELECT 
        m.id, m.title, m.content, m.excerpt, m.slug, m.status, m.is_featured, m.is_pinned,
        m.view_count, m.like_count, m.comment_count, m.published_at, m.created_at, m.updated_at,
        c.id as category_id, c.name as category_name, c.slug as category_slug, c.color as category_color,
        u.id as author_id, u.username as author_username, u.first_name as author_first_name, 
        u.last_name as author_last_name, u.avatar_url as author_avatar_url,
        ARRAY_AGG(
          CASE WHEN t.id IS NOT NULL THEN 
            json_build_object('id', t.id, 'name', t.name, 'slug', t.slug, 'color', t.color)
          END
        ) FILTER (WHERE t.id IS NOT NULL) as tags
      FROM messages m
      LEFT JOIN categories c ON m.category_id = c.id
      LEFT JOIN users u ON m.author_id = u.id
      LEFT JOIN message_tags mt ON m.id = mt.message_id
      LEFT JOIN tags t ON mt.tag_id = t.id
      WHERE ${whereClause}
      GROUP BY m.id, c.id, u.id
    `;
    
    const [message] = await sql.unsafe(messageQuery, slug);
    
    if (!message) {
      logger.warn(`Message not found: ${slug}`, { userId: req.user?.id });
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    // Check if user can view this message
    if (message.status !== 'active' && 
        req.user?.role !== 'admin' && 
        req.user?.role !== 'moderator' && 
        req.user?.id !== message.author_id) {
      logger.warn(`Unauthorized access attempt to message: ${slug}`, { userId: req.user?.id });
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    // Increment view count (only for active messages)
    if (message.status === 'active') {
      await sql`
        UPDATE messages 
        SET view_count = view_count + 1 
        WHERE id = ${message.id}
      `;
    }
    
    logger.info(`Message viewed: ${message.slug}`, { userId: req.user?.id });
    
    res.json({
      success: true,
      data: {
        message: {
          id: message.id,
          title: message.title,
          content: message.content,
          excerpt: message.excerpt,
          slug: message.slug,
          status: message.status,
          isFeatured: message.is_featured,
          isPinned: message.is_pinned,
          viewCount: message.view_count + 1, // Return incremented count
          likeCount: message.like_count,
          commentCount: message.comment_count,
          publishedAt: message.published_at,
          createdAt: message.created_at,
          updatedAt: message.updated_at,
          category: message.category_id ? {
            id: message.category_id,
            name: message.category_name,
            slug: message.category_slug,
            color: message.category_color
          } : null,
          author: {
            id: message.author_id,
            username: message.author_username,
            firstName: message.author_first_name,
            lastName: message.author_last_name,
            avatarUrl: message.author_avatar_url
          },
          tags: message.tags || []
        }
      }
    });
    
  } catch (error) {
    logger.error('Get message by slug error:', {
      error: error.message,
      stack: error.stack,
      slug: req.params.slug,
      userId: req.user?.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Create new message
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const createMessage = async (req, res) => {
  try {
    const { title, content, excerpt, categoryId, tags, isFeatured, isPinned, status } = req.body;
    
    // Generate slug
    let slug = generateSlug(title);
    
    // Ensure slug is unique
    let slugExists = true;
    let counter = 1;
    let finalSlug = slug;
    
    while (slugExists) {
      const [existing] = await sql`
        SELECT id FROM messages WHERE slug = ${finalSlug}
      `;
      
      if (!existing) {
        slugExists = false;
      } else {
        finalSlug = `${slug}-${counter}`;
        counter++;
      }
    }
    
    // Set default status based on user role
    let messageStatus = status || 'active';
    if (req.user.role === 'user') {
      messageStatus = 'active'; // Users can only create active messages
    }
    
    // Create message
    const [message] = await sql`
      INSERT INTO messages (
        title, content, excerpt, slug, category_id, author_id, status,
        is_featured, is_pinned, published_at
      ) VALUES (
        ${title}, ${content}, ${excerpt || null}, ${finalSlug}, ${categoryId || null}, 
        ${req.user.id}, ${messageStatus}, ${isFeatured || false}, ${isPinned || false},
        ${messageStatus === 'active' ? new Date() : null}
      ) RETURNING *
    `;
    
    // Add tags if provided
    if (tags && Array.isArray(tags) && tags.length > 0) {
      for (const tagId of tags) {
        // Validate each tag ID is a UUID
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tagId)) {
          logger.warn(`Invalid tag ID provided: ${tagId}`, { userId: req.user.id });
          continue;
        }
        
        await sql`
          INSERT INTO message_tags (message_id, tag_id)
          VALUES (${message.id}, ${tagId})
          ON CONFLICT (message_id, tag_id) DO NOTHING
        `;
      }
    }
    
    // Log creation
    await createAuditLog(
      req.user.id, 
      'create', 
      'message', 
      message.id, 
      null, 
      message, 
      req.ip, 
      req.get('User-Agent')
    );
    
    logger.info(`Message created: ${message.slug}`, { 
      userId: req.user.id, 
      messageId: message.id 
    });
    
    res.status(201).json({
      success: true,
      message: 'Message created successfully',
      data: {
        message: {
          id: message.id,
          title: message.title,
          content: message.content,
          excerpt: message.excerpt,
          slug: message.slug,
          status: message.status,
          isFeatured: message.is_featured,
          isPinned: message.is_pinned,
          viewCount: message.view_count,
          likeCount: message.like_count,
          commentCount: message.comment_count,
          publishedAt: message.published_at,
          createdAt: message.created_at,
          updatedAt: message.updated_at
        }
      }
    });
    
  } catch (error) {
    logger.error('Create message error:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      body: req.body
    });
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update message with field whitelisting
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const updateMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, excerpt, categoryId, tags, isFeatured, isPinned, status } = req.body;
    
    // Get existing message
    const [existingMessage] = await sql`
      SELECT * FROM messages WHERE id = ${id}
    `;
    
    if (!existingMessage) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    // Check permissions
    const canEdit = req.user.role === 'admin' || 
                   req.user.role === 'moderator' || 
                   req.user.id === existingMessage.author_id;
    
    if (!canEdit) {
      logger.warn(`Unauthorized message update attempt`, { 
        userId: req.user.id, 
        messageId: id 
      });
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
    
    // Build update object with whitelisted fields only
    const updates = {};
    
    // Only include allowed fields that are defined in the request
    if (title !== undefined && ALLOWED_MESSAGE_UPDATE_FIELDS.includes('title')) {
      updates.title = title;
      // Regenerate slug if title changed
      if (title !== existingMessage.title) {
        let slug = generateSlug(title);
        
        // Ensure slug is unique
        let slugExists = true;
        let counter = 1;
        let finalSlug = slug;
        
        while (slugExists) {
          const [existing] = await sql`
            SELECT id FROM messages WHERE slug = ${finalSlug} AND id != ${id}
          `;
          
          if (!existing) {
            slugExists = false;
          } else {
            finalSlug = `${slug}-${counter}`;
            counter++;
          }
        }
        
        updates.slug = finalSlug;
      }
    }
    
    if (content !== undefined && ALLOWED_MESSAGE_UPDATE_FIELDS.includes('content')) {
      updates.content = content;
    }
    if (excerpt !== undefined && ALLOWED_MESSAGE_UPDATE_FIELDS.includes('excerpt')) {
      updates.excerpt = excerpt;
    }
    if (categoryId !== undefined && ALLOWED_MESSAGE_UPDATE_FIELDS.includes('category_id')) {
      updates.category_id = categoryId;
    }
    
    // Only admins and moderators can update these fields
    if (req.user.role === 'admin' || req.user.role === 'moderator') {
      if (isFeatured !== undefined && ALLOWED_MESSAGE_UPDATE_FIELDS.includes('is_featured')) {
        updates.is_featured = isFeatured;
      }
      if (isPinned !== undefined && ALLOWED_MESSAGE_UPDATE_FIELDS.includes('is_pinned')) {
        updates.is_pinned = isPinned;
      }
      if (status !== undefined && ALLOWED_MESSAGE_UPDATE_FIELDS.includes('status')) {
        updates.status = status;
        // Set published_at when status changes to active
        if (status === 'active' && existingMessage.status !== 'active') {
          updates.published_at = new Date();
        }
      }
    }
    
    if (Object.keys(updates).length === 0 && !tags) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }
    
    // Update message using safe parameterized query
    let updatedMessage = existingMessage;
    if (Object.keys(updates).length > 0) {
      const updateFields = Object.keys(updates);
      const updateValues = Object.values(updates);
      const setClause = updateFields.map((field, index) => `${field} = $${index + 2}`).join(', ');
      
      [updatedMessage] = await sql.unsafe(
        `UPDATE messages SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
        id, ...updateValues
      );
    }
    
    // Update tags if provided
    if (tags !== undefined && Array.isArray(tags)) {
      // Remove existing tags
      await sql`DELETE FROM message_tags WHERE message_id = ${id}`;
      
      // Add new tags with validation
      for (const tagId of tags) {
        // Validate each tag ID is a UUID
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tagId)) {
          logger.warn(`Invalid tag ID provided during update: ${tagId}`, { userId: req.user.id });
          continue;
        }
        
        await sql`
          INSERT INTO message_tags (message_id, tag_id)
          VALUES (${id}, ${tagId})
          ON CONFLICT (message_id, tag_id) DO NOTHING
        `;
      }
    }
    
    // Log update
    await createAuditLog(
      req.user.id, 
      'update', 
      'message', 
      id, 
      existingMessage, 
      updatedMessage, 
      req.ip, 
      req.get('User-Agent')
    );
    
    logger.info(`Message updated: ${updatedMessage.slug}`, { 
      userId: req.user.id, 
      messageId: id 
    });
    
    res.json({
      success: true,
      message: 'Message updated successfully',
      data: {
        message: {
          id: updatedMessage.id,
          title: updatedMessage.title,
          content: updatedMessage.content,
          excerpt: updatedMessage.excerpt,
          slug: updatedMessage.slug,
          status: updatedMessage.status,
          isFeatured: updatedMessage.is_featured,
          isPinned: updatedMessage.is_pinned,
          viewCount: updatedMessage.view_count,
          likeCount: updatedMessage.like_count,
          commentCount: updatedMessage.comment_count,
          publishedAt: updatedMessage.published_at,
          createdAt: updatedMessage.created_at,
          updatedAt: updatedMessage.updated_at
        }
      }
    });
    
  } catch (error) {
    logger.error('Update message error:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      messageId: req.params.id,
      body: req.body
    });
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Delete message
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get existing message
    const [message] = await sql`
      SELECT * FROM messages WHERE id = ${id}
    `;
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    // Check permissions
    const canDelete = req.user.role === 'admin' || 
                     req.user.role === 'moderator' || 
                     req.user.id === message.author_id;
    
    if (!canDelete) {
      logger.warn(`Unauthorized message deletion attempt`, { 
        userId: req.user.id, 
        messageId: id 
      });
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
    
    // Delete message (cascade will handle related records)
    await sql`DELETE FROM messages WHERE id = ${id}`;
    
    // Log deletion
    await createAuditLog(
      req.user.id, 
      'delete', 
      'message', 
      id, 
      message, 
      null, 
      req.ip, 
      req.get('User-Agent')
    );
    
    logger.info(`Message deleted: ${message.slug}`, { 
      userId: req.user.id, 
      messageId: id 
    });
    
    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
    
  } catch (error) {
    logger.error('Delete message error:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      messageId: req.params.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};