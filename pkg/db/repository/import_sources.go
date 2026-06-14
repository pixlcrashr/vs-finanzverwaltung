package repository

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
	"github.com/pixlcrashr/vsfv/pkg/db/model/dao"
	"github.com/pixlcrashr/vsfv/pkg/query/cond"
	"github.com/pixlcrashr/vsfv/pkg/query/order"
	"gorm.io/gorm"
)

var (
	ErrImportSourceNotFound      = errors.New("import source not found")
	ErrImportSourceAlreadyExists = errors.New("import source already exists")
)

// ImportSourceOrderFieldMapper maps API order_by field names to database column names.
var ImportSourceOrderFieldMapper = order.FieldMapper{
	"displayName":        "display_name",
	"displayDescription": "display_description",
	"createTime":         "created_at",
	"updateTime":         "updated_at",
}

// ListImportSourcesParams drives the List query.
type ListImportSourcesParams struct {
	// Cond is an optional abstract condition chain (AND/OR/NOT support).
	Cond cond.Cond
	// OrderBy specifies the sort field and direction as SQL expressions.
	OrderBy []order.Expr
	// Page number (1-indexed).
	Page int
	// PageSize caps the number of rows returned.
	PageSize int
}

// importSourceColumnMapper maps filter field names to database column names.
func importSourceColumnMapper(field string) (string, bool) {
	switch field {
	case "display_name":
		return "display_name", true
	default:
		return "", false
	}
}

// ImportSourceRepository provides CRUD and specialised queries for the import_sources table.
type ImportSourceRepository struct {
	db *gorm.DB
	q  *dao.Query
}

// NewImportSourceRepository creates an ImportSourceRepository backed by db.
func NewImportSourceRepository(db *gorm.DB) *ImportSourceRepository {
	return &ImportSourceRepository{db: db, q: dao.Use(db)}
}

// List returns import sources matching params along with the total count.
func (r *ImportSourceRepository) List(ctx context.Context, params ListImportSourcesParams) ([]*model.ImportSource, int64, error) {
	if params.PageSize <= 0 {
		params.PageSize = 20
	}
	if params.Page <= 0 {
		params.Page = 1
	}

	db := r.db.WithContext(ctx).Table("import_sources")

	// Apply abstract condition chain
	db = cond.Apply(db, params.Cond, importSourceColumnMapper)

	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("count import sources page=%d: %w", params.Page, err)
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

	var ms []*model.ImportSource
	if err := db.Find(&ms).Error; err != nil {
		return nil, 0, fmt.Errorf("list import sources page=%d: %w", params.Page, err)
	}

	return ms, total, nil
}

// GetByID returns the import source with the given ID.
func (r *ImportSourceRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.ImportSource, error) {
	m, err := r.q.ImportSource.WithContext(ctx).Where(r.q.ImportSource.ID.Eq(id)).First()
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.Join(ErrImportSourceNotFound, fmt.Errorf("id=%s: %w", id, err))
		}
		return nil, fmt.Errorf("get import source id=%s: %w", id, err)
	}
	return m, nil
}

// GetByCustomID returns the import source with the given custom ID within an organization.
func (r *ImportSourceRepository) GetByCustomID(ctx context.Context, orgID uuid.UUID, customID string) (*model.ImportSource, error) {
	m, err := r.q.ImportSource.WithContext(ctx).Where(
		r.q.ImportSource.OrganizationID.Eq(orgID),
		r.q.ImportSource.CustomID.Eq(customID),
	).First()
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.Join(ErrImportSourceNotFound, fmt.Errorf("organization_id=%s custom_id=%s: %w", orgID, customID, err))
		}
		return nil, fmt.Errorf("get import source organization_id=%s custom_id=%s: %w", orgID, customID, err)
	}
	return m, nil
}

// CreateImportSourceParams holds the fields required to create an import source.
type CreateImportSourceParams struct {
	OrganizationID     uuid.UUID
	DisplayName        string
	DisplayDescription string
	PeriodStart        time.Time
	CustomID           string
}

// Create inserts a new import source.
func (r *ImportSourceRepository) Create(ctx context.Context, params CreateImportSourceParams) (*model.ImportSource, error) {
	orgCount, err := r.q.Organization.WithContext(ctx).Where(r.q.Organization.ID.Eq(params.OrganizationID)).Count()
	if err != nil {
		return nil, fmt.Errorf("create import source: check organization organization_id=%s: %w", params.OrganizationID, err)
	}
	if orgCount == 0 {
		return nil, errors.Join(ErrOrganizationNotFound, fmt.Errorf("organization_id=%s: %w", params.OrganizationID, gorm.ErrRecordNotFound))
	}
	m := &model.ImportSource{
		OrganizationID:     params.OrganizationID,
		DisplayName:        params.DisplayName,
		DisplayDescription: params.DisplayDescription,
		PeriodStart:        params.PeriodStart,
		CustomID:           params.CustomID,
	}
	if err := r.q.ImportSource.WithContext(ctx).Create(m); err != nil {
		if errors.Is(err, gorm.ErrDuplicatedKey) {
			return nil, errors.Join(ErrImportSourceAlreadyExists, fmt.Errorf("organization_id=%s custom_id=%s: %w", m.OrganizationID, m.CustomID, err))
		}
		return nil, fmt.Errorf("create import source organization_id=%s custom_id=%s: %w", m.OrganizationID, m.CustomID, err)
	}
	return m, nil
}

// Update updates fields of an existing import source matched by its primary key.
func (r *ImportSourceRepository) Update(ctx context.Context, m *model.ImportSource) error {
	_, err := r.q.ImportSource.WithContext(ctx).Where(r.q.ImportSource.ID.Eq(m.ID)).Updates(m)
	if err != nil {
		return fmt.Errorf("update import source id=%s: %w", m.ID, err)
	}
	return nil
}

// Delete removes the import source with the given ID.
func (r *ImportSourceRepository) Delete(ctx context.Context, id uuid.UUID) error {
	result, err := r.q.ImportSource.WithContext(ctx).Where(r.q.ImportSource.ID.Eq(id)).Delete()
	if err != nil {
		return fmt.Errorf("delete import source id=%s: %w", id, err)
	}
	if result.RowsAffected == 0 {
		return errors.Join(ErrImportSourceNotFound, fmt.Errorf("id=%s: %w", id, gorm.ErrRecordNotFound))
	}
	return nil
}
