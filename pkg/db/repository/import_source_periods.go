package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/pixlcrashr/go-pagetoken/order"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
	"github.com/pixlcrashr/vsfv/pkg/db/model/dao"
	"github.com/pixlcrashr/vsfv/pkg/query/cond"
	"gorm.io/gorm"
)

// ListImportSourcePeriodsParams drives the List query.
type ListImportSourcePeriodsParams struct {
	ImportSourceID uuid.UUID
	// Cond is an optional abstract condition chain (AND/OR/NOT support).
	Cond cond.Cond
	// OrderBy specifies the ordering expression (e.g., "year desc").
	OrderBy order.Fields
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
		return nil, 0, err
	}

	if params.Cond != nil && !params.Cond.IsEmpty() {
		db = db.Order("year DESC")
	} else {
		if exprs := ResolveOrderBy(&r.q.ImportSourcePeriod, params.OrderBy); len(exprs) > 0 {
			for _, expr := range exprs {
				db = db.Order(expr)
			}
		} else {
			db = db.Order("year DESC")
		}
	}

	offset := (params.Page - 1) * params.PageSize
	if offset > 0 {
		db = db.Offset(offset)
	}
	db = db.Limit(params.PageSize)

	var ms []*model.ImportSourcePeriod
	if err := db.Find(&ms).Error; err != nil {
		return nil, 0, err
	}

	return ms, total, nil
}

func (r *ImportSourcePeriodRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.ImportSourcePeriod, error) {
	return r.q.ImportSourcePeriod.WithContext(ctx).Where(r.q.ImportSourcePeriod.ID.Eq(id)).First()
}

func (r *ImportSourcePeriodRepository) Create(ctx context.Context, m *model.ImportSourcePeriod) error {
	return r.q.ImportSourcePeriod.WithContext(ctx).Create(m)
}

func (r *ImportSourcePeriodRepository) Update(ctx context.Context, m *model.ImportSourcePeriod) error {
	_, err := r.q.ImportSourcePeriod.WithContext(ctx).Where(r.q.ImportSourcePeriod.ID.Eq(m.ID)).Updates(m)
	return err
}

func (r *ImportSourcePeriodRepository) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.q.ImportSourcePeriod.WithContext(ctx).Where(r.q.ImportSourcePeriod.ID.Eq(id)).Delete()
	return err
}
