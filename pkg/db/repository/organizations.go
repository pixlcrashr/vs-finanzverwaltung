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

// OrganizationOrderFieldMapper maps API order_by field names to database column names.
var OrganizationOrderFieldMapper = order.FieldMapper{
	"displayName": "display_name",
	"createTime":  "created_at",
	"updateTime":  "updated_at",
}

// ListOrganizationsParams drives the List query.
type ListOrganizationsParams struct {
	// Cond is an optional abstract condition chain.
	Cond cond.Cond
	// OrderBy specifies the sort field and direction as SQL expressions.
	OrderBy []order.Expr
	// Page number (1-indexed).
	Page int
	// PageSize caps the number of rows returned.
	PageSize int
}

// organizationColumnMapper maps filter field names to database column names.
func organizationColumnMapper(field string) (string, bool) {
	switch field {
	case "display_name":
		return "display_name", true
	default:
		return "", false
	}
}

// OrganizationRepository provides CRUD and list queries for the organizations table.
type OrganizationRepository struct {
	db *gorm.DB
	q  *dao.Query
}

// NewOrganizationRepository creates an OrganizationRepository backed by db.
func NewOrganizationRepository(db *gorm.DB) *OrganizationRepository {
	return &OrganizationRepository{db: db, q: dao.Use(db)}
}

// List returns organizations matching params along with the total count.
func (r *OrganizationRepository) List(ctx context.Context, params ListOrganizationsParams) ([]*model.Organization, int64, error) {
	if params.PageSize <= 0 {
		params.PageSize = 20
	}
	if params.Page <= 0 {
		params.Page = 1
	}

	db := r.db.WithContext(ctx).Table("organizations")

	db = cond.Apply(db, params.Cond, organizationColumnMapper)

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

	var ms []*model.Organization
	if err := db.Find(&ms).Error; err != nil {
		return nil, 0, err
	}

	return ms, total, nil
}

// GetByID returns the organization with the given ID.
// Returns gorm.ErrRecordNotFound when no such organization exists.
func (r *OrganizationRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.Organization, error) {
	return r.q.Organization.WithContext(ctx).Where(r.q.Organization.ID.Eq(id)).First()
}

// ExistsByCustomID reports whether an organization with the given custom ID exists.
func (r *OrganizationRepository) ExistsByCustomID(ctx context.Context, customID string) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&model.Organization{}).
		Where("custom_id = ?", customID).
		Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// Create inserts a new organization.
func (r *OrganizationRepository) Create(ctx context.Context, m *model.Organization) error {
	return r.q.Organization.WithContext(ctx).Create(m)
}

// Update updates fields of an existing organization matched by its primary key.
func (r *OrganizationRepository) Update(ctx context.Context, m *model.Organization) error {
	_, err := r.q.Organization.WithContext(ctx).Where(r.q.Organization.ID.Eq(m.ID)).Updates(m)
	return err
}

// Delete removes the organization with the given ID.
func (r *OrganizationRepository) Delete(ctx context.Context, id uuid.UUID) error {
	result, err := r.q.Organization.WithContext(ctx).Where(r.q.Organization.ID.Eq(id)).Delete()
	if err != nil {
		return err
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}
