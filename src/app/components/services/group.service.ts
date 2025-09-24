import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  private apiUrl = 'http://localhost:3000/api/groups';
  constructor(private http: HttpClient) {}

  // ----- helpers -----
  private jsonHeaders(): { headers: HttpHeaders } {
    const token = localStorage.getItem('authToken') || '';
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : ''
    });
    return { headers };
  }

  // ==================
  // Group endpoints
  // ==================

  // Get all groups (superadmin)
  getAllGroups(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/all`, this.jsonHeaders());
  }

  // Get groups managed by an admin
  getAdminGroups(adminId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/admin/${adminId}`, this.jsonHeaders());
  }

  // Create a group
  createGroup(groupData: { name: string; description?: string; adminIds?: string[] }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/create`, groupData, this.jsonHeaders());
  }

  // Delete a group
  deleteGroup(groupId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/delete/${groupId}`, this.jsonHeaders());
  }

  // ==================
  // Group members / admins
  // ==================

  addMemberToGroup(groupId: string, userId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/add-member`, { groupId, userId }, this.jsonHeaders());
  }

  removeMemberFromGroup(groupId: string, userId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/remove-member`, { groupId, userId }, this.jsonHeaders());
  }

  addAdminToGroup(groupId: string, userId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/add-admin`, { groupId, userId }, this.jsonHeaders());
  }

  removeAdminFromGroup(groupId: string, userId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/remove-admin`, { groupId, userId }, this.jsonHeaders());
  }

  createChannel(
    groupId: string,
    channelData: { name: string; description?: string; adminIds?: string[]; memberIds?: string[] }
  ): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/${groupId}/channels/create`,
      channelData,
      this.jsonHeaders()
    );
  }

  deleteChannel(groupId: string, channelId: string): Observable<any> {
    return this.http.delete<any>(
      `${this.apiUrl}/${groupId}/channels/delete/${channelId}`,
      this.jsonHeaders()
    );
  }
  
  getGroupChannels(groupId: string): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/${groupId}/channels`,
      this.jsonHeaders()
    );
  }
}
