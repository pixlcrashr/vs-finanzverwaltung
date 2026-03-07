package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/pixlcrashr/go-pagetoken/order"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
	"github.com/pixlcrashr/vsfv/pkg/db/model/dao"
	"gorm.io/gorm"
)

// ListImportSourcePeriodsParams drives the List query.
type ListImportSourcePeriodsParams struct {
	ImportSourceID uuid.UUID
	// OrderBy specifies the ordering expression (e.g., "year desc").
	OrderBy order.Fields
	// Page number (1-indexed).
	Page int
	// PageSize caps the number of rows returned.
	PageSize int
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

	isp := r.q.ImportSourcePeriod.WithContext(ctx).
		Where(r.q.ImportSourcePeriod.ImportSourceID.Eq(params.ImportSourceID))

	total, err := isp.Count()
	if err != nil {
		return nil, 0, err
	}

	// Apply ordering
	if exprs := ResolveOrderBy(&r.q.ImportSourcePeriod, params.OrderBy); len(exprs) > 0 {
		for _, expr := range exprs {
			isp = isp.Order(expr)
		}
	} else {
		isp = isp.Order(r.q.ImportSourcePeriod.Year.Desc())
	}

	offset := (params.Page - 1) * params.PageSize
	if offset > 0 {
		isp = isp.Offset(offset)
	}
	isp = isp.Limit(params.PageSize)

	ms, err := isp.Find()
	if err != nil {
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
