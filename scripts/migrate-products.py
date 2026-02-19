#!/usr/bin/env python3
"""
WooyangCRM 제품 마이그레이션 스크립트
- document_items에서 고유 제품명을 추출하여 products 생성
- document_items를 products에 연결 (product_id 설정)
- company_product_aliases 생성
"""

import json
import urllib.request
import collections
import re
import time
import sys

SUPABASE_URL = "https://ilgutkvsxazzmbdujidw.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsZ3V0a3ZzeGF6em1iZHVqaWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0OTUzOTYsImV4cCI6MjA4NzA3MTM5Nn0.Vch1tKkfAGjIFeKSkzj_M9c4rTAkpMycU1rfrpaoGes"

def api_request(method, path, data=None, params=""):
    url = f"{SUPABASE_URL}/rest/v1/{path}{params}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
    }
    if method == "POST":
        headers["Prefer"] = "return=representation"
    if method == "PATCH":
        headers["Prefer"] = "return=minimal"

    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read()
            if content:
                return json.loads(content)
            return None
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        print(f"  ERROR {e.code}: {error_body[:200]}")
        return None

def fetch_all(table, select, filters="", order="id.asc"):
    """배치로 전체 데이터 가져오기"""
    all_data = []
    offset = 0
    while True:
        params = f"?select={select}&limit=1000&offset={offset}{filters}&order={order}"
        batch = api_request("GET", table, params=params)
        if not batch:
            break
        all_data.extend(batch)
        offset += 1000
        if len(batch) < 1000:
            break
        if offset % 10000 == 0:
            print(f"  ... {offset}건 로드")
    return all_data

def normalize_name(name):
    """제품명 정규화 (메인 그룹핑용)"""
    if not name:
        return ""
    n = name.strip()
    n = re.sub(r'[\t\r\n]+', ' ', n)
    n = n.lower()
    # 하이픈과 공백 통일
    n = re.sub(r'[-\s]+', ' ', n)
    # 슬래시 앞뒤 공백 제거
    n = re.sub(r'\s*/\s*', '/', n)
    # 괄호 앞 공백 통일
    n = re.sub(r'\s*\(\s*', '(', n)
    n = re.sub(r'\s*\)\s*', ')', n)
    # 다중 공백 정리
    n = re.sub(r'\s+', ' ', n)
    return n.strip()

def clean_name(name):
    """원본 이름 정리 (탭, 불필요 공백 제거)"""
    if not name:
        return ""
    n = name.strip()
    n = re.sub(r'[\t\r\n]+', ' ', n)
    n = re.sub(r'\s+', ' ', n)
    return n.strip()

def generate_code(index):
    """제품 코드 생성: WY-00001 형태"""
    return f"WY-{index:05d}"

# ========================================
# STEP 1: 전체 document_items 가져오기
# ========================================
print("=" * 60)
print("STEP 1: document_items 전체 로드")
print("=" * 60)

all_items = fetch_all("document_items", "id,document_id,name,spec,quantity,unit,unit_price", "&name=neq.")
print(f"  로드 완료: {len(all_items)}건")

# document_id → company_id 매핑을 위해 documents도 가져오기
print("\n  documents 로드 중...")
all_docs = fetch_all("documents", "id,company_id,type")
doc_map = {d['id']: d for d in all_docs}
print(f"  documents 로드 완료: {len(all_docs)}건")

# ========================================
# STEP 2: 제품명 그룹핑
# ========================================
print("\n" + "=" * 60)
print("STEP 2: 제품명 그룹핑")
print("=" * 60)

groups = collections.defaultdict(list)
skipped = 0

for item in all_items:
    raw = item['name'].strip()
    if not raw or len(raw) <= 1:
        skipped += 1
        continue
    # 보조설명 제외 (*, :로 시작)
    if raw.startswith('*') or raw.startswith(':'):
        skipped += 1
        continue
    key = normalize_name(raw)
    if key and len(key) > 1:
        groups[key].append(item)
    else:
        skipped += 1

