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
	ErrReportTemplateNotFound      = errors.New("report template not found")
	ErrReportTemplateAlreadyExists = errors.New("report template already exists")
)

// ReportTemplateOrderFieldMapper maps API order_by field names to database column names.
var ReportTemplateOrderFieldMapper = order.FieldMapper{
	"displayName": "display_name",
	"createTime":  "created_at",
	"updateTime":  "updated_at",
}

// ListReportTemplatesParams drives the List query.
type ListReportTemplatesParams struct {
	// Cond is an optional abstract condition chain (AND/OR/NOT support).
	Cond cond.Cond
	// OrderBy specifies the sort field and direction as SQL expressions.
	OrderBy []order.Expr
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
		return nil, 0, fmt.Errorf("count report templates page=%d: %w", params.Page, err)
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

	var ms []*model.ReportTemplate
	if err := db.Find(&ms).Error; err != nil {
		return nil, 0, fmt.Errorf("list report templates page=%d: %w", params.Page, err)
	}

	return ms, total, nil
}

// GetByID returns the report template with the given ID.
func (r *ReportTemplateRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.ReportTemplate, error) {
	m, err := r.q.ReportTemplate.WithContext(ctx).Where(r.q.ReportTemplate.ID.Eq(id)).First()
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.Join(ErrReportTemplateNotFound, fmt.Errorf("id=%s: %w", id, err))
		}
		return nil, fmt.Errorf("get report template id=%s: %w", id, err)
	}
	return m, nil
}

// CreateReportTemplateParams holds the fields required to create a report template.
type CreateReportTemplateParams struct {
	OrganizationID uuid.UUID
	DisplayName    string
	Template       string
	CustomID       string
}

// Create inserts a new report template.
func (r *ReportTemplateRepository) Create(ctx context.Context, params CreateReportTemplateParams) (*model.ReportTemplate, error) {
	orgCount, err := r.q.Organization.WithContext(ctx).Where(r.q.Organization.ID.Eq(params.OrganizationID)).Count()
	if err != nil {
		return nil, fmt.Errorf("create report template: check organization organization_id=%s: %w", params.OrganizationID, err)
	}
	if orgCount == 0 {
		return nil, errors.Join(ErrOrganizationNotFound, fmt.Errorf("organization_id=%s: %w", params.OrganizationID, gorm.ErrRecordNotFound))
	}
	m := &model.ReportTemplate{
		OrganizationID: params.OrganizationID,
		DisplayName:    params.DisplayName,
		Template:       params.Template,
		CustomID:       params.CustomID,
	}
	if err := r.q.ReportTemplate.WithContext(ctx).Create(m); err != nil {
		if errors.Is(err, gorm.ErrDuplicatedKey) {
			return nil, errors.Join(ErrReportTemplateAlreadyExists, fmt.Errorf("organization_id=%s custom_id=%s: %w", m.OrganizationID, m.CustomID, err))
		}
		return nil, fmt.Errorf("create report template: %w", err)
	}
	return m, nil
}

// UpdateReportTemplateParams holds the fields that can be updated for a report template.
type UpdateReportTemplateParams struct {
	DisplayName optional.Optional[string]
	Template    optional.Optional[string]
	CustomID    optional.Optional[string]
}

// Update updates fields of an existing report template.
func (r *ReportTemplateRepository) Update(ctx context.Context, id uuid.UUID, params UpdateReportTemplateParams) error {
	var cols []field.AssignExpr

	if params.DisplayName.IsSet {
		cols = append(cols, r.q.ReportTemplate.DisplayName.Value(params.DisplayName.Value))
	}

	if params.Template.IsSet {
		cols = append(cols, r.q.ReportTemplate.Template.Value(params.Template.Value))
	}

	if params.CustomID.IsSet {
		cols = append(cols, r.q.ReportTemplate.CustomID.Value(params.CustomID.Value))
	}

	if len(cols) == 0 {
		return nil
	}

	if _, err := r.q.ReportTemplate.WithContext(ctx).Where(r.q.ReportTemplate.ID.Eq(id)).UpdateSimple(cols...); err != nil {
		return fmt.Errorf("update report template id=%s: %w", id, err)
	}

	return nil
}

// Delete removes the report template with the given ID.
func (r *ReportTemplateRepository) Delete(ctx context.Context, id uuid.UUID) error {
	result, err := r.q.ReportTemplate.WithContext(ctx).Where(r.q.ReportTemplate.ID.Eq(id)).Delete()
	if err != nil {
		return fmt.Errorf("delete report template id=%s: %w", id, err)
	}
	if result.RowsAffected == 0 {
		return errors.Join(ErrReportTemplateNotFound, fmt.Errorf("id=%s: %w", id, gorm.ErrRecordNotFound))
	}
	return nil
}
