/*
  Warnings:

  - A unique constraint covering the columns `[credit_transaction_account_id,debit_transaction_account_id,amount,description,reference,booked_at]` on the table `transactions` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "document_date" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "transactions_credit_transaction_account_id_debit_transactio_key" ON "transactions"("credit_transaction_account_id", "debit_transaction_account_id", "amount", "description", "reference", "booked_at");
