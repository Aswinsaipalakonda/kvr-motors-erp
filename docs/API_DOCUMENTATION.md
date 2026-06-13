# API Documentation

## Endpoints

### `METHOD /api/v1/resource/`
* **Description**: Summary of what this endpoint does.
* **Authentication**: Required / Not required.

#### Request Headers
* `Content-Type`: `application/json`

#### Request Payload Schema
```json
{
  "key": "value"
}
```

#### Responses

##### `200 OK`
```json
{
  "status": "success",
  "data": {}
}
```

##### `400 Bad Request`
```json
{
  "status": "error",
  "detail": "Descriptive error message"
}
```
