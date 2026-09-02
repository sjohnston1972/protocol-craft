# Protocol Craft — The Full Map

A crafting tree from raw physics to (nearly) every Layer 2 and Layer 3 protocol.
Format: `A + B → C`. Every ingredient is craftable before it's needed.
Rule of the game: each *pair* produces exactly one result, but a result may have
more than one recipe.

---

## 0. Starting shelf (8 elements)

```
Electron · Copper · Glass · Air · Clock · Number · Rule · Cisco
```

Yes, Cisco is a fundamental element of the universe. You know it's true.

---

## 1. Concept forge

These are the multiplier cards — abstract ideas that combine with protocols to
make new protocols. This is what lets eight elements reach 150+ protocols.

```
Electron + Copper      → Signal
Signal + Glass         → Light
Signal + Air           → Radio
Signal + Clock         → Bitstream
Clock + Clock          → Time
Time + Rule            → Legacy
Number + Rule          → Address
Bitstream + Rule       → Frame
Copper + Copper        → Cable
Cable + Glass          → Fibre
Cable + Cable          → Loop
Loop + Rule            → Ring
Number + Number        → Tag
Tag + Tag              → Label            (a stack of tags — remember this for MPLS)
Address + Address      → Group
Frame + Group          → Broadcast
Broadcast + Rule       → Discovery
Number + Time          → Key
Key + Bitstream        → Encryption
Key + Address          → Authentication
Rule + Rule            → Policy
Signal + Legacy        → Telephone
Telephone + Bitstream  → Modem
Radio + Telephone      → Cell
Telephone + Fibre      → Carrier          (the service-provider world)
Radio + Address        → Mobility
Radio + Loop           → Mesh
Frame + Frame          → Congestion
```

---

## 2. The trunk

One path, no choices, until the fork.

```
Frame + Address        → MAC Address
Frame + MAC Address    → Ethernet (802.3)     ◄── THE FORK
```

---

## 3. L2 — Ethernet & switching

```
Ethernet + Cable       → Hub                  (repeats everything to everyone; chaos)
Hub + Address          → Bridge               (learns who lives where)
Bridge + Number        → Switch               (a bridge with ambition)
Ethernet + Tag         → VLAN (802.1Q)
VLAN + Tag             → Q-in-Q (802.1ad)     (a VLAN inside a VLAN)
VLAN + Cable           → Trunk
Trunk + Cisco          → DTP
VLAN + Cisco           → VTP                  (v1/v2/v3 — the protocol that deletes LANs)
Cable + Number         → Bundle
Bundle + Rule          → LACP (802.1AX)
Bundle + Cisco         → PAgP
Bundle + Switch        → EtherChannel
```

## 4. L2 — Loops & resilience

```
Switch + Loop            → Broadcast Storm    (a discoverable disaster — the game rewards you for breaking the network)
Broadcast Storm + Rule   → STP (802.1D)
STP + Clock              → RSTP (802.1w)
RSTP + VLAN              → MSTP (802.1s)
STP + Cisco              → PVST+
PVST+ + Clock            → Rapid PVST+
Ring + Ethernet          → ERPS (G.8032)
Ring + Cisco             → REP
Switch + IS-IS           → TRILL              (cross-branch: you need link-state routing to escape spanning tree)
IS-IS + VLAN             → SPB (802.1aq)
TRILL + Cisco            → FabricPath
Redundancy + Switch      → Flex Links         (a pair of interfaces set as an active/standby backup — L2 redundancy without running STP)
```

## 5. L2 — Discovery, auth, control

```
Discovery + Rule         → LLDP
Discovery + Cisco        → CDP
LLDP + Telephone         → LLDP-MED
Fibre + Cisco            → UDLD
VLAN + Discovery         → GVRP
GVRP + Rule              → MVRP
GVRP + Group             → GMRP/MMRP
Ethernet + Authentication→ 802.1X
802.1X + Key             → EAPoL
Ethernet + Encryption    → MACsec (802.1AE)
Ethernet + Congestion    → 802.3x              (PAUSE frames — stop sending, I'm drowning)
802.3x + Tag             → PFC (802.1Qbb)
PFC + Rule               → ETS (802.1Qaz)
PFC + Discovery          → DCBX               (the lossless-Ethernet trio = DCB)
Discovery + Clock        → Monitoring
Monitoring + Ethernet    → Link OAM (802.3ah)
Link OAM + Carrier       → CFM (802.1ag)
CFM + Rule               → Y.1731
IGMP + Switch            → IGMP Snooping      (a switch listens in on IGMP so it only forwards multicast out ports that asked for it)
Frame + Policy           → CoS (802.1p)       (three priority bits in the tag; the original QoS)
```

