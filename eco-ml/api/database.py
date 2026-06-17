"""
Database setup for GridWise.
Stores trained custom models so they persist across Render restarts.
Requires DATABASE_URL environment variable (PostgreSQL connection string).
Falls back gracefully to in-memory only if DATABASE_URL is not set.
"""

import os
import io
import joblib
import traceback
from datetime import datetime

DATABASE_URL = os.environ.get("DATABASE_URL", "")

# Detect if we have a DB configured
DB_ENABLED = bool(DATABASE_URL)

if DB_ENABLED:
    from sqlalchemy import (
        create_engine, Column, Integer, String, Float,
        LargeBinary, DateTime, Text
    )
    from sqlalchemy.orm import declarative_base, sessionmaker

    # Render gives postgres:// but SQLAlchemy needs postgresql://
    _url = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    engine = create_engine(_url, pool_pre_ping=True)
    SessionLocal = sessionmaker(bind=engine)
    Base = declarative_base()

    class TrainedModel(Base):
        """Stores user-retrained models per facility, persisted across restarts."""
        __tablename__ = "trained_models"

        id           = Column(Integer, primary_key=True, index=True)
        facility_type = Column(String(50), nullable=False, index=True)
        model_blob   = Column(LargeBinary, nullable=False)   # joblib-serialized model
        r2           = Column(Float)
        mae          = Column(Float)
        rmse         = Column(Float)
        accuracy_pct = Column(Float)
        trained_rows = Column(Integer)
        trained_at   = Column(DateTime, default=datetime.utcnow)

    class UploadLog(Base):
        """Records every file upload for audit/history."""
        __tablename__ = "upload_logs"

        id            = Column(Integer, primary_key=True, index=True)
        facility_type = Column(String(50), nullable=False)
        filename      = Column(String(255))
        row_count     = Column(Integer)
        r2            = Column(Float)
        uploaded_at   = Column(DateTime, default=datetime.utcnow)

    class User(Base):
        """Registered users."""
        __tablename__ = "users"

        id            = Column(Integer, primary_key=True, index=True)
        name          = Column(String(100), nullable=False)
        email         = Column(String(255), unique=True, nullable=False, index=True)
        password_hash = Column(String(255), nullable=False)
        created_at    = Column(DateTime, default=datetime.utcnow)

    def init_db():
        """Create tables if they don't exist."""
        try:
            Base.metadata.create_all(bind=engine)
            print("[DB] Tables created/verified.")
        except Exception as e:
            print(f"[DB ERROR] init_db failed: {e}")
            traceback.print_exc()

    def save_model(facility_type: str, model, accuracy: dict):
        """Serialize and save a trained model to the database."""
        try:
            buf = io.BytesIO()
            joblib.dump(model, buf)
            blob = buf.getvalue()

            db = SessionLocal()
            try:
                # Delete any existing model for this facility
                db.query(TrainedModel).filter(
                    TrainedModel.facility_type == facility_type
                ).delete()

                record = TrainedModel(
                    facility_type = facility_type,
                    model_blob    = blob,
                    r2            = accuracy.get("r2"),
                    mae           = accuracy.get("mae"),
                    rmse          = accuracy.get("rmse"),
                    accuracy_pct  = accuracy.get("accuracy_percent"),
                    trained_rows  = accuracy.get("trained_on_rows"),
                    trained_at    = datetime.utcnow(),
                )
                db.add(record)
                db.commit()
                print(f"[DB] Saved model for {facility_type} (R²={accuracy.get('r2'):.4f})")
            finally:
                db.close()
        except Exception as e:
            print(f"[DB ERROR] save_model failed: {e}")
            traceback.print_exc()

    def load_model(facility_type: str):
        """Load the latest saved model for a facility. Returns (model, accuracy_dict) or (None, None)."""
        try:
            db = SessionLocal()
            try:
                record = (
                    db.query(TrainedModel)
                    .filter(TrainedModel.facility_type == facility_type)
                    .order_by(TrainedModel.trained_at.desc())
                    .first()
                )
                if record is None:
                    return None, None

                model = joblib.load(io.BytesIO(record.model_blob))
                accuracy = {
                    "r2":               record.r2,
                    "mae":              record.mae,
                    "rmse":             record.rmse,
                    "accuracy_percent": record.accuracy_pct,
                    "trained_on_rows":  record.trained_rows,
                    "model_type":       type(model).__name__,
                    "source":           "your_data",
                    "trained_at":       str(record.trained_at),
                }
                print(f"[DB] Loaded saved model for {facility_type} (R²={record.r2:.4f}, trained {record.trained_at})")
                return model, accuracy
            finally:
                db.close()
        except Exception as e:
            print(f"[DB ERROR] load_model failed: {e}")
            traceback.print_exc()
            return None, None

    def log_upload(facility_type: str, filename: str, row_count: int, r2: float = None):
        """Log a file upload event."""
        try:
            db = SessionLocal()
            try:
                db.add(UploadLog(
                    facility_type = facility_type,
                    filename      = filename,
                    row_count     = row_count,
                    r2            = r2,
                    uploaded_at   = datetime.utcnow(),
                ))
                db.commit()
            finally:
                db.close()
        except Exception as e:
            print(f"[DB ERROR] log_upload failed: {e}")

    def get_upload_history(facility_type: str, limit: int = 10):
        """Return recent uploads for a facility."""
        try:
            db = SessionLocal()
            try:
                rows = (
                    db.query(UploadLog)
                    .filter(UploadLog.facility_type == facility_type)
                    .order_by(UploadLog.uploaded_at.desc())
                    .limit(limit)
                    .all()
                )
                return [
                    {
                        "filename":     r.filename,
                        "row_count":    r.row_count,
                        "r2":           r.r2,
                        "uploaded_at":  str(r.uploaded_at),
                    }
                    for r in rows
                ]
            finally:
                db.close()
        except Exception as e:
            print(f"[DB ERROR] get_upload_history failed: {e}")
            return []

    def create_user(name: str, email: str, password_hash: str):
        """Insert a new user. Returns user dict or None if email taken."""
        try:
            db = SessionLocal()
            try:
                existing = db.query(User).filter(User.email == email).first()
                if existing:
                    return None  # email already registered
                user = User(name=name, email=email, password_hash=password_hash)
                db.add(user)
                db.commit()
                db.refresh(user)
                return {"id": user.id, "name": user.name, "email": user.email}
            finally:
                db.close()
        except Exception as e:
            print(f"[DB ERROR] create_user: {e}")
            return None

    def get_user_by_email(email: str):
        """Return user row dict or None."""
        try:
            db = SessionLocal()
            try:
                user = db.query(User).filter(User.email == email).first()
                if user is None:
                    return None
                return {
                    "id":            user.id,
                    "name":          user.name,
                    "email":         user.email,
                    "password_hash": user.password_hash,
                }
            finally:
                db.close()
        except Exception as e:
            print(f"[DB ERROR] get_user_by_email: {e}")
            return None

    def get_user_by_id(user_id: int):
        """Return user dict or None."""
        try:
            db = SessionLocal()
            try:
                user = db.query(User).filter(User.id == user_id).first()
                if user is None:
                    return None
                return {"id": user.id, "name": user.name, "email": user.email}
            finally:
                db.close()
        except Exception as e:
            print(f"[DB ERROR] get_user_by_id: {e}")
            return None

else:
    # No DATABASE_URL — all DB calls are no-ops
    print("[DB] No DATABASE_URL set — running without database (in-memory only).")

    def init_db():
        pass

    def save_model(facility_type, model, accuracy):
        pass

    def load_model(facility_type):
        return None, None

    def log_upload(facility_type, filename, row_count, r2=None):
        pass

    def get_upload_history(facility_type, limit=10):
        return []

    def create_user(name, email, password_hash):
        return None

    def get_user_by_email(email):
        return None

    def get_user_by_id(user_id):
        return None
