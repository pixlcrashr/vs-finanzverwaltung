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

// ListBudgetTagsParams drives the List query.
type ListBudgetTagsParams struct {
	// BudgetID filters tags for a specific budget.
	BudgetID uuid.UUID
	// Cond is an optional abstract condition chain (AND/OR/NOT support).
	Cond cond.Cond
	// OrderBy specifies the ordering expression (e.g., "date desc").
	OrderBy order.Fields
	// Page number (1-indexed).
	Page int
	// PageSize caps the number of rows returned.
	PageSize int
}

// budgetTagColumnMapper maps filter field names to database column names.
func budgetTagColumnMapper(field string) (string, bool) {
	switch field {
	case "date":
		return "date", true
	case "display_description":
		return "display_description", true
	default:
		return "", false
	}
}

// BudgetTagRepository provides CRUD for budget_revisions table (using BudgetTag model).
type BudgetTagRepository struct {
	db *gorm.DB
	q  *dao.Query
}

// NewBudgetTagRepository creates a BudgetTagRepository backed by db.
func NewBudgetTagRepository(db *gorm.DB) *BudgetTagRepository {
	return &BudgetTagRepository{db: db, q: dao.Use(db)}
}

// List returns budget tags matching params along with the total count.
func (r *BudgetTagRepository) List(ctx context.Context, params ListBudgetTagsParams) ([]*model.BudgetTag, int64, error) {
	if params.PageSize <= 0 {
		params.PageSize = 20
	}
	if params.Page <= 0 {
		params.Page = 1
	}

	db := r.db.WithContext(ctx).Table("budget_revisions").
		Where("budget_id = ?", params.BudgetID)

	// Apply abstract condition chain
	db = cond.Apply(db, params.Cond, budgetTagColumnMapper)

	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if params.Cond != nil && !params.Cond.IsEmpty() {
		db = db.Order("date DESC")
	} else {
		if exprs := ResolveOrderBy(&r.q.BudgetTag, params.OrderBy); len(exprs) > 0 {
			for _, expr := range exprs {
				db = db.Order(expr)
			}
		} else {
			db = db.Order("date DESC")
		}
	}

	offset := (params.Page - 1) * params.PageSize
	if offset > 0 {
		db = db.Offset(offset)
	}
	db = db.Limit(params.PageSize)

	var ms []*model.BudgetTag
	if err := db.Find(&ms).Error; err != nil {
		return nil, 0, err
	}

	return ms, total, nil
}

// GetByID returns the budget tag with the given ID.
func (r *BudgetTagRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.BudgetTag, error) {
	return r.q.BudgetTag.WithContext(ctx).Where(r.q.BudgetTag.ID.Eq(id)).First()
}

// Create inserts a new budget tag.
func (r *BudgetTagRepository) Create(ctx context.Context, m *model.BudgetTag) error {
	return r.q.BudgetTag.WithContext(ctx).Create(m)
}

// Update updates fields of an existing budget tag.
func (r *BudgetTagRepository) Update(ctx context.Context, m *model.BudgetTag) error {
	_, err := r.q.BudgetTag.WithContext(ctx).Where(r.q.BudgetTag.ID.Eq(m.ID)).Updates(m)
	return err
}

// Delete removes the budget tag with the given ID.
func (r *BudgetTagRepository) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.q.BudgetTag.WithContext(ctx).Where(r.q.BudgetTag.ID.Eq(id)).Delete()
	return err
}