## 6. L2 — WAN & serial (the museum wing)

```
Telephone + Number       → ISDN
Telephone + Modem        → DSL
Modem + Carrier          → DOCSIS
Bitstream + Cable        → Serial Line          (a clocked bitstream on a wire)
Serial Line + Frame      → HDLC
HDLC + Cisco             → Cisco HDLC
HDLC + Legacy            → SDLC
HDLC + Rule              → LAPB
LAPB + Packet            → X.25               (an early packet-switched WAN protocol that error-checks every hop between switches)
X.25 + Clock             → Frame Relay        (X.25 with the training wheels removed)
Frame Relay + Discovery  → LMI
Frame Relay + Fibre      → ATM
ATM + Rule               → AAL5
Fibre + Clock            → SONET/SDH            (Synchronous Optical Network — the clock is the point)
Modem + Frame            → SLIP
SLIP + Rule              → PPP
PPP + Rule               → LCP
LCP + IP                 → IPCP
PPP + Authentication     → PAP                (password in cleartext; a confession, not a protocol)
PAP + Key                → CHAP
PPP + Ethernet           → PPPoE
PPP + ATM                → PPPoA
PPP + Bundle             → Multilink PPP
PPP + SONET/SDH          → POS
```

## 7. L2 — Wireless

```
Radio + Frame            → 802.11 (Wi-Fi)
802.11 + Encryption      → WEP                (craftable, immediately mocked)
WEP + Key                → WPA
WPA + Rule               → WPA2
WPA2 + Clock             → WPA3
802.11 + Discovery       → 802.11k
802.11k + Rule           → 802.11v
802.11 + Mobility        → 802.11r
802.11 + Mesh            → 802.11s
802.11s + Route          → HWMP               (an L2 routing protocol — discuss)
802.11 + Tunnel          → CAPWAP             (tunnels a thin AP's control and data traffic to a central wireless controller)
CAPWAP + Cisco           → LWAPP
Radio + Clock            → Frequency Hopping
Frequency Hopping + Frame→ Bluetooth
Bluetooth + Rule         → 802.15.4
802.15.4 + Mesh          → Zigbee
802.15.4 + IPv6          → 6LoWPAN            (compresses IPv6 to fit over low-power 802.15.4 radio links)
Radio + Carrier          → LoRaWAN
```

## 8. L2 — Legacy LANs

```
Frame + Ring             → Token
Token + Rule             → Token Ring (802.5)
Token + Fibre            → FDDI
Token + Legacy           → ARCNET
Legacy + Cable           → LocalTalk
Frame + Legacy           → NetBEUI            (non-routable; the office-LAN poltergeist)
```

## 9. L2 — Overlays & carrier Ethernet

```
PPP + Tunnel             → L2TP
L2TP + Ethernet          → L2TPv3
PPP + Legacy             → PPTP
VLAN + Tunnel            → VXLAN              (for when 4096 VLANs stopped being enough)
VXLAN + Rule             → GENEVE
GRE + Ethernet           → NVGRE
VXLAN + MP-BGP           → EVPN               (the modern data-centre answer; cross-branch)
MPLS + Frame             → Pseudowire (PWE3)
Pseudowire + Switch      → VPLS
Q-in-Q + Address         → PBB (802.1ah)      (MAC-in-MAC)
Ethernet + Cisco         → OTV
```

---

## 10. The descent into Layer 3

```
Frame + Number           → Packet              (a frame that knows about other networks)
Packet + Address         → IP
IP + Rule                → IPv4
IPv4 + Number            → Subnet Mask
Subnet Mask + Rule       → CIDR
IP + Switch              → Router              (a switch that reads the second address)
Router + Address         → Route
Route + Rule             → Static Route
Route + Number           → Metric
Discovery + Router       → Neighbour
Router + Router          → Redundancy
Route + Route            → Path
Route + Policy           → Autonomous System
Address + Route          → Anycast             (one address, many places; the nearest wins)
```

