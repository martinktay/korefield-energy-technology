/**
 * Standalone database client for workers.
 * Workers don't share the NestJS Prisma setup.
 * Uses @prisma/client with the schema from backend/prisma/schema.prisma.
 *
 * NOTE: Requires `pnpm prisma generate` to have been run in the backend
 * directory so that the generated client is available.
 */

let prismaInstance: any = null;

function getPrisma(): any {
  if (!prismaInstance) {
    // Dynamic require to avoid compile-time issues when Prisma client
    // hasn't been generated yet. In production, the client will be available.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PrismaClient } = require('@prisma/client');
    prismaInstance = new PrismaClient();
  }
  return prismaInstance;
}

export async function updateCertificatePdfUrl(
  certificateId: string,
  pdfUrl: string,
): Promise<void> {
  const prisma = getPrisma();
  await prisma.certificate.update({
    where: { id: certificateId },
    data: { pdf_url: pdfUrl },
  });
}

export { getPrisma };
