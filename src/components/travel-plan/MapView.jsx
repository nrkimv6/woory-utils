import { Card, Select, Stack, Group, Tabs, Text, Badge, Button } from '@mantine/core';
import { EventDetailView} from './EventDetailView';
import { VisitDetailView} from './VisitDetailView';

export const MapView = ({ items, selectedLocation, activeTab }) => {
  const mapId = `map-${activeTab}`;
  return (
    <div style={{ width: '66.666%', position: 'relative', height: '600px' }}>
      <div id={mapId} style={{ 
        width: '100%', 
        height: '100%', 
        position: 'absolute' 
      }} />
      {selectedLocation && (
        <Card style={{
          position: 'absolute',
          bottom: 0,
          width: '100%',
          maxHeight: '200px',
          overflowY: 'auto',
          background: 'white',
          padding: '1rem'
        }}>
          {activeTab === "events" ? (
            <EventDetailView item={selectedLocation} />
          ) : (
            <VisitDetailView item={selectedLocation} />
          )}
        </Card>
      )}
    </div>
  );
};