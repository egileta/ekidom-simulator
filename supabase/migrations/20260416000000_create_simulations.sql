CREATE TABLE IF NOT EXISTS simulations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz DEFAULT now(),
  email           text NOT NULL,

  roof_area       numeric NOT NULL,
  floor_area      numeric NOT NULL,
  electric_kwh    numeric NOT NULL,
  gas_kwh         numeric NOT NULL,
  electric_price  numeric NOT NULL,
  gas_price       numeric NOT NULL,
  hsp             numeric NOT NULL,
  wind_speed      numeric NOT NULL,
  winter_temp     numeric NOT NULL,

  service_solar   boolean NOT NULL DEFAULT true,
  service_aero    boolean NOT NULL DEFAULT true,
  service_suelo   boolean NOT NULL DEFAULT true,

  location_label  text,
  location_lat    numeric,
  location_lon    numeric,

  saving_total    numeric NOT NULL,
  saving_solar    numeric,
  saving_aero     numeric,
  saving_suelo    numeric,
  budget_total    numeric NOT NULL,
  payback_years   numeric NOT NULL,

  pdf_sent_at     timestamptz
);

-- Index for querying by email
CREATE INDEX idx_simulations_email ON simulations(email);

-- RLS: allow inserts from anon (public lead capture)
ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_insert" ON simulations FOR INSERT TO anon WITH CHECK (true);
