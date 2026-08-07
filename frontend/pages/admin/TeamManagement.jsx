import React, { useState, useEffect } from 'react';
import { Tabs, Tab } from 'react-bootstrap';
import PendingApplications from '../../components/admin/PendingApplications';
import ApprovalTimeline from '../../components/admin/ApprovalTimeline';
import api from '../../api/applications';

const TeamManagement = () => {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    api.getPending().then(res => setPendingCount(res.data.length));
    .catch(err => console.error(err))