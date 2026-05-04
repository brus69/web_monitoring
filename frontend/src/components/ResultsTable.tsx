import React, { useState } from 'react';
import { PageState, ChangeRecord } from '../types';

interface ResultsTableProps {
  pages: PageState[];
}

const ResultsTable: React.FC<ResultsTableProps> = ({ pages }) => {
  const [page, setPage] = useState(1);
  const [expandedUrl, setExpandedUrl] = useState<string | null>(null);
  const perPage = 100;
  const totalPages = Math.ceil(pages.length / perPage);
  const start = (page - 1) * perPage;
  const end = Math.min(start + perPage, pages.length);
  const currentPages = pages.slice(start, end);

  const toggleExpand = (url: string) => {
    setExpandedUrl(expandedUrl === url ? null : url);
  };

  const getFieldLabel = (field: string) => {
    switch(field) {
      case 'title': return 'Title';
      case 'description': return 'Description';
      case 'text': return 'Content';
      default: return field;
    }
  };

  const getFieldColor = (field: string) => {
    switch(field) {
      case 'title': return { bg: '#e3f2fd', color: '#1565c0' }; // blue
      case 'description': return { bg: '#fff3e0', color: '#e65100' }; // orange
      case 'text': return { bg: '#f3e5f5', color: '#7b1fa2' }; // purple
      default: return { bg: '#f5f5f5', color: '#333' };
    }
  };

  return (
    <div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>URL</th>
            <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Status</th>
            <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Title</th>
            <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Last Checked</th>
            <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Changes</th>
          </tr>
        </thead>
        <tbody>
          {currentPages.map((p, i) => (
            <>
              <tr
                key={i}
                onClick={() => p.changes && p.changes.length > 0 ? toggleExpand(p.url) : null}
                style={{ cursor: p.changes && p.changes.length > 0 ? 'pointer' : 'default' }}
              >
                <td style={{ border: '1px solid #ddd', padding: 8 }}>{p.url}</td>
                <td style={{ border: '1px solid #ddd', padding: 8 }}>
                  <span style={{
                    color: p.status === 'changed' ? 'red' : p.status === 'new' ? 'green' : 'gray'
                  }}>
                    {p.status}
                  </span>
                </td>
                <td style={{ border: '1px solid #ddd', padding: 8 }}>{p.title || '-'}</td>
                <td style={{ border: '1px solid #ddd', padding: 8 }}>{p.last_checked || '-'}</td>
                <td style={{ border: '1px solid #ddd', padding: 8 }}>
                  {p.changes ? p.changes.length : 0}
                </td>
              </tr>
              {expandedUrl === p.url && p.changes && (
                <tr>
                  <td colSpan={5} style={{ border: '1px solid #ddd', padding: 8, background: '#fafafa' }}>
                    <h4>Change History</h4>
                    {p.changes.map((change: ChangeRecord, idx: number) => {
                      const colors = getFieldColor(change.field);
                      return (
                        <div key={idx} style={{ marginBottom: 15, padding: 10, border: '1px solid #eee', borderRadius: 4 }}>
                          <div style={{ marginBottom: 5 }}>
                            <span style={{
                              backgroundColor: colors.bg,
                              color: colors.color,
                              padding: '3px 8px',
                              borderRadius: '3px',
                              fontSize: '12px',
                              fontWeight: 600,
                              marginRight: '8px'
                            }}>
                              {getFieldLabel(change.field)}
                            </span>
                            <span style={{ color: '#666', fontSize: '12px' }}>{change.timestamp}</span>
                          </div>
                          <div style={{ marginBottom: 5 }}>
                            <span style={{ color: '#666' }}>Old: </span>
                            <span>{change.old_value && change.old_value.length > 100 ? change.old_value.substring(0, 100) + '...' : change.old_value}</span>
                          </div>
                          <div style={{ marginBottom: 5 }}>
                            <span style={{ color: '#666' }}>New: </span>
                            <span>{change.new_value && change.new_value.length > 100 ? change.new_value.substring(0, 100) + '...' : change.new_value}</span>
                          </div>
                          <div>
                            <span style={{ color: '#666' }}>Diff: </span>
                            <span dangerouslySetInnerHTML={{ __html: change.diff }} />
                          </div>
                        </div>
                      );
                    })}
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center', gap: 10 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            Previous
          </button>
          <span>Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            Next
          </button>
        </div>
      )}

      {pages.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
          No results yet. Monitoring is in progress...
        </div>
      )}
    </div>
  );
};

export default ResultsTable;
