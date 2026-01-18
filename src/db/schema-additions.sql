-- =============================================
-- API 로그 테이블
-- API 호출 기록을 저장합니다
-- =============================================
CREATE TABLE IF NOT EXISTS api_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code INTEGER,
  response_time_ms INTEGER,
  request_body JSONB,
  response_summary TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API 로그 인덱스
CREATE INDEX IF NOT EXISTS idx_api_logs_user_id ON api_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_endpoint ON api_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_logs_created_at ON api_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_logs_status_code ON api_logs(status_code);

-- =============================================
-- 사용자 활동 로그 테이블
-- 사용자의 주요 활동을 기록합니다
-- =============================================
CREATE TABLE IF NOT EXISTS user_activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL, -- 'login', 'logout', 'create_document', 'update_company', etc.
  action_type VARCHAR(50) NOT NULL, -- 'auth', 'crud', 'view', 'export'
  target_type VARCHAR(50), -- 'document', 'company', 'consultation', 'user'
  target_id UUID,
  target_name VARCHAR(255),
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 활동 로그 인덱스
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_action ON user_activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_action_type ON user_activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON user_activity_logs(created_at DESC);

-- =============================================
-- 세션 로그 테이블
-- 사용자 로그인/로그아웃 세션을 기록합니다
-- =============================================
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  device_type VARCHAR(20), -- 'desktop', 'mobile', 'tablet'
  browser VARCHAR(50),
  os VARCHAR(50),
  login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  logout_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 세션 인덱스
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_login_at ON user_sessions(login_at DESC);

-- =============================================
-- 권한 관리 테이블
-- 역할별 상세 권한을 관리합니다
-- =============================================
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  permission_key VARCHAR(100) NOT NULL, -- 예: 'sidebar.dashboard', 'feature.delete_document'
  permission_name VARCHAR(100) NOT NULL, -- 예: '대시보드 접근', '문서 삭제'
  category VARCHAR(50) NOT NULL, -- 'sidebar', 'feature', 'admin'
  is_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role_id, permission_key)
);

-- 권한 인덱스
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_category ON role_permissions(category);

-- =============================================
-- 기본 권한 데이터 삽입
-- =============================================
-- 사이드바 권한
INSERT INTO role_permissions (role_id, permission_key, permission_name, category, is_enabled)
SELECT r.id, p.key, p.name, p.category,
  CASE WHEN r.role_name = 'admin' THEN TRUE ELSE FALSE END
FROM roles r
CROSS JOIN (VALUES
  ('sidebar.dashboard', '대시보드', 'sidebar'),
  ('sidebar.consultations', '상담 관리', 'sidebar'),
  ('sidebar.documents', '문서 관리', 'sidebar'),
  ('sidebar.products', '품목 관리', 'sidebar'),
  ('sidebar.manage', '거래처/담당자 관리', 'sidebar'),
  ('sidebar.inventory', '재고 관리', 'sidebar'),
  ('sidebar.reports', '리포트', 'sidebar'),
  ('sidebar.board', '게시판', 'sidebar'),
  ('sidebar.overseas', '해외 영업', 'sidebar'),
  ('sidebar.admin', '관리자 메뉴', 'sidebar')
) AS p(key, name, category)
ON CONFLICT (role_id, permission_key) DO NOTHING;

-- 기능 권한
INSERT INTO role_permissions (role_id, permission_key, permission_name, category, is_enabled)
SELECT r.id, p.key, p.name, p.category,
  CASE WHEN r.role_name = 'admin' THEN TRUE ELSE FALSE END
FROM roles r
CROSS JOIN (VALUES
  ('feature.create_document', '문서 생성', 'feature'),
  ('feature.edit_document', '문서 수정', 'feature'),
  ('feature.delete_document', '문서 삭제', 'feature'),
  ('feature.create_consultation', '상담 생성', 'feature'),
  ('feature.edit_consultation', '상담 수정', 'feature'),
  ('feature.delete_consultation', '상담 삭제', 'feature'),
  ('feature.create_company', '거래처 생성', 'feature'),
  ('feature.edit_company', '거래처 수정', 'feature'),
  ('feature.export_data', '데이터 내보내기', 'feature'),
  ('feature.bulk_operations', '일괄 작업', 'feature')
) AS p(key, name, category)
ON CONFLICT (role_id, permission_key) DO NOTHING;

-- =============================================
-- 뷰: 일일 API 통계
-- =============================================
CREATE OR REPLACE VIEW api_daily_stats AS
SELECT
  DATE(created_at) as date,
  endpoint,
  COUNT(*) as total_calls,
  COUNT(CASE WHEN status_code >= 200 AND status_code < 300 THEN 1 END) as success_count,
  COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_count,
  AVG(response_time_ms) as avg_response_time,
  MAX(response_time_ms) as max_response_time
FROM api_logs
GROUP BY DATE(created_at), endpoint;

-- =============================================
-- 뷰: 사용자별 활동 요약
-- =============================================
CREATE OR REPLACE VIEW user_activity_summary AS
SELECT
  user_id,
  DATE(created_at) as date,
  action_type,
  COUNT(*) as action_count
FROM user_activity_logs
GROUP BY user_id, DATE(created_at), action_type;
