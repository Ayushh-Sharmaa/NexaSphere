import { usersRepository } from "../repositories/usersRepository.js";
import notificationsService from "../services/notificationsService.js";

/**
 * Extracts @username mentions from text, looks up the corresponding users,
 * and sends them a notification.
 *
 * @param {string} text - The content containing potential mentions.
 * @param {string} senderId - The ID of the user who created the content.
 * @param {string} contextUrl - The URL link to attach to the notification.
 * @param {string} type - The notification type (e.g., 'mention', 'forum_mention', 'chat_mention').
 */
export async function parseMentionsAndNotify(
  text,
  senderId,
  contextUrl,
  type = "mention"
) {
  if (!text || typeof text !== "string") return;

  // Match @username (alphanumeric and underscores)
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;
  const matches = [...text.matchAll(mentionRegex)];

  if (matches.length === 0) return;

  // Extract unique usernames
  const uniqueUsernames = [...new Set(matches.map((m) => m[1]))];

  for (const username of uniqueUsernames) {
    try {
      const user = await usersRepository.getUserByUsername(username);

      // Do not notify if user doesn't exist or if they mentioned themselves
      if (user && user.id !== senderId) {
        await notificationsService.addNotification(user.id, {
          type,
          title: "You were mentioned",
          message: `Someone mentioned you: "${text.substring(0, 100)}${text.length > 100 ? "..." : ""}"`,
          link: contextUrl,
        });
      }
    } catch (err) {
      console.error(
        `[MentionParser] Error notifying user @${username}:`,
        err.message
      );
    }
  }
}
