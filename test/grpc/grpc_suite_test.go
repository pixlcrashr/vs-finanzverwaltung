package grpc_test

import (
	"context"
	"database/sql"
	"net"
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/test/bufconn"
	"gorm.io/gorm/logger"

	googlegrpc "google.golang.org/grpc"

	"github.com/pixlcrashr/vsfv/pkg/api/grpc/services"
	"github.com/pixlcrashr/vsfv/pkg/authz"
	pkgdb "github.com/pixlcrashr/vsfv/pkg/db"
	gen "github.com/pixlcrashr/vsfv/pkg/grpc/gen"

	_ "github.com/lib/pq"
)

const (
	bufSize = 1024 * 1024
	testDSN = "postgres://vsf:postgres@127.0.0.1:5335/vsf?sslmode=disable"
)

var (
	lis                              *bufconn.Listener
	conn                             *grpc.ClientConn
	OrgClient                        gen.OrganizationServiceClient
	AccountClient                    gen.AccountServiceClient
	BudgetClient                     gen.BudgetServiceClient
	BudgetRevisionClient             gen.BudgetRevisionServiceClient
	BudgetRevisionAccountValueClient gen.BudgetRevisionAccountValueServiceClient
	BudgetAccountValueClient         gen.BudgetAccountValueServiceClient
	BudgetActualAccountValueClient   gen.BudgetActualAccountValueServiceClient
	ImportSourceClient               gen.ImportSourceServiceClient
	TransactionAccountClient         gen.TransactionAccountServiceClient
	TransactionClient                gen.TransactionServiceClient
)

func TestGrpc(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "Grpc Suite")
}

var _ = BeforeSuite(func() {
	sqlDB, err := sql.Open("postgres", testDSN)
	Expect(err).NotTo(HaveOccurred())
	defer sqlDB.Close()

	By("resetting the test DB schema")
	_, err = sqlDB.Exec("DROP SCHEMA public CASCADE; CREATE SCHEMA public;")
	Expect(err).NotTo(HaveOccurred())

	By("applying all migrations on the clean schema")
	err = pkgdb.Run(sqlDB)
	Expect(err).NotTo(HaveOccurred())

	gormDB, err := pkgdb.Connect(testDSN)
	gormDB.Logger = gormDB.Logger.LogMode(logger.Silent)
	Expect(err).NotTo(HaveOccurred())

	enforcer, err := authz.NewEnforcer(gormDB)
	Expect(err).NotTo(HaveOccurred())

	svc := services.New(gormDB, enforcer)

	lis = bufconn.Listen(bufSize)
	s := googlegrpc.NewServer()
	gen.RegisterOrganizationServiceServer(s, svc.Organization)
	gen.RegisterAccountServiceServer(s, svc.Account)
	gen.RegisterBudgetServiceServer(s, svc.Budget)
	gen.RegisterBudgetRevisionServiceServer(s, svc.BudgetRevision)
	gen.RegisterBudgetRevisionAccountValueServiceServer(s, svc.BudgetRevisionAccountValue)
	gen.RegisterBudgetAccountValueServiceServer(s, svc.BudgetAccountValue)
	gen.RegisterBudgetActualAccountValueServiceServer(s, svc.BudgetActualAccountValue)
	gen.RegisterImportSourceServiceServer(s, svc.ImportSource)
	gen.RegisterTransactionAccountServiceServer(s, svc.TransactionAccount)
	gen.RegisterTransactionServiceServer(s, svc.Transaction)
	go func() { _ = s.Serve(lis) }()

	conn, err = grpc.NewClient(
		"passthrough:///bufnet",
		grpc.WithContextDialer(func(ctx context.Context, _ string) (net.Conn, error) {
			return lis.DialContext(ctx)
		}),
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	)
	Expect(err).NotTo(HaveOccurred())

	OrgClient = gen.NewOrganizationServiceClient(conn)
	AccountClient = gen.NewAccountServiceClient(conn)
	BudgetClient = gen.NewBudgetServiceClient(conn)
	BudgetRevisionClient = gen.NewBudgetRevisionServiceClient(conn)
	BudgetRevisionAccountValueClient = gen.NewBudgetRevisionAccountValueServiceClient(conn)
	BudgetAccountValueClient = gen.NewBudgetAccountValueServiceClient(conn)
	BudgetActualAccountValueClient = gen.NewBudgetActualAccountValueServiceClient(conn)
	ImportSourceClient = gen.NewImportSourceServiceClient(conn)
	TransactionAccountClient = gen.NewTransactionAccountServiceClient(conn)
	TransactionClient = gen.NewTransactionServiceClient(conn)

	DeferCleanup(func() {
		_ = conn.Close()
		_ = lis.Close()
		s.GracefulStop()
	})
})
