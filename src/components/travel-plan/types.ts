

// 수정된 VisitItem 타입에 이를 반영
export interface Event {
  id: number;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  openTime?: string;
  closeTime?: string;
  address?: string;
  lat: number;
  lng: number;
  needReservation?: boolean;
  category: string;
  district: string;
  url?: string;
  content?: string;
}

export interface VisitItem extends BaseTimelineItem {
  type: 'visit';
  isImportant: boolean;
  tp_events?: Event; // 명확한 타입 정의
}

interface BaseTimelineItem {
  id: number;
  eventId?: number;
  visitTime: string;
  visitOrder: number;
  isReserved: boolean;
  reservationTime?: string;
  reservationUrl?: string;
  referenceUrl?: string;
  notes?: string;
  createdAt: string;
}



export interface BridgeItem extends BaseTimelineItem {
  type: 'bridge';
  bridgeType: 'transport' | 'rest' | 'generic';
  duration: number;
  location?: string;
}

type TimelineItem = VisitItem | BridgeItem;


export interface BridgeCreate extends Omit<BridgeItem, 'id' | 'created_at'> {
  visit_order?: number;
}

export interface BridgeUpdate extends Partial<BridgeCreate> {}