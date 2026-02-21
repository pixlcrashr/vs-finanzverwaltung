package items

import (
	"cmp"
	"context"
	"fmt"
	"math/rand"
	"net/http"
	"slices"
	"strconv"
	"strings"
	"time"

	"github.com/danielgtaylor/huma/v2"
	"github.com/gofiber/fiber/v2/log"
	"github.com/pixlcrashr/vsfv/pkg/api/pagetoken"
	"go.einride.tech/aip/ordering"
)

// Item is a single record in the test dataset.
type Item struct {
	ID        string    `json:"id"         doc:"Unique item identifier" example:"item-001"`
	Name      string    `json:"name"       doc:"Item name"              example:"bright-cloud"`
	Score     int       `json:"score"      doc:"Random score 0-999"     example:"42"`
	CreatedAt time.Time `json:"created_at" doc:"Creation timestamp"     example:"2025-10-15T12:00:00Z"`
}

// dataset is a fixed in-memory set of 100 items.
// The seed is fixed so results are reproducible across restarts.
var dataset []Item

func init() {
	adjectives := []string{"red", "blue", "green", "fast", "slow", "bright", "dark", "tall", "small", "round"}
	nouns := []string{"apple", "bridge", "cloud", "delta", "ember", "flame", "grove", "haven", "iris", "jewel"}

	t := time.Now().Add(-time.Hour * 24 * 2)

	rng := rand.New(rand.NewSource(42))
	for i := range 100 {
		dataset = append(dataset, Item{
			ID:        fmt.Sprintf("item-%03d", i+1),
			Name:      fmt.Sprintf("%s-%s", adjectives[rng.Intn(len(adjectives))], nouns[rng.Intn(len(nouns))]),
			Score:     rng.Intn(1000),
			CreatedAt: t.Add(time.Hour * time.Duration(rng.Int63n(48))),
		})
	}
}

// ---------------------------------------------------------------------------
// Request / filter types
// ---------------------------------------------------------------------------

// ListItemsInput implements pagination.Request[ListItemsFilter].
type ListItemsInput struct {
	Name      string `query:"name"       doc:"Case-insensitive prefix filter on item name"                      maxLength:"50"`
	OrderBy   string `query:"order_by"   doc:"Sort expression e.g. 'score desc, name'. Available fields: id, name, score, created_at"`
	PageSize  int    `query:"page_size"  doc:"Items per page (max 10)"                                          minimum:"1" maximum:"10" default:"10"`
	PageToken string `query:"page_token" doc:"Opaque token returned by the previous response; omit for page 1" maxLength:"512"`
}

func (i *ListItemsInput) GetPageToken() string { return i.PageToken }
func (i *ListItemsInput) GetChecksumFields() []func(*pagetoken.ChecksumBuilder) {
	return []func(*pagetoken.ChecksumBuilder){
		pagetoken.ChecksumField("name", i.Name),
		pagetoken.ChecksumField("order_by", i.OrderBy),
	}
}

type ListItemsOutput struct {
	Body struct {
		Items         []Item `json:"items"`
		NextPageToken string `json:"next_page_token" doc:"Pass as page_token on the next request; empty on the last page"`
	}
}

// ---------------------------------------------------------------------------
// Keyset helpers
// ---------------------------------------------------------------------------

// itemFieldValue returns the typed value of the named field.
// Types must match the gob.Register calls in init().
func itemFieldValue(item Item, path string) string {
	switch path {
	case "id":
		return item.ID
	case "name":
		return item.Name
	case "score":
		return strconv.Itoa(item.Score)
	case "created_at":
		return item.CreatedAt.Format(time.RFC3339)
	default:
		return ""
	}
}

