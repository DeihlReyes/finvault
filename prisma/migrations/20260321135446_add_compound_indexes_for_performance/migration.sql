-- CreateIndex
CREATE INDEX "Budget_userId_month_year_idx" ON "Budget"("userId", "month", "year");

-- CreateIndex
CREATE INDEX "Transaction_userId_categoryId_type_date_idx" ON "Transaction"("userId", "categoryId", "type", "date");
