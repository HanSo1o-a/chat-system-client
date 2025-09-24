import { Injectable } from '@angular/core'; 
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private socket: Socket | null = null;

  constructor(private http: HttpClient) {}

  // Get Authorization headers
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  // Get Token
  getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }
  getUsername(): string | null {
    return localStorage.getItem('username');
  }
  
  // Get user role from token
  getUserRole(): string | null {
    const token = this.getAuthToken();
    if (token) {
      const decodedToken: any = jwtDecode(token);  // Decode JWT Token
      return decodedToken?.role || null;  // Return the role field
    }
    return null;
  }

  // Get current user ID from token
  getUserId(): string | null {
    const token = this.getAuthToken();
    if (token) {
      const decodedToken: any = jwtDecode(token);  // Decode JWT Token
      return decodedToken?.userId || null;
    }
    return null;
  }

  // Get all channels
  getChannels(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get('http://localhost:3000/api/channels', { headers });
  }

  // Connect to the channel
  connect(channelId: string): void {
    const username = localStorage.getItem('username') || 'Anonymous';  // Get username, can be from localStorage or other sources

    if (!this.socket) {
      this.socket = io('http://localhost:3001', {
        query: { username: username }  // Pass the username via query
      });
    }

    // Join the specified channel
    this.socket.emit('joinRoom', channelId);
  }

  // Join the chat room
  joinChannel(channelId: string): void {
    if (this.socket) {
      this.socket.emit('joinRoom', channelId);  // Send request to join the room
    }
  }

  // Create new channel
  createChannel(name: string, description: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>('http://localhost:3000/api/channels/create', 
      { name, description }, { headers });
  }

  // Send message to server
  sendMessage(channelId: string, message: string): void {
    const username = localStorage.getItem('username') || 'Anonymous'; // Get the user's name from localStorage
    const payload = { username, content: message };  // Include username with the message content
  
    if (this.socket) {
      this.socket.emit('sendMessage', channelId, payload);  // Send both username and message content
    }
  }

  // Receive message (including speaker's name)
  receiveMessage(): Observable<any> {
    return new Observable<any>((observer) => {
      if (this.socket) {
        this.socket.on('receiveMessage', (message) => {
          observer.next(message);  // Return the message object, including username and content
        });
      }
    });
  }

  // Disconnect Socket connection
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Upload image with username
  uploadImage(image: File): Observable<any> {
    const headers = this.getAuthHeaders();
    const username = localStorage.getItem('username') || 'Anonymous';
    const formData = new FormData();
    formData.append('image', image, image.name);
    formData.append('username', username);  // Add username to the request

    return this.http.post<{ success: boolean, fileUrl: string }>('http://localhost:3000/api/channels/upload-image', formData, { headers });
  }

  // Upload video with username
  uploadVideo(video: File): Observable<any> {
    const headers = this.getAuthHeaders();
    const username = localStorage.getItem('username') || 'Anonymous';
    const formData = new FormData();
    formData.append('video', video, video.name);
    formData.append('username', username);  // Add username to the request

    return this.http.post<{ success: boolean, fileUrl: string }>('http://localhost:3000/api/channels/upload-video', formData, { headers });
  }

  

}
