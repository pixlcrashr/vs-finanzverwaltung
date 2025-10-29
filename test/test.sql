BEGIN;



-- Account Groups
CREATE TABLE IF NOT EXISTS account_groups (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name TEXT NOT NULL DEFAULT '',
    display_description TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_account_groups_display_name ON account_groups (display_name);
CREATE INDEX IF NOT EXISTS idx_account_groups_display_description ON account_groups (display_description);



-- Accounts (with self-reference to parent_account_id)

CREATE TABLE IF NOT EXISTS accounts (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_account_id uuid NULL REFERENCES accounts(id),
    display_name TEXT NOT NULL DEFAULT '',
    display_code TEXT NOT NULL DEFAULT '',
    display_description TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (id <> parent_account_id)
);

CREATE INDEX IF NOT EXISTS idx_accounts_parent_account_id ON accounts (parent_account_id);
CREATE INDEX IF NOT EXISTS idx_accounts_display_name ON accounts (display_name);
CREATE INDEX IF NOT EXISTS idx_accounts_display_code ON accounts (display_code);

CREATE OR REPLACE FUNCTION fn_accounts_no_cycle()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  has_cycle boolean;
BEGIN
    IF NEW.parent_account_id IS NULL THEN
        RETURN NEW;
    END IF;

    IF NEW.parent_account_id = NEW.id THEN
        RAISE EXCEPTION 'accounts: cannot self reference (id = %)', NEW.id;
    END IF;

    WITH RECURSIVE ancestors(id, parent_id) AS (
        SELECT id, parent_account_id
        FROM accounts
        WHERE id = NEW.parent_account_id
        UNION ALL
        SELECT a.id, a.parent_account_id
        FROM accounts a
        JOIN ancestors an ON a.id = an.parent_id
    )
    SELECT EXISTS (SELECT 1 FROM ancestors WHERE id = NEW.id)
    INTO has_cycle;

    IF has_cycle THEN
        RAISE EXCEPTION 'accounts: circular reference detected (id = %, parent = %)', NEW.id, NEW.parent_account_id;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trig_accounts_no_cycle ON accounts;
CREATE CONSTRAINT TRIGGER trig_accounts_no_cycle
AFTER INSERT OR UPDATE OF parent_account_id ON accounts
DEFERRABLE INITIALLY IMMEDIATE
FOR EACH ROW
EXECUTE FUNCTION fn_accounts_no_cycle();



-- Budgets

CREATE TABLE IF NOT EXISTS budgets (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name TEXT NOT NULL DEFAULT '',
    display_description TEXT NOT NULL DEFAULT '',
    is_closed BOOLEAN NOT NULL DEFAULT FALSE,
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_budgets_display_name ON budgets (display_name);


-- Views

CREATE TABLE IF NOT EXISTS views (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name TEXT NOT NULL DEFAULT '',
    display_description TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_views_display_name ON views (display_name);
CREATE INDEX IF NOT EXISTS idx_views_display_description ON views (display_description);



-- Account Group Assignments

CREATE TABLE IF NOT EXISTS account_group_assignments (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    account_group_id uuid NOT NULL REFERENCES account_groups(id),
    account_id uuid NOT NULL REFERENCES accounts(id),
    negate BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT idx_account_group_id_account_id UNIQUE (account_group_id, account_id)
);

CREATE INDEX IF NOT EXISTS idx_account_group_assignments_negate ON account_group_assignments (negate);



-- Budget Revisions

CREATE TABLE IF NOT EXISTS budget_revisions (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id uuid NOT NULL REFERENCES budgets(id),
    date TIMESTAMP NOT NULL,
    display_description TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_budget_revisions_budget_id ON budget_revisions (budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_revisions_date ON budget_revisions (date);



-- Budget Revision Account Values

CREATE TABLE IF NOT EXISTS budget_revision_account_values (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_revision_id uuid NOT NULL REFERENCES budget_revisions(id),
    account_id uuid NOT NULL REFERENCES accounts(id),
    value DECIMAL NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_budget_revision_account_values_budget_id ON budget_revision_account_values (budget_revision_id);
CREATE INDEX IF NOT EXISTS idx_budget_revision_account_values_account_id ON budget_revision_account_values (account_id);
CREATE INDEX IF NOT EXISTS idx_budget_revision_account_values_value ON budget_revision_account_values (value);



-- Account Group Total Values (View)

CREATE OR REPLACE VIEW account_group_total_values AS (
    WITH RECURSIVE
        groups AS (
            SELECT
                ag.id AS account_group_id
            FROM
                account_groups ag
        ),
        revisions AS (
            SELECT DISTINCT
                budget_revision_id
            FROM
                budget_revision_account_values
        ),
        -- Cross product so every group x revision appears at least once
        group_rev AS (
            SELECT
                g.account_group_id,
                r.budget_revision_id
            FROM
                groups g
            CROSS JOIN
                revisions r
        ),
        -- Ancestor → descendant closure (including self)
        account_tree AS (
            SELECT
                a.id AS ancestor_id,
                a.id AS descendant_id
            FROM
                accounts a
            UNION ALL
            SELECT
                t.ancestor_id,
                a.id AS descendant_id
            FROM
                account_tree t
            JOIN
                accounts a ON a.parent_account_id = t.descendant_id
        ),
        -- Leaf accounts only
        leaf_accounts AS (
            SELECT
                a.id
            FROM
                accounts a
            LEFT JOIN
                accounts c ON c.parent_account_id = a.id
            WHERE
                c.id IS NULL
        ),
        -- Sum values at leaf level per budget revision
        leaf_values AS (
            SELECT
                brav.account_id,
                brav.budget_revision_id,
                SUM(brav.value) AS value
            FROM
                budget_revision_account_values brav
            JOIN
                leaf_accounts l ON l.id = brav.account_id
            GROUP BY
                brav.account_id,
                brav.budget_revision_id
        ),
        -- For each account (leaf or parent), sum its descendant leaf values per revision
        expanded_account_values AS (
            SELECT
                t.ancestor_id AS account_id,
                lv.budget_revision_id,
                SUM(lv.value) AS value
            FROM
                account_tree t
            JOIN
                leaf_accounts l ON l.id = t.descendant_id
            JOIN
                leaf_values lv ON lv.account_id = l.id
            GROUP BY
                t.ancestor_id,
                lv.budget_revision_id
        ),
        -- Join group assignments to expanded values, per group x revision
        group_rev_contrib AS (
            SELECT
                aga.account_group_id,
                eav.budget_revision_id,
                SUM(CASE WHEN aga.negate THEN -eav.value ELSE eav.value END) AS value
            FROM
                account_group_assignments AS aga
            JOIN
                expanded_account_values AS eav ON eav.account_id = aga.account_id
            GROUP BY
                aga.account_group_id,
                eav.budget_revision_id
        )
    SELECT
        gr.account_group_id,
        gr.budget_revision_id,
        COALESCE(grc.value, 0)::DECIMAL AS value
    FROM
        group_rev gr
    LEFT JOIN
        group_rev_contrib grc ON grc.account_group_id = gr.account_group_id AND grc.budget_revision_id = gr.budget_revision_id
);



-- Budget Revision Account Total Values (View)

CREATE OR REPLACE VIEW budget_revision_account_total_values AS
    WITH RECURSIVE
    account_tree AS (
        SELECT
            a.id AS ancestor_id,
            a.id AS descendant_id
        FROM
            accounts a
        UNION ALL
        SELECT
            t.ancestor_id, a.id
        FROM
            account_tree t
        JOIN
            accounts a ON a.parent_account_id = t.descendant_id
    ),
    leaf_accounts AS (
        SELECT
            a.id AS account_id
        FROM
            accounts a
        LEFT JOIN
            accounts c ON c.parent_account_id = a.id
        WHERE
            c.id IS NULL
    ),
    -- raw sums for any account present in BRAV (leaf or non-leaf)
    raw_vals AS (
        SELECT
            account_id,
            budget_revision_id,
            SUM(value) AS value
        FROM
            budget_revision_account_values
        GROUP BY
            account_id,
            budget_revision_id
    ),
    -- descendant leaf sums per ancestor
    desc_leaf_sums AS (
        SELECT
            t.ancestor_id AS account_id,
            lv.budget_revision_id,
            SUM(lv.value) AS value
        FROM
            account_tree t
        JOIN
            leaf_accounts l ON l.account_id = t.descendant_id
        JOIN
            raw_vals lv ON lv.account_id = l.account_id
        GROUP BY
            t.ancestor_id,
            lv.budget_revision_id
    )
SELECT
    a.id AS account_id,
    COALESCE(rv.budget_revision_id, dls.budget_revision_id) AS budget_revision_id,
    COALESCE(rv.value, dls.value)::numeric AS value
FROM
    accounts a
LEFT JOIN
    raw_vals rv ON rv.account_id = a.id
FULL JOIN
    desc_leaf_sums dls ON dls.account_id = a.id AND dls.budget_revision_id = COALESCE(rv.budget_revision_id, dls.budget_revision_id);


-- View Account Assignments

CREATE TABLE IF NOT EXISTS view_account_assignments (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    view_id uuid NOT NULL REFERENCES views(id),
    account_id uuid NOT NULL REFERENCES accounts(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (view_id, account_id)
);

CREATE INDEX IF NOT EXISTS idx_view_account_assignments_view_id ON view_account_assignments (view_id);
CREATE INDEX IF NOT EXISTS idx_view_account_assignments_account_id ON view_account_assignments (account_id);



-- View Account Group Assignments

CREATE TABLE IF NOT EXISTS view_account_group_assignments (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    view_id uuid NOT NULL REFERENCES views(id),
    account_group_id uuid NOT NULL REFERENCES account_groups(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (view_id, account_group_id)
);

CREATE INDEX IF NOT EXISTS idx_view_account_group_assignments_view_id ON view_account_group_assignments (view_id);
CREATE INDEX IF NOT EXISTS idx_view_account_group_assignments_account_group_id ON view_account_group_assignments (account_group_id);



-- View Budget Assignments

CREATE TABLE IF NOT EXISTS view_budget_assignments (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    view_id uuid NOT NULL REFERENCES views(id),
    budget_id uuid NOT NULL REFERENCES budgets(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (view_id, budget_id)
);

CREATE INDEX IF NOT EXISTS idx_view_budget_assignments_view_id ON view_budget_assignments (view_id);
CREATE INDEX IF NOT EXISTS idx_view_budget_assignments_budget_id ON view_budget_assignments (budget_id);



-- Transaction Accounts

CREATE TABLE IF NOT EXISTS transaction_accounts (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(64) NOT NULL UNIQUE,
    display_name TEXT NOT NULL DEFAULT '',
    display_description TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transaction_accounts_code ON transaction_accounts (code);
CREATE INDEX IF NOT EXISTS idx_transaction_accounts_display_name ON transaction_accounts (display_name);

-- Transactions

CREATE TABLE IF NOT EXISTS transactions (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    credit_transaction_account_id uuid NOT NULL REFERENCES transaction_accounts(id),
    debit_transaction_account_id uuid NOT NULL REFERENCES transaction_accounts(id),
    amount DECIMAL NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    reference TEXT NOT NULL DEFAULT '',
    assigned_account_id uuid NULL REFERENCES accounts(id),
    booked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMIT;
