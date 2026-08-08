const workflows = [
  {
    id: 1,
    name: 'Event Approval Workflow',
    category: 'Events',
    levels: 3,
    approvers: ['Club Coordinator', 'Faculty Mentor', 'Admin'],
    status: 'Active',
  },
  {
    id: 2,
    name: 'Portfolio Verification',
    category: 'Portfolio',
    levels: 2,
    approvers: ['Mentor', 'Admin'],
    status: 'Active',
  },
  {
    id: 3,
    name: 'Announcement Publishing',
    category: 'Announcements',
    levels: 2,
    approvers: ['Content Manager', 'Admin'],
    status: 'Draft',
  },
];

const requests = [
  {
    id: 101,
    workflow: 'Event Approval Workflow',
    title: 'AI Workshop 2026',
    requester: 'John Doe',
    status: 'Pending',
    submittedAt: '2026-07-08',
    currentApprover: 'Club Coordinator',
  },
  {
    id: 102,
    workflow: 'Portfolio Verification',
    title: 'Portfolio Submission',
    requester: 'Jane Smith',
    status: 'Approved',
    submittedAt: '2026-07-07',
    currentApprover: '-',
  },
];

const history = [
  {
    id: 1,
    requestId: 101,
    action: 'Submitted',
    by: 'John Doe',
    time: '2026-07-08 09:00',
  },
  {
    id: 2,
    requestId: 102,
    action: 'Approved',
    by: 'Admin',
    time: '2026-07-07 15:30',
  },
];

