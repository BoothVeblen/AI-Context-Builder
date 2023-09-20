"""Add split_option to documents

Revision ID: 2f0505801d0d
Revises: 0469bac02c39
Create Date: 2023-09-14 09:32:47.585231

"""
from alembic import op
import sqlalchemy as sa
import json



# revision identifiers, used by Alembic.
revision = '2f0505801d0d'
down_revision = '0469bac02c39'
branch_labels = None
depends_on = None


def upgrade():
    # 更改documents列的数据类型为jsonb
    op.execute("""
        ALTER TABLE datasets
        ALTER COLUMN documents TYPE jsonb USING documents::jsonb;
    """)

    # 为documents数组中的每个对象添加split_option字段
    desired_value = {
        "split_type": "pdf",
        "chunk_size": 1000,
        "chunk_overlap": 0
    }
    op.execute(f"""
        WITH docs AS (
            SELECT id, jsonb_array_elements(documents) AS doc
            FROM datasets
            WHERE documents IS NOT NULL AND NOT documents = '[]'::jsonb
        )
        UPDATE datasets
        SET documents = (
            SELECT jsonb_agg(
                CASE
                    WHEN docs.doc::jsonb ? 'split_option' THEN docs.doc::jsonb
                    ELSE jsonb_set(docs.doc::jsonb, '{{split_option}}', '{json.dumps(desired_value)}'::jsonb)
                END
            )
            FROM docs
            WHERE docs.id = datasets.id
        );
    """)

    # 将documents列的数据类型更改回json
    op.execute("""
        ALTER TABLE datasets
        ALTER COLUMN documents TYPE json USING documents::json;
    """)

def downgrade():
    # 更改documents列的数据类型为jsonb
    op.execute("""
        ALTER TABLE datasets
        ALTER COLUMN documents TYPE jsonb USING documents::jsonb;
    """)

    # 从documents数组中的每个对象中删除split_option字段
    op.execute("""
        WITH docs AS (
            SELECT id, jsonb_array_elements_text(documents) AS doc
            FROM datasets
            WHERE documents IS NOT NULL AND NOT documents = '[]'::jsonb
        )
        UPDATE datasets
        SET documents = (
            SELECT jsonb_agg(
                CASE
                    WHEN docs.doc::jsonb ? 'split_option' THEN docs.doc::jsonb - 'split_option'
                    ELSE docs.doc::jsonb
                END
            )
            FROM docs
            WHERE docs.id = datasets.id
        );
    """)

    # 将documents列的数据类型更改回json
    op.execute("""
        ALTER TABLE datasets
        ALTER COLUMN documents TYPE json USING documents::json;
    """)





