import { Menu, Button } from '@mantine/core';
import { IconDots, IconEdit, IconTrash } from '@tabler/icons-react';
import { useState } from "react";
import { notifications } from '@mantine/notifications';

export function EventActions({ event, onEdit, onDelete }) {
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = async () => {
        try {
            setIsDeleting(true);
            await api.deleteEvent(event.id);
            notifications.show({
                title: "삭제 완료",
                message: "이벤트가 삭제되었습니다.",
                color: "green"
            });
            onDelete();
        } catch (error) {
            notifications.show({
                title: "삭제 실패",
                message: "이벤트 삭제에 실패했습니다.",
                color: "red"
            });
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <Menu position="bottom-end">
            <Menu.Target>
                <Button variant="subtle" size="sm" px={5}>
                    <IconDots size={16} />
                </Button>
            </Menu.Target>
            <Menu.Dropdown>
                <Menu.Item 
                    icon={<IconEdit size={16} />}
                    onClick={() => onEdit(event)}
                >
                    수정
                </Menu.Item>
                <Menu.Item 
                    icon={<IconTrash size={16} />}
                    color="red"
                    disabled={isDeleting}
                    onClick={handleDelete}
                >
                    삭제
                </Menu.Item>
            </Menu.Dropdown>
        </Menu>
    );
}