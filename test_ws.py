import asyncio
import json
import websockets

TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzg3MjAwNjkxLCJpYXQiOjE3ODY1OTU4OTEsImp0aSI6IjczMTI0M2Q1ZTBmNTQxODI5YzY5MjJiOTFiYWMwMzljIiwidXNlcl9pZCI6ImEyM2U5NDcyLTY4YjgtNDlmNy04NmU4LWNlOGRiZWQyN2U3OCJ9.BBft7E750t0uVWn5MetFrKQ-cY6Abi-4xW4mQRQwY2Y"
CONVERSATION_ID = "366fa634-1e83-4dc0-8177-e1c150363085"

URL = f"ws://127.0.0.1:8000/ws/chat/{CONVERSATION_ID}/?token={TOKEN}"

async def main():
    async with websockets.connect(URL) as ws:
        print("Connected.")

        await ws.send(json.dumps({"action": "send_message", "body": "hello via websocket"}))
        print("Sent message.")

        await ws.send(json.dumps({"action": "typing", "is_typing": True}))
        print("Sent typing indicator.")

        for _ in range(3):
            reply = await ws.recv()
            print("Received:", reply)

asyncio.run(main())
