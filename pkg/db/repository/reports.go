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
	ErrReportNotFound      = errors.New("report not found")
	ErrReportAlreadyExists = errors.New("report already exists")
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
		return nil, 0, fmt.Errorf("count reports page=%d: %w", params.Page, err)
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
		return nil, 0, fmt.Errorf("list reports page=%d: %w", params.Page, err)
	}

	return ms, total, nil
}

// GetByID returns the report with the given ID.
func (r *ReportRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.Report, error) {
	m, err := r.q.Report.WithContext(ctx).Where(r.q.Report.ID.Eq(id)).First()
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.Join(ErrReportNotFound, fmt.Errorf("id=%s: %w", id, err))
		}
		return nil, fmt.Errorf("get report id=%s: %w", id, err)
	}
	return m, nil
}

// CreateReportParams holds the fields required to create a report.
type CreateReportParams struct {
	OrganizationID uuid.UUID
	DisplayName    string
	Data           []byte
	CustomID       string
}

// Create inserts a new report.
func (r *ReportRepository) Create(ctx context.Context, params CreateReportParams) (*model.Report, error) {
	orgCount, err := r.q.Organization.WithContext(ctx).Where(r.q.Organization.ID.Eq(params.OrganizationID)).Count()
	if err != nil {
		return nil, fmt.Errorf("create report: check organization organization_id=%s: %w", params.OrganizationID, err)
	}
	if orgCount == 0 {
		return nil, errors.Join(ErrOrganizationNotFound, fmt.Errorf("organization_id=%s: %w", params.OrganizationID, gorm.ErrRecordNotFound))
	}
	m := &model.Report{
		OrganizationID: params.OrganizationID,
		DisplayName:    params.DisplayName,
		Data:           params.Data,
		CustomID:       params.CustomID,
	}
	if err := r.q.Report.WithContext(ctx).Create(m); err != nil {
		if errors.Is(err, gorm.ErrDuplicatedKey) {
			return nil, errors.Join(ErrReportAlreadyExists, fmt.Errorf("organization_id=%s custom_id=%s: %w", m.OrganizationID, m.CustomID, err))
		}
		return nil, fmt.Errorf("create report: %w", err)
	}
	return m, nil
}

// Delete removes the report with the given ID.
func (r *ReportRepository) Delete(ctx context.Context, id uuid.UUID) error {
	result, err := r.q.Report.WithContext(ctx).Where(r.q.Report.ID.Eq(id)).Delete()
	if err != nil {
		return fmt.Errorf("delete report id=%s: %w", id, err)
	}
	if result.RowsAffected == 0 {
		return errors.Join(ErrReportNotFound, fmt.Errorf("id=%s: %w", id, gorm.ErrRecordNotFound))
	}
	return nil
}
