import React, { useState, useEffect } from 'react';
import { Table, Form, Row, Col } from 'react-bootstrap';
import api from '../../api/applications';

const ApprovalTimeline = () => {
  const [timeline, setTimeline] = useState([]);
  const [filters, setFilters] = useState({ startDate: '', endDate: '', role: '' });

  useEffect(() => {
    fetchTimeline();
  }, [filters]);

  const fetchTimeline = async () => {
    const res = await api.getTimeline(filters);
    setTimeline(res.data);
  };

  return (
    <>
      <Row className="mb-3">
        <Col md={4}>
          <Form.Label>Start Date</Form.Label>
          <Form.Control
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          />
        </Col>
        <Col md={4}>
          <Form.Label>End Date</Form.Label>
          <Form.Control
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          />
        </Col>
        <Col md={4}>
          <Form.Label>Role</Form.Label>
          <Form.Control
            as="select"
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
          >
            <option value="">All Roles</option>
            <option value="Core Team">Core Team</option>
            <option value="Contributor">Contributor</option>
            <option value="Maintainer">Maintainer</option>
          </Form.Control>
        </Col>
      </Row>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Applicant</th>
            <th>Role</th>
            <th>Approved By</th>
            <th>Date</th>
            <th>Feedback</th>
          </tr>
        </thead>
        <tbody>
          {timeline.map((item) => (
            <tr key={item._id}>
              <td>{item.userId.name}</td>
              <td>{item.role}</td>
              <td>{item.reviewedBy?.name || 'System'}</td>
              <td>{new Date(item.reviewedAt).toLocaleDateString()}</td>
              <td>{item.feedback || '-'}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
};

export default ApprovalTimeline;
