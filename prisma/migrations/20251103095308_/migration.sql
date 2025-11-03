-- CreateTable
CREATE TABLE "account_group_assignments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "account_group_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "negate" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_group_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_groups" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "display_name" TEXT NOT NULL DEFAULT '',
    "display_description" TEXT NOT NULL DEFAULT '',
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "parent_account_id" UUID,
    "display_name" TEXT NOT NULL DEFAULT '',
    "display_code" TEXT NOT NULL DEFAULT '',
    "display_description" TEXT NOT NULL DEFAULT '',
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_revision_account_values" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "budget_revision_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "value" DECIMAL NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "budget_revision_account_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_revisions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "budget_id" UUID NOT NULL,
    "date" TIMESTAMP(6) NOT NULL,
    "display_description" TEXT NOT NULL DEFAULT '',
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "budget_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budgets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "display_name" TEXT NOT NULL DEFAULT '',
    "display_description" TEXT NOT NULL DEFAULT '',
    "is_closed" BOOLEAN NOT NULL DEFAULT false,
    "period_start" TIMESTAMP(6) NOT NULL,
    "period_end" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(64) NOT NULL,
    "display_name" TEXT NOT NULL DEFAULT '',
    "display_description" TEXT NOT NULL DEFAULT '',
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaction_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "credit_transaction_account_id" UUID NOT NULL,
    "debit_transaction_account_id" UUID NOT NULL,
    "amount" DECIMAL NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "reference" TEXT NOT NULL DEFAULT '',
    "assigned_account_id" UUID,
    "booked_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "view_account_assignments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "view_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "view_account_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "view_account_group_assignments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "view_id" UUID NOT NULL,
    "account_group_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "view_account_group_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "view_budget_assignments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "view_id" UUID NOT NULL,
    "budget_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "view_budget_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "views" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "display_name" TEXT NOT NULL DEFAULT '',
    "display_description" TEXT NOT NULL DEFAULT '',
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "views_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_account_group_assignments_negate" ON "account_group_assignments"("negate");

-- CreateIndex
CREATE UNIQUE INDEX "idx_account_group_id_account_id" ON "account_group_assignments"("account_group_id", "account_id");

-- CreateIndex
CREATE INDEX "idx_account_groups_display_description" ON "account_groups"("display_description");

-- CreateIndex
CREATE INDEX "idx_account_groups_display_name" ON "account_groups"("display_name");

-- CreateIndex
CREATE INDEX "idx_accounts_display_code" ON "accounts"("display_code");

-- CreateIndex
CREATE INDEX "idx_accounts_display_name" ON "accounts"("display_name");

-- CreateIndex
CREATE INDEX "idx_accounts_parent_account_id" ON "accounts"("parent_account_id");

-- CreateIndex
CREATE INDEX "idx_budget_revision_account_values_account_id" ON "budget_revision_account_values"("account_id");

-- CreateIndex
CREATE INDEX "idx_budget_revision_account_values_budget_id" ON "budget_revision_account_values"("budget_revision_id");

-- CreateIndex
CREATE INDEX "idx_budget_revision_account_values_value" ON "budget_revision_account_values"("value");

-- CreateIndex
CREATE INDEX "idx_budget_revisions_budget_id" ON "budget_revisions"("budget_id");

-- CreateIndex
CREATE INDEX "idx_budget_revisions_date" ON "budget_revisions"("date");

-- CreateIndex
CREATE INDEX "idx_budgets_display_name" ON "budgets"("display_name");

-- CreateIndex
CREATE UNIQUE INDEX "transaction_accounts_code_key" ON "transaction_accounts"("code");

-- CreateIndex
CREATE INDEX "idx_transaction_accounts_code" ON "transaction_accounts"("code");

-- CreateIndex
CREATE INDEX "idx_transaction_accounts_display_name" ON "transaction_accounts"("display_name");

-- CreateIndex
CREATE INDEX "idx_view_account_assignments_account_id" ON "view_account_assignments"("account_id");

-- CreateIndex
CREATE INDEX "idx_view_account_assignments_view_id" ON "view_account_assignments"("view_id");

-- CreateIndex
CREATE UNIQUE INDEX "view_account_assignments_view_id_account_id_key" ON "view_account_assignments"("view_id", "account_id");

-- CreateIndex
CREATE INDEX "idx_view_account_group_assignments_account_group_id" ON "view_account_group_assignments"("account_group_id");

-- CreateIndex
CREATE INDEX "idx_view_account_group_assignments_view_id" ON "view_account_group_assignments"("view_id");

-- CreateIndex
CREATE UNIQUE INDEX "view_account_group_assignments_view_id_account_group_id_key" ON "view_account_group_assignments"("view_id", "account_group_id");

-- CreateIndex
CREATE INDEX "idx_view_budget_assignments_budget_id" ON "view_budget_assignments"("budget_id");

-- CreateIndex
CREATE INDEX "idx_view_budget_assignments_view_id" ON "view_budget_assignments"("view_id");

-- CreateIndex
CREATE UNIQUE INDEX "view_budget_assignments_view_id_budget_id_key" ON "view_budget_assignments"("view_id", "budget_id");

-- CreateIndex
CREATE INDEX "idx_views_display_description" ON "views"("display_description");

-- CreateIndex
CREATE INDEX "idx_views_display_name" ON "views"("display_name");

-- AddForeignKey
ALTER TABLE "account_group_assignments" ADD CONSTRAINT "account_group_assignments_account_group_id_fkey" FOREIGN KEY ("account_group_id") REFERENCES "account_groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "account_group_assignments" ADD CONSTRAINT "account_group_assignments_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_parent_account_id_fkey" FOREIGN KEY ("parent_account_id") REFERENCES "accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "budget_revision_account_values" ADD CONSTRAINT "budget_revision_account_values_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "budget_revision_account_values" ADD CONSTRAINT "budget_revision_account_values_budget_revision_id_fkey" FOREIGN KEY ("budget_revision_id") REFERENCES "budget_revisions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "budget_revisions" ADD CONSTRAINT "budget_revisions_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "budgets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_assigned_account_id_fkey" FOREIGN KEY ("assigned_account_id") REFERENCES "accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_credit_transaction_account_id_fkey" FOREIGN KEY ("credit_transaction_account_id") REFERENCES "transaction_accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_debit_transaction_account_id_fkey" FOREIGN KEY ("debit_transaction_account_id") REFERENCES "transaction_accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "view_account_assignments" ADD CONSTRAINT "view_account_assignments_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "view_account_assignments" ADD CONSTRAINT "view_account_assignments_view_id_fkey" FOREIGN KEY ("view_id") REFERENCES "views"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "view_account_group_assignments" ADD CONSTRAINT "view_account_group_assignments_account_group_id_fkey" FOREIGN KEY ("account_group_id") REFERENCES "account_groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "view_account_group_assignments" ADD CONSTRAINT "view_account_group_assignments_view_id_fkey" FOREIGN KEY ("view_id") REFERENCES "views"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "view_budget_assignments" ADD CONSTRAINT "view_budget_assignments_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "budgets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "view_budget_assignments" ADD CONSTRAINT "view_budget_assignments_view_id_fkey" FOREIGN KEY ("view_id") REFERENCES "views"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
