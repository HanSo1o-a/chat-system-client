// src/app/services/group.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root',
})
export class GroupService {
  private apiUrl = 'http://localhost:3000/api/groups';

  constructor(private http: HttpClient) {}

  // Get Authorization headers
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
    });
  }

  // Get Token
  getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }

  // Get user role from the token
  getUserRole(): string | null {
    const token = this.getAuthToken();
    if (token) {
      const decodedToken: any = jwtDecode(token);  // Decode the JWT Token
      return decodedToken?.role || null;  // Return the role field
    }
    return null;
  }

  // Get all groups
  getAllGroups(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/all`, { headers });
  }

  // Get groups managed by admin
  getAdminGroups(userId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/admin/${userId}`, { headers });
  }

  // Create a new group
  createGroup(groupData: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/create`, groupData, { headers });
  }

  // Delete a group
  deleteGroup(groupId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.apiUrl}/delete/${groupId}`, { headers });
  }

  // Add member to a group
  addMemberToGroup(groupId: string, userId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/add-member`, { groupId, userId }, { headers });
  }

  // Add admin to a group
  addAdminToGroup(groupId: string, userId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/add-admin`, { groupId, userId }, { headers });
  }

  // Remove member from a group
  removeMemberFromGroup(groupId: string, userId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/remove-member`, { groupId, userId }, { headers });
  }

  // Remove admin from a group
  removeAdminFromGroup(groupId: string, userId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/remove-admin`, { groupId, userId }, { headers });
  }
    // Delete channel from a specific group
    deleteChannelFromGroup(groupId: string, channelId: string): Observable<any> {
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      });
  
      return this.http.post<any>(`${this.apiUrl}/delete-channel`, { groupId, channelId }, { headers });
    }
}
