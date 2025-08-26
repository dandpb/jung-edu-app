export interface WebRTCConfig {
  iceServers: RTCIceServer[];
  audioOnly: boolean;
  videoQuality: 'low' | 'medium' | 'high';
}

export interface PeerConnection {
  id: string;
  connection: RTCPeerConnection;
  localStream?: MediaStream;
  remoteStream?: MediaStream;
  isConnected: boolean;
}

export class WebRTCService {
  private connections = new Map<string, PeerConnection>();
  private localStream?: MediaStream;
  private config: WebRTCConfig;

  constructor(config?: Partial<WebRTCConfig>) {
    this.config = {
      iceServers: config?.iceServers || [
        { urls: 'stun:stun.l.google.com:19302' }
      ],
      audioOnly: config?.audioOnly || false,
      videoQuality: config?.videoQuality || 'medium'
    };
  }

  async initializeLocalMedia(): Promise<MediaStream> {
    const constraints: MediaStreamConstraints = {
      audio: true,
      video: this.config.audioOnly ? false : {
        width: this.getVideoConstraints().width,
        height: this.getVideoConstraints().height
      }
    };

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      return this.localStream;
    } catch (error) {
      throw new Error(`Failed to initialize media: ${error}`);
    }
  }

  async createPeerConnection(peerId: string): Promise<PeerConnection> {
    const connection = new RTCPeerConnection({
      iceServers: this.config.iceServers
    });

    const peerConnection: PeerConnection = {
      id: peerId,
      connection,
      localStream: this.localStream,
      isConnected: false
    };

    // Add local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        connection.addTrack(track, this.localStream!);
      });
    }

    // Handle remote stream
    connection.ontrack = (event) => {
      peerConnection.remoteStream = event.streams[0];
    };

    // Handle connection state changes
    connection.onconnectionstatechange = () => {
      peerConnection.isConnected = connection.connectionState === 'connected';
    };

    this.connections.set(peerId, peerConnection);
    return peerConnection;
  }

  async createOffer(peerId: string): Promise<RTCSessionDescriptionInit> {
    const peerConnection = this.connections.get(peerId);
    if (!peerConnection) {
      throw new Error('Peer connection not found');
    }

    const offer = await peerConnection.connection.createOffer();
    await peerConnection.connection.setLocalDescription(offer);
    return offer;
  }

  async createAnswer(peerId: string, offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    const peerConnection = this.connections.get(peerId);
    if (!peerConnection) {
      throw new Error('Peer connection not found');
    }

    await peerConnection.connection.setRemoteDescription(offer);
    const answer = await peerConnection.connection.createAnswer();
    await peerConnection.connection.setLocalDescription(answer);
    return answer;
  }

  async handleAnswer(peerId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const peerConnection = this.connections.get(peerId);
    if (!peerConnection) {
      throw new Error('Peer connection not found');
    }

    await peerConnection.connection.setRemoteDescription(answer);
  }

  async addIceCandidate(peerId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const peerConnection = this.connections.get(peerId);
    if (!peerConnection) {
      throw new Error('Peer connection not found');
    }

    await peerConnection.connection.addIceCandidate(candidate);
  }

  closePeerConnection(peerId: string): void {
    const peerConnection = this.connections.get(peerId);
    if (peerConnection) {
      peerConnection.connection.close();
      this.connections.delete(peerId);
    }
  }

  closeAllConnections(): void {
    for (const [peerId] of this.connections) {
      this.closePeerConnection(peerId);
    }
  }

  stopLocalStream(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = undefined;
    }
  }

  private getVideoConstraints(): { width: number; height: number } {
    switch (this.config.videoQuality) {
      case 'low':
        return { width: 640, height: 480 };
      case 'high':
        return { width: 1920, height: 1080 };
      default:
        return { width: 1280, height: 720 };
    }
  }

  getPeerConnection(peerId: string): PeerConnection | undefined {
    return this.connections.get(peerId);
  }

  getLocalStream(): MediaStream | undefined {
    return this.localStream;
  }
}