## 11. The hinge

```
IP + MAC Address         → ARP                 (the bridge between the branches)
ARP + ARP                → Gratuitous ARP      (announcing yourself, to yourself)
ARP + Legacy             → RARP
ARP + Frame Relay        → Inverse ARP
ARP + Router             → Proxy ARP
ARP + Policy             → ARP Spoofing        (a craftable disaster — forge a lie about who owns an address)
ARP Spoofing + Switch    → Dynamic ARP Inspection   (the switch checks ARP against what it knows)
```

## 12. L3 — IP core, tunnels, NAT

```
IP + Signal              → ICMP                (the network's nervous system)
ICMP + ICMP              → Ping
IP + Clock               → TTL
Ping + TTL               → Traceroute          (abusing TTL for cartography)
IPv4 + IPv4              → Address Exhaustion  (a craftable historical crisis)
Address Exhaustion + Rule→ IPv6
Address Exhaustion + Router → NAT              (both children of the same panic)
NAT + Number             → PAT
NAT + Carrier            → CGNAT
IP + IP                  → IP-in-IP
Packet + Packet          → Tunnel              (a packet inside a packet — the concept card)
IP + Tunnel              → GRE
GRE + Number             → mGRE
mGRE + Discovery         → NHRP
mGRE + NHRP              → DMVPN
Encryption + IP          → IPsec
IPsec + Rule             → ESP
IPsec + Authentication   → AH
IPsec + Key              → IKE
IKE + Rule               → IKEv2
Tunnel + Key             → WireGuard
Tunnel + Authentication  → OpenVPN
IP + Legacy              → BOOTP
BOOTP + Rule             → DHCP
DHCP + IPv6              → DHCPv6
DHCP + Switch            → DHCP Snooping       (the switch stops believing every DHCP server)
DHCP Snooping + IP       → IP Source Guard     (and then stops believing every source address)
DHCP + Router            → DHCP Relay          (forward the broadcast a router would otherwise drop)
IP + Policy              → DiffServ (DSCP)     (mark a packet's class in the header and mean it)
IP + Mobility            → Mobile IP (MIPv4)
Mobile IP + IPv6         → MIPv6
MIPv6 + Carrier          → PMIPv6
Cell + Tunnel            → GTP                 (how your 4G traffic actually travels)
IP + Path                → LISP                (separates who you are from where you are)
```

## 13. L3 — IPv6 transition zoo

```
IPv6 + Tunnel            → 6in4
6in4 + Address           → 6to4
6to4 + Carrier           → 6rd
6in4 + Legacy            → ISATAP
6in4 + NAT               → Teredo              (a tunnel through NAT; held together with hope)
IPv6 + NAT               → NAT64               (translate addresses instead of tunnelling)
NAT64 + Legacy           → NAT-PT              (the deprecated ancestor)
IPv4 + Tunnel            → 4in6
4in6 + Carrier           → DS-Lite
DS-Lite + Rule           → MAP-E
MAP-E + NAT64            → MAP-T
ICMP + IPv6              → ICMPv6
ICMPv6 + Discovery       → NDP                 (ARP grew up and got a job)
NDP + Address            → SLAAC
```

## 14. L3 — Group management

```
IP + Group               → IGMP
IGMP + Rule              → IGMPv2
IGMPv2 + Number          → IGMPv3
IGMP + IPv6              → MLD
MLD + Rule               → MLDv2
```

## 15. L3 — Interior routing (IGPs)

