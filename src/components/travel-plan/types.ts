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


interface VisitItem extends BaseTimelineItem {
  type: 'visit';
  // visit 특화 필드들...
}

interface BridgeItem extends BaseTimelineItem {
  type: 'bridge';
  bridgeType: 'transport' | 'rest' | 'generic';
  duration: number;
  location?: string;
}

type TimelineItem = VisitItem | BridgeItem;