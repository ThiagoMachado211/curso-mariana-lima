from pydantic import BaseModel

class BillingSettingsUpdate(BaseModel):
    mp_access_token: str
    mp_env: str = "sandbox"