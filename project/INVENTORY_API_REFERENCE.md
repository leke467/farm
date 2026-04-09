# Inventory API Endpoints - Complete Reference

## Base URL
```
http://localhost:8000/api/inventory/
```

## Authentication
All endpoints require Authorization header:
```
Authorization: Token <your_auth_token>
```

## Farm Multi-Tenancy
All requests are automatically filtered to the active farm. Use the `farm` query parameter if needed to override.

---

## 1. Inventory Items

### List All Items
```bash
GET /api/inventory/

# With filters
GET /api/inventory/?category=feed
GET /api/inventory/?search=wheat
GET /api/inventory/?ordering=name

# Pagination (if enabled)
GET /api/inventory/?page=1&page_size=20
```

**Response**: Array of InventoryItem objects with nested transactions, movements, and cost tracking

### Create Item
```bash
POST /api/inventory/
Content-Type: application/json

{
  "name": "Animal Feed Premium Mix",
  "category": "feed",
  "description": "High-protein feed mix for dairy cattle",
  "unit": "kg",
  "quantity": 1000.00,
  "min_quantity": 100.00,
  "reorder_quantity": 500.00,
  "unit_price": 45.50,
  "supplier": "FarmCo Supplies",
  "location": "Warehouse A, Shelf 3",
  "expiry_date": "2025-12-31",
  "farm": 1
}
```

### Retrieve Item Details
```bash
GET /api/inventory/<id>/
```

**Returns**: Detailed item with all transactions, movements, and cost tracking

### Update Item
```bash
PATCH /api/inventory/<id>/
Content-Type: application/json

{
  "quantity": 850.00,
  "min_quantity": 150.00,
  "location": "Warehouse B, Shelf 1"
}
```

### Delete Item
```bash
DELETE /api/inventory/<id>/
```

---

## 2. Inventory Transactions

### Record Transaction
```bash
POST /api/inventory/transactions/
Content-Type: application/json

{
  "item": 1,
  "transaction_type": "in",  # in, out, adjustment
  "quantity": 500.00,
  "cost_per_unit": 45.50,
  "total_cost": 22750.00,  # Auto-calculated
  "status": "completed",     # pending, completed, cancelled
  "transaction_date": "2025-01-10",
  "reason": "Bulk purchase from supplier",
  "reference": "PO-2025-001",
  "notes": "Received invoice #INV-2025-456"
}
```

**Auto-calculated**: `total_cost = quantity × cost_per_unit`

### List Transactions
```bash
GET /api/inventory/transactions/

# With filters
GET /api/inventory/transactions/?transaction_type=in
GET /api/inventory/transactions/?status=completed
GET /api/inventory/transactions/?transaction_type=out&status=pending

# Search
GET /api/inventory/transactions/?search=wheat
GET /api/inventory/transactions/?search=PO-2025

# Ordering
GET /api/inventory/transactions/?ordering=-transaction_date  # Newest first
GET /api/inventory/transactions/?ordering=transaction_date   # Oldest first

# Combined
GET /api/inventory/transactions/?transaction_type=out&status=completed&ordering=-transaction_date
```

### Get Transaction Details
```bash
GET /api/inventory/transactions/<id>/
```

### Update Transaction
```bash
PATCH /api/inventory/transactions/<id>/
Content-Type: application/json

{
  "status": "cancelled",
  "notes": "Cancelled due to damage"
}
```

### Delete Transaction
```bash
DELETE /api/inventory/transactions/<id>/
```

---

## 3. Stock Movements

### Record Stock Movement
```bash
POST /api/inventory/movements/
Content-Type: application/json

{
  "item": 5,
  "transaction": null,  # Optional: Link to transaction
  "movement_type": "transfer",  # receipt, issue, transfer, return, adjustment
  "quantity": 250.00,
  "batch_number": "BATCH-2024-Q4-001",
  "source_location": "Warehouse A, Shelf 3",
  "destination_location": "Warehouse B, Shelf 1",
  "movement_date": "2025-01-10",
  "description": "Quarterly inventory rebalancing"
}
```

**Movement Types**:
- `receipt`: Incoming stock from supplier
- `issue`: Stock sent out to farm operations
- `transfer`: Movement between storage locations
- `return`: Return to supplier
- `adjustment`: Physical count adjustments

### List Movements
```bash
GET /api/inventory/movements/

# With filters
GET /api/inventory/movements/?movement_type=issue
GET /api/inventory/movements/?movement_type=transfer

# Search by batch, location, or item
GET /api/inventory/movements/?search=BATCH-2024
GET /api/inventory/movements/?search=Warehouse%20B

# Ordering
GET /api/inventory/movements/?ordering=-movement_date
```

### Get Movement Details
```bash
GET /api/inventory/movements/<id>/
```

### Delete Movement
```bash
DELETE /api/inventory/movements/<id>/
```

---

## 4. Inventory Audits

### Create New Audit
```bash
POST /api/inventory/audits/
Content-Type: application/json

{
  "audit_date": "2025-01-15",
  "status": "draft",  # draft, in_progress, completed
  "notes": "Q1 2025 Physical Inventory Count"
}
```

**Status Workflow**:
- `draft`: Initial state, preparing for audit
- `in_progress`: Actively counting inventory
- `completed`: Audit finished and reconciled

### List Audits
```bash
GET /api/inventory/audits/

# Filter by status
GET /api/inventory/audits/?status=in_progress
GET /api/inventory/audits/?status=completed

# Ordering
GET /api/inventory/audits/?ordering=-audit_date
```

**Response includes**: Array of line_items with variance details

