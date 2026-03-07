package repository

import (
	"context"
	"strings"

	"github.com/google/uuid"
	"github.com/pixlcrashr/go-pagetoken/order"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
	"github.com/pixlcrashr/vsfv/pkg/db/model/dao"
	"gorm.io/gorm"
)

// ListReportsParams drives the List query.
type ListReportsParams struct {
	// NamePrefix filters by name prefix.
	NamePrefix string
	// OrderBy specifies the ordering expression (e.g., "created_at desc").
	OrderBy order.Fields
	// Page number (1-indexed).
	Page int
	// PageSize caps the number of rows returned.
	PageSize int
}

// ReportRepository provides CRUD for reports table.
type ReportRepository struct {
	db *gorm.DB
	q  *dao.Query
}

// NewReportRepository creates a ReportRepository backed by db.
func NewReportRepository(db *gorm.DB) *ReportRepository {
	return &ReportRepository{db: db, q: dao.Use(db)}
}

// List returns reports matching params along with the total count.
func (r *ReportRepository) List(ctx context.Context, params ListReportsParams) ([]*model.Report, int64, error) {
	if params.PageSize <= 0 {
		params.PageSize = 20
	}
	if params.Page <= 0 {
		params.Page = 1
	}

	rp := r.q.Report.WithContext(ctx)

	if params.NamePrefix != "" {
		rp = rp.Where(r.q.Report.DisplayName.Lower().Like(strings.ToLower(params.NamePrefix) + "%"))
	}

	// Get total count before pagination
	total, err := rp.Count()
	if err != nil {
		return nil, 0, err
	}

	// Apply ordering
	if exprs := ResolveOrderBy(&r.q.Report, params.OrderBy); len(exprs) > 0 {
		for _, expr := range exprs {
			rp = rp.Order(expr)
		}
	} else {
		rp = rp.Order(r.q.Report.CreatedAt.Desc())
	}

	// Apply pagination
	offset := (params.Page - 1) * params.PageSize
	if offset > 0 {
		rp = rp.Offset(offset)
	}
	rp = rp.Limit(params.PageSize)

	ms, err := rp.Find()
	if err != nil {
		return nil, 0, err
	}

	return ms, total, nil
}

// GetByID returns the report with the given ID.
func (r *ReportRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.Report, error) {
	return r.q.Report.WithContext(ctx).Where(r.q.Report.ID.Eq(id)).First()
}

// Create inserts a new report.
func (r *ReportRepository) Create(ctx context.Context, m *model.Report) error {
	return r.q.Report.WithContext(ctx).Create(m)
}

// Delete removes the report with the given ID.
func (r *ReportRepository) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.q.Report.WithContext(ctx).Where(r.q.Report.ID.Eq(id)).Delete()
	return err
}
