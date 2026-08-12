import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { websocketLogs } from '../services/websocketLogs';
import { AdminIcon } from '../components/AdminIcon';

export function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const [filters, setFilters] = useState({
    severity: 'All',
    actionType: '',
    userId: ''
  });
  const logsEndRef = useRef(null);

  const BUFFER_LIMIT = 500;

  useEffect(() => {
    const handleNewLog = (newLog) => {
      setLogs((prevLogs) => {
        // Assign a unique ID if not present
        const logEntry = { ...newLog, _id: newLog._id || Date.now() + Math.random() };
        const updatedLogs = [...prevLogs, logEntry];
        if (updatedLogs.length > BUFFER_LIMIT) {
          return updatedLogs.slice(updatedLogs.length - BUFFER_LIMIT);
        }
        return updatedLogs;
      });
    };

    const unsubscribe = websocketLogs.subscribe(handleNewLog);
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isAutoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isAutoScroll]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchSeverity = filters.severity === 'All' || (log.severity && log.severity.toLowerCase() === filters.severity.toLowerCase());
      const matchAction = !filters.actionType || (log.actionType && log.actionType.toLowerCase().includes(filters.actionType.toLowerCase()));
      const matchUserId = !filters.userId || (log.userId && log.userId.toString().toLowerCase().includes(filters.userId.toLowerCase()));
      return matchSeverity && matchAction && matchUserId;
    });
  }, [logs, filters]);

  const exportCSV = useCallback(() => {
    if (filteredLogs.length === 0) return;
    const headers = ['Timestamp', 'Severity', 'Action Type', 'User ID', 'Message'];
    const csvRows = [
      headers.join(','),
      ...filteredLogs.map(log => {
        const timestamp = new Date(log.timestamp || Date.now()).toISOString();
        const severity = log.severity || 'Info';
        const action = log.actionType || 'Unknown';
        const user = log.userId || 'System';
        const message = `"${(log.message || '').replace(/"/g, '""')}"`;
        return `${timestamp},${severity},${action},${user},${message}`;
      })
    ];
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity_logs_${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredLogs]);

  const exportJSON = useCallback(() => {
    if (filteredLogs.length === 0) return;
    const jsonString = JSON.stringify(filteredLogs, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity_logs_${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredLogs]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Real-Time Activity Logs</h1>
        <div className="flex gap-4">
          <button onClick={exportCSV} className="btn-secondary flex items-center gap-2">
            <AdminIcon name="Download" size={16} /> Export CSV
          </button>
          <button onClick={exportJSON} className="btn-secondary flex items-center gap-2">
            <AdminIcon name="Download" size={16} /> Export JSON
          </button>
        </div>
      </div>

      <div className="card mb-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Severity</label>
            <select
              name="severity"
              value={filters.severity}
              onChange={handleFilterChange}
              className="form-input w-full"
            >
              <option value="All">All</option>
              <option value="Info">Info</option>
              <option value="Warning">Warning</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Action Type</label>
            <input
              type="text"
              name="actionType"
              value={filters.actionType}
              onChange={handleFilterChange}
              placeholder="e.g. LOGIN, UPDATE_CONFIG"
              className="form-input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">User ID</label>
            <input
              type="text"
              name="userId"
              value={filters.userId}
              onChange={handleFilterChange}
              placeholder="User ID or Email"
              className="form-input w-full"
            />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <input
            type="checkbox"
            id="autoScroll"
            checked={isAutoScroll}
            onChange={(e) => setIsAutoScroll(e.target.checked)}
            className="rounded text-primary"
          />
          <label htmlFor="autoScroll" className="text-sm">Auto-scroll to latest</label>
        </div>
      </div>

      <div className="card overflow-hidden" style={{ height: '500px', display: 'flex', flexDirection: 'column' }}>
        <div className="overflow-auto flex-1 p-0">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
              <tr>
                <th className="p-3 border-b">Timestamp</th>
                <th className="p-3 border-b">Severity</th>
                <th className="p-3 border-b">Action</th>
                <th className="p-3 border-b">User</th>
                <th className="p-3 border-b">Message</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-4 text-center text-gray-500">
                    No logs available.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log._id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="p-3 whitespace-nowrap text-sm">
                      {new Date(log.timestamp || Date.now()).toLocaleTimeString()}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        log.severity === 'Critical' ? 'bg-red-100 text-red-800' :
                        log.severity === 'Warning' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {log.severity || 'Info'}
                      </span>
                    </td>
                    <td className="p-3 text-sm">{log.actionType || 'Unknown'}</td>
                    <td className="p-3 text-sm">{log.userId || 'System'}</td>
                    <td className="p-3 text-sm font-mono">{log.message}</td>
                  </tr>
                ))
              )}
              <tr ref={logsEndRef} />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