### Get Audit Details
```bash
GET /api/inventory/audits/<id>/
```

**Returns**: Full audit with all line items and variance calculations

### Update Audit Status
```bash
PATCH /api/inventory/audits/<id>/
Content-Type: application/json

{
  "status": "in_progress",
  "notes": "Updated - variance investigation ongoing"
}
```

### Delete Audit
```bash
DELETE /api/inventory/audits/<id>/
```

---

## 5. Audit Line Items

### Add Item to Audit
```bash
POST /api/inventory/audits/
Content-Type: application/json

{
  "audit": 1,
  "item": 5,
  "expected_quantity": 500.00,  # System quantity
  "counted_quantity": 475.00,   # Physical count
  "notes": "Found 25 units damaged, excluded from count"
}
```

**Auto-calculated**: 
- `variance = counted_quantity - expected_quantity` (-25.00)
- `variance_percentage = (variance / expected_quantity) × 100` (-5.00%)

### Color Coding for Variance
- 🟢 Green: variance between -5% and 5% (acceptable)
- 🟠 Orange: variance between -5% and 5% (minor issues)
- 🔴 Red: variance > ±5% (significant discrepancy)

### List Audit Line Items (via audit)
```bash
GET /api/inventory/audits/<audit_id>/
```

**Returns**: Array with all line_items

---

## 6. Inventory Cost Tracking

### View Cost Tracking (Read-Only)
```bash
GET /api/inventory/<item_id>/cost_tracking/
```

**Cost Methods Available**:
- `fifo`: First In, First Out (older inventory issued first)
- `lifo`: Last In, First Out (newer inventory issued first)
- `weighted_avg`: Weighted Average (running average cost)

**Fields Tracked**:
- `total_units_purchased`: Cumulative purchases
- `total_units_issued`: Cumulative issuances
- `total_purchase_cost`: Total amount spent
- `weighted_avg_cost`: Average cost per unit

---

## 7. Dashboard & Utility Endpoints

### Get Inventory Dashboard Summary
```bash
GET /api/inventory/dashboard/
```

**Response**:
```json
{
  "total_items": 42,
  "low_stock_count": 5,
  "expiring_soon": 3,
  "total_inventory_value": 125500.50,
  "categories": {
    "feed": 15,
    "medicine": 8,
    "equipment": 12,
    "other": 7
  }
}
```

### Get Low Stock Items
```bash
GET /api/inventory/low-stock/
```

**Returns**: Array of items where `quantity <= min_quantity`

**Use Case**: Dashboard alerts, reorder notifications, procurement warnings

---

## Common Query Patterns

### Get all incoming stock this month
```bash
GET /api/inventory/transactions/?transaction_type=in&transaction_date__gte=2025-01-01&ordering=-transaction_date
```

### Find damaged goods to investigate
```bash
GET /api/inventory/audits/?status=in_progress
# Check line_items for variance > 10%
```

### Track specific item movements
```bash
GET /api/inventory/movements/?search=ITEM_NAME
```

### Cost analysis for specific period
```bash
GET /api/inventory/transactions/?transaction_type=in&transaction_date__gte=2024-01-01&ordering=-transaction_date
# Sum total_cost values per item
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid quantity",
  "detail": "Quantity must be greater than 0"
}
```

### 401 Unauthorized
```json
{
  "detail": "Authentication credentials were not provided."
}
```

### 403 Forbidden
```json
{
  "detail": "You do not have permission to perform this action."
}
```

### 404 Not Found
```json
{
  "detail": "Not found."
}
```

### 500 Internal Server Error
```json
{
  "error": "Server error",
  "detail": "An unexpected error occurred"
}
```

---

## Success Response Format

All successful responses follow this format:

**Single Object (GET <id>, POST, PATCH)**:
```json
{
  "id": 1,
  "field1": "value1",
  "field2": "value2",
  ...
}
```

**List (GET without id)**:
```json
[
  {
    "id": 1,
    "field1": "value1",
    ...
  },
  {
    "id": 2,
    "field1": "value2",
    ...
  }
]
```

---

## Pagination (If Enabled)

```bash
GET /api/inventory/?page=1&page_size=20

# Response includes pagination info
{
  "count": 150,
  "next": "http://localhost:8000/api/inventory/?page=2&page_size=20",
  "previous": null,
  "results": [...]
}
```

---

## Testing with cURL

### Create inventory item
```bash
curl -X POST http://localhost:8000/api/inventory/ \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Feed",
    "category": "feed",
    "unit": "kg",
    "quantity": 100,
    "min_quantity": 10,
    "farm": 1
  }'
```

### Record transaction
```bash
curl -X POST http://localhost:8000/api/inventory/transactions/ \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "item": 1,
    "transaction_type": "in",
    "quantity": 50,
    "cost_per_unit": 25.00,
    "status": "completed",
    "transaction_date": "2025-01-10"
  }'
```

### View low stock items
```bash
curl -X GET http://localhost:8000/api/inventory/low-stock/ \
  -H "Authorization: Token YOUR_TOKEN"
```

---

## Notes

1. **Cost Per Unit**: Always optional in transactions, defaults to 0
2. **Total Cost**: Auto-calculated if cost_per_unit is provided; otherwise 0
3. **Timestamps**: All dates use ISO 8601 format (YYYY-MM-DD)
4. **Farm Isolation**: All queries automatically filter to active farm
5. **Batch Tracking**: Batch numbers support FIFO/LIFO selection algorithms
6. **Audit Workflow**: Audits must have at least 1 line item before completion
7. **Variance Calculation**: Automatically computed and updated on line item changes
