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

// ListReportTemplatesParams drives the List query.
type ListReportTemplatesParams struct {
	// NamePrefix filters by name prefix.
	NamePrefix string
	// OrderBy specifies the ordering expression (e.g., "created_at desc").
	OrderBy order.Fields
	// Page number (1-indexed).
	Page int
	// PageSize caps the number of rows returned.
	PageSize int
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

	rt := r.q.ReportTemplate.WithContext(ctx)

	if params.NamePrefix != "" {
		rt = rt.Where(r.q.ReportTemplate.DisplayName.Lower().Like(strings.ToLower(params.NamePrefix) + "%"))
	}

	// Get total count before pagination
	total, err := rt.Count()
	if err != nil {
		return nil, 0, err
	}

	// Apply ordering
	if exprs := ResolveOrderBy(&r.q.ReportTemplate, params.OrderBy); len(exprs) > 0 {
		for _, expr := range exprs {
			rt = rt.Order(expr)
		}
	} else {
		rt = rt.Order(r.q.ReportTemplate.CreatedAt.Desc())
	}

	// Apply pagination
	offset := (params.Page - 1) * params.PageSize
	if offset > 0 {
		rt = rt.Offset(offset)
	}
	rt = rt.Limit(params.PageSize)

	ms, err := rt.Find()
	if err != nil {
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
