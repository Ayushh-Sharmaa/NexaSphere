/**
 * Authentication API Endpoints Documentation
 * All auth-related endpoints with request/response examples
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account with email and password
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: SecurePass123!
 *               name:
 *                 type: string
 *                 example: John Doe
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: user-123
 *                     email:
 *                       type: string
 *                       example: user@example.com
 *                     name:
 *                       type: string
 *                       example: John Doe
 *       400:
 *         description: Invalid input or email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     description: Authenticate with email and password to get JWT token
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePass123!
 *     responses:
 *       200:
 *         description: Login successful, JWT token returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/auth/verify:
 *   post:
 *     summary: Verify email token
 *     description: Verify user email with verification token
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 example: verification-token-abc123
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired token
 */

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh JWT token
 *     description: Get a new JWT token using refresh token
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: New token generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *       401:
 *         description: Unauthorized - token expired or invalid
 */

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Get all events
 *     description: Retrieve list of all events with pagination and filtering
 *     tags:
 *       - Events
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [upcoming, ongoing, completed, cancelled]
 *         description: Filter by event status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search events by name
 *     responses:
 *       200:
 *         description: List of events
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Event'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Create new event
 *     description: Create a new event (admin only)
 *     tags:
 *       - Events
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - date
 *               - location
 *               - capacity
 *             properties:
 *               name:
 *                 type: string
 *                 example: Tech Workshop
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *                 example: '2024-06-15T10:00:00Z'
 *               location:
 *                 type: string
 *                 example: Building A, Room 101
 *               capacity:
 *                 type: integer
 *                 minimum: 1
 *                 example: 50
 *     responses:
 *       201:
 *         description: Event created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Event'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin only
 */

/**
 * @swagger
 * /api/events/{eventId}:
 *   get:
 *     summary: Get event details
 *     description: Retrieve details of a specific event
 *     tags:
 *       - Events
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Event'
 *       404:
 *         description: Event not found
 */

/**
 * @swagger
 * /api/events/{eventId}:
 *   put:
 *     summary: Update event
 *     description: Update event details (admin only)
 *     tags:
 *       - Events
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: string
 *               capacity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Event updated successfully
 *       403:
 *         description: Forbidden - admin only
 *       404:
 *         description: Event not found
 */

/**
 * @swagger
 * /api/events/{eventId}:
 *   delete:
 *     summary: Delete event
 *     description: Delete an event (admin only)
 *     tags:
 *       - Events
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event deleted successfully
 *       403:
 *         description: Forbidden - admin only
 *       404:
 *         description: Event not found
 */

/**
 * @swagger
 * /api/events/{eventId}/register:
 *   post:
 *     summary: Register for event
 *     description: Register current user for an event
 *     tags:
 *       - Events
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: Successfully registered for event
 *       400:
 *         description: Already registered or event full
 *       404:
 *         description: Event not found
 */

/**
 * @swagger
 * /api/events/{eventId}/stats:
 *   get:
 *     summary: Get event statistics
 *     description: Get registration and attendance statistics for an event
 *     tags:
 *       - Events
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalRegistrations:
 *                       type: integer
 *                     attendance:
 *                       type: integer
 *                     attendanceRate:
 *                       type: number
 *                       format: float
 *                     avgRating:
 *                       type: number
 *                       format: float
 */

/**
 * @swagger
 * tags:
 *   name: Resource Discovery
 *   description: APIs for the Intelligent Campus Resource Discovery Platform
 *   - name: Reporting Center
 *     description: Platform-Wide Data Export & Reporting Center
 *   - name: Maintenance
 *     description: Platform-Wide Scheduled Maintenance Management
 *   - name: Workspaces
 *     description: Smart Workspace for Club & Team Collaboration
 *   - name: Reporting Center
 *     description: Platform-Wide Data Export & Reporting Center
 */
