package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
	"github.com/pixlcrashr/vsfv/pkg/db/model/dao"
	"github.com/pixlcrashr/vsfv/pkg/query/cond"
	"github.com/pixlcrashr/vsfv/pkg/query/order"
	"gorm.io/gorm"
)

// ReportOrderFieldMapper maps API order_by field names to database column names.
var ReportOrderFieldMapper = order.FieldMapper{
	"displayName": "display_name",
	"createTime":  "created_at",
}

// ListReportsParams drives the List query.
type ListReportsParams struct {
	// Cond is an optional abstract condition chain (AND/OR/NOT support).
	Cond cond.Cond
	// OrderBy specifies the sort field and direction as SQL expressions.
	OrderBy []order.Expr
	// Page number (1-indexed).
	Page int
	// PageSize caps the number of rows returned.
	PageSize int
}

// reportColumnMapper maps filter field names to database column names.
func reportColumnMapper(field string) (string, bool) {
	switch field {
	case "display_name":
		return "display_name", true
	default:
		return "", false
	}
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

	db := r.db.WithContext(ctx).Table("reports")

	// Apply abstract condition chain
	db = cond.Apply(db, params.Cond, reportColumnMapper)

	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if len(params.OrderBy) > 0 {
		for _, expr := range params.OrderBy {
			db = db.Order(expr.String())
		}
	} else {
		db = db.Order("created_at DESC")
	}

	offset := (params.Page - 1) * params.PageSize
	if offset > 0 {
		db = db.Offset(offset)
	}
	db = db.Limit(params.PageSize)

	var ms []*model.Report
	if err := db.Find(&ms).Error; err != nil {
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
