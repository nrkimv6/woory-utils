import { supabase } from '@/lib/supabase'
import { format } from 'date-fns';
import { BridgeItem } from '@/components/travel-plan/types';
import { saveToUTC, utcToLocal } from '@/util/dbfunc';

const BRIDGE_TABLE = 'tp_bridges';

// Supabase와 프론트엔드 인터페이스 간의 데이터 변환 함수들
const transformBridgeFromDB = (dbBridge: any): BridgeItem => ({
  id: dbBridge.id,
  type: 'bridge',
  eventId: dbBridge.event_id,
  // visitTime: utcToLocal(dbBridge.visit_time).toISOString(),
  visitTime: dbBridge.visit_time,
  visitOrder: dbBridge.visit_order,
  bridgeType: dbBridge.bridge_type,
  duration: dbBridge.duration,
  location: dbBridge.location,
  isReserved: dbBridge.is_reserved,
  // reservationTime: dbBridge.reservation_time ? utcToLocal(dbBridge.reservation_time).toISOString() : undefined,
  reservationTime: dbBridge.reservation_time,
  reservationUrl: dbBridge.reservation_url,
  referenceUrl: dbBridge.reference_url,
  notes: dbBridge.notes,
  createdAt: dbBridge.created_at
});

const transformBridgeToDB = (bridge: Partial<BridgeItem>) => ({
  event_id: bridge.eventId,
  // visit_time: bridge.visitTime ? saveToUTC(bridge.visitTime) : undefined,
  visit_time: bridge.visitTime,
  visit_order: bridge.visitOrder,
  bridge_type: bridge.bridgeType,
  duration: bridge.duration,
  location: bridge.location,
  is_reserved: bridge.isReserved,
  // reservation_time: bridge.reservationTime ? saveToUTC(bridge.reservationTime) : undefined,
  reservation_time: bridge.reservationTime,
  reservation_url: bridge.reservationUrl,
  reference_url: bridge.referenceUrl,
  notes: bridge.notes
});

export const bridgeApi = {
async getBridges(): Promise<BridgeItem[]> {
    
    const { data, error } = await supabase
      .from(BRIDGE_TABLE)
      .select('*')
      .order('visit_order', { ascending: true });

    if (error) throw error;
    return data.map(transformBridgeFromDB);
  },

  // 특정 날짜의 브릿지 목록 조회
  async getBridgesByDate(date: Date): Promise<BridgeItem[]> {
    const formattedDate = format(date, 'yyyy-MM-dd');
    
    const { data, error } = await supabase
      .from(BRIDGE_TABLE)
      .select('*')
      .eq('visit_date', formattedDate)
      .order('visit_order', { ascending: true });

    if (error) throw error;
    return data.map(transformBridgeFromDB);
  },

  // 특정 이벤트의 브릿지 목록 조회
  async getBridgesByEvent(eventId: number): Promise<BridgeItem[]> {
    const { data, error } = await supabase
      .from(BRIDGE_TABLE)
      .select('*')
      .eq('event_id', eventId)
      .order('visit_order', { ascending: true });

    if (error) throw error;
    return data.map(transformBridgeFromDB);
  },

  // 브릿지 생성
  async createBridge(bridgeData: Omit<BridgeItem, 'id' | 'type' | 'createdAt'>): Promise<BridgeItem> {
    const dbData = transformBridgeToDB(bridgeData);

    const { data, error } = await supabase
      .from(BRIDGE_TABLE)
      .insert([dbData])
      .select()
      .single();

    if (error) throw error;
    return transformBridgeFromDB(data);
  },

  // 브릿지 수정
  async updateBridge(id: number, bridgeData: Partial<BridgeItem>): Promise<BridgeItem> {
    const dbData = transformBridgeToDB(bridgeData);

    const { data, error } = await supabase
      .from(BRIDGE_TABLE)
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return transformBridgeFromDB(data);
  },

  // 브릿지 삭제
  async deleteBridge(id: number): Promise<void> {
    const { error } = await supabase
      .from(BRIDGE_TABLE)
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // 특정 날짜의 브릿지 순서 일괄 업데이트
  async updateBridgeOrders(date: Date, updates: { id: number; visitOrder: number }[]): Promise<void> {
    const { error } = await supabase.rpc('update_bridge_orders', {
      updates: updates.map(u => ({
        id: u.id,
        visit_order: u.visitOrder
      }))
    });

    if (error) throw error;
  }
};