/**
 * @swagger
 * /api/reporting-center/reports:
 *   get:
 *     summary: Get all reports
 *     tags: [Reporting Center]
 *     responses:
 *       200:
 *         description: Reports retrieved successfully
 * /api/reporting-center/export:
 *   post:
 *     summary: Export data (CSV, Excel, PDF)
 * /api/maintenance:
 *     summary: Get all maintenance schedules
 *     tags: [Maintenance]
 *         description: Maintenance schedules retrieved successfully
 *
 *     summary: Create maintenance schedule
 * /api/workspaces:
 *     summary: Get all workspaces
 *     tags: [Workspaces]
 *         description: Workspaces retrieved successfully
 *     summary: Create a workspace
 *     requestBody:
 *       required: true
 *         description: Data exported successfully
 * /api/reporting-center/schedule:
 *     summary: Schedule report generation
 *       201:
 *         description: Report scheduled successfully
 * /api/reporting-center/custom:
 *     summary: Generate custom report
 *         description: Custom report generated successfully
 * /api/reporting-center/templates:
 *     summary: Get saved report templates
 *         description: Templates retrieved successfully
 *
 *     summary: Save report template
 *         description: Template saved successfully
 *         description: Maintenance created successfully
 *         description: Workspace created successfully
 */
/**
 * @swagger
 * /api/maintenance/{id}:
 *   get:
 *     summary: Get maintenance by ID
 *     tags: [Maintenance]
 * /api/workspaces/{id}:
 *     summary: Get workspace by ID
 *     tags: [Workspaces]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Maintenance retrieved successfully
 *   put:
 *     summary: Update maintenance
 *         description: Workspace retrieved successfully
 *
 *     summary: Update workspace
 *     tags: [Workspaces]
 *   - name: Knowledge Assistant
 *     description: AI-Powered Platform Knowledge Assistant
 *     tags: [Reporting Center]
 *     requestBody:
 *       required: true
 *     responses:
 *       201:
 *         description: Template saved successfully
 * /api/notification-preferences/{userId}:
 *   get:
 *     summary: Get notification preferences
 *     tags:
 *       - Notification Preferences
 *     parameters:
 *       - in: path
 *         name: userId
 * /api/portfolio/{username}/analytics:
 *   get:
 *     summary: Get portfolio analytics
 *     description: Retrieve portfolio performance analytics including profile visits, engagement, downloads, and project popularity.
 *     tags:
 *       - Portfolio
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: Portfolio username
 *     responses:
 *       200:
 *         description: Portfolio analytics retrieved successfully
 *       404:
 *         description: Portfolio not found
 */
/**
 * @swagger
 * /api/portfolio/{username}/visit:
 *   post:
 *     summary: Record portfolio visit
 *     description: Records a visit to a user's portfolio for analytics purposes.
 *     tags:
 *       - Portfolio
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification preferences returned successfully
 *         description: Visit recorded successfully
 *       404:
 *         description: Portfolio not found
 */
/**
 * @swagger
 * /api/portfolio/{username}/monthly-report:
 *   get:
 *     summary: Get monthly analytics report
 *     description: Returns the monthly portfolio performance report.
 *     tags:
 *       - Portfolio
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Matching files returned
 *         description: Monthly report retrieved successfully
 *       404:
 *         description: Portfolio not found
 */
/**
 * @swagger
 * /api/portfolio/{username}/monthly-report:
 *   get:
 *     ...
 */

/**
 * @swagger
 * /api/resource-discovery:
 *   get:
 *     summary: Get all campus resources
 *     tags: [Resource Discovery]
 *     responses:
 *       200:
 *         description: List of resources retrieved successfully
 *
 *   post:
 *     summary: Create a new resource
 *     tags: [Resource Discovery]
 *     responses:
 *       201:
 *         description: Resource created successfully
 * /api/knowledge-assistant/query:
 *   post:
 *     summary: Ask the AI knowledge assistant
 *     tags: [Knowledge Assistant]
 * /api/notification-preferences/{userId}:
 *   put:
 *     summary: Update notification preferences
 *     tags:
 *       - Notification Preferences
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *     responses:
 *       200:
 *         description: Maintenance updated successfully
 *
 *   delete:
 *     summary: Delete maintenance
 *     tags: [Maintenance]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Maintenance deleted successfully
 */

/**
 * @swagger
 * /api/maintenance/{id}/start:
 *   post:
 *     summary: Start maintenance
 *     tags: [Maintenance]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Maintenance started successfully
 */

/**
 * @swagger
 * /api/maintenance/{id}/complete:
 *   post:
 *     summary: Complete maintenance
 *     tags: [Maintenance]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Maintenance completed successfully
 */

/**
 * @swagger
 * /api/maintenance/emergency:
 *   post:
 *     summary: Activate emergency maintenance
 *     tags: [Maintenance]
 *     requestBody:
 *       required: true
 *     responses:
 *       201:
 *         description: Emergency maintenance activated
 *         description: AI response generated successfully
 *         description: Preferences updated successfully
 */

