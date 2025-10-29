import { budgets, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export function getBudgets(offset: number, limit: number): Promise<budgets[]> {
    return prisma.budgets.findMany({
        skip: offset,
        take: limit,
    })
}
