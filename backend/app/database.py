from sqlmodel import create_engine

DATABASE_URL = "postgresql://eco_trace:eco_trace_password@localhost:5432/eco_trace"

engine = create_engine(
    DATABASE_URL,
    echo=True
)