/**
 * @swagger
 * /api/knowledge-assistant/search:
 *   get:
 *     summary: Natural language search
 *     tags: [Knowledge Assistant]
 *     parameters:
 *       - in: query
 *         name: q
 * /api/notification-preferences/{userId}/history:
 *   get:
 *     summary: Get notification history
 *     tags:
 *       - Notification Preferences
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Search results returned successfully
 *         description: Notification history returned successfully
 * ...
 */


 * ...
 */

/**
 * @swagger
 * /api/knowledge-assistant/documentation:
 *   get:
 *     summary: Search documentation
 *     tags: [Knowledge Assistant]
 *     parameters:
 *       - in: query
 *         name: topic
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Documentation retrieved successfully
 */

/**
 * @swagger
 * /api/knowledge-assistant/events:
 *   get:
 *     summary: Get event recommendations
 *     tags: [Knowledge Assistant]
 *     responses:
 *       200:
 *         description: Event recommendations returned successfully
 */

/**
 * @swagger
 * /api/knowledge-assistant/clubs:
 *   get:
 *     summary: Get club information
 *     tags: [Knowledge Assistant]
 *     parameters:
 *       - in: query
 *         name: club
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Club information retrieved successfully
 */

/**
 * @swagger
 * /api/knowledge-assistant/faqs:
 *   get:
 *     summary: Generate FAQs
 *     tags: [Knowledge Assistant]
 *     responses:
 *       200:
 *         description: FAQs generated successfully
 */

/**
 * @swagger
 * /api/knowledge-assistant/guides:
 *   get:
 *     summary: Get step-by-step guides
 *     tags: [Knowledge Assistant]
 *     parameters:
 *       - in: query
 *         name: topic
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Guides returned successfully
 */

/**
 * @swagger
 * /api/knowledge-assistant/suggestions:
 *   get:
 *     summary: Smart search suggestions
 *     tags: [Knowledge Assistant]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Suggestions returned successfully
 */

/**
 * @swagger
 * /api/knowledge-assistant/translate:
 *   post:
 *     summary: Translate assistant response
 *     tags: [Knowledge Assistant]
 *     requestBody:
 *       required: true
 *     responses:
 *       200:
 *         description: Translation completed successfully
 */

/**
 * @swagger
 * /api/knowledge-assistant/history:
 *   get:
 *     summary: Get query history
 *     tags: [Knowledge Assistant]
 *     responses:
 *       200:
 *         description: Query history returned successfully
 */

/**
 * @swagger
 * /api/knowledge-assistant/feedback:
 *   post:
 *     summary: Submit assistant feedback
 *     tags: [Knowledge Assistant]
 *     requestBody:
 *       required: true
 *     responses:
 *       201:
 *         description: Feedback submitted successfully
 * /api/announcements:
 *   get:
 *     summary: Get all announcements
 *     description: Returns all announcements sorted by priority and pinned status.
 *     tags:
 *       - Announcements
 *     responses:
 *       200:
 *         description: List of announcements retrieved successfully.
 *
 *   post:
 *     summary: Create a new announcement
 *     description: Creates a new announcement with priority, audience, and expiration.
 *     tags:
 *       - Announcements
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - message
 *             properties:
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [Critical, High, Medium, Low]
 *               pinned:
 *                 type: boolean
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *               audience:
 *                 type: string
 *     responses:
 *       201:
 *         description: Announcement created successfully.
 */

/**
 * @swagger
 * /api/resource-discovery/{id}:
 *   get:
 *     summary: Get resource by ID
 *     tags: [Resource Discovery]
 * /api/reporting-center/email:
 *   post:
 *     summary: Email report
 *     tags: [Reporting Center]
 *     requestBody:
 *       required: true
 *     responses:
 *       200:
 *         description: Report emailed successfully
 * /api/maintenance/public:
 *     summary: Get public maintenance status
 *     tags: [Maintenance]
 *         description: Public maintenance status retrieved
 */
