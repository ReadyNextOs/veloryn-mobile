export type Uuid = string;
export type IsoTimestamp = string;

export interface Tenant {
  id: Uuid;
  code: string;
  name: string;
}

export interface User {
  id: Uuid;
  email: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string;
  avatar_url: string | null;
  tenant_id: Uuid;
  abilities?: string[];
}

export type MobileTokenStatus = 'pending' | 'active' | 'revoked';

export interface MobileToken {
  id: Uuid;
  name: string;
  abilities: string[];
  last_used_at: IsoTimestamp | null;
  paired_at: IsoTimestamp | null;
  expires_at: IsoTimestamp | null;
  created_at: IsoTimestamp;
  status: MobileTokenStatus;
}

export interface MobileTokenIssueRequest {
  device_name: string;
}

export interface MobileTokenIssueResponse {
  id: Uuid;
  plain_text_token: string;
  qr_payload: QrPayloadV1;
  qr_svg: string;
  expires_at: IsoTimestamp;
}

export interface QrPayloadV1 {
  v: 1;
  token: string;
  host: string;
  tenant_id: Uuid;
  tenant_code: string;
  user_email: string;
  issued_at: IsoTimestamp;
  expires_at: IsoTimestamp;
}

export interface MobileDeviceRegistration {
  expo_push_token: string;
  platform: 'ios' | 'android';
  app_version: string | null;
}

export interface MobileLoginRequest {
  email: string;
  password: string;
  device_info: {
    platform: string;
    app_version: string | null;
    device_name?: string | null;
    device_model?: string | null;
  };
}

export interface MobileLoginResponse {
  token: string;
  host: string;
  user: User;
  tenant: Tenant;
  abilities: string[];
  expires_at: IsoTimestamp | null;
  paired_at: IsoTimestamp;
}
