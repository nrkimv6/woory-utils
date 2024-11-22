import React, { useState } from 'react';
import { Stack, Group, Checkbox } from '@mantine/core';
import { LocationList } from './location-view/LocationList';
import { TimelineView } from './location-view/TimelineView';
import { eventApi, visitApi } from '@/lib/travel-plan/api';

export const LocationView = ({
  items,
  activeTab,
  selectedItem,
  onItemClick,
  onItemEdit,
  onItemDelete,
  type,
  date
}) => {
  const [showOnlyUnscheduled, setShowOnlyUnscheduled] = useState(false);

  const getFilteredItems = () => {
    if (!showOnlyUnscheduled) return items;
    const filteredItems = items.filter(item => {return !item.visit_time|| item.visit_time=="00:00" });
    return filteredItems;
  };

  const getTimelineItems = () => {
    const filteredItems = items.filter(item => item.visit_time);
    return filteredItems;
  };
  return (
    <div style={{ width: '50%', borderRight: '1px solid #eee' }}>
      <Group position="apart" p="md">
        <Checkbox
          label="Show only unscheduled items"
          checked={showOnlyUnscheduled}
          onChange={(event) => setShowOnlyUnscheduled(event.currentTarget.checked)}
        />
      </Group>

      {showOnlyUnscheduled || activeTab === "events" ? (
        <LocationList
          items={items}
          activeTab={activeTab}
          selectedItem={selectedItem}
          onItemClick={onItemClick}
          onItemEdit={onItemEdit}
          onItemDelete={onItemDelete}
          type={type}
        />
      ) : (
        <>
          <TimelineView
            visits={getTimelineItems()}
            date={date}
            selectedItem={selectedItem}
            onItemClick={onItemClick}
            onItemEdit={onItemEdit}
            onItemDelete={onItemDelete}
            onUpdateVisit={async (id, visitData) => {
              try {
                await visitApi.updateVisit(id, visitData);
              } catch (error) {
                console.error('Failed to update visit:', error);
              }
            }}
          />
          <LocationList
            items={getFilteredItems()}
            activeTab={activeTab}
            selectedItem={selectedItem}
            onItemClick={onItemClick}
            onItemEdit={onItemEdit}
            onItemDelete={onItemDelete}
            type={type}
          />
        </>
      )}
    </div>
  );
};
