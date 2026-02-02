import mqtt from "mqtt";

function parseBrokerMessage(msg) {
    return JSON.parse(msg.toString());
}

class MQTTBroker {
    #url;
    #options;

    #client;

    constructor(url, opts) {
        this.#url = url;
        if (opts !== undefined)
            this.#options = opts;

        this.#client = {};
    }

    connect(publishers) {
        this.#client = mqtt.connect(this.#url, this.#options);
        this.#client.on('connect', _ => {
            console.log("Connected to " + this.#url);

            // subscribes to the given publishers
            this.subscribe(publishers);
        });

        this.#client.on('message', (topic, message) => this.onMessage(topic, message));
    }

    subscribe(publishers) {
        if (publishers === undefined) return;

        if (publishers instanceof Array) {
            publishers.forEach(p => {

                this.#client.subscribe(p, (err) => {
                    if (err) {
                        console.error(err);
                        return;
                    }
                    console.log("Subscribed to " + p);
                });
            });
        } else {
            this.#client.subscribe(publishers, err => {
                if (err) {
                    console.error(err);
                    return;
                }
                console.log("Subscribed to " + publishers);
            });
        }
    }

    onMessage(topic, message) {
        console.log(message.toString());
    }

    getUrl = () => { return this.#url; }
}

export {
    MQTTBroker,
    parseBrokerMessage
}