module.exports = {
  getAllWorkflows() {
    return {
      success: true,
      total: workflows.length,
      workflows,
    };
  },

  getWorkflowById(id) {
    const workflow = workflows.find((w) => w.id == id);

    return workflow
      ? { success: true, workflow }
      : {
          success: false,
          message: 'Workflow not found',
        };
  },

  createWorkflow(data) {
    const nextId = workflows.length > 0 ? Math.max(...workflows.map((w) => w.id)) + 1 : 1;
    const workflow = {
      id: nextId,
      ...data,
      status: 'Active',
    };

    workflows.push(workflow);

    return {
      success: true,
      message: 'Workflow created successfully',
      workflow,
    };
  },

  updateWorkflow(id, data) {
    const workflow = workflows.find((w) => w.id == id);

    if (!workflow) {
      return {
        success: false,
        message: 'Workflow not found',
      };
    }

    Object.assign(workflow, data);

    return {
      success: true,
      message: 'Workflow updated successfully',
      workflow,
    };
  },

  deleteWorkflow(id) {
    const index = workflows.findIndex((w) => w.id == id);

    if (index === -1) {
      return {
        success: false,
        message: 'Workflow not found',
      };
    }

    const deletedWorkflow = workflows[index];

    // Cancel pending requests associated with the deleted workflow
    requests.forEach((req) => {
      if (req.workflow === deletedWorkflow.name && req.status === "Pending") {
        req.status = "Cancelled";
        req.currentApprover = "-";
      }
    });

    workflows.splice(index, 1);

    return {
      success: true,
      message: 'Workflow deleted successfully',
    };
  },
    submitRequest(data) {
    const nextId = requests.length > 0 ? Math.max(...requests.map((r) => r.id)) + 1 : 101;
    const request = {
      id: nextId,
      workflow: data.workflow,
      title: data.title,
      requester: data.requester,
      status: 'Pending',
      submittedAt: new Date().toISOString().split('T')[0],
      currentApprover: 'Level 1 Approver',
    };

    requests.push(request);

    history.push({
      id: history.length > 0 ? Math.max(...history.map((h) => h.id)) + 1 : 1,
      requestId: request.id,
      action: 'Submitted',
      by: request.requester,
      time: new Date().toLocaleString(),
    });

    return {
      success: true,
      message: 'Request submitted successfully',
      request,
    };
  },

  approveRequest(id, approver = 'Admin') {
    const request = requests.find((r) => r.id == id);

    if (!request) {
      return {
        success: false,
        message: 'Request not found',
      };
    }

    request.status = 'Approved';
    request.currentApprover = '-';

    history.push({
      id: history.length + 1,
      requestId: request.id,
      action: 'Approved',
      by: approver,
      time: new Date().toLocaleString(),
    });

    return {
      success: true,
      message: 'Request approved successfully',
      request,
    };
  },

  rejectRequest(id, approver = 'Admin') {
    const request = requests.find((r) => r.id == id);

    if (!request) {
      return {
        success: false,
        message: 'Request not found',
      };
    }

    request.status = 'Rejected';
    request.currentApprover = '-';

    history.push({
      id: history.length + 1,
      requestId: request.id,
      action: 'Rejected',
      by: approver,
      time: new Date().toLocaleString(),
    });

    return {
      success: true,
      message: 'Request rejected successfully',
      request,
    };
  },

  bulkApprove(ids = []) {
    let approved = 0;

    ids.forEach((id) => {
      const request = requests.find((r) => r.id == id);

      if (request && request.status === 'Pending') {
        request.status = 'Approved';
        request.currentApprover = '-';
        approved++;

        history.push({
          id: history.length + 1,
          requestId: request.id,
          action: 'Bulk Approved',
          by: 'Admin',
          time: new Date().toLocaleString(),
        });
      }
    });

    return {
      success: true,
      approved,
      message: `${approved} request(s) approved successfully`,
    };
  },

  getPendingRequests() {
    const pending = requests.filter((request) => request.status === 'Pending');

    return {
      success: true,
      total: pending.length,
      requests: pending,
    };
  },
  getApprovalHistory() {
    return {
      success: true,
      total: history.length,
      history,
    };
  },

  getWorkflowTemplates() {
    return {
      success: true,
      templates: [
        {
          id: 1,
          name: 'Event Approval',
          levels: 3,
          category: 'Events',
        },
        {
          id: 2,
          name: 'Club Registration',
          levels: 2,
          category: 'Clubs',
        },
        {
          id: 3,
          name: 'Portfolio Verification',
          levels: 2,
          category: 'Portfolio',
        },
        {
          id: 4,
          name: 'Announcement Publishing',
          levels: 2,
          category: 'Announcements',
        },
        {
          id: 5,
          name: 'Resource Request',
          levels: 3,
          category: 'Resources',
        },
      ],
    };
  },

  getWorkflowAnalytics() {
    const approved = requests.filter((r) => r.status === 'Approved').length;

    const rejected = requests.filter((r) => r.status === 'Rejected').length;

    const pending = requests.filter((r) => r.status === 'Pending').length;

    return {
      success: true,
      analytics: {
        totalRequests: requests.length,
        approved,
        rejected,
        pending,
        averageTurnaround: '1.8 Days',
        approvalRate: `${((approved / (requests.length || 1)) * 100).toFixed(1)}%`,
      },
    };
  },

  escalatePendingRequests() {
    const escalated = requests
      .filter((r) => r.status === 'Pending')
      .map((request) => ({
        ...request,
        escalated: true,
        escalationLevel: 'Admin',
      }));

    return {
      success: true,
      message: `${escalated.length} pending request(s) escalated`,
      requests: escalated,
    };
  },

  getAuditLogs() {
    return {
      success: true,
      logs: [
        {
          id: 1,
          action: 'Workflow Created',
          user: 'Admin',
          module: 'Workflow',
          timestamp: '2026-07-08 10:00 AM',
        },
        {
          id: 2,
          action: 'Request Submitted',
          user: 'John Doe',
          module: 'Events',
          timestamp: '2026-07-08 11:15 AM',
        },
        {
          id: 3,
          action: 'Request Approved',
          user: 'Faculty Mentor',
          module: 'Approval',
          timestamp: '2026-07-08 12:05 PM',
        },
        {
          id: 4,
          action: 'Bulk Approval',
          user: 'Super Admin',
          module: 'Administration',
          timestamp: '2026-07-08 01:30 PM',
        },
        {
          id: 5,
          action: 'Workflow Updated',
          user: 'Admin',
          module: 'Workflow',
          timestamp: '2026-07-08 02:10 PM',
        },
      ],
    };
  },
};
