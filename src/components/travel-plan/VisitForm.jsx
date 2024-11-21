"use client"

import { useState } from 'react';
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
import {formatDateForDB} from '@/util/formatter'

export default function VisitForm({ eventId, onSubmit, initialData }) {
  const [opened, setOpened] = useState(false);
  const [formData, setFormData] = useState(initialData || {
    event_id: eventId,
    is_reserved: false,
    reservation_time: null,
    is_important: false,
    visit_time: null,
    visit_order: 1,
    reservation_url: '',
    reference_url: '',
    notes: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit(formData);
    setOpened(false);
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpened(true)}>
        방문 계획 {initialData ? '수정' : '추가'}
      </Button>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title={`방문 계획 ${initialData ? '수정' : '추가'}`}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <Stack spacing="md">
            <Grid>
              <Grid.Col span={6}>
                <Checkbox
                  label="예약 완료"
                  checked={formData.is_reserved}
                  onChange={(event) => setFormData(prev => ({ 
                    ...prev, 
                    is_reserved: event.currentTarget.checked 
                  }))}
                />
              </Grid.Col>

              {formData.is_reserved && (
                <Grid.Col span={6}>
                  <DateTimePicker
                    label="예약 시간"
                    value={formData.reservation_time ? new Date(formData.reservation_time) : null}
                    onChange={(date) => setFormData(prev => ({
                      ...prev,
                      reservation_time: date?.toISOString() || null
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
                  value={formData.visit_time ? new Date(formData.visit_time) : null}
                  onChange={(date) => setFormData(prev => ({
                    ...prev,
                    visit_time: date?.toISOString() || null
                  }))}
                />
              </Grid.Col>

              <Grid.Col span={6}>
                <NumberInput
                  label="방문 순서"
                  min={1}
                  value={formData.visit_order}
                  onChange={(value) => setFormData(prev => ({
                    ...prev,
                    visit_order: value
                  }))}
                />
              </Grid.Col>

              <Grid.Col span={6}>
                <TextInput
                  label="예약 URL"
                  value={formData.reservation_url}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    reservation_url: e.target.value
                  }))}
                />
              </Grid.Col>

              <Grid.Col span={12}>
                <TextInput
                  label="참고 URL"
                  value={formData.reference_url}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    reference_url: e.target.value
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