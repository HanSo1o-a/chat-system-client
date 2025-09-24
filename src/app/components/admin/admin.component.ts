import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { AdminService } from '../services/admin.service';
import { GroupService } from '../services/group.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
  imports: [FormsModule, CommonModule],
})
export class AdminComponent implements OnInit {
  users: any[] = [];
  groups: any[] = [];

  // Group fields
  groupName: string = '';
  groupDescription: string = '';
  adminIds: string[] = [];

  // Channel fields (attached to group)
  channelName: { [groupId: string]: string } = {};
  channelDescription: { [groupId: string]: string } = {};

  // User selections
  selectedUserIdForAdminForGroup: { [groupId: string]: string } = {};
  selectedUserIdForMemberForGroup: { [groupId: string]: string } = {};
  selectedMemberToRemoveForGroup: { [groupId: string]: string } = {};
  selectedAdminToRemoveForGroup: { [groupId: string]: string } = {};

  // Current user
  currentUserId: string = '';
  userRole: string = '';

  // Message alerts
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private adminService: AdminService,
    private groupService: GroupService,
    private router: Router
  ) {}

  ngOnInit() {
    this.userRole = this.adminService.getUserRole() || 'user';
    this.currentUserId = this.adminService.getCurrentUserId() || '';

    this.getUsers();

    if (this.userRole === 'superadmin') {
      this.loadGroups();
    } else if (this.userRole === 'admin') {
      this.loadAdminGroups();
    }
  }

  /** ================= Group related ================= **/

  loadGroups() {
    this.groupService.getAllGroups().subscribe({
      next: (groups: any[]) => (this.groups = groups),
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Error loading groups';
      },
    });
  }

  loadAdminGroups() {
    this.groupService.getAdminGroups(this.currentUserId).subscribe({
      next: (groups: any[]) => (this.groups = groups),
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Error loading admin groups';
      },
    });
  }

  createGroup() {
    if (!this.groupName.trim()) {
      this.errorMessage = 'Group name cannot be empty';
      return;
    }

    const newGroup = {
      name: this.groupName,
      description: this.groupDescription,
      adminIds: this.adminIds,
    };

    this.groupService.createGroup(newGroup).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.successMessage = 'Group created successfully!';
          this.loadGroups();
          this.groupName = '';
          this.groupDescription = '';
          this.adminIds = [];
        } else {
          this.errorMessage = 'Group creation failed';
        }
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Error creating group';
      },
    });
  }

  deleteGroup(groupId: string) {
    this.groupService.deleteGroup(groupId).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.successMessage = 'Group deleted';
          this.groups = this.groups.filter((g) => g._id !== groupId);
        } else {
          this.errorMessage = 'Failed to delete group';
        }
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Error deleting group';
      },
    });
  }

  canManageGroup(group: any): boolean {
    return (
      this.userRole === 'superadmin' ||
      (group.admins && group.admins.some((a: any) => a._id === this.currentUserId))
    );
  }

  /** ================= Channel related (attached to group) ================= **/

  createChannel(groupId: string) {
    const name = this.channelName[groupId];
    const desc = this.channelDescription[groupId];

    if (!name || !desc) {
      this.errorMessage = 'Channel name/description required';
      return;
    }

    this.groupService.createChannel(groupId, { name, description: desc }).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.successMessage = 'Channel created!';
          this.loadGroups();
          this.channelName[groupId] = '';
          this.channelDescription[groupId] = '';
        } else {
          this.errorMessage = 'Channel creation failed';
        }
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Error creating channel';
      },
    });
  }

  deleteChannel(groupId: string, channelId: string) {
    this.groupService.deleteChannel(groupId, channelId).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.successMessage = 'Channel deleted';
          this.loadGroups();
        } else {
          this.errorMessage = 'Failed to delete channel';
        }
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Error deleting channel';
      },
    });
  }

  /** ================= User Management ================= **/

  getUsers() {
    this.adminService.getUsers().subscribe({
      next: (response) => (this.users = response),
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Error fetching users';
      },
    });
  }

  changeUserRole(userId: string, newRole: string) {
    this.adminService.updateUserRole(userId, newRole).subscribe({
      next: () => {
        this.successMessage = `User role updated to ${newRole}`;
        this.getUsers();
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Error updating user role';
      },
    });
  }

  /** ================= Group member/admin management ================= **/

  addMember(groupId: string, userId: string) {
    this.groupService.addMemberToGroup(groupId, userId).subscribe((res) => {
      if (res.success) {
        this.successMessage = 'Member added';
        this.loadGroups();
      }
    });
  }

  addAdmin(groupId: string, userId: string) {
    this.groupService.addAdminToGroup(groupId, userId).subscribe((res) => {
      if (res.success) {
        this.successMessage = 'Admin added';
        this.loadGroups();
      }
    });
  }

  removeMember(groupId: string, userId: string) {
    this.groupService.removeMemberFromGroup(groupId, userId).subscribe((res) => {
      if (res.success) {
        this.successMessage = 'Member removed';
        this.loadGroups();
      }
    });
  }

  removeAdmin(groupId: string, userId: string) {
    this.groupService.removeAdminFromGroup(groupId, userId).subscribe((res) => {
      if (res.success) {
        this.successMessage = 'Admin removed';
        this.loadGroups();
      }
    });
  }

  filterAvailableGroupUsers(group: any, type: 'admin' | 'member') {
    const currentUserId = this.adminService.getCurrentUserId();
    let usersAlreadyInGroup =
      type === 'admin' ? group.admins : group.members;

    if (type === 'member') {
      usersAlreadyInGroup = usersAlreadyInGroup.concat(group.admins);
    }

    return this.users.filter(
      (user: any) =>
        !usersAlreadyInGroup.some((u: any) => u._id === user._id) &&
        user._id !== currentUserId
    );
  }
  filterRemovableAdmins(group: any) {
    return group.admins.filter((a: any) => a._id !== this.currentUserId);
  }
  
  filterRemovableMembers(group: any) {
    return group.members.filter((m: any) => m._id !== this.currentUserId);
  }
  get filteredUsers() {
    return this.users.filter(u => u._id !== this.currentUserId);
  }
  

  navigateToChat() {
    this.router.navigate(['/chat']);
  }
}
