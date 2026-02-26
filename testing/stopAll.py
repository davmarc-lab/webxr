import paho.mqtt.client as mqtt
import json

topic = "robots/+/position"
numRobot = 200

def buildMoveMsg(x, y):
    return json.dumps({"left": x, "right": y})

def on_connect(client, userdata, flags, reason_code):
    print("Connected")
    print("Sending", numRobot, "messages")
    for i in range(0, numRobot):
        client.publish(f"robots/{i}/move", buildMoveMsg(0, 0))
    client.disconnect()
    print("Disconnecting")

client = mqtt.Client()

client.on_connect = on_connect
client.connect("localhost", 1883, 60)

client.loop_forever()
