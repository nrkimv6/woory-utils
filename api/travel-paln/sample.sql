INSERT INTO woorytools.tp_bridges 
(timeline_id, visit_time, visit_order, is_reserved, bridge_type, duration, location, notes)
VALUES
-- BTS 팝업스토어 방문 예약
(2, '2024-11-22 14:00:00+00', 1, true, 'generic', 90, '서울특별시 강남구 삼성동', '버스 탑승'),

-- 라인프렌즈 팝업 방문
(3, '2024-11-22 11:30:00+00', 2, false, 'generic', 60, '서울특별시 성동구 성수동2가', '거리 구경'),

-- 이동 시간
(NULL, '2024-11-22 13:00:00+00', 3, false, 'transport', 45, '성수 → 강남', '지하철 이동'),

-- 휴식
(NULL, '2024-11-22 15:30:00+00', 4, false, 'rest', 30, '코엑스몰 푸드코트', '늦은 점심');