-- Add PagSeguro and Abacate Pay to IntegrationProvider enum
-- ALTER TYPE ADD VALUE runs outside transaction in older PG; PG 12+ allows it inside.
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'PAGSEGURO';
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'ABACATE';