```
Metric + Neighbour       → Distance Vector     (routing by rumour)
Distance Vector + Rule   → RIP
RIP + Subnet Mask        → RIPv2
RIPv2 + IPv6             → RIPng
RIP + Cisco              → IGRP
IGRP + Loop              → EIGRP               (DUAL exists because loops exist)
Route + Discovery        → Link State          (build the whole map, run Dijkstra)
Link State + Rule        → OSPF (v2)
OSPF + IPv6              → OSPFv3
Link State + Legacy      → IS-IS               (the OSI one that refused to die)
Distance Vector + Mesh   → Babel
Neighbour + Clock        → BFD                 (sub-second "are you dead yet?")
Route + Cisco            → ODR
Distance Vector + Loop   → Routing Loop        (a craftable disaster — routing by rumour believes the rumour)
Routing Loop + Rule      → Split Horizon       (never advertise a route back to where you learned it)
Metric + Path            → ECMP                (when several paths tie on cost, use them all)
```

## 16. L3 — Exterior routing (the BGP family)

```
Autonomous System + Legacy → EGP               (the original; BGP's awkward ancestor)
Path + Policy            → BGP-4               ◄── the classic summit
BGP-4 + Rule             → MP-BGP              (address families: VPNv4, v6, EVPN…)
BGP-4 + Link State       → BGP-LS
BGP-4 + Policy           → FlowSpec
BGP-4 + Key              → RPKI                (cryptographically signed "you may say that")
```

## 17. L3 — First-hop redundancy

```
Redundancy + Cisco       → HSRP
HSRP + Rule              → VRRP                (the standards-body cover version)
HSRP + Number            → GLBP
VRRP + Encryption        → CARP                (OpenBSD's grudge made manifest)
```

## 18. L3 — Multicast routing

```
Group + Route            → Multicast Routing
Multicast Routing + Distance Vector → DVMRP
OSPF + Group             → MOSPF
Multicast Routing + Rule → PIM                 ("protocol independent" — uses whatever routes exist)
PIM + Broadcast          → PIM-DM              (flood, then apologise)
PIM + Address            → PIM-SM              (rendezvous points)
PIM-SM + Number          → PIM-SSM
PIM-SM + Path            → Bidir-PIM
PIM-SM + Autonomous System → MSDP
Multicast Routing + Tunnel → AMT
```

## 19. Layer 2.5 — MPLS & segment routing

```
Label + Router           → MPLS                (remember Tag + Tag → Label? That was the foreshadowing)
MPLS + Discovery         → LDP
LDP + Cisco              → TDP
MPLS + Path              → MPLS-TE
MPLS-TE + Rule           → RSVP-TE
MPLS + Number            → Segment Routing (SR-MPLS)
Segment Routing + IPv6   → SRv6
Router + Policy          → VRF                 (separate routing tables in one router; the basis of L3VPN)
MPLS + BGP-4             → MPLS L3VPN
MPLS L3VPN + IPv6        → 6PE/6VPE
```

## 20. L3 — Ad-hoc & mesh routing

```
Mesh + Route             → Ad-hoc Routing
Ad-hoc Routing + Discovery      → AODV
Ad-hoc Routing + Path           → DSR
Ad-hoc Routing + Link State     → OLSR
Ad-hoc Routing + Distance Vector→ DSDV
OLSR + Time              → B.A.T.M.A.N.        (the anti-OLSR)
```

## 21. L3 — Dead empires (legacy stacks)

```
Packet + Legacy          → IPX                 (Novell; routed every office in 1995)
IPX + Distance Vector    → IPX RIP
LocalTalk + Packet       → AppleTalk (DDP)
AppleTalk + Distance Vector → RTMP
AppleTalk + Tunnel       → AURP
Legacy + Route           → DECnet (DRP)
Packet + Rule            → CLNP                (OSI's IP — and the reason IS-IS exists)
CLNP + Discovery         → ES-IS
CLNP + Link State        → IS-IS               (alternate recipe; historically the true one)
Legacy + Address         → Banyan VINES (VIP)
IPX + Legacy             → XNS                 (plot twist: IPX copied XNS, not the reverse)
```

---

## 22. Upper-layer concept forge

The multiplier cards for everything above Layer 3 — endpoints, encoding,
naming, the request/response shape, and the client/server model.

