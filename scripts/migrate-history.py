#!/usr/bin/env python3
"""
WooyangCRM 가격이력/거래기록 마이그레이션 스크립트
- document_items에서 product_price_history 생성
- 완료된 문서에서 product_transactions 생성
"""

import json
import urllib.request
import collections
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
        headers["Prefer"] = "return=minimal"
    if method == "PATCH":
        headers["Prefer"] = "return=minimal"

    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read()
            if content:
                return json.loads(content)
            return True
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        print(f"  ERROR {e.code}: {error_body[:200]}")
        return None


def fetch_all(table, select, filters="", order="id.asc"):
    all_data = []
    offset = 0
    while True:
        params = f"?select={select}&limit=1000&offset={offset}{filters}&order={order}"
        batch = api_request("GET", table, params=params)
        if not batch or not isinstance(batch, list):
            break
        all_data.extend(batch)
        offset += 1000
        if len(batch) < 1000:
            break
        if offset % 10000 == 0:
            print(f"  ... {offset}건 로드")
    return all_data


# ========================================
# STEP 1: 연결된 document_items + 문서 정보 가져오기
# ========================================
print("=" * 60)
print("STEP 1: 연결된 document_items 로드")
print("=" * 60)

# document_items (product_id가 있는 것만)
items = fetch_all(
    "document_items",
    "id,document_id,product_id,name,spec,quantity,unit,unit_price,amount",
    "&product_id=not.is.null"
)
print(f"  연결된 items: {len(items)}")

# documents (날짜, 유형, 회사, 상태)
print("  documents 로드 중...")
docs = fetch_all("documents", "id,type,date,company_id,status")
doc_map = {d['id']: d for d in docs}
print(f"  documents: {len(docs)}")


# ========================================
# STEP 2: product_price_history 생성
# ========================================
print("\n" + "=" * 60)
print("STEP 2: product_price_history 생성")
print("=" * 60)

# 제품별 + 회사별 + 날짜별로 가격 이력 집계
price_records = []
seen_keys = set()

for item in items:
    doc = doc_map.get(item.get('document_id'))
    if not doc or not item.get('product_id'):
        continue

    unit_price = item.get('unit_price', 0) or 0
    if unit_price <= 0:
        continue

    product_id = item['product_id']
    company_id = doc.get('company_id')
    doc_date = doc.get('date', '')
    doc_type = doc.get('type', '')

    # 가격 유형: order=매입, estimate=매출
    price_type = "purchase" if doc_type == "order" else "sales"

    # 중복 방지 키: product+company+date+type
    key = f"{product_id}|{company_id}|{doc_date}|{price_type}|{unit_price}"
    if key in seen_keys:
        continue
    seen_keys.add(key)

    spec = (item.get('spec') or '').strip() or None

    price_records.append({
        'product_id': product_id,
        'company_id': company_id,
        'price_type': price_type,
        'unit_price': unit_price,
        'spec': spec,
        'document_id': item.get('document_id'),
        'document_type': doc_type,
        'effective_date': doc_date or '2024-01-01',
    })

print(f"  가격 이력 레코드: {len(price_records)}건")

# 배치 INSERT
BATCH_SIZE = 100
total_inserted = 0

