---
title: Distributed Actors
route: distributed-actors
---

# Distributed actors

Distributed actors extend the Actor model from a single process to multiple nodes. In the Cangjie ecosystem, the [`distributed-actors-cj`](https://gitcode.com/Cangjie-SIG/distributed-actors-cj) project provides a framework to build actor-based systems where components communicate through asynchronous messages, run locally or remotely, and scale across machines.

The framework combines:

A core actor programming model with async calls and futures, distributed actor interfaces and proxies for remote invocation, a TCP-based actor system with cluster support for multi-node deployment and actor placement, and optional MCP integration so actor receivers can be exposed as tools for AI agents.

This makes distributed actors a good fit for stateful services, concurrent business workflows, and cloud-native applications that need clear isolation, resilience, and horizontal scalability.

## Clustering

Clustering lets multiple actor system nodes work as one logical runtime.

The TCPCluster provides a cluster-based distributed actor system that allows you to spawn, manage, and communicate with distributed actors across multiple worker nodes. The cluster consists of a head server that coordinates actor placement and multiple worker nodes that host the actual actors.

A TCPCluster consists of:

- **Head Server**: A central coordinator that manages actor registration, placement, and lookup across the cluster
- **Worker Nodes**: Multiple nodes that host and execute distributed actors
- **Client Nodes**: Optional nodes that can join the cluster to spawn and interact with actors without hosting them

The following diagram illustrates the cluster architecture:

```mermaid
graph TB
    subgraph "Client Nodes"
        C1[Client Node 1]
        C2[Client Node 2]
    end

    subgraph "TCPCluster"
        HS[Head Server<br/>Coordinates Actor Placement]

        subgraph "Worker Nodes"
            W1[Worker Node 1<br/>Hosts Actors]
            W2[Worker Node 2<br/>Hosts Actors]
            W3[Worker Node 3<br/>Hosts Actors]
        end

        subgraph "Actors"
            A1(Actor: alice)
            A2(Actor: bob)
            A3(Actor: charlie)
        end
    end

    HS -->|Manages| W1
    HS -->|Manages| W2
    HS -->|Manages| W3

    C1 -->|Spawn/Lookup| HS
    C2 -->|Spawn/Lookup| HS

    W1 -.->|Hosts| A1
    W2 -.->|Hosts| A2
    W3 -.->|Hosts| A3

    C1 -->|Communicate| A1
    C1 -->|Communicate| A2
    C2 -->|Communicate| A3

    style HS fill:#e1f5ff
    style W1 fill:#fff4e1
    style W2 fill:#fff4e1
    style W3 fill:#fff4e1
    style C1 fill:#e8f5e9
    style C2 fill:#e8f5e9
    style A1 fill:#f3e5f5
    style A2 fill:#f3e5f5
    style A3 fill:#f3e5f5
```

## MCP integration

MCP integration connects distributed actors to AI agents by exposing actor receivers as callable tools through the Model Context Protocol. In practice, the actor system remains the source of truth for business logic, while MCP provides a standard interface that an agent can discover and invoke. This means an agent can request operations such as account transfer, room creation, or status lookup, and those requests are translated into actor receiver calls over the existing distributed actor infrastructure.

In the `distributed-actors-cj` workflow, this is typically done by creating an `ActorToolManager`, adding one or more `TCPActorClient` connections, and letting the tool manager surface compatible actor receivers as tools. MCP integration does not require a cluster: it can work with a single TCP actor host and client. If a cluster is present, the same MCP layer can call actors hosted through the cluster as well. This architecture keeps AI orchestration separate from stateful backend execution and allows the same actor services to be reused by both application code and agent-based clients.

```mermaid
flowchart LR
    AG[AI Agent] -->|MCP tool call| TM[ActorToolManager]
    TM -->|dispatch| TC[TCPActorClient]
    TC -->|call receiver| AH[TCP Actor Host]
    AH -->|receiver execution| AC(Distributed Actor)
    AC -->|result| AG
```

```cangjie
let toolManager = ActorToolManager()
let tcpClient = TCPActorClient.create("localhost", 8080)
toolManager.addActorClient(tcpClient)

// Agent-side calls are routed to actor receivers exposed as MCP tools.
```


## Chat room server example

The chat room example in `distributed-actors-cj` is implemented in `examples/chat-application-example`. It uses a head server and worker nodes for clustering, and each client joins the cluster and also hosts a local `UserActorImpl` endpoint so it can receive pushed chat messages.

A room is represented by `ChatRoomActor`, which is spawnable and created with `TCPCluster.spawnActor<ChatRoomActor>(...)` when a user runs `open <room>`. When a user runs `join <room>`, the client looks up the room actor with `TCPCluster.getActor<ChatRoomActor>(...)` and registers its user actor via `joinRoom(userId, user)`. Sending text uses `sendMessage(userId, message, tell: True)`, and the room actor broadcasts by iterating stored `UserActor` proxies and calling `receiveMessage` on each one. The client-side `UserActorImpl` prints incoming messages and ignores messages sent by itself.

```mermaid
graph TB
    subgraph "Chat clients"
        subgraph CH1["Client A"]
            UH1(UserActor: alice)
        end
    end

    subgraph "Chat room server"
        HA[Head Server]

        subgraph "Worker Nodes"
            WK1[Worker Node 1]
        end

        subgraph "Chat Actors"
            R1(ChatRoomActor: room-1)
        end
    end

    CH1 -->|open/join via TCPCluster| HA
    HA -->|place/lookup| WK1
    WK1 -.->|hosts| R1

    UH1 -->|sendMessage| R1
    R1 -->|receiveMessage| UH1

    style HA fill:#e1f5ff
    style WK1 fill:#fff4e1
    style CH1 fill:#e8f5e9
    style UH1 fill:#f3e5f5
    style R1 fill:#f3e5f5
```

For this application, the main advantage of using an actor cluster is that each chat room has a clear ownership boundary: room membership and broadcast state live inside one `ChatRoomActor`, and all updates are serialized through actor receivers. That avoids explicit lock management for room data and makes concurrent joins, leaves, and messages easier to reason about. Clustering also provides location transparency, so clients can keep using the same proxy calls even if a room actor is placed on a different worker node, which simplifies horizontal scaling as room count and traffic grow.

Without actors, the same chat server is usually built around shared in-memory maps, manual synchronization, and connection registries spread across threads or event loops. That can work, but correctness depends on careful coordination of locks, lifecycle cleanup, and message fan-out ordering under load. Scaling across nodes then requires adding extra routing and discovery layers to answer where a room lives and how to deliver to connected users. In the actor-cluster design, those concerns are pushed into actor isolation and cluster placement/lookup, so application code stays closer to chat-domain logic instead of infrastructure plumbing.
