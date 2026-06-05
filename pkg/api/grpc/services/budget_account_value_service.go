package services

import (
	gen "github.com/pixlcrashr/vsfv/pkg/grpc/gen"
)

type budgetAccountValueServiceServer struct {
	gen.UnimplementedBudgetAccountValueServiceServer
}

func newBudgetAccountValueServiceServer() gen.BudgetAccountValueServiceServer {
	return &budgetAccountValueServiceServer{}
}
