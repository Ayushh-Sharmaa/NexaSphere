import os
import json
import logging
import pandas as pd
from sqlalchemy import create_engine, text
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

# Fixture data for local development only.
# Enabled exclusively via ALLOW_RECOMMENDATION_FIXTURES=1|true|yes.
MOCK_EVENTS = [
    {"id": "evt_1", "name": "AI Hackathon", "tags": ["AI", "machine learning", "hackathon"], "date": "2026-07-01T10:00:00Z", "registered_count": 80, "status": "upcoming"},
    {"id": "evt_2", "name": "Web Dev Bootcamp", "tags": ["web", "react", "javascript"], "date": "2026-06-20T09:00:00Z", "registered_count": 120, "status": "upcoming"},
    {"id": "evt_3", "name": "Cybersecurity Workshop", "tags": ["security", "networking", "workshop"], "date": "2026-08-15T14:00:00Z", "registered_count": 50, "status": "upcoming"},
    {"id": "evt_4", "name": "Robotics Fest", "tags": ["robotics", "hardware", "iot"], "date": "2026-07-10T11:00:00Z", "registered_count": 60, "status": "upcoming"},
    {"id": "evt_5", "name": "Data Science Summit", "tags": ["data", "AI", "python", "analytics"], "date": "2026-09-01T09:00:00Z", "registered_count": 150, "status": "upcoming"},
    {"id": "evt_6", "name": "UI/UX Design Masterclass", "tags": ["design", "figma", "uiux"], "date": "2026-06-25T13:00:00Z", "registered_count": 90, "status": "upcoming"}
]

MOCK_USERS = [
    {"id": "user_1", "interests": ["AI", "python", "machine learning", "data"], "followed_users": ["user_3"]},
    {"id": "user_2", "interests": ["web", "design", "figma"], "followed_users": ["user_1"]},
    {"id": "user_3", "interests": ["AI", "python", "robotics"], "followed_users": ["user_2"]},
    {"id": "101", "interests": ["web", "react"], "followed_users": []}
]

MOCK_PARTICIPATIONS = [
    {"user_id": "user_3", "event_id": "evt_1"},
    {"user_id": "user_3", "event_id": "evt_4"},
    {"user_id": "user_2", "event_id": "evt_6"}
]


def fixtures_allowed() -> bool:
    return os.getenv("ALLOW_RECOMMENDATION_FIXTURES", "").strip().lower() in (
        "1",
        "true",
        "yes",
    )


# Helper functions for scoring components
# These could be moved to a separate utility file if they grow
def get_db_engine():
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        return None
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    
    try:
        return create_engine(db_url)
    except Exception as e:
        logger.error(f"Error creating database engine: {e}")
        return None

def fetch_data_with_sqlalchemy(user_id):
    engine = get_db_engine()
    
    events, all_users, participations = [], [], []
    
    if engine:
        try:
            # Note: Assumes 'events' table has 'date' (timestamp/datetime) and 'registered_count' (integer) columns.
            # Assumes 'profiles' table has 'followed_users' (JSONB array of user IDs) column.
            # If these columns don't exist, a schema migration would be needed.
            with engine.connect() as conn:
                # 1. Fetch Events
                events_result = conn.execute(text("SELECT id, name, tags, date, registered_count FROM events WHERE status != 'completed'"))
                events = [{"id": row.id, "name": row.name, "tags": row.tags, "date": row.date, "registered_count": row.registered_count} for row in events_result]
                
                # 2. Fetch all User Profiles
                users_result = conn.execute(text("SELECT id, interests, followed_users FROM profiles"))
                for row in users_result:
                    user_interests = row.interests
                    if isinstance(user_interests, str):
                        try:
                            user_interests = json.loads(user_interests)
                        except json.JSONDecodeError:
                            user_interests = [user_interests] # Fallback if not valid JSON
                    
                    followed_users = row.followed_users
                    if isinstance(followed_users, str):
                        try:
                            followed_users = json.loads(followed_users)
                        except json.JSONDecodeError:
                            followed_users = [] # Default to empty list if parsing fails

                    all_users.append({"id": str(row.id), "interests": user_interests, "followed_users": followed_users})
                
                # 3. Fetch Event Participations
                parts_result = conn.execute(text("SELECT user_id, event_id FROM event_participants"))
                participations = [{"user_id": str(row.user_id), "event_id": str(row.event_id)} for row in parts_result]
                
                if events and all_users:
                    return events, all_users, participations
                else:
                    logger.warning("No events or users found in DB.")
        except Exception as e:
            logger.warning(f"Database fetch failed. Error: {e}")

    if fixtures_allowed():
        logger.info("ALLOW_RECOMMENDATION_FIXTURES enabled — using development fixture data.")
        return MOCK_EVENTS, MOCK_USERS, MOCK_PARTICIPATIONS

    logger.warning("Recommendation source unavailable; returning empty dataset.")
    return [], [], []

def calculate_popularity_score(event, max_registered_count):
    if not max_registered_count or max_registered_count == 0:
        return 0.0
    return event.get('registered_count', 0) / max_registered_count

