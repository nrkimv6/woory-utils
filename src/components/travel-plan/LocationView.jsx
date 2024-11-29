import React, { useState } from 'react';
import { Stack, Group, Checkbox } from '@mantine/core';
import { LocationList } from './location-view/LocationList';
import { TimelineView } from './location-view/TimelineView';
import { eventApi } from '@/lib/travel-plan/api';
import {bridgeApi} from '@/lib/travel-plan/bridgeApi'
import {visitApi} from '@/lib/travel-plan/visitApi'

export const LocationView = ({
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
    const filteredItems = items.filter(item => {return !item.visitTime|| item.visitTime=="00:00" });
    return filteredItems;
  };

  const getTimelineItems = () => {
    const filteredItems = items.filter(item => item.visitTime);
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
            date={date}
            selectedItem={selectedItem}
            onItemClick={onItemClick}
            onItemEdit={onItemEdit}
            onItemDelete={onItemDelete}
            onItemsChange={async (id, type, updateField) => {
              try {
                if(type=="visit"){
                  console.log('update visit '+id+', '+ JSON.stringify(visitData));
                  await visitApi.updateVisit(id, visitData);
                }
                else if(type=="bridge"){
                  console.log('update bridge '+id+', '+ JSON.stringify(visitData));
                  await bridgeApi.updateBridge(id, updateField);
                }
                else{
                  console.log("cannot find the type of item");
                }

                /// 리프레시
                onItemUpdate();
              } catch (error) {
                console.error('Failed to update visit:', error);
              }
            }}
            onUpdateVisit={()=>{
              ///#todo initialize 시에는 불리지 말아야 함
              console.log()}}
            onUpdateBridge={()=>{console.log()}}
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
