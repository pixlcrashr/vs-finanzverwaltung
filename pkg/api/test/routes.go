package test

import (
	"context"
	"fmt"
	"net/http"

	"github.com/danielgtaylor/huma/v2"
)

// TestInput defines the query parameters for GET /api/v1/test.
type TestInput struct {
	// Optional free-text filter. Huma validates maxLength automatically.
	Name string `query:"name" doc:"Optional name to greet" example:"world" maxLength:"50"`

	// Optional integer with an inclusive range constraint.
	Count int `query:"count" doc:"How many times to repeat the greeting" minimum:"1" maximum:"100" default:"1"`
}

// TestOutput is the response body for GET /api/v1/test.
type TestOutput struct {
	Body struct {
		Message string `json:"message" doc:"Status message" example:"Hello, world!"`
	}
}

// RegisterRoutes mounts all routes for the test domain onto api.
func RegisterRoutes(api huma.API) {
	huma.Register(api, huma.Operation{
		OperationID: "get-test",
		Method:      http.MethodGet,
		Path:        "/api/v1/test",
		Summary:     "Health / test endpoint",
		Tags:        []string{"Test"},
	}, func(_ context.Context, input *TestInput) (*TestOutput, error) {
		name := input.Name
		if name == "" {
			name = "world"
		}

		msg := fmt.Sprintf("Hello, %s!", name)
		if input.Count > 1 {
			msg = fmt.Sprintf("%s (×%d)", msg, input.Count)
		}

		resp := &TestOutput{}
		resp.Body.Message = msg
		return resp, nil
	})
}
