import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class UploadBatchOut(BaseModel):
    id: uuid.UUID
    institution_id: uuid.UUID
    submitted_by: uuid.UUID
    file_name: str
    file_checksum: str
    status: str
    total_rows: int
    valid_rows: int
    invalid_rows: int
    admission_cycle: str
    created_at: datetime
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class UploadCommitResponse(BaseModel):
    batch_id: uuid.UUID
    status: str
    total_rows: int
    committed_rows: int
    message: str
