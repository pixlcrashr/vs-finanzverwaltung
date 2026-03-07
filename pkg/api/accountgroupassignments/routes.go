package accountgroupassignments

import (
	"net/http"

	"github.com/danielgtaylor/huma/v2"
	"github.com/pixlcrashr/vsfv/pkg/db/repository"
	"gorm.io/gorm"
)

func RegisterRoutes(api huma.API, db *gorm.DB) {
	h := NewHandler(repository.NewAccountGroupAssignmentRepository(db))

	huma.Register(api, huma.Operation{
		OperationID: "list-account-group-assignments",
		Method:      http.MethodGet,
		Path:        "/v1/accountGroups/{accountGroupId}/assignments",
		Summary:     "List account group assignments",
		Tags:        []string{"Account Group Assignments"},
	}, h.List)

	huma.Register(api, huma.Operation{
		OperationID: "get-account-group-assignment",
		Method:      http.MethodGet,
		Path:        "/v1/accountGroups/{accountGroupId}/assignments/{assignmentId}",
		Summary:     "Get an account group assignment",
		Tags:        []string{"Account Group Assignments"},
	}, h.Get)

	huma.Register(api, huma.Operation{
		OperationID: "create-account-group-assignment",
		Method:      http.MethodPost,
		Path:        "/v1/accountGroups/{accountGroupId}/assignments",
		Summary:     "Create an account group assignment",
		Tags:        []string{"Account Group Assignments"},
	}, h.Create)

	huma.Register(api, huma.Operation{
		OperationID: "update-account-group-assignment",
		Method:      http.MethodPatch,
		Path:        "/v1/accountGroups/{accountGroupId}/assignments/{assignmentId}",
		Summary:     "Update an account group assignment",
		Tags:        []string{"Account Group Assignments"},
	}, h.Update)

	huma.Register(api, huma.Operation{
		OperationID: "delete-account-group-assignment",
		Method:      http.MethodDelete,
		Path:        "/v1/accountGroups/{accountGroupId}/assignments/{assignmentId}",
		Summary:     "Delete an account group assignment",
		Tags:        []string{"Account Group Assignments"},
	}, h.Delete)
}
