import {formatDateTime} from '@/util/formatter'

export const VisitDetailView = ({ item }) => {
  return (
    <>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
        {item.tp_events?.name}
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <p style={{ fontWeight: 'bold' }}>방문예정</p>
          <p>{formatDateTime(item.visitTime)}</p>
        </div>
        <div>
          <p style={{ fontWeight: 'bold' }}>방문순서</p>
          <p>{item.visitOrder || '-'}</p>
        </div>
        {item.isReserved && (
          <div>
            <p style={{ fontWeight: 'bold' }}>예약시간</p>
            <p>{formatDateTime(item.reservationTime)}</p>
          </div>
        )}
        <div style={{ gridColumn: 'span 2' }}>
          <p style={{ fontWeight: 'bold' }}>메모</p>
          <p style={{ whiteSpace: 'pre-line' }}>{item.notes || '-'}</p>
        </div>
      </div>
    </>
  );
};