/**
 * @swagger
 * /api/maintenance/history:
 *     summary: Get maintenance history
 *         description: Maintenance history retrieved
 * /api/maintenance/countdown/{id}:
 *     summary: Get maintenance countdown
 * /api/knowledge-assistant/analytics:
 *   get:
 *     summary: Get assistant analytics
 *     tags: [Knowledge Assistant]
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
 * /api/announcements/{id}/priority:
 *   patch:
 *     summary: Update announcement priority
 *     tags:
 *       - Announcements
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Resource retrieved successfully
 *
 *   put:
 *     summary: Update a resource
 *     tags: [Resource Discovery]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Resource updated successfully
 *
 *   delete:
 *     summary: Delete a resource
 *     tags: [Resource Discovery]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Resource deleted successfully
 *         description: Countdown retrieved successfully
 *         description: Workspace updated successfully
 *     summary: Delete workspace
 *     tags: [Workspaces]
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               priority:
 *                 type: string
 *                 enum: [Critical, High, Medium, Low]
 *     responses:
 *       200:
 *         description: Priority updated successfully.
 */

/**
 * @swagger
 * /api/resource-discovery/search:
 *   get:
 *     summary: Search campus resources
 *     tags: [Resource Discovery]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Search results returned successfully
 * /api/reporting-center/dashboard:
 *     summary: Get dashboard summary
 *     tags: [Reporting Center]
 *         description: Dashboard summary retrieved successfully
 */
/**
 * @swagger
 * /api/reporting-center/history:
 *     summary: Get report history
 *         description: Report history retrieved successfully
 * /api/reporting-center/audit:
 *     summary: Get export audit logs
 *         description: Audit logs retrieved successfully
 * /api/reporting-center/filter:
 *     summary: Filter reports
 * /api/maintenance/notify:
 *   post:
 *     summary: Send maintenance notifications
 *     tags: [Maintenance]
 * /api/knowledge-assistant/update:
 *   post:
 *     summary: Update knowledge base
 *     tags: [Knowledge Assistant]
 *     responses:
 *       200:
 *         description: Knowledge base updated successfully
 */

 * /api/announcements/{id}/pin:
 *   patch:
 *     summary: Pin or unpin an announcement
 *     tags:
 *       - Announcements
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Workspace deleted successfully
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pinned:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Announcement updated successfully.
 */

/**
 * @swagger
 * /api/budgets/{id}/expenses:
 *   get:
 *     summary: Get budget expenses
 *     tags: [Budget Management]
 * /api/announcements/{id}/read:
 *   post:
 *     summary: Mark announcement as read
 *     tags:
 *       - Announcements
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Expenses retrieved successfully
 *
 *   post:
 *     summary: Add expense
 *     tags: [Budget Management]
 *     requestBody:
 *       required: true
 *     responses:
 *       201:
 *         description: Expense added successfully
 */

/**
 * @swagger
 * /api/budgets/{id}/invoice:
 *   post:
 *     summary: Upload invoice
 *     tags: [Budget Management]
 *     requestBody:
 *       required: true
 *     responses:
 *       201:
 *         description: Invoice uploaded successfully
 */

/**
 * @swagger
 * /api/budgets/{id}/approve:
 *   post:
 *     summary: Approve expense
 *     tags: [Budget Management]
 *     responses:
 *       200:
 *         description: Expense approved successfully
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Announcement marked as read.
 */

/**
 * @swagger
 * /api/announcements/analytics:
 *   get:
 *     summary: Get announcement analytics
 *     description: Returns announcement statistics including views, reads, and priority distribution.
 *     tags:
 *       - Announcements
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully.
 */

/**
 * @swagger
 * /api/admin/event-scheduling/conflicts:
 *   get:
 *     summary: Detect event scheduling conflicts
 *     description: Returns events that overlap in time or venue.
 *     tags:
 *       - Event Scheduling
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Conflict list returned successfully.
 */

/**
 * @swagger
 * /api/admin/event-scheduling/venue:
 *   get:
 *     summary: Check venue availability
 *     description: Verify whether a venue is available for a selected date.
 *     tags:
 *       - Event Scheduling
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: venue
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Venue availability returned.
 */

/**
 * @swagger
 * /api/admin/event-scheduling/attendance-impact:
 *   get:
 *     summary: Attendance impact analysis
 *     description: Analyze attendance impact caused by conflicting events.
 *     tags:
 *       - Event Scheduling
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Attendance analysis generated.
 */

/**
 * @swagger
 * /api/admin/event-scheduling/recommendations:
 *   get:
 *     summary: Smart scheduling recommendations
 *     description: Returns recommended schedules for events.
 *     tags:
 *       - Event Scheduling
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Scheduling recommendations returned.
 */

