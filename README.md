# Sistema di realtà aumentata
L’obiettivo del progetto è la realizzazione di un’applicativo web capace di aumentare un emulatore di sciame di robot, integrando dati provenienti da un broker MQTT con una scena 3D in realtà aumentata.

Il sistema permette di:
 - Riconoscere marker ArUco tramite telecamera
 - Stimare la posizione 3D dei marker
 - Generare e gestire un’arena virtuale
 - Posizionare ed aggiornare dinamicamente robot virtuali nell’arena
 - Sincronizzare lo stato dei robot tramite MQTT

## Struttura del progetto
```
├── assets
│   ├── base.glb
│   ├── printed-markers.png
│   ├── robot-90.gltf
│   └── robot.gltf
├── css
│   └── style.css
├── index.html
├── loggerPlugin.ts
├── mqtt
│   ├── docker-compose.yaml
│   └── mosquitto.conf
├── package.json
├── src
│   ├── arena.js
│   ├── helper.js
│   ├── index.js
│   ├── marker.js
│   ├── mqtt.js
│   ├── robot.js
│   ├── sceneUtils.js
│   └── test.js
├── test.html
└── vite.config.js
```

## Tecnologie
- [**Vite**](https://vitejs.dev/) – Dev server e bundler moderno per lo sviluppo frontend
- [**Three.js**](https://threejs.org/) – Rendering 3D basato su WebGL
- [**js-aruco2**](https://github.com/damianofalcioni/js-aruco2) – Riconoscimento marker ArUco in JavaScript
- [**Eclipse Mosquitto**](https://mosquitto.org/) – Broker MQTT
- [**Docker**](https://www.docker.com/) – Containerizzazione del broker MQTT

## Requisiti
- Quattro marker ArUco (stampati o immagini)
- Dispositivo dotato di webcam o fotocamera esterna
- Google Chrome (funzionalità di WebXR)

## Avvio del sistema

### Applicazione Web
Installazione delle dipendenze e avvio del server:
```bash
npm install
npm run dev
```
L'applicativo sarà disponibile all'indirizzo:
```
https://localhost:5173
```

### Avvio Broker MQTT
Prima di avviare il broker è necessario generare dei certificati locali:
```bash
openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout server.key \
  -out server.crt \
  -days 365 \
  -subj "/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
```
> [!WARNING]
> I certificati devono essere posizionati all'interno della cartella `mqtt/certs/`.

Una volta generati e posizionati nella cartella correta è possibile avviare il broker:
```bash
docker compose up mqtt
```
Il broker MQTT verrà avviato, sulla porta `9001`, utilizzando la configurazione definita all'interno del file: `mqtt/mosquitto.conf`.

> [!WARNING]
> Al primo avvio è necessario fornire le autorizzazioni al browser sia per l'applicazione web che per il broker. Per il broker è necessario collegarsi all'indirizzo `https://localhost:9001` e dare le opportune autorizzazioni, mentre per l'applicazione `https://localhost:5173`.

## Flusso Operativo
 - L’utente inquadra quattro marker ArUco
 - Il sistema rileva i marker e ne stima la posizione in 3D
 - Viene generata un’arena virtuale delimitata dai marker
 - Vengono posizionati i robot sul piano dell'arena virtuale
 - Le posizioni vengono aggiornate alla ricezione di ogni messaggio dal broker
