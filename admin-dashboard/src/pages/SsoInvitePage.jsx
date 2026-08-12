import { useState } from "react";
import { api } from "../services/api";
import { eventEmitter, EVENTS } from "../services/eventEmitter";

export function SsoInvitePage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [inviteUrl, setInviteUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      eventEmitter.emit(EVENTS.NOTIFY, {
        type: "error",
        message: "Please enter a valid email address",
      });
      return;
    }
    setLoading(true);
    setInviteUrl("");
    setCopied(false);
    try {
      const response = await api.sso.generateInvite(email);
      if (response && response.inviteUrl) {
        setInviteUrl(response.inviteUrl);
        eventEmitter.emit(EVENTS.NOTIFY, {
          type: "success",
          message: "SSO Invite link generated successfully",
        });
      } else {
        throw new Error("Failed to generate invite URL");
      }
    } catch (err) {
      eventEmitter.emit(EVENTS.NOTIFY, {
        type: "error",
        message: err.message || "Error generating link",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    eventEmitter.emit(EVENTS.NOTIFY, {
      type: "success",
      message: "Link copied to clipboard!",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="page-container">
      <div className="header-container" style={{ marginBottom: "2rem" }}>
        <h2>SSO Invites & Bypasses</h2>
        <p className="section-desc">
          Generate secure single sign-on bypass tokens for alumni, guest
          speakers, and contributors who do not possess a standard institutional
          email address.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="sso-invite-email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >
              Guest Email Address
            </label>
            <input
              id="sso-invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. guest.speaker@gmail.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-150 ease-in-out disabled:opacity-50"
          >
            {loading ? "Generating Link..." : "Generate Invite Link"}
          </button>
        </form>

        {inviteUrl && (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-150 dark:border-gray-750">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              SSO Bypass Invite Link (Valid for 24 Hours)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={inviteUrl}
                className="flex-1 min-w-0 bg-white dark:bg-gray-800 border border-gray-350 dark:border-gray-650 px-3 py-1.5 rounded-lg text-sm dark:text-white"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Provide this unique URL directly to the user. When they log in via
              Google SSO using this link, they will bypass domain restrictions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