/**
 * @swagger
 * /api/admin/event-scheduling/calendar:
 *   get:
 *     summary: Calendar integration
 *     description: Returns event data formatted for calendar integration.
 *     tags:
 *       - Event Scheduling
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Calendar events returned.
 */

/**
 * @swagger
 * /api/admin/event-scheduling/alerts:
 *   get:
 *     summary: Organizer alerts
 *     description: Returns scheduling alerts for organizers.
 *     tags:
 *       - Event Scheduling
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Organizer alerts returned successfully.
 */

/**
 * @swagger
 * /api/admin/waitlist/join:
 *   post:
 *     summary: Join an event waitlist
 *     description: Adds a user to the waitlist when an event is full.
 *     tags:
 *       - Waitlist Management
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully added to waitlist.
 */

/**
 * @swagger
 * /api/admin/waitlist/position:
 *   get:
 *     summary: Get waitlist position
 *     description: Returns the user's current position in the event waitlist.
 *     tags:
 *       - Waitlist Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Waitlist position returned.
 */

/**
 * @swagger
 * /api/admin/waitlist/auto-enroll:
 *   post:
 *     summary: Auto-enroll next waitlisted user
 *     description: Automatically enrolls the first user from the waitlist when a seat becomes available.
 *     tags:
 *       - Waitlist Management
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User enrolled successfully.
 */

/**
 * @swagger
 * /api/admin/waitlist/notifications:
 *   get:
 *     summary: Get waitlist notifications
 *     description: Returns notification history for waitlisted users.
 *     tags:
 *       - Waitlist Management
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully.
 */

/**
 * @swagger
 * /api/admin/waitlist/analytics:
 *   get:
 *     summary: Waitlist analytics
 *     description: Returns statistics about waitlists and enrollments.
 *     tags:
 *       - Waitlist Management
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully.
 */

/**
 * @swagger
 * /api/admin/waitlist/deadline:
 *   post:
 *     summary: Set registration deadline
 *     description: Configure the registration deadline for an event.
 *     tags:
 *       - Waitlist Management
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Registration deadline updated successfully.
 */

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Global Search
 *     description: Search across events, team members, portfolios, and resources.
 *     tags:
 *       - Global Search
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search keyword
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Filtered reports returned successfully
 *           enum:
 *             - all
 *             - events
 *             - members
 *             - portfolios
 *             - resources
 *         description: Filter search by category
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Maximum results
 *     responses:
 *       200:
 *         description: Search results returned successfully.
 */

/**
 * @swagger
 * /api/resource-discovery/category/{category}:
 * /api/workspaces/{id}/documents:
 *   get:
 *     summary: Get shared documents
 *     tags: [Workspaces]
 *     responses:
 *       200:
 *         description: Documents retrieved successfully
 *
 *   post:
 *     summary: Upload shared document
 *     requestBody:
 *       required: true
 *       201:
 *         description: Document uploaded successfully
 * /api/search/trending:
 *   get:
 *     summary: Get resources by category
 *     tags: [Resource Discovery]
 *     parameters:
 *       - in: path
 *         name: category
 * /api/search/trending:
 * /api/search/trending:
 *   get:
 *     summary: Trending Searches
 *     description: Returns the most popular search queries.
 *     tags:
 *       - Global Search
 * /api/reporting-center/permissions:
 *     summary: Get export permissions
 *     tags: [Reporting Center]
 *     responses:
 *       200:
 *         description: Export permissions retrieved successfully
 */
/**
 * @swagger
 * /api/search/recent:
 *     summary: Recent Searches
 *     description: Returns the user's recent search history.
 *     security:
 *       - bearerAuth: []
 *         description: Recent searches returned successfully.
 * /api/search/suggestions:
 *     summary: Instant Search Suggestions
 *     description: Returns autocomplete suggestions while typing.
 *     responses:
 *       200:
 *         description: Trending searches retrieved successfully.
 */

/**
 * @swagger
 * /api/search/recent:
 *   get:
 *     summary: Recent Searches
 *     description: Returns the user's recent search history.
 *     tags:
 *       - Global Search
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recent searches returned successfully.
 */

