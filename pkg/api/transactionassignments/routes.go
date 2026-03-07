package transactionassignments

import (
	"net/http"

	"github.com/danielgtaylor/huma/v2"
	"github.com/pixlcrashr/vsfv/pkg/db/repository"
	"gorm.io/gorm"
)

func RegisterRoutes(api huma.API, db *gorm.DB) {
	h := NewHandler(repository.NewTransactionAccountAssignmentRepository(db))

	huma.Register(api, huma.Operation{
		OperationID: "list-transaction-account-assignments",
		Method:      http.MethodGet,
		Path:        "/v1/transactions/{transactionId}/assignments",
		Summary:     "List transaction account assignments",
		Tags:        []string{"Transaction Account Assignments"},
	}, h.List)

	huma.Register(api, huma.Operation{
		OperationID: "get-transaction-account-assignment",
		Method:      http.MethodGet,
		Path:        "/v1/transactions/{transactionId}/assignments/{assignmentId}",
		Summary:     "Get a transaction account assignment",
		Tags:        []string{"Transaction Account Assignments"},
	}, h.Get)

	huma.Register(api, huma.Operation{
		OperationID: "create-transaction-account-assignment",
		Method:      http.MethodPost,
		Path:        "/v1/transactions/{transactionId}/assignments",
		Summary:     "Create a transaction account assignment",
		Tags:        []string{"Transaction Account Assignments"},
	}, h.Create)

	huma.Register(api, huma.Operation{
		OperationID: "update-transaction-account-assignment",
		Method:      http.MethodPatch,
		Path:        "/v1/transactions/{transactionId}/assignments/{assignmentId}",
		Summary:     "Update a transaction account assignment",
		Tags:        []string{"Transaction Account Assignments"},
	}, h.Update)

	huma.Register(api, huma.Operation{
		OperationID: "delete-transaction-account-assignment",
		Method:      http.MethodDelete,
		Path:        "/v1/transactions/{transactionId}/assignments/{assignmentId}",
		Summary:     "Delete a transaction account assignment",
		Tags:        []string{"Transaction Account Assignments"},
	}, h.Delete)
}
