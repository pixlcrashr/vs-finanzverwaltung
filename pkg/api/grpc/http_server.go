package grpc

import (
	"context"
	"net/http"

	"github.com/gofiber/adaptor/v2"
	"github.com/gofiber/fiber/v2"
	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"google.golang.org/protobuf/encoding/protojson"

	"github.com/pixlcrashr/vsfv/pkg/api/grpc/services"
	gen "github.com/pixlcrashr/vsfv/pkg/grpc/gen"
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

	mustRegister(gen.RegisterOrganizationServiceHandlerServer(ctx, mux, svc.Organization))
	mustRegister(gen.RegisterAccountServiceHandlerServer(ctx, mux, svc.Account))
	mustRegister(gen.RegisterAccountGroupServiceHandlerServer(ctx, mux, svc.AccountGroup))
	mustRegister(gen.RegisterAccountGroupAssignmentServiceHandlerServer(ctx, mux, svc.AccountGroupAssignment))
	mustRegister(gen.RegisterBudgetServiceHandlerServer(ctx, mux, svc.Budget))
	mustRegister(gen.RegisterBudgetRevisionServiceHandlerServer(ctx, mux, svc.BudgetRevision))
	mustRegister(gen.RegisterBudgetRevisionAccountValueServiceHandlerServer(ctx, mux, svc.BudgetRevisionAccountValue))
	mustRegister(gen.RegisterBudgetAccountValueServiceHandlerServer(ctx, mux, svc.BudgetAccountValue))
	mustRegister(gen.RegisterBudgetActualAccountValueServiceHandlerServer(ctx, mux, svc.BudgetActualAccountValue))
	mustRegister(gen.RegisterLedgerYearServiceHandlerServer(ctx, mux, svc.LedgerYear))
	mustRegister(gen.RegisterLedgerAccountServiceHandlerServer(ctx, mux, svc.LedgerAccount))
	mustRegister(gen.RegisterTransactionServiceHandlerServer(ctx, mux, svc.Transaction))
	mustRegister(gen.RegisterTransactionAssignmentServiceHandlerServer(ctx, mux, svc.TransactionAssignment))
	mustRegister(gen.RegisterReportTemplateServiceHandlerServer(ctx, mux, svc.ReportTemplate))
	mustRegister(gen.RegisterReportServiceHandlerServer(ctx, mux, svc.Report))
	mustRegister(gen.RegisterUserServiceHandlerServer(ctx, mux, svc.User))
	mustRegister(gen.RegisterUserSettingsServiceHandlerServer(ctx, mux, svc.UserSettings))
	mustRegister(gen.RegisterUserIdentityServiceHandlerServer(ctx, mux, svc.UserIdentity))
	mustRegister(gen.RegisterGroupServiceHandlerServer(ctx, mux, svc.Group))

	app.All("/api/v1/*", adaptor.HTTPHandler(http.StripPrefix("/api", http.Handler(mux))))
}

func mustRegister(err error) {
	if err != nil {
		panic("grpc-gateway registration failed: " + err.Error())
	}
}
