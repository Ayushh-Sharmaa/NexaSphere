import os
import re

filepath = r'website/src/pages/projects/ProjectsPage.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the inline motion.div block with <ProjectCard ... />
pattern_card = r'<motion\.div\s+layout\s+initial={{ opacity: 0, scale: 0\.9 }}.*?aria-label={View details for \$\{project\.title\}}\s*>\s*<div className="project-card-image">.*?</div>\s*</motion\.div>'

content = re.sub(pattern_card, r'''<ProjectCard 
                  key={project.id} 
                  project={project} 
                  onClick={setSelectedProject} 
                  triggerRef={triggerRef} 
                />''', content, flags=re.DOTALL)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
