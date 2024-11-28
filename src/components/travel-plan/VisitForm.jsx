"use client"

import { useState, useEffect  } from 'react';
import {
  TextInput,
  Checkbox,
  Textarea,
  Button,
  Modal,
  Stack,
  Grid,
  Group,
  NumberInput
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { formatDateForDB } from '@/util/formatter'

export default function VisitForm({ eventId, onSubmit, initialData, onClose }) {
  const [opened, setOpened] = useState(false);
  const [formData, setFormData] = useState(initialData || {
    eventId: eventId,
    isReserved: false,
    reservationTime: null,
    isImportant: false,
    visitTime: null,
    visitOrder: 1,
    reservationUrl: '',
    referenceUrl: '',
    notes: ''
  });
  useEffect(() => {
    if (initialData) {
      setOpened(true);
      setFormData({
        ...initialData,
        reservationTime: initialData.reservationTime ? new Date(initialData.reservationTime) : null,
        visitTime: initialData.visitTime ? new Date(initialData.visitTime) : null
      });
    }
  }, [initialData]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit(formData);
    setOpened(false);
  };
  const handleClose = () => {
    setOpened(false);
    setFormData({
      eventId: eventId,
      isReserved: false,
      reservationTime: null,
      isImportant: false,
      visitTime: null,
      visitOrder: 1,
      reservationUrl: '',
      referenceUrl: '',
      notes: ''
    });
    onClose?.();
  };
  return (
    <>
      <Button variant="outline" onClick={() => setOpened(true)}>
        방문 계획 추가
      </Button>

      <Modal
        opened={initialData ? true : opened}
        onClose={() => {
          handleClose();
        }}
        title={`방문 계획 ${initialData ? '수정' : '추가'}`}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <Stack spacing="md">
            <Grid>
              <Grid.Col span={6}>
                <Checkbox
                  label="예약 완료"
                  checked={formData.isReserved}
                  onChange={(event) => setFormData(prev => ({
                    ...prev,
                    isReserved: event.currentTarget.checked
                  }))}
                />
              </Grid.Col>

              {formData.isReserved && (
                <Grid.Col span={6}>
                  <DateTimePicker
                    label="예약 시간"
                    value={formData.reservationTime ? new Date(formData.reservationTime) : null}
                    onChange={(date) => setFormData(prev => ({
                      ...prev,
                      reservationTime: date?.toISOString() || null
                    }))}
                  />
                </Grid.Col>
              )}

              <Grid.Col span={6}>
                <Checkbox
                  label="중요"
                  checked={formData.is_important}
                  onChange={(event) => setFormData(prev => ({
                    ...prev,
                    is_important: event.currentTarget.checked
                  }))}
                />
              </Grid.Col>

              <Grid.Col span={6}>
                <DateTimePicker
                  label="방문 예정 시간"
                  value={formData.visitTime ? new Date(formData.visitTime) : null}
                  onChange={(date) => setFormData(prev => ({
                    ...prev,
                    visitTime: date?.toISOString() || null
                  }))}
                />
              </Grid.Col>

              <Grid.Col span={6}>
                <NumberInput
                  label="방문 순서"
                  min={1}
                  value={formData.visitOrder}
                  onChange={(value) => setFormData(prev => ({
                    ...prev,
                    visitOrder: value
                  }))}
                />
              </Grid.Col>

              <Grid.Col span={6}>
                <TextInput
                  label="예약 URL"
                  value={formData.reservationUrl}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    reservationUrl: e.target.value
                  }))}
                />
              </Grid.Col>

              <Grid.Col span={12}>
                <TextInput
                  label="참고 URL"
                  value={formData.referenceUrl}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    referenceUrl: e.target.value
                  }))}
                />
              </Grid.Col>

              <Grid.Col span={12}>
                <Textarea
                  label="메모"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    notes: e.target.value
                  }))}
                  rows={4}
                />
              </Grid.Col>
            </Grid>

            <Group position="right" mt="md">
              <Button type="submit">
                {initialData ? '수정' : '추가'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}