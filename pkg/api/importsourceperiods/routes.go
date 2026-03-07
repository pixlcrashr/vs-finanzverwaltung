package importsourceperiods

import (
	"net/http"

	"github.com/danielgtaylor/huma/v2"
	"github.com/pixlcrashr/vsfv/pkg/db/repository"
	"gorm.io/gorm"
)

func RegisterRoutes(api huma.API, db *gorm.DB) {
	h := NewHandler(repository.NewImportSourcePeriodRepository(db))

	huma.Register(api, huma.Operation{
		OperationID: "list-import-source-periods",
		Method:      http.MethodGet,
		Path:        "/v1/importSources/{importSourceId}/periods",
		Summary:     "List import source periods",
		Tags:        []string{"Import Source Periods"},
	}, h.List)

	huma.Register(api, huma.Operation{
		OperationID: "get-import-source-period",
		Method:      http.MethodGet,
		Path:        "/v1/importSources/{importSourceId}/periods/{periodId}",
		Summary:     "Get an import source period",
		Tags:        []string{"Import Source Periods"},
	}, h.Get)

	huma.Register(api, huma.Operation{
		OperationID: "create-import-source-period",
		Method:      http.MethodPost,
		Path:        "/v1/importSources/{importSourceId}/periods",
		Summary:     "Create an import source period",
		Tags:        []string{"Import Source Periods"},
	}, h.Create)

	huma.Register(api, huma.Operation{
		OperationID: "close-import-source-period",
		Method:      http.MethodPost,
		Path:        "/v1/importSources/{importSourceId}/periods/{periodId}:close",
		Summary:     "Close an import source period",
		Tags:        []string{"Import Source Periods"},
	}, h.Close)

	huma.Register(api, huma.Operation{
		OperationID: "delete-import-source-period",
		Method:      http.MethodDelete,
		Path:        "/v1/importSources/{importSourceId}/periods/{periodId}",
		Summary:     "Delete an import source period",
		Tags:        []string{"Import Source Periods"},
	}, h.Delete)
}
