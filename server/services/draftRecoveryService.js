const drafts = [];

class DraftRecoveryService {
  createDraft(userId, module, title, content) {
    const draft = {
      id: Date.now().toString(),
      userId,
      module,
      title,
      content,
      autoSaved: true,
      offline: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      versions: [
        {
          version: 1,
          content,
          savedAt: new Date(),
        },
      ],
    };

    drafts.push(draft);

    return draft;
  }

  getDraft(id) {
    return drafts.find((draft) => draft.id === id);
  }

  listDrafts(userId) {
    return drafts.filter((draft) => draft.userId === userId);
  }

  updateDraft(id, content) {
    const draft = this.getDraft(id);

    if (!draft) return null;

    draft.content = content;
    draft.updatedAt = new Date();

    const nextVersion = draft.versions.length > 0 ? Math.max(...draft.versions.map((v) => v.version)) + 1 : 1;
    draft.versions.push({
      version: nextVersion,
      content,
      savedAt: new Date(),
    });

    return draft;
  }

  deleteDraft(id) {
    const index = drafts.findIndex((draft) => draft.id === id);

    if (index === -1) return false;

    drafts.splice(index, 1);

    return true;
  }

  restoreDraft(id, versionNumber) {
    const draft = this.getDraft(id);

    if (!draft || !draft.versions.length) return null;

    let targetVersion;
    if (versionNumber !== undefined && versionNumber !== null) {
      targetVersion = draft.versions.find((v) => v.version === Number(versionNumber));
    } else {
      targetVersion = draft.versions[draft.versions.length - 1];
    }

    if (!targetVersion) return null;

    draft.content = targetVersion.content;
    draft.updatedAt = new Date();

    return draft;
  }

  versionHistory(id) {
    const draft = this.getDraft(id);

    return draft ? draft.versions : [];
  }

  syncDraft(id) {
    const draft = this.getDraft(id);

    if (!draft) return null;

    draft.offline = false;
    draft.updatedAt = new Date();

    return draft;
  }

  expireDrafts() {
    const now = new Date();

    for (let i = drafts.length - 1; i >= 0; i--) {
      if (drafts[i].expiresAt < now) {
        drafts.splice(i, 1);
      }
    }

    return true;
  }

  getStatistics() {
    return {
      totalDrafts: drafts.length,
      autoSaved: drafts.filter((d) => d.autoSaved).length,
      offlineDrafts: drafts.filter((d) => d.offline).length,
      activeUsers: [...new Set(drafts.map((d) => d.userId))].length,
    };
  }
}

module.exports = new DraftRecoveryService();
