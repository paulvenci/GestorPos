ALTER TABLE empresas 
DROP CONSTRAINT IF EXISTS empresas_plan_check;

ALTER TABLE empresas 
ADD CONSTRAINT empresas_plan_check 
CHECK (plan IN ('gratis', 'basico', 'pro'));
