import struct
import os
import time

def create_pcap_with_flag(filename, flag):
    # PCAP Global Header (24 bytes)
    # magic_number (0xa1b2c3d4), version_major (2), version_minor (4),
    # thiszone (0), sigfigs (0), snaplen (65535), network (1: Ethernet)
    global_header = struct.pack('<IHHiIII', 0xa1b2c3d4, 2, 4, 0, 0, 65535, 1)

    payload = f"GET /secret_api?flag={flag} HTTP/1.1\r\nHost: ctfweb.local\r\nUser-Agent: CTF-Forensics-Scanner/2.0\r\n\r\n".encode('utf-8')

    # Construct Ethernet + IPv4 + TCP Headers
    # Ethernet Header (14 bytes)
    eth_header = b'\x00\x11\x22\x33\x44\x55' + b'\x66\x77\x88\x99\xaa\xbb' + b'\x08\x00' # IPv4

    # IPv4 Header (20 bytes)
    ip_tot_len = 20 + 20 + len(payload)
    ip_header = struct.pack('!BBHHHBBH4s4s',
        0x45, 0, ip_tot_len, 0x1234, 0x4000, 64, 6, 0,
        bytes([192, 168, 1, 105]), bytes([10, 0, 0, 1])
    )

    # TCP Header (20 bytes)
    tcp_header = struct.pack('!HHIIBBHHH',
        49152, 80, 1000, 0, 0x50, 0x18, 64240, 0, 0
    )

    packet_data = eth_header + ip_header + tcp_header + payload
    packet_len = len(packet_data)

    # PCAP Packet Record Header (16 bytes)
    now = int(time.time())
    packet_header = struct.pack('<IIII', now, 0, packet_len, packet_len)

    os.makedirs(os.path.dirname(filename), exist_ok=True)
    with open(filename, 'wb') as f:
        f.write(global_header)
        f.write(packet_header)
        f.write(packet_data)

    print(f"[+] PCAP file generated successfully: {filename}")
    print(f"    Payload embedded: HTTP GET request containing '{flag}'")

if __name__ == '__main__':
    flag = "CTF{pcap_network_traffic_captured_564830}"
    create_pcap_with_flag('example/network_capture_564830.pcap', flag)
