import { Injectable } from '@angular/core';
import Peer from 'peerjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { VideoChatService } from '../services/video-chat.service';
import { ChatService } from '../services/chat.service';

export interface RoomUser {
  peerId: string;
  username: string;
  socketId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PeerService {
  peer: any;
  localStream: MediaStream | null = null;
  peerId: string | null = null;
  sockId: any;
  currentChannelId: string | null = null;

  // Use Map to manage peerId → remote stream
  remoteStreams: Map<string, MediaStream> = new Map();

  constructor(
    private http: HttpClient,
    private videoChatService: VideoChatService,
    private chatService: ChatService
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  initializePeerConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.peer = new Peer({
        host: 'localhost',
        port: 9000,
        path: '/peerjs',
        secure: false
      });

      this.peer.on('call', (call: any) => {
        console.log('📞 Incoming call from:', call.peer);
        this.onIncomingCall(call);
      });

      this.peer.on('open', (id: string) => {
        this.peerId = id;
        console.log('✅ Peer connected with ID:', id);
        resolve();
      });

      this.peer.on('error', (err: any) => {
        console.error('❌ Peer error:', err);
        reject(err);
      });
    });
  }

  onIncomingCall(call: any) {
    this.videoChatService.setVideoChatStatus(true);
    call.answer(this.localStream);
    console.log(this.currentChannelId)
    this.getPeerIdsInChannel(this.currentChannelId)
    .then(() => {
      call.on('stream', (remoteStream: MediaStream) => {
        this.remoteStreams.set(call.peer, remoteStream);
        this.updateRemoteStreams();
      });
    });

    call.on('stream', (remoteStream: MediaStream) => {
      this.remoteStreams.set(call.peer, remoteStream);
      this.updateRemoteStreams();
    });

    call.on('close', () => {
      console.log(`🔌 Call with ${call.peer} closed`);
      this.removeRemoteStream(call.peer);
    });
  }

  callPeer(peerId: string) {
    if (!this.peer || !this.peerId) {
      console.error('❌ Peer not initialized');
      return;
    }

    if (!peerId) {
      console.log('👤 No other peer found in the room.');
      return;
    }

    const call = this.peer.call(peerId, this.localStream);

    if (call) {
      call.on('stream', (remoteStream: MediaStream) => {
        console.log('🎥 Received stream from:', peerId);
        this.remoteStreams.set(peerId, remoteStream);
        this.updateRemoteStreams();
      });

      call.on('close', () => {
        console.log(`📴 Remote peer ${peerId} disconnected`);
        this.removeRemoteStream(peerId);
      });
    }
  }

  updateRemoteStreams() {
    const remoteVideoContainer = document.querySelector('.remote-video-container');
  
    if (!remoteVideoContainer) {
      console.error('🚫 Remote video container not found!');
      return;
    }
  
    remoteVideoContainer.innerHTML = '';
  
    const roomUsers: RoomUser[] = (window as any).roomUsers || [];
    this.remoteStreams.forEach((stream, peerId) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'remote-video-wrapper';
      wrapper.style.position = 'relative'; 
      wrapper.style.display = 'inline-block';
      wrapper.style.margin = '5px';
      wrapper.style.width = '320px';
      wrapper.style.height = '180px';
      wrapper.style.overflow = 'hidden'; 
      wrapper.setAttribute('data-peer-id', peerId);
    
      const videoElement = document.createElement('video');
      videoElement.autoplay = true;
      videoElement.playsInline = true;
      videoElement.muted = true;
      videoElement.srcObject = stream;
      videoElement.style.width = '100%';
      videoElement.style.height = '100%';
    
      // Default use peerId first
      let username = peerId;
    
      // Request backend to get username each time
      this.http.get<any>(`http://localhost:3000/api/getUsernameByPeerId/${peerId}`, {
        headers: this.getAuthHeaders()
      }).subscribe(res => {
        console.log(res.username)
        username = res.username || peerId;
        label.textContent = username;
        label.title = username;
      });
    
      const label = document.createElement('div');
      label.textContent = username;
      label.style.position = 'absolute';
      label.style.bottom = '0';           // ✅ Stick to the bottom of the video
      label.style.left = '0';
      label.style.right = '0';            // ✅ Stretch horizontally
      label.style.background = 'rgba(0,0,0,0.6)';
      label.style.color = 'white';
      label.style.padding = '2px 6px';
      label.style.borderRadius = '0 0 8px 8px'; // ✅ Match rounded corners with video
      label.style.fontSize = '12px';
      label.style.textAlign = 'center';   // ✅ Center text
    
      wrapper.appendChild(videoElement);
      wrapper.appendChild(label);
      remoteVideoContainer.appendChild(wrapper);
    });
    
  }
  

  removeRemoteStream(peerId: string) {
    this.remoteStreams.delete(peerId);

    const remoteVideoContainer = document.querySelector('.remote-video-container');
    if (!remoteVideoContainer) return;

    const wrapper = remoteVideoContainer.querySelector(`div[data-peer-id="${peerId}"]`);
    if (wrapper) remoteVideoContainer.removeChild(wrapper);
  }

  setupLocalStream(): Promise<void> {
    return new Promise((resolve, reject) => {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
          this.localStream = stream;
          const localVideo = document.getElementById('localVideo') as HTMLVideoElement;
          localVideo.srcObject = stream;
          resolve();
        })
        .catch((err) => {
          console.error('🎤 Failed to access media devices:', err);
          reject(err);
        });
    });
  }

  setupLocalMP4Stream(): Promise<void> {
    return new Promise((resolve, reject) => {
      const videoElement = document.createElement('video');
      videoElement.src = 'assets/videos/1.mp4';
      videoElement.autoplay = true;
      videoElement.loop = true;

      videoElement.onloadedmetadata = () => {
        const mediaStream = (videoElement as any).captureStream();
        this.localStream = mediaStream;

        const localVideo = document.getElementById('localVideo') as HTMLVideoElement;
        if (localVideo) {
          localVideo.srcObject = mediaStream;
          resolve();
        } else {
          reject(new Error('Local video element not found'));
        }
      };

      videoElement.onerror = (err) => reject(err);
    });
  }

  getPeerIdsInChannel(channelId: string | null): Promise<RoomUser[]> {
    const headers = this.getAuthHeaders();
  
    return this.http
      .get<RoomUser[]>(`http://localhost:3000/api/channels/getPeerIds/${channelId}`, { headers })
      .toPromise()
      .then((users) => {
        // Directly returns array, no need for `.users`
        (window as any).roomUsers = users || [];
        return users || [];
      })
      .catch((error) => {
        console.error('🔎 Failed to get peer IDs:', error);
        return [];
      });
  }

  uploadPeerId(channelId: string) {
    const headers = this.getAuthHeaders();
    this.sockId = this.chatService.getSocketId();

    this.currentChannelId = channelId;
    this.http.post<any>('http://localhost:3000/api/channels/uploadPeerId', {
      channelId,
      peerId: this.peerId,
      socketId: this.sockId,
    }, { headers })
    .subscribe((res) => {
      console.log('✅ Peer ID uploaded:', res);
      (window as any).roomUsers = res.users || [];
    });
  }

  notifyServerUserLeft(channelId: string) {
    const headers = this.getAuthHeaders();
    this.closeConnection();

    return this.http.post('http://localhost:3000/api/channels/userLeftPeer', {
      channelId,
      peerId: this.peerId
    }, { headers }).subscribe((response) => {
      console.log('📤 Notified server user left:', response);
    });
  }

  closeConnection() {
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      const localVideo = document.getElementById('localVideo') as HTMLVideoElement;
      if (localVideo) localVideo.srcObject = null;
      this.localStream = null;
    }

    this.remoteStreams.forEach((_, peerId) => this.removeRemoteStream(peerId));
    this.remoteStreams.clear();
  }
}
