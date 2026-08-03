import QRCode from 'qrcode';
import { portfolioRepository } from '../repositories/portfolioRepository.js';
import logger from '../utils/logger.js';

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const PDF_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{title}} - Portfolio</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Inter', sans-serif;
      background: #0a0a0a;
      color: #ffffff;
      line-height: 1.6;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
    }
    
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 30px;
      border-bottom: 1px solid #2a2a2a;
    }
    
    .avatar {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid #3b82f6;
      margin-bottom: 20px;
    }
    
    .name {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    
    .title {
      font-size: 18px;
      color: #9ca3af;
      margin-bottom: 16px;
    }
    
    .bio {
      font-size: 14px;
      color: #6b7280;
      max-width: 600px;
      margin: 0 auto 20px;
    }
    
    .social-links {
      display: flex;
      justify-content: center;
      gap: 16px;
      flex-wrap: wrap;
    }
    
    .social-link {
      color: #3b82f6;
      text-decoration: none;
      font-size: 14px;
    }
    
    .section {
      margin-bottom: 32px;
    }
    
    .section-title {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 16px;
      color: #3b82f6;
    }
    
    .skills-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 8px;
    }
    
    .skill-tag {
      background: #1a1a1a;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 13px;
      text-align: center;
      border: 1px solid #2a2a2a;
    }
    
    .project-card {
      background: #1a1a1a;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 16px;
      border: 1px solid #2a2a2a;
    }
    
    .project-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    
    .project-description {
      font-size: 14px;
      color: #9ca3af;
      margin-bottom: 12px;
    }
    
    .project-links {
      display: flex;
      gap: 12px;
    }
    
    .project-link {
      color: #3b82f6;
      text-decoration: none;
      font-size: 13px;
    }
    
    .experience-item {
      margin-bottom: 20px;
      padding-left: 16px;
      border-left: 2px solid #3b82f6;
    }
    
    .experience-title {
      font-size: 16px;
      font-weight: 600;
    }
    
    .experience-company {
      font-size: 14px;
      color: #3b82f6;
    }
    
    .experience-period {
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 8px;
    }
    
    .experience-description {
      font-size: 14px;
      color: #9ca3af;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #2a2a2a;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
    }
    
    .qr-code {
      margin-top: 16px;
    }
    
    .qr-code img {
      width: 80px;
      height: 80px;
    }
    
    @media print {
      body { background: white; color: black; }
      .container { padding: 20px; }
      .header { border-bottom-color: #e5e7eb; }
      .avatar { border-color: #2563eb; }
      .name { color: #111827; }
      .title { color: #6b7280; }
      .section-title { color: #2563eb; }
      .skill-tag { background: #f3f4f6; border-color: #e5e7eb; color: #374151; }
      .project-card { background: #f9fafb; border-color: #e5e7eb; }
      .project-title { color: #111827; }
      .project-description { color: #6b7280; }
      .experience-item { border-left-color: #2563eb; }
      .experience-title { color: #111827; }
      .experience-company { color: #2563eb; }
      .footer { border-top-color: #e5e7eb; color: #9ca3af; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header class="header">
      {{#if avatar_url}}<img src="{{avatar_url}}" alt="Avatar" class="avatar">{{/if}}
      <h1 class="name">{{name}}</h1>
      {{#if title}}<p class="title">{{title}}</p>{{/if}}
      {{#if bio}}<p class="bio">{{bio}}</p>{{/if}}
      {{#if social_links}}
      <div class="social-links">
        {{#each social_links}}
        <a href="{{this}}" class="social-link" target="_blank" rel="noopener noreferrer">{{@key}}</a>
        {{/each}}
      </div>
      {{/if}}
    </header>

    {{#if skills.length}}
    <section class="section">
      <h2 class="section-title">Skills</h2>
      <div class="skills-grid">
        {{#each skills}}
        <div class="skill-tag">{{this}}</div>
        {{/each}}
      </div>
    </section>
    {{/if}}

    {{#if projects.length}}
    <section class="section">
      <h2 class="section-title">Projects</h2>
      {{#each projects}}
      <div class="project-card">
        <h3 class="project-title">{{this.name}}</h3>
        {{#if this.description}}<p class="project-description">{{this.description}}</p>{{/if}}
        <div class="project-links">
          {{#if this.liveUrl}}<a href="{{this.liveUrl}}" class="project-link">Live Demo</a>{{/if}}
          {{#if this.githubUrl}}<a href="{{this.githubUrl}}" class="project-link">GitHub</a>{{/if}}
        </div>
      </div>
      {{/each}}
    </section>
    {{/if}}

    {{#if work_experience.length}}
    <section class="section">
      <h2 class="section-title">Work Experience</h2>
      {{#each work_experience}}
      <div class="experience-item">
        <h3 class="experience-title">{{this.title}}</h3>
        {{#if this.company}}<p class="experience-company">{{this.company}}</p>{{/if}}
        {{#if this.period}}<p class="experience-period">{{this.period}}</p>{{/if}}
        {{#if this.description}}<p class="experience-description">{{this.description}}</p>{{/if}}
      </div>
      {{/each}}
    </section>
    {{/if}}

    {{#if education.length}}
    <section class="section">
      <h2 class="section-title">Education</h2>
      {{#each education}}
      <div class="experience-item">
        <h3 class="experience-title">{{this.school}}</h3>
        {{#if this.degree}}<p class="experience-company">{{this.degree}}</p>{{/if}}
        {{#if this.year}}<p class="experience-period">{{this.year}}</p>{{/if}}
      </div>
      {{/each}}
    </section>
    {{/if}}

    <footer class="footer">
      <p>Generated by NexaSphere Portfolio</p>
      {{#if qrCode}}<div class="qr-code"><img src="{{qrCode}}" alt="QR Code"></div>{{/if}}
      <p>Portfolio URL: {{portfolioUrl}}</p>
    </footer>
  </div>
</body>
</html>`;

export const portfolioExportService = {
  async generateQRCode(url) {
    try {
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 160,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      });
      return qrDataUrl;
    } catch (error) {
      logger.error('Error generating QR code', { error: error.message });
      return null;
    }
  },

  async generatePDF(username, options = {}) {
    const portfolio = await portfolioRepository.getByUsername(username);
    if (!portfolio) throw new Error('Portfolio not found');

    const { pageSize = 'A4', includeContact = true, watermark = true } = options;

    const portfolioUrl = `${process.env.FRONTEND_URL || 'https://nexasphere.com'}/portfolio/${username}`;
    const qrCode = await this.generateQRCode(portfolioUrl);

    const templateData = {
      title: portfolio.title || portfolio.username || username,
      name: portfolio.title || username,
      avatar_url: portfolio.avatar_url || '',
      bio: portfolio.bio || '',
      title: portfolio.title || '',
      social_links: portfolio.social_links || {},
      skills: portfolio.skills || [],
      projects: portfolio.projects || [],
      work_experience: includeContact ? portfolio.work_experience || [] : [],
      education: portfolio.education || [],
      qrCode,
      portfolioUrl,
    };

    let html = PDF_TEMPLATE;
    for (const [key, value] of Object.entries(templateData)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, value || '');
    }

    html = html.replace(/{{#if (\w+)}}([\s\S]*?){{\/if}}/g, (match, key, content) => {
      return templateData[key] ? content : '';
    });

    html = html.replace(/{{#each (\w+)}}([\s\S]*?){{\/each}}/g, (match, key, content) => {
      const items = templateData[key];
      if (!Array.isArray(items) || items.length === 0) return '';
      return items
        .map((item) => {
          let itemHtml = content;
          if (typeof item === 'string') {
            itemHtml = itemHtml.replace(/\{\{this\}\}/g, item);
          } else {
            for (const [itemKey, itemValue] of Object.entries(item)) {
              const itemRegex = new RegExp(`{{this\\.${itemKey}}}`, 'g');
              itemHtml = itemHtml.replace(itemRegex, itemValue || '');
            }
          }
          return itemHtml;
        })
        .join('');
    });

    return {
      html,
      username,
      portfolioUrl,
      pageSize,
      watermark,
    };
  },

  async generateWebsite(username, options = {}) {
    const portfolio = await portfolioRepository.getByUsername(username);
    if (!portfolio) throw new Error('Portfolio not found');

    const { includeSEO = true, includeAnalytics = false, analyticsId = '' } = options;

    const portfolioUrl = `${process.env.FRONTEND_URL || 'https://nexasphere.com'}/portfolio/${username}`;

    const html = this.generateStaticHTML(portfolio, {
      includeSEO,
      includeAnalytics,
      analyticsId,
      portfolioUrl,
    });
    const css = this.generateStaticCSS();
    const assets = await this.collectAssets(portfolio);

    return {
      html,
      css,
      assets,
      username,
      portfolioUrl,
    };
  },

  generateStaticHTML(portfolio, options = {}) {
    const { includeSEO = true, includeAnalytics = false, analyticsId = '', portfolioUrl } = options;

    const seoTags = includeSEO
      ? `
    <meta name="description" content="${portfolio.bio || `${portfolio.title || portfolio.username}'s portfolio on NexaSphere`}">
    <meta property="og:title" content="${portfolio.title || portfolio.username} - Portfolio">
    <meta property="og:description" content="${portfolio.bio || 'Portfolio on NexaSphere'}">
    <meta property="og:url" content="${portfolioUrl}">
    <meta property="og:type" content="profile">
    ${portfolio.avatar_url ? `<meta property="og:image" content="${portfolio.avatar_url}">` : ''}
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="${portfolio.title || portfolio.username}">
    <meta name="twitter:description" content="${portfolio.bio || 'Portfolio on NexaSphere'}">
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Person",
      "name": "${portfolio.title || portfolio.username}",
      "url": "${portfolioUrl}"
      ${portfolio.bio ? `, "description": "${portfolio.bio}"` : ''}
    }
    </script>`
      : '';

    const analyticsTag =
      includeAnalytics && analyticsId
        ? `
    <script async src="https://www.googletagmanager.com/gtag/js?id=${analyticsId}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${analyticsId}');
    </script>`
        : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(portfolio.title || portfolio.username)} - Portfolio</title>
  ${seoTags}
  ${analyticsTag}
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <header class="header">
      ${portfolio.avatar_url ? `<img src="${escapeHtml(portfolio.avatar_url)}" alt="Avatar" class="avatar">` : ''}
      <h1 class="name">${escapeHtml(portfolio.title || portfolio.username)}</h1>
      ${portfolio.title ? `<p class="title">${escapeHtml(portfolio.title)}</p>` : ''}
      ${portfolio.bio ? `<p class="bio">${escapeHtml(portfolio.bio)}</p>` : ''}
      ${
        portfolio.social_links
          ? `
      <div class="social-links">
        ${Object.entries(portfolio.social_links)
          .map(([key, url]) => `<a href="${escapeHtml(url)}" class="social-link" target="_blank" rel="noopener noreferrer">${escapeHtml(key)}</a>`)
          .join('\n        ')}
      </div>`
          : ''
      }
    </header>

    ${
      portfolio.skills && portfolio.skills.length
        ? `
    <section class="section">
      <h2 class="section-title">Skills</h2>
      <div class="skills-grid">
        ${portfolio.skills.map((skill) => `<div class="skill-tag">${skill}</div>`).join('\n        ')}
      </div>
    </section>`
        : ''
    }

    ${
      portfolio.projects && portfolio.projects.length
        ? `
    <section class="section">
      <h2 class="section-title">Projects</h2>
      ${portfolio.projects
        .map(
          (project) => `
      <div class="project-card">
        <h3 class="project-title">${project.name}</h3>
        ${project.description ? `<p class="project-description">${project.description}</p>` : ''}
        <div class="project-links">
          ${project.liveUrl ? `<a href="${project.liveUrl}" class="project-link">Live Demo</a>` : ''}
          ${project.githubUrl ? `<a href="${project.githubUrl}" class="project-link">GitHub</a>` : ''}
        </div>
      </div>`
        )
        .join('')}
    </section>`
        : ''
    }

    ${
      portfolio.work_experience && portfolio.work_experience.length
        ? `
    <section class="section">
      <h2 class="section-title">Work Experience</h2>
      ${portfolio.work_experience
        .map(
          (exp) => `
      <div class="experience-item">
        <h3 class="experience-title">${exp.title}</h3>
        ${exp.company ? `<p class="experience-company">${exp.company}</p>` : ''}
        ${exp.period ? `<p class="experience-period">${exp.period}</p>` : ''}
        ${exp.description ? `<p class="experience-description">${exp.description}</p>` : ''}
      </div>`
        )
        .join('')}
    </section>`
        : ''
    }

    ${
      portfolio.education && portfolio.education.length
        ? `
    <section class="section">
      <h2 class="section-title">Education</h2>
      ${portfolio.education
        .map(
          (edu) => `
      <div class="experience-item">
        <h3 class="experience-title">${edu.school}</h3>
        ${edu.degree ? `<p class="experience-company">${edu.degree}</p>` : ''}
        ${edu.year ? `<p class="experience-period">${edu.year}</p>` : ''}
      </div>`
        )
        .join('')}
    </section>`
        : ''
    }

    <footer class="footer">
      <p>Generated by NexaSphere Portfolio</p>
      <p><a href="${portfolioUrl}">View Online Portfolio</a></p>
    </footer>
  </div>
</body>
</html>`;
  },

  generateStaticCSS() {
    return `* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #0a0a0a;
  color: #ffffff;
  line-height: 1.6;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
}

.header {
  text-align: center;
  margin-bottom: 40px;
  padding-bottom: 30px;
  border-bottom: 1px solid #2a2a2a;
}

.avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #3b82f6;
  margin-bottom: 20px;
}

.name {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 8px;
}

.title {
  font-size: 18px;
  color: #9ca3af;
  margin-bottom: 16px;
}

.bio {
  font-size: 14px;
  color: #6b7280;
  max-width: 600px;
  margin: 0 auto 20px;
}

.social-links {
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

.social-link {
  color: #3b82f6;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.2s;
}

.social-link:hover {
  color: #60a5fa;
}

.section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #3b82f6;
}

.skills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
}

.skill-tag {
  background: #1a1a1a;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  text-align: center;
  border: 1px solid #2a2a2a;
}

.project-card {
  background: #1a1a1a;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  border: 1px solid #2a2a2a;
  transition: border-color 0.2s;
}

.project-card:hover {
  border-color: #3b82f6;
}

.project-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
}

.project-description {
  font-size: 14px;
  color: #9ca3af;
  margin-bottom: 12px;
}

.project-links {
  display: flex;
  gap: 12px;
}

.project-link {
  color: #3b82f6;
  text-decoration: none;
  font-size: 13px;
}

.project-link:hover {
  text-decoration: underline;
}

.experience-item {
  margin-bottom: 20px;
  padding-left: 16px;
  border-left: 2px solid #3b82f6;
}

.experience-title {
  font-size: 16px;
  font-weight: 600;
}

.experience-company {
  font-size: 14px;
  color: #3b82f6;
}

.experience-period {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
}

.experience-description {
  font-size: 14px;
  color: #9ca3af;
}

.footer {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #2a2a2a;
  text-align: center;
  font-size: 12px;
  color: #6b7280;
}

.footer a {
  color: #3b82f6;
  text-decoration: none;
}

.footer a:hover {
  text-decoration: underline;
}

@media (max-width: 640px) {
  .container {
    padding: 20px 16px;
  }
  
  .name {
    font-size: 24px;
  }
  
  .skills-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}`;
  },

  async collectAssets(portfolio) {
    const assets = [];
    if (portfolio.avatar_url) {
      assets.push({ type: 'image', url: portfolio.avatar_url, filename: 'avatar' });
    }
    return assets;
  },
};
