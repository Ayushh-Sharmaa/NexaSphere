import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

const prisma = new PrismaClient();

export async function globalSearch(req, res) {
  try {
    const q = req.query.q;
    if (!q || q.length < 2) {
      return sendSuccess(res, { results: [] });
    }

    const [users, events, posts] = await Promise.all([
      prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: q } },
            { email: { contains: q } }
          ]
        },
        take: 5
      }),
      prisma.event.findMany({
        where: {
          title: { contains: q }
        },
        take: 5
      }),
      prisma.post.findMany({
        where: {
          title: { contains: q }
        },
        take: 5
      })
    ]);

    const results = [
      ...users.map(u => ({ id: u.id, type: 'user', title: u.name, subtitle: u.email })),
      ...events.map(e => ({ id: e.id, type: 'event', title: e.title, subtitle: new Date(e.startDate).toLocaleDateString() })),
      ...posts.map(p => ({ id: p.id, type: 'post', title: p.title, subtitle: 'Announcement' }))
    ];

    return sendSuccess(res, { results });
  } catch (error) {
    console.error('Search error:', error);
    return sendError(res, 500, 'Search failed');
  }
}
