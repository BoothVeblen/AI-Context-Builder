"""Remove retrieval from datasets

Revision ID: 0469bac02c39
Revises: 51847bb60da6
Create Date: 2023-09-14 09:25:57.443780

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0469bac02c39'
down_revision = '51847bb60da6'
branch_labels = None
depends_on = None


def upgrade():
    op.drop_column('datasets', 'retrieval')

def downgrade():
    op.add_column('datasets', sa.Column('retrieval', sa.JSON(), nullable=True))
