import { Injectable } from '@angular/core'; 
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { jwtDecode } from 'jwt-decode';

interface UploadResponse {
  success: boolean;
  fileUrl: string;
}

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

  // Get token
  getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }

  // Decode user role from token
  getUserRole(): string | null {
    const token = this.getAuthToken();
    if (token) {
      const decodedToken: any = jwtDecode(token);  
      return decodedToken?.role || null;  
    }
    return null;
  }

  // Decode user ID from token
  getUserId(): string | null {
    const token = this.getAuthToken();
    if (token) {
      const decodedToken: any = jwtDecode(token);  
      return decodedToken?.userId || null;
    }
    return null;
  }

  // =============================
  // 🔹 Channels (old logic, may be deprecated)
  // =============================
  getChannels(): Observable<any> {
    const headers = this.getAuthHeaders();
    const role = this.getUserRole(); 
    const userId = this.getUserId();  

    if (!role || !userId) {
      return this.http.get('http://localhost:3000/api/channels', {
        headers: headers.append('Role', 'user').append('UserId', '')
      });
    }

    return this.http.get('http://localhost:3000/api/channels', {
      headers: headers.append('Role', role).append('UserId', userId)
    });
  }

  // =============================
  // 🔹 Socket.IO
  // =============================

  connect(channelId: string): void {
    const username = localStorage.getItem('username') || 'Anonymous';  

    if (!this.socket) {
      this.socket = io('http://localhost:3001', {
        query: { username }  
      });
    }

    this.socket.emit('joinRoom', channelId);

  }
  
  getSocketId(): string | null {
    return this.socket?.id || null;
  }

  joinChannel(channelId: string): void {
    if (this.socket) {
      this.socket.emit('joinRoom', channelId);
    }
  }

  sendMessage(channelId: string, message: string): void {
    const username = localStorage.getItem('username') || 'Anonymous';
    const userId = this.getUserId();  

    const payload = {
      username,
      content: message,
      userId   
    };

    if (this.socket) {
      this.socket.emit('sendMessage', channelId, payload);
    }
  }

  receiveMessage(): Observable<any> {
    return new Observable<any>((observer) => {
      if (this.socket) {
        this.socket.on('receiveMessage', (message) => {
          observer.next(message);  
        });
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Create new channel
  createChannel(name: string, description: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>('http://localhost:3000/api/channels/create', 
      { name, description }, { headers });
  }
  

  // =============================
  // 🔹 File Upload
  // =============================

  uploadImage(image: File): Observable<UploadResponse> {
    const headers = this.getAuthHeaders();
    const username = localStorage.getItem('username') || 'Anonymous';
    const formData = new FormData();
    formData.append('image', image, image.name);
    formData.append('username', username);  

    return this.http.post<UploadResponse>('http://localhost:3000/api/channels/upload-image', formData, { headers });
  }

  uploadVideo(video: File): Observable<UploadResponse> {
    const headers = this.getAuthHeaders();
    const username = localStorage.getItem('username') || 'Anonymous';
    const formData = new FormData();
    formData.append('video', video, video.name);
    formData.append('username', username);  

    return this.http.post<UploadResponse>('http://localhost:3000/api/channels/upload-video', formData, { headers });
  }

  // =============================
  // 🔹 Group → Channel → Message
  // =============================

  getGroups(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>('http://localhost:3000/api/groups/all', { headers });
  }

  getGroupChannels(groupId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`http://localhost:3000/api/groups/${groupId}/channels`, { headers });
  }

  getChannelMessages(channelId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`http://localhost:3000/api/channels/${channelId}/messages`, { headers });
  }

  // User leaves group
  leaveGroup(groupId: string): Observable<any> {
    return this.http.post(
      `http://localhost:3000/api/groups/${groupId}/leave`,
      {},  
      { headers: this.getAuthHeaders() }
    );
  }

  // Admin leaves group management rights
  leaveGroupAdmin(groupId: string): Observable<any> {
    return this.http.post(
      `http://localhost:3000/api/groups/${groupId}/leaveAdmin`,
      {},  
      { headers: this.getAuthHeaders() }
    );
  }

}