/**
 * @swagger
 * /api/search/suggestions:
 *   get:
 *     summary: Instant Search Suggestions
 *     description: Returns autocomplete suggestions while typing.
 *     tags:
 *       - Global Search
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Resources filtered by category
 *         description: Suggestions returned successfully.
 * /api/resource-discovery/popular:
 *     summary: Get popular resources
 *         description: Popular resources retrieved
 * /api/admin/search/analytics:
 *     summary: Search Analytics Dashboard
 *     description: Returns analytics about search usage, popular keywords and categories.
 *         description: Analytics retrieved successfully.
 * /api/resource-discovery/recent:
 *     summary: Get recently added resources
 *         description: Recent resources retrieved
 * /api/resource-discovery/recommended/{userId}:
 *     summary: Get recommended resources
 * /api/activity-timeline/{userId}:
 *     summary: Get user activity timeline
 *       - Activity Timeline
 *         name: userId
 *           type: integer
 *         description: Personalized recommendations retrieved
 *         description: User activity timeline
 * /api/resource-discovery/bookmarks/{userId}:
 *     summary: Get bookmarked resources
 *         description: User bookmarks retrieved
 * /api/resource-discovery/{id}/bookmark/{userId}:
 *   post:
 *     summary: Bookmark a resource
 *         name: id
 *         description: Resource bookmarked successfully
 *
 *   delete:
 *     summary: Remove bookmarked resource
 *         description: Bookmark removed successfully
 *     summary: Add activity to timeline
 *     requestBody:
 *       required: true
 *     responses:
 *       200:
 *         description: Notifications sent successfully
 *         description: Activity added successfully
 */
/**
 * @swagger
 * /api/resource-discovery/analytics:
 *     summary: Get resource analytics
 *         description: Resource analytics retrieved successfully
 * /api/maintenance/approve/{id}:
 *   post:
 *     summary: Approve maintenance schedule
 *     tags: [Maintenance]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Maintenance approved successfully
 * /api/activity-timeline/{userId}/summary:
 *     summary: Monthly activity summary
 *         description: Monthly summary
 * /api/budgets/{id}/categories:
 *     summary: Category-wise spending
 *     tags: [Budget Management]
 *         description: Category-wise spending retrieved
 * /api/budgets/vendors:
 *     summary: Get vendors
 *         description: Vendors retrieved successfully
 *     summary: Add vendor
 *       201:
 *         description: Vendor added successfully
 * /api/budgets/reports:
 *     summary: Financial reports
 *         description: Financial reports retrieved
 * /api/budgets/alerts:
 *     summary: Budget alerts
 *         description: Budget alerts retrieved
 * /api/budgets/export:
 *     summary: Export expense statements
 *         description: Expense statements exported
 * /api/budgets/history:
 *     summary: Historical budget comparison
 *         description: Historical comparison retrieved
 * tags:
 *   name: Workflow Automation
 *   description: APIs for managing approval workflows, requests, analytics, and audit logs.
 */
/**
 * @swagger
 * /api/activity-timeline/{userId}/stats:
 *   get:
 *     summary: Activity statistics
 *       - Activity Timeline
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Activity statistics
 *   - name: Notification Campaigns
 *     description: Intelligent Notification Scheduling & Campaign Management
 * /api/workspaces/{id}/discussions:
 *     summary: Get team discussions
 *     tags: [Workspaces]
 *         description: Discussions retrieved successfully
 *
 *     summary: Add discussion
 *     requestBody:
 *         description: Discussion added successfully
 * /api/workspaces/{id}/calendar:
 *     summary: Get shared calendar
 *         description: Calendar retrieved successfully
 * /api/workspaces/{id}/tasks:
 *     summary: Get workspace tasks
 *         description: Tasks retrieved successfully
 *     summary: Create task
 *         description: Task created successfully
 * /api/workspaces/{id}/notes:
 *     summary: Add meeting notes
 *         description: Meeting notes added successfully
 * /api/workspaces/{id}/polls:
 *     summary: Create quick poll
 *         description: Poll created successfully
 */