```
Address + Number         → Port                 (which door on the host)
Port + IP                → Socket               (an IP and a port — a full endpoint)
Signal + Rule            → Handshake            (agree before you talk)
Rule + Clock             → Reliability          (retransmit until acknowledged)
Bitstream + Number       → Encoding             (how bits become symbols)
Encoding + Rule          → Markup               (text that describes its own structure)
Encoding + Policy        → Serialization        (turn a structure into bytes and back)
Number + Encoding        → Compression          (squeeze the redundancy out)
Frame + Encoding         → Message              (a self-contained unit of meaning)
Message + Rule           → Request              (ask)
Message + Number         → Response             (answer)
Tag + Address            → Name                 (a human-friendly handle for an address)
Name + Request           → Query                (ask about a name)
Number + Clock           → Cache                (remember the answer for a while)
Router + Rule            → Proxy                (an in-between that acts on your behalf)
Key + Authentication     → Certificate          (a signed claim of identity)
Certificate + Certificate→ Trust                (a chain you can follow to a root)
Socket + Request         → Client               (the one who initiates)
Socket + Response        → Server               (the one who listens and answers)
Client + Server          → Client-Server        (the model the app layer runs on)
Client-Server + Mesh     → Peer-to-Peer         (no fixed roles)
Server + Clock           → Daemon               (the always-listening process)
```

## 23. L2 — Spanning-tree protection & its disasters

You built Broadcast Storm → STP already. This is the protection ring around
it, and the new ways to break a switched network.

```
Bridge + Loop            → MAC Flapping         (the switch can't decide which port a host is on)
STP + Switch             → Root Bridge Hijack   (a rogue switch steals the root role)
Broadcast Storm + Switch → Storm Control        (rate-limit the flood before it drowns the segment)
STP + Policy             → BPDU Guard           (shut any access port that dares send a BPDU)
BPDU Guard + Rule        → BPDU Filter          (…or just stop speaking STP out of it)
Root Bridge Hijack + Rule→ Root Guard           (ignore a 'better' root from the wrong direction)
MAC Flapping + Rule      → Loop Guard           (a port that stops hearing BPDUs must not forward)
STP + Number             → PortFast             (skip listen/learn on an access port)
```

## 24. L3 — IPsec & VPN

The encrypted-tunnel world hanging off the IPsec/IKE you already have.

```
Tunnel + Encryption      → VPN                  (an encrypted tunnel — the umbrella)
Key + Number             → Diffie-Hellman       (agree a secret over a public wire)
Diffie-Hellman + Rule    → PFS                  (fresh keys per session)
IKE + Key                → PSK                  (pre-shared key auth — simple, a footgun)
IKE + Authentication     → Phase 1              (build the IKE SA: authenticate the peers)
Phase 1 + Policy         → Main Mode            (six messages, identities hidden)
Phase 1 + Number         → Aggressive Mode      (three messages, identity exposed)
Phase 1 + Encryption     → Phase 2              (build the IPsec SA for the data)
Phase 2 + Rule           → Quick Mode           (Phase 2's negotiation, under Phase 1's cover)
IPsec + Policy           → SA                   (a one-way agreed security contract)
SA + Number              → SPI                  (the index that tags which SA a packet uses)
ESP + Policy             → Transform Set        (the agreed cipher + hash bundle)
IPsec + Tunnel           → Tunnel Mode          (new IP header; gateway-to-gateway)
IPsec + Packet           → Transport Mode       (protect the payload, keep the header)
IPsec + NAT              → NAT-T                (wrap ESP in UDP to survive NAT)
VPN + Policy             → Policy-Based VPN     (an ACL decides what's interesting traffic)
VPN + Route              → Route-Based VPN      (routing into a tunnel interface decides)
Route-Based VPN + Rule   → VTI                  (the virtual tunnel interface itself)
VPN + Router             → Site-to-Site VPN     (two gateways, always up)
VPN + Authentication     → Remote Access VPN    (a roaming client dialing in)
VPN + TLS                → SSL VPN              (a VPN over the browser's crypto)
VPN + Group              → GETVPN               (group encryption, no point-to-point tunnels)
IKEv2 + Cisco            → FlexVPN              (Cisco's IKEv2-everything framework)
```

## 25. L4 — Transport

