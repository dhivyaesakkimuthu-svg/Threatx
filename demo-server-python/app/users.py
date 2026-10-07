"""
Demo users definition for TheadX telemetry simulation matching server/src/seed.ts and demo-server/src/users.ts.
"""

USERS = [
    {
        "userId": "u1",
        "username": "alice.johnson",
        "normalIp": "192.168.1.10",
        "normalDevice": "MacBook Pro",
        "normalLocation": {
            "lat": 40.7128,
            "lng": -74.006,
            "city": "New York",
            "country": "US",
        },
        "typicalWorkHours": [9, 10, 11, 12, 13, 14, 15, 16, 17],
        "suspiciousIp": "45.33.32.156",
    },
    {
        "userId": "u2",
        "username": "bob.smith",
        "normalIp": "10.0.0.45",
        "normalDevice": "Windows Desktop",
        "normalLocation": {
            "lat": 41.8781,
            "lng": -87.6298,
            "city": "Chicago",
            "country": "US",
        },
        "typicalWorkHours": [8, 9, 10, 11, 12, 13, 14, 15, 16],
        "suspiciousIp": "88.198.22.4",
    },
    {
        "userId": "u3",
        "username": "carol.williams",
        "normalIp": "172.16.0.22",
        "normalDevice": "iPhone 15",
        "normalLocation": {
            "lat": 37.7749,
            "lng": -122.4194,
            "city": "San Francisco",
            "country": "US",
        },
        "typicalWorkHours": [9, 10, 11, 13, 14, 15, 16, 17, 18],
        "suspiciousIp": "185.220.101.5",
    },
    {
        "userId": "u4",
        "username": "dave.chen",
        "normalIp": "192.168.2.80",
        "normalDevice": "ThinkPad",
        "normalLocation": {
            "lat": 47.6062,
            "lng": -122.3321,
            "city": "Seattle",
            "country": "US",
        },
        "typicalWorkHours": [9, 10, 11, 12, 14, 15, 16, 17],
        "suspiciousIp": "194.26.29.112",
    },
    {
        "userId": "u5",
        "username": "eve.garcia",
        "normalIp": "10.0.0.99",
        "normalDevice": "MacBook Air",
        "normalLocation": {
            "lat": 30.2672,
            "lng": -97.7431,
            "city": "Austin",
            "country": "US",
        },
        "typicalWorkHours": [10, 11, 12, 13, 14, 15, 16, 17, 18],
        "suspiciousIp": "24.120.44.11",
    },
]
