-- Event Co-Organizer Collaboration Hub Schema

-- Roles for Organizer Teams
CREATE TYPE organizer_role AS ENUM ('OWNER', 'ORGANIZER', 'LEAD', 'VIEWER');
CREATE TYPE task_status AS ENUM ('BACKLOG', 'ASSIGNED', 'IN_PROGRESS', 'DONE', 'BLOCKED');

-- 1. Organizer Teams Table
CREATE TABLE event_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL, -- References events table
    user_id UUID NOT NULL, -- References users table
    role organizer_role DEFAULT 'VIEWER',
    committee TEXT, -- e.g., 'Venue', 'Speakers'
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- 2. Task Management Table
CREATE TABLE collaboration_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    assigned_to UUID, -- user_id
    due_date TIMESTAMP WITH TIME ZONE,
    status task_status DEFAULT 'BACKLOG',
    dependency_id UUID REFERENCES collaboration_tasks(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Document Hub Table (Basic Versioning)
CREATE TABLE collaboration_docs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,
    name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    version INT DEFAULT 1,
    uploaded_by UUID NOT NULL,
    permissions organizer_role DEFAULT 'ORGANIZER', -- Minimum role to view
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Discussion Threads
CREATE TABLE collaboration_discussions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,
    topic TEXT NOT NULL, -- e.g., 'Catering'
    author_id UUID NOT NULL,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES collaboration_discussions(id), -- For threaded replies
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Budget & Expense Tracking
CREATE TABLE collaboration_budget (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,
    item_name TEXT NOT NULL,
    budgeted_amount DECIMAL(12, 2) NOT NULL,
    actual_amount DECIMAL(12, 2) DEFAULT 0.00,
    responsible_person UUID,
    status TEXT DEFAULT 'PENDING', -- PENDING, APPROVED, PAID
    receipt_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Decision Log
CREATE TABLE collaboration_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,
    decision TEXT NOT NULL,
    rationale TEXT,
    decided_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_event_teams_event ON event_teams(event_id);
CREATE INDEX idx_collab_tasks_event ON collaboration_tasks(event_id);
CREATE INDEX idx_collab_discussions_event ON collaboration_discussions(event_id);