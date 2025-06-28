# EMQX Durable Storage performance test

This repository contains a EMQX docker setup and a Node.js script to test the performance of EMQX, specifically durable
storage.

The script sends around 3500 messages/second to the broker (adjust `LOAD_FACTOR` to increase or reduce). There is one
large subscriber client consuming all messages of 100 publisher clients publishing in random intervals to a range
topics. The large client subscribes at QoS 2.

### Prerequisites

Install [`pnpm`](https://pnpm.io/installation) and use it to install the dependencies:

```shell
pnpm install
```

### How to run

Start EMQX via Docker:

```shell
docker compose up
```

Start the script:

```shell
pnpm start
```

Look at the resource usage with a monitoring tool, e.g. [ctop](https://github.com/bcicen/ctop).

To compare to EMQX without durable storage, comment out the `EMQX_DURABLE_SESSIONS__ENABLE` environment variable in the
`docker-compose.yaml` file.

### Results

`LOAD_FACTOR` set to 10, resulting in around 3500 messages/second running for 2 minutes.

|               | Durable storage **off** | Durable storage **on** |
|---------------|-------------------------|------------------------|
| Memory Before | 476M                    | 440M                   |
| Memory After  | 483M                    | 1004M                  |
| Average CPU   | 4%                      | 19%                    |

