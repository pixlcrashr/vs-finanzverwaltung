#!/usr/bin/env python3
"""
create_import_file.py – Export VSFV data from the legacy Prisma PostgreSQL database
to the v1 JSON import/export format.

The legacy database has no organisation concept; --org-id is only written into the
output JSON as the target organisation for the subsequent import into the new system.

Requires:
    pip install psycopg2-binary

Usage:
    python tools/create_import_file.py --db-url "postgres://user:pass@host:5432/db" \\
                                       --org-id  "<uuid>" \\
                                       [--output  export.json]

    Environment variable DB_URL is used as fallback if --db-url is not given.
    If --output is omitted, JSON is printed to stdout.
"""

import argparse
import json
import os
import sys
from datetime import datetime, timezone

try:
    import psycopg2
    import psycopg2.extras
except ImportError:
    sys.exit(
        "psycopg2 is required. Install it with:\n"
        "    pip install psycopg2-binary"
    )


# ---------------------------------------------------------------------------
# Database queries
# ---------------------------------------------------------------------------

def fetch_accounts(cur) -> list[dict]:
    cur.execute(
        """
        SELECT id, parent_account_id, display_name, display_code,
               display_description
        FROM   accounts
        ORDER  BY display_code
        """
    )
    return cur.fetchall()


def fetch_budgets(cur) -> list[dict]:
    cur.execute(
        """
        SELECT id, display_name, display_description,
               is_closed,
               period_start::date AS period_start,
               period_end::date   AS period_end
        FROM   budgets
        ORDER  BY period_start
        """
    )
    return cur.fetchall()


def fetch_budget_revisions(cur, budget_id: str) -> list[dict]:
    cur.execute(
        """
        SELECT id, display_description,
               date::date AS date
        FROM   budget_revisions
        WHERE  budget_id = %s
        ORDER  BY created_at
        """,
        (budget_id,),
    )
    return cur.fetchall()


def fetch_revision_account_values(cur, revision_id: str) -> list[dict]:
    cur.execute(
        """
        SELECT account_id, value
        FROM   budget_revision_account_values
        WHERE  budget_revision_id = %s
        """,
        (revision_id,),
    )
    return cur.fetchall()


# ---------------------------------------------------------------------------
# Tree building
# ---------------------------------------------------------------------------

def build_account_tree(rows: list[dict]) -> list[dict]:
    by_id: dict[str, dict] = {}
    for r in rows:
        node = {
            "id": str(r["id"]),
            "display_name": r["display_name"],
            "display_code": r["display_code"],
            "display_description": r["display_description"],
            "is_container": False,  # derived below from children presence
            "is_archived": False,
            "children": [],
        }
        by_id[str(r["id"])] = node

    roots: list[dict] = []
    for r in rows:
        node = by_id[str(r["id"])]
        parent_id = r["parent_account_id"]
        if parent_id is None:
            roots.append(node)
        else:
            parent = by_id.get(str(parent_id))
            if parent is not None:
                parent["children"].append(node)
                parent["is_container"] = True
            else:
                roots.append(node)

    return roots


# ---------------------------------------------------------------------------
# Export
# ---------------------------------------------------------------------------

def export(conn, org_id: str) -> dict:
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        # Accounts (no org filter in legacy schema)
        account_rows = fetch_accounts(cur)
        accounts = build_account_tree(account_rows)

        # Budgets (no org filter in legacy schema)
        budget_rows = fetch_budgets(cur)
        budgets: list[dict] = []

        for b in budget_rows:
            budget_id = str(b["id"])

            # All revisions in creation order
            rev_rows = fetch_budget_revisions(cur, budget_id)

            if rev_rows:
                # Treat the oldest revision as the base plan
                base_rev = rev_rows[0]
                base_rav_rows = fetch_revision_account_values(cur, str(base_rev["id"]))
                account_values = {
                    str(r["account_id"]): str(r["value"]) for r in base_rav_rows
                }
                subsequent_revs = rev_rows[1:]
            else:
                account_values = {}
                subsequent_revs = []

            revisions: list[dict] = []
            for rev in subsequent_revs:
                rev_id = str(rev["id"])
                rav_rows = fetch_revision_account_values(cur, rev_id)
                revisions.append(
                    {
                        "id": rev_id,
                        "display_name": "",
                        "display_description": rev["display_description"],
                        "date": rev["date"].strftime("%Y-%m-%d"),
                        "account_values": {
                            str(r["account_id"]): str(r["value"]) for r in rav_rows
                        },
                    }
                )

            budgets.append(
                {
                    "id": budget_id,
                    "display_name": b["display_name"],
                    "display_description": b["display_description"],
                    "period_start": b["period_start"].strftime("%Y-%m-%d"),
                    "period_end": b["period_end"].strftime("%Y-%m-%d"),
                    "is_closed": b["is_closed"],
                    "account_values": account_values,
                    "revisions": revisions,
                }
            )

    return {
        "version": 1,
        "exported_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "accounts": accounts,
        "budgets": budgets,
    }


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Export VSFV data from PostgreSQL to the v1 import/export JSON format."
    )
    parser.add_argument(
        "--db-url",
        default=os.environ.get("DB_URL", ""),
        help="PostgreSQL connection URL (default: $DB_URL)",
    )
    parser.add_argument(
        "--org-id",
        required=True,
        help="Target organisation UUID written into the output JSON (for import into the new system).",
    )
    parser.add_argument(
        "--output",
        default=None,
        help="Output file path. Prints to stdout if omitted.",
    )
    args = parser.parse_args()

    if not args.db_url:
        sys.exit(
            "No database URL provided. Use --db-url or set the DB_URL environment variable."
        )

    try:
        conn = psycopg2.connect(args.db_url)
        conn.autocommit = True
    except Exception as exc:
        sys.exit(f"Could not connect to database: {exc}")

    try:
        document = export(conn, args.org_id)
    except Exception as exc:
        sys.exit(f"Export failed: {exc}")
    finally:
        conn.close()

    output = json.dumps(document, indent=2, ensure_ascii=False)

    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(output)
        print(f"Exported to: {args.output}", file=sys.stderr)
    else:
        print(output)


if __name__ == "__main__":
    main()