print(f"  그룹 수: {len(groups)}")
print(f"  커버 items: {sum(len(v) for v in groups.values())}")
print(f"  스킵 items: {skipped}")

# ========================================
# STEP 3: 제품 후보 목록 생성
# ========================================
print("\n" + "=" * 60)
print("STEP 3: 제품 후보 목록 생성")
print("=" * 60)

product_list = []
code_index = 1

for key, items in sorted(groups.items(), key=lambda x: -len(x[1])):
    # 대표 이름 결정 (가장 많이 사용된 원본)
    name_counter = collections.Counter()
    spec_set = set()
    unit_counter = collections.Counter()

    for item in items:
        cleaned = clean_name(item['name'])
        name_counter[cleaned] += 1
        s = (item.get('spec') or '').strip()
        if s:
            spec_set.add(s)
        # 단위 추출 (quantity에서)
        qty_str = (item.get('quantity') or '').strip()
        # "100EA", "200m", "5롤" 등에서 단위 추출
        unit_match = re.search(r'[가-힣a-zA-Z]+$', qty_str)
        if unit_match:
            unit_counter[unit_match.group()] += 1

    representative_name = name_counter.most_common(1)[0][0]

    # 가장 많이 사용된 단위
    unit = unit_counter.most_common(1)[0][0] if unit_counter else "EA"
    # 단위 정규화
    unit_lower = unit.lower()
    if unit_lower in ['ea', 'pcs', 'pc', '개']:
        unit = 'EA'
    elif unit_lower in ['m', 'M', '미터']:
        unit = 'M'
    elif unit_lower in ['롤', 'roll', '롤(roll)']:
        unit = '롤'
    elif unit_lower in ['kg', 'KG']:
        unit = 'KG'
    elif unit_lower in ['set', 'SET', '세트']:
        unit = 'SET'
    elif unit_lower in ['콘', '콘(cone)']:
        unit = '콘'
    elif unit_lower in ['장', '매']:
        unit = '장'
    elif unit_lower in ['본']:
        unit = '본'
    elif unit_lower in ['box', 'BOX', '박스']:
        unit = 'BOX'

    product_list.append({
        'key': key,
        'internal_code': generate_code(code_index),
        'internal_name': representative_name,
        'unit': unit,
        'item_count': len(items),
        'spec_count': len(spec_set),
        'item_ids': [item['id'] for item in items],
        'name_variants': dict(name_counter),
        'items': items,  # 전체 item 데이터 보관
    })
    code_index += 1

print(f"  생성할 제품 수: {len(product_list)}")
print(f"  Top 10:")
for p in product_list[:10]:
    print(f"    {p['internal_code']}: {p['internal_name']} ({p['item_count']}건, {p['spec_count']}규격)")

# ========================================
# STEP 4: products 테이블에 INSERT (배치)
# ========================================
print("\n" + "=" * 60)
print("STEP 4: products 테이블에 INSERT")
print("=" * 60)

BATCH_SIZE = 50
total_created = 0
product_id_map = {}  # key -> product_id

