package accountsexample

import (
	"net/http"

	"github.com/danielgtaylor/huma/v2"
	"github.com/pixlcrashr/go-pagetoken/encryption"
	"github.com/pixlcrashr/vsfv/pkg/db/repository"
	"gorm.io/gorm"
)

func RegisterRoutes(api huma.API, db *gorm.DB) {
	k, err := encryption.Rand32ByteKey()
	if err != nil {
		panic(err)
	}

	e, err := encryption.NewAEADEncryptor(k)
	if err != nil {
		panic(err)
	}

	h := &Handler{
		r: repository.NewAccountRepository(db),
		e: e,
	}

	huma.Register(api, huma.Operation{
		OperationID: "list-accountsexample",
		Method:      http.MethodGet,
		Path:        "/api/v1/accountsexample",
		Summary:     "",
		Tags:        []string{"Test"},
	}, h.ListAccounts)
}
