import React, { useState, useEffect } from 'react';
import { Card, Button, Modal, Form } from 'react-bootstrap';
import api from '../../api/applications';

const PendingApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [action, setAction] = useState('');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    const res = await api.getPending();
    setApplications(res.data);
    setLoading(false);
  };

  const handleReview = (app, actionType) => {
    setSelectedApp(app);
    setAction(actionType);
    setShowModal(true);
  };

  const submitReview = async () => {
    const endpoint = action === 'approve' ? 'approve' : 'reject';
    await api[endpoint](selectedApp._id, { feedback });
    setShowModal(false);
    setFeedback('');
    fetchApplications();
  };

  if (loading) return <p>Loading...</p>;

  return (
    <>
      {applications.length === 0 ? (
        <p>No pending applications</p>
      ) : (
        applications.map((app) => (
          <Card key={app._id} className="mb-3">
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div>
                  <h5>{app.userId.name}</h5>
                  <p className="text-muted">{app.userId.email}</p>
                  <p>
                    Role: <strong>{app.role}</strong>
                  </p>
                  <p>Applied: {new Date(app.appliedAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <Button
                    variant="success"
                    className="me-2"
                    onClick={() => handleReview(app, 'approve')}
                  >
                    Approve
                  </Button>
                  <Button variant="danger" onClick={() => handleReview(app, 'reject')}>
                    Reject
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        ))
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{action === 'approve' ? 'Approve' : 'Reject'} Application</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Feedback (optional for approval, required for rejection)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Add your feedback..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button
            variant={action === 'approve' ? 'success' : 'danger'}
            onClick={submitReview}
            disabled={action === 'reject' && !feedback}
          >
            Confirm {action === 'approve' ? 'Approval' : 'Rejection'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default PendingApplications;
