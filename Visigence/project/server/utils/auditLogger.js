import { sql } from '../config/database.js';

/**
 * Create an audit log entry
 * @param {string} userId - ID of the user performing the action
 * @param {string} action - Type of action (create, update, delete, login, logout, password_reset)
 * @param {string} resourceType - Type of resource being acted upon
 * @param {string} resourceId - ID of the resource
 * @param {object} oldValues - Previous values (for updates)
 * @param {object} newValues - New values (for creates/updates)
 * @param {string} ipAddress - IP address of the request
 * @param {string} userAgent - User agent string
 */
export async function createAuditLog(
  userId, 
  action, 
  resourceType, 
  resourceId, 
  oldValues = null, 
  newValues = null, 
  ipAddress = null, 
  userAgent = null
) {
  try {
    await sql`
      INSERT INTO audit_logs (
        user_id, action, resource_type, resource_id, 
        old_values, new_values, ip_address, user_agent
      ) VALUES (
        ${userId}, ${action}, ${resourceType}, ${resourceId},
        ${oldValues ? JSON.stringify(oldValues) : null},
        ${newValues ? JSON.stringify(newValues) : null},
        ${ipAddress}, ${userAgent}
      )
    `;
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw error to avoid breaking the main operation
  }
}

/**
 * Get audit logs with filtering and pagination
 * @param {object} filters - Filtering options
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {object} Audit logs and pagination info
 */
export async function getAuditLogs(filters = {}, page = 1, limit = 50) {
  try {
    const offset = (page - 1) * limit;
    
    // Build WHERE clause
    let whereConditions = ['1=1'];
    let params = [];
    
    if (filters.userId) {
      whereConditions.push(`al.user_id = $${params.length + 1}`);
      params.push(filters.userId);
    }
    
    if (filters.action) {
      whereConditions.push(`al.action = $${params.length + 1}`);
      params.push(filters.action);
    }
    
    if (filters.resourceType) {
      whereConditions.push(`al.resource_type = $${params.length + 1}`);
      params.push(filters.resourceType);
    }
    
    if (filters.resourceId) {
      whereConditions.push(`al.resource_id = $${params.length + 1}`);
      params.push(filters.resourceId);
    }
    
    if (filters.dateFrom) {
      whereConditions.push(`al.created_at >= $${params.length + 1}`);
      params.push(filters.dateFrom);
    }
    
    if (filters.dateTo) {
      whereConditions.push(`al.created_at <= $${params.length + 1}`);
      params.push(filters.dateTo);
    }
    
    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM audit_logs al
      ${whereClause}
    `;
    const [{ total }] = await sql.unsafe(countQuery, ...params);
    
    // Get audit logs
    const logsQuery = `
      SELECT 
        al.id, al.action, al.resource_type, al.resource_id,
        al.old_values, al.new_values, al.ip_address, al.user_agent, al.created_at,
        u.username, u.first_name, u.last_name, u.email
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    
    const logs = await sql.unsafe(logsQuery, ...params, limit, offset);
    
    return {
      success: true,
      data: {
        logs: logs.map(log => ({
          id: log.id,
          action: log.action,
          resourceType: log.resource_type,
          resourceId: log.resource_id,
          oldValues: log.old_values,
          newValues: log.new_values,
          ipAddress: log.ip_address,
          userAgent: log.user_agent,
          createdAt: log.created_at,
          user: log.username ? {
            username: log.username,
            firstName: log.first_name,
            lastName: log.last_name,
            email: log.email
          } : null
        })),
        pagination: {
          page,
          limit,
          total: parseInt(total),
          pages: Math.ceil(total / limit)
        }
      }
    };
    
  } catch (error) {
    console.error('Failed to get audit logs:', error);
    return {
      success: false,
      error: error.message
    };
  }
}