```
Packet + Clock           → Segment              (data chopped to fit, numbered to reassemble)
Handshake + Number       → SYN                  (synchronise — here's my starting sequence)
SYN + Response           → SYN-ACK              (got it; here's mine)
SYN-ACK + Rule           → ACK                  (got yours — we're connected)
SYN + ACK                → Three-Way Handshake  (the full SYN / SYN-ACK / ACK dance)
Three-Way Handshake + Reliability → Connection  (an established, managed conversation)
Bitstream + Connection   → Stream               (ordered bytes over a connection)
Connection + Legacy      → FIN                  (the polite four-way teardown)
Segment + Three-Way Handshake → TCP             (segments plus a managed connection)
Segment + Number         → UDP                  (fire and forget — no handshake)
TCP + UDP                → SCTP                 (multi-streamed, message-oriented)
UDP + Congestion         → DCCP                 (congestion control without reliability)
UDP + Connection         → QUIC                 (reliable, encrypted connections over UDP)
TCP + ECMP               → MPTCP                (one connection across several paths)
Segment + Legacy         → SPX                  (Novell's transport, atop IPX)
SYN + Congestion         → SYN Flood            (a craftable disaster — half-open the server to death)
SYN Flood + Rule         → SYN Cookies          (don't allocate state until the ACK comes back)
Congestion + Reliability → Bufferbloat          (a craftable disaster — fat buffers ruin latency)
Bufferbloat + Rule       → CoDel                (drop early so queues stay short)
```

## 26. L5 — Session, RPC & the SIP exchange

```
Connection + Authentication → Session           (a maintained, authenticated dialogue)
Session + Legacy         → NetBIOS              (the office-LAN session layer that refuses to die)
Session + Number         → ONC-RPC              (Sun's remote procedure call)
ONC-RPC + Legacy         → DCE-RPC              (the other RPC, Microsoft's lineage)
Session + Proxy          → SOCKS                (a generic session-level proxy)
Session + Telephone      → SIP                  (signalling for calls)
SIP + Legacy             → H.323                (the older, heavier VoIP signalling)
SIP + Client             → User Agent           (the softphone / endpoint)
SIP + Proxy              → SIP Proxy            (routes requests toward the callee)
SIP + Name               → Registrar            (handles REGISTER; maps identity to location)
SIP + Address            → SIP URI              (sip:alice@domain)
SIP Proxy + Rule         → B2BUA                (sits in the middle of both call legs)
SIP Proxy + Policy       → SBC                  (the border guard between VoIP networks)
SIP + Authentication     → REGISTER             (here's where to reach me)
SIP + Request            → INVITE               (let's start a session)
INVITE + Clock           → 100 Trying           (provisional response — request received, no final answer yet)
INVITE + Signal          → 180 Ringing          (provisional response — the callee's phone is alerting them)
INVITE + Response        → 200 OK               (final success response — the call is accepted, media can start)
200 OK + Rule            → SIP ACK              (confirmed — media starts)
INVITE + Number          → CANCEL               (aborts an INVITE before it's been answered)
Connection + Telephone   → BYE                  (tears down an established call)
SIP + Encoding           → SDP                  (describes codecs/ports inside INVITE & 200 OK)
SDP + Stream             → RTP                  (the real-time audio/video packets)
RTP + Monitoring         → RTCP                 (quality stats for the stream)
RTP + Encryption         → SRTP                 (the encrypted media)
SIP + NAT                → STUN                 (what's my public address?)
STUN + Carrier           → TURN                 (relay my media when direct fails)
STUN + TURN              → ICE                  (gather every candidate, use what connects)
ICE + TLS                → WebRTC               (the browser doing all of this, encrypted)
```

## 27. L6 — Presentation

