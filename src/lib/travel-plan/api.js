import { supabase } from '@/lib/supabase'

// 이벤트 관련 함수들
export const eventApi = {
  // 이벤트 목록 조회
  async getEvents() {
    const { data, error } = await supabase
      .from('tp_events')
      .select('*')
      .order('start_date', { ascending: true })
    
    if (error) throw error
    return data
  },

  // 이벤트 추가
  async addEvent(eventData) {
    const { data, error } = await supabase
      .from('tp_events')
      .insert([eventData])
      .select()
    
    if (error) throw error
    return data[0]
  },

  // 이벤트 수정
  async updateEvent(id, eventData) {
    const { data, error } = await supabase
      .from('tp_events')
      .update(eventData)
      .eq('id', id)
      .select()
    
    if (error) throw error
    return data[0]
  },

  // 이벤트 삭제
  async deleteEvent(id) {
    const { error } = await supabase
      .from('tp_events')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// 방문 계획 관련 함수들
export const visitApi_old = {
  // 방문 계획 목록 조회
  async getVisits_old(eventId = null) {
    let query = supabase.from('tp_visits').select('*')
    if (eventId) {
      query = query.eq('event_id', eventId)
    }
    const { data, error } = await query.order('visit_order', { ascending: true })
    
    if (error) throw error
    return data
  },

  async getVisits(eventId = null) {
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
    return data;
  },
  // 방문 계획 추가
  async addVisit(visitData) {
    const { data, error } = await supabase
      .from('tp_visits')
      .insert([visitData])
      .select()
    
    if (error) throw error
    return data[0]
  },

  // 방문 계획 수정
  async updateVisit(id, visitData) {
    const { data, error } = await supabase
      .from('tp_visits')
      .update(visitData)
      .eq('id', id)
      .select()
    
    if (error) throw error
    return data[0]
  },

  // 방문 계획 삭제
  async deleteVisit(id) {
    const { error } = await supabase
      .from('tp_visits')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}


const BRIDGE_TABLE = 'tp_bridges';

// export const bridgeApi = {
//   // 특정 날짜의 브릿지 조회 (단일 날짜)
//   async getBridgesByDate(date) {
//     const formattedDate = format(date, 'yyyy-MM-dd');
    
//     const { data, error } = await supabase
//       .from(BRIDGE_TABLE)
//       .select('*')
//       .eq('visit_date', formattedDate)
//       .order('visit_time', { ascending: true });

//     if (error) throw error;
//     return data;
//   },

//   // 날짜 범위로 브릿지 조회
//   async getBridgesByDateRange(startDate, endDate) {
//     const formattedStartDate = format(startDate, 'yyyy-MM-dd');
//     const formattedEndDate = format(endDate, 'yyyy-MM-dd');

//     const { data, error } = await supabase
//       .from(BRIDGE_TABLE)
//       .select('*')
//       .gte('visit_date', formattedStartDate)
//       .lte('visit_date', formattedEndDate)
//       .order('visit_time', { ascending: true });

//     if (error) throw error;
//     return data;
//   },

//   // 브릿지 생성
//   async addBridge(bridgeData) {
//     // visit_date는 트리거로 자동 설정되므로 제외
//     const { visit_date, ...data } = bridgeData;

//     if (!data.visit_order) {
//       const { data: lastBridge } = await supabase
//         .from(BRIDGE_TABLE)
//         .select('visit_order')
//         .eq('visit_date', format(new Date(data.visit_time), 'yyyy-MM-dd'))
//         .order('visit_order', { ascending: false })
//         .limit(1);

//       data.visit_order = lastBridge?.[0]?.visit_order + 1 || 1;
//     }

//     const { data: newBridge, error } = await supabase
//       .from(BRIDGE_TABLE)
//       .insert([data])
//       .select()
//       .single();

//     if (error) throw error;
//     return newBridge;
//   },
//   // 특정 날짜의 순서 재정렬
//   async reorderBridgesByDate(date, orderUpdates) {
//     const formattedDate = format(date, 'yyyy-MM-dd');
    
//     // 트랜잭션으로 처리
//     const { error } = await supabase.rpc('reorder_bridges_by_date', {
//       target_date: formattedDate,
//       order_updates: orderUpdates
//     });

//     if (error) throw error;
//     return true;
//   },

//   //deprecated
//    async getBridges() {
//     const { data, error } = await supabase
//       .from(BRIDGE_TABLE)
//       .select('*')
//       .order('visit_time', { ascending: true });

//     if (error) throw error;
//     return data;
//   },

//   // 단일 브릿지 조회
//   async getBridge(id) {
//     const { data, error } = await supabase
//       .from(BRIDGE_TABLE)
//       .select('*')
//       .eq('id', id)
//       .single();

//     if (error) throw error;
//     return data;
//   },

//   // 브릿지 수정
//   async updateBridge(id, bridgeData) {
//     const { data, error } = await supabase
//       .from(BRIDGE_TABLE)
//       .update(bridgeData)
//       .eq('id', id)
//       .select()
//       .single();

//     if (error) throw error;
//     return data;
//   },

//   // 브릿지 삭제
//   async deleteBridge(id) {
//     const { error } = await supabase
//       .from(BRIDGE_TABLE)
//       .delete()
//       .eq('id', id);

//     if (error) throw error;
//     return true;
//   },

//   // 브릿지 순서 업데이트
//   async updateBridgeOrder(id, newOrder) {
//     const { data, error } = await supabase
//       .from(BRIDGE_TABLE)
//       .update({ visit_order: newOrder })
//       .eq('id', id)
//       .select()
//       .single();

//     if (error) throw error;
//     return data;
//   },

//   // 여러 브릿지 순서 일괄 업데이트
//   async updateBridgeOrders(orderUpdates) {
//     const { error } = await supabase.rpc('update_bridge_orders', {
//       order_updates: orderUpdates
//     });

//     if (error) throw error;
//     return true;
//   }
// };

