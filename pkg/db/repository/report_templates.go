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

// ListReportTemplatesParams drives the List query.
type ListReportTemplatesParams struct {
	// Cond is an optional abstract condition chain (AND/OR/NOT support).
	Cond cond.Cond
	// OrderBy specifies the ordering expression (e.g., "created_at desc").
	OrderBy order.Fields
	// Page number (1-indexed).
	Page int
	// PageSize caps the number of rows returned.
	PageSize int
}

// reportTemplateColumnMapper maps filter field names to database column names.
func reportTemplateColumnMapper(field string) (string, bool) {
	switch field {
	case "display_name":
		return "display_name", true
	default:
		return "", false
	}
}

// ReportTemplateRepository provides CRUD for report_templates table.
type ReportTemplateRepository struct {
	db *gorm.DB
	q  *dao.Query
}

// NewReportTemplateRepository creates a ReportTemplateRepository backed by db.
func NewReportTemplateRepository(db *gorm.DB) *ReportTemplateRepository {
	return &ReportTemplateRepository{db: db, q: dao.Use(db)}
}

// List returns report templates matching params along with the total count.
func (r *ReportTemplateRepository) List(ctx context.Context, params ListReportTemplatesParams) ([]*model.ReportTemplate, int64, error) {
	if params.PageSize <= 0 {
		params.PageSize = 20
	}
	if params.Page <= 0 {
		params.Page = 1
	}

	db := r.db.WithContext(ctx).Table("report_templates")

	// Apply abstract condition chain
	db = cond.Apply(db, params.Cond, reportTemplateColumnMapper)

	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if params.Cond != nil && !params.Cond.IsEmpty() {
		db = db.Order("created_at DESC")
	} else {
		if exprs := ResolveOrderBy(&r.q.ReportTemplate, params.OrderBy); len(exprs) > 0 {
			for _, expr := range exprs {
				db = db.Order(expr)
			}
		} else {
			db = db.Order("created_at DESC")
		}
	}

	offset := (params.Page - 1) * params.PageSize
	if offset > 0 {
		db = db.Offset(offset)
	}
	db = db.Limit(params.PageSize)

	var ms []*model.ReportTemplate
	if err := db.Find(&ms).Error; err != nil {
		return nil, 0, err
	}

	return ms, total, nil
}

// GetByID returns the report template with the given ID.
func (r *ReportTemplateRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.ReportTemplate, error) {
	return r.q.ReportTemplate.WithContext(ctx).Where(r.q.ReportTemplate.ID.Eq(id)).First()
}

// Create inserts a new report template.
func (r *ReportTemplateRepository) Create(ctx context.Context, m *model.ReportTemplate) error {
	return r.q.ReportTemplate.WithContext(ctx).Create(m)
}

// Update updates fields of an existing report template.
func (r *ReportTemplateRepository) Update(ctx context.Context, m *model.ReportTemplate) error {
	_, err := r.q.ReportTemplate.WithContext(ctx).Where(r.q.ReportTemplate.ID.Eq(m.ID)).Updates(m)
	return err
}

// Delete removes the report template with the given ID.
func (r *ReportTemplateRepository) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.q.ReportTemplate.WithContext(ctx).Where(r.q.ReportTemplate.ID.Eq(id)).Delete()
	return err
}