def calculate_recency_score(event):
    event_date_str = event.get('date')
    if not event_date_str:
        return 0.0 # Cannot calculate recency without a date

    try:
        event_date = pd.to_datetime(event_date_str, utc=True)
        now = pd.to_datetime('now', utc=True)
        time_diff_days = (event_date - now).total_seconds() / (60 * 60 * 24)

        if time_diff_days < 0: return 0.0 # Past event
        if time_diff_days <= 7: return 1.0 # Within a week
        if time_diff_days <= 30: return 0.7 # Within a month
        if time_diff_days <= 90: return 0.3 # Within 3 months
        return 0.1 # Far future events
    except Exception as e:
        logger.warning(f"Error calculating recency for event {event.get('id')}: {e}")
        return 0.0

def calculate_social_influence_score(event, target_user_followed_users, participations):
    score = 0.0
    if not target_user_followed_users:
        return 0.0

    for followed_user_id in target_user_followed_users:
        if any(p['user_id'] == followed_user_id and p['event_id'] == event['id'] for p in participations):
            score += 0.5 # Simple boost if a followed user attended
    return min(score, 1.0) # Cap at 1.0

def get_recommendations(user_id, num_recommendations=5):
    """
    Hybrid Recommendation:
    1. Content-Based: Cosine similarity between target user interests and event tags.
    2. Collaborative Filtering: Similarity between users to find events joined by similar users.
    """
    events, all_users, participations = fetch_data_with_sqlalchemy(user_id)
    
    if not events:
        return []
        
    events_df = pd.DataFrame(events)
    events_df['tags_str'] = events_df['tags'].apply(lambda x: " ".join(x) if isinstance(x, list) else str(x))
    
    # Find target user
    target_user = next((u for u in all_users if u["id"] == user_id), None)
    if not target_user:
        # Default fallback interests and no followed users for new/unknown user
        target_user = {"id": user_id, "interests": ["AI", "hackathon"], "followed_users": []}
        all_users.append(target_user)
        
    target_interest_str = " ".join(target_user["interests"])
    
    # Determine user history length for dynamic weighting (cold start)
    user_participations_count = sum(1 for p in participations if p['user_id'] == user_id)
    
    # Dynamic weighting: more content-based for cold start, more collaborative as history grows
    content_base_weight = 0.7
    collab_base_weight = 0.3
    if user_participations_count < 3: # Cold start threshold
        content_base_weight = 0.9
        collab_base_weight = 0.1
    elif user_participations_count > 10: # Established user
        content_base_weight = 0.5
        collab_base_weight = 0.5

    # ---------------- 1. Content-Based Filtering ----------------
    try:
        content_matrix = vectorizer.fit_transform(all_content_text)
        user_content_vector = content_matrix[0]
        events_content_matrix = content_matrix[1:]
        content_similarities = cosine_similarity(user_content_vector, events_content_matrix).flatten()
    except ValueError:
        content_similarities = [0] * len(events_df)
        
    events_df['content_score'] = content_similarities
    
    # ---------------- 2. Collaborative Filtering ----------------
    collab_scores = [0.0] * len(events_df)
    
    # We only compute collaborative if we have multiple users and some history for the target user
    if len(all_users) > 1 and user_participations_count > 0:
        users_df = pd.DataFrame(all_users)
        users_df['interests_str'] = users_df['interests'].apply(lambda x: " ".join(x) if isinstance(x, list) else str(x))
        
        target_idx_list = users_df.index[users_df['id'] == user_id].tolist()
        if target_idx_list: # Ensure target user is in the dataframe
            try:
                user_matrix = vectorizer.fit_transform(users_df['interests_str'].tolist())
                target_user_vector = user_matrix[target_idx]
                user_similarities = cosine_similarity(target_user_vector, user_matrix).flatten()
            
                # Add similarity back
                users_df['similarity'] = user_similarities
            
                # Find similar users (excluding the target user itself)
                similar_users = users_df[users_df['id'] != user_id].sort_values(by='similarity', ascending=False)
            
                # Top 3 similar users who have similarity > 0
                top_similar_users = similar_users[similar_users['similarity'] > 0.1].head(3)
            
                # Gather events those similar users have joined
                for _, sim_user in top_similar_users.iterrows():
                    sim_user_id = sim_user['id']
                    sim_score = sim_user['similarity']
                    
                    joined_events = [p["event_id"] for p in participations if p["user_id"] == sim_user_id]
                    
                    # Apply boost to those events proportional to the user similarity
                    for i, event in events_df.iterrows():
                        if event['id'] in joined_events:
                            # Add a collaborative boost (adjustable weight)
                            collab_scores[i] += sim_score * 0.5 

            except ValueError:
                pass # Ignore if vocabulary error
            
    events_df['collab_score'] = collab_scores
    
    # ---------------- Combine & Finalize ----------------
    # Final Score = Weighted Content Score + Weighted Collaborative Score
    # For example, 70% weight for content-based, 30% for collaborative
    events_df['final_score'] = (events_df['content_score'] * 0.7) + (events_df['collab_score'] * 0.3)
    
    recommended_events = events_df.sort_values(by='final_score', ascending=False).head(num_recommendations)
    
    # Build clean output
    result = recommended_events[['id', 'name', 'tags', 'final_score', 'content_score', 'collab_score']].to_dict(orient="records")
    return result

# Expose function with the name expected by router
def compute_hybrid_recommendations(user_id, num_recommendations=5):
    return get_recommendations(user_id, num_recommendations)
