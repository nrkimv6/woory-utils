
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { VisitItem } from '@/components/travel-plan/types';

const VISIT_TABLE = 'tp_visits';
const EVENTS_FIELDS = `
  id,
  name,
  description,
  start_date,
  end_date,
  open_time,
  close_time,
  address,
  lat,
  lng,
  need_reservation,
  category,
  district,
  url,
  content
`;

// transforms.ts
// export const transformVisitFromDB = (dbVisit: any): VisitItem => ({
//   id: dbVisit.id,
//   type: 'visit',
//   eventId: dbVisit.event_id,
//   visitTime: dbVisit.visit_time,
//   visitOrder: dbVisit.visit_order,
//   isReserved: dbVisit.is_reserved,
//   isImportant: dbVisit.is_important,
//   reservationTime: dbVisit.reservation_time,
//   reservationUrl: dbVisit.reservation_url,
//   referenceUrl: dbVisit.reference_url,
//   notes: dbVisit.notes,
//   createdAt: dbVisit.created_at,
//   tp_events: dbVisit.tp_events
// });
export const transformVisitFromDB = (dbVisit: any): VisitItem => ({
  id: dbVisit.id,
  type: 'visit',
  eventId: dbVisit.event_id,
  visitTime: dbVisit.visit_time,
  visitOrder: dbVisit.visit_order,
  isReserved: dbVisit.is_reserved,
  isImportant: dbVisit.is_important,
  reservationTime: dbVisit.reservation_time,
  reservationUrl: dbVisit.reservation_url,
  referenceUrl: dbVisit.reference_url,
  notes: dbVisit.notes,
  createdAt: dbVisit.created_at,
  tp_events: dbVisit.tp_events ? {
    id: dbVisit.tp_events.id,
    name: dbVisit.tp_events.name,
    description: dbVisit.tp_events.description,
    startDate: dbVisit.tp_events.start_date,
    endDate: dbVisit.tp_events.end_date,
    openTime: dbVisit.tp_events.open_time,
    closeTime: dbVisit.tp_events.close_time,
    address: dbVisit.tp_events.address,
    lat: dbVisit.tp_events.lat,
    lng: dbVisit.tp_events.lng,
    needReservation: dbVisit.tp_events.need_reservation,
    category: dbVisit.tp_events.category,
    district: dbVisit.tp_events.district,
    url: dbVisit.tp_events.url,
    content: dbVisit.tp_events.content
  } : undefined
});

export const transformVisitToDB = (visit: Partial<VisitItem>) => ({
  event_id: visit.eventId,
  visit_time: visit.visitTime,
  visit_order: visit.visitOrder,
  is_reserved: visit.isReserved,
  is_important: visit.isImportant,
  reservation_time: visit.reservationTime,
  reservation_url: visit.reservationUrl,
  reference_url: visit.referenceUrl,
  notes: visit.notes
});


export const visitApi = {
 async getVisits(eventId = null): Promise<VisitItem[]> {
    let query = supabase
      .from('tp_visits')
      .select(`
        *,
        tp_events (
          id,
          name,
          description,
          start_date,
          end_date,
          open_time,
          close_time,
          address,
          lat,
          lng,
          need_reservation,
          category,
          district,
          url,
          content
        )
      `)
      .order('visit_order');

    if (eventId) {
      query = query.eq('event_id', eventId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data.map(transformVisitFromDB);
  },

  // 날짜별 조회도 동일한 필드 포함
  async getVisitsByDate(date: Date): Promise<VisitItem[]> {
    const formattedDate = format(date, 'yyyy-MM-dd');
    
    const { data, error } = await supabase
      .from('tp_visits')
      .select(`
        *,
        tp_events (${EVENTS_FIELDS})
      `)
      .gte('visit_time', `${formattedDate}T00:00:00`)
      .lt('visit_time', `${formattedDate}T23:59:59`)
      .order('visit_time', { ascending: true });

    if (error) throw error;
    return data.map(transformVisitFromDB);
  },

  async createVisit(visitData: Omit<VisitItem, 'id' | 'type' | 'createdAt'>) {
    const { data, error } = await supabase
      .from('tp_visits')
      .insert([transformVisitToDB(visitData)])
      .select(`*, tp_events (${EVENTS_FIELDS})`)
      .single();

    if (error) throw error;
    return transformVisitFromDB(data);
  },

  async updateVisit(id: number, visitData: Partial<VisitItem>) {
    const { data, error } = await supabase
      .from('tp_visits')
      .update(transformVisitToDB(visitData))
      .eq('id', id)
      .select(`*, tp_events (${EVENTS_FIELDS})`)
      .single();

    if (error) throw error;
    return transformVisitFromDB(data);
  },

  // 방문 삭제
  async deleteVisit(id: number): Promise<void> {
    const { error } = await supabase
      .from(VISIT_TABLE)
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // 여러 방문의 순서 일괄 업데이트
  async updateVisitOrders(updates: { id: number; visitOrder: number }[]): Promise<void> {
    const { error } = await supabase.rpc('update_visit_orders', {
      updates: updates.map(u => ({
        id: u.id,
        visit_order: u.visitOrder
      }))
    });

    if (error) throw error;
  }
};