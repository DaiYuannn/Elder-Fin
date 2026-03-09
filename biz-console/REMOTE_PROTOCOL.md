# Elder-Fin Biz Console Remote Protocol

## Environment Variables

- `VITE_CONSOLE_DEFAULT_DATA_MODE`: `mock` or `remote`
- `VITE_CONSOLE_REMOTE_TRANSPORT`: `rest`, `polling`, or `sse`
- `VITE_CONSOLE_DATA_URL`: snapshot endpoint for `rest` and `polling`
- `VITE_CONSOLE_SSE_URL`: SSE endpoint for `sse`
- `VITE_CONSOLE_POLL_INTERVAL_MS`: polling interval in milliseconds

## Snapshot Response

The console accepts either a bare array or an object containing `events`.

```json
{
  "meta": {
    "transport": "polling",
    "timestamp": "2026-03-09T10:15:00.000Z"
  },
  "events": [
    {
      "id": "EF-101",
      "minutesAgo": 12,
      "area": "福建",
      "amount": "¥88,000",
      "amountValue": 88000,
      "level": "高危",
      "source": "异常转账",
      "status": "二次外呼中",
      "trend": "升温",
      "familyCase": "福州家庭协作",
      "familyStatus": "待回执",
      "familyChannel": "短信 + 电话",
      "summary": "跨省异常转账尝试命中高危规则。",
      "timeline": [
        {
          "label": "规则触发",
          "detail": "触发跨省资金异常规则",
          "minutesAgo": 12
        }
      ],
      "globalSource": { "name": "中国", "coordinates": [104, 35] },
      "globalTarget": { "name": "新加坡", "coordinates": [103.8198, 1.3521] },
      "provinceSource": { "name": "广东", "coordinates": [113.3, 23.1] },
      "provinceTarget": { "name": "福建", "coordinates": [119.3, 26.1] },
      "citySource": { "name": "广州", "coordinates": [113.2644, 23.1291] },
      "cityTarget": { "name": "福州", "coordinates": [119.2965, 26.0745] },
      "outletSource": { "name": "广州天河支行", "coordinates": [113.3615, 23.1247] },
      "outletTarget": { "name": "福州鼓楼网点", "coordinates": [119.3035, 26.0821] }
    }
  ]
}
```

## Alternate Endpoint Shape

The console also accepts nested endpoint data:

```json
{
  "events": [
    {
      "id": "EF-101",
      "endpoints": {
        "global": {
          "source": { "name": "中国", "coordinates": [104, 35] },
          "target": { "name": "新加坡", "coordinates": [103.8198, 1.3521] }
        },
        "province": {
          "source": { "name": "广东", "coordinates": [113.3, 23.1] },
          "target": { "name": "福建", "coordinates": [119.3, 26.1] }
        },
        "city": {
          "source": { "name": "广州", "coordinates": [113.2644, 23.1291] },
          "target": { "name": "福州", "coordinates": [119.2965, 26.0745] }
        },
        "outlet": {
          "source": { "name": "广州天河支行", "coordinates": [113.3615, 23.1247] },
          "target": { "name": "福州鼓楼网点", "coordinates": [119.3035, 26.0821] }
        }
      }
    }
  ]
}
```

## SSE Message Format

SSE should emit JSON in `message` or `snapshot` events.

```text
event: snapshot
data: {"meta":{"transport":"sse","timestamp":"2026-03-09T10:15:00.000Z"},"events":[...]}
```

## Notes

- Event fields can be partially omitted; the client falls back to built-in mock defaults for missing fields.
- SSE authentication should use cookies or signed query parameters because `EventSource` does not support arbitrary headers in browsers.
- Polling and REST share the same snapshot payload.