#!/usr/bin/env bash
###############################################################################
# KoreField Academy — Dev Environment Setup Script
#
# Prerequisites:
#   1. AWS CLI configured with credentials (aws configure)
#   2. Terraform installed (>= 1.5.0)
#   3. Node.js 18+ and pnpm installed
#   4. Python 3.11+ and uv installed
#
# This script:
#   1. Provisions AWS infrastructure (VPC + RDS) via Terraform
#   2. Retrieves the RDS endpoint and password from AWS
#   3. Updates backend/.env with the real DATABASE_URL
#   4. Runs Prisma migrations to create tables
#   5. Seeds the database with curriculum, users, and content data
#   6. Starts the backend and frontend dev servers
#
# Usage: bash scripts/setup-dev.sh
###############################################################################

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo ""
echo "🚀 KoreField Academy — Dev Environment Setup"
echo "=============================================="
echo ""

# ── Step 1: Terraform ────────────────────────────────────────────

echo "📦 Step 1: Provisioning AWS infrastructure..."
cd "$PROJECT_ROOT/infrastructure"

if [ ! -d ".terraform" ]; then
  echo "  → Running terraform init..."
  terraform init
fi

echo "  → Running terraform plan..."
terraform plan -var-file=envs/dev.tfvars -out=dev.tfplan

echo ""
read -p "  Apply this plan? (y/N): " APPLY
if [ "$APPLY" != "y" ] && [ "$APPLY" != "Y" ]; then
  echo "  ✗ Aborted. Run 'terraform apply dev.tfplan' manually when ready."
  exit 0
fi

terraform apply dev.tfplan

# Get RDS endpoint from Terraform output
RDS_ENDPOINT=$(terraform output -raw rds_endpoint)
echo "  ✓ RDS endpoint: $RDS_ENDPOINT"

# ── Step 2: Retrieve RDS password from Secrets Manager ───────────

echo ""
echo "🔑 Step 2: Retrieving RDS password from AWS Secrets Manager..."

# The RDS module uses manage_master_user_password = true, which stores
# the password in Secrets Manager. Find the secret ARN.
SECRET_ARN=$(aws rds describe-db-instances \
  --db-instance-identifier korefield-academy-dev \
  --query 'DBInstances[0].MasterUserSecret.SecretArn' \
  --output text 2>/dev/null || echo "")

if [ -z "$SECRET_ARN" ] || [ "$SECRET_ARN" = "None" ]; then
  echo "  ⚠ Could not auto-retrieve password. Please enter it manually."
  read -sp "  RDS password: " DB_PASSWORD
  echo ""
else
  DB_PASSWORD=$(aws secretsmanager get-secret-value \
    --secret-id "$SECRET_ARN" \
    --query 'SecretString' \
    --output text | python3 -c "import sys,json; print(json.load(sys.stdin)['password'])")
  echo "  ✓ Password retrieved from Secrets Manager"
fi

# ── Step 3: Update backend/.env ──────────────────────────────────

echo ""
echo "📝 Step 3: Updating backend/.env with real DATABASE_URL..."

# Extract host from endpoint (format: host:port)
RDS_HOST=$(echo "$RDS_ENDPOINT" | cut -d: -f1)

DATABASE_URL="postgresql://korefield_admin:${DB_PASSWORD}@${RDS_HOST}:5432/korefield_academy?schema=public&sslmode=require"

cd "$PROJECT_ROOT/backend"

# Update DATABASE_URL in .env
if grep -q "^DATABASE_URL=" .env; then
  sed -i "s|^DATABASE_URL=.*|DATABASE_URL=\"${DATABASE_URL}\"|" .env
else
  echo "DATABASE_URL=\"${DATABASE_URL}\"" >> .env
fi

echo "  ✓ DATABASE_URL updated"

# ── Step 4: Install dependencies ─────────────────────────────────

echo ""
echo "📦 Step 4: Installing dependencies..."

cd "$PROJECT_ROOT/backend"
pnpm install
echo "  ✓ Backend dependencies installed"

cd "$PROJECT_ROOT/frontend"
pnpm install
echo "  ✓ Frontend dependencies installed"

# ── Step 5: Prisma migrate + generate ────────────────────────────

echo ""
echo "🗄️  Step 5: Running Prisma migrations..."

cd "$PROJECT_ROOT/backend"
pnpm prisma generate
echo "  ✓ Prisma client generated"

pnpm prisma migrate dev --name init
echo "  ✓ Database tables created"

# ── Step 6: Seed data ────────────────────────────────────────────

echo ""
echo "🌱 Step 6: Seeding database..."

pnpm ts-node --transpile-only ../db/seeds/seed-curriculum.ts
echo "  ✓ Curriculum seeded (4 tracks, 61 modules, pricing configs)"

pnpm ts-node --transpile-only ../db/seeds/seed-users.ts
echo "  ✓ Users seeded (19 users, 10 learners, 4 pods, payments)"

pnpm ts-node --transpile-only ../db/seeds/seed-content.ts
echo "  ✓ Content seeded (7 lessons, 3 assessments, 2 lab sessions, 4 exercises)"

# ── Done ─────────────────────────────────────────────────────────

echo ""
echo "=============================================="
echo "✅ Setup complete!"
echo ""
echo "To start the dev servers:"
echo "  Backend:  cd backend && pnpm start:dev     (port 3001)"
echo "  Frontend: cd frontend && pnpm dev           (port 3000)"
echo ""
echo "Demo accounts (password: KoreField2025!):"
echo "  Learner:     ngozi@learner.com"
echo "  Instructor:  emeka@korefield.com"
echo "  Admin:       blessing@korefield.com"
echo "  Super Admin: olumide@korefield.com"
echo "=============================================="
