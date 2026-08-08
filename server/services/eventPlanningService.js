import { eventsRepository } from '../repositories/eventsRepository.js';
import { readContent } from '../storage/contentFileStore.js';

const plans = new Map();

const isDbConfigured = () => Boolean(process.env.DATABASE_URL);

async function validateEventExists(eventId) {
  if (isDbConfigured()) {
    const event = await eventsRepository.getById(eventId);
    return event !== null;
  } else {
    try {
      const content = await readContent();
      return (content.events || []).some((e) => String(e.id) === String(eventId));
    } catch (err) {
      return false;
    }
  }
}

function getPlan(eventId) {
  if (!plans.has(eventId)) {
    plans.set(eventId, {
      tasks: new Map(),
      comments: new Map(),
      templates: [],
      budget: { total: 0, categories: {}, expenses: [] },
      activityLog: [],
    });
  }
  return plans.get(eventId);
}

function log(plan, action, user, details) {
  plan.activityLog.push({
    id: Date.now().toString(),
    action,
    user,
    details,
    timestamp: new Date().toISOString(),
  });
}

export const eventPlanningService = {
  getPlan(eventId) {
    const plan = getPlan(eventId);
    return {
      tasks: Array.from(plan.tasks.values()),
      comments: Array.from(plan.comments.entries()).map(([taskId, cmts]) => ({
        taskId,
        comments: cmts,
      })),
      templates: plan.templates,
      budget: plan.budget,
      activityLog: plan.activityLog.slice(-50),
    };
  },

  async createTask(eventId, task, user) {
    const exists = await validateEventExists(eventId);
    if (!exists) {
      throw new Error('Event not found.');
    }
    const plan = getPlan(eventId);
    const taskIds = Array.from(plan.tasks.values()).map(t => {
      const match = String(t.id).match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    });
    const nextNum = taskIds.length > 0 ? Math.max(...taskIds) + 1 : 1;
    const taskId = `task-${nextNum}`;
    const newTask = {
      id: taskId,
      ...task,
      status: task.status || 'not_started',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    plan.tasks.set(taskId, newTask);
    plan.comments.set(taskId, []);
    log(plan, 'task:created', user, `Created task "${task.title}"`);
    return newTask;
  },

  updateTask(eventId, taskId, updates, user) {
    const plan = getPlan(eventId);
    const task = plan.tasks.get(taskId);
    if (!task) return null;
    Object.assign(task, updates, { updatedAt: new Date().toISOString() });
    log(plan, 'task:updated', user, `Updated task "${task.title}"`);
    return task;
  },

  deleteTask(eventId, taskId, user) {
    const plan = getPlan(eventId);
    const task = plan.tasks.get(taskId);
    if (!task) return false;
    plan.tasks.delete(taskId);
    plan.comments.delete(taskId);
    log(plan, 'task:deleted', user, `Deleted task "${task.title}"`);
    return true;
  },

  addComment(eventId, taskId, comment, user) {
    const plan = getPlan(eventId);
    if (!plan.tasks.has(taskId)) return null;
    if (!plan.comments.has(taskId)) plan.comments.set(taskId, []);
    const c = {
      id: `cmt-${Date.now()}`,
      taskId,
      ...comment,
      author: user,
      createdAt: new Date().toISOString(),
    };
    plan.comments.get(taskId).push(c);
    const task = plan.tasks.get(taskId);
    log(plan, 'comment:added', user, `Commented on task "${task.title}"`);
    return c;
  },

  // Checklist templates
  createTemplate(eventId, template) {
    const plan = getPlan(eventId);
    const t = { id: `tmpl-${Date.now()}`, ...template };
    plan.templates.push(t);
    return t;
  },

  getTemplates(eventId) {
    return getPlan(eventId).templates;
  },

  // Budget
  addExpense(eventId, expense, user) {
    const plan = getPlan(eventId);
    const e = { id: `exp-${Date.now()}`, ...expense, createdAt: new Date().toISOString() };
    plan.budget.expenses.push(e);
    log(plan, 'expense:added', user, `Added expense: $${expense.amount}`);
    return e;
  },

  updateBudget(eventId, budget) {
    const plan = getPlan(eventId);
    if (budget.total !== undefined) plan.budget.total = budget.total;
    if (budget.categories) plan.budget.categories = budget.categories;
    return plan.budget;
  },

  // Templates seeding
  seedDefaultTemplates(eventId) {
    const plan = getPlan(eventId);
    if (plan.templates.length > 0) return;
    const defaults = [
      {
        name: 'Venue & Logistics',
        items: ['Book venue', 'Arrange seating', 'Set up AV equipment', 'Arrange parking'],
      },
      {
        name: 'Marketing & Promotion',
        items: [
          'Design poster',
          'Create social media posts',
          'Send email invites',
          'Print banners',
        ],
      },
      {
        name: 'Catering',
        items: ['Order food', 'Arrange beverages', 'Dietary requirements check'],
      },
    ];
    defaults.forEach((t) =>
      plan.templates.push({
        id: `tmpl-${Date.now()}-${crypto.randomUUID().split('-')[0]}`,
        ...t,
      })
    );
  },
};