for i in range(0, len(product_list), BATCH_SIZE):
    batch = product_list[i:i+BATCH_SIZE]
    insert_data = []

    for p in batch:
        insert_data.append({
            'internal_code': p['internal_code'],
            'internal_name': p['internal_name'],
            'type': 'finished',
            'unit': p['unit'],
            'current_stock': 0,
            'is_active': True,
        })

    result = api_request("POST", "products", data=insert_data)

    if result:
        for j, created in enumerate(result):
            product_key = product_list[i + j]['key']
            product_id_map[product_key] = created['id']
        total_created += len(result)
    else:
        print(f"  BATCH {i//BATCH_SIZE + 1} FAILED!")
        # 개별 삽입 시도
        for j, item in enumerate(insert_data):
            single_result = api_request("POST", "products", data=item)
            if single_result and isinstance(single_result, list):
                product_key = product_list[i + j]['key']
                product_id_map[product_key] = single_result[0]['id']
                total_created += 1

    if (i + BATCH_SIZE) % 500 == 0 or i + BATCH_SIZE >= len(product_list):
        print(f"  ... {min(i + BATCH_SIZE, len(product_list))}/{len(product_list)} 처리 ({total_created}건 생성)")

    # Rate limiting 방지
    if (i // BATCH_SIZE) % 10 == 9:
        time.sleep(0.5)

print(f"\n  products 생성 완료: {total_created}건")
print(f"  매핑된 product_id: {len(product_id_map)}건")

# ========================================
# STEP 5: document_items에 product_id 연결
# ========================================
print("\n" + "=" * 60)
print("STEP 5: document_items에 product_id 연결")
print("=" * 60)

total_linked = 0
link_errors = 0

for idx, product in enumerate(product_list):
    product_id = product_id_map.get(product['key'])
    if not product_id:
        continue

    item_ids = product['item_ids']

    # 배치로 업데이트 (한 번에 최대 100개씩)
    for batch_start in range(0, len(item_ids), 100):
        batch_ids = item_ids[batch_start:batch_start + 100]

        # Supabase REST API에서 IN 필터 사용
        id_filter = ",".join(batch_ids)
        params = f"?id=in.({id_filter})"

        update_data = {
            'product_id': product_id,
            'internal_name': product['internal_name'],
        }

        result = api_request("PATCH", "document_items", data=update_data, params=params)
        total_linked += len(batch_ids)

    if (idx + 1) % 500 == 0 or idx + 1 == len(product_list):
        print(f"  ... {idx + 1}/{len(product_list)} 제품 처리 ({total_linked}건 연결)")

    # Rate limiting 방지
    if idx % 50 == 49:
        time.sleep(0.3)

print(f"\n  document_items 연결 완료: {total_linked}건")

# ========================================
# STEP 6: company_product_aliases 생성
# ========================================
print("\n" + "=" * 60)
print("STEP 6: company_product_aliases 생성")
print("=" * 60)

alias_count = 0
alias_batch = []

for product in product_list:
    product_id = product_id_map.get(product['key'])
    if not product_id:
        continue

    # 이 제품의 items에서 company별 이름 변형 추출
    company_names = collections.defaultdict(lambda: collections.Counter())

    for item in product['items']:
        doc = doc_map.get(item.get('document_id'))
        if doc and doc.get('company_id'):
            cleaned = clean_name(item['name'])
            spec = (item.get('spec') or '').strip()
            company_names[doc['company_id']][(cleaned, spec)] += 1

    for company_id, name_specs in company_names.items():
        # 가장 많이 사용된 이름+규격 조합을 alias로
        (ext_name, ext_spec), use_count = name_specs.most_common(1)[0]

        alias_batch.append({
            'company_id': company_id,
            'product_id': product_id,
            'alias_type': 'purchase',
            'external_name': ext_name,
            'external_spec': ext_spec or None,
            'is_default': True,
            'use_count': use_count,
        })

        # 배치 저장
        if len(alias_batch) >= 50:
            result = api_request("POST", "company_product_aliases", data=alias_batch)
            if result:
                alias_count += len(result)
            alias_batch = []

            if alias_count % 1000 == 0:
                print(f"  ... {alias_count}건 생성")
            time.sleep(0.3)

# 남은 배치 처리
if alias_batch:
    result = api_request("POST", "company_product_aliases", data=alias_batch)
    if result:
        alias_count += len(result)

print(f"\n  aliases 생성 완료: {alias_count}건")

# ========================================
# 결과 요약
# ========================================
print("\n" + "=" * 60)
print("마이그레이션 완료!")
print("=" * 60)
print(f"  생성된 products: {total_created}")
print(f"  연결된 document_items: {total_linked}")
print(f"  생성된 aliases: {alias_count}")
print(f"  스킵된 items (보조설명 등): {skipped}")
