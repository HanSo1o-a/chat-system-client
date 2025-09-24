import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
    });
  }

  getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }

  getUserRole(): string | null {
    const token = this.getAuthToken();
    if (token) {
      const decodedToken: any = jwtDecode(token);  // Decode the JWT Token
      return decodedToken?.role || null;  // Return the role field
    }
    return null;
  }

  getCurrentUserId(): string | null {
    const token = this.getAuthToken();
    if (token) {
      const decodedToken: any = jwtDecode(token);  // Decode the JWT Token
      return decodedToken?.username || null;  // Return the userId field
    }
    return null;
  }

  // Get all channels
  getChannels(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get('http://localhost:3000/api/admin', { headers });
  }

  // Create a new channel
 // Create a new channel, including groupId
createChannel(name: string, description: string, groupId: string): Observable<any> {
  const headers = this.getAuthHeaders();
  return this.http.post('http://localhost:3000/api/admin/create', 
    { name, description, groupId }, { headers });
}

  // Get all users
  getUsers(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get('http://localhost:3000/api/admin/users', { headers }); // Modify API path
  }

  // Update user role
  updateUserRole(userId: string, newRole: string): Observable<any> {
    const headers = this.getAuthHeaders();
    console.log(userId, newRole)
    return this.http.post('http://localhost:3000/api/admin/update-role', { userId, newRole }, { headers });
  }

  // Add admin to channel
  addChannelAdmin(channelId: string, userId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post('http://localhost:3000/api/admin/add-admin', { channelId, userId }, { headers });
  }

  // Add member to channel
  addChannelMember(channelId: string, userId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post('http://localhost:3000/api/admin/add-member', { channelId, userId }, { headers });
  }

  // Remove member from channel
  removeChannelMember(channelId: string, userId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post('http://localhost:3000/api/admin/remove-member', { channelId, userId }, { headers });
  }

  // Remove admin from channel
  removeChannelAdmin(channelId: string, userId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>('http://localhost:3000/api/admin/remove-admin', { channelId, userId }, { headers });
  }

  // Delete channel
  deleteChannel(channelId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    console.log(channelId)
    return this.http.post<any>('http://localhost:3000/api/admin/channels/delete', { channelId }, { headers });
  }
}
