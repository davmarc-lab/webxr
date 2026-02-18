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
     * If any topic is specified, it subscribes to each of them.
     * It also define a default onMessage callback function that prints the message received.
     * 
     * @param {Array<string>} topics List of topics to subscribe.
     */
    connect(topics) {
        this.#client = mqtt.connect(this.#url, this.#options);
        this.#client.on('connect', _ => {
            console.log("Connected to " + this.#url);

            // subscribes to the given publishers
            this.subscribe(topics);
        });

        this.#client.on('message', (topic, message) => this.onMessage(topic, message));
    }

    /**
     * Subscribes the client to the given topics.
     * 
     * @param {string | Array<string>} topics It could be a single topic or an array.
     * @returns `undefined` if at least one topic is not specified.
     */
    subscribe(topics) {
        if (topics === undefined) return;

        if (topics instanceof Array) {
            topics.forEach(t => {

                this.#client.subscribe(t, (err) => {
                    if (err) {
                        console.error(err);
                        return;
                    }
                    console.log("Subscribed to " + t);
                });
            });
        } else {
            this.#client.subscribe(topics, err => {
                if (err) {
                    console.error(err);
                    return;
                }
                console.log("Subscribed to " + topics);
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