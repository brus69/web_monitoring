import React, { useState } from 'react';
import { PageState } from '../types';

interface ResultsTableProps {
  pages: PageState[];
}

const ResultsTable: React.FC<ResultsTableProps> = ({ pages }) => {
  const [page, setPage] = useState(1);
  const perPage = 100;
  const totalPages = Math.ceil(pages.length / perPage);
  const start = (page - 1) * perPage;
  const end = Math.min(start + perPage, pages.length);
  const currentPages = pages.slice(start, end);

  return (
    <div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>URL</th>
            <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Status</th>
            <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Title</th>
            <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Last Checked</th>
          </tr>
        </thead>
        <tbody>
          {currentPages.map((p, i) => (
            <tr key={i}>
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
            </tr>
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
