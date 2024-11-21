const LocationMarker = ({ index, isEvent = true, color }) => {
  const markerText = isEvent ? String.fromCharCode(65 + index) : (index + 1).toString();
  
  return (
    <div style={{
      background: color,
      padding: '5px 10px',
      borderRadius: isEvent ? '4px' : '50%',
      color: '#333',
      fontWeight: 'bold',
      textAlign: 'center',
      minWidth: '24px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      position: 'relative',
    }}>
      {markerText}
      <div style={{
        position: 'absolute',
        bottom: '-8px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 0,
        height: 0,
        borderLeft: '8px solid transparent',
        borderRight: '8px solid transparent',
        borderTop: `8px solid ${color}`,
      }} />
    </div>
  );
};

// default export로 변경
export default LocationMarker;