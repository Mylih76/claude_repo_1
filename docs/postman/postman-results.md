# Postman Test Results

Bu dosya API endpoint'lerinin test sonuçlarını kaydetmek için kullanılır.

---

## Auth Endpoints

### POST /api/auth/register

**Request:**
```json
{
  "email": "agent@example.com",
  "password": "SecurePass123!",
  "name": "Test Agent",
  "phone": "+905551234567"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "uuid-here",
    "email": "agent@example.com",
    "name": "Test Agent",
    "phone": "+905551234567",
    "createdAt": "2025-01-01T00:00:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Test Date:** _______________
**Status:** [ ] Passed / [ ] Failed
**Notes:** _______________

---

### POST /api/auth/login

**Request:**
```json
{
  "email": "agent@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid-here",
    "email": "agent@example.com",
    "name": "Test Agent",
    "phone": "+905551234567"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Test Date:** _______________
**Status:** [ ] Passed / [ ] Failed
**Notes:** _______________

---

### GET /api/auth/me

**Headers:**
```
Authorization: Bearer {{token}}
```

**Response (200):**
```json
{
  "id": "uuid-here",
  "email": "agent@example.com",
  "name": "Test Agent",
  "phone": "+905551234567",
  "avatarUrl": null,
  "isActive": true,
  "lastLoginAt": "2025-01-01T12:00:00.000Z",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T12:00:00.000Z"
}
```

**Test Date:** _______________
**Status:** [ ] Passed / [ ] Failed
**Notes:** _______________

---

## Listings Endpoints

### POST /api/listings

**Request:**
```json
{
  "listingType": "sale",
  "propertyType": "apartment",
  "title": "3+1 Deniz Manzaralı Daire",
  "description": "Kadıköy Moda'da eşsiz deniz manzaralı daire.",
  "price": 2500000,
  "currency": "TRY",
  "grossSqm": 150,
  "netSqm": 130,
  "roomCount": "3+1",
  "buildingAge": 5,
  "floorNumber": 8,
  "totalFloors": 12,
  "isFurnished": false,
  "heatingType": "central",
  "viewType": "sea",
  "isInComplex": true,
  "dues": 1500,
  "city": "İstanbul",
  "district": "Kadıköy",
  "neighborhood": "Moda",
  "features": ["elevator", "parking", "security", "pool", "gym"]
}
```

**Response (201):**
```json
{
  "id": "uuid-here",
  "userId": "user-uuid",
  "listingType": "sale",
  "propertyType": "apartment",
  "status": "active",
  "title": "3+1 Deniz Manzaralı Daire",
  "price": "2500000",
  "city": "İstanbul",
  "district": "Kadıköy",
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

**Test Date:** _______________
**Status:** [ ] Passed / [ ] Failed
**Notes:** _______________

---

### GET /api/listings

**Query Params:**
- `page=1`
- `limit=20`
- `listingType=sale` (optional)
- `city=İstanbul` (optional)
- `minPrice=1000000` (optional)
- `maxPrice=5000000` (optional)

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid-here",
      "title": "3+1 Deniz Manzaralı Daire",
      "price": "2500000",
      "city": "İstanbul",
      "district": "Kadıköy"
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

**Test Date:** _______________
**Status:** [ ] Passed / [ ] Failed
**Notes:** _______________

---

### GET /api/listings/:id

**Response (200):**
```json
{
  "id": "uuid-here",
  "userId": "user-uuid",
  "listingType": "sale",
  "propertyType": "apartment",
  "status": "active",
  "title": "3+1 Deniz Manzaralı Daire",
  "description": "Kadıköy Moda'da eşsiz deniz manzaralı daire.",
  "price": "2500000",
  "currency": "TRY",
  "grossSqm": 150,
  "netSqm": 130,
  "roomCount": "3+1",
  "city": "İstanbul",
  "district": "Kadıköy",
  "neighborhood": "Moda",
  "features": ["elevator", "parking", "security", "pool", "gym"],
  "media": [],
  "user": {
    "id": "user-uuid",
    "name": "Test Agent",
    "phone": "+905551234567",
    "email": "agent@example.com"
  }
}
```

**Test Date:** _______________
**Status:** [ ] Passed / [ ] Failed
**Notes:** _______________

---

### PATCH /api/listings/:id

**Request:**
```json
{
  "price": 2750000,
  "description": "Fiyat güncellendi."
}
```

**Response (200):**
```json
{
  "id": "uuid-here",
  "price": "2750000",
  "description": "Fiyat güncellendi.",
  "updatedAt": "2025-01-02T00:00:00.000Z"
}
```

**Test Date:** _______________
**Status:** [ ] Passed / [ ] Failed
**Notes:** _______________

---

### DELETE /api/listings/:id

**Response (200):**
```json
{
  "message": "Listing deleted successfully"
}
```

**Test Date:** _______________
**Status:** [ ] Passed / [ ] Failed
**Notes:** _______________

---

## Search Requests Endpoints

### POST /api/search-requests

**Request:**
```json
{
  "rawText": "Kadıköy veya Üsküdar'da 3+1 deniz manzaralı daire arıyorum.",
  "listingType": "sale",
  "budgetMin": 2000000,
  "budgetMax": 3500000,
  "districts": ["Kadıköy", "Üsküdar"],
  "mustHaveFeatures": ["elevator", "parking"],
  "criteria": {
    "listing_type": "sale",
    "budget": { "min": 2000000, "max": 3500000 },
    "confidence": 0.92
  }
}
```

**Response (201):**
```json
{
  "id": "uuid-here",
  "userId": "user-uuid",
  "rawText": "Kadıköy veya Üsküdar'da 3+1 deniz manzaralı daire arıyorum.",
  "listingType": "sale",
  "budgetMin": "2000000",
  "budgetMax": "3500000",
  "districts": ["Kadıköy", "Üsküdar"],
  "status": "active",
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

**Test Date:** _______________
**Status:** [ ] Passed / [ ] Failed
**Notes:** _______________

---

### POST /api/search-requests/:id/match

**Response (201):**
```json
{
  "matches": [
    {
      "match": {
        "id": "match-uuid",
        "searchRequestId": "request-uuid",
        "listingId": "listing-uuid",
        "matchType": "auto",
        "score": "89.00",
        "status": "new"
      },
      "listing": {
        "id": "listing-uuid",
        "title": "3+1 Deniz Manzaralı Daire",
        "price": "2800000",
        "city": "İstanbul",
        "district": "Kadıköy",
        "roomCount": "3+1",
        "netSqm": 120
      },
      "scoreBreakdown": {
        "location_match": 100,
        "price_match": 85,
        "size_match": 90,
        "features_match": 70,
        "room_match": 100,
        "total": 89
      }
    }
  ],
  "totalFound": 5
}
```

**Test Date:** _______________
**Status:** [ ] Passed / [ ] Failed
**Notes:** _______________

---

## Error Response Format

Tüm hata durumlarında standart format:

```json
{
  "errorCode": "VALIDATION_ERROR",
  "message": "Validation failed",
  "details": ["email must be a valid email address"]
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `UNAUTHORIZED` | 401 | Authentication required |
| `INVALID_CREDENTIALS` | 401 | Wrong email/password |
| `FORBIDDEN` | 403 | Access denied to resource |
| `NOT_FOUND` | 404 | Resource not found |
| `EMAIL_EXISTS` | 409 | Email already registered |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Test Execution Summary

| Endpoint | Date | Status | Tester |
|----------|------|--------|--------|
| POST /auth/register | | | |
| POST /auth/login | | | |
| GET /auth/me | | | |
| POST /listings | | | |
| GET /listings | | | |
| GET /listings/:id | | | |
| PATCH /listings/:id | | | |
| DELETE /listings/:id | | | |
| POST /search-requests | | | |
| GET /search-requests | | | |
| GET /search-requests/:id | | | |
| POST /search-requests/:id/match | | | |
