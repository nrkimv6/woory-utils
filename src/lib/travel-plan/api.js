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
export const visitApi = {
  // 방문 계획 목록 조회
  async getVisits(eventId = null) {
    let query = supabase.from('tp_visits').select('*')
    if (eventId) {
      query = query.eq('event_id', eventId)
    }
    const { data, error } = await query.order('visit_order', { ascending: true })
    
    if (error) throw error
    return data
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