/**
 * @swagger
 * /api/workflow-automation/workflows:
 *   get:
 *     summary: Get all workflows
 *     tags: [Workflow Automation]
 *     responses:
 *       200:
 *         description: List of workflows retrieved successfully
 *
 *   post:
 *     summary: Create a new workflow
 *     tags: [Workflow Automation]
 *     responses:
 *       201:
 *         description: Workflow created successfully
 * /api/notification-campaigns:
 *     summary: Get all notification campaigns
 *     tags: [Notification Campaigns]
 *         description: Campaigns retrieved successfully
 *     summary: Create a notification campaign
 *     requestBody:
 *       required: true
 *         description: Campaign created successfully
 * /api/maintenance/banner:
 *     summary: Get maintenance status banner
 *     tags: [Maintenance]
 *         description: Status banner retrieved successfully
 * /api/workspaces/{id}/announcements:
 *     summary: Create team announcement
 *     tags: [Workspaces]
 *         description: Announcement created successfully
 */
/**
 * @swagger
 * /api/workspaces/{id}/timeline:
 *     summary: Get activity timeline
 *         description: Timeline retrieved successfully
 */

/**
 * @swagger
 * /api/workflow-automation/workflows/{id}:
 *   get:
 *     summary: Get workflow by ID
 *     tags: [Workflow Automation]
 * /api/notification-campaigns/{id}:
 *     summary: Get campaign by ID
 *     tags: [Notification Campaigns]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Workflow retrieved successfully
 *
 *   put:
 *     summary: Update workflow
 *     tags: [Workflow Automation]
 *         description: Campaign retrieved successfully
 *     summary: Update campaign
 *     tags: [Notification Campaigns]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Workflow updated successfully
 *
 *   delete:
 *     summary: Delete workflow
 *     tags: [Workflow Automation]
 *     requestBody:
 *       required: true
 *         description: Campaign updated successfully
 *     summary: Delete campaign
 *     tags: [Notification Campaigns]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Workflow deleted successfully
 *         description: Campaign deleted successfully
 * /api/workspaces/{id}/bookmarks:
 *     summary: Get shared bookmarks
 *     tags: [Workspaces]
 *         description: Bookmarks retrieved successfully
 */

/**
 * @swagger
 * /api/workflow-automation/requests:
 *   post:
 *     summary: Submit a workflow request
 *     tags: [Workflow Automation]
 *     responses:
 *       201:
 *         description: Request submitted successfully
 * /api/notification-campaigns/{id}/schedule:
 *     summary: Schedule a notification campaign
 *     tags: [Notification Campaigns]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       200:
 *         description: Campaign scheduled successfully
 */

/**
 * @swagger
 * /api/workflow-automation/requests/{id}/approve:
 *   put:
 *     summary: Approve a workflow request
 *     tags: [Workflow Automation]
 * /api/notification-campaigns/{id}/send:
 *   post:
 *     summary: Send campaign immediately
 *     tags: [Notification Campaigns]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Request approved successfully
 *         description: Campaign sent successfully
 */

/**
 * @swagger
 * /api/workflow-automation/requests/{id}/reject:
 *   put:
 *     summary: Reject a workflow request
 *     tags: [Workflow Automation]
 * /api/notification-campaigns/{id}/pause:
 *   post:
 *     summary: Pause a campaign
 *     tags: [Notification Campaigns]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Request rejected successfully
 *         description: Campaign paused successfully
 * /api/maintenance/services:
 *     summary: Get affected services
 *     tags: [Maintenance]
 *         description: Service impact information retrieved successfully
 */

/**
 * @swagger
 * /api/workflow-automation/requests/bulk-approve:
 *   post:
 *     summary: Bulk approve workflow requests
 *     tags: [Workflow Automation]
 *     responses:
 *       200:
 *         description: Requests approved successfully
 * /api/notification-campaigns/{id}/resume:
 *     summary: Resume a campaign
 *     tags: [Notification Campaigns]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Campaign resumed successfully
 * tags:
 *   - name: Digital Assets
 *     description: Organization-Wide Digital Asset Management System
 */

/**
 * @swagger
 * /api/workflow-automation/requests/pending:
 *   get:
 *     summary: Get pending workflow requests
 *     tags: [Workflow Automation]
 *     responses:
 *       200:
 *         description: Pending requests retrieved successfully
 * /api/notification-campaigns/history:
 *     summary: Get campaign history
 *     tags: [Notification Campaigns]
 *         description: Campaign history retrieved successfully
 */

/**
 * @swagger
 * /api/workflow-automation/history:
 *   get:
 *     summary: Get approval history
 *     tags: [Workflow Automation]
 *     responses:
 *       200:
 *         description: Approval history retrieved successfully
 */

