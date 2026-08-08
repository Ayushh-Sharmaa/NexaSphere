const records = {
  events: [
    {
      id: 'E101',
      title: 'AI Workshop',
      organizer: 'Tech Club',
      date: '2026-08-10',
    },
    {
      id: 'E102',
      title: 'Artificial Intelligence Workshop',
      organizer: 'Tech Club',
      date: '2026-08-10',
    },
  ],

  portfolios: [
    {
      id: 'P101',
      title: 'Smart Irrigation System',
      owner: 'John',
    },
    {
      id: 'P102',
      title: 'Smart Irrigation',
      owner: 'John',
    },
  ],

  media: [
    {
      id: 'M101',
      filename: 'banner.png',
      size: 421000,
    },
    {
      id: 'M102',
      filename: 'banner_copy.png',
      size: 421500,
    },
  ],

  clubRegistrations: [
    {
      id: 'C101',
      user: 'Alice',
      club: 'Coding Club',
    },
    {
      id: 'C102',
      user: 'Alice',
      club: 'Coding Club',
    },
  ],
};

function similarity(a, b) {
  if (!a || !b) return 0;
  a = String(a).trim().toLowerCase().replace(/\s+/g, " ");
  b = String(b).trim().toLowerCase().replace(/\s+/g, " ");

  if (a === b) return 100;

  const wordsA = a.split(" ").filter(Boolean);
  const wordsB = b.split(" ").filter(Boolean);

  if (wordsA.length === 0 || wordsB.length === 0) return 0;

  let common = 0;

  wordsA.forEach((w) => {
    if (wordsB.includes(w)) common++;
  });

  return Math.round((common / Math.max(wordsA.length, wordsB.length)) * 100);
}

exports.getOverview = () => ({
  totalModules: 4,
  totalRecords:
    records.events.length +
    records.portfolios.length +
    records.media.length +
    records.clubRegistrations.length,

  duplicateEvents: exports.detectDuplicateEvents().length,
  duplicateMedia: exports.detectDuplicateMedia().length,
  duplicatePortfolios: exports.detectPortfolioDuplicates().length,
  duplicateRegistrations: exports.detectClubDuplicates().length,
});

exports.checkRecord = (record) => {
  const matches = [];

  records.events.forEach((item) => {
    const score = similarity(record.title, item.title);

    if (score >= 60) {
      matches.push({
        module: 'Events',
        id: item.id,
        similarity: score,
        title: item.title,
      });
    }
  });

  return {
    duplicateFound: matches.length > 0,
    matches,
  };
};

exports.detectDuplicateEvents = () => {
  const duplicates = [];

  for (let i = 0; i < records.events.length; i++) {
    for (let j = i + 1; j < records.events.length; j++) {
      const score = similarity(records.events[i].title, records.events[j].title);

      if (score >= 60) {
        duplicates.push({
          first: records.events[i],
          second: records.events[j],
          similarity: score,
        });
      }
    }
  }

  return duplicates;
};

exports.detectPortfolioDuplicates = () => {
  const duplicates = [];

  for (let i = 0; i < records.portfolios.length; i++) {
    for (let j = i + 1; j < records.portfolios.length; j++) {
      const score = similarity(records.portfolios[i].title, records.portfolios[j].title);

      if (score >= 60) {
        duplicates.push({
          first: records.portfolios[i],
          second: records.portfolios[j],
          similarity: score,
        });
      }
    }
  }

  return duplicates;
};

exports.detectDuplicateMedia = () => {
  return records.media.filter(
    (item, index) =>
      records.media.findIndex((m) => Math.abs(m.size - item.size) < 1000 && m.id !== item.id) !== -1
  );
};

exports.detectClubDuplicates = () => {
  return records.clubRegistrations.filter(
    (item, index) =>
      records.clubRegistrations.findIndex(
        (c) => c.user === item.user && c.club === item.club && c.id !== item.id
      ) !== -1
  );
};

exports.mergeDuplicates = (id1, id2) => ({
  success: true,
  mergedRecord: id1,
  removedRecord: id2,
  message: 'Duplicate records merged successfully.',
});

exports.deleteDuplicate = (id) => ({
  success: true,
  deleted: id,
});

exports.getStatistics = () => ({
  scannedRecords: 500,
  duplicateRecords: 18,
  preventedDuplicates: 7,
  mergeSuggestions: 14,
  resolvedDuplicates: 11,
  duplicatePercentage: '3.6%',
});
