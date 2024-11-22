import React, { useState } from 'react';
import { Stack, Group, Checkbox } from '@mantine/core';
import { LocationList } from './location-view/LocationList';
import { TimelineView } from './location-view/TimelineView';

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
    const filteredItems= items.filter(item => !item.visit_time);
    // console.log('filteredItems'+filteredItems);
    return filteredItems;
  };

  const getTimelineItems = () => {
    const filteredItems= items.filter(item => item.visit_time);
    // console.log('timelineItems'+filteredItems);
    return filteredItems;
  };
// console.log('showOnlyUnscheduled '+showOnlyUnscheduled);
// console.log('type '+type+', activeTab '+activeTab);
  return (
    <div style={{ width: '50%', borderRight: '1px solid #eee' }}>
      <Group position="apart" p="md">
        <Checkbox
          label="Show only unscheduled items"
          checked={showOnlyUnscheduled}
          onChange={(event) => setShowOnlyUnscheduled(event.currentTarget.checked)}
        />
      </Group>

      {showOnlyUnscheduled || activeTab ==="events" ? (
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
