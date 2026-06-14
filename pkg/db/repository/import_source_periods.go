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
	"gorm.io/gorm"
)

var (
	ErrImportSourcePeriodNotFound      = errors.New("import source period not found")
	ErrImportSourcePeriodAlreadyExists = errors.New("import source period already exists")
)

// ImportSourcePeriodOrderFieldMapper maps API order_by field names to database column names.
var ImportSourcePeriodOrderFieldMapper = order.FieldMapper{
	"year":       "year",
	"isClosed":   "is_closed",
	"createTime": "created_at",
	"updateTime": "updated_at",
}

// ListImportSourcePeriodsParams drives the List query.
type ListImportSourcePeriodsParams struct {
	ImportSourceID uuid.UUID
	// Cond is an optional abstract condition chain (AND/OR/NOT support).
	Cond cond.Cond
	// OrderBy specifies the sort field and direction as SQL expressions.
	OrderBy []order.Expr
	// Page number (1-indexed).
	Page int
	// PageSize caps the number of rows returned.
	PageSize int
}

// importSourcePeriodColumnMapper maps filter field names to database column names.
func importSourcePeriodColumnMapper(field string) (string, bool) {
	switch field {
	case "year":
		return "year", true
	case "is_closed":
		return "is_closed", true
	default:
		return "", false
	}
}

type ImportSourcePeriodRepository struct {
	db *gorm.DB
	q  *dao.Query
}

func NewImportSourcePeriodRepository(db *gorm.DB) *ImportSourcePeriodRepository {
	return &ImportSourcePeriodRepository{db: db, q: dao.Use(db)}
}

func (r *ImportSourcePeriodRepository) List(ctx context.Context, params ListImportSourcePeriodsParams) ([]*model.ImportSourcePeriod, int64, error) {
	if params.PageSize <= 0 {
		params.PageSize = 20
	}
	if params.Page <= 0 {
		params.Page = 1
	}

	db := r.db.WithContext(ctx).Table("import_source_periods").
		Where("import_source_id = ?", params.ImportSourceID)

	// Apply abstract condition chain
	db = cond.Apply(db, params.Cond, importSourcePeriodColumnMapper)

	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("count import source periods import_source_id=%s: %w", params.ImportSourceID, err)
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

	var ms []*model.ImportSourcePeriod
	if err := db.Find(&ms).Error; err != nil {
		return nil, 0, fmt.Errorf("list import source periods import_source_id=%s: %w", params.ImportSourceID, err)
	}

	return ms, total, nil
}

func (r *ImportSourcePeriodRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.ImportSourcePeriod, error) {
	m, err := r.q.ImportSourcePeriod.WithContext(ctx).Where(r.q.ImportSourcePeriod.ID.Eq(id)).First()
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.Join(ErrImportSourcePeriodNotFound, fmt.Errorf("id=%s: %w", id, err))
		}
		return nil, fmt.Errorf("get import source period id=%s: %w", id, err)
	}
	return m, nil
}

// CreateImportSourcePeriodParams holds the fields required to create an import source period.
type CreateImportSourcePeriodParams struct {
	OrganizationID uuid.UUID
	ImportSourceID uuid.UUID
	Year           int
	IsClosed       bool
	CustomID       string
}

func (r *ImportSourcePeriodRepository) Create(ctx context.Context, params CreateImportSourcePeriodParams) (*model.ImportSourcePeriod, error) {
	sourceCount, err := r.q.ImportSource.WithContext(ctx).Where(r.q.ImportSource.ID.Eq(params.ImportSourceID)).Count()
	if err != nil {
		return nil, fmt.Errorf("create import source period: check import source import_source_id=%s: %w", params.ImportSourceID, err)
	}
	if sourceCount == 0 {
		return nil, errors.Join(ErrImportSourceNotFound, fmt.Errorf("import_source_id=%s: %w", params.ImportSourceID, gorm.ErrRecordNotFound))
	}
	m := &model.ImportSourcePeriod{
		OrganizationID: params.OrganizationID,
		ImportSourceID: params.ImportSourceID,
		Year:           params.Year,
		IsClosed:       params.IsClosed,
		CustomID:       params.CustomID,
	}
	if err := r.q.ImportSourcePeriod.WithContext(ctx).Create(m); err != nil {
		if errors.Is(err, gorm.ErrDuplicatedKey) {
			return nil, errors.Join(ErrImportSourcePeriodAlreadyExists, fmt.Errorf("import_source_id=%s year=%d: %w", m.ImportSourceID, m.Year, err))
		}
		return nil, fmt.Errorf("create import source period import_source_id=%s: %w", m.ImportSourceID, err)
	}
	return m, nil
}

func (r *ImportSourcePeriodRepository) Update(ctx context.Context, m *model.ImportSourcePeriod) error {
	_, err := r.q.ImportSourcePeriod.WithContext(ctx).Where(r.q.ImportSourcePeriod.ID.Eq(m.ID)).Updates(m)
	if err != nil {
		return fmt.Errorf("update import source period id=%s: %w", m.ID, err)
	}
	return nil
}

func (r *ImportSourcePeriodRepository) Delete(ctx context.Context, id uuid.UUID) error {
	result, err := r.q.ImportSourcePeriod.WithContext(ctx).Where(r.q.ImportSourcePeriod.ID.Eq(id)).Delete()
	if err != nil {
		return fmt.Errorf("delete import source period id=%s: %w", id, err)
	}
	if result.RowsAffected == 0 {
		return errors.Join(ErrImportSourcePeriodNotFound, fmt.Errorf("id=%s: %w", id, gorm.ErrRecordNotFound))
	}
	return nil
}