/**
 * @swagger
 * /api/workflow-automation/templates:
 *   get:
 *     summary: Get workflow templates
 *     tags: [Workflow Automation]
 *     responses:
 *       200:
 *         description: Workflow templates retrieved successfully
 */

/**
 * @swagger
 * /api/workflow-automation/analytics:
 *   get:
 *     summary: Get workflow analytics
 *     tags: [Workflow Automation]
 *     responses:
 *       200:
 *         description: Workflow analytics retrieved successfully
 */

/**
 * @swagger
 * /api/workflow-automation/escalate:
 *   post:
 *     summary: Escalate pending workflow requests
 *     tags: [Workflow Automation]
 *     responses:
 *       200:
 *         description: Pending requests escalated successfully
 * /api/notification-campaigns/templates:
 *     summary: Get notification templates
 *     tags: [Notification Campaigns]
 *         description: Templates retrieved successfully
 *
 *     summary: Create a notification template
 *     requestBody:
 *       required: true
 *       201:
 *         description: Template created successfully
 * /api/digital-assets:
 *     summary: Get all digital assets
 *     tags: [Digital Assets]
 *         description: Assets retrieved successfully
 *     summary: Upload a new digital asset
 *         description: Asset uploaded successfully
 */

/**
 * @swagger
 * /api/workflow-automation/audit-logs:
 *   get:
 *     summary: Get workflow audit logs
 *     tags: [Workflow Automation]
 *     responses:
 *       200:
 *         description: Audit logs retrieved successfully
 */
 * /api/notification-campaigns/segments:
 *     summary: Get audience segments
 *     tags: [Notification Campaigns]
 *         description: Audience segments retrieved successfully
/**
 * @swagger
 * /api/notification-campaigns/analytics/{id}:
 *     summary: Get campaign analytics
 * /api/digital-assets/{id}:
 *     summary: Get asset by ID
 *     tags: [Digital Assets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Asset retrieved successfully
 *
 *   put:
 *     summary: Update asset
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Campaign analytics retrieved successfully
 * /api/notification-campaigns/ab-test:
 *   post:
 *     summary: Create an A/B test
 *     requestBody:
 *       201:
 *         description: A/B test created successfully
 *       required: true
 *     responses:
 *       200:
 *         description: Asset updated successfully
 *
 *   delete:
 *     summary: Delete asset
 *     tags: [Digital Assets]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         description: Asset deleted successfully
 */
/**
 * @swagger
 * /api/digital-assets/search:
 *   get:
 *     summary: Search assets
 *       - in: query
 *         name: q
 *           type: string
 *         description: Search results returned successfully
 * /api/digital-assets/category/{category}:
 *     summary: Filter assets by category
 *         name: category
 *         description: Category assets retrieved successfully
 * /api/digital-assets/folders:
 *     summary: Get folders
 *         description: Folder list retrieved
 *     summary: Create folder
 *         description: Folder created successfully
 * /api/digital-assets/duplicates:
 *     summary: Detect duplicate assets
 *         description: Duplicate assets retrieved
 * /api/digital-assets/tags/{id}:
 *     summary: Generate AI tags
 *         description: AI tags generated successfully
 * /api/digital-assets/history/{id}:
 *     summary: Get asset version history
 *         description: Version history retrieved
 * /api/digital-assets/preview/{id}:
 *     summary: Preview asset
 *         description: Asset preview generated
 * /api/digital-assets/bulk-upload:
 *     summary: Bulk upload assets
 *         description: Assets uploaded successfully
 * /api/digital-assets/bulk-download:
 *     summary: Bulk download assets
 *         description: Assets downloaded successfully
 * /api/digital-assets/share:
 *     summary: Share asset
 *         description: Asset shared successfully
 * /api/digital-assets/storage:
 *     summary: Storage usage analytics
 *         description: Storage analytics retrieved
 * /api/digital-assets/expiring:
 *     summary: Get expiring assets
 *         description: Expiring assets retrieved
 * /api/workspaces/{id}/analytics:
 *     summary: Get workspace analytics
 *     tags: [Workspaces]
 *         description: Analytics retrieved successfully
 *     responses:
 *       200:
 *         description: Suggestions returned successfully.
 */

/**
 * @swagger
 * /api/admin/search/analytics:
 *   get:
 *     summary: Search Analytics Dashboard
 *     description: Returns analytics about search usage, popular keywords and categories.
 *     tags:
 *       - Global Search
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully.
 */
export default {};
