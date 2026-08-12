import os

filepath = r'website/src/pages/projects/ProjectsPage.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update imports
content = content.replace(
    "import React, { useState, useEffect, useRef } from 'react';",
    "import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';"
)
content = content.replace(
    "import { Code, ExternalLink, X, Tag, Users } from 'lucide-react';",
    ""
)
content = content.replace(
    "import { ProjectCardSkeleton } from '../../components/ui/skeleton/ProjectCardSkeleton';",
    "import { ProjectCardSkeleton } from '../../components/ui/skeleton/ProjectCardSkeleton';\nimport ProjectCard from '../../components/projects/ProjectCard';\n\nconst ProjectDetailModal = lazy(() => import('../../components/projects/ProjectDetailModal'));"
)

# 2. Replace the inline motion.div for project card
import re
pattern_card = r'<motion\.div\s+layout.*?className="project-card".*?aria-label={View details for \$\{project\.title\}}.*?</motion\.div>'
content = re.sub(pattern_card, r'''<ProjectCard 
                  key={project.id} 
                  project={project} 
                  onClick={setSelectedProject} 
                  triggerRef={triggerRef} 
                />''', content, flags=re.DOTALL)

# 3. Replace the inline modal
pattern_modal = r'<motion\.div\s+initial={{ opacity: 0, y: 50, scale: 0\.95 }}.*?className="modal-box project-modal".*?</motion\.div>'
content = re.sub(pattern_modal, r'''<Suspense fallback={<div className="modal-box project-modal" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>Loading...</div>}>
                  <ProjectDetailModal selectedProject={selectedProject} onClose={() => setSelectedProject(null)} />
                </Suspense>''', content, flags=re.DOTALL)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
