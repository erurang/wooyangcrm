-- status_reason 필드의 amount 값이 빈 문자열("")일 때 정수로 변환 오류 해결
-- JSONB 필드에서 빈 문자열을 0으로 자동 변환하는 트리거 추가

-- 1. 트리거 함수 생성
CREATE OR REPLACE FUNCTION sanitize_status_reason()
RETURNS TRIGGER AS $$
BEGIN
  -- status_reason이 NULL이 아닌 경우에만 처리
  IF NEW.status_reason IS NOT NULL THEN
    -- JSONB 객체의 각 키를 순회하면서 amount 필드 처리
    IF NEW.status_reason ? 'completed' THEN
      -- amount 필드가 빈 문자열이거나 없으면 0으로 설정
      IF NOT (NEW.status_reason->'completed' ? 'amount') OR 
         NEW.status_reason->'completed'->>'amount' = '' OR
         NEW.status_reason->'completed'->>'amount' IS NULL THEN
        NEW.status_reason = jsonb_set(
          NEW.status_reason,
          '{completed,amount}',
          '0'::jsonb
        );
      END IF;
    END IF;
    
    IF NEW.status_reason ? 'canceled' THEN
      -- amount 필드가 빈 문자열이거나 없으면 0으로 설정
      IF NOT (NEW.status_reason->'canceled' ? 'amount') OR 
         NEW.status_reason->'canceled'->>'amount' = '' OR
         NEW.status_reason->'canceled'->>'amount' IS NULL THEN
        NEW.status_reason = jsonb_set(
          NEW.status_reason,
          '{canceled,amount}',
          '0'::jsonb
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. 트리거 생성 (INSERT와 UPDATE 시 실행)
DROP TRIGGER IF EXISTS sanitize_status_reason_trigger ON documents;

CREATE TRIGGER sanitize_status_reason_trigger
  BEFORE INSERT OR UPDATE OF status_reason ON documents
  FOR EACH ROW
  EXECUTE FUNCTION sanitize_status_reason();

-- 3. 기존 데이터 정리 (옵션)
-- 이미 저장된 데이터 중 amount가 빈 문자열인 경우 0으로 업데이트
UPDATE documents
SET status_reason = 
  CASE 
    WHEN status_reason->'completed'->>'amount' = '' THEN
      jsonb_set(status_reason, '{completed,amount}', '0'::jsonb)
    WHEN status_reason->'canceled'->>'amount' = '' THEN
      jsonb_set(status_reason, '{canceled,amount}', '0'::jsonb)
    ELSE status_reason
  END
WHERE status_reason IS NOT NULL 
  AND (
    status_reason->'completed'->>'amount' = '' OR 
    status_reason->'canceled'->>'amount' = ''
  );

-- 4. 검증 쿼리 (실행해서 문제가 있는 데이터 확인)
SELECT id, status_reason
FROM documents
WHERE status_reason IS NOT NULL 
  AND (
    status_reason->'completed'->>'amount' = '' OR 
    status_reason->'canceled'->>'amount' = ''
  );