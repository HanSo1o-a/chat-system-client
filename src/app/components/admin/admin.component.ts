// src/app/components/admin/admin.component.ts
import { Component, OnInit } from '@angular/core';
import { AdminService } from '../services/admin.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common'; 
import { GroupService } from '../services/group.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
  imports: [FormsModule, CommonModule],
})
export class AdminComponent {
  channels: any[] = [];
  users: any[] = [];
  groups: any[] = []; // Stores information of all groups
  groupName: string = '';
  groupDescription: string = '';
  adminIds: string[] = [];  // Stores an array of admin IDs

  selectedUserIdForAdmin: { [channelId: string]: string } = {}; // Dynamic selection for admin
  selectedUserIdForMember: { [channelId: string]: string } = {}; // Dynamic selection for members
  selectedMemberToRemove: { [channelId: string]: string } = {};  // For removing member
  selectedAdminToRemove: { [channelId: string]: string } = {};    // For removing admin
  searchQuery: string = '';  // Search query for filtering groups
  selectedUserIdForAdminForGroup: { [groupId: string]: string } = {};  // Dynamic selection for admin in groups
  selectedUserIdForMemberForGroup: { [groupId: string]: string } = {};  // Dynamic selection for members in groups
  selectedMemberToRemoveForGroup: { [groupId: string]: string } = {};  // For removing member from group
  selectedAdminToRemoveForGroup: { [groupId: string]: string } = {};    // For removing admin from group

  selectedGroupId : string = '';
  channelName: string = '';
  channelDescription: string = '';
  errorMessage: string = '';
  successMessage: string = '';
  currentUserId = '';
  userRole: string = '';
  constructor(private adminService: AdminService, private router: Router, private groupService: GroupService) {}

