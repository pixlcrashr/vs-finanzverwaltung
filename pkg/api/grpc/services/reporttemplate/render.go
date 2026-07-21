package reporttemplate

import (
	"bytes"
	"fmt"
	"html/template"
	"math/rand"
	"strconv"
	"strings"
	"time"
)

// BudgetRevision represents a revision in the preview data.
type BudgetRevision struct {
	ID          string
	Name        string
	Description string
	Date        time.Time
}

// Budget represents a budget in the preview data.
type Budget struct {
	ID          string
	Name        string
	Description string
	PeriodStart time.Time
	PeriodEnd   time.Time
	Revisions   []BudgetRevision
}

// Account represents an account node in the preview data.
type Account struct {
	ID          string
	IsLeaf      bool
	Depth       int
	Name        string
	Code        string
	Description string
	Children    []Account
}

// PreviewOptions controls which columns/features are enabled in the preview.
type PreviewOptions struct {
	ActualValuesEnabled        bool
	TargetValuesEnabled        bool
	DifferenceValuesEnabled    bool
	AccountDescriptionsEnabled bool
	BudgetDescriptionsEnabled  bool
}

// previewContext is the top-level data structure passed to the template.
type previewContext struct {
	Options         PreviewOptions
	MaxAccountDepth int
	Budgets         []Budget
	Accounts        []Account
}

func calcMaxDepth(accounts []Account) int {
	maxDepth := 0
	var dfs func(a Account)
	dfs = func(a Account) {
		if a.Depth > maxDepth {
			maxDepth = a.Depth
		}
		for _, child := range a.Children {
			dfs(child)
		}
	}
	for _, a := range accounts {
		dfs(a)
	}
	return maxDepth
}

func formatCurrency(s string) string {
	v, err := strconv.ParseFloat(s, 64)
	if err != nil {
		return s
	}
	return fmt.Sprintf("%.2f €", v)
}

func formatDateShort(t time.Time) string {
	return t.Format("02.01.2006")
}

func randomDecimal() string {
	v := rand.Float64() * 10000
	return fmt.Sprintf("%.2f", v)
}

func subtract(a, b interface{}) string {
	na := toFloat(a)
	nb := toFloat(b)
	return fmt.Sprintf("%.2f", na-nb)
}

func add(a, b interface{}) string {
	na := toFloat(a)
	nb := toFloat(b)
	return fmt.Sprintf("%.2f", na+nb)
}

func toFloat(v interface{}) float64 {
	switch val := v.(type) {
	case string:
		f, _ := strconv.ParseFloat(val, 64)
		return f
	case float64:
		return val
	case int:
		return float64(val)
	case int64:
		return float64(val)
	default:
		return 0
	}
}

func countTrue(bs ...interface{}) int {
	count := 0
	for _, b := range bs {
		if v, ok := b.(bool); ok && v {
			count++
		}
	}
	return count
}

// RenderTemplate parses and executes a Go html/template with fake preview data.
func RenderTemplate(templateSrc string) (string, error) {
	budgets := generateFakeBudgets(2, 1, 3)
	accounts := generateFakeAccounts(2, 0, 4, 4, 0)

	opts := PreviewOptions{
		ActualValuesEnabled:        true,
		TargetValuesEnabled:        true,
		DifferenceValuesEnabled:    true,
		AccountDescriptionsEnabled: true,
		BudgetDescriptionsEnabled:  true,
	}

	ctx := previewContext{
		Options:         opts,
		MaxAccountDepth: calcMaxDepth(accounts),
		Budgets:         budgets,
		Accounts:        accounts,
	}

	funcMap := template.FuncMap{
		"formatCurrency":  formatCurrency,
		"formatDateShort": formatDateShort,
		"getTargetValue":  func(budgetRevisionId, accountId string) string { return randomDecimal() },
		"getDiffValue":    func(budgetRevisionId, accountId string) string { return randomDecimal() },
		"getActualValue":  func(budgetId, accountId string) string { return randomDecimal() },
		"subtract":        subtract,
		"add":             add,
		"countTrue":       countTrue,
		"budgetColspan":   budgetColspanFunc(opts),
	}

	tmpl, err := template.New("preview").Funcs(funcMap).Parse(templateSrc)
	if err != nil {
		return "", fmt.Errorf("parsing template: %w", err)
	}

	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, ctx); err != nil {
		return "", fmt.Errorf("executing template: %w", err)
	}

	return buf.String(), nil
}

func budgetColspanFunc(opts PreviewOptions) func(revisionsLength interface{}) int {
	return func(revisionsLength interface{}) int {
		revs := 0
		switch v := revisionsLength.(type) {
		case string:
			revs, _ = strconv.Atoi(v)
		case int:
			revs = v
		case int64:
			revs = int(v)
		}

		perRevision := 0
		if opts.TargetValuesEnabled {
			perRevision++
		}
		if opts.ActualValuesEnabled {
			perRevision++
		}
		if opts.DifferenceValuesEnabled {
			perRevision++
		}

		if perRevision == 0 {
			return revs
		}
		return revs * perRevision
	}
}

func generateFakeBudgets(count, minRevisions, maxRevisions int) []Budget {
	budgets := make([]Budget, count)
	for i := 0; i < count; i++ {
		revCount := minRevisions
		if maxRevisions > minRevisions {
			revCount = minRevisions + rand.Intn(maxRevisions-minRevisions+1)
		}
		revisions := make([]BudgetRevision, revCount)
		for j := 0; j < revCount; j++ {
			revisions[j] = BudgetRevision{
				ID:          fmt.Sprintf("rev-%d-%d", i, j),
				Name:        fmt.Sprintf("Rev. %d", j+1),
				Description: fmt.Sprintf("Revision %d description", j+1),
				Date:        time.Now().AddDate(0, -j, 0),
			}
		}
		budgets[i] = Budget{
			ID:          fmt.Sprintf("budget-%d", i),
			Name:        fmt.Sprintf("Sample Budget %d", i+1),
			Description: fmt.Sprintf("Sample budget description %d", i+1),
			PeriodStart: time.Now().AddDate(-1, 0, 0),
			PeriodEnd:   time.Now().AddDate(0, 6, 0),
			Revisions:   revisions,
		}
	}
	return budgets
}

func generateFakeAccounts(count, minChildren, maxChildren, maxDepth, depth int) []Account {
	if depth >= maxDepth {
		return []Account{}
	}

	accounts := make([]Account, count)
	for i := 0; i < count; i++ {
		childCount := minChildren
		if maxChildren > minChildren {
			childCount = minChildren + rand.Intn(maxChildren-minChildren+1)
		}
		children := generateFakeAccounts(childCount, minChildren, maxChildren, maxDepth, depth+1)
		accounts[i] = Account{
			ID:          fmt.Sprintf("acct-%d-%d", depth, i),
			IsLeaf:      len(children) == 0,
			Depth:       depth,
			Name:        fmt.Sprintf("Account %d-%d", depth, i),
			Code:        fmt.Sprintf("%04d", rand.Intn(10000)),
			Description: fmt.Sprintf("Sample account description %d-%d", depth, i),
			Children:    children,
		}
	}
	return accounts
}

// init seeds the random number generator for preview data.
func init() {
	rand.Seed(time.Now().UnixNano())
}

// Ensure strings import is used (for future use).
var _ = strings.TrimSpace
