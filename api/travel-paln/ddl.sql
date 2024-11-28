CREATE TABLE IF NOT EXISTS woorytools.tp_bridges
(
    id serial NOT NULL primary key,
	timeline_id integer,
    visit_time timestamp with time zone NOT NULL,
    visit_date date NOT NULL GENERATED ALWAYS AS (date(visit_time)) STORED,
    visit_order integer NOT NULL,
    is_reserved boolean DEFAULT false,
    reservation_time timestamp with time zone,
    reservation_url text,
    reference_url text,
    notes text,
    bridge_type text NOT NULL CHECK (bridge_type IN ('transport', 'rest', 'generic')),
    duration integer NOT NULL, -- minutes
    location text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tp_bridges_pkey PRIMARY KEY (id)
);

-- 인덱스 생성
CREATE INDEX idx_bridges_visit_time ON woorytools.tp_bridges(visit_time);
CREATE INDEX idx_bridges_visit_order ON woorytools.tp_bridges(visit_order);

CREATE INDEX idx_bridges_timeline_id ON woorytools.tp_bridges(timeline_id);
CREATE INDEX idx_bridges_visit_date ON woorytools.tp_bridges(visit_date);

-- 주석 추가
COMMENT ON TABLE woorytools.tp_bridges IS 'Timeline bridges for transitions between visits';
COMMENT ON COLUMN woorytools.tp_bridges.bridge_type IS 'Type of bridge: TRANSPORT, REST, or GENERIC';
COMMENT ON COLUMN woorytools.tp_bridges.duration IS 'Duration in minutes';
COMMENT ON COLUMN woorytools.tp_bridges.visit_time IS 'Start time of the bridge';
COMMENT ON COLUMN woorytools.tp_bridges.visit_order IS 'Order in the timeline';

grant select, insert, update, delete on table woorytools.tp_bridges to anon;
create schema if not exists woorytools;
grant usage on schema woorytools to anon, authenticated;
grant select on table woorytools.tp_bridges to anon;
grant select, insert, update, delete on table woorytools.tp_bridges to authenticated;


-- 브릿지 순서 업데이트를 위한 stored procedure --> 안씀
-- CREATE OR REPLACE FUNCTION woorytools.update_bridge_orders(updates jsonb[])
-- RETURNS void AS $$
-- BEGIN
--   FOR i IN 1..array_length(updates, 1) LOOP
--     UPDATE woorytools.tp_bridges
--     SET visit_order = (updates[i]->>'visit_order')::integer
--     WHERE id = (updates[i]->>'id')::integer;
--   END LOOP;
-- END;
-- $$ LANGUAGE plpgsql;


