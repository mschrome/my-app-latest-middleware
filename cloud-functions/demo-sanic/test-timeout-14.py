"""测试 maxDuration: sleep 14s，超过 edgeone.json 中配置的 python.maxDuration=8s 限制"""
import time
import json


def handler(request):
    start = time.time()
    time.sleep(14)
    elapsed = time.time() - start
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({"elapsed": round(elapsed, 2), "unit": "seconds"})
    }
