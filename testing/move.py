import paho.mqtt.client as mqtt
import json

topic = "robots/+/position"

def buildMoveMsg(x, y):
    return json.dumps({"left": x, "right": y})

def on_connect(client, userdata, flags, reason_code):
    print("Connected")

def send_command(id, x, y):
    client.publish(f"robots/{id}/move", buildMoveMsg(x, y))

client = mqtt.Client()

client.on_connect = on_connect
client.connect("localhost", 1883, 60)

while True:
    print("Command format: `id x.n y.n`")
    command = input("Command: ")
    info = command.split(sep=" ")
    if (len(info) == 3):
        send_command(info[0], info[1], info[2])
        continue
    if (len(info) == 1 and info[0] == ""):
        client.disconnect()
        break
    else:
        print(f"`{command}` is invalid (to exit press ENTER)")

client.loop_forever()
