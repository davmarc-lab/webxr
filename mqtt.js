import mqtt from "mqtt";

function log(message) {
    fetch(`/log?${encodeURI(message)}`);
}

/**
 * Parse a json message received from mqtt.
 * 
 * @param {string} msg The message to parse.
 * @returns A Json formatted string.
 */
function parseBrokerMessage(msg) {
    return JSON.parse(msg.toString());
}

/**
 * Implemetation of a simple mqtt broker listening to a list of publishers.
 */
class MQTTBroker {
    #url;
    #options;

    #client;

    /**
     * Creates a mqtt client connected to the given server with custom options.
     * 
     * @param {string} url Mqtt broker url.
     * @param {mqtt.IClientOptions} opts Mqtt client options.
     */
    constructor(url, opts) {
        this.#url = url;
        if (opts !== undefined)
            this.#options = opts;

        this.#client = {};
    }

    /**
     * Connects the client to the mqtt broker.
     * If any publisher is specified, it subscribes to each of them.
     * It also define a default onMessage callback function that prints the message received.
     * 
     * @param {Array<string>} publishers List of publishers to subscribe.
     */
    connect(publishers) {
        this.#client = mqtt.connect(this.#url, this.#options);
        this.#client.on('connect', _ => {
            console.log("Connected to " + this.#url);

            // subscribes to the given publishers
            this.subscribe(publishers);
        });

        this.#client.on('message', (topic, message) => this.onMessage(topic, message));
    }

    /**
     * Subscribes the client to the given publishers.
     * 
     * @param {string | Array<string>} publishers It could be a single publisher or an array.
     * @returns `undefined` if the publishers are not specified.
     */
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

    /**
     * Callback function called everytime a message is received from a specific publisher.
     * 
     * @param {string} topic Topic received.
     * @param {Uint8Array} message Bytes representing the message received.
     */
    onMessage(topic, message) {
        console.log(topic + " => " + message.toString());
    }

    /**
     * Retrieves the current mqtt broker url.
     * 
     * @returns The broker url.
     */
    getUrl = () => { return this.#url; }
}

export {
    MQTTBroker,
    parseBrokerMessage
}