for i in range(0, len(price_records), BATCH_SIZE):
    batch = price_records[i:i + BATCH_SIZE]
    result = api_request("POST", "product_price_history", data=batch)
    if result is not None:
        total_inserted += len(batch)

    if (i + BATCH_SIZE) % 5000 == 0 or i + BATCH_SIZE >= len(price_records):
        print(f"  ... {min(i + BATCH_SIZE, len(price_records))}/{len(price_records)} 처리 ({total_inserted}건)")

    if (i // BATCH_SIZE) % 20 == 19:
        time.sleep(0.3)

print(f"\n  price_history INSERT 완료: {total_inserted}건")


# ========================================
# STEP 3: product_transactions 생성 (완료 문서)
# ========================================
print("\n" + "=" * 60)
print("STEP 3: product_transactions 생성 (완료 문서)")
print("=" * 60)

# 완료된 문서의 items만 필터
completed_docs = {d['id'] for d in docs if d.get('status') == 'completed'}
print(f"  완료 문서 수: {len(completed_docs)}")

# 제품별 재고 추적
product_stock = collections.defaultdict(float)  # product_id → 현재 재고
transaction_records = []

# 날짜순 정렬
completed_items = []
for item in items:
    doc = doc_map.get(item.get('document_id'))
    if not doc or doc['id'] not in completed_docs:
        continue
    completed_items.append((doc.get('date', ''), doc.get('type', ''), item, doc))

completed_items.sort(key=lambda x: x[0])
print(f"  완료 문서의 연결된 items: {len(completed_items)}건")

import re

def parse_quantity(qty_str):
    """수량 문자열에서 숫자 추출"""
    if not qty_str:
        return 0
    # 콤마 제거
    qty_str = str(qty_str).replace(',', '')
    # 숫자 부분만 추출
    match = re.match(r'^[\d.]+', qty_str)
    if match:
        try:
            return float(match.group())
        except ValueError:
            return 0
    return 0

for doc_date, doc_type, item, doc in completed_items:
    product_id = item['product_id']
    quantity = parse_quantity(item.get('quantity', '0'))

    if quantity <= 0:
        continue

    stock_before = product_stock[product_id]

    if doc_type == 'order':
        # 발주서 완료 → 입고
        stock_after = stock_before + quantity
        trans_type = 'inbound'
    elif doc_type == 'estimate':
        # 견적서 완료 → 출고
        stock_after = stock_before - quantity
        trans_type = 'outbound'
    else:
        continue

    product_stock[product_id] = stock_after

    transaction_records.append({
        'product_id': product_id,
        'transaction_type': trans_type,
        'quantity': quantity if trans_type == 'inbound' else -quantity,
        'stock_before': stock_before,
        'stock_after': stock_after,
        'reference_type': 'document',
        'reference_id': doc['id'],
        'notes': f"{'발주서' if doc_type == 'order' else '견적서'} 완료 자동 처리",
        'transaction_date': doc_date or '2024-01-01',
    })

print(f"  거래 기록: {len(transaction_records)}건")

# 배치 INSERT
total_tx = 0

for i in range(0, len(transaction_records), BATCH_SIZE):
    batch = transaction_records[i:i + BATCH_SIZE]
    result = api_request("POST", "product_transactions", data=batch)
    if result is not None:
        total_tx += len(batch)

    if (i + BATCH_SIZE) % 5000 == 0 or i + BATCH_SIZE >= len(transaction_records):
        print(f"  ... {min(i + BATCH_SIZE, len(transaction_records))}/{len(transaction_records)} 처리 ({total_tx}건)")

    if (i // BATCH_SIZE) % 20 == 19:
        time.sleep(0.3)

print(f"\n  product_transactions INSERT 완료: {total_tx}건")


# ========================================
# STEP 4: products.current_stock 업데이트
# ========================================
print("\n" + "=" * 60)
print("STEP 4: products.current_stock 업데이트")
print("=" * 60)

update_count = 0
for product_id, stock in product_stock.items():
    if stock == 0:
        continue

    # stock이 음수가 되면 0으로
    final_stock = max(stock, 0)

    result = api_request(
        "PATCH", "products",
        data={'current_stock': final_stock},
        params=f"?id=eq.{product_id}"
    )
    if result is not None:
        update_count += 1

    if update_count % 500 == 0 and update_count > 0:
        print(f"  ... {update_count}건 업데이트")
        time.sleep(0.3)

print(f"\n  products stock 업데이트: {update_count}건")


# ========================================
# 결과 요약
# ========================================
print("\n" + "=" * 60)
print("마이그레이션 완료!")
print("=" * 60)
print(f"  price_history: {total_inserted}건")
print(f"  product_transactions: {total_tx}건")
print(f"  stock 업데이트: {update_count}건")

# 재고 통계
positive_stock = sum(1 for s in product_stock.values() if s > 0)
negative_stock = sum(1 for s in product_stock.values() if s < 0)
zero_stock = sum(1 for s in product_stock.values() if s == 0)
print(f"\n  재고 양수: {positive_stock}개 제품")
print(f"  재고 음수(→0 처리): {negative_stock}개 제품")
print(f"  재고 0: {zero_stock}개 제품")
