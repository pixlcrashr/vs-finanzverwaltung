package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
	"github.com/pixlcrashr/vsfv/pkg/db/model/dao"
	"github.com/pixlcrashr/vsfv/pkg/query/cond"
	"github.com/pixlcrashr/vsfv/pkg/query/order"
	"github.com/theater-improrama/go-utils/optional"
	"gorm.io/gen/field"
	"gorm.io/gorm"
)

var (
	ErrLedgerYearNotFound      = errors.New("ledger year not found")
	ErrLedgerYearAlreadyExists = errors.New("ledger year already exists")
)

// LedgerYearOrderFieldMapper maps API order_by field names to database column names.
var LedgerYearOrderFieldMapper = order.FieldMapper{
	"year":       "year",
	"isClosed":   "is_closed",
	"createTime": "created_at",
	"updateTime": "updated_at",
}

// ListLedgerYearsParams drives the List query.
type ListLedgerYearsParams struct {
	OrganizationID uuid.UUID
	// Cond is an optional abstract condition chain (AND/OR/NOT support).
	Cond cond.Cond
	// OrderBy specifies the sort field and direction as SQL expressions.
	OrderBy []order.Expr
	// Page number (1-indexed).
	Page int
	// PageSize caps the number of rows returned.
	PageSize int
}

// ledgerYearColumnMapper maps filter field names to database column names.
func ledgerYearColumnMapper(field string) (string, bool) {
	switch field {
	case "year":
		return "year", true
	case "is_closed":
		return "is_closed", true
	default:
		return "", false
	}
}

type LedgerYearRepository struct {
	db *gorm.DB
	q  *dao.Query
}

func NewLedgerYearRepository(db *gorm.DB) *LedgerYearRepository {
	return &LedgerYearRepository{db: db, q: dao.Use(db)}
}

func (r *LedgerYearRepository) List(ctx context.Context, params ListLedgerYearsParams) ([]*model.LedgerYear, int64, error) {
	if params.PageSize <= 0 {
		params.PageSize = 20
	}
	if params.Page <= 0 {
		params.Page = 1
	}

	db := r.db.WithContext(ctx).Table("ledger_years").
		Where("organization_id = ?", params.OrganizationID)

	// Apply abstract condition chain
	db = cond.Apply(db, params.Cond, ledgerYearColumnMapper)

	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("count ledger years organization_id=%s: %w", params.OrganizationID, err)
	}

	if len(params.OrderBy) > 0 {
		for _, expr := range params.OrderBy {
			db = db.Order(expr.String())
		}
	} else {
		db = db.Order("year DESC")
	}

	offset := (params.Page - 1) * params.PageSize
	if offset > 0 {
		db = db.Offset(offset)
	}
	db = db.Limit(params.PageSize)

	var ms []*model.LedgerYear
	if err := db.Find(&ms).Error; err != nil {
		return nil, 0, fmt.Errorf("list ledger years organization_id=%s: %w", params.OrganizationID, err)
	}

	return ms, total, nil
}

func (r *LedgerYearRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.LedgerYear, error) {
	m, err := r.q.LedgerYear.WithContext(ctx).Where(r.q.LedgerYear.ID.Eq(id)).First()
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.Join(ErrLedgerYearNotFound, fmt.Errorf("id=%s: %w", id, err))
		}
		return nil, fmt.Errorf("get ledger year id=%s: %w", id, err)
	}
	return m, nil
}

// CreateLedgerYearParams holds the fields required to create a ledger year.
type CreateLedgerYearParams struct {
	OrganizationID uuid.UUID
	Year           int
	IsClosed       bool
	CustomID       string
}

func (r *LedgerYearRepository) Create(ctx context.Context, params CreateLedgerYearParams) (*model.LedgerYear, error) {
	orgCount, err := r.q.Organization.WithContext(ctx).Where(r.q.Organization.ID.Eq(params.OrganizationID)).Count()
	if err != nil {
		return nil, fmt.Errorf("create ledger year: check organization organization_id=%s: %w", params.OrganizationID, err)
	}
	if orgCount == 0 {
		return nil, errors.Join(ErrOrganizationNotFound, fmt.Errorf("organization_id=%s: %w", params.OrganizationID, gorm.ErrRecordNotFound))
	}
	m := &model.LedgerYear{
		OrganizationID: params.OrganizationID,
		Year:           params.Year,
		IsClosed:       params.IsClosed,
		CustomID:       params.CustomID,
	}
	if err := r.q.LedgerYear.WithContext(ctx).Create(m); err != nil {
		if errors.Is(err, gorm.ErrDuplicatedKey) {
			return nil, errors.Join(ErrLedgerYearAlreadyExists, fmt.Errorf("organization_id=%s year=%d: %w", m.OrganizationID, m.Year, err))
		}
		return nil, fmt.Errorf("create ledger year organization_id=%s: %w", m.OrganizationID, err)
	}
	return m, nil
}

// UpdateLedgerYearParams holds the fields that can be updated for a ledger year.
type UpdateLedgerYearParams struct {
	Year     optional.Optional[int]
	IsClosed optional.Optional[bool]
	CustomID optional.Optional[string]
}

// Update updates fields of an existing ledger year.
func (r *LedgerYearRepository) Update(ctx context.Context, id uuid.UUID, params UpdateLedgerYearParams) error {
	var cols []field.AssignExpr

	if params.Year.IsSet {
		cols = append(cols, r.q.LedgerYear.Year.Value(params.Year.Value))
	}

	if params.IsClosed.IsSet {
		cols = append(cols, r.q.LedgerYear.IsClosed.Value(params.IsClosed.Value))
	}

	if params.CustomID.IsSet {
		cols = append(cols, r.q.LedgerYear.CustomID.Value(params.CustomID.Value))
	}

	if len(cols) == 0 {
		return nil
	}

	if _, err := r.q.LedgerYear.WithContext(ctx).Where(r.q.LedgerYear.ID.Eq(id)).UpdateSimple(cols...); err != nil {
		return fmt.Errorf("update ledger year id=%s: %w", id, err)
	}

	return nil
}

func (r *LedgerYearRepository) Delete(ctx context.Context, id uuid.UUID) error {
	result, err := r.q.LedgerYear.WithContext(ctx).Where(r.q.LedgerYear.ID.Eq(id)).Delete()
	if err != nil {
		return fmt.Errorf("delete ledger year id=%s: %w", id, err)
	}
	if result.RowsAffected == 0 {
		return errors.Join(ErrLedgerYearNotFound, fmt.Errorf("id=%s: %w", id, gorm.ErrRecordNotFound))
	}
	return nil
}
