// components/travel-plan/EventDetailView.jsx
export const EventDetailView = ({ item }) => {
  return (
    <>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
        {item.name}
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <p style={{ fontWeight: 'bold' }}>기간</p>
          <p>{item.start_date} ~ {item.end_date}</p>
        </div>
        <div>
          <p style={{ fontWeight: 'bold' }}>운영시간</p>
          <p>{item.open_time} ~ {item.close_time}</p>
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <p style={{ fontWeight: 'bold' }}>주소</p>
          <p>{item.address}</p>
        </div>
        <div>
          <p style={{ fontWeight: 'bold' }}>예약여부</p>
          <p>{item.need_reservation ? "사전예약 필요" : "예약 불필요"}</p>
        </div>
      </div>
    </>
  );
};
