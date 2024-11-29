import { Menu, Button, Group, ActionIcon } from '@mantine/core';
import { useState } from "react";
import { notifications } from '@mantine/notifications';
import { ChevronDown, ChevronUp } from 'lucide-react';

export function EventActions({ item, onEdit, onDelete, type = 'event'  }) {
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = async (id, type) => {
        try {
            setIsDeleting(true);
            await onDelete(id, type);
            notifications.show({
                title: "삭제 완료",
                message: "삭제되었습니다.",
                color: "green"
            });
        } catch (error) {
            notifications.show({
                title: "삭제 실패",
                message: "삭제에 실패했습니다.",
                color: "red"
            });
        } finally {
            setIsDeleting(false);
        }
    }

  return (
    <Group position="right" mt="md">
      <Button variant="light" onClick={() => onEdit(item)}>
        수정
      </Button>
      <Button 
        variant="light" 
        color="red"
        onClick={() => handleDelete(item.id, type)}
      >
        삭제
      </Button>
      { item.reservationUrl && (
        <Button
          variant="light"
          component="a"
          href={item.reservationUrl}
          target="_blank"
        >
          링크
        </Button>
      )}
    </Group>
  );
};


const CollapsibleEventActions = ({ isExpanded, onToggle, item, onEdit, onDelete, type }) => {
const actionStyle = {
  position: 'absolute',
  right: 0,
  top: '100%',
  zIndex: 1000,
  backgroundColor: 'white',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  borderRadius: '4px'
};
  return  (
  <>
    <ActionIcon 
      size="sm" 
      onClick={e => {
        e.stopPropagation();
        onToggle();
      }}
      style={actionStyle}
    >
      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
    </ActionIcon>
    {isExpanded && <EventActions item={item} onEdit={onEdit} onDelete={onDelete} type={type} />}
  </>
)};
export default CollapsibleEventActions;