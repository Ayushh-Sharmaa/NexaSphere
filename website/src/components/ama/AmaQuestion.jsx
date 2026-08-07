import { useState } from 'react';
import { ChevronUp, Reply } from 'lucide-react';
import { formatRelativeTime } from '../../utils/formatRelativeTime';

export function AmaQuestion({ question, mentorName }) {
  const [upvotes, setUpvotes] = useState(question.upvotes);
  const [upvoted, setUpvoted] = useState(false);

  const handleUpvote = () => {
    if (upvoted) {
      setUpvotes((prev) => prev - 1);
      setUpvoted(false);
    } else {
      setUpvotes((prev) => prev + 1);
      setUpvoted(true);
    }
  };

  return (
    <div className="ama-question-card">
      <div className="ama-vote-col">
        <button className={`ama-vote-btn ${upvoted ? 'upvoted' : ''}`} onClick={handleUpvote}>
          <ChevronUp size={28} />
          <span className="ama-vote-count">{upvotes}</span>
        </button>
      </div>

      <div className="ama-question-content">
        <div className="ama-question-header">
          <img src={question.author.avatar} alt={question.author.name} className="ama-q-avatar" />
          <span className="ama-q-author">{question.author.name}</span>
          <span className="ama-q-date">{formatRelativeTime(question.createdAt)}</span>
        </div>

        <p className="ama-q-text">{question.content}</p>

        {question.reply && (
          <div className="ama-reply">
            <div className="ama-reply-header">
              <Reply size={16} />
              <span>
                {mentorName} (Mentor) Replied {formatRelativeTime(question.reply.createdAt)}
              </span>
            </div>
            <p className="ama-reply-text">{question.reply.content}</p>
          </div>
        )}
      </div>
    </div>
  );
}
