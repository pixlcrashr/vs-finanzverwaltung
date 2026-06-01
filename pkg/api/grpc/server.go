package grpc

import (
	"context"
	"net/http"

	"github.com/gofiber/adaptor/v2"
	"github.com/gofiber/fiber/v2"
	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"google.golang.org/protobuf/encoding/protojson"

	gen "github.com/pixlcrashr/vsfv/pkg/api/grpc/gen"
	"github.com/pixlcrashr/vsfv/pkg/api/grpc/services"
)

// RegisterRoutes registers the grpc-gateway HTTP/JSON transcoded routes onto
// the given Fiber app. All gRPC service implementations are wired in-process
// (no TCP gRPC listener is required).
func RegisterRoutes(app *fiber.App, svc *services.Services) {
	mux := runtime.NewServeMux(
		runtime.WithMarshalerOption(runtime.MIMEWildcard, &runtime.JSONPb{
			MarshalOptions: protojson.MarshalOptions{
				UseProtoNames:   true,
				EmitUnpopulated: false,
			},
			UnmarshalOptions: protojson.UnmarshalOptions{
				DiscardUnknown: true,
			},
		}),
	)

	ctx := context.Background()

	mustRegister(gen.RegisterAccountServiceHandlerServer(ctx, mux, svc.Account))
	mustRegister(gen.RegisterAccountGroupServiceHandlerServer(ctx, mux, svc.AccountGroup))
	mustRegister(gen.RegisterAccountGroupAssignmentServiceHandlerServer(ctx, mux, svc.AccountGroupAssignment))
	mustRegister(gen.RegisterBudgetServiceHandlerServer(ctx, mux, svc.Budget))
	mustRegister(gen.RegisterBudgetTagServiceHandlerServer(ctx, mux, svc.BudgetTag))
	mustRegister(gen.RegisterImportSourceServiceHandlerServer(ctx, mux, svc.ImportSource))
	mustRegister(gen.RegisterImportSourcePeriodServiceHandlerServer(ctx, mux, svc.ImportSourcePeriod))
	mustRegister(gen.RegisterTransactionServiceHandlerServer(ctx, mux, svc.Transaction))
	mustRegister(gen.RegisterTransactionAccountServiceHandlerServer(ctx, mux, svc.TransactionAccount))
	mustRegister(gen.RegisterTransactionAccountAssignmentServiceHandlerServer(ctx, mux, svc.TransactionAccountAssignment))
	mustRegister(gen.RegisterReportTemplateServiceHandlerServer(ctx, mux, svc.ReportTemplate))
	mustRegister(gen.RegisterReportServiceHandlerServer(ctx, mux, svc.Report))

	app.All("/api/v1/*", adaptor.HTTPHandler(http.StripPrefix("/api", http.Handler(mux))))
}

func mustRegister(err error) {
	if err != nil {
		panic("grpc-gateway registration failed: " + err.Error())
	}
}
