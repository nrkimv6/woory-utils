import React, { useState } from 'react';
import { Stack, Group, Checkbox } from '@mantine/core';
import { LocationList } from './location-view/LocationList';
import { TimelineView } from './location-view/TimelineView';
import { eventApi, visitApi } from '@/lib/travel-plan/api';

export const LocationView = ({
    timelineItems,
  onTimelineUpdate,
  items,
  displayType,
  selectedItem,
  onItemClick,
  onItemEdit,
  onItemDelete,
  onItemUpdate,
  type,
  date
}) => {
  const [showOnlyUnscheduled, setShowOnlyUnscheduled] = useState(false);

  const handleTimelineChange = (updatedItems) => {
    onTimelineUpdate(updatedItems);
  };

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

      {showOnlyUnscheduled || displayType === "events" ? (
        <LocationList
          items={items}
          selectedItem={selectedItem}
          onItemClick={onItemClick}
          onItemEdit={onItemEdit}
          onItemDelete={onItemDelete}
          type={type}
        />
      ) : (
        <>
          <TimelineView
            items={getTimelineItems()}
            onItemsChange={handleTimelineChange}
            date={date}
            selectedItem={selectedItem}
            onItemClick={onItemClick}
            onItemEdit={onItemEdit}
            onItemDelete={onItemDelete}
            onUpdateVisit={async (id, visitData) => {
              try {
                console.log('update visit '+id+', '+ JSON.stringify(visitData));
                await visitApi.updateVisit(id, visitData);
                onItemUpdate();
              } catch (error) {
                console.error('Failed to update visit:', error);
              }
            }}
          />
          <LocationList
            items={getFilteredItems()}
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
