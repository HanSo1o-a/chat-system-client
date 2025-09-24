import { Injectable } from '@angular/core';
import Peer from 'peerjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ChatComponent } from '../../components/chat/chat.component'; 
import { VideoChatService } from '../services/video-chat.service';  // Import VideoChatService

@Injectable({
  providedIn: 'root'
})
export class PeerService {
  peer: any;
  localStream: any;
  remoteStream: any;
  peerId: string | null = null;
  remoteStreams: MediaStream[] = [];

  constructor(private http: HttpClient, private videoChatService: VideoChatService) {}

  // Get Authorization headers
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }
  
  // Initialize Peer connection
  initializePeerConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Assume this is where the Peer connection is initialized
      this.peer = new Peer({
        host: 'localhost',
        port: 9000,
        path: '/peerjs',
        secure: false
      });

      this.peer.on('call', (call: any) => {
        console.log('Incoming call from peer:', call.peer);
        this.onIncomingCall(call);  // Accept incoming call and process
      });
  
      this.peer.on('open', (id: string) => {
        this.peerId = id;
        console.log('Peer connected with ID:', id);
        resolve();  // Call resolve once initialization is complete
      });
  
      this.peer.on('error', (err: any) => {
        console.error('Peer connection error:', err);
        reject(err);  // Call reject if an error occurs
      });
    });
  }

  // Play and pass MP4 file as stream
  setupLocalMP4Stream(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Create video element
      const videoElement = document.createElement('video');
      videoElement.src = 'assets/videos/1.mp4';  // Your video file path
      videoElement.autoplay = true;
      videoElement.loop = true;  // Loop the video

      // Wait for video metadata to load
      videoElement.onloadedmetadata = () => {
        // Create a new MediaStream
        const mediaStream = (videoElement as any).captureStream();

        // Add video track to the MediaStream
        this.localStream = mediaStream;
        // Bind the local stream to the video element on the page
        const localVideo = document.getElementById('localVideo') as HTMLVideoElement;
        if (localVideo) {
          // Bind the local stream to the video element on the page
          localVideo.srcObject = this.localStream;
          resolve();  // Stream setup completed, call resolve
        } else {
          console.error('Local video element not found');
          reject(new Error('Local video element not found'));
        }
      };

      // Error handling
      videoElement.onerror = (err) => {
        console.error('Error loading MP4 file:', err);
        reject(err);
      };
    });
  }

  // Answer incoming call
  onIncomingCall(call: any) {
    this.videoChatService.setVideoChatStatus(true);

    call.answer(this.localStream);
    call.on('stream', (remoteStream: any) => {
      // Update the remoteStreams array, ensuring each remote stream is stored
      this.remoteStreams.push(remoteStream);
    });
    this.updateRemoteStreams();
  }

  // Update remote video streams
  updateRemoteStreams() {
    setTimeout(() => {
      const remoteVideoContainer = document.querySelector('.remote-video-container');

      if (remoteVideoContainer) {  
        this.remoteStreams.forEach((remoteStream) => {
          const videoElement = document.createElement('video');
          videoElement.autoplay = true;
          videoElement.muted = true;  // Prevent echoing of remote video
          videoElement.srcObject = remoteStream;
          videoElement.style.width = '48%';
          videoElement.style.marginBottom = '10px';
          videoElement.style.borderRadius = '8px';
          videoElement.style.border = '2px solid #ddd';
          remoteVideoContainer.appendChild(videoElement);
        });
      } else {
        console.error('Remote video container not found!');
      }
    }, 1); // Delay execution to ensure DOM is rendered
  }

  // Call a peer
  callPeer(peerId: string) {
    // Ensure the Peer instance is initialized and peerId is valid
    if (!this.peer || !this.peerId) {
      console.error('Peer instance not initialized or no peerId');
      return;
    }

    if (!peerId) {
      console.log('No other peer found. You are the only one in the room.');
      return;  // Do not initiate a video call if no other user is present
    }

    console.log('peerId', peerId);

    const call = this.peer.call(peerId, this.localStream);

    if (call) {
      call.on('stream', (remoteStream: any) => {
        console.log('Received remote stream from peer:', peerId);

        // Add the new remoteStream to the remote video stream array
        this.remoteStreams.push(remoteStream);
        
        // Update remote video container to display all remote streams
        this.updateRemoteStreams();
      });
    } else {
      console.error('Failed to initiate call');
    }
  }

  // Get list of peerIds in the current channel
  getPeerIdsInChannel(channelId: string): Promise<string[]> {
    const headers = this.getAuthHeaders(); // Get auth headers
  
    // Request all peerIds in the current room from the backend
    return this.http.get<string[]>(`http://localhost:3000/api/channels/getPeerIds/${channelId}`, { headers })
      .toPromise()  // Use Promise to handle asynchronous operation
      .then((peerIds: string[] | undefined) => {  // Explicitly specify peerIds type as string[] | undefined
        return peerIds || [];  // Return an empty array if peerIds is undefined
      })
      .catch(error => {
        console.error('Error fetching peer IDs:', error);
        return [];
      });
  }

  // Upload peerId to the server (only send authentication info, backend automatically parses)
  uploadPeerId(channelId: string) {
    const headers = this.getAuthHeaders(); // Custom method to get auth headers

    // Send request to the backend, where the backend parses the auth header and stores peerId
    return this.http.post('http://localhost:3000/api/channels/uploadPeerId', { 
      channelId: channelId,  // Pass channelId 
      peerId: this.peerId     // Pass peerId
    },  { headers })
      .subscribe(response => {
        console.log('Peer ID uploaded to server:', response);
      });
  }

  // Get local video stream
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
          console.error('Error accessing media devices.', err);
          reject(err); 
        });
    });
  }

  // Notify server that user has left the room
  notifyServerUserLeft(channelId: string) {
    const headers = this.getAuthHeaders();
    this.closeConnection();
   // Send request to the backend to notify that the user left the room
   return this.http.post('http://localhost:3000/api/channels/userLeftPeer', {  channelId: channelId,  // Pass channelId 
    peerId: this.peerId  
   }, { headers })
   .subscribe(response => {
     console.log('Server notified that user left the room:', response);
   });
  }

  // Close the connection
  closeConnection() {
    if (this.peer) {
      // Only destroy the peer instance
      this.peer.destroy();  // Destroy Peer instance to ensure all connections are closed
      this.peer = null;  // Clear peer object
    }

    // Stop all tracks in the local stream
    if (this.localStream) {
      const tracks = this.localStream.getTracks();
      tracks.forEach((track: MediaStreamTrack) => track.stop());  // Stop each track
      (document.getElementById('localVideo') as HTMLVideoElement).srcObject = null;  // Clear video source
      this.localStream = null;  // Clear local stream object
    }

    // Stop all tracks in the remote stream
    if (this.remoteStream) {
      const tracks = this.remoteStream.getTracks();
      tracks.forEach((track: MediaStreamTrack) => track.stop());  // Stop each track
      (document.getElementById('remote-video-container') as HTMLVideoElement).srcObject = null;  // Clear video source
      this.remoteStream = null;  // Clear remote stream object
    }
  }
}