```
Encryption + Certificate → SSL                  (the deprecated ancestor)
SSL + Rule               → TLS                  (encrypt and authenticate the channel)
TLS + UDP                → DTLS                 (TLS for datagrams)
TLS + Authentication     → mTLS                 (both ends prove who they are)
Certificate + Rule       → X.509                (the certificate format itself)
Certificate + Trust      → PKI                  (the whole certificate-authority machine)
Serialization + Rule     → ASN.1                (the granddaddy structure language)
ASN.1 + Number           → BER/DER              (the binary encodings of ASN.1)
Message + Encoding       → MIME                 (typed, multipart message bodies)
MIME + Certificate       → S/MIME               (signed and encrypted mail bodies)
Encoding + Legacy        → ASCII                (seven bits, one alphabet)
ASCII + Rule             → Unicode              (one code point per character, for every script)
Unicode + Number         → UTF-8                (Unicode that's still ASCII-compatible on the wire)
Compression + Rule       → DEFLATE              (LZ77 + Huffman, the workhorse)
DEFLATE + Number         → gzip                 (DEFLATE with a file wrapper)
Compression + Number     → Brotli               (denser, with a built-in dictionary)
Serialization + ONC-RPC  → XDR                  (Sun's wire format for RPC)
Serialization + Markup   → JSON                 (the web's lingua franca)
Markup + Number          → XML                  (verbose, schema-able, everywhere in enterprise)
Serialization + Number   → Protocol Buffers     (compact, schema-first, Google's)
JSON + Number            → CBOR                 (binary JSON for constrained devices)
JSON + Compression       → MessagePack          (binary JSON for speed)
Compression + Light      → JPEG                 (lossy images)
Compression + Legacy     → PNG                  (lossless images)
PNG + Legacy             → GIF                  (256 colours and a grudge)
```

## 28. L7 — Naming (DNS)

```
Name + Address           → DNS                  (turn names into addresses)
DNS + Certificate        → DNSSEC               (sign the answers so they can't be forged)
DNS + Mesh               → mDNS                 (DNS with no server, on the local link)
mDNS + Legacy            → LLMNR                (Microsoft's link-local name lookup)
DNS + TLS                → DoT                  (DNS inside TLS, on its own port)
DNS + HTTPS              → DoH                  (DNS hidden inside ordinary web traffic)
DNS + QUIC               → DoQ                  (DNS over QUIC)
DNS + Authentication     → DDNS                 (let a host update its own record)
DNS + Legacy             → WINS                 (NetBIOS name resolution, Microsoft's)
DNS + Cache              → DNS Cache Poisoning  (a craftable disaster — feed a resolver a lie)
```

## 29. L7 — The Web

```
Request + Response       → HTTP                 (ask for a document, get a document)
HTTP + Connection        → HTTP/1.1             (keep the connection open between requests)
HTTP/1.1 + Stream        → HTTP/2               (many requests multiplexed on one connection)
HTTP + TLS               → HTTPS                (the summit — the whole stack, encrypted)
HTTP/2 + QUIC            → HTTP/3               (HTTP/2 over QUIC; no head-of-line blocking)
HTTP + Stream            → WebSocket            (a two-way channel that started as a request)
HTTP + Rule              → REST                 (use HTTP's verbs the way they were meant)
HTTP + UDP               → CoAP                 (HTTP's shape, shrunk for tiny devices)
HTTP + Cache             → Cookie               (state bolted onto a stateless protocol)
HTTP + Legacy            → WebDAV               (HTTP that can write files, not just read)
ONC-RPC + HTTP/2         → gRPC                 (typed RPC over HTTP/2)
UDP + Broadcast          → Amplification Attack (a craftable disaster — a small query, a huge reply, a forged victim)
Amplification Attack + Rule → Response Rate Limiting (cap how often you'll answer the same thing)
```

## 30. L7 — Mail

```
Message + Address        → Email                (a message addressed to a mailbox)
Email + Carrier          → SMTP                 (push mail toward its destination)
Email + Number           → POP3                 (download mail and (usually) delete it)
Email + Server           → IMAP                 (keep mail on the server, sync everywhere)
SMTP + Authentication     → Submission           (the authenticated port clients actually use)
SMTP + Rule              → ESMTP                (SMTP plus negotiated extensions)
Email + Policy           → SPF                  (list who's allowed to send as your domain)
Email + Certificate      → DKIM                 (sign outgoing mail so it can be verified)
SPF + DKIM               → DMARC                (tie SPF and DKIM together with a policy)
```

## 31. L7 — File transfer

