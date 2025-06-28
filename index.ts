import mqtt from "mqtt"

const EMQX_URL = "mqtt://localhost:1883"
const LOAD_FACTOR = 10 // Increase to send more messages per second.

const mqttClients: mqtt.MqttClient[] = []

// Connect a large subscriber client that subscribes to all topics (<clientId>/pub/#) the other clients publish to.
const largeSubscriberClient = mqtt.connect(EMQX_URL, {
  clientId: "large",
  clean: false,
})

largeSubscriberClient.on("connect", async () => {
  await largeSubscriberClient.subscribeAsync("+/pub/#", { qos: 2 })

  console.log("Client large connected")
})

largeSubscriberClient.on("error", (error) => {
  console.error("Client large error:", error)
})

largeSubscriberClient.on("close", () => {
  console.log("Client large disconnected")
})

// Connect 100 clients that publish a message to a topic (<clientId>/pub/topic<1-20>) every 50-500 ms.
const clientIds = Array.from({ length: 100 }, (_, i) => (i + 1).toString())

for (const clientId of clientIds) {
  const mqttClient = mqtt.connect(EMQX_URL, {
    clientId: clientId,
    clean: false,
  })

  mqttClient.on("connect", async () => {
    void publishLoop(mqttClient, clientId)

    console.log("Client", clientId, "connected")
  })

  mqttClient.on("message", (topic, message) => {
    console.log("Client", clientId, "received message on topic", `${topic}:`, message.toString())
  })

  mqttClient.on("error", (error) => {
    console.error("Client", clientId, "error:", error)
  })

  mqttClient.on("close", () => {
    console.log("Client", clientId, "disconnected")
  })

  mqttClients.push(mqttClient)
}

async function publishLoop(client: mqtt.MqttClient, clientId: string) {
  while (client.connected && !client.disconnecting) {
    const message = {
      timestamp: Date.now(),
      value: 123,
      otherValue: "example",
      test: true,
    }

    const randomTopicNumber = Math.floor(Math.random() * 20) + 1 // 1 to 20
    const randomDelay = Math.floor(Math.random() * (500 - 50 + 1)) + 50; // 50 to 500 ms

    await client.publishAsync(`${clientId}/pub/topic${randomTopicNumber}`, JSON.stringify(message))
    await delay(randomDelay / LOAD_FACTOR)
  }
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)

async function shutdown() {
  console.log("Shutting down gracefully...")
  await Promise.all(mqttClients.map((client) => client.endAsync()))
  process.exit(0)
}