  ngOnInit() {
    
    this.getChannels();
    this.getUsers();  // Get all users
    this.userRole = this.adminService.getUserRole() || 'user'; 
    this.currentUserId = this.adminService.getCurrentUserId() || '';    // Get current user's ID
    this.GetloadGroups();

  }

// Get all groups
  GetloadGroups() {
    if (this.userRole === 'superadmin') {
      // Superadmins can view all groups
      this.loadGroups();
    } else if (this.userRole === 'admin') {
      // Regular admins can only view the groups they manage
      this.loadAdminGroups();
    }
    console.log(this.groups)
  }
  filteredGroups() {
    return this.groups.filter(group =>
      group.name.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }
  // Get all channels
  getChannels() {
    this.adminService.getChannels().subscribe(
      (response) => {
        this.channels = response;
        console.log('this.channels',this.channels)
      },
      (error) => {
        this.errorMessage = 'Error fetching channels';
        console.error(error);
      }
    );
  }

  // Get all users
  getUsers() {
    this.adminService.getUsers().subscribe(
      (response) => {
        this.users = response;
        console.log(this.users)
      },
      (error) => {
        this.errorMessage = 'Error fetching users';
        console.error(error);
      }
    );
  }

  createChannel() {
    if (this.channelName && this.channelDescription && this.selectedGroupId) {
      const newChannel = {
        name: this.channelName,
        description: this.channelDescription,
        groupId: this.selectedGroupId // Pass the selected group ID
      };
  
      this.adminService.createChannel(this.channelName, this.channelDescription, this.selectedGroupId).subscribe(
        (response) => {
          this.successMessage = 'Channel created successfully!';
          this.getChannels();  // Refresh channel list
          this.GetloadGroups();
        },
        (error) => {
          this.errorMessage = 'Error creating channel';
          console.error(error);
        }
      );
    } else {
      this.errorMessage = 'Please fill in all fields including selecting a group';
    }
  }
  

  joinChannel(channelId: string) {
    this.router.navigate([`/chat`]);  // Navigate to the chat page of this channel
  }

  // Add admin to channel
  addAdminToChannel(channelId: string, userId: string) {
    if (!userId) {
      this.errorMessage = 'Please select a user to add as admin';
      return;
    }
   
    this.adminService.addChannelAdmin(channelId, userId).subscribe(
      (response) => {
        this.successMessage = 'User added as channel admin';
         this.getChannels();
      },
      (error) => {
        this.errorMessage = 'Error adding admin to channel';
        console.error(error);
      }
    );
  }

  // Add member to channel
  addMemberToChannel(channelId: string, userId: string) {
    if (!userId) {
      this.errorMessage = 'Please select a user to add as member';
      return;
    }
   
    this.adminService.addChannelMember(channelId, userId).subscribe(
      (response) => {
        this.successMessage = 'User added to channel';
        this.getChannels();
      },
      (error) => {
        this.errorMessage = 'Error adding member to channel';
        console.error(error);
      }
    );
  }

  navigateToChat() {
    this.router.navigate(['/chat']);  // Assuming your chat page is at '/chat'
  }

  // Update user role
  changeUserRole(userId: string, newRole: string) {
    this.adminService.updateUserRole(userId, newRole).subscribe(
      (response) => {
        this.successMessage = `User role updated to ${newRole} successfully!`;
        this.getUsers();  // Refresh user list
      },
      (error) => {
        this.errorMessage = 'Error updating user role';
        console.error(error);
      }
    );
  }

  // Remove member from channel
  removeMemberFromChannel(channelId: string, userId: string) {
    console.log(this.selectedMemberToRemove, userId);
    this.adminService.removeChannelMember(channelId, userId).subscribe(
      (response) => {
        this.successMessage = 'User removed from channel';
        this.getChannels(); 
      },
      (error) => {
        this.errorMessage = 'Error removing member from channel';
        console.error(error);
      }
    );
  }

  // Remove admin from channel
  removeAdminFromChannel(channelId: string, userId: string) {
    this.adminService.removeChannelAdmin(channelId, userId).subscribe(
      (response) => {
        this.successMessage = 'User removed as channel admin';
        this.getChannels(); // Refresh the channel list
      },
      (error) => {
        this.errorMessage = 'Error removing admin from channel';
        console.error(error);
      }
    );
  }
    
  deleteChannel(channelId: string) {
    this.adminService.deleteChannel(channelId).subscribe(
      (response) => {
        this.successMessage = 'Channel deleted successfully!';
        this.getChannels();  // Refresh channel list
      },
      (error) => {
        this.errorMessage = 'Error deleting channel';
        console.error(error);
      }
    );
  }

  filterUsers(channel: any, type: 'admin' | 'member') {
    // Get current user's ID (can be obtained from authentication service)
    const currentUserId = this.adminService.getCurrentUserId();  // You can implement this method or get the current user ID from auth service
    
    // Filter out users who are already admins or members
    const usersAlreadyInChannel = type === 'admin' ? channel.admins : channel.members;
    
    return this.users.filter((user: { _id: string }) => 
      !usersAlreadyInChannel.some((u: { _id: string }) => u._id === user._id) && user._id !== currentUserId
    );
  }

  // Filter available users for admin or member roles in a channel
  filterAvailableUsers(channel: any, type: 'admin' | 'member') {
    const currentUserId = this.adminService.getCurrentUserId();
    const usersAlreadyInChannel = type === 'admin' ? channel.admins : channel.members;

    return this.users.filter((user: { _id: string }) => 
      !usersAlreadyInChannel.some((u: { _id: string }) => u._id === user._id) && user._id !== currentUserId
    );
  }

  filterAvailableGroupUsers(group: any, type: 'admin' | 'member') {
    const currentUserId = this.adminService.getCurrentUserId();

  
    // 确保排除 null 或 undefined 的值
    let usersAlreadyInGroup = type === 'admin' ? group.admins : group.members;
 
    // Exclude admins when adding members
    if (type === 'member') {
      usersAlreadyInGroup = usersAlreadyInGroup.concat(group.admins); // Add admins to the list of already selected users
    }

  
    return this.users.filter((user: any) => 
      // Exclude users already in the group (admins and members), and current user
      user && !usersAlreadyInGroup.some((u: { username: string }) => u.username === user.username) && user.username !== currentUserId
    );
  }
  
// Get users already in the channel (excluding current user)
filterUsersInChannel(channel: any, type: 'admin' | 'member') {
  const currentUserId = this.adminService.getCurrentUserId();

  const usersInChannel = type === 'admin' ? channel.admins : channel.members;

  // Ensure that we don't include null or undefined users
  return usersInChannel.filter((user: { _id: string }) => user && user._id !== currentUserId);
}

  loadGroups() {
    this.groupService.getAllGroups().subscribe((groups: any[]) => {
      this.groups = groups;
      console.log("Groups loaded:", this.groups);
    });
  }

  // Get groups managed by admin
  loadAdminGroups() {
    this.groupService.getAdminGroups(this.currentUserId).subscribe(groups => {
      this.groups = groups;
      console.log("Admin Groups Loaded:", this.groups);  // Verify that admin groups are loaded correctly
    });
  }

  // Create group
  createGroup() {
    const newGroup = {
      name: this.groupName,
      description: this.groupDescription,
      adminIds: this.adminIds,  // Admin IDs
    };

    this.groupService.createGroup(newGroup).subscribe(response => {
      if (response.success) {
        this.groups.push(response.group);
        this.groupName = '';
        this.groupDescription = '';
        this.adminIds = [];
      } else {
        alert('Group creation failed');
      }
    });
  }

  // Delete group (Superadmin only)
  deleteGroup(groupId: string) {
    this.groupService.deleteGroup(groupId).subscribe(response => {
      if (response.success) {
        this.groups = this.groups.filter(group => group.id !== groupId);
      } else {
        alert('Failed to delete group');
      }
    });
  }

  // Add member to group
  addMember(groupId: string, userId: string) {
    this.groupService.addMemberToGroup(groupId, userId).subscribe(response => {
      if (response.success) {
        alert('Member added');
        this.loadGroups();
      } else {
        alert('Failed to add member');
      }
    });
  }

  // Add admin to group
  addAdmin(groupId: string, userId: string) {
    this.groupService.addAdminToGroup(groupId, userId).subscribe(response => {
      if (response.success) {
        alert('Admin added');
        this.loadGroups();
      } else {
        alert('Failed to add admin');
      }
    });
  }

  // Remove member
  removeMember(groupId: string, userId: string) {
    this.groupService.removeMemberFromGroup(groupId, userId).subscribe(response => {
      if (response.success) {
        alert('Member removed');
        this.loadGroups();
      } else {
        alert('Failed to remove member');
      }
    });
  }

  // Remove admin
  removeAdmin(groupId: string, userId: string) {
    this.groupService.removeAdminFromGroup(groupId, userId).subscribe(response => {
      if (response.success) {
        alert('Admin removed');
        this.loadGroups();
      } else {
        alert('Failed to remove admin');
      }
    });
  }
// Delete channel from group
deleteChannelFromGroup(groupId: string, channelId: string) {
  this.groupService.deleteChannelFromGroup(groupId, channelId).subscribe(
    (response) => {
      if (response.success) {
        // Find the group and remove the channel
        this.GetloadGroups();
      } else {
        console.error('Failed to delete channel');
      }
    },
    (error) => {
      console.error('Error deleting channel:', error);
    }
  );
}

}