// compareToKeyset returns the ordering relation of item relative to the keyset
// cursor encoded in tok:
//
//	> 0  item comes after the cursor  (belongs to the next page or later)
//	== 0 item IS the cursor boundary  (first item of the next page)
//	< 0  item comes before the cursor (already returned in a previous page)
func compareToKeyset(item Item, tok *pagetoken.Cursor) int {
	for _, cf := range tok.Fields() {
		var n int
		switch cf.Path {
		case "id":
			n = cmp.Compare(item.ID, cf.Value)
		case "name":
			n = cmp.Compare(item.Name, cf.Value)
		case "score":
			s, err := strconv.Atoi(cf.Value)
			if err != nil {
				return 0
			}
			n = cmp.Compare(item.Score, s)
		case "created_at":
			t, err := time.Parse(time.RFC3339, cf.Value)
			if err != nil {
				return 0
			}
			n = item.CreatedAt.Compare(t)
		}
		if n != 0 {
			if cf.Order == pagetoken.OrderDesc {
				return -n
			}
			return n
		}
	}
	return 0
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

func RegisterRoutes(api huma.API) {
	e, err := pagetoken.NewEncryptor([]byte{0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15})
	if err != nil {
		panic(err)
	}

	huma.Register(api, huma.Operation{
		OperationID: "list-items",
		Method:      http.MethodGet,
		Path:        "/api/v1/items",
		Summary:     "List items (paginated)",
		Description: "Returns up to 10 items per page from a 100-entry in-memory dataset. " +
			"Uses keyset (seek) pagination: the token encodes the actual field values of the " +
			"first item of the next page, not a numeric offset. " +
			"id is always appended as a tiebreaker to guarantee a stable total order.",
		Tags: []string{"Items"},
	}, func(_ context.Context, input *ListItemsInput) (*ListItemsOutput, error) {
		// 1. Parse and validate order_by.
		order := &ordering.OrderBy{}
		if err := order.UnmarshalString(input.OrderBy); err != nil {
			return nil, huma.Error400BadRequest("invalid order_by", err)
		}
		if err := order.ValidateForPaths("id", "name", "score", "created_at"); err != nil {
			return nil, huma.Error400BadRequest("invalid order_by", err)
		}

		// Always append id as a tiebreaker so the total order is stable even when
		// all user-specified fields are tied. Mirrors real SQL: ORDER BY score DESC, id.
		effectiveFields := make([]ordering.Field, 0, len(order.Fields)+1)
		effectiveFields = append(effectiveFields, order.Fields...)
		if !slices.ContainsFunc(order.Fields, func(f ordering.Field) bool { return f.Path == "id" }) {
			effectiveFields = append(effectiveFields, ordering.Field{Path: "id"})
		}

		c, err := pagetoken.FromRequest(e, input)
		if err != nil {
			return nil, huma.Error400BadRequest("invalid page_token", err)
		}

		// 3. Filter.
		prefix := strings.ToLower(input.Name)
		filtered := make([]Item, 0, len(dataset))
		for _, item := range dataset {
			if prefix == "" || strings.HasPrefix(strings.ToLower(item.Name), prefix) {
				filtered = append(filtered, item)
			}
		}

		// 4. Sort by effectiveFields (user fields + id tiebreaker).
		slices.SortStableFunc(filtered, func(a, b Item) int {
			for _, f := range effectiveFields {
				var n int
				switch f.Path {
				case "id":
					n = cmp.Compare(a.ID, b.ID)
				case "name":
					n = cmp.Compare(a.Name, b.Name)
				case "score":
					n = cmp.Compare(a.Score, b.Score)
				case "created_at":
					n = a.CreatedAt.Compare(b.CreatedAt)
				}
				if n != 0 {
					if f.Desc {
						return -n
					}
					return n
				}
			}
			return 0
		})

		// 5. Seek to the cursor position.
		// tok.CursorFields is empty on the first page; BinarySearchFunc finds the first
		// item whose sort position >= the cursor (first item of next page).
		startIdx := 0
		if len(c.Fields()) > 0 {
			startIdx, _ = slices.BinarySearchFunc(filtered, c, compareToKeyset)
		}

		resp := &ListItemsOutput{}

		if startIdx >= len(filtered) {
			resp.Body.Items = []Item{}
			return resp, nil
		}

		end := min(startIdx+input.PageSize, len(filtered))
		resp.Body.Items = filtered[startIdx:end]
		log.Info(e, c)

		// 6. Emit next token pointing at the first item of the following page.
		if end < len(filtered) {
			nextItem := filtered[end]
			opts := make([]pagetoken.CursorOpt, len(effectiveFields))
			for i, f := range effectiveFields {
				ord := pagetoken.OrderAsc
				if f.Desc {
					ord = pagetoken.OrderDesc
				}
				opts[i] = pagetoken.Field(f.Path, itemFieldValue(nextItem, f.Path), ord)
			}

			log.Info(len(opts))

			log.Info(e, c)
			nextToken := c.Next(opts...)
			nextTokenStr, err := nextToken.String()
			if err != nil {
				return nil, huma.Error500InternalServerError("failed to generate next page token", err)
			}
			resp.Body.NextPageToken = nextTokenStr
		}

		return resp, nil
	})
}
