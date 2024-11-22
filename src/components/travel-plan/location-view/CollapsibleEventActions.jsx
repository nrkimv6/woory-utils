import { Menu, Button, Group, ActionIcon } from '@mantine/core';
import { IconDots, IconEdit, IconTrash } from '@tabler/icons-react';
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

    // return (
    //     <Menu position="bottom-end">
    //         <Menu.Target>
    //             <Button variant="subtle" size="sm" px={5}>
    //                 <IconDots size={16} />
    //             </Button>
    //         </Menu.Target>
    //         <Menu.Dropdown>
    //             <Menu.Item 
    //                 icon={<IconEdit size={16} />}
    //                 onClick={() => onEdit(event)}
    //             >
    //                 수정
    //             </Menu.Item>
    //             <Menu.Item 
    //                 icon={<IconTrash size={16} />}
    //                 color="red"
    //                 disabled={isDeleting}
    //                 onClick={handleDelete}
    //             >
    //                 삭제
    //             </Menu.Item>
    //   {type === 'visit' && item.reservation_url && (
    //     <Button
    //       variant="light"
    //       component="a"
    //       href={item.reservation_url}
    //       target="_blank"
    //     >
    //       예약 페이지
    //     </Button>
    //   )}
    //         </Menu.Dropdown>
    //     </Menu>
    // );
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
      {type === 'visit' && item.reservation_url && (
        <Button
          variant="light"
          component="a"
          href={item.reservation_url}
          target="_blank"
        >
          예약 페이지
        </Button>
      )}
    </Group>
  );
};


const CollapsibleEventActions = ({ isExpanded, onToggle, item, onEdit, onDelete, type }) => (
  <>
    <ActionIcon 
      size="sm" 
      onClick={e => {
        e.stopPropagation();
        onToggle();
      }}
      style={{ position: 'absolute', right: 10, top: 10 }}
    >
      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
    </ActionIcon>
    {isExpanded && <EventActions item={item} onEdit={onEdit} onDelete={onDelete} type={type} />}
  </>
);
export default CollapsibleEventActions;