```
Client-Server + Stream   → FTP                  (move files, on two connections, in the clear)
FTP + TLS                → FTPS                 (FTP wrapped in TLS)
FTP + SSH                → SFTP                 (file transfer inside an SSH session)
FTP + UDP                → TFTP                 (trivially simple, for booting devices)
SSH + Stream             → SCP                  (copy a file over SSH and little else)
SCP + Rule               → rsync                (copy only what changed)
ONC-RPC + Stream         → NFS                  (mount a remote disk as if it were local)
NetBIOS + Stream         → SMB/CIFS             (Windows file and printer sharing)
AppleTalk + Stream       → AFP                  (the Mac's file sharing, cross-branch to the legacy wing)
Peer-to-Peer + Stream    → BitTorrent           (download from everyone at once)
```

## 32. L7 — Remote access

```
Client-Server + Legacy   → Telnet               (a remote shell, every keystroke in the clear)
Telnet + Encryption      → SSH                  (Telnet's job, done safely)
Telnet + Light           → RDP                  (a remote desktop, pixels not text)
RDP + Legacy             → VNC                  (the cross-platform screen-sharing cousin)
VNC + Legacy             → X11                  (the network was the display, in 1984)
Telnet + Rule            → rlogin               (BSD's slightly-friendlier Telnet)
```

## 33. L7 — Management, time & directory

```
Monitoring + Query       → SNMP                 (poll a device for its counters)
SNMP + Encryption        → SNMPv3               (SNMP that finally authenticates)
XML + SSH                → NETCONF              (configure a device with structured transactions)
NETCONF + REST           → RESTCONF             (NETCONF's data model over plain HTTP verbs)
NETCONF + gRPC           → gNMI                 (streaming telemetry and config over gRPC)
Monitoring + Message     → Syslog               (everything writes its diary to one place)
Time + Address           → NTP                  (agree what time it is, to the millisecond)
NTP + Rule               → SNTP                 (NTP for devices that don't need the maths)
NTP + Clock              → PTP                  (hardware-stamped time, to the nanosecond)
Query + Group            → LDAP                 (look identities up in a directory)
Authentication + Time    → Kerberos             (time-stamped tickets instead of passwords)
Authentication + Address → RADIUS               (centralised AAA for network access)
RADIUS + Cisco           → TACACS+              (Cisco's AAA, with command-level control)
RADIUS + Rule            → Diameter             (RADIUS's heavier successor)
```

## 34. L7 — Messaging, IoT & the legacy wing

```
Request + Mesh           → MQTT                 (tiny publish/subscribe for sensors)
MQTT + Rule              → AMQP                 (broker-based messaging for the enterprise)
Message + Markup         → XMPP                 (XML chat, a.k.a. Jabber)
XMPP + Rule              → STOMP                (the simple text messaging protocol)
Query + Legacy           → Gopher               (the web before the web)
Query + Number           → Finger               (who's logged in, in 1977)
Message + Group          → NNTP                 (Usenet newsgroups)
Message + Mesh           → IRC                  (real-time chat that never quite died)
Query + Address          → WHOIS                (who owns this name or address)
```

---

## Tally

~150 named protocols, ~30 concept cards, a handful of craftable disasters
(Broadcast Storm, Address Exhaustion) — call it **~185 nodes**. The genuinely
long tail (every 802.11 letter, every BGP extension RFC, every PPP NCP) lives
in the discovery glosses rather than as separate nodes — past this point new
nodes stop teaching and start being filing.

## Design notes

1. **Concept cards are the engine.** Tag, Tunnel, Legacy, Cisco, Carrier,
   Mobility — each one multiplies across the whole tree. This is how 8 starting
   elements reach 185 nodes without 185 bespoke ideas.
2. **Cross-branch recipes are the best teaching moments.** IS-IS → TRILL,
   MP-BGP + VXLAN → EVPN, IGMP + Switch → IGMP Snooping. Each one is a true
   story about how networking actually evolved.
3. **Craftable disasters.** Broadcast Storm and Address Exhaustion are nodes,
   not failures — you *discover* the problem, then craft the protocol that
   fixes it. STP and IPv6 both make more sense when you've caused the thing
   they exist to prevent.
4. **Pair-uniqueness constraint.** Each A+B pair maps to one result. I've kept
   them distinct per section, but with ~185 nodes a clash or two may have
   slipped through — the build step should validate the recipe table
   automatically rather than trust either of us.
5. **Off-recipe combos** still go to Claude live, steered to stay
   networking-flavoured. The map above is the guaranteed backbone; everything
